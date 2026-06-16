<template>
  <view class="express-widget">
    <view v-if="!state.ready" class="tip">{{ state.initError || '加载中…' }}</view>
    <view v-else>
      <view class="row">
        <text class="label">快递公司</text>
        <picker :range="state.carriers" range-key="name" @change="onCarrierChange">
          <view class="picker">{{ state.carriers[state.carrierIndex]?.name || '请选择' }}</view>
        </picker>
      </view>

      <view class="section-title">寄件人</view>
      <view class="row link" @tap="pickAddress('send')">
        <text class="label">地址簿</text>
        <text class="value">{{ state.form.send_addr || '选择或手动填写' }}</text>
      </view>
      <view class="row"><text class="label">姓名</text><input v-model="state.form.send_name" @input="emitValues" /></view>
      <view class="row"><text class="label">手机</text><input v-model="state.form.send_mobile" type="number" maxlength="11" @input="emitValues" /></view>
      <view class="row"><text class="label">地址</text><input v-model="state.form.send_addr" placeholder="完整地址" @input="emitValues" /></view>

      <view class="section-title">收件人</view>
      <view class="row link" @tap="pickAddress('rec')">
        <text class="label">地址簿</text>
        <text class="value">{{ state.form.rec_addr || '选择或手动填写' }}</text>
      </view>
      <view class="row"><text class="label">姓名</text><input v-model="state.form.rec_name" @input="emitValues" /></view>
      <view class="row"><text class="label">手机</text><input v-model="state.form.rec_mobile" type="number" maxlength="11" @input="emitValues" /></view>
      <view class="row"><text class="label">地址</text><input v-model="state.form.rec_addr" placeholder="完整地址" @input="emitValues" /></view>

      <view class="row"><text class="label">物品</text><input v-model="state.form.cargo" @input="emitValues" /></view>
      <view class="row"><text class="label">重量(kg)</text><input v-model="state.form.weight" type="digit" @input="emitValues" /></view>
      <view class="row">
        <text class="label">预约</text>
        <picker :range="dayTypes" @change="onDayTypeChange">
          <view class="picker">{{ state.form.day_type || '可选' }}</view>
        </picker>
      </view>

      <view v-if="state.quotePrice" class="quote">微信支付运费 ¥{{ state.quotePrice }}</view>
      <view class="btn-row">
        <button class="btn ghost" @tap="onQuote">查价</button>
      </view>
    </view>
  </view>
</template>

