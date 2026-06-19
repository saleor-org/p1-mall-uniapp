<!-- 分类展示：second-one 风格  -->
<template>
  <view>
    <!-- 一级分类的名字 -->
    <view class="title-box ss-flex ss-col-center ss-row-center ss-p-b-30">
      <view class="title-line-left" />
      <view class="title-text ss-p-x-20">{{ currentCategory?.name }}</view>
      <view class="title-line-right" />
    </view>

    <!-- 二级分类（点选后在下方展示商品，不再跳转综合推荐列表） -->
    <view
      v-if="currentCategory?.children?.length"
      class="goods-item-box ss-flex ss-flex-wrap ss-p-b-20"
    >
      <view
        class="goods-item"
        :class="{ 'goods-item-active': state.activeSubId === item.id }"
        v-for="item in currentCategory.children"
        :key="item.id"
        @tap="onSubcategoryTap(item)"
      >
        <image class="goods-img" :src="categoryImage(item.picUrl)" mode="aspectFill" />
        <view class="ss-p-10">
          <view class="goods-title ss-line-1">{{ item.name }}</view>
        </view>
      </view>
    </view>

    <!-- 二级分类选中后的商品 -->
    <view v-if="state.activeSubId && state.subProducts.length" class="product-box ss-p-b-20">
      <view class="sub-header ss-flex ss-row-between ss-col-center ss-p-x-10 ss-m-b-10">
        <text class="sub-title">{{ state.activeSubName }}</text>
        <text class="sub-more" @tap="goSubcategoryList">查看全部</text>
      </view>
      <view
        class="product-item"
        v-for="item in state.subProducts"
        :key="item.id"
        @tap="goProductDetail(item)"
      >
        <view class="product-item-cover">
          <s-goods-column size="sm" :data="item" :goodsFields="goodsFields" />
        </view>
      </view>
    </view>
    <s-empty
      v-else-if="state.activeSubId && !state.subLoading"
      paddingTop="20"
      :text="state.emptySubHint"
    />

    <!-- 无子分类时：直接展示该分类下的商品 -->
    <view v-else-if="!currentCategory?.children?.length && state.products.length" class="product-box ss-p-b-20">
      <view
        class="product-item"
        v-for="item in state.products"
        :key="item.id"
        @tap="goProductDetail(item)"
      >
        <view class="product-item-cover">
          <s-goods-column size="sm" :data="item" :goodsFields="goodsFields" />
        </view>
      </view>
    </view>

    <s-empty
      v-else-if="!currentCategory?.children?.length && !state.loading"
      paddingTop="40"
      text="该分类暂无商品"
    />
  </view>
</template>

