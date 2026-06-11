<!-- 分类展示：second-one 风格  -->
<template>
  <view>
    <!-- 一级分类的名字 -->
    <view class="title-box ss-flex ss-col-center ss-row-center ss-p-b-30">
      <view class="title-line-left" />
      <view class="title-text ss-p-x-20">{{ currentCategory?.name }}</view>
      <view class="title-line-right" />
    </view>

    <!-- 二级分类 -->
    <view
      v-if="currentCategory?.children?.length"
      class="goods-item-box ss-flex ss-flex-wrap ss-p-b-20"
    >
      <view
        class="goods-item"
        v-for="item in currentCategory.children"
        :key="item.id"
        @tap="
          sheep.$router.go('/pages/goods/list', {
            categoryId: item.id,
          })
        "
      >
        <image class="goods-img" :src="categoryImage(item.picUrl)" mode="aspectFill" />
        <view class="ss-p-10">
          <view class="goods-title ss-line-1">{{ item.name }}</view>
        </view>
      </view>
    </view>

    <!-- 无子分类时：直接展示该分类下的商品 -->
    <view v-else-if="state.products.length" class="product-box ss-p-b-20">
      <view
        class="product-item"
        v-for="item in state.products"
        :key="item.id"
        @tap="sheep.$router.go('/pages/goods/index', { id: item.id })"
      >
        <s-goods-column size="sm" :data="item" :goodsFields="goodsFields" />
      </view>
    </view>

    <s-empty v-else-if="!state.loading" paddingTop="40" text="该分类暂无商品" />
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
  });

  const goodsFields = {
    name: { show: true, color: '#333333' },
    price: { show: true, color: '#e93323' },
  };

  const currentCategory = computed(() => props.data?.[props.activeMenu]);

  function categoryImage(picUrl) {
    return sheep.$url.cdn(picUrl || defaultCategoryImg);
  }

  async function loadProducts() {
    const category = currentCategory.value;
    if (!category || category.children?.length) {
      state.products = [];
      return;
    }
    state.loading = true;
    try {
      const { code, data } = await SpuApi.getSpuPage({
        categoryId: category.id,
        pageNo: 1,
        pageSize: 12,
      });
      state.products = code === 0 && data?.list ? data.list : [];
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

  .product-box {
    display: flex;
    flex-wrap: wrap;
    margin: -5px;
  }

  .product-item {
    width: calc(50% - 10px);
    margin: 5px;
  }
</style>
