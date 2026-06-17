<template>
  <view class="oauth-pick-widget">
    <view class="scene-title">{{ sceneLabel }}</view>
    <view v-if="state.mockMode" class="mock-tag">开发模拟选品</view>
    <view class="summary" v-if="summaryText">{{ summaryText }}</view>
    <view v-else class="placeholder">请完成选品（城市 / 门店 / 场次等）</view>
    <button class="pick-btn" @tap="onPick">{{ summaryText ? '重新选品' : mockButtonLabel }}</button>
    <view class="hint">{{ hintText }}</view>
  </view>
</template>

<script setup>
  import { computed, onMounted, reactive } from 'vue';
  import sheep from '@/sheep';
  import DevMockApi from '@/sheep/api/dev/mock';
  import { fieldProps, widgetIdFromField } from '@/sheep/helper/productFormEngine';

  const props = defineProps({
    field: { type: Object, default: () => ({}) },
    modelValue: { type: [String, Object], default: '' },
  });

  const emits = defineEmits(['update:modelValue']);

  const state = reactive({
    mockMode: false,
  });

  const widgetId = computed(() => widgetIdFromField(props.field));
  const scene = computed(() => 'movie');

  const sceneLabel = computed(() => '电影票选品');

  const mockButtonLabel = computed(() =>
    state.mockMode ? '一键模拟选品（测试）' : '去选品',
  );

  const hintText = computed(() => {
    if (state.mockMode) {
      return 'FULFILL_MOCK_ENABLED=true：选品与支付后出票/取餐码均为模拟，无需有票正式账号。';
    }
    return `选品完成后写入 ${props.field?.key || 'order_payload'}，支付后由履约 Router 提交供应商。`;
  });

  const summaryText = computed(() => {
    const raw = props.modelValue;
    if (!raw) {
      return '';
    }
    let parsed = raw;
    if (typeof raw === 'string') {
      try {
        parsed = JSON.parse(raw);
      } catch (_) {
        return String(raw).slice(0, 80);
      }
    }
    if (!parsed || typeof parsed !== 'object') {
      return '';
    }
    return (
      parsed.summary ||
      parsed.title ||
      parsed.cinemaName ||
      parsed.storeName ||
      '已选品，可重新选择'
    );
  });

  async function onPick() {
    if (state.mockMode) {
      const { code, data, msg } = await DevMockApi.buildOAuthPayload({ scene: scene.value });
      if (code !== 0) {
        sheep.$helper.toast(msg || '模拟选品失败');
        return;
      }
      emits('update:modelValue', data.orderPayloadJson || JSON.stringify(data.orderPayload || {}));
      sheep.$helper.toast('已生成模拟选品');
      return;
    }
    sheep.$helper.toast(`${sceneLabel.value}正式选品页开发中`);
  }

  function validate() {
    const raw = props.modelValue;
    const text = typeof raw === 'string' ? raw.trim() : raw ? JSON.stringify(raw) : '';
    if (!text) {
      return `请完成${sceneLabel.value}`;
    }
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || !Object.keys(parsed).length) {
          return `请完成${sceneLabel.value}`;
        }
      } catch (_) {
        return `请完成${sceneLabel.value}`;
      }
    }
    return '';
  }

  onMounted(async () => {
    const res = await DevMockApi.getConfig();
    state.mockMode = res.code === 0 && !!res.data?.enabled;
  });

  defineExpose({ validate });
</script>

<style scoped lang="scss">
  .oauth-pick-widget {
    padding: 8rpx 0;
  }

  .scene-title {
    font-size: 28rpx;
    font-weight: 600;
    margin-bottom: 12rpx;
  }

  .mock-tag {
    display: inline-block;
    margin-bottom: 12rpx;
    padding: 4rpx 12rpx;
    border-radius: 8rpx;
    background: #fef3c7;
    color: #92400e;
    font-size: 22rpx;
  }

  .summary,
  .placeholder {
    font-size: 26rpx;
    color: #666;
    margin-bottom: 16rpx;
  }

  .pick-btn {
    border-radius: 999rpx;
    background: linear-gradient(90deg, var(--ui-BG-Main), var(--ui-BG-Main-gradient));
    color: #fff;
    font-size: 28rpx;
  }

  .hint {
    margin-top: 12rpx;
    font-size: 24rpx;
    color: #999;
    line-height: 1.5;
  }
</style>
