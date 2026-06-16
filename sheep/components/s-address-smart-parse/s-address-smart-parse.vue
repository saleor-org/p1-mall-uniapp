<template>
  <view class="smart-address">
    <view class="tip">示例：牛牛，152****6666，湖南省长沙市芙蓉区某小区</view>
    <textarea
      v-model="state.text"
      class="textarea"
      maxlength="500"
      placeholder="请粘贴或输入文本，点击「粘贴并识别」可自动识别姓名、手机与地址"
      placeholder-class="placeholder"
    />
    <view class="actions">
      <button class="btn ghost" :disabled="state.loading" @tap="onClear">清空</button>
      <button class="btn primary" :loading="state.loading" @tap="onRecognize">
        粘贴并识别
      </button>
    </view>
  </view>
</template>

<script setup>
  import { reactive } from 'vue';
  import sheep from '@/sheep';
  import AddressApi from '@/sheep/api/member/address';

  const emits = defineEmits(['parsed']);

  const state = reactive({
    text: '',
    loading: false,
  });

  function onClear() {
    state.text = '';
  }

  async function onRecognize() {
    let content = String(state.text || '').trim();
    if (!content) {
      try {
        const clip = await uni.getClipboardData();
        content = String(clip?.data || '').trim();
        if (content) {
          state.text = content;
        }
      } catch (_) {
        /* ignore */
      }
    }
    if (!content) {
      sheep.$helper.toast('请先粘贴或输入地址文本');
      return;
    }

    state.loading = true;
    try {
      const result = await AddressApi.recognizeAddress({ content });
      if (!result || typeof result !== 'object') {
        sheep.$helper.toast('识别服务不可用，请确认后端已更新');
        return;
      }
      const { code, data, msg } = result;
      if (code !== 0 || !data) {
        sheep.$helper.toast(msg || '识别失败，请检查地址格式');
        return;
      }
      emits('parsed', data);
      sheep.$helper.toast('识别成功，请核对后保存');
    } finally {
      state.loading = false;
    }
  }
</script>

<style scoped lang="scss">
  .smart-address {
    padding: 24rpx 0 8rpx;
  }

  .tip {
    margin-bottom: 16rpx;
    padding: 12rpx 16rpx;
    border-radius: 8rpx;
    background: #fff5f5;
    color: #e93323;
    font-size: 24rpx;
    line-height: 1.5;
  }

  .textarea {
    width: 100%;
    min-height: 160rpx;
    padding: 20rpx;
    box-sizing: border-box;
    border: 1rpx solid #eee;
    border-radius: 12rpx;
    font-size: 28rpx;
    color: #333;
    background: #fafafa;
  }

  .placeholder {
    color: #bbb;
    font-size: 26rpx;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 16rpx;
    margin-top: 16rpx;
  }

  .btn {
    margin: 0;
    padding: 0 28rpx;
    height: 64rpx;
    line-height: 64rpx;
    font-size: 26rpx;
    border-radius: 32rpx;
  }

  .btn.ghost {
    background: #fff;
    color: #2563eb;
    border: 1rpx solid #2563eb;
  }

  .btn.primary {
    background: #2563eb;
    color: #fff;
    border: none;
  }
</style>
