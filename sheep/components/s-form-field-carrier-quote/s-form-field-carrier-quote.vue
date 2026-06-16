<template>
  <view class="form-field-carrier-quote">
    <view v-if="!quotes.length" class="empty">请先填写地址和重量，点击「查询运费」</view>
    <view
      v-for="item in quotes"
      :key="item.kuaidicom"
      class="quote-card"
      :class="{ active: item.kuaidicom === selectedCode }"
      @tap="onSelect(item)"
    >
      <view class="head">
        <text class="name">{{ item.carrierName || item.kuaidicom }}</text>
        <text class="pay">¥{{ item.payPriceYuan || item.priceYuan || item.price }}</text>
      </view>
      <view class="meta">
        <text v-if="item.markupYuan">含服务费 ¥{{ item.markupYuan }}</text>
        <text v-if="item.serviceType">{{ item.serviceType }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
  import { computed } from 'vue';
  import { fieldProps, parseExpressQuotes } from '@/sheep/helper/productFormEngine';

  const emits = defineEmits(['apply']);

  const props = defineProps({
    field: { type: Object, default: () => ({}) },
    formValues: { type: Object, default: () => ({}) },
  });

  const actionProps = computed(() => fieldProps(props.field));
  const quotesKey = computed(() => actionProps.value.quotesKey || 'express_quotes_json');
  const selectionKey = computed(() => actionProps.value.selectionKey || 'kuaidicom');

  const quotes = computed(() => parseExpressQuotes(props.formValues?.[quotesKey.value]));

  const selectedCode = computed(() => String(props.formValues?.[selectionKey.value] || '').trim());

  function onSelect(item) {
    const patch = item?.formPatch || {};
    Object.entries(patch).forEach(([key, value]) => {
      emits('apply', { key, value: String(value ?? '') });
    });
    if (!patch[selectionKey.value] && item?.kuaidicom) {
      emits('apply', { key: selectionKey.value, value: String(item.kuaidicom) });
    }
  }
</script>

<style scoped lang="scss">
  .form-field-carrier-quote {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
  }

  .empty {
    font-size: 26rpx;
    color: #9ca3af;
    padding: 8rpx 0;
  }

  .quote-card {
    border: 2rpx solid #e5e7eb;
    border-radius: 16rpx;
    padding: 20rpx 24rpx;
    background: #fff;
  }

  .quote-card.active {
    border-color: #2563eb;
    background: #eff6ff;
  }

  .head {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .name {
    font-size: 28rpx;
    font-weight: 600;
    color: #111827;
  }

  .pay {
    font-size: 32rpx;
    font-weight: 700;
    color: #059669;
  }

  .meta {
    margin-top: 8rpx;
    display: flex;
    gap: 16rpx;
    font-size: 24rpx;
    color: #6b7280;
  }
</style>
