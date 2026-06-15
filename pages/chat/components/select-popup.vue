<template>
  <su-popup :show="show" showClose round="10" backgroundColor="#eee" @close="emits('close')">
    <view class="select-popup">
      <view class="title">
        <span>{{ titleText }}</span>
      </view>
      <scroll-view
        class="scroll-box"
        scroll-y="true"
        :scroll-with-animation="true"
        :show-scrollbar="false"
        @scrolltolower="loadmore"
      >
        <view
          class="item"
          v-for="item in state.pagination.data"
          :key="itemKey(item)"
          @tap="emits('select', { type: mode, data: item })"
        >
          <template v-if="mode == 'goods'">
            <GoodsItem :goodsData="item" />
          </template>
          <template v-if="mode == 'order'">
            <OrderItem :orderData="item" />
          </template>
        </view>
        <uni-load-more :status="state.loadStatus" :content-text="{ contentdown: '上拉加载更多' }" />
      </scroll-view>
    </view>
  </su-popup>
</template>

<script setup>
  import { computed, reactive, watch } from 'vue';
  import { concat } from 'lodash-es';
  import GoodsItem from './goods.vue';
  import OrderItem from './order.vue';
  import OrderApi from '@/sheep/api/trade/order';
  import SpuHistoryApi from '@/sheep/api/product/history';
  import SpuApi from '@/sheep/api/product/spu';
  import { isSaleorBff } from '@/sheep/helper/saleor';
  import { mapSaleorSpuToChatGoods } from '@/sheep/helper/vocechat-cards';

  const emits = defineEmits(['select', 'close']);
  const props = defineProps({
    mode: {
      type: String,
      default: 'goods',
    },
    show: {
      type: Boolean,
      default: false,
    },
  });

  const PAGE_SIZE = 5;

  const titleText = computed(() => {
    if (props.mode === 'goods') {
      return isSaleorBff ? '选择商品' : '我的浏览';
    }
    return '我的订单';
  });

  const state = reactive({
    loadStatus: '',
    pagination: {
      data: [],
      pageNo: 1,
      total: 0,
      lastPage: 1,
    },
  });

  function itemKey(item) {
    if (props.mode === 'goods') {
      return item.spuId || item.id;
    }
    return item.id;
  }

  function resetList() {
    state.pagination.data = [];
    state.pagination.pageNo = 1;
    state.pagination.total = 0;
    state.pagination.lastPage = 1;
  }

  watch(
    () => props.mode,
    () => {
      resetList();
      if (props.mode) {
        getList(1);
      }
    },
  );

  watch(
    () => props.show,
    (visible) => {
      if (visible && props.mode) {
        resetList();
        getList(1);
      }
    },
  );

  async function getList(pageNo, pageSize = PAGE_SIZE) {
    state.loadStatus = 'loading';
    let list = [];
    let hasMore = false;

    if (props.mode === 'goods') {
      if (isSaleorBff) {
        const res = await SpuApi.getSpuPage({ pageNo, pageSize });
        if (res.code !== 0) {
          state.loadStatus = 'noMore';
          return;
        }
        list = (res.data?.list || []).map(mapSaleorSpuToChatGoods);
        const merged = pageNo === 1 ? list : concat(state.pagination.data, list);
        const total = Number(res.data?.total || merged.length);
        state.pagination.data = merged;
        state.pagination.pageNo = pageNo;
        state.pagination.total = total;
        hasMore = merged.length < total;
      } else {
        const res = await SpuHistoryApi.getBrowseHistoryPage({
          page: pageNo,
          list_rows: pageSize,
        });
        if (res.code !== 0) {
          state.loadStatus = 'noMore';
          return;
        }
        list = res.data?.list || [];
        const merged = concat(state.pagination.data, list);
        state.pagination.data = merged;
        state.pagination.pageNo = res.data?.current_page || pageNo;
        state.pagination.lastPage = res.data?.last_page || 1;
        hasMore = state.pagination.pageNo < state.pagination.lastPage;
      }
    } else if (isSaleorBff) {
      const res = await OrderApi.getOrderPage({ pageNo, pageSize });
      if (res.code !== 0) {
        state.loadStatus = 'noMore';
        return;
      }
      list = res.data?.list || [];
      const merged = pageNo === 1 ? list : concat(state.pagination.data, list);
      const total = Number(res.data?.total || merged.length);
      state.pagination.data = merged;
      state.pagination.pageNo = pageNo;
      state.pagination.total = total;
      hasMore = merged.length < total;
    } else {
      const res = await OrderApi.getOrderPage({
        page: pageNo,
        list_rows: pageSize,
      });
      if (res.code !== 0) {
        state.loadStatus = 'noMore';
        return;
      }
      list = res.data?.list || [];
      const merged = concat(state.pagination.data, list);
      state.pagination.data = merged;
      state.pagination.pageNo = res.data?.current_page || pageNo;
      state.pagination.lastPage = res.data?.last_page || 1;
      hasMore = state.pagination.pageNo < state.pagination.lastPage;
    }

    state.loadStatus = hasMore ? 'more' : 'noMore';
  }

  function loadmore() {
    if (state.loadStatus !== 'noMore') {
      getList(state.pagination.pageNo + 1);
    }
  }
</script>

<style lang="scss" scoped>
  .select-popup {
    max-height: 600rpx;

    .title {
      height: 100rpx;
      line-height: 100rpx;
      padding: 0 26rpx;
      background: #fff;
      border-radius: 20rpx 20rpx 0 0;

      span {
        font-size: 32rpx;
        position: relative;

        &::after {
          content: '';
          display: block;
          width: 100%;
          height: 2px;
          z-index: 1;
          position: absolute;
          left: 0;
          bottom: -15px;
          background: var(--ui-BG-Main);
          pointer-events: none;
        }
      }
    }

    .scroll-box {
      height: 500rpx;
    }

    .item {
      background: #fff;
      margin: 26rpx 26rpx 0;
      border-radius: 20rpx;

      :deep() {
        .image {
          width: 140rpx;
          height: 140rpx;
        }
      }
    }
  }
</style>
