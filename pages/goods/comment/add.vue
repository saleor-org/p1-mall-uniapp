<!-- 评价  -->
<template>
  <s-layout title="评价">
    <view>
      <view v-for="(item, index) in state.orderInfo.items" :key="item.id">
        <view>
          <view class="commont-from-wrap">
            <!-- 评价商品 -->
            <s-goods-item
              :img="item.picUrl"
              :title="item.spuName"
              :skuText="item.properties.map((property) => property.valueName).join(' ')"
              :price="item.payPrice"
              :num="item.count"
            />
          </view>

          <view class="form-item">
            <!-- 评分 -->
            <view class="star-box ss-flex ss-col-center">
              <view class="star-title ss-m-r-40">商品质量</view>
              <uni-rate v-model="state.commentList[index].descriptionScores" />
            </view>
            <view class="star-box ss-flex ss-col-center">
              <view class="star-title ss-m-r-40">服务态度</view>
              <uni-rate v-model="state.commentList[index].benefitScores" />
            </view>
            <!-- 评价 -->
            <view class="area-box">
              <uni-easyinput
                :inputBorder="false"
                type="textarea"
                maxlength="120"
                autoHeight
                v-model="state.commentList[index].content"
                placeholder="宝贝满足你的期待吗？说说你的使用心得，分享给想买的他们吧~"
              />
              <view class="img-box">
                <s-uploader
                  v-model:url="state.commentList[index].images"
                  fileMediatype="image"
                  limit="9"
                  mode="grid"
                  :imageStyles="{ width: '168rpx', height: '168rpx' }"
                  @success="(payload) => uploadSuccess(payload, index)"
                />
              </view>
            </view>
            <view class="checkbox-container">
              <checkbox-group @change="(event) => toggleAnonymous(index, event)">
                <label>
                  <checkbox value="anonymousChecked" />
                  匿名评论
                </label>
              </checkbox-group>
            </view>
          </view>
        </view>
      </view>
    </view>
    <su-fixed bottom placeholder>
      <view class="foot_box">
        <view class="notice-box">
          <text class="notice-text">
            温馨提示：请文明评价。含违法违规、辱骂、广告等不合规内容的评价，平台有权删除。
          </text>
        </view>
        <view class="ss-flex ss-row-center ss-col-center">
          <button class="ss-reset-button post-btn ui-BG-Main-Gradient ui-Shadow-Main" @tap="onSubmit">
            发布
          </button>
        </view>
      </view>
    </su-fixed>
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import { onLoad } from '@dcloudio/uni-app';
  import { reactive } from 'vue';
  import OrderApi from '@/sheep/api/trade/order';

  const state = reactive({
    orderInfo: {},
    commentList: [],
    id: null,
  });

  /**
   * 切换是否匿名
   *
   * @param commentIndex  当前评论下标
   * @param event 复选框事件
   */
  function toggleAnonymous(commentIndex, event) {
    state.commentList[commentIndex].anonymous = event.detail.value[0] === 'anonymousChecked';
  }

  /**
   * 发布评论
   *
   * @returns {Promise<void>}
   */
  async function onSubmit() {
    // 顺序提交评论
    for (const comment of state.commentList) {
      await OrderApi.createOrderItemComment(comment);
    }
    // 都评论好，返回
    sheep.$router.back();
  }

  /**
   * 图片添加到表单
   *
   * @param payload 上传成功后的回调数据
   * @param commentIndex  当前评论的下标
   */
  function uploadSuccess(payload, commentIndex) {
    state.commentList[commentIndex].picUrls = payload.tempFilePaths;
  }

  onLoad(async (options) => {
    if (!options.id) {
      sheep.$helper.toast(`缺少订单信息，请检查`);
      return;
    }
    state.id = options.id;

    const { code, data } = await OrderApi.getOrderDetail(state.id);
    if (code !== 0) {
      sheep.$helper.toast('无待评价订单');
      return;
    }
    const pendingItems = (data.items || []).filter((item) => !item.commentStatus);
    if (!pendingItems.length) {
      sheep.$helper.toast('订单已评价');
      sheep.$router.redirect('/pages/goods/comment/view', { id: state.id });
      return;
    }
    pendingItems.forEach((item) => {
      state.commentList.push({
        anonymous: false,
        orderId: state.id,
        orderItemId: item.id,
        descriptionScores: 5,
        benefitScores: 5,
        content: '',
        picUrls: [],
      });
    });
    state.orderInfo = { ...data, items: pendingItems };
  });
</script>

<style lang="scss" scoped>
  // 评价商品
  .goods-card {
    margin: 10rpx 0;
    padding: 20rpx;
    background: #fff;
  }

  // 评论，选择图片
  .form-item {
    background: #fff;

    .star-box {
      height: 100rpx;
      padding: 0 25rpx;
    }

    .star-title {
      font-weight: 600;
    }
  }

  .area-box {
    width: 690rpx;
    min-height: 306rpx;
    background: rgba(249, 250, 251, 1);
    border-radius: 20rpx;
    padding: 28rpx;
    margin: auto;

    .img-box {
      margin-top: 20rpx;
    }
  }

  .checkbox-container {
    padding: 10rpx;
  }

  .post-btn {
    width: 690rpx;
    line-height: 80rpx;
    border-radius: 40rpx;
    color: rgba(#fff, 0.9);
    margin-bottom: 20rpx;
  }

  .notice-box {
    width: 690rpx;
    margin: 0 auto 16rpx;
    padding: 16rpx 20rpx;
    background: #fff8e6;
    border-radius: 12rpx;
  }

  .notice-text {
    font-size: 24rpx;
    line-height: 1.6;
    color: #996600;
  }
</style>
