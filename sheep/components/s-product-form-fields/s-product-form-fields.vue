<template>
  <view v-if="fields.length" class="product-form-fields">
    <view class="form-item ss-m-b-24" v-for="field in fields" :key="field.key">
      <view class="label-text ss-m-b-12">
        {{ field.label }}
        <text v-if="field.required" class="required-mark">*</text>
      </view>
      <view v-if="field.type === 'tel'" class="input-row">
        <uni-easyinput
          :modelValue="localValues[field.key]"
          type="digit"
          :placeholder="field.placeholder || '请输入手机号'"
          :maxlength="11"
          @update:modelValue="(val) => setFieldValue(field.key, val)"
        />
      </view>
      <view v-else-if="field.type === 'qrcode'" class="input-row scan-row">
        <uni-easyinput
          :modelValue="localValues[field.key]"
          :placeholder="field.placeholder || '点击右侧按钮扫码'"
          @update:modelValue="(val) => setFieldValue(field.key, val)"
        />
        <button class="ss-reset-button scan-btn" @tap="onScan(field.key)">扫码</button>
      </view>
    </view>
  </view>
</template>

<script setup>
  import { reactive, watch } from 'vue';

  const props = defineProps({
    fields: {
      type: Array,
      default: () => [],
    },
    modelValue: {
      type: Object,
      default: () => ({}),
    },
  });

  const emits = defineEmits(['update:modelValue', 'change']);

  const localValues = reactive({});

  function syncFromProps() {
    const next = { ...(props.modelValue || {}) };
    for (const field of props.fields) {
      if (next[field.key] === undefined) {
        next[field.key] = '';
      }
    }
    Object.keys(localValues).forEach((key) => delete localValues[key]);
    Object.assign(localValues, next);
  }

  watch(
    () => props.fields,
    () => syncFromProps(),
    { immediate: true, deep: true },
  );

  function setFieldValue(key, val) {
    localValues[key] = String(val ?? '').trim();
    onChange();
  }

  function onChange() {
    const payload = getValues();
    emits('update:modelValue', payload);
    emits('change', payload);
  }

  function getValues() {
    const out = {};
    for (const field of props.fields) {
      out[field.key] = String(localValues[field.key] ?? '').trim();
    }
    return out;
  }

  function onScan(key) {
    uni.scanCode({
      onlyFromCamera: false,
      sound: 'default',
      scanType: ['qrCode', 'barCode'],
      success: (res) => {
        localValues[key] = (res.result || '').trim();
        onChange();
      },
      fail: (err) => {
        if (err?.errMsg !== 'scanCode:fail cancel') {
          uni.showToast({ title: '扫码失败', icon: 'none' });
        }
      },
    });
  }

  function validate(values) {
    const current = values || getValues();
    for (const field of props.fields) {
      const text = String(current[field.key] || '').trim();
      if (field.required && !text) {
        return `请填写${field.label}`;
      }
      if (field.type === 'tel' && text && !/^1\d{10}$/.test(text)) {
        return '请输入正确的手机号';
      }
    }
    return '';
  }

  defineExpose({ validate, getValues });
</script>

<style lang="scss" scoped>
  .product-form-fields {
    padding-top: 10rpx;
  }

  .label-text {
    font-size: 26rpx;
    font-weight: 500;
    color: #333;
  }

  .required-mark {
    color: #e93323;
    margin-left: 4rpx;
  }

  .scan-row {
    display: flex;
    align-items: center;
    gap: 16rpx;
  }

  .scan-row :deep(.uni-easyinput) {
    flex: 1;
  }

  .scan-btn {
    flex-shrink: 0;
    min-width: 120rpx;
    height: 64rpx;
    padding: 0 24rpx;
    border-radius: 32rpx;
    background: var(--ui-BG-Main-light);
    color: var(--ui-BG-Main);
    font-size: 24rpx;
  }
</style>
