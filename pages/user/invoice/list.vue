<!-- 发票抬头管理 -->
<template>
  <s-layout :bgStyle="{ color: '#FFF' }" title="发票管理">
    <view v-if="state.list.length" class="ss-p-20">
      <view
        v-for="item in state.list"
        :key="item.id"
        class="invoice-card ss-m-b-20 ss-p-20"
        @tap="onSelect(item)"
      >
        <view class="ss-flex ss-row-between ss-col-center">
          <text class="title ss-font-30">{{ item.title }}</text>
          <text v-if="item.defaultStatus" class="tag">默认</text>
        </view>
        <view class="ss-font-24 ss-m-t-10 sub">
          {{ item.type === 2 ? '企业' : '个人' }}
          <text v-if="item.taxNo"> · 税号 {{ item.taxNo }}</text>
        </view>
        <view class="ss-flex ss-m-t-16">
          <button class="ss-reset-button btn" @tap.stop="onEdit(item.id)">编辑</button>
          <button class="ss-reset-button btn danger" @tap.stop="onDelete(item.id)">删除</button>
        </view>
      </view>
    </view>
    <s-empty v-if="!state.list.length && !state.loading" text="暂无发票抬头" icon="/static/data-empty.png" />
    <su-fixed bottom placeholder>
      <view class="footer-box ss-p-20">
        <button class="add-btn ss-reset-button ui-Shadow-Main" @tap="onAdd">新增发票抬头</button>
      </view>
    </su-fixed>
  </s-layout>
</template>

<script setup>
  import { reactive } from 'vue';
  import { onLoad, onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import InvoiceApi from '@/sheep/api/trade/invoice';

  const state = reactive({
    list: [],
    loading: true,
    orderId: 0,
    applyMode: false,
  });

  async function loadList() {
    state.loading = true;
    const { code, data } = await InvoiceApi.getTitleList();
    state.loading = false;
    if (code === 0) {
      state.list = data || [];
    }
  }

  function onAdd() {
    sheep.$router.go('/pages/user/invoice/edit');
  }

  function onEdit(id) {
    sheep.$router.go('/pages/user/invoice/edit', { id });
  }

  async function onDelete(id) {
    uni.showModal({
      title: '提示',
      content: '确认删除该发票抬头？',
      success: async (res) => {
        if (!res.confirm) return;
        const { code } = await InvoiceApi.deleteTitle(id);
        if (code === 0) loadList();
      },
    });
  }

  async function onSelect(item) {
    if (!state.applyMode || !state.orderId) return;
    const { code } = await InvoiceApi.applyOrderInvoice(state.orderId, item.id);
    if (code === 0) {
      sheep.$router.back();
    }
  }

  onLoad((query) => {
    state.orderId = Number(query.orderId || 0);
    state.applyMode = query.mode === 'apply';
  });

  onShow(() => {
    loadList();
  });
</script>

<style lang="scss" scoped>
  .invoice-card {
    border: 1px solid #eee;
    border-radius: 12rpx;
    background: #fff;
  }
  .title {
    font-weight: 600;
  }
  .sub {
    color: #888;
  }
  .tag {
    font-size: 22rpx;
    color: #ff6000;
    border: 1px solid #ff6000;
    border-radius: 8rpx;
    padding: 2rpx 10rpx;
  }
  .btn {
    font-size: 24rpx;
    margin-right: 20rpx;
    color: #333;
  }
  .danger {
    color: #b00020;
  }
  .add-btn {
    width: 100%;
    height: 80rpx;
    line-height: 80rpx;
    border-radius: 40rpx;
    color: #fff;
    background: var(--ui-BG-Main);
  }
</style>
