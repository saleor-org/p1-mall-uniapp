<template>
  <s-layout
    class="chat-wrap"
    :title="!isReconnecting ? '连接客服成功' : '会话重连中'"
    navbar="inner"
  >
    <view class="page-bg" :style="{ height: sys_navBar + 'px' }"></view>
    <MessageList ref="messageListRef">
      <template #bottom>
        <message-input
          v-model="chat.msg"
          @on-tools="onTools"
          @send-message="onSendMessage"
          :auto-focus="false"
          :show-char-count="true"
          :max-length="500"
        ></message-input>
      </template>
    </MessageList>
    <tools-popup
      :show-tools="chat.showTools"
      :tools-mode="chat.toolsMode"
      @close="handleToolsClose"
      @on-emoji="onEmoji"
      @image-select="onSelect"
      @on-show-select="onShowSelect"
    >
      <message-input
        v-model="chat.msg"
        @on-tools="onTools"
        @send-message="onSendMessage"
        :auto-focus="false"
        :show-char-count="true"
        :max-length="500"
      ></message-input>
    </tools-popup>
    <SelectPopup
      :mode="chat.selectMode"
      :show="chat.showSelect"
      @select="onSelect"
      @close="chat.showSelect = false"
    />
  </s-layout>
</template>

<script setup>
  import MessageList from '@/pages/chat/components/messageList.vue';
  import { reactive, ref, toRefs } from 'vue';
  import sheep from '@/sheep';
  import ToolsPopup from '@/pages/chat/components/toolsPopup.vue';
  import MessageInput from '@/pages/chat/components/messageInput.vue';
  import SelectPopup from '@/pages/chat/components/select-popup.vue';
  import {
    KeFuMessageContentTypeEnum,
    WebSocketMessageTypeConstants,
  } from '@/pages/chat/util/constants';
  import FileApi from '@/sheep/api/infra/file';
  import KeFuApi from '@/sheep/api/promotion/kefu';
  import { useWebSocket } from '../util/useWebSocket';
  import { jsonParse } from '@/sheep/helper/utils';

  const sys_navBar = sheep.$platform.navbar;

  const chat = reactive({
    msg: '',
    scrollInto: '',
    showTools: false,
    toolsMode: '',
    showSelect: false,
    selectMode: '',
  });

  async function onSendMessage() {
    if (!chat.msg) return;
    try {
      const data = {
        contentType: KeFuMessageContentTypeEnum.TEXT,
        content: JSON.stringify({ text: chat.msg }),
      };
      await KeFuApi.sendKefuMessage(data);
      chat.msg = '';
    } finally {
      chat.showTools = false;
    }
  }

  const messageListRef = ref();

  function handleToolsClose() {
    chat.showTools = false;
    chat.toolsMode = '';
  }

  function onEmoji(item) {
    chat.msg += item.name;
  }

  function onTools(mode) {
    if (isReconnecting.value) {
      sheep.$helper.toast('您已掉线！请返回重试');
      return;
    }

    if (chat.showTools && chat.toolsMode === mode) {
      handleToolsClose();
      return;
    }
    if (chat.showTools && chat.toolsMode !== mode) {
      chat.showTools = false;
      chat.toolsMode = '';
    }
    setTimeout(() => {
      chat.toolsMode = mode;
      chat.showTools = true;
    }, 200);
  }

  function onShowSelect(mode) {
    chat.showTools = false;
    chat.showSelect = true;
    chat.selectMode = mode;
  }

  async function onSelect({ type, data }) {
    let msg;
    switch (type) {
      case 'image':
        const res = await FileApi.uploadFile(data.tempFiles[0].path);
        msg = {
          contentType: KeFuMessageContentTypeEnum.IMAGE,
          content: JSON.stringify({ picUrl: res.data }),
        };
        break;
      case 'goods':
        msg = {
          contentType: KeFuMessageContentTypeEnum.PRODUCT,
          content: JSON.stringify(data),
        };
        break;
      case 'order':
        msg = {
          contentType: KeFuMessageContentTypeEnum.ORDER,
          content: JSON.stringify(data),
        };
        break;
    }
    if (msg) {
      await KeFuApi.sendKefuMessage(msg);
      await messageListRef.value.refreshMessageList();
      chat.showTools = false;
      chat.showSelect = false;
      chat.selectMode = '';
    }
  }

  const { options } = useWebSocket({
    onConnected: async () => {},
    onMessage: async (data) => {
      const type = data.type;
      if (!type) {
        console.error('未知的消息类型：' + data);
        return;
      }
      if (type === WebSocketMessageTypeConstants.KEFU_MESSAGE_TYPE) {
        await messageListRef.value.refreshMessageList(jsonParse(data.content));
        return;
      }
      if (type === WebSocketMessageTypeConstants.KEFU_MESSAGE_ADMIN_READ) {
        sheep.$helper.toast('客服已读您的消息');
      }
    },
  });
  const isReconnecting = toRefs(options).isReconnecting;
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
    }
  }
</style>
