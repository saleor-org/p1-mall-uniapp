<!-- 个人中心：支持装修 -->
<template>
  <view v-if="template" class="user-page-root">
    <s-page-loading v-if="showUserLoading" type="user" :tip="userLoadingTip" />
    <view v-if="!showUserLoading">
      <s-layout
        title="我的"
        tabbar="/pages/index/user"
        navbar="custom"
        :bgStyle="template.page"
        :navbarStyle="template.navigationBar"
        onShareAppMessage
      >
        <s-block
          v-for="(item, index) in template.components"
          :key="index"
          :styles="item.property.style"
        >
          <s-block-item :type="item.id" :data="item.property" :styles="item.property.style" />
        </s-block>
      </s-layout>
    </view>
  </view>
  <view v-else-if="showUserLoading" class="user-loading-wrap">
    <s-page-loading type="user" :tip="userLoadingTip" />
  </view>
</template>

<script setup>
  import { computed } from 'vue';
  import { onShow, onPageScroll, onPullDownRefresh } from '@dcloudio/uni-app';
  import sheep from '@/sheep';

  // 隐藏原生tabBar
  uni.hideTabBar({
    fail: () => {},
  });

  const appStore = computed(() => sheep.$store('app'));
  const userLoading = computed(() => appStore.value.userLoading);
  const template = computed(() => appStore.value.template?.user);
  const hasUserContent = computed(() => (template.value?.components?.length || 0) > 0);
  const showUserLoading = computed(() => userLoading.value || !hasUserContent.value);
  const userLoadingTip = computed(() => {
    if (userLoading.value && hasUserContent.value) {
      return '正在更新个人中心…';
    }
    return '正在加载个人中心…';
  });

  onShow(() => {
    sheep.$store('user').updateUserData();
  });

  onPullDownRefresh(async () => {
    try {
      await Promise.all([
        sheep.$store('app').refreshUser(),
        sheep.$store('user').updateUserData({ force: true }),
      ]);
    } finally {
      uni.stopPullDownRefresh();
    }
  });

  onPageScroll(() => {});
</script>

<style></style>
