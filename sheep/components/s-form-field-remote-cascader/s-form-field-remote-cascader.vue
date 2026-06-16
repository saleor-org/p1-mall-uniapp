<template>
  <view class="form-field-remote-cascader">
    <view v-if="state.summary" class="summary">{{ state.summary }}</view>
    <view v-else class="placeholder">{{ levelLabel }}</view>

    <view v-if="state.breadcrumb.length" class="breadcrumb">
      <text v-for="(item, index) in state.breadcrumb" :key="index" class="crumb">
        {{ item.label }}<text v-if="index < state.breadcrumb.length - 1"> / </text>
      </text>
    </view>

    <picker
      :range="state.options"
      range-key="label"
      :disabled="state.loading || !state.options.length"
      @change="onPick"
    >
      <view class="picker-btn">{{ pickerText }}</view>
    </picker>

    <view v-if="state.loading" class="hint">加载中…</view>
    <view v-else-if="state.error" class="hint error">{{ state.error }}</view>
    <view v-else class="hint">{{ hintText }}</view>
  </view>
</template>

<script setup>
  import { computed, onMounted, reactive, watch } from 'vue';
  import sheep from '@/sheep';
  import FormRemoteApi from '@/sheep/api/trade/formRemote';
  import { fieldProps } from '@/sheep/helper/productFormEngine';

  const props = defineProps({
    field: { type: Object, default: () => ({}) },
    modelValue: { type: [String, Object], default: '' },
  });

  const emits = defineEmits(['update:modelValue', 'apply']);

  const state = reactive({
    loading: false,
    error: '',
    summary: '',
    breadcrumb: [],
    options: [],
    levelLabel: '请选择',
    levelCount: 0,
    path: [],
    labels: [],
  });

  const remoteProps = computed(() => fieldProps(props.field));
  const preset = computed(() => String(remoteProps.value.preset || '').trim());
  const targetKey = computed(() => String(remoteProps.value.targetKey || 'order_payload').trim());

  const hintText = computed(() =>
    preset.value.startsWith('mock-')
      ? '开发模拟选品：逐级选择后自动生成 order_payload'
      : '逐级选择完成后写入隐藏字段',
  );

  const pickerText = computed(() => {
    if (state.loading) return '加载中…';
    if (!state.options.length) return '暂无可选项';
    if (state.path.length >= state.levelCount && state.levelCount > 0) return '已完成选品';
    return `选择${state.levelLabel || '下一级'}`;
  });

  function parseValue(raw) {
    if (!raw) return {};
    if (typeof raw === 'object' && !Array.isArray(raw)) return { ...raw };
    const text = String(raw).trim();
    if (!text) return {};
    if (!text.startsWith('{')) return { summary: text };
    try {
      const parsed = JSON.parse(text);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) {
      return { summary: text };
    }
  }

  function applyParsed(parsed) {
    state.summary = String(parsed.summary || '').trim();
    state.path = Array.isArray(parsed.path) ? parsed.path.map(String) : [];
    state.labels = Array.isArray(parsed.labels) ? parsed.labels.map(String) : [];
    state.breadcrumb = state.path.map((value, index) => ({
      value,
      label: state.labels[index] || value,
    }));
  }

  async function loadOptions() {
    if (!preset.value) {
      state.error = '未配置 preset';
      return;
    }
    state.loading = true;
    state.error = '';
    try {
      const { code, data, msg } = await FormRemoteApi.cascaderOptions({
        preset: preset.value,
        path: state.path.join(','),
      });
      if (code !== 0) {
        state.error = msg || '加载选项失败';
        state.options = [];
        return;
      }
      state.levelLabel = data?.levelLabel || '请选择';
      state.levelCount = Number(data?.levelCount || 0);
      state.options = Array.isArray(data?.options) ? data.options : [];
    } catch (err) {
      state.error = err?.message || '加载选项失败';
      state.options = [];
    } finally {
      state.loading = false;
    }
  }

  async function completeSelection() {
    const { code, data, msg } = await FormRemoteApi.cascaderComplete({
      preset: preset.value,
      path: state.path,
      labels: state.labels,
    });
    if (code !== 0) {
      sheep.$helper.toast(msg || '选品失败');
      return false;
    }
    const pickJson = data?.pickValueJson || JSON.stringify(data?.pickValue || {});
    const payloadJson = data?.orderPayloadJson || JSON.stringify(data?.orderPayload || {});
    state.summary = data?.summary || state.summary;
    emits('update:modelValue', pickJson);
    emits('apply', { key: targetKey.value, value: payloadJson });
    sheep.$helper.toast('选品完成');
    return true;
  }

  async function onPick(e) {
    const index = Number(e?.detail?.value ?? -1);
    const option = state.options[index];
    if (!option || option.disabled) {
      sheep.$helper.toast('该项不可选');
      return;
    }
    state.path.push(String(option.value));
    state.labels.push(String(option.label || option.value));
    state.breadcrumb = state.path.map((value, idx) => ({
      value,
      label: state.labels[idx] || value,
    }));
    if (state.levelCount && state.path.length >= state.levelCount) {
      await completeSelection();
      return;
    }
    await loadOptions();
  }

  function validate() {
    if (!props.field?.required) return '';
    const parsed = parseValue(props.modelValue);
    if (!parsed.summary && !(Array.isArray(parsed.path) && parsed.path.length)) {
      return `请完成${props.field?.label || '选品'}`;
    }
    if (state.levelCount && Array.isArray(parsed.path) && parsed.path.length < state.levelCount) {
      return `请完成${props.field?.label || '选品'}`;
    }
    return '';
  }

  watch(
    () => props.modelValue,
    (value) => {
      applyParsed(parseValue(value));
    },
    { immediate: true },
  );

  onMounted(async () => {
    await loadOptions();
  });

  defineExpose({ validate, reload: loadOptions });
</script>

<style scoped lang="scss">
  .form-field-remote-cascader {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
  }

  .summary,
  .placeholder {
    font-size: 26rpx;
    color: #666;
  }

  .breadcrumb {
    font-size: 24rpx;
    color: #999;
  }

  .picker-btn {
    border: 1px solid #d1d5db;
    border-radius: 12rpx;
    padding: 18rpx 20rpx;
    font-size: 28rpx;
    color: #2563eb;
    background: #f8fafc;
  }

  .hint {
    font-size: 24rpx;
    color: #999;
    line-height: 1.5;
  }

  .hint.error {
    color: #b00020;
  }
</style>
