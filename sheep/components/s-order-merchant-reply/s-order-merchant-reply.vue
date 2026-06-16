<template>
  <view v-if="visibleFields.length" class="merchant-reply-box">
    <view class="merchant-reply-head">
      <text class="merchant-reply-title">商家回传</text>
      <text class="merchant-reply-desc">商家处理结果，仅供查看</text>
    </view>
    <view
      class="merchant-reply-card"
      v-for="field in visibleFields"
      :key="`${item.id}-${field.key}`"
    >
      <text class="field-label">{{ field.label }}</text>
      <view v-if="field.type === 'upload' && field.files && field.files.length" class="file-list">
        <image
          v-for="(file, index) in field.files"
          :key="`${field.key}-${index}`"
          class="file-thumb"
          :src="file.url"
          mode="aspectFill"
          @tap="previewImage(file.url, field.files)"
        />
      </view>
      <text v-else class="field-value">{{ field.value || field.rawValue }}</text>
    </view>
  </view>
</template>

<script setup>
  import { computed } from 'vue';

  const props = defineProps({
    item: {
      type: Object,
      default: () => ({}),
    },
  });

  const visibleFields = computed(() => props.item?.merchantReplyFields || []);

  function previewImage(current, files) {
    const urls = (files || []).map((item) => item.url).filter(Boolean);
    if (!urls.length) {
      return;
    }
    uni.previewImage({
      current,
      urls,
    });
  }
</script>

<style lang="scss" scoped>
  .merchant-reply-box {
    margin: 20rpx 24rpx 0;
    padding: 24rpx;
    background: #fff;
    border-radius: 16rpx;
  }

  .merchant-reply-head {
    margin-bottom: 16rpx;
  }

  .merchant-reply-title {
    font-size: 30rpx;
    font-weight: 600;
    color: #222;
  }

  .merchant-reply-desc {
    display: block;
    margin-top: 8rpx;
    font-size: 24rpx;
    color: #888;
  }

  .merchant-reply-card {
    padding: 16rpx 0;
    border-top: 1rpx solid #f0f0f0;
  }

  .field-label {
    font-size: 26rpx;
    color: #666;
  }

  .field-value {
    display: block;
    margin-top: 8rpx;
    font-size: 28rpx;
    color: #222;
    line-height: 1.5;
  }

  .file-list {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
    margin-top: 12rpx;
  }

  .file-thumb {
    width: 140rpx;
    height: 140rpx;
    border-radius: 8rpx;
    background: #f5f5f5;
  }
</style>
