<!-- 发票抬头编辑 -->
<template>
  <s-layout :bgStyle="{ color: '#FFF' }" :title="state.id ? '编辑发票抬头' : '新增发票抬头'">
    <view class="ss-p-20">
      <uni-forms ref="formRef" :model="state.form" label-width="160rpx">
        <uni-forms-item label="抬头类型" name="type">
          <uni-data-checkbox v-model="state.form.type" :localdata="typeOptions" />
        </uni-forms-item>
        <uni-forms-item label="发票抬头" name="title" required>
          <uni-easyinput v-model="state.form.title" placeholder="请输入发票抬头" />
        </uni-forms-item>
        <uni-forms-item v-if="state.form.type === 2" label="税号" name="taxNo" required>
          <uni-easyinput v-model="state.form.taxNo" placeholder="请输入税号" />
        </uni-forms-item>
        <uni-forms-item label="邮箱" name="email">
          <uni-easyinput v-model="state.form.email" placeholder="接收电子发票（可选）" />
        </uni-forms-item>
        <uni-forms-item label="默认抬头" name="defaultStatus">
          <switch :checked="state.form.defaultStatus" @change="onDefaultChange" />
        </uni-forms-item>
      </uni-forms>
      <button class="save-btn ss-reset-button ui-Shadow-Main ss-m-t-40" @tap="onSave">保存</button>
    </view>
  </s-layout>
</template>

<script setup>
  import { reactive, ref } from 'vue';
  import { onLoad } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import InvoiceApi from '@/sheep/api/trade/invoice';

  const formRef = ref(null);
  const typeOptions = [
    { text: '个人', value: 1 },
    { text: '企业', value: 2 },
  ];

  const state = reactive({
    id: 0,
    form: {
      title: '',
      taxNo: '',
      type: 1,
      email: '',
      defaultStatus: false,
    },
  });

  function onDefaultChange(e) {
    state.form.defaultStatus = !!e.detail.value;
  }

  async function onSave() {
    if (!state.form.title.trim()) {
      uni.showToast({ title: '请输入发票抬头', icon: 'none' });
      return;
    }
    if (state.form.type === 2 && !state.form.taxNo.trim()) {
      uni.showToast({ title: '请输入税号', icon: 'none' });
      return;
    }
    const payload = { ...state.form };
    const res = state.id
      ? await InvoiceApi.updateTitle(state.id, payload)
      : await InvoiceApi.createTitle(payload);
    if (res.code === 0) {
      sheep.$router.back();
    }
  }

  onLoad(async (query) => {
    state.id = Number(query.id || 0);
    if (!state.id) return;
    const { code, data } = await InvoiceApi.getTitleList();
    if (code !== 0) return;
    const row = (data || []).find((it) => it.id === state.id);
    if (row) {
      state.form = {
        title: row.title,
        taxNo: row.taxNo || '',
        type: row.type || 1,
        email: row.email || '',
        defaultStatus: !!row.defaultStatus,
      };
    }
  });
</script>

<style lang="scss" scoped>
  .save-btn {
    width: 100%;
    height: 80rpx;
    line-height: 80rpx;
    border-radius: 40rpx;
    color: #fff;
    background: var(--ui-BG-Main);
  }
</style>
