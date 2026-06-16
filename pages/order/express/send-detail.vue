<!-- 寄件详情 -->
<template>
  <s-layout title="寄件详情">
    <view class="wrap" v-if="state.info.id">
      <view class="card">
        <view class="status">{{ state.info.statusText }}</view>
        <view class="line">快递公司：{{ state.info.kuaidicomName }}</view>
        <view class="line">运单号：{{ state.info.kuaidinum || '待分配' }}</view>
        <view class="line">预估/运费：¥{{ state.info.freight || state.info.priceEstimate || '-' }}</view>
        <view v-if="state.info.courierName" class="line">
          快递员：{{ state.info.courierName }} {{ state.info.courierMobile }}
        </view>
      </view>

      <view class="card">
        <view class="sub">寄：{{ state.info.sendName }} {{ state.info.sendMobile }}</view>
        <view class="addr">{{ state.info.sendAddr }}</view>
        <view class="sub mt">收：{{ state.info.recName }} {{ state.info.recMobile }}</view>
        <view class="addr">{{ state.info.recAddr }}</view>
      </view>

      <view class="card" v-if="state.tracks.length">
        <view class="section">物流轨迹</view>
        <view v-for="(item, idx) in state.tracks" :key="idx" class="track">
          <view class="track-time">{{ formatTime(item.time) }}</view>
          <view class="track-content">{{ item.content }}</view>
        </view>
      </view>

      <button v-if="state.info.canCancel" class="btn cancel" @tap="onCancel">取消寄件</button>
    </view>
  </s-layout>
</template>

<script setup>
import { reactive } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import sheep from '@/sheep';
import ExpressPickupApi from '@/sheep/api/trade/expressPickup';

const state = reactive({
  id: 0,
  info: {},
  tracks: [],
});

function formatTime(value) {
  if (!value) return '';
  if (typeof value === 'number') {
    return sheep.$helper.timeFormat(value, 'yyyy-mm-dd hh:MM:ss');
  }
  return value;
}

async function load() {
  const res = await ExpressPickupApi.get(state.id);
  if (res.code !== 0) {
    sheep.$helper.toast(res.msg || '加载失败');
    return;
  }
  state.info = res.data || {};
  const trackRes = await ExpressPickupApi.tracks(state.id);
  if (trackRes.code === 0) {
    state.tracks = trackRes.data || [];
  }
}

async function onCancel() {
  uni.showModal({
    title: '取消寄件',
    content: '确定取消本次上门取件？',
    success: async (res) => {
      if (!res.confirm) return;
      const { code, msg } = await ExpressPickupApi.cancel({ id: state.id, cancelMsg: '用户取消' });
      if (code !== 0) {
        sheep.$helper.toast(msg || '取消失败');
        return;
      }
      sheep.$helper.toast('已取消');
      load();
    },
  });
}

onLoad((options) => {
  state.id = Number(options.id || 0);
  if (!state.id) {
    sheep.$helper.toast('缺少寄件单号');
    return;
  }
  load();
});
</script>

<style scoped lang="scss">
.wrap { padding: 24rpx; }
.card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 20rpx; }
.status { font-size: 34rpx; font-weight: 600; margin-bottom: 16rpx; color: #2563eb; }
.line { font-size: 28rpx; color: #444; margin-bottom: 8rpx; }
.sub { font-size: 28rpx; color: #333; }
.addr { font-size: 26rpx; color: #666; margin-top: 8rpx; }
.mt { margin-top: 20rpx; }
.section { font-weight: 600; margin-bottom: 16rpx; }
.track { padding: 16rpx 0; border-top: 1px solid #f0f0f0; }
.track-time { font-size: 24rpx; color: #999; }
.track-content { font-size: 26rpx; color: #333; margin-top: 6rpx; }
.btn.cancel { margin-top: 20rpx; background: #fff; color: #b00020; border: 1px solid #f3c2c2; border-radius: 999rpx; }
</style>
