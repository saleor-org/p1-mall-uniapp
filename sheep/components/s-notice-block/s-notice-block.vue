<template>
  <view class="notice-wrap ss-flex ss-col-center" @tap="onTap">
    <view class="notice-icon">
      <image
        v-if="iconSrc"
        class="icon-img"
        :src="iconSrc"
        mode="aspectFit"
        @error="onIconError"
      />
      <uni-icons v-else type="sound" :color="textColor" :size="18" />
    </view>
    <view class="notice-marquee">
      <view
        class="notice-marquee__track"
        :style="{ color: textColor, animationDuration: marqueeDuration }"
      >
        <view class="notice-marquee__text">{{ noticeText }}</view>
        <view class="notice-marquee__text">{{ noticeText }}</view>
      </view>
    </view>
  </view>
</template>

<script setup>
  /**
   * 装修组件 - 通知栏（通栏 + 横向滚动）
   */
  import { computed, ref } from 'vue';
  import sheep from '@/sheep';

  const props = defineProps({
    data: {
      type: Object,
      default() {},
    },
  });

  const iconBroken = ref(false);

  const noticeText = computed(() => props.data?.contents?.[0]?.text || '');
  const textColor = computed(() => props.data?.textColor || '#fa8c16');

  const iconSrc = computed(() => {
    if (iconBroken.value || !props.data?.iconUrl) {
      return '';
    }
    return sheep.$url.cdn(props.data.iconUrl);
  });

  const marqueeDuration = computed(() => {
    const len = noticeText.value.length || 1;
    return `${Math.max(10, len * 0.3)}s`;
  });

  function onIconError() {
    iconBroken.value = true;
  }

  function onTap() {
    const url = props.data?.contents?.[0]?.url;
    if (url) {
      sheep.$router.go(url);
    }
  }
</script>

<style lang="scss" scoped>
  .notice-wrap {
    width: 100%;
    box-sizing: border-box;
    min-height: 72rpx;
    padding: 16rpx 24rpx;
  }

  .notice-icon {
    width: 56rpx;
    height: 56rpx;
    flex-shrink: 0;
    margin-right: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    .icon-img {
      width: 56rpx;
      height: 56rpx;
    }
  }

  .notice-marquee {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    height: 40rpx;
    line-height: 40rpx;
  }

  .notice-marquee__track {
    display: inline-flex;
    flex-wrap: nowrap;
    align-items: center;
    white-space: nowrap;
    animation: notice-scroll linear infinite;
    will-change: transform;
  }

  .notice-marquee__text {
    flex-shrink: 0;
    white-space: nowrap;
    font-size: 28rpx;
    line-height: 40rpx;
    padding-right: 80rpx;
  }

  @keyframes notice-scroll {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-50%);
    }
  }
</style>
