<template>
  <view v-if="visibleFields.length" class="post-ship-scan-box">
    <view class="post-ship-scan-head">
      <text class="post-ship-scan-title">发货后信息提交</text>
      <text class="post-ship-scan-desc">{{ sectionDesc }}</text>
    </view>
    <view
      class="post-ship-scan-card"
      v-for="field in visibleFields"
      :key="`${item.id}-${field.key}`"
    >
      <view v-if="field.type !== 'qrcode'" class="generic-field-box">
        <view v-if="field.submitted" class="submitted-row">
          <text class="field-label">{{ field.label }}</text>
          <text class="submitted-text">{{ field.displayValue || field.value }}</text>
        </view>
        <view v-else-if="showFieldForm(field)">
          <s-product-form-fields
            :ref="(el) => setFormRef(field.key, el)"
            :fields="[field]"
            v-model="draftValues"
          />
          <button
            class="ss-reset-button submit-action-btn single-submit-btn"
            :disabled="submitting"
            @tap="onSubmit(field)"
          >
            提交
          </button>
        </view>
      </view>

      <template v-else>
        <view class="field-label">{{ field.label }}</view>
        <view v-if="field.fixedValue" class="fixed-tip">
          固定会员码：{{ field.fixedValue }}
        </view>
        <view v-if="field.scanHistory && field.scanHistory.length" class="history-box">
          <text class="history-title">已提交记录（{{ field.scanHistory.length }}）</text>
          <view
            class="history-item"
            v-for="(scan, index) in field.scanHistory"
            :key="`${field.key}-${index}`"
          >
            <text class="history-index">#{{ index + 1 }}</text>
            <text class="history-text">{{ scan.content }}</text>
          </view>
        </view>
        <view v-if="showFieldForm(field)" class="scan-actions">
          <uni-easyinput
            :modelValue="draftValues[field.key]"
            :placeholder="field.placeholder || '可扫码或手动粘贴内容'"
            @update:modelValue="(val) => setDraft(field.key, val)"
          />
          <view class="btn-row">
            <button class="ss-reset-button scan-action-btn" @tap="onCameraScan(field)">
              摄像头扫码
            </button>
            <button class="ss-reset-button scan-action-btn secondary" @tap="onImageScan(field)">
              识别二维码图片
            </button>
            <button
              class="ss-reset-button submit-action-btn"
              :disabled="submitting"
              @tap="onSubmit(field)"
            >
              {{ field.scanMode === 'multi' ? '追加提交' : '提交' }}
            </button>
          </view>
        </view>
        <view v-else-if="field.submitted && field.scanMode === 'fixed'" class="submitted-row">
          <text class="submitted-text">固定码已提交，如需修改请联系客服</text>
        </view>
      </template>
    </view>
    <!-- #ifdef MP-WEIXIN -->
    <canvas
      canvas-id="mallQrDecodeCanvas"
      class="hidden-canvas"
      :style="{ width: '1024px', height: '1024px' }"
    />
    <!-- #endif -->
  </view>
</template>

