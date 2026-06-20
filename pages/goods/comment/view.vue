<!-- 查看订单评价 -->
<template>
  <s-layout title="我的评价">
    <view v-if="state.comments.length" class="comment-wrap">
      <view v-for="item in state.comments" :key="item.id" class="comment-card">
        <view class="goods-row ss-flex ss-col-center ss-m-b-20">
          <text class="goods-name">{{ item.spuName }}</text>
        </view>
        <comment-item :item="item" />
      </view>
    </view>
    <s-empty v-else text="暂无评价" icon="/static/data-empty.png" />
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import { onLoad } from '@dcloudio/uni-app';
  import { reactive } from 'vue';
  import OrderApi from '@/sheep/api/trade/order';
  import commentItem from '../components/detail/comment-item.vue';

  const state = reactive({
    id: null,
    comments: [],
  });

  onLoad(async (options) => {
    if (!options.id) {
      sheep.$helper.toast('缺少订单信息');
      return;
    }
    state.id = options.id;
    const { code, data } = await OrderApi.getOrderComments(state.id);
    if (code !== 0) {
      sheep.$helper.toast('加载评价失败');
      return;
    }
    state.comments = data || [];
  });
</script>

<style lang="scss" scoped>
  .comment-wrap {
    padding: 20rpx;
  }

  .comment-card {
    background: #fff;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
  }

  .goods-name {
    font-size: 28rpx;
    font-weight: 600;
    color: #333;
  }
</style>
