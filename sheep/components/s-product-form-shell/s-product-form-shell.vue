<template>
  <view class="product-form-shell">
    <view v-if="state.loading" class="tip">加载中…</view>
    <view v-else-if="state.error" class="tip">{{ state.error }}</view>
    <view v-else class="card">
      <view v-if="state.productName" class="product-name">{{ state.productName }}</view>
      <s-product-form-fields
        v-if="state.fields.length"
        ref="formFieldsRef"
        :fields="state.fields"
        v-model="state.formValues"
      />
      <view v-else class="tip">该商品未配置下单表单，请在 Dashboard「商品表单」中添加字段。</view>
      <view v-if="state.hint" class="hint">{{ state.hint }}</view>
      <button v-if="state.fields.length" class="submit-btn" @tap="onSubmit">{{ submitLabel }}</button>
    </view>
  </view>
</template>

<script setup>
  import { reactive, ref, watch } from 'vue';
  import sheep from '@/sheep';
  import SpuApi from '@/sheep/api/product/spu';
  import SProductFormFields from '@/sheep/components/s-product-form-fields/s-product-form-fields.vue';
  import {
    buildCheckoutPayload,
    checkoutFieldsFromSchema,
    flattenFormValues,
  } from '@/sheep/helper/productFormEngine';

  const props = defineProps({
    productId: { type: String, default: '' },
    submitLabel: { type: String, default: '去下单支付' },
    hint: { type: String, default: '' },
    skuId: { type: String, default: '' },
    count: { type: Number, default: 1 },
    requiresShipping: { type: Boolean, default: null },
  });

  const emits = defineEmits(['loaded', 'submit']);

  const formFieldsRef = ref(null);
  const state = reactive({
    loading: false,
    error: '',
    productName: '',
    fields: [],
    formValues: {},
    skuId: '',
    requiresShipping: true,
    hint: props.hint,
  });

  async function loadProduct(productId) {
    if (!productId) {
      state.error = '缺少商品标识';
      return;
    }
    state.loading = true;
    state.error = '';
    try {
      const res = await SpuApi.getSpuDetail(productId);
      if (res.code !== 0 || !res.data) {
        state.error = res.msg || '商品不存在';
        return;
      }
      const detail = res.data;
      state.productName = detail.name || productId;
      state.fields = checkoutFieldsFromSchema(detail.formSchema || []);
      const firstSku = (detail.skus || [])[0];
      state.skuId = props.skuId || firstSku?.id || '';
      state.requiresShipping = props.requiresShipping ?? detail.requiresShipping !== false;
      emits('loaded', detail);
    } catch (err) {
      state.error = err?.message || '加载失败';
    } finally {
      state.loading = false;
    }
  }

  function onSubmit() {
    const formError = formFieldsRef.value?.validate?.(state.formValues) || '';
    if (formError) {
      sheep.$helper.toast(formError);
      return;
    }
    if (!state.skuId) {
      sheep.$helper.toast('未找到可售规格');
      return;
    }
    const flatValues = flattenFormValues(state.fields, formFieldsRef.value?.getValues?.() || state.formValues);
    const payload = buildCheckoutPayload({
      skuId: state.skuId,
      count: props.count,
      formValues: flatValues,
      requiresShipping: state.requiresShipping,
    });
    emits('submit', payload);
    sheep.$router.go('/pages/order/confirm', {
      data: JSON.stringify(payload),
    });
  }

  watch(
    () => props.productId,
    (value) => {
      if (value) {
        loadProduct(value);
      }
    },
    { immediate: true },
  );

  watch(
    () => props.hint,
    (value) => {
      state.hint = value || '';
    },
  );

  defineExpose({ reload: () => loadProduct(props.productId), onSubmit });
</script>

<style scoped lang="scss">
  .product-form-shell {
    padding: 24rpx;
  }

  .tip,
  .hint {
    color: #888;
    font-size: 26rpx;
    line-height: 1.6;
  }

  .card {
    background: #fff;
    border-radius: 16rpx;
    padding: 24rpx;
  }

  .product-name {
    font-size: 32rpx;
    font-weight: 600;
    margin-bottom: 20rpx;
  }

  .hint {
    margin: 16rpx 0;
  }

  .submit-btn {
    margin-top: 28rpx;
    border-radius: 999rpx;
    background: linear-gradient(90deg, var(--ui-BG-Main), var(--ui-BG-Main-gradient));
    color: #fff;
    font-size: 30rpx;
  }
</style>
