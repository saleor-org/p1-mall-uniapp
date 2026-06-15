<template>
  <s-layout
    v-if="state.useVoceChat"
    class="chat-wrap vocechat-layout"
    title="连接客服成功"
    navbar="inner"
  >
    <view class="page-bg" :style="{ height: sys_navBar + 'px' }"></view>
    <!-- #ifdef H5 -->
    <view class="vocechat-page" :style="{ minHeight: state.pageHeight + 'px' }">
      <view class="vocechat-card" :style="{ height: state.messageAreaHeight + 'px' }">
        <scroll-view
          class="vocechat-msg-scroll"
          scroll-y
          :scroll-top="state.scrollTop"
          scroll-with-animation
        >
          <view class="vocechat-msg-list">
            <view class="msg-row msg-row--left">
              <view class="msg-avatar msg-avatar--cs">
                <text class="msg-avatar-icon">客</text>
              </view>
              <view class="msg-bubble msg-bubble--left">
                <text
                  v-for="(line, idx) in state.welcomeLines"
                  :key="'w-' + idx"
                  class="msg-line"
                >{{ line }}</text>
              </view>
            </view>
            <view
              v-for="item in state.messages"
              :key="item.id"
              class="msg-row"
              :class="item.isMine ? 'msg-row--right' : 'msg-row--left'"
            >
              <view v-if="!item.isMine" class="msg-avatar msg-avatar--cs">
                <text class="msg-avatar-icon">客</text>
              </view>
              <view
                class="msg-bubble"
                :class="[
                  item.isMine ? 'msg-bubble--right' : 'msg-bubble--left',
                  item.type === 'image' ? 'msg-bubble--image' : '',
                ]"
              >
                <image
                  v-if="item.type === 'image' && item.imageUrl"
                  class="msg-image"
                  :src="item.imageUrl"
                  mode="widthFix"
                  @tap="previewImage(item)"
                />
                <text v-else class="msg-text">{{ item.text }}</text>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
      <view class="vocechat-native-bar">
        <message-input
          v-model="state.msg"
          :tools-mode="state.toolsMode"
          @on-tools="onTools"
          @send-message="onSendMessage"
        />
      </view>
      <tools-popup
        :show-tools="state.showTools"
        :tools-mode="state.toolsMode"
        @close="handleToolsClose"
        @on-emoji="onEmoji"
        @image-select="onImageSelect"
        @on-show-select="onShowSelect"
      >
        <message-input
          v-model="state.msg"
          :tools-mode="state.toolsMode"
          @on-tools="onTools"
          @send-message="onSendMessage"
        />
      </tools-popup>
    </view>
    <!-- #endif -->
    <!-- #ifndef H5 -->
    <view class="vocechat-fallback ss-p-40 ss-flex ss-row-center">
      <text class="ss-font-28 text-gray">请使用 H5 或联系客服电话</text>
    </view>
    <!-- #endif -->
  </s-layout>

  <YudaoChatPanel v-else />
</template>

