<template>
  <view class="form-field-address">
    <view v-if="pickEnabled" class="row link" @tap="pickFromAddressBook">
      <text class="label">地址簿</text>
      <text class="value">{{ summaryText || '从地址簿选择' }}</text>
    </view>
    <view class="row">
      <text class="label">姓名</text>
      <input v-model="state.name" class="input" placeholder="姓名" @input="emitValue" />
    </view>
    <view class="row">
      <text class="label">手机</text>
      <input
        v-model="state.mobile"
        class="input"
        type="number"
        maxlength="11"
        placeholder="手机号"
        @input="emitValue"
      />
    </view>
    <view class="row">
      <text class="label">地址</text>
      <input v-model="state.detail" class="input" placeholder="省市区 + 详细地址" @input="emitValue" />
    </view>
  </view>
</template>

<script setup>
  import { computed, onMounted, reactive, watch } from 'vue';
  import { onShow } from '@dcloudio/uni-app';
  import { fieldProps } from '@/sheep/helper/productFormEngine';

  const props = defineProps({
    field: { type: Object, default: () => ({}) },
    modelValue: { type: [String, Object], default: '' },
  });

  const emits = defineEmits(['update:modelValue']);

  const state = reactive({
    name: '',
    mobile: '',
    areaName: '',
    detail: '',
    full: '',
  });

  const pickEnabled = computed(() => fieldProps(props.field).pickEnabled !== false);
  const storageKey = computed(() => `form_address_pick_${props.field?.key || 'address'}`);

  const summaryText = computed(() => state.full || state.detail || '');

  function parsePayload(raw) {
    if (!raw) return {};
    if (typeof raw === 'object' && !Array.isArray(raw)) return { ...raw };
    const text = String(raw).trim();
    if (!text) return {};
    if (!text.startsWith('{')) {
      return { full: text, detail: text };
    }
    try {
      const parsed = JSON.parse(text);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) {
      return { full: text, detail: text };
    }
  }

  function buildPayload() {
    const area = String(state.areaName || '').trim();
    const detail = String(state.detail || '').trim();
    const full = String(state.full || '').trim() || `${area}${detail}`.trim();
    return {
      name: String(state.name || '').trim(),
      mobile: String(state.mobile || '').trim(),
      areaName: area,
      detail,
      full,
    };
  }

  function emitValue() {
    emits('update:modelValue', JSON.stringify(buildPayload()));
  }

  function applyPayload(raw) {
    const parsed = parsePayload(raw);
    state.name = parsed.name || '';
    state.mobile = parsed.mobile || '';
    state.areaName = parsed.areaName || parsed.area || '';
    state.detail = parsed.detail || parsed.detailAddress || '';
    state.full =
      parsed.full ||
      parsed.addr ||
      `${state.areaName}${state.detail}`.trim();
    if (!state.detail && state.full) {
      state.detail = state.full;
    }
  }

  function pickFromAddressBook() {
    const role = fieldProps(props.field).role || 'send';
    uni.navigateTo({
      url: `/pages/user/address/list?mode=pick&from=product-form&fieldKey=${encodeURIComponent(
        props.field?.key || 'address',
      )}&role=${encodeURIComponent(role)}`,
    });
  }

  function applyPickedAddress(item) {
    if (!item) return;
    state.name = item.name || state.name;
    state.mobile = item.mobile || state.mobile;
    state.areaName = item.areaName || '';
    state.detail = item.detailAddress || item.detail || state.detail;
    state.full = `${state.areaName}${state.detail}`.trim();
    emitValue();
  }

  function consumeAddressPick() {
    const picked = uni.getStorageSync(storageKey.value);
    if (!picked || typeof picked !== 'object') return;
    uni.removeStorageSync(storageKey.value);
    applyPickedAddress(picked);
  }

  watch(
    () => props.modelValue,
    (value) => applyPayload(value),
    { immediate: true },
  );

  onShow(() => {
    consumeAddressPick();
  });

  onMounted(() => {
    consumeAddressPick();
  });

  function validate() {
    const payload = buildPayload();
    if (props.field?.required && !payload.full && !payload.detail) {
      return `请填写${props.field?.label || '地址'}`;
    }
    if (payload.mobile && !/^1\d{10}$/.test(payload.mobile)) {
      return '请输入正确的手机号';
    }
    return '';
  }

  defineExpose({ validate });
</script>

<style scoped lang="scss">
  .form-field-address {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 16rpx;
  }

  .row.link {
    color: #2563eb;
  }

  .label {
    width: 120rpx;
    flex-shrink: 0;
    font-size: 26rpx;
    color: #666;
  }

  .value,
  .input {
    flex: 1;
    font-size: 28rpx;
    color: #333;
  }

  .input {
    border-bottom: 1rpx solid #eee;
    padding: 8rpx 0;
  }
</style>
