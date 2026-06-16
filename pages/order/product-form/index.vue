<!-- 通用 schema 驱动购买页：引擎只认 formSchema，不关心卡密/寄件/电影票等业务 -->
<template>
  <s-layout :title="pageTitle">
    <s-product-form-shell
      :product-id="state.productId"
      :hint="state.hint"
      :submit-label="state.submitLabel"
      @loaded="onLoaded"
    />
  </s-layout>
</template>

<script setup>
  import { reactive, ref } from 'vue';
  import { onLoad } from '@dcloudio/uni-app';
  import SProductFormShell from '@/sheep/components/s-product-form-shell/s-product-form-shell.vue';

  const pageTitle = ref('填写信息');
  const state = reactive({
    productId: '',
    hint: '提交后将进入确认订单并支付；履约结果可在订单详情查看。',
    submitLabel: '去下单支付',
  });

  function onLoaded(detail) {
    pageTitle.value = detail?.name || '填写信息';
  }

  onLoad((options) => {
    state.productId = options.id || options.slug || options.spuId || '';
  });
</script>
