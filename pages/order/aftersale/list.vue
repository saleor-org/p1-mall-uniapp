<!-- 售后列表 -->
<template>
  <s-layout title="售后列表">
    <!-- tab -->
    <su-sticky bgColor="#fff">
      <su-tabs
        :list="tabMaps"
        :scrollable="false"
        @change="onTabsChange"
        :current="state.currentTab"
      />
    </su-sticky>
    <s-page-loading v-if="state.listLoading" type="rows" tip="正在加载售后…" />
    <s-empty
      v-else-if="state.pagination.total === 0"
      icon="/static/order-empty.png"
      text="暂无售后"
    />
    <!-- 列表 -->
    <view v-else-if="state.pagination.total > 0">
      <view
        class="list-box ss-m-y-20"
        v-for="order in state.pagination.list"
        :key="order.id"
        @tap="sheep.$router.go('/pages/order/aftersale/detail', { id: order.id })"
      >
        <view class="order-head ss-flex ss-col-center ss-row-between">
          <text class="no">服务单号：{{ order.no }}</text>
          <text class="state">{{ formatAfterSaleStatus(order) }}</text>
        </view>
        <s-goods-item
          :img="order.picUrl"
          :title="order.spuName"
          :skuText="order.properties.map((property) => property.valueName).join(' ')"
          :price="order.refundPrice"
        />
        <view class="apply-box ss-flex ss-col-center ss-row-between border-bottom ss-p-x-20">
          <view class="ss-flex ss-col-center">
            <view class="title ss-m-r-20">{{ order.way === 10 ? '仅退款' : '退款退货' }}</view>
            <view class="value">{{ formatAfterSaleStatusDescription(order) }}</view>
          </view>
          <text class="_icon-forward"></text>
        </view>
        <view class="tool-btn-box ss-flex ss-col-center ss-row-right ss-p-r-20">
          <view>
            <button
              class="ss-reset-button tool-btn"
              @tap.stop="onApply(order.id)"
              v-if="order?.buttons.includes('cancel')"
            >
              取消申请
            </button>
          </view>
        </view>
      </view>
    </view>
    <uni-load-more
      v-if="!state.listLoading && state.pagination.total > 0"
      :status="state.loadStatus"
      :content-text="{
        contentdown: '上拉加载更多',
      }"
      @tap="loadMore"
    />
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import { onLoad, onReachBottom, onPullDownRefresh, onShow } from '@dcloudio/uni-app';
  import { reactive } from 'vue';
  import { concat } from 'lodash-es';
  import {
    formatAfterSaleStatus,
    formatAfterSaleStatusDescription,
    handleAfterSaleButtons,
  } from '@/sheep/hooks/useGoods';
  import AfterSaleApi from '@/sheep/api/trade/afterSale';
  import { resetPagination } from '@/sheep/helper/utils';

  const state = reactive({
    currentTab: 0,
    showApply: false,
    pagination: {
      list: [],
      total: 0,
      pageNo: 1,
      pageSize: 10,
    },
    loadStatus: '',
    listLoading: true,
  });

  let listLoadSeq = 0;
  let pageReady = false;

  const tabMaps = [
    {
      name: '全部',
      value: [],
    },
    {
      name: '申请中',
      value: [10],
    },
    {
      name: '处理中',
      value: [20, 30, 40],
    },
    {
      name: '已完成',
      value: [50],
    },
    {
      name: '已拒绝',
      value: [61, 62, 63],
    },
  ];

  function onTabsChange(e) {
    if (state.currentTab === e.index) {
      return;
    }
    resetPagination(state.pagination);
    state.currentTab = e.index;
    state.listLoading = true;
    getOrderList();
  }

  async function getOrderList() {
    const seq = ++listLoadSeq;
    state.loadStatus = 'loading';
    let data;
    let code;
    try {
      ({ data, code } = await AfterSaleApi.getAfterSalePage({
        pageNo: state.pagination.pageNo,
        pageSize: state.pagination.pageSize,
        statuses: tabMaps[state.currentTab].value.join(','),
      }));
    } catch {
      if (seq !== listLoadSeq) {
        return;
      }
      state.listLoading = false;
      state.loadStatus = 'more';
      return;
    }
    if (seq !== listLoadSeq) {
      return;
    }
    state.listLoading = false;
    if (code !== 0 || !data) {
      state.loadStatus = 'more';
      return;
    }
    data.list.forEach((order) => handleAfterSaleButtons(order));
    if (state.pagination.pageNo === 1) {
      state.pagination.list = data.list;
    } else {
      state.pagination.list = concat(state.pagination.list, data.list);
    }
    state.pagination.total = data.total;
    state.loadStatus = state.pagination.list.length < state.pagination.total ? 'more' : 'noMore';
  }

  /** 从详情返回：保留当前列表，静默刷新第一页（与订单列表体验一致） */
  async function refreshFirstPageSilently() {
    const seq = ++listLoadSeq;
    const { data, code } = await AfterSaleApi.getAfterSalePage({
      pageNo: 1,
      pageSize: state.pagination.pageSize,
      statuses: tabMaps[state.currentTab].value.join(','),
    });
    if (seq !== listLoadSeq || code !== 0) {
      return;
    }
    data.list.forEach((order) => handleAfterSaleButtons(order));
    state.pagination.pageNo = 1;
    state.pagination.list = data.list;
    state.pagination.total = data.total;
    state.loadStatus = state.pagination.list.length < state.pagination.total ? 'more' : 'noMore';
  }

  function onApply(orderId) {
    uni.showModal({
      title: '提示',
      content: '确定要取消此申请吗？',
      success: async function (res) {
        if (!res.confirm) {
          return;
        }
        const { code } = await AfterSaleApi.cancelAfterSale(orderId);
        if (code === 0) {
          resetPagination(state.pagination);
          state.listLoading = true;
          await getOrderList();
        }
      },
    });
  }

  onLoad(async (options) => {
    if (options.type) {
      state.currentTab = Number(options.type) || 0;
    }
    await getOrderList();
    pageReady = true;
  });

  onShow(async () => {
    if (!pageReady || state.listLoading) {
      return;
    }
    await refreshFirstPageSilently();
  });

  function loadMore() {
    if (state.loadStatus === 'noMore' || state.listLoading) {
      return;
    }
    state.pagination.pageNo++;
    getOrderList();
  }

  onReachBottom(() => {
    loadMore();
  });

  onPullDownRefresh(async () => {
    resetPagination(state.pagination);
    state.listLoading = true;
    try {
      await getOrderList();
    } finally {
      uni.stopPullDownRefresh();
    }
  });
</script>

<style lang="scss" scoped>
  .list-box {
    background-color: #fff;

    .order-head {
      padding: 0 25rpx;
      height: 77rpx;
    }

    .apply-box {
      height: 82rpx;

      .title {
        font-size: 24rpx;
      }

      .value {
        font-size: 22rpx;
        color: $dark-6;
      }
    }

    .tool-btn-box {
      height: 100rpx;

      .tool-btn {
        width: 160rpx;
        height: 60rpx;
        background: #f6f6f6;
        border-radius: 30rpx;
        font-size: 26rpx;
        font-weight: 400;
      }
    }
  }
</style>
