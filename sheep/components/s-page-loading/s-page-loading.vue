<template>
  <view class="s-page-loading" :class="[`s-page-loading--${type}`, { 'is-compact': compact }]">
    <view class="s-page-loading__tip ss-flex ss-col-center ss-row-center">
      <view class="s-page-loading__spinner" />
      <text class="s-page-loading__tip-text">{{ tip }}</text>
    </view>

    <!-- 商品双列 -->
    <view v-if="type === 'list'" class="s-page-loading__list ss-flex ss-flex-wrap ss-col-top">
      <view class="s-page-loading__col" v-for="side in 2" :key="side">
        <view class="s-page-loading__card" v-for="n in listCount" :key="`${side}-${n}`">
          <view class="s-page-loading__shimmer s-page-loading__img" />
          <view class="s-page-loading__shimmer s-page-loading__line w-80" />
          <view class="s-page-loading__shimmer s-page-loading__line w-60" />
          <view class="s-page-loading__shimmer s-page-loading__line w-40" />
        </view>
      </view>
    </view>

    <!-- 首页装修 -->
    <view v-else-if="type === 'home'" class="s-page-loading__home">
      <view class="s-page-loading__shimmer s-page-loading__search" />
      <view class="s-page-loading__shimmer s-page-loading__banner" />
      <view class="s-page-loading__menu ss-flex ss-flex-wrap">
        <view
          class="s-page-loading__shimmer s-page-loading__menu-item"
          v-for="n in 10"
          :key="n"
        />
      </view>
      <view class="s-page-loading__home-title s-page-loading__shimmer" />
      <view class="s-page-loading__list ss-flex ss-flex-wrap ss-col-top">
        <view class="s-page-loading__col" v-for="side in 2" :key="`h-${side}`">
          <view class="s-page-loading__card" v-for="n in 2" :key="`h-${side}-${n}`">
            <view class="s-page-loading__shimmer s-page-loading__img s-page-loading__img--sm" />
            <view class="s-page-loading__shimmer s-page-loading__line w-80" />
            <view class="s-page-loading__shimmer s-page-loading__line w-50" />
          </view>
        </view>
      </view>
    </view>

    <!-- 订单/列表行 -->
    <view v-else-if="type === 'rows'" class="s-page-loading__rows">
      <view class="s-page-loading__row" v-for="n in rowCount" :key="n">
        <view class="s-page-loading__shimmer s-page-loading__row-thumb" />
        <view class="s-page-loading__row-body">
          <view class="s-page-loading__shimmer s-page-loading__line w-90" />
          <view class="s-page-loading__shimmer s-page-loading__line w-60" />
          <view class="s-page-loading__shimmer s-page-loading__line w-40" />
        </view>
      </view>
    </view>

    <!-- 收银台 -->
    <view v-else-if="type === 'pay'" class="s-page-loading__pay">
      <view class="s-page-loading__pay-card">
        <view class="s-page-loading__shimmer s-page-loading__pay-amount" />
        <view class="s-page-loading__shimmer s-page-loading__pay-sub" />
        <view class="s-page-loading__pay-label">选择支付方式</view>
        <view class="s-page-loading__pay-row" v-for="n in 2" :key="n">
          <view class="s-page-loading__shimmer s-page-loading__pay-icon" />
          <view class="s-page-loading__shimmer s-page-loading__line w-50" />
        </view>
      </view>
      <view class="s-page-loading__shimmer s-page-loading__pay-btn" />
    </view>

    <!-- 个人中心 -->
    <view v-else-if="type === 'user'" class="s-page-loading__user">
      <view class="s-page-loading__user-header">
        <view class="s-page-loading__user-profile ss-flex ss-col-center">
          <view class="s-page-loading__shimmer s-page-loading__user-avatar" />
          <view class="s-page-loading__user-info">
            <view class="s-page-loading__shimmer s-page-loading__line w-60" />
            <view class="s-page-loading__shimmer s-page-loading__line w-40" />
          </view>
        </view>
      </view>
      <view class="s-page-loading__user-orders ss-flex ss-row-between">
        <view
          class="s-page-loading__user-order-item ss-flex-col ss-col-center"
          v-for="n in 5"
          :key="n"
        >
          <view class="s-page-loading__shimmer s-page-loading__user-order-icon" />
          <view class="s-page-loading__shimmer s-page-loading__user-order-text" />
        </view>
      </view>
      <view class="s-page-loading__user-panel" v-for="n in 3" :key="`panel-${n}`">
        <view class="s-page-loading__shimmer s-page-loading__user-panel-title" />
        <view class="s-page-loading__shimmer s-page-loading__user-panel-body" />
      </view>
    </view>

    <!-- 购物车 -->
    <view v-else-if="type === 'cart'" class="s-page-loading__cart">
      <view class="s-page-loading__shimmer s-page-loading__cart-header" />
      <view class="s-page-loading__cart-item" v-for="n in rowCount" :key="n">
        <view class="s-page-loading__shimmer s-page-loading__cart-radio" />
        <view class="s-page-loading__shimmer s-page-loading__cart-thumb" />
        <view class="s-page-loading__cart-body">
          <view class="s-page-loading__shimmer s-page-loading__line w-90" />
          <view class="s-page-loading__shimmer s-page-loading__line w-60" />
          <view class="s-page-loading__cart-footer-row ss-flex ss-row-between ss-col-center">
            <view class="s-page-loading__shimmer s-page-loading__line w-40" />
            <view class="s-page-loading__shimmer s-page-loading__cart-stepper" />
          </view>
        </view>
      </view>
      <view class="s-page-loading__cart-bar ss-flex ss-row-between ss-col-center">
        <view class="s-page-loading__shimmer s-page-loading__cart-bar-left" />
        <view class="s-page-loading__shimmer s-page-loading__cart-bar-btn" />
      </view>
    </view>
  </view>
