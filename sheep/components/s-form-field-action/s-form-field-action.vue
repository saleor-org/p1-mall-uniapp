<template>
  <view class="form-field-action">
    <button class="action-btn" :loading="state.loading" @tap="onRun">{{ buttonText }}</button>
    <view v-if="state.message" class="result">{{ state.message }}</view>
  </view>
</template>

<script setup>
  import { computed, reactive } from 'vue';
  import sheep from '@/sheep';
  import DevMockApi from '@/sheep/api/dev/mock';
  import ExpressPickupApi from '@/sheep/api/trade/expressPickup';
  import { fieldProps, parseAddressPayload, resolveDependsOnValues } from '@/sheep/helper/productFormEngine';

  const emits = defineEmits(['apply']);

  const props = defineProps({
    field: { type: Object, default: () => ({}) },
    formValues: { type: Object, default: () => ({}) },
  });

  const state = reactive({
    loading: false,
    message: '',
  });

  const actionProps = computed(() => fieldProps(props.field));
  const buttonText = computed(
    () => actionProps.value.buttonText || actionProps.value.buttonLabel || props.field?.label || '执行',
  );

  function resolveText(key) {
    const raw = props.formValues?.[key];
    if (raw === undefined || raw === null) return '';
    const text = String(raw).trim();
    if (!text) return '';
    if (text.startsWith('{')) {
      const address = parseAddressPayload(text);
      return address.full || address.detail || text;
    }
    return text;
  }

  async function runExpressQuoteAll() {
    const deps = resolveDependsOnValues(actionProps.value.dependsOn, props.formValues);
    const sendAddr = deps.send_addr || resolveText('send_addr');
    const recAddr = deps.rec_addr || resolveText('rec_addr');
    const weight = deps.weight || resolveText('weight') || '1';
    if (!sendAddr || !recAddr) {
      sheep.$helper.toast('请填写寄/收件地址');
      return;
    }
    state.loading = true;
    try {
      emits('apply', { key: 'kuaidicom', value: '' });
      emits('apply', { key: 'express_pay_price_fen', value: '' });
      const result = await ExpressPickupApi.quoteAll({
        sendDetailAddress: sendAddr,
        recDetailAddress: recAddr,
        weight,
      });
      if (!result || typeof result !== 'object') {
        sheep.$helper.toast('查价超时，请稍后重试');
        return;
      }
      const { code, data, msg } = result;
      if (code !== 0) {
        sheep.$helper.toast(msg || '查价失败');
        return;
      }
      const patch = data?.formPatch || {};
      Object.entries(patch).forEach(([key, value]) => {
        emits('apply', { key, value: String(value ?? '') });
      });
      const count = Array.isArray(data?.quotes) ? data.quotes.length : 0;
      state.message = count ? `已查询 ${count} 家快递，请选择下单` : '查价成功';
    } finally {
      state.loading = false;
    }
  }

  async function runExpressQuote() {
    const deps = resolveDependsOnValues(actionProps.value.dependsOn, props.formValues);
    const kuaidicom = deps.kuaidicom || resolveText('kuaidicom');
    const sendAddr = deps.send_addr || resolveText('send_addr');
    const recAddr = deps.rec_addr || resolveText('rec_addr');
    const weight = deps.weight || resolveText('weight') || '1';
    if (!kuaidicom) {
      sheep.$helper.toast('请选择快递公司');
      return;
    }
    if (!sendAddr || !recAddr) {
      sheep.$helper.toast('请填写寄/收件地址');
      return;
    }
    state.loading = true;
    try {
      const result = await ExpressPickupApi.quote({
        kuaidicom,
        sendDetailAddress: sendAddr,
        recDetailAddress: recAddr,
        weight,
      });
      if (!result || typeof result !== 'object') {
        sheep.$helper.toast('查价超时，请稍后重试');
        return;
      }
      const { code, data, msg } = result;
      if (code !== 0) {
        sheep.$helper.toast(msg || '查价失败');
        return;
      }
      const payYuan = data?.payPriceYuan || data?.priceYuan || data?.price || '';
      const markupYuan = data?.markupYuan || '';
      const ruleLabel = data?.markupRuleLabel || '';
      const patch = data?.formPatch || {};
      Object.entries(patch).forEach(([key, value]) => {
        emits('apply', { key, value: String(value ?? '') });
      });
      if (payYuan) {
        const parts = [`微信支付运费 ¥${payYuan}`];
        if (markupYuan) parts.push(`含服务费 ¥${markupYuan}`);
        if (ruleLabel) parts.push(`(${ruleLabel})`);
        state.message = parts.join(' ');
      } else {
        state.message = '查价成功';
      }
    } finally {
      state.loading = false;
    }
  }

  async function runMockOAuthPick() {
    const scene = actionProps.value.scene || 'movie';
    state.loading = true;
    try {
      const { code, data, msg } = await DevMockApi.buildOAuthPayload({ scene });
      if (code !== 0) {
        sheep.$helper.toast(msg || '模拟选品失败');
        return;
      }
      const targetKey = (actionProps.value.dependsOn || [])[0] || 'order_payload';
      const payload = data.orderPayloadJson || JSON.stringify(data.orderPayload || {});
      emits('apply', { key: targetKey, value: payload });
      state.message = '已生成模拟选品';
      sheep.$helper.toast('已生成模拟选品');
    } finally {
      state.loading = false;
    }
  }

  async function onRun() {
    const action = String(actionProps.value.action || '').trim();
    if (action === 'express-quote-all') {
      await runExpressQuoteAll();
      return;
    }
    if (action === 'express-quote') {
      await runExpressQuote();
      return;
    }
    if (action === 'mock-oauth-pick') {
      await runMockOAuthPick();
      return;
    }
    if (action === 'navigate' && actionProps.value.navigateTo) {
      sheep.$router.go(actionProps.value.navigateTo);
      return;
    }
    sheep.$helper.toast(`未支持的操作：${action || '(空)'}`);
  }
</script>

<style scoped lang="scss">
  .form-field-action {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
  }

  .action-btn {
    background: #2563eb;
    color: #fff;
    border-radius: 12rpx;
    font-size: 28rpx;
    line-height: 2.2;
  }

  .result {
    font-size: 26rpx;
    color: #059669;
  }
</style>