<script setup>
  import { computed, reactive, watch } from 'vue';
  import sheep from '@/sheep';
  import SpuApi from '@/sheep/api/product/spu';

  const defaultCategoryImg =
    'http://test.yudao.iocoder.cn/static/img/shop/menu/category.png';

  const props = defineProps({
    data: {
      type: Object,
      default: () => ({}),
    },
    activeMenu: [Number, String],
  });

  const state = reactive({
    products: [],
    loading: false,
    activeSubId: '',
    activeSubName: '',
    subProducts: [],
    subLoading: false,
    emptySubHint: '该子分类暂无商品',
  });

  const goodsFields = {
    name: { show: true, color: '#333333' },
    price: { show: true, color: '#e93323' },
  };

  const currentCategory = computed(() => props.data?.[props.activeMenu]);

  function categoryImage(picUrl) {
    return sheep.$url.cdn(picUrl || defaultCategoryImg);
  }

  function resetSubcategory() {
    state.activeSubId = '';
    state.activeSubName = '';
    state.subProducts = [];
    state.subLoading = false;
  }

  async function fetchCategoryProducts(categoryId, fallbackId) {
    const { code, data } = await SpuApi.getSpuPage({
      categoryId,
      pageNo: 1,
      pageSize: 12,
    });
    let list = code === 0 && data?.list ? data.list : [];
    if (!list.length && fallbackId && fallbackId !== categoryId) {
      const res = await SpuApi.getSpuPage({
        categoryId: fallbackId,
        pageNo: 1,
        pageSize: 12,
      });
      list = res.code === 0 && res.data?.list ? res.data.list : [];
    }
    return list;
  }

  async function pickSubcategoryWithProducts(children, parentId) {
    for (const child of children) {
      const list = await fetchCategoryProducts(child.id, parentId);
      if (list.length) {
        return { child, list };
      }
    }
    const first = children[0];
    return { child: first, list: [] };
  }

  function goProductDetail(item) {
    if (!item?.id) {
      return;
    }
    sheep.$router.go('/pages/goods/index', { id: item.id });
  }

  async function onSubcategoryTap(item) {
    state.activeSubId = item.id;
    state.activeSubName = item.name;
    state.subLoading = true;
    try {
      state.subProducts = await fetchCategoryProducts(item.id, currentCategory.value?.id);
      state.emptySubHint = state.subProducts.length
        ? ''
        : '该子分类暂无商品，可切换其他子分类或稍后再试';
    } finally {
      state.subLoading = false;
    }
  }

  function goSubcategoryList() {
    if (!state.activeSubId) {
      return;
    }
    sheep.$router.go('/pages/goods/list', {
      categoryId: state.activeSubId,
      parentCategoryId: currentCategory.value?.id || '',
    });
  }

  async function loadProducts() {
    const category = currentCategory.value;
    resetSubcategory();
    if (!category) {
      state.products = [];
      return;
    }
    if (category.children?.length) {
      state.products = [];
      state.subLoading = true;
      try {
        const { child, list } = await pickSubcategoryWithProducts(
          category.children,
          category.id,
        );
        state.activeSubId = child.id;
        state.activeSubName = child.name;
        state.subProducts = list;
        state.emptySubHint = list.length
          ? ''
          : '该分类商品尚未同步到商城，请稍后再试或选其他分类';
      } finally {
        state.subLoading = false;
      }
      return;
    }
    state.loading = true;
    try {
      state.products = await fetchCategoryProducts(category.id);
    } finally {
      state.loading = false;
    }
  }

  watch(
    () => props.activeMenu,
    () => {
      loadProducts();
    },
    { immediate: true },
  );
</script>

<style lang="scss" scoped>
  .title-box {
    .title-line-left,
    .title-line-right {
      width: 15px;
      height: 1px;
      background: #d2d2d2;
    }
  }

  .goods-item {
    width: calc((100% - 20px) / 3);
    margin-right: 10px;
    margin-bottom: 10px;

    &:nth-of-type(3n) {
      margin-right: 0;
    }

    .goods-img {
      width: calc((100vw - 140px) / 3);
      height: calc((100vw - 140px) / 3);
      background: #f5f5f5;
      border-radius: 8rpx;
    }

    .goods-title {
      font-size: 26rpx;
      font-weight: bold;
      color: #333333;
      line-height: 40rpx;
      text-align: center;
    }
  }

  .goods-item-active {
    .goods-img {
      box-shadow: 0 0 0 2rpx #e93323;
    }

    .goods-title {
      color: #e93323;
    }
  }

  .sub-header {
    width: 100%;
  }

  .sub-title {
    font-size: 28rpx;
    font-weight: bold;
    color: #333;
  }

  .sub-more {
    font-size: 24rpx;
    color: #999;
  }

  .product-box {
    display: flex;
    flex-wrap: wrap;
    margin: -5px;
  }

  .product-item {
    width: calc(50% - 10px);
    margin: 5px;
    cursor: pointer;
  }

  /* scroll-view 内 H5 触摸：子组件会抢 tap，由父级统一跳转 */
  .product-item-cover {
    pointer-events: none;
  }
</style>
