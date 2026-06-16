<template>
  <view v-if="visible" class="form-field-fee-breakdown" :class="{ readonly: readonly }">
    <view v-if="field?.label" class="title">{{ field.label }}</view>
    <view v-if="markupRuleLabel" class="rule-tip">服务费规则：{{ markupRuleLabel }}</view>
    <view
      v-for="(row, index) in rows"
      :key="`${row.label}-${index}`"
      class="row"
      :class="{ emphasis: row.emphasis }"
    >
      <text class="label">{{ row.label }}</text>
      <text class="value">{{ row.value }}</text>
    </view>
  </view>
</template>

<script setup>
  import { computed } from 'vue';
  import { buildFeeBreakdownRows, fieldProps } from '@/sheep/helper/productFormEngine';

  const props = defineProps({
    field: { type: Object, default: () => ({}) },
    formValues: { type: Object, default: () => ({}) },
    feeRows: { type: Array, default: () => [] },
    markupRuleLabel: { type: String, default: '' },
    readonly: { type: Boolean, default: false },
  });

  const actionProps = computed(() => fieldProps(props.field));

  const rows = computed(() => {
    if (props.feeRows?.length) {
      return props.feeRows;
    }
    return buildFeeBreakdownRows(props.field, props.formValues);
  });

  const visible = computed(() => {
    if (!rows.value.length) {
      return !actionProps.value.hideWhenEmpty;
    }
    return true;
  });

  const markupRuleLabel = computed(
    () => props.markupRuleLabel || props.formValues?.express_markup_rule_label || '',
  );
</script>

<style scoped lang="scss">
  .form-field-fee-breakdown {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
    padding: 20rpx 24rpx;
    border-radius: 16rpx;
    background: #f8fafc;
  }

  .title {
    font-size: 28rpx;
    font-weight: 600;
    color: #111827;
  }

  .rule-tip {
    font-size: 24rpx;
    color: #6b7280;
  }

  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 26rpx;
    color: #374151;
  }

  .row.emphasis {
    margin-top: 4rpx;
    padding-top: 12rpx;
    border-top: 1rpx solid #e5e7eb;
    font-weight: 600;
    color: #111827;
  }

  .value {
    color: #059669;
  }

  .readonly {
    margin-top: 12rpx;
  }
</style>
