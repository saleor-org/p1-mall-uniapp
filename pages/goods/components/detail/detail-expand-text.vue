<template>
  <view v-if="text" class="detail-expand-text" @tap="toggle">
    <view
      class="detail-expand-text__body"
      :class="[textClass, !expanded && maxLines ? `ss-line-${maxLines}` : '']"
    >
      {{ text }}
    </view>
    <view v-if="canExpand" class="detail-expand-text__action">
      {{ expanded ? '收起' : '展开' }}
    </view>
  </view>
</template>

<script setup>
  import { computed, ref, watch } from 'vue';

  const props = defineProps({
    text: {
      type: String,
      default: '',
    },
    maxLines: {
      type: Number,
      default: 2,
    },
    textClass: {
      type: String,
      default: '',
    },
  });

  const expanded = ref(false);

  /** 移动端约 18 个汉字一行，用于决定是否展示展开 */
  const canExpand = computed(() => {
    const value = (props.text || '').trim();
    if (!value) {
      return false;
    }
    return value.length > props.maxLines * 18;
  });

  watch(
    () => props.text,
    () => {
      expanded.value = false;
    },
  );

  function toggle() {
    if (!canExpand.value) {
      return;
    }
    expanded.value = !expanded.value;
  }
</script>

<style lang="scss" scoped>
  .detail-expand-text {
    &__body {
      word-break: break-all;
    }

    &__action {
      margin-top: 8rpx;
      font-size: 24rpx;
      color: var(--ui-BG-Main, #e93323);
      text-align: right;
    }
  }
</style>
