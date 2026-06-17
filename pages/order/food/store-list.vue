<template>
  <s-layout :title="state.title" navbar="normal">
    <view class="food-store-page">
      <view class="search-bar ss-flex ss-col-center">
        <view class="city-box ss-flex ss-col-center" @tap="onPickCity">
          <text class="city-name">{{ state.city.name }}</text>
          <text class="city-arrow">▾</text>
        </view>
        <input
          class="search-input ss-flex-1"
          v-model="state.keyword"
          placeholder="搜索门店"
          confirm-type="search"
          @confirm="loadStores"
        />
        <text class="search-btn" @tap="loadStores">搜索</text>
      </view>

      <view v-if="state.loading" class="loading-box">加载中...</view>

      <view v-else-if="state.stores.length" class="store-list">
        <view
          class="store-card"
          v-for="item in state.stores"
          :key="item.id"
          @tap="onSelectStore(item)"
        >
          <view class="store-head ss-flex ss-row-between ss-col-center">
            <view class="store-name ss-line-1">{{ item.name }}</view>
            <view class="store-status" :class="{ open: item.open }">{{ item.openText }}</view>
          </view>
          <view class="store-address ss-line-2">{{ item.address }}</view>
          <view class="store-foot ss-flex ss-row-between ss-col-center">
            <text class="store-distance">{{ item.distanceText }}</text>
            <text class="store-go">›</text>
          </view>
        </view>
      </view>

      <s-empty v-else paddingTop="80" text="附近暂无门店" />
    </view>
  </s-layout>
</template>

<script setup>
  import { reactive } from 'vue';
  import { onLoad } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import FoodApi from '@/sheep/api/food/index';

  const state = reactive({
    brand: '',
    mode: 'dinein',
    title: '选择门店',
    city: { id: 'guangzhou', name: '广州' },
    cities: [],
    keyword: '',
    stores: [],
    loading: false,
    lat: '',
    lng: '',
  });

  async function loadStores() {
    state.loading = true;
    try {
      const { code, data, msg } = await FoodApi.getStores({
        brand: state.brand,
        cityId: state.city.id,
        lat: state.lat || undefined,
        lng: state.lng || undefined,
        keyword: state.keyword.trim(),
      });
      if (code !== 0) {
        sheep.$helper.toast(msg || '加载门店失败');
        state.stores = [];
        return;
      }
      state.title = `${data.brandName || state.title} · 选择门店`;
      if (data.city?.name) {
        state.city = data.city;
      }
      state.stores = data.stores || [];
    } finally {
      state.loading = false;
    }
  }

  async function loadCities() {
    const { code, data } = await FoodApi.getCities();
    if (code === 0 && Array.isArray(data) && data.length) {
      state.cities = data;
      if (!state.city.id) {
        state.city = data[0];
      }
    }
  }

  function onPickCity() {
    if (!state.cities.length) {
      return;
    }
    uni.showActionSheet({
      itemList: state.cities.map((c) => c.name),
      success: (res) => {
        const picked = state.cities[res.tapIndex];
        if (picked) {
          state.city = picked;
          loadStores();
        }
      },
    });
  }

  function onSelectStore(store) {
    if (!store.open) {
      sheep.$helper.toast('该门店未营业，请选择其他门店');
      return;
    }
    uni.showToast({
      title: `已选：${store.name}（菜单 P1）`,
      icon: 'none',
    });
  }

  function tryLocate() {
    uni.getLocation({
      type: 'gcj02',
      success: (res) => {
        state.lat = String(res.latitude);
        state.lng = String(res.longitude);
        loadStores();
      },
      fail: () => {
        loadStores();
      },
    });
  }

  onLoad(async (options) => {
    state.brand = options.brand || 'mdl';
    state.mode = options.mode || 'dinein';
    if (options.title) {
      state.title = decodeURIComponent(options.title);
    }
    await loadCities();
    tryLocate();
  });
</script>

<style scoped lang="scss">
  .food-store-page {
    min-height: 100vh;
    background: #f5f5f5;
    padding: 20rpx;
  }

  .search-bar {
    background: #fff;
    border-radius: 999rpx;
    padding: 12rpx 20rpx;
    margin-bottom: 20rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
  }

  .city-box {
    padding-right: 16rpx;
    margin-right: 16rpx;
    border-right: 1rpx solid #eee;
  }

  .city-name {
    font-size: 28rpx;
    color: #333;
    font-weight: 600;
  }

  .city-arrow {
    margin-left: 6rpx;
    color: #999;
    font-size: 22rpx;
  }

  .search-input {
    font-size: 28rpx;
    height: 64rpx;
  }

  .search-btn {
    color: var(--ui-BG-Main, #e93323);
    font-size: 28rpx;
    padding-left: 16rpx;
  }

  .loading-box {
    text-align: center;
    color: #999;
    padding: 80rpx 0;
  }

  .store-card {
    background: #fff;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 16rpx;
  }

  .store-name {
    font-size: 30rpx;
    font-weight: 600;
    color: #222;
    max-width: 70%;
  }

  .store-status {
    font-size: 22rpx;
    color: #999;
    background: #f3f4f6;
    padding: 4rpx 12rpx;
    border-radius: 8rpx;

    &.open {
      color: #16a34a;
      background: #ecfdf5;
    }
  }

  .store-address {
    margin-top: 12rpx;
    font-size: 24rpx;
    color: #666;
    line-height: 1.5;
  }

  .store-foot {
    margin-top: 16rpx;
  }

  .store-distance {
    font-size: 24rpx;
    color: #999;
  }

  .store-go {
    color: #e93323;
    font-size: 36rpx;
    line-height: 1;
  }
</style>
