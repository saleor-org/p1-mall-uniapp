<template>
  <view class="pickup-store-widget">
    <view v-if="state.loading" class="tip">正在获取定位…</view>
    <view v-else-if="state.error" class="tip error">
      <text>{{ state.error }}</text>
      <button class="btn ghost" size="mini" @tap="refresh">重新定位</button>
    </view>
    <view v-else>
      <view class="loc-row">
        <text class="loc-label">当前位置</text>
        <view class="loc-main">
          <text class="loc-value">{{ state.locationAddress || state.locationText }}</text>
          <text v-if="state.locationAddress" class="loc-coords">{{ state.locationText }}</text>
        </view>
        <button class="btn ghost" size="mini" @tap="refresh">刷新</button>
      </view>

      <view class="eat-type-row">
        <text class="eat-type-label">就餐方式</text>
        <view class="eat-type-options">
          <view
            v-for="opt in EAT_TYPE_OPTIONS"
            :key="opt.value"
            class="eat-type-item"
            :class="{ active: state.eatType === opt.value }"
            @tap="selectEatType(opt)"
          >
            {{ opt.label }}
          </view>
        </view>
      </view>

      <view v-if="!state.stores.length" class="tip">附近暂无{{ state.brandLabel }}门店，请扩大范围或稍后重试</view>

      <scroll-view v-else scroll-y class="store-list">
        <view
          v-for="item in state.stores"
          :key="item.code"
          class="store-item"
          :class="{ active: state.selected?.code === item.code }"
          @tap="selectStore(item)"
        >
          <view class="store-head">
            <text class="store-name">{{ item.name }}</text>
            <text v-if="item.distanceText" class="store-distance">{{ item.distanceText }}</text>
          </view>
          <text class="store-address">{{ item.address }}</text>
          <text v-if="item.startTime && item.endTime" class="store-hours">
            营业 {{ item.startTime }} - {{ item.endTime }}
          </text>
        </view>
      </scroll-view>

      <view v-if="state.selected" class="selected-box">
        已选：{{ state.selected.name }} · {{ eatTypeLabel() }}
      </view>
    </view>
  </view>
</template>