</template>

<script setup>
  defineProps({
    type: {
      type: String,
      default: 'inline',
    },
    tip: {
      type: String,
      default: '正在加载，请稍候…',
    },
    compact: {
      type: Boolean,
      default: false,
    },
    listCount: {
      type: Number,
      default: 3,
    },
    rowCount: {
      type: Number,
      default: 4,
    },
  });
</script>

<style lang="scss" scoped>
  .s-page-loading {
    min-height: 200rpx;
    padding: 8rpx 0 32rpx;
    background: #f6f7f9;

    &.is-compact {
      min-height: 0;
      padding: 24rpx 0;
      background: transparent;
    }

    &--inline {
      min-height: 360rpx;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #fff;
    }

    &--pay {
      min-height: 100vh;
      padding: 24rpx;
    }
  }

  .s-page-loading__tip {
    gap: 14rpx;
    padding: 28rpx 24rpx 24rpx;
  }

  .s-page-loading--inline .s-page-loading__tip {
    padding: 0;
  }

  .s-page-loading__spinner {
    width: 28rpx;
    height: 28rpx;
    border: 3rpx solid #ebebeb;
    border-top-color: var(--ui-BG-Main, #e93323);
    border-radius: 50%;
    animation: s-page-loading-spin 0.75s linear infinite;
    flex-shrink: 0;
  }

  .s-page-loading__tip-text {
    font-size: 26rpx;
    color: #888;
    line-height: 1.5;
  }

  .s-page-loading__shimmer {
    background: linear-gradient(90deg, #f0f0f0 25%, #e6e6e6 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: s-page-loading-shimmer 1.3s ease-in-out infinite;
    border-radius: 12rpx;
  }

  .s-page-loading__col {
    width: 50%;
    box-sizing: border-box;

    &:first-child .s-page-loading__card {
      margin-right: 10rpx;
    }

    &:last-child .s-page-loading__card {
      margin-left: 10rpx;
    }
  }

  .s-page-loading__card {
    margin-bottom: 20rpx;
    padding: 16rpx;
    border-radius: 16rpx;
    background: #fff;
  }

  .s-page-loading__img {
    width: 100%;
    height: 320rpx;
    border-radius: 12rpx;

    &--sm {
      height: 260rpx;
    }
  }

  .s-page-loading__line {
    height: 24rpx;
    margin-top: 16rpx;

    &.w-90 {
      width: 90%;
    }
    &.w-80 {
      width: 80%;
    }
    &.w-60 {
      width: 60%;
    }
    &.w-50 {
      width: 50%;
    }
    &.w-40 {
      width: 40%;
    }
  }

  .s-page-loading__home {
    padding: 0 20rpx;
  }

  .s-page-loading__search {
    height: 72rpx;
    margin: 12rpx 0 20rpx;
    border-radius: 36rpx;
  }

  .s-page-loading__banner {
    height: 280rpx;
    margin-bottom: 20rpx;
    border-radius: 16rpx;
  }

  .s-page-loading__menu {
    gap: 20rpx 0;
    margin-bottom: 28rpx;
    padding: 24rpx 16rpx;
    background: #fff;
    border-radius: 16rpx;
  }

  .s-page-loading__menu-item {
    width: 20%;
    height: 88rpx;
    margin: 0 auto;
    border-radius: 16rpx;
  }

  .s-page-loading__home-title {
    width: 180rpx;
    height: 36rpx;
    margin: 0 0 20rpx 8rpx;
  }

  .s-page-loading__rows {
    padding: 0 20rpx;
  }

  .s-page-loading__row {
    display: flex;
    gap: 20rpx;
    padding: 24rpx;
    margin-bottom: 16rpx;
    background: #fff;
    border-radius: 16rpx;
  }

  .s-page-loading__row-thumb {
    width: 148rpx;
    height: 148rpx;
    flex-shrink: 0;
    border-radius: 12rpx;
  }

  .s-page-loading__row-body {
    flex: 1;
    padding-top: 8rpx;
  }

  .s-page-loading__pay-card {
    padding: 48rpx 24rpx 32rpx;
    background: #fff;
    border-radius: 16rpx;
  }

  .s-page-loading__pay-amount {
    width: 240rpx;
    height: 56rpx;
    margin: 0 auto 20rpx;
  }

  .s-page-loading__pay-sub {
    width: 320rpx;
    height: 28rpx;
    margin: 0 auto 36rpx;
  }

  .s-page-loading__pay-label {
    padding: 0 6rpx 20rpx;
    font-size: 26rpx;
    font-weight: 500;
    color: #333;
  }

  .s-page-loading__pay-row {
    display: flex;
    align-items: center;
    gap: 20rpx;
    height: 86rpx;
    padding: 0 6rpx;
  }

  .s-page-loading__pay-icon {
    width: 36rpx;
    height: 36rpx;
    border-radius: 8rpx;
  }

  .s-page-loading__pay-btn {
    height: 80rpx;
    margin: 48rpx 0 40rpx;
    border-radius: 40rpx;
  }

  .s-page-loading__user {
    padding: 0 20rpx;
  }

  .s-page-loading__user-header {
    padding: 48rpx 24rpx 36rpx;
    margin-bottom: 16rpx;
    border-radius: 0 0 16rpx 16rpx;
    background: #fff0e6;
  }

  .s-page-loading__user-profile {
    gap: 24rpx;
  }

  .s-page-loading__user-avatar {
    width: 108rpx;
    height: 108rpx;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .s-page-loading__user-info {
    flex: 1;
    padding-top: 8rpx;
  }

  .s-page-loading__user-orders {
    padding: 28rpx 16rpx;
    margin-bottom: 16rpx;
    background: #fff;
    border-radius: 16rpx;
  }

  .s-page-loading__user-order-icon {
    width: 52rpx;
    height: 52rpx;
    margin-bottom: 12rpx;
    border-radius: 12rpx;
  }

  .s-page-loading__user-order-text {
    width: 56rpx;
    height: 20rpx;
    border-radius: 8rpx;
  }

  .s-page-loading__user-panel {
    padding: 24rpx;
    margin-bottom: 16rpx;
    background: #fff;
    border-radius: 16rpx;
  }

  .s-page-loading__user-panel-title {
    width: 160rpx;
    height: 32rpx;
    margin-bottom: 20rpx;
  }

  .s-page-loading__user-panel-body {
    width: 100%;
    height: 72rpx;
    border-radius: 12rpx;
  }

  .s-page-loading__cart {
    padding: 0 20rpx 120rpx;
  }

  .s-page-loading__cart-header {
    height: 70rpx;
    margin-bottom: 16rpx;
    border-radius: 12rpx;
  }

  .s-page-loading__cart-item {
    display: flex;
    gap: 16rpx;
    padding: 24rpx 16rpx;
    margin-bottom: 14rpx;
    background: #fff;
    border-radius: 16rpx;
  }

  .s-page-loading__cart-radio {
    width: 36rpx;
    height: 36rpx;
    margin-top: 56rpx;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .s-page-loading__cart-thumb {
    width: 160rpx;
    height: 160rpx;
    flex-shrink: 0;
    border-radius: 12rpx;
  }

  .s-page-loading__cart-body {
    flex: 1;
    padding-top: 8rpx;
  }

  .s-page-loading__cart-footer-row {
    margin-top: 20rpx;
  }

  .s-page-loading__cart-stepper {
    width: 148rpx;
    height: 44rpx;
    border-radius: 22rpx;
  }

  .s-page-loading__cart-bar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 100rpx;
    height: 100rpx;
    padding: 0 30rpx;
    background: #fff;
    box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.04);
  }

  .s-page-loading__cart-bar-left {
    width: 240rpx;
    height: 36rpx;
  }

  .s-page-loading__cart-bar-btn {
    width: 180rpx;
    height: 70rpx;
    border-radius: 40rpx;
  }

  @keyframes s-page-loading-shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }

  @keyframes s-page-loading-spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
