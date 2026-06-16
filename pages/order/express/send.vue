<!-- 寄快递：走通用 schema 购买页，商品 slug 默认 express-pickup -->
<template>
  <s-layout title="寄快递">
    <s-product-form-shell
      product-id="express-pickup"
      hint="提交后将进入确认订单并支付；支付成功后由履约 Router 向快递100代下单。"
      submit-label="去下单支付"
      @loaded="onLoaded"
    />
    <view class="footer-link">
      <button class="link-btn" @tap="goOrders">我的订单</button>
    </view>
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import SProductFormShell from '@/sheep/components/s-product-form-shell/s-product-form-shell.vue';

  function onLoaded(detail) {
    if (!detail?.formSchema?.length) {
      uni.showToast({
        title: '请在 Dashboard 为寄件商品配置表单 Schema',
        icon: 'none',
      });
    }
  }

  function goOrders() {
    sheep.$router.go('/pages/order/list');
  }
</script>

<style scoped lang="scss">
  .footer-link {
    padding: 0 24rpx 24rpx;
  }

  .link-btn {
    background: transparent;
    color: #2563eb;
    font-size: 28rpx;
  }
</style>
