<!-- 分销权限弹窗：无权限时提示或引导申请 -->
<template>
  <su-popup
    :show="state.show"
    type="center"
    round="10"
    @close="state.show = false"
    :isMaskClick="false"
    maskBackgroundColor="rgba(0, 0, 0, 0.7)"
  >
    <view class="notice-box">
      <view class="img-wrap">
        <image
          class="notice-img"
          :src="sheep.$url.static('/static/img/shop/commission/forbidden.png')"
          mode="aspectFill"
        />
      </view>
      <view class="notice-title">{{ state.title }}</view>
      <view class="notice-detail">{{ state.detail }}</view>
      <textarea
        v-if="state.mode === 'apply'"
        v-model="state.reason"
        class="reason-input"
        placeholder="可选：填写申请理由"
        maxlength="200"
      />
      <button
        v-if="state.mode === 'apply'"
        class="ss-reset-button notice-btn ui-Shadow-Main ui-BG-Main-Gradient"
        @tap="submitApply"
      >
        提交申请
      </button>
      <button
        class="ss-reset-button notice-btn ui-Shadow-Main ui-BG-Main-Gradient"
        v-else-if="state.mode !== 'pending'"
        @tap="sheep.$router.back()"
      >
        知道了
      </button>
      <button class="ss-reset-button back-btn" @tap="sheep.$router.back()"> 返回 </button>
    </view>
  </su-popup>
</template>

<script setup>
  import { onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import { reactive } from 'vue';
  import BrokerageApi from '@/sheep/api/trade/brokerage';

  const state = reactive({
    show: false,
    mode: 'forbidden',
    title: '抱歉！您没有分销权限',
    detail: '该功能暂不可用',
    reason: '',
  });

  onShow(async () => {
    const { code, data } = await BrokerageApi.getBrokerageUser();
    if (code !== 0 || data?.brokerageEnabled) {
      state.show = false;
      return;
    }
    const applyRes = await BrokerageApi.getBrokerageApplyStatus();
    const apply = applyRes.code === 0 ? applyRes.data : null;
    if (apply?.status === 0) {
      state.mode = 'pending';
      state.title = '分销员申请审核中';
      state.detail = '请耐心等待后台审核';
      state.show = true;
      return;
    }
    if (apply?.canApply) {
      state.mode = 'apply';
      state.title = '申请成为分销员';
      state.detail =
        apply.status === 20 && apply.auditReason
          ? `上次拒绝：${apply.auditReason}，可重新申请`
          : '提交后由运营审核开通分销权限';
      state.show = true;
      return;
    }
    state.mode = 'forbidden';
    state.title = '抱歉！您没有分销权限';
    state.detail = '该功能暂不可用';
    state.show = true;
  });

  async function submitApply() {
    const { code, msg } = await BrokerageApi.createBrokerageApply({ reason: state.reason || '' });
    if (code === 0) {
      state.mode = 'pending';
      state.title = '已提交申请';
      state.detail = '请等待后台审核';
      return;
    }
    sheep.$helper.toast(msg || '提交失败');
  }
</script>

<style lang="scss" scoped>
  .notice-box {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: #fff;
    width: 612rpx;
    min-height: 658rpx;
    background: #ffffff;
    padding: 30rpx;
    border-radius: 20rpx;
    .img-wrap {
      margin-bottom: 50rpx;
      .notice-img {
        width: 180rpx;
        height: 170rpx;
      }
    }
    .notice-title {
      font-size: 35rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 28rpx;
    }
    .notice-detail {
      font-size: 28rpx;
      font-weight: 400;
      color: #999999;
      line-height: 36rpx;
      margin-bottom: 50rpx;
      text-align: center;
    }
    .reason-input {
      width: 492rpx;
      min-height: 120rpx;
      border: 1px solid #eee;
      border-radius: 12rpx;
      padding: 16rpx;
      font-size: 26rpx;
      margin-bottom: 24rpx;
    }
    .notice-btn {
      width: 492rpx;
      line-height: 70rpx;
      border-radius: 35rpx;
      font-size: 28rpx;
      font-weight: 500;
      color: #ffffff;
      margin-bottom: 10rpx;
    }
    .back-btn {
      width: 492rpx;
      line-height: 70rpx;
      font-size: 28rpx;
      font-weight: 500;
      color: var(--ui-BG-Main-gradient);
      background: none;
    }
  }
</style>