<script setup>
  import { onMounted, reactive, watch } from 'vue';
  import { onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import ExpressPickupApi from '@/sheep/api/trade/expressPickup';

  const dayTypes = ['今天', '明天', '后天'];
  const ADDRESS_STORAGE_KEY = 'express_pickup_address_pick';

  const props = defineProps({
    field: { type: Object, default: () => ({}) },
    modelValue: { type: [String, Object], default: '' },
  });

  const emits = defineEmits(['update:modelValue']);

  const state = reactive({
    ready: false,
    initError: '',
    carriers: [],
    carrierIndex: 0,
    quotePrice: '',
    form: {
      send_name: '',
      send_mobile: '',
      send_addr: '',
      rec_name: '',
      rec_mobile: '',
      rec_addr: '',
      cargo: '物品',
      weight: '1',
      day_type: '',
      remark: '',
      kuaidicom: '',
    },
  });

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
    const carrier = state.carriers[state.carrierIndex];
    return {
      send_name: state.form.send_name,
      send_mobile: state.form.send_mobile,
      send_addr: state.form.send_addr,
      rec_name: state.form.rec_name,
      rec_mobile: state.form.rec_mobile,
      rec_addr: state.form.rec_addr,
      cargo: state.form.cargo || '物品',
      weight: state.form.weight || '1',
      day_type: state.form.day_type,
      remark: state.form.remark,
      kuaidicom: carrier?.code || state.form.kuaidicom || '',
    };
  }

  function emitValues() {
    emits('update:modelValue', JSON.stringify(buildValues()));
  }

  function applyModelValue(raw) {
    const parsed = parseModelValue(raw);
    Object.assign(state.form, {
      send_name: parsed.send_name || '',
      send_mobile: parsed.send_mobile || '',
      send_addr: parsed.send_addr || '',
      rec_name: parsed.rec_name || '',
      rec_mobile: parsed.rec_mobile || '',
      rec_addr: parsed.rec_addr || '',
      cargo: parsed.cargo || '物品',
      weight: parsed.weight || '1',
      day_type: parsed.day_type || '',
      remark: parsed.remark || '',
      kuaidicom: parsed.kuaidicom || '',
    });
    if (parsed.kuaidicom && state.carriers.length) {
      const idx = state.carriers.findIndex((item) => item.code === parsed.kuaidicom);
      if (idx >= 0) {
        state.carrierIndex = idx;
      }
    }
  }

  function onCarrierChange(e) {
    state.carrierIndex = Number(e.detail.value || 0);
    emitValues();
  }

  function onDayTypeChange(e) {
    state.form.day_type = dayTypes[Number(e.detail.value || 0)] || '';
    emitValues();
  }

  function pickAddress(role) {
    uni.navigateTo({
      url: `/pages/user/address/list?mode=pick&role=${role}&from=express-send`,
    });
  }

  function applyAddress(item, role) {
    if (!item) return;
    const full = `${item.areaName || ''}${item.detailAddress || ''}`;
    if (role === 'send') {
      state.form.send_name = item.name || state.form.send_name;
      state.form.send_mobile = item.mobile || state.form.send_mobile;
      state.form.send_addr = full || state.form.send_addr;
    } else {
      state.form.rec_name = item.name || state.form.rec_name;
      state.form.rec_mobile = item.mobile || state.form.rec_mobile;
      state.form.rec_addr = full || state.form.rec_addr;
    }
    emitValues();
  }

  async function onQuote() {
    const carrier = state.carriers[state.carrierIndex];
    if (!carrier) {
      sheep.$helper.toast('请选择快递公司');
      return;
    }
    const f = state.form;
    const { code, data, msg } = await ExpressPickupApi.quote({
      kuaidicom: carrier.code,
      sendDetailAddress: f.send_addr,
      recDetailAddress: f.rec_addr,
      weight: f.weight,
    });
    if (code !== 0) {
      sheep.$helper.toast(msg || '查价失败');
      return;
    }
    state.quotePrice = data?.payPriceYuan || data?.priceYuan || data?.price || '';
    const patch = data?.formPatch || {};
    Object.assign(state.form, patch);
    emitValues();
  }

  function validate() {
    const f = state.form;
    if (!f.send_name || !f.send_mobile || !f.send_addr) {
      return '请完善寄件人信息';
    }
    if (!f.rec_name || !f.rec_mobile || !f.rec_addr) {
      return '请完善收件人信息';
    }
    if (!/^1\d{10}$/.test(String(f.send_mobile))) {
      return '寄件人手机号格式不正确';
    }
    if (!/^1\d{10}$/.test(String(f.rec_mobile))) {
      return '收件人手机号格式不正确';
    }
    if (!state.carriers[state.carrierIndex]?.code) {
      return '请选择快递公司';
    }
    return '';
  }

  async function init() {
    const res = await ExpressPickupApi.getConfig();
    if (res.code !== 0) {
      state.initError = '加载寄件配置失败';
      return;
    }
    if (!res.data?.enabled) {
      state.initError = '寄件未启用，请配置 KD100_CORDER_ENABLED 或 FULFILL_MOCK_ENABLED';
      return;
    }
    const carriers = await ExpressPickupApi.getCarriers();
    if (carriers.code === 0) {
      state.carriers = carriers.data || [];
    }
    state.ready = true;
    applyModelValue(props.modelValue);
    emitValues();
  }

  onMounted(() => {
    init();
  });

  onShow(() => {
    const picked = uni.getStorageSync(ADDRESS_STORAGE_KEY);
    if (picked && picked.role) {
      applyAddress(picked, picked.role);
      uni.removeStorageSync(ADDRESS_STORAGE_KEY);
    }
  });

  watch(
    () => props.modelValue,
    (value) => {
      applyModelValue(value);
    },
  );

  defineExpose({ validate, getValues: buildValues });
</script>

<style scoped lang="scss">
  .tip {
    color: #888;
    font-size: 26rpx;
    line-height: 1.6;
  }

  .section-title {
    font-size: 28rpx;
    font-weight: 600;
    margin: 24rpx 0 8rpx;
  }

  .row {
    display: flex;
    align-items: center;
    padding: 20rpx 0;
    border-bottom: 1px solid #f0f0f0;
    font-size: 28rpx;
  }

  .row.link {
    align-items: flex-start;
  }

  .label {
    width: 140rpx;
    color: #666;
    flex-shrink: 0;
  }

  .value,
  input,
  .picker {
    flex: 1;
  }

  .quote {
    margin-top: 16rpx;
    color: #2563eb;
    font-weight: 600;
  }

  .btn-row {
    margin-top: 16rpx;
  }

  .btn.ghost {
    border-radius: 999rpx;
    background: #fff;
    border: 1px solid #ddd;
    font-size: 28rpx;
  }
</style>