<script setup>
  import { reactive } from 'vue';
  import { onLoad, onUnload } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import YudaoChatPanel from '@/pages/chat/components/yudao-chat-panel.vue';
  import MessageInput from '@/pages/chat/components/messageInput.vue';
  import ToolsPopup from '@/pages/chat/components/toolsPopup.vue';
  import {
    getVoceChatWelcomeLines,
    shouldUseVoceChatPage,
    VOCECHAT_NATIVE_INPUT_PX,
  } from '@/sheep/helper/customer-service';
  import {
    ensureVoceChatSession,
    fetchVoceChatHistory,
    sendVoceChatImage,
    sendVoceChatMessage,
  } from '@/sheep/helper/vocechat-session';

  const sys_navBar = sheep.$platform.navbar;
  let pollTimer = null;

  const state = reactive({
    useVoceChat: shouldUseVoceChatPage(),
    messageAreaHeight: 480,
    pageHeight: 640,
    msg: '',
    sending: false,
    showTools: false,
    toolsMode: '',
    messages: [],
    welcomeLines: ['您好，有什么可以帮您？'],
    scrollTop: 0,
  });

  async function refreshMessages() {
    // #ifdef H5
    try {
      const list = await fetchVoceChatHistory();
      state.messages = list;
      state.scrollTop = list.length * 999;
    } catch (error) {
      console.warn('[VoceChat] load history failed', error);
    }
    // #endif
  }

  function startPolling() {
    // #ifdef H5
    stopPolling();
    pollTimer = setInterval(refreshMessages, 3000);
    // #endif
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  async function onSendMessage() {
    const content = String(state.msg || '').trim();
    if (!content || state.sending) {
      return;
    }
    // #ifdef H5
    state.sending = true;
    try {
      await sendVoceChatMessage(content);
      state.msg = '';
      handleToolsClose();
      await refreshMessages();
    } catch (error) {
      console.warn('[VoceChat] send failed', error);
      sheep.$helper.toast(error?.message || '发送失败，请稍后重试');
    } finally {
      state.sending = false;
    }
    // #endif
  }

  function handleToolsClose() {
    state.showTools = false;
    state.toolsMode = '';
  }

  function onEmoji(item) {
    state.msg += item.name;
  }

  function onTools(mode) {
    if (state.showTools && state.toolsMode === mode) {
      handleToolsClose();
      return;
    }
    if (state.showTools && state.toolsMode !== mode) {
      state.showTools = false;
      state.toolsMode = '';
    }
    setTimeout(() => {
      state.toolsMode = mode;
      state.showTools = true;
    }, 200);
  }

  function onShowSelect() {
    sheep.$helper.toast('VoceChat 暂不支持发送商品/订单');
  }

  async function onImageSelect({ data }) {
    const tempPath = data?.tempFiles?.[0]?.path;
    if (!tempPath || state.sending) {
      return;
    }
    // #ifdef H5
    state.sending = true;
    try {
      await sendVoceChatImage(tempPath);
      handleToolsClose();
      await refreshMessages();
    } catch (error) {
      console.warn('[VoceChat] image send failed', error);
      sheep.$helper.toast(error?.message || '图片发送失败，请稍后重试');
    } finally {
      state.sending = false;
    }
    // #endif
  }

  function previewImage(item) {
    const url = item?.imageFullUrl || item?.imageUrl;
    if (!url) {
      return;
    }
    uni.previewImage({ urls: [url], current: url });
  }

  async function initVoceChatPage(options) {
    // #ifdef H5
    const info = uni.getSystemInfoSync();
    const pagePad = 24;
    state.pageHeight = Math.floor(info.windowHeight - sys_navBar);
    state.messageAreaHeight = Math.max(
      Math.floor(state.pageHeight - VOCECHAT_NATIVE_INPUT_PX - pagePad),
      320,
    );
    state.welcomeLines = getVoceChatWelcomeLines({
      productId: options.id,
      productName: options.productName || options.name,
      orderNo: options.orderNo || options.orderId,
    });
    const userStore = sheep.$store('user');
    userStore.syncLoginFromStorage();
    if (!userStore.userInfo?.mobile) {
      await userStore.getInfo();
    }
    try {
      await ensureVoceChatSession();
    } catch (error) {
      console.warn('[VoceChat] session failed', error);
      sheep.$helper.toast(error?.message || '客服暂不可用，请稍后再试');
      return;
    }
    await refreshMessages();
    startPolling();
    // #endif
  }

  onLoad((options) => {
    if (!state.useVoceChat) {
      return;
    }
    initVoceChatPage(options);
  });

  onUnload(() => {
    stopPolling();
  });
</script>

<style scoped lang="scss">
  .chat-wrap {
    .page-bg {
      width: 100%;
      position: absolute;
      top: 0;
      left: 0;
      background-color: var(--ui-BG-Main);
      z-index: 1;
      pointer-events: none;
    }
  }

  .vocechat-layout {
    .vocechat-page {
      display: flex;
      flex-direction: column;
      padding: 12px 12px 0;
      box-sizing: border-box;
      background: #f7f8fa;
    }

    .vocechat-card {
      flex: 1;
      max-width: 750px;
      width: 100%;
      margin: 0 auto;
      background: #fff;
      border-radius: 12px 12px 0 0;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    }

    .vocechat-msg-scroll {
      height: 100%;
    }

    .vocechat-msg-list {
      padding: 16px 12px 24px;
      box-sizing: border-box;
    }

    .msg-row {
      display: flex;
      align-items: flex-start;
      margin-bottom: 14px;
      gap: 8px;

      &--left {
        flex-direction: row;
        justify-content: flex-start;
      }

      &--right {
        flex-direction: row-reverse;
        justify-content: flex-start;
      }
    }

    .msg-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;

      &--cs {
        background: linear-gradient(135deg, #4facfe, #00f2fe);
      }
    }

    .msg-avatar-icon {
      color: #fff;
      font-size: 14px;
      font-weight: 600;
    }

    .msg-bubble {
      max-width: 72%;
      padding: 10px 14px;
      border-radius: 12px;
      word-break: break-word;

      &--left {
        background: #f2f3f5;
        color: #333;
        border-top-left-radius: 4px;
      }

      &--right {
        background: linear-gradient(90deg, var(--ui-BG-Main), var(--ui-BG-Main-gradient));
        color: #fff;
        border-top-right-radius: 4px;
      }

      &--image {
        padding: 0;
        background: transparent;
        box-shadow: none;
      }
    }

    .msg-line {
      display: block;
      font-size: 14px;
      line-height: 1.5;
    }

    .msg-text {
      font-size: 14px;
      line-height: 1.5;
      white-space: pre-wrap;
    }

    .msg-image {
      max-width: 200px;
      border-radius: 8px;
      display: block;
    }

    .msg-bubble--right .msg-image {
      margin-left: auto;
    }

    .vocechat-native-bar {
      flex-shrink: 0;
      max-width: 750px;
      width: 100%;
      margin: 0 auto;
      background: #fff;
      border-radius: 0 0 12px 12px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
      position: relative;
      z-index: 10;
      padding-bottom: env(safe-area-inset-bottom, 0);
    }
  }
</style>
