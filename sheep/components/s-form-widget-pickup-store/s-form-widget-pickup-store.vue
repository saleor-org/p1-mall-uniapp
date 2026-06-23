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
        <text class="loc-value">{{ state.locationText }}</text>
        <button class="btn ghost" size="mini" @tap="refresh">刷新</button>
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
        已选：{{ state.selected.name }}
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

  const state = reactive({
    loading: true,
    error: '',
    brand: 'mcd',
    brandLabel: '麦当劳',
    locationText: '',
    lat: null,
    lng: null,
    stores: [],
    selected: null,
  });

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
    if (!state.selected) {
      return {};
    }
    const item = state.selected;
    return {
      pickup_brand: state.brand,
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

  async function loadNearby() {
    state.loading = true;
    state.error = '';
    state.brand = widgetBrand();
    state.brandLabel = state.brand === 'mcd' ? '麦当劳' : state.brand.toUpperCase();

    try {
      const loc = await locate();
      state.lat = loc.latitude;
      state.lng = loc.longitude;
      state.locationText = `${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`;

      const res = await PickupStoreApi.getNearby({
        brand: state.brand,
        lat: loc.latitude,
        lng: loc.longitude,
        limit: 20,
      });
      if (res.code !== 0) {
        state.error = res.msg || '加载附近门店失败';
        state.stores = [];
        return;
      }
      state.stores = Array.isArray(res.data?.list) ? res.data.list : [];
      state.brandLabel = res.data?.brandLabel || state.brandLabel;
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
    if (!state.selected?.code) {
      return `请选择${props.field?.label || '门店'}`;
    }
    return '';
  }

  onMounted(() => {
    applyModelValue(props.modelValue);
    loadNearby();
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
    align-items: center;
    gap: 12rpx;
    padding: 12rpx 0 20rpx;
    font-size: 24rpx;
    color: #666;
  }

  .loc-label {
    flex-shrink: 0;
    color: #999;
  }

  .loc-value {
    flex: 1;
    word-break: break-all;
  }

  .store-list {
    max-height: 520rpx;
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
