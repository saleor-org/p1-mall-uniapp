<template>
  <s-page-loading type="list" :tip="tipText" :list-count="listCount" />
</template>

<script setup>
  defineProps({
    tipText: {
      type: String,
      default: '正在加载商品…',
    },
    listCount: {
      type: Number,
      default: 3,
    },
  });
</script>
