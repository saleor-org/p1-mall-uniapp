<!-- 我的寄件 -->
<template>
  <s-layout title="我的寄件">
    <view class="wrap">
      <view v-if="!state.list.length && !state.loading" class="empty">暂无寄件记录</view>
      <view
        v-for="item in state.list"
        :key="item.id"
        class="card"
        @tap="goDetail(item.id)"
      >
        <view class="head">
          <text>{{ item.kuaidicomName }}</text>
          <text class="status">{{ item.statusText }}</text>
        </view>
        <view class="line">{{ item.sendAddr }} → {{ item.recAddr }}</view>
        <view class="line muted">运单：{{ item.kuaidinum || '待分配' }}</view>
      </view>
    </view>
  </s-layout>
</template>

<script setup>
import { reactive } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import sheep from '@/sheep';
import ExpressPickupApi from '@/sheep/api/trade/expressPickup';

const state = reactive({
  list: [],
  loading: false,
});

function goDetail(id) {
  sheep.$router.go('/pages/order/express/send-detail', { id });
}

async function load() {
  state.loading = true;
  const res = await ExpressPickupApi.page({ pageNo: 1, pageSize: 20 });
  state.loading = false;
  if (res.code === 0) {
    state.list = res.data?.list || [];
  }
}

onShow(() => {
  load();
});
</script>

<style scoped lang="scss">
.wrap { padding: 24rpx; }
.empty { text-align: center; color: #999; padding: 80rpx 0; }
.card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 20rpx; }
.head { display: flex; justify-content: space-between; font-size: 30rpx; font-weight: 600; }
.status { color: #2563eb; font-size: 26rpx; font-weight: 500; }
.line { font-size: 26rpx; color: #444; margin-top: 12rpx; }
.muted { color: #888; }
</style>
