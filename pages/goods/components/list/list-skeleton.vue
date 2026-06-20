<template>
  <view class="list-skeleton ss-p-x-20 ss-m-t-20">
    <view class="skeleton-tip ss-flex ss-col-center ss-row-center">
      <view class="skeleton-spinner" />
      <text class="skeleton-tip-text">{{ tipText }}</text>
    </view>
    <view class="ss-flex ss-flex-wrap ss-col-top">
      <view class="goods-list-box" v-for="side in 2" :key="side">
        <view class="skeleton-card" v-for="n in 3" :key="`${side}-${n}`">
          <view class="skeleton-img" />
          <view class="skeleton-line w-80" />
          <view class="skeleton-line w-60" />
          <view class="skeleton-line w-40" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
  defineProps({
    tipText: {
      type: String,
      default: '加载中…',
    },
  });
</script>

<style lang="scss" scoped>
  .list-skeleton {
    .skeleton-tip {
      padding: 24rpx 0 32rpx;
      gap: 16rpx;
    }

    .skeleton-spinner {
      width: 28rpx;
      height: 28rpx;
      border: 4rpx solid #eee;
      border-top-color: var(--ui-BG-Main, #ff6000);
      border-radius: 50%;
      animation: list-skeleton-spin 0.8s linear infinite;
    }

    .skeleton-tip-text {
      font-size: 26rpx;
      color: #999;
    }

    .goods-list-box {
      width: 50%;
      box-sizing: border-box;

      &:first-child .skeleton-card {
        margin-right: 10rpx;
      }

      &:last-child .skeleton-card {
        margin-left: 10rpx;
      }
    }

    .skeleton-card {
      margin-bottom: 20rpx;
      padding: 16rpx;
      border-radius: 10rpx;
      background: #fff;
    }

    .skeleton-img {
      width: 100%;
      height: 320rpx;
      border-radius: 10rpx;
      background: linear-gradient(90deg, #f2f2f2 25%, #e9e9e9 50%, #f2f2f2 75%);
      background-size: 200% 100%;
      animation: list-skeleton-shimmer 1.2s ease-in-out infinite;
    }

    .skeleton-line {
      height: 24rpx;
      margin-top: 16rpx;
      border-radius: 6rpx;
      background: linear-gradient(90deg, #f2f2f2 25%, #e9e9e9 50%, #f2f2f2 75%);
      background-size: 200% 100%;
      animation: list-skeleton-shimmer 1.2s ease-in-out infinite;

      &.w-80 {
        width: 80%;
      }

      &.w-60 {
        width: 60%;
      }

      &.w-40 {
        width: 40%;
      }
    }
  }

  @keyframes list-skeleton-shimmer {
    0% {
      background-position: 100% 0;
    }

    100% {
      background-position: -100% 0;
    }
  }

  @keyframes list-skeleton-spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