<script setup>
  import { onMounted, reactive, watch } from 'vue';
  import PickupStoreApi from '@/sheep/api/trade/pickupStore';
  import { fieldProps } from '@/sheep/helper/productFormEngine';

  const props = defineProps({
    field: { type: Object, default: () => ({}) },
    modelValue: { type: [String, Object], default: '' },
  });

  const emits = defineEmits(['update:modelValue']);

  /** 与 mcd.mdl8.cn eat_type 一致，label 为 H5 展示文案 */
  const EAT_TYPE_OPTIONS = [
    { label: '打包带走', value: '店内自提' },
    { label: '店里就餐', value: '店内就餐' },
  ];
  const DEFAULT_EAT_TYPE = EAT_TYPE_OPTIONS[0].value;

  const state = reactive({
    loading: true,
    error: '',
    brand: 'mcd',
    brandLabel: '麦当劳',
    locationText: '',
    locationAddress: '',
    lat: null,
    lng: null,
    stores: [],
    selected: null,
    eatType: DEFAULT_EAT_TYPE,
  });

  function eatTypeLabel(value = state.eatType) {
    return EAT_TYPE_OPTIONS.find((opt) => opt.value === value)?.label || value || '';
  }

  function widgetBrand() {
    return String(fieldProps(props.field).brand || 'mcd').trim().toLowerCase();
  }

  function parseModelValue(raw) {
    if (!raw) return {};
    if (typeof raw === 'object') return { ...raw };
    try {
      const parsed = JSON.parse(String(raw));
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function buildValues() {
    const values = {
      pickup_brand: state.brand,
      pickup_eat_type: state.eatType,
      pickup_eat_type_label: eatTypeLabel(),
    };
    if (!state.selected) {
      return values;
    }
    const item = state.selected;
    return {
      ...values,
      pickup_store_code: item.code,
      pickup_store_name: item.name,
      pickup_store_address: item.address,
      pickup_lat: String(item.latitude ?? state.lat ?? ''),
      pickup_lng: String(item.longitude ?? state.lng ?? ''),
    };
  }

  function emitValues() {
    emits('update:modelValue', JSON.stringify(buildValues()));
  }

  function applyModelValue(raw) {
    const parsed = parseModelValue(raw);
    if (!parsed.pickup_store_code) {
      state.selected = null;
      return;
    }
    state.selected = {
      code: parsed.pickup_store_code,
      name: parsed.pickup_store_name || parsed.pickup_store_code,
      address: parsed.pickup_store_address || '',
      latitude: parsed.pickup_lat,
      longitude: parsed.pickup_lng,
    };
    if (parsed.pickup_brand) {
      state.brand = String(parsed.pickup_brand).trim().toLowerCase();
    }
    const eatType = String(parsed.pickup_eat_type || '').trim();
    if (eatType && EAT_TYPE_OPTIONS.some((opt) => opt.value === eatType)) {
      state.eatType = eatType;
    }
  }

  function selectEatType(opt) {
    state.eatType = opt.value;
    emitValues();
  }

  function selectStore(item) {
    state.selected = item;
    emitValues();
  }

  function locateWithType(type) {
    return new Promise((resolve, reject) => {
      uni.getLocation({
        type,
        isHighAccuracy: true,
        success: (res) => resolve(res),
        fail: (err) => reject(err),
      });
    });
  }

  async function locate() {
    try {
      return await locateWithType('gcj02');
    } catch (err) {
      const msg = String(err?.errMsg || err?.message || err || '');
      // H5 开发环境未配置地图 provider 时 gcj02 会失败，回退 wgs84 仍可查附近店
      if (msg.includes('map provider') || msg.includes('coordinate system')) {
        return locateWithType('wgs84');
      }
      throw err;
    }
  }

  function buildNearbyHint(stores) {
    if (!Array.isArray(stores) || !stores.length) return '';
    const item = stores[0];
    const parts = [item.province, item.city].filter(Boolean);
    if (!parts.length) return '';
    return `${parts.join('')}附近`;
  }

  async function loadLocationLabel(lat, lng, nearbyHint = '') {
    state.locationText = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    state.locationAddress = '';
    try {
      const res = await PickupStoreApi.getLocationLabel({ lat, lng, nearbyHint });
      if (res.code !== 0 || !res.data) return;
      const address = String(res.data.address || '').trim();
      const coords = String(res.data.coordinates || '').trim();
      if (address) {
        state.locationAddress = address;
      }
      if (coords) {
        state.locationText = coords;
      }
    } catch (_) {
      /* keep coordinates only */
    }
  }

  async function loadNearby() {
    state.loading = true;
    state.error = '';
    state.brand = widgetBrand();
    state.brandLabel = state.brand === 'mcd' ? '麦当劳' : state.brand.toUpperCase();

    try {
      const loc = await locate();
      state.lat = loc.latitude;
      state.lng = loc.longitude;

      const res = await PickupStoreApi.getNearby({
        brand: state.brand,
        lat: loc.latitude,
        lng: loc.longitude,
        limit: 20,
      });
      if (res.code !== 0) {
        state.error = res.msg || '加载附近门店失败';
        state.stores = [];
        await loadLocationLabel(loc.latitude, loc.longitude);
        return;
      }
      state.stores = Array.isArray(res.data?.list) ? res.data.list : [];
      state.brandLabel = res.data?.brandLabel || state.brandLabel;
      await loadLocationLabel(loc.latitude, loc.longitude, buildNearbyHint(state.stores));
      if (!state.stores.length) {
        state.error = `附近 ${res.data?.maxKm || 30}km 内暂无门店`;
      }
    } catch (err) {
      const msg = String(err?.errMsg || err?.message || err || '');
      if (msg.includes('auth deny') || msg.includes('authorize')) {
        state.error = '需要定位权限才能推荐附近门店，请在系统设置中允许定位';
      } else {
        state.error = '获取定位失败，请检查浏览器/H5 定位权限';
      }
      state.stores = [];
    } finally {
      state.loading = false;
    }
  }

  function refresh() {
    loadNearby();
  }

  function validate() {
    if (!state.eatType) {
      return '请选择就餐方式';
    }
    if (!state.selected?.code) {
      return `请选择${props.field?.label || '门店'}`;
    }
    return '';
  }

  onMounted(() => {
    applyModelValue(props.modelValue);
    loadNearby();
    emitValues();
  });

  watch(
    () => props.modelValue,
    (value) => {
      applyModelValue(value);
    },
  );

  defineExpose({ validate, getValues: buildValues, refresh });
</script>

<style scoped lang="scss">
  .tip {
    color: #888;
    font-size: 26rpx;
    line-height: 1.6;
  }

  .tip.error {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    color: #c0392b;
  }

  .loc-row {
    display: flex;
    align-items: flex-start;
    gap: 12rpx;
    padding: 12rpx 0 20rpx;
    font-size: 24rpx;
    color: #666;
  }

  .loc-label {
    flex-shrink: 0;
    color: #999;
    line-height: 1.5;
    padding-top: 2rpx;
  }

  .loc-main {
    flex: 1;
    min-width: 0;
  }

  .loc-value {
    display: block;
    word-break: break-all;
    line-height: 1.5;
    color: #333;
  }

  .loc-coords {
    display: block;
    margin-top: 4rpx;
    font-size: 22rpx;
    color: #aaa;
    word-break: break-all;
  }

  .eat-type-row {
    padding: 0 0 20rpx;
  }

  .eat-type-label {
    display: block;
    margin-bottom: 12rpx;
    font-size: 24rpx;
    color: #999;
  }

  .eat-type-options {
    display: flex;
    gap: 16rpx;
  }

  .eat-type-item {
    flex: 1;
    padding: 16rpx 12rpx;
    border: 1px solid #eee;
    border-radius: 12rpx;
    background: #fafafa;
    text-align: center;
    font-size: 26rpx;
    color: #333;
  }

  .eat-type-item.active {
    border-color: #e74c3c;
    background: #fff7f6;
    color: #e74c3c;
    font-weight: 600;
  }

  .store-list {
    max-height: 680rpx;
  }

  .store-item {
    padding: 20rpx;
    margin-bottom: 16rpx;
    border: 1px solid #eee;
    border-radius: 12rpx;
    background: #fafafa;
  }

  .store-item.active {
    border-color: #e74c3c;
    background: #fff7f6;
  }

  .store-head {
    display: flex;
    justify-content: space-between;
    gap: 16rpx;
    margin-bottom: 8rpx;
  }

  .store-name {
    flex: 1;
    font-size: 28rpx;
    font-weight: 600;
    color: #111;
  }

  .store-distance {
    flex-shrink: 0;
    font-size: 24rpx;
    color: #e74c3c;
  }

  .store-address,
  .store-hours {
    display: block;
    font-size: 24rpx;
    color: #666;
    line-height: 1.5;
  }

  .selected-box {
    margin-top: 16rpx;
    padding: 16rpx;
    border-radius: 8rpx;
    background: #f0f9eb;
    color: #2d7a1f;
    font-size: 26rpx;
  }

  .btn.ghost {
    margin: 0;
    background: #fff;
    color: #333;
    border: 1px solid #ddd;
  }
</style>