<script setup>
  import { computed, reactive, ref, watch } from 'vue';
  import OrderApi from '@/sheep/api/trade/order';
  import { scanQrCode } from '@/sheep/helper/scan-qrcode';
  import SProductFormFields from '@/sheep/components/s-product-form-fields/s-product-form-fields.vue';

  const props = defineProps({
    orderId: {
      type: [Number, String],
      default: 0,
    },
    item: {
      type: Object,
      default: () => ({}),
    },
  });

  const emits = defineEmits(['submitted']);

  const draftValues = reactive({});
  const submitting = ref(false);
  const formRefs = reactive({});

  const visibleFields = computed(() => props.item?.postShipScanFields || []);

  const sectionDesc = computed(() => {
    const fields = visibleFields.value;
    if (fields.some((field) => field.type === 'qrcode' && field.scanMode === 'multi')) {
      return '商家已发货，请按提示填写或扫码提交；部分字段可多次提交。';
    }
    return '商家已发货，请按提示填写信息并提交，便于客服处理。';
  });

  function showFieldForm(field) {
    if (!props.item?.canPostShipScan) {
      return false;
    }
    if (field.type === 'qrcode' && field.scanMode === 'multi') {
      return true;
    }
    return !field.submitted;
  }

  function setFormRef(key, el) {
    if (el) {
      formRefs[key] = el;
    }
  }

  function switchInactiveValue(field) {
    const props = field?.props || {};
    return String(props.inactiveValue || 'false');
  }

  watch(
    () => props.item,
    (item) => {
      Object.keys(draftValues).forEach((key) => delete draftValues[key]);
      for (const field of item?.postShipScanFields || []) {
        if (showFieldForm(field)) {
          if (field.type === 'switch') {
            draftValues[field.key] = switchInactiveValue(field);
          } else if (field.type === 'checkbox') {
            draftValues[field.key] = '[]';
          } else {
            draftValues[field.key] = field.fixedValue || '';
          }
        }
      }
    },
    { immediate: true, deep: true },
  );

  function setDraft(key, val) {
    draftValues[key] = String(val ?? '').trim();
  }

  function fieldContent(field) {
    if (field.type === 'qrcode') {
      return String(draftValues[field.key] || '').trim();
    }
    const reader = formRefs[field.key];
    const values = reader?.getValues?.() || draftValues;
    return String(values[field.key] || '').trim();
  }

  function validateField(field) {
    if (field.type === 'qrcode') {
      return fieldContent(field) ? '' : `请填写${field.label}`;
    }
    const reader = formRefs[field.key];
    const values = reader?.getValues?.() || draftValues;
    return reader?.validate?.(values) || '';
  }

  async function applyScanResult(field, fromImage) {
    try {
      const text = await scanQrCode({ fromImage });
      draftValues[field.key] = text;
    } catch (error) {
      if (error?.message === 'cancel') {
        return;
      }
      uni.showToast({ title: error?.message || '扫码失败', icon: 'none' });
    }
  }

  function onCameraScan(field) {
    applyScanResult(field, false);
  }

  function onImageScan(field) {
    applyScanResult(field, true);
  }

  async function onSubmit(field) {
    const error = validateField(field);
    if (error) {
      uni.showToast({ title: error, icon: 'none' });
      return;
    }
    const content = fieldContent(field);
    submitting.value = true;
    try {
      const { code, msg } = await OrderApi.submitOrderLineScan({
        orderId: Number(props.orderId),
        itemId: Number(props.item.id),
        fieldKey: field.key,
        content,
      });
      if (code !== 0) {
        uni.showToast({ title: msg || '提交失败', icon: 'none' });
        return;
      }
      uni.showToast({
        title: field.type === 'qrcode' && field.scanMode === 'multi' ? '已追加提交' : '提交成功',
        icon: 'success',
      });
      if (field.type === 'switch') {
        draftValues[field.key] = switchInactiveValue(field);
      } else if (field.type === 'checkbox') {
        draftValues[field.key] = '[]';
      } else {
        draftValues[field.key] = field.fixedValue || '';
      }
      emits('submitted');
    } finally {
      submitting.value = false;
    }
  }
</script>

<style lang="scss" scoped>
  .post-ship-scan-box {
    margin: 0 20rpx 20rpx;
    padding: 24rpx;
    border-radius: 10rpx;
    background: #fff;
  }

  .post-ship-scan-head {
    margin-bottom: 20rpx;
  }

  .post-ship-scan-title {
    display: block;
    font-size: 30rpx;
    font-weight: 600;
    color: #333;
  }

  .post-ship-scan-desc {
    display: block;
    margin-top: 8rpx;
    font-size: 24rpx;
    color: #999;
    line-height: 1.5;
  }

  .post-ship-scan-card + .post-ship-scan-card {
    margin-top: 20rpx;
    padding-top: 20rpx;
    border-top: 1rpx solid #f0f0f0;
  }

  .field-label {
    font-size: 26rpx;
    font-weight: 500;
    color: #333;
    margin-bottom: 12rpx;
  }

  .fixed-tip {
    margin-bottom: 12rpx;
    padding: 12rpx 16rpx;
    border-radius: 8rpx;
    background: #fff8e1;
    color: #e65100;
    font-size: 24rpx;
    word-break: break-all;
  }

  .history-box {
    margin-bottom: 16rpx;
    padding: 12rpx 16rpx;
    border-radius: 8rpx;
    background: #f6ffed;
  }

  .history-title {
    display: block;
    font-size: 22rpx;
    color: #666;
    margin-bottom: 8rpx;
  }

  .history-item {
    display: flex;
    gap: 12rpx;
    padding: 6rpx 0;
  }

  .history-index {
    flex-shrink: 0;
    font-size: 22rpx;
    color: #389e0d;
    font-weight: 600;
  }

  .history-text {
    font-size: 24rpx;
    color: #333;
    word-break: break-all;
  }

  .submitted-row {
    padding: 16rpx;
    border-radius: 8rpx;
    background: #f6ffed;
  }

  .submitted-text {
    display: block;
    margin-top: 8rpx;
    font-size: 24rpx;
    color: #389e0d;
    word-break: break-all;
  }

  .btn-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
    margin-top: 16rpx;
  }

  .scan-action-btn,
  .submit-action-btn {
    min-width: 180rpx;
    height: 60rpx;
    padding: 0 20rpx;
    border-radius: 30rpx;
    font-size: 24rpx;
    line-height: 60rpx;
  }

  .single-submit-btn {
    margin-top: 16rpx;
  }

  .scan-action-btn {
    background: var(--ui-BG-Main-light);
    color: var(--ui-BG-Main);
  }

  .scan-action-btn.secondary {
    background: #f5f5f5;
    color: #666;
  }

  .submit-action-btn {
    background: var(--ui-BG-Main);
    color: #fff;
  }

  .hidden-canvas {
    position: fixed;
    left: -9999px;
    top: -9999px;
    opacity: 0;
    pointer-events: none;
  }
</style>
