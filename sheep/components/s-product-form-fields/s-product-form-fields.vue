<template>
  <view v-if="fields.length" class="product-form-fields">
    <view class="form-item ss-m-b-24" v-for="field in fields" :key="field.key">
      <view class="label-text ss-m-b-12">
        {{ field.label }}
        <text v-if="field.required" class="required-mark">*</text>
      </view>

      <view v-if="field.type === 'input'" class="input-row">
        <uni-easyinput
          :modelValue="localValues[field.key]"
          :type="easyInputType(field)"
          :placeholder="field.placeholder || '请输入'"
          :maxlength="inputMaxlength(field)"
          :clearable="inputProp(field, 'clearable', true)"
          :disabled="inputDisabled(field)"
          :prefixIcon="inputProp(field, 'prefixIcon', '') || undefined"
          :autoHeight="inputProp(field, 'type') === 'textarea'"
          @update:modelValue="(val) => setFieldValue(field.key, val, field)"
        />
        <text v-if="showWordLimit(field)" class="word-limit">
          {{ inputWordCount(field) }}/{{ inputMaxlength(field) }}
        </text>
      </view>

      <view v-else-if="field.type === 'number'" class="number-row" :class="numberClass(field)">
        <uni-number-box
          v-if="numberUseControls(field)"
          :class="['number-control', { 'number-readonly-input': !numberProp(field, 'editable', true) }]"
          :modelValue="numberModelValue(field)"
          :min="numberMin(field)"
          :max="numberMax(field)"
          :step="numberStep(field)"
          :disabled="Boolean(numberProp(field, 'disabled', false) || numberProp(field, 'readonly', false))"
          :background="numberBackground(field)"
          :color="numberColor(field)"
          @change="(val) => onNumberBoxChange(field, val)"
        />
        <uni-easyinput
          v-else
          class="number-control"
          :modelValue="localValues[field.key]"
          type="digit"
          :placeholder="numberPlaceholder(field)"
          :disabled="Boolean(numberProp(field, 'disabled', false) || numberProp(field, 'readonly', false))"
          @update:modelValue="(val) => onNumberInputChange(field, val)"
        />
      </view>

      <view v-else-if="field.type === 'radio'" class="option-row">
        <uni-data-checkbox
          :class="optionClass(field, 'radio')"
          :localdata="optionLocaldata(field)"
          :modelValue="localValues[field.key]"
          :multiple="false"
          :mode="optionMode(field)"
          :wrap="optionProp(field, 'wrap', true)"
          :disabled="optionProp(field, 'disabled', false)"
          :selectedColor="optionProp(field, 'selectedColor', '') || undefined"
          @change="(e) => onRadioDataChange(field.key, e)"
        />
      </view>

      <view v-else-if="field.type === 'checkbox'" class="option-row">
        <uni-data-checkbox
          :class="optionClass(field, 'checkbox')"
          :localdata="optionLocaldata(field)"
          :modelValue="checkboxModelValue(field)"
          :multiple="true"
          :mode="optionMode(field)"
          :wrap="optionProp(field, 'wrap', true)"
          :disabled="optionProp(field, 'disabled', false)"
          :min="optionLimit(field, 'min')"
          :max="optionLimit(field, 'max')"
          :selectedColor="optionProp(field, 'selectedColor', '') || undefined"
          @change="(e) => onCheckboxDataChange(field.key, e)"
        />
      </view>

      <view v-else-if="field.type === 'switch'" class="switch-row" :class="switchClass(field)">
        <text v-if="switchSideText(field, 'inactiveText')" class="switch-side-text">
          {{ switchSideText(field, 'inactiveText') }}
        </text>
        <switch
          :checked="isSwitchActive(field)"
          :disabled="Boolean(switchProp(field, 'disabled', false))"
          :color="switchColor(field)"
          @change="(e) => onSwitchChange(field, e)"
        />
        <text v-if="switchSideText(field, 'activeText')" class="switch-side-text">
          {{ switchSideText(field, 'activeText') }}
        </text>
        <text class="switch-text">{{ switchDisplayText(field) }}</text>
      </view>

      <view v-else-if="field.type === 'select'" class="select-row" :class="selectClass(field)">
        <uni-combox
          v-if="selectProp(field, 'filterable', false) && !selectProp(field, 'disabled', false)"
          class="select-control"
          :modelValue="selectLabel(field)"
          :placeholder="selectPlaceholder(field)"
          :candidates="selectCandidateLabels(field)"
          :emptyTips="selectProp(field, 'notFoundText', '无匹配项')"
          :border="false"
          @update:modelValue="(val) => onSelectComboxChange(field, val)"
        />
        <picker
          v-else
          class="select-control"
          mode="selector"
          :range="selectCandidateLabels(field)"
          :value="selectIndex(field)"
          :disabled="Boolean(selectProp(field, 'disabled', false))"
          @change="(e) => onSelectChange(field, e)"
        >
          <view
            class="picker-value"
            :class="{
              'picker-disabled': selectProp(field, 'disabled', false),
              'picker-empty': !selectLabel(field),
            }"
          >
            {{ selectLabel(field) || selectPlaceholder(field) }}
          </view>
        </picker>
        <text
          v-if="selectShowClear(field)"
          class="select-clear"
          @tap.stop="clearSelect(field)"
        >
          清空
        </text>
      </view>

      <view v-else-if="field.type === 'cascader'" class="cascader-row" :class="cascaderClass(field)">
        <uni-data-picker
          class="cascader-control"
          :localdata="cascaderLocaldata(field)"
          :modelValue="cascaderModelValue(field)"
          :placeholder="cascaderPlaceholder(field)"
          :popup-title="String(cascaderProp(field, 'popupTitle', '请选择') || '请选择')"
          :readonly="Boolean(cascaderProp(field, 'disabled', false))"
          :clear-icon="Boolean(cascaderProp(field, 'clearable', true))"
          :split="String(cascaderProp(field, 'split', '/') || '/')"
          :border="false"
          @change="(e) => onCascaderChange(field, e)"
        />
      </view>

      <view v-else-if="field.type === 'transfer'" class="transfer-row">
        <view class="transfer-panel">
          <view class="transfer-header">
            <view
              v-if="transferProp(field, 'showSelectAll', true)"
              class="transfer-check-all"
              @tap.stop="toggleTransferAll(field, 'left')"
            >
              <checkbox
                :checked="isTransferAllChecked(field, 'left')"
                :disabled="Boolean(transferProp(field, 'disabled', false))"
              />
              <text>{{ transferProp(field, 'leftTitle', '待选列表') }}</text>
            </view>
            <text v-else class="transfer-title">{{ transferProp(field, 'leftTitle', '待选列表') }}</text>
            <text class="transfer-count">{{ transferFilteredLeft(field).length }}</text>
          </view>
          <uni-easyinput
            v-if="transferProp(field, 'filterable', false)"
            class="transfer-filter"
            :modelValue="transferFilterValue(field, 'left')"
            :placeholder="transferProp(field, 'filterPlaceholder', '搜索')"
            :disabled="Boolean(transferProp(field, 'disabled', false))"
            @update:modelValue="(val) => setTransferFilter(field, 'left', val)"
          />
          <scroll-view scroll-y class="transfer-body">
            <view
              v-for="item in transferFilteredLeft(field)"
              :key="item.value"
              class="transfer-item"
              @tap="toggleTransferChecked(field, 'left', item)"
            >
              <checkbox
                :checked="isTransferChecked(field, 'left', item.value)"
                :disabled="Boolean(item.disabled || transferProp(field, 'disabled', false))"
              />
              <text :class="{ 'transfer-item-disabled': item.disabled }">{{ item.label || item.value }}</text>
            </view>
            <view v-if="!transferFilteredLeft(field).length" class="transfer-empty">
              {{ transferProp(field, 'notFoundText', '无匹配项') }}
            </view>
          </scroll-view>
        </view>

        <view class="transfer-actions">
          <button
            class="ss-reset-button transfer-btn"
            :disabled="Boolean(transferProp(field, 'disabled', false))"
            @tap="moveTransfer(field, 'right')"
          >
            &gt;
          </button>
          <button
            class="ss-reset-button transfer-btn"
            :disabled="Boolean(transferProp(field, 'disabled', false))"
            @tap="moveTransfer(field, 'left')"
          >
            &lt;
          </button>
        </view>

        <view class="transfer-panel">
          <view class="transfer-header">
            <view
              v-if="transferProp(field, 'showSelectAll', true)"
              class="transfer-check-all"
              @tap.stop="toggleTransferAll(field, 'right')"
            >
              <checkbox
                :checked="isTransferAllChecked(field, 'right')"
                :disabled="Boolean(transferProp(field, 'disabled', false))"
              />
              <text>{{ transferProp(field, 'rightTitle', '已选列表') }}</text>
            </view>
            <text v-else class="transfer-title">{{ transferProp(field, 'rightTitle', '已选列表') }}</text>
            <text class="transfer-count">{{ transferFilteredRight(field).length }}</text>
          </view>
          <uni-easyinput
            v-if="transferProp(field, 'filterable', false)"
            class="transfer-filter"
            :modelValue="transferFilterValue(field, 'right')"
            :placeholder="transferProp(field, 'filterPlaceholder', '搜索')"
            :disabled="Boolean(transferProp(field, 'disabled', false))"
            @update:modelValue="(val) => setTransferFilter(field, 'right', val)"
          />
          <scroll-view scroll-y class="transfer-body">
            <view
              v-for="item in transferFilteredRight(field)"
              :key="item.value"
              class="transfer-item"
              @tap="toggleTransferChecked(field, 'right', item)"
            >
              <checkbox
                :checked="isTransferChecked(field, 'right', item.value)"
                :disabled="Boolean(item.disabled || transferProp(field, 'disabled', false))"
              />
              <text :class="{ 'transfer-item-disabled': item.disabled }">{{ item.label || item.value }}</text>
            </view>
            <view v-if="!transferFilteredRight(field).length" class="transfer-empty">
              {{ transferProp(field, 'notFoundText', '无匹配项') }}
            </view>
          </scroll-view>
        </view>
      </view>

      <view v-else-if="field.type === 'slider'" class="slider-row">
        <view class="slider-main">
          <slider
            :value="sliderNumericValue(field)"
            :min="sliderMin(field)"
            :max="sliderMax(field)"
            :step="sliderStep(field)"
            :disabled="Boolean(sliderProp(field, 'disabled', false))"
            :activeColor="sliderActiveColor(field)"
            :backgroundColor="sliderBackgroundColor(field) || undefined"
            :block-color="sliderBlockColor(field) || undefined"
            :block-size="sliderBlockSize(field) || undefined"
            @changing="(e) => onSliderChanging(field, e)"
            @change="(e) => onSliderChange(field, e)"
          />
          <view v-if="sliderProp(field, 'showStops', false)" class="slider-stops">
            <view
              v-for="stop in sliderStops(field)"
              :key="stop"
              class="slider-stop"
              :style="sliderStopStyle(field, stop)"
            />
          </view>
        </view>
        <uni-easyinput
          v-if="sliderProp(field, 'showInput', false)"
          class="slider-input"
          type="number"
          :disabled="Boolean(sliderProp(field, 'disabled', false))"
          :modelValue="localValues[field.key]"
          @update:modelValue="(val) => onSliderInputChange(field, val)"
        />
        <text v-else-if="sliderShowDisplayValue(field)" class="slider-value">
          {{ sliderDisplayValue(field) }}
        </text>
      </view>

      <view v-else-if="field.type === 'date'" class="date-row" :class="dateClass(field)">
        <uni-datetime-picker
          v-if="dateUsesDatetimePicker(field)"
          class="date-control"
          :type="dateUniType(field)"
          :modelValue="dateModelValue(field)"
          :disabled="Boolean(dateProp(field, 'disabled', false))"
          :clear-icon="Boolean(dateProp(field, 'clearable', false))"
          :placeholder="datePlaceholder(field)"
          :start-placeholder="String(dateProp(field, 'startPlaceholder', '') || '') || undefined"
          :end-placeholder="String(dateProp(field, 'endPlaceholder', '') || '') || undefined"
          :range-separator="String(dateProp(field, 'rangeSeparator', '至') || '至')"
          :start="String(dateProp(field, 'start', '') || '') || undefined"
          :end="String(dateProp(field, 'end', '') || '') || undefined"
          :hide-second="Boolean(dateProp(field, 'hideSecond', false))"
          :border="false"
          @update:modelValue="(val) => onDatePickerChange(field, val)"
        />
        <picker
          v-else
          class="date-control"
          mode="date"
          :fields="dateNativeFields(field)"
          :value="dateNativeValue(field)"
          :start="String(dateProp(field, 'start', '') || '') || undefined"
          :end="String(dateProp(field, 'end', '') || '') || undefined"
          :disabled="Boolean(dateProp(field, 'disabled', false))"
          @change="(e) => onNativeDateChange(field, e)"
        >
          <view
            class="picker-value"
            :class="{
              'picker-disabled': dateProp(field, 'disabled', false),
              'picker-empty': !dateDisplayText(field),
            }"
          >
            {{ dateDisplayText(field) || datePlaceholder(field) }}
          </view>
        </picker>
        <text
          v-if="dateShowClear(field)"
          class="date-clear"
          @tap.stop="clearDate(field)"
        >
          清空
        </text>
      </view>

      <view v-else-if="field.type === 'time'" class="time-row" :class="timeClass(field)">
        <view v-if="timeIsRange(field)" class="time-range">
          <picker
            class="time-control"
            mode="time"
            :value="timeRangePart(field, 0) || '09:00'"
            :start="String(timeProp(field, 'start', '') || '') || undefined"
            :end="String(timeProp(field, 'end', '') || '') || undefined"
            :disabled="Boolean(timeProp(field, 'disabled', false))"
            @change="(e) => onTimeRangeChange(field, 0, e)"
          >
            <view
              class="picker-value"
              :class="{
                'picker-disabled': timeProp(field, 'disabled', false),
                'picker-empty': !timeRangePart(field, 0),
              }"
            >
              {{ timeRangePart(field, 0) || timeStartPlaceholder(field) }}
            </view>
          </picker>
          <text class="time-separator">{{ timeProp(field, 'rangeSeparator', '至') }}</text>
          <picker
            class="time-control"
            mode="time"
            :value="timeRangePart(field, 1) || '18:00'"
            :start="String(timeProp(field, 'start', '') || '') || undefined"
            :end="String(timeProp(field, 'end', '') || '') || undefined"
            :disabled="Boolean(timeProp(field, 'disabled', false))"
            @change="(e) => onTimeRangeChange(field, 1, e)"
          >
            <view
              class="picker-value"
              :class="{
                'picker-disabled': timeProp(field, 'disabled', false),
                'picker-empty': !timeRangePart(field, 1),
              }"
            >
              {{ timeRangePart(field, 1) || timeEndPlaceholder(field) }}
            </view>
          </picker>
        </view>
        <picker
          v-else
          class="time-control"
          mode="time"
          :value="timeNativeValue(field)"
          :start="String(timeProp(field, 'start', '') || '') || undefined"
          :end="String(timeProp(field, 'end', '') || '') || undefined"
          :disabled="Boolean(timeProp(field, 'disabled', false))"
          @change="(e) => onNativeTimeChange(field, e)"
        >
          <view
            class="picker-value"
            :class="{
              'picker-disabled': timeProp(field, 'disabled', false),
              'picker-empty': !timeDisplayText(field),
            }"
          >
            {{ timeDisplayText(field) || timePlaceholder(field) }}
          </view>
        </picker>
        <text
          v-if="timeShowClear(field)"
          class="time-clear"
          @tap.stop="clearTime(field)"
        >
          清空
        </text>
      </view>

      <view v-else-if="field.type === 'qrcode'" class="input-row scan-row">
        <uni-easyinput
          :modelValue="localValues[field.key]"
          :placeholder="field.placeholder || '点击右侧按钮扫码'"
          @update:modelValue="(val) => setFieldValue(field.key, val)"
        />
        <button class="ss-reset-button scan-btn" @tap="onScan(field.key)">扫码</button>
      </view>

      <view v-else-if="field.type === 'upload'" class="upload-row">
        <s-uploader
          :modelValue="uploadModelValue(field)"
          :limit="uploadLimit(field)"
          :disabled="Boolean(uploadProp(field, 'disabled', false))"
          :readonly="Boolean(uploadProp(field, 'readonly', false))"
          :fileMediatype="uploadMediaType(field)"
          :mode="uploadListMode(field)"
          :file-extname="uploadExtensions(field)"
          :autoUpload="Boolean(uploadProp(field, 'autoUpload', true))"
          :delIcon="Boolean(uploadProp(field, 'delIcon', true))"
          :disablePreview="Boolean(uploadProp(field, 'disablePreview', false))"
          :subtitle="String(uploadProp(field, 'tip', '') || '')"
          :imageStyles="uploadImageStyles(field)"
          @update:modelValue="(val) => onUploadChange(field, val)"
        />
      </view>
    </view>
  </view>
</template>

<script setup>
  import { reactive, watch } from 'vue';

  const props = defineProps({
    fields: {
      type: Array,
      default: () => [],
    },
    modelValue: {
      type: Object,
      default: () => ({}),
    },
  });

  const emits = defineEmits(['update:modelValue', 'change']);

  const localValues = reactive({});
  const transferChecks = reactive({});
  const transferFilters = reactive({});

  function fieldProps(field) {
    return field?.props && typeof field.props === 'object' ? field.props : {};
  }

  function inputProp(field, key, fallback) {
    const props = fieldProps(field);
    if (props[key] === undefined || props[key] === null || props[key] === '') {
      if (field?.maxLength && key === 'maxlength') {
        return Number(field.maxLength);
      }
      return fallback;
    }
    return props[key];
  }

  function easyInputType(field) {
    const inputType = String(inputProp(field, 'type', 'text') || 'text').toLowerCase();
    if (inputType === 'textarea') return 'textarea';
    if (inputType === 'password') return 'password';
    if (inputType === 'tel') return 'digit';
    return 'text';
  }

  function inputMaxlength(field) {
    const inputType = String(inputProp(field, 'type', 'text') || 'text').toLowerCase();
    if (inputType === 'tel') {
      return Number(inputProp(field, 'maxlength', 11));
    }
    return Number(inputProp(field, 'maxlength', 200));
  }

  function inputDisabled(field) {
    return Boolean(inputProp(field, 'disabled', false) || inputProp(field, 'readonly', false));
  }

  function showWordLimit(field) {
    return Boolean(inputProp(field, 'showWordLimit', false));
  }

  function inputWordCount(field) {
    return String(localValues[field.key] || '').length;
  }

  function optionProp(field, key, fallback) {
    const props = fieldProps(field);
    if (props[key] === undefined || props[key] === null || props[key] === '') {
      return fallback;
    }
    return props[key];
  }

  function optionMode(field) {
    if (optionProp(field, 'button', false)) return 'button';
    if (optionProp(field, 'vertical', false)) return 'list';
    return 'default';
  }

  function optionClass(field, type) {
    const size = String(optionProp(field, 'size', 'default') || 'default');
    return `${type}-field ${type}-size-${size}`;
  }

  function optionLocaldata(field) {
    return (field.options || []).map((opt) => {
      const item = {
        text: opt.label || opt.value,
        value: opt.value,
      };
      if (opt.disabled) {
        item.disabled = true;
      }
      return item;
    });
  }

  function optionLimit(field, key) {
    const value = optionProp(field, key, '');
    if (value === '' || value === null || value === undefined) {
      return '';
    }
    return Number(value);
  }

  function checkboxModelValue(field) {
    return parseCheckboxValue(localValues[field.key]);
  }

  function syncFromProps() {
    const next = { ...(props.modelValue || {}) };
    for (const field of props.fields) {
      if (next[field.key] === undefined) {
        if (field.type === 'switch') {
          next[field.key] = switchInactiveValue(field);
        } else if (field.type === 'checkbox' || field.type === 'transfer' || field.type === 'upload') {
          next[field.key] = '[]';
        } else if (field.type === 'slider') {
          next[field.key] = String(field.min ?? 0);
        } else if (field.type === 'number') {
          next[field.key] = String(field.min ?? 0);
        } else {
          next[field.key] = '';
        }
      }
    }
    Object.keys(localValues).forEach((key) => delete localValues[key]);
    Object.assign(localValues, next);
  }

  watch(
    () => props.fields,
    () => syncFromProps(),
    { immediate: true, deep: true },
  );

  function setFieldValue(key, val, field) {
    const inputType = field?.type === 'input' ? String(inputProp(field, 'type', 'text')).toLowerCase() : '';
    if (inputType === 'textarea') {
      localValues[key] = String(val ?? '');
    } else {
      localValues[key] = String(val ?? '').trim();
    }
    onChange();
  }

  function onChange() {
    const payload = getValues();
    emits('update:modelValue', payload);
    emits('change', payload);
  }

  function parseCheckboxValue(raw) {
    if (Array.isArray(raw)) return raw;
    const text = String(raw ?? '').trim();
    if (!text) return [];
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return text.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }

  function parseUploadItems(raw) {
    const parsed = parseCheckboxValue(raw);
    return parsed
      .map((item) => {
        if (typeof item === 'string') {
          const url = item.trim();
          return url ? { url, name: '' } : null;
        }
        if (item && typeof item === 'object') {
          const url = String(item.url || item.fileID || '').trim();
          if (!url) return null;
          return {
            url,
            name: String(item.name || '').trim(),
            size: item.size,
            extname: item.extname,
            fileType: item.fileType,
          };
        }
        return null;
      })
      .filter(Boolean);
  }

  function uploadProp(field, key, fallback) {
    const props = field?.props && typeof field.props === 'object' ? field.props : {};
    const value = props[key];
    return value === undefined || value === null || value === '' ? fallback : value;
  }

  function uploadLimit(field) {
    const multiple = uploadProp(field, 'multiple', true);
    if (!multiple) return 1;
    const limit = Number(uploadProp(field, 'limit', 3));
    return Number.isFinite(limit) && limit > 0 ? limit : 3;
  }

  function uploadMediaType(field) {
    const accept = String(uploadProp(field, 'accept', 'image')).toLowerCase();
    if (accept === 'video') return 'video';
    if (accept === 'all') return 'all';
    return 'image';
  }

  function uploadListMode(field) {
    const listType = String(uploadProp(field, 'listType', 'picture-card')).toLowerCase();
    if (listType === 'text') return 'list';
    return 'grid';
  }

  function uploadExtensions(field) {
    const extensions = uploadProp(field, 'extensions', []);
    if (Array.isArray(extensions)) {
      return extensions.filter(Boolean);
    }
    if (typeof extensions === 'string' && extensions.trim()) {
      return extensions.split(',').map((item) => item.trim()).filter(Boolean);
    }
    return [];
  }

  function uploadImageStyles(field) {
    const listType = String(uploadProp(field, 'listType', 'picture-card')).toLowerCase();
    if (listType === 'picture-card') {
      return { width: '168rpx', height: '168rpx' };
    }
    if (listType === 'picture') {
      return { width: '120rpx', height: '120rpx' };
    }
    return { width: 'auto', height: 'auto' };
  }

  function uploadModelValue(field) {
    return parseUploadItems(localValues[field.key]);
  }

  function serializeUploadItems(items) {
    const list = Array.isArray(items) ? items : items ? [items] : [];
    const normalized = list
      .map((item) => {
        const url = String(item?.url || item?.fileID || '').trim();
        if (!url) return null;
        return {
          url,
          name: String(item?.name || '').trim(),
        };
      })
      .filter(Boolean);
    return JSON.stringify(normalized);
  }

  function onUploadChange(field, val) {
    localValues[field.key] = serializeUploadItems(val);
    onChange();
  }

  function onCheckboxDataChange(key, e) {
    const values = Array.isArray(e?.detail?.value) ? e.detail.value : [];
    localValues[key] = JSON.stringify(values.map((item) => String(item)));
    onChange();
  }

  function onRadioDataChange(key, e) {
    const value = e?.detail?.value;
    localValues[key] = value === undefined || value === null ? '' : String(value);
    onChange();
  }

  function switchProp(field, key, fallback) {
    return optionProp(field, key, fallback);
  }

  function switchActiveValue(field) {
    return String(switchProp(field, 'activeValue', 'true'));
  }

  function switchInactiveValue(field) {
    return String(switchProp(field, 'inactiveValue', 'false'));
  }

  function isSwitchActive(field) {
    return localValues[field.key] === switchActiveValue(field);
  }

  function switchColor(field) {
    const color = String(switchProp(field, 'color', '') || '').trim();
    return color || 'var(--ui-BG-Main)';
  }

  function switchClass(field) {
    const size = String(switchProp(field, 'size', 'default') || 'default');
    return `switch-size-${size}`;
  }

  function switchSideText(field, key) {
    return String(switchProp(field, key, '') || '').trim();
  }

  function switchDisplayText(field) {
    return isSwitchActive(field)
      ? switchSideText(field, 'activeText') || '是'
      : switchSideText(field, 'inactiveText') || '否';
  }

  function onSwitchChange(field, e) {
    localValues[field.key] = e.detail.value ? switchActiveValue(field) : switchInactiveValue(field);
    onChange();
  }

  function selectProp(field, key, fallback) {
    return optionProp(field, key, fallback);
  }

  function selectEnabledOptions(field) {
    return (field.options || []).filter((opt) => !opt.disabled);
  }

  function selectCandidateLabels(field) {
    return selectEnabledOptions(field).map((opt) => opt.label || opt.value);
  }

  function selectPlaceholder(field) {
    const propPlaceholder = String(selectProp(field, 'placeholder', '') || '').trim();
    return propPlaceholder || field.placeholder || '请选择';
  }

  function selectClass(field) {
    const size = String(selectProp(field, 'size', 'default') || 'default');
    return `select-size-${size}`;
  }

  function selectShowClear(field) {
    return Boolean(selectProp(field, 'clearable', false))
      && !selectProp(field, 'disabled', false)
      && Boolean(selectLabel(field));
  }

  function selectIndex(field) {
    const enabled = selectEnabledOptions(field);
    const idx = enabled.findIndex((opt) => opt.value === localValues[field.key]);
    return idx >= 0 ? idx : 0;
  }

  function selectLabel(field) {
    const current = (field.options || []).find((opt) => opt.value === localValues[field.key]);
    return current ? current.label || current.value : '';
  }

  function onSelectChange(field, e) {
    const opt = selectEnabledOptions(field)[Number(e.detail.value || 0)];
    if (opt) {
      localValues[field.key] = opt.value;
      onChange();
    }
  }

  function onSelectComboxChange(field, label) {
    const text = String(label || '').trim();
    if (!text) {
      localValues[field.key] = '';
      onChange();
      return;
    }
    const opt = selectEnabledOptions(field).find(
      (item) => (item.label || item.value) === text,
    );
    localValues[field.key] = opt ? opt.value : '';
    onChange();
  }

  function clearSelect(field) {
    localValues[field.key] = '';
    onChange();
  }

  function cascaderProp(field, key, fallback) {
    return optionProp(field, key, fallback);
  }

  function cascaderClass(field) {
    const size = String(cascaderProp(field, 'size', 'default') || 'default');
    return `cascader-size-${size}`;
  }

  function cascaderPlaceholder(field) {
    const propPlaceholder = String(cascaderProp(field, 'placeholder', '') || '').trim();
    return propPlaceholder || field.placeholder || '请选择';
  }

  function parseCascaderValue(raw) {
    if (Array.isArray(raw)) return raw.map((item) => String(item));
    const text = String(raw ?? '').trim();
    if (!text) return [];
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
    } catch (e) {
      return [];
    }
  }

  function cascaderModelValue(field) {
    const values = parseCascaderValue(localValues[field.key]);
    return values.length ? values[values.length - 1] : '';
  }

  function cascaderLocaldata(field) {
    const convertNode = (opt) => {
      const item = {
        text: opt.label || opt.value,
        value: opt.value,
      };
      if (opt.disabled) {
        item.disable = true;
      }
      if (Array.isArray(opt.children) && opt.children.length) {
        item.children = opt.children.map(convertNode);
      }
      return item;
    };
    return (field.options || []).map(convertNode);
  }

  function onCascaderChange(field, e) {
    const selected = e?.detail?.value || [];
    if (!Array.isArray(selected) || !selected.length) {
      localValues[field.key] = '';
      onChange();
      return;
    }
    const values = selected.map((item) => String(item?.value ?? item ?? '').trim()).filter(Boolean);
    localValues[field.key] = values.length ? JSON.stringify(values) : '';
    onChange();
  }

  function transferProp(field, key, fallback) {
    return optionProp(field, key, fallback);
  }

  function numberProp(field, key, fallback) {
    return optionProp(field, key, fallback);
  }

  function numberClass(field) {
    const size = String(numberProp(field, 'size', 'default') || 'default');
    return `number-size-${size}`;
  }

  function numberPlaceholder(field) {
    const propPlaceholder = String(numberProp(field, 'placeholder', '') || '').trim();
    return propPlaceholder || field.placeholder || '请输入数字';
  }

  function numberMin(field) {
    return Number(field.min ?? 0);
  }

  function numberMax(field) {
    return Number(field.max ?? 100);
  }

  function numberStep(field) {
    return Number(field.step ?? 1);
  }

  function numberUseControls(field) {
    return Boolean(numberProp(field, 'controls', true));
  }

  function numberBackground(field) {
    const color = String(numberProp(field, 'background', '') || '').trim();
    return color || '#f5f5f5';
  }

  function numberColor(field) {
    const color = String(numberProp(field, 'color', '') || '').trim();
    return color || '#333';
  }

  function numberModelValue(field) {
    const raw = localValues[field.key];
    const num = Number(raw ?? numberMin(field));
    return Number.isNaN(num) ? numberMin(field) : num;
  }

  function normalizeNumberValue(field, raw) {
    let num = Number(raw);
    if (Number.isNaN(num)) {
      num = numberMin(field);
    }
    num = Math.min(numberMax(field), Math.max(numberMin(field), num));
    const step = numberStep(field);
    if (step > 0) {
      const base = numberMin(field);
      num = base + Math.round((num - base) / step) * step;
    }
    const precision = numberProp(field, 'precision', null);
    if (precision !== null && precision !== '' && precision !== undefined) {
      const p = Number(precision);
      num = Number(num.toFixed(p));
      if (p === 0) {
        return String(Math.round(num));
      }
      const text = num.toFixed(p);
      return text.replace(/\.?0+$/, '') || '0';
    }
    if (Number.isInteger(num)) {
      return String(Math.round(num));
    }
    return String(num);
  }

  function onNumberBoxChange(field, val) {
    localValues[field.key] = normalizeNumberValue(field, val);
    onChange();
  }

  function onNumberInputChange(field, val) {
    localValues[field.key] = String(val ?? '').trim();
    onChange();
  }

  function ensureTransferState(field) {
    if (!transferChecks[field.key]) {
      transferChecks[field.key] = { left: [], right: [] };
    }
    if (!transferFilters[field.key]) {
      transferFilters[field.key] = { left: '', right: '' };
    }
  }

  function transferFilterValue(field, side) {
    ensureTransferState(field);
    return transferFilters[field.key][side] || '';
  }

  function setTransferFilter(field, side, val) {
    ensureTransferState(field);
    transferFilters[field.key][side] = String(val ?? '');
  }

  function transferSelectedValues(field) {
    return parseCheckboxValue(localValues[field.key]);
  }

  function transferLeftItems(field) {
    const selected = new Set(transferSelectedValues(field));
    return (field.options || []).filter((opt) => !selected.has(opt.value));
  }

  function transferRightItems(field) {
    const selected = transferSelectedValues(field);
    const optionMap = Object.fromEntries(
      (field.options || []).map((opt) => [opt.value, opt]),
    );
    return selected.map((value) => optionMap[value]).filter(Boolean);
  }

  function transferFilterItems(items, keyword) {
    const text = String(keyword || '').trim().toLowerCase();
    if (!text) return items;
    return items.filter((item) =>
      String(item.label || item.value || '').toLowerCase().includes(text),
    );
  }

  function transferFilteredLeft(field) {
    ensureTransferState(field);
    return transferFilterItems(
      transferLeftItems(field),
      transferFilters[field.key].left,
    );
  }

  function transferFilteredRight(field) {
    ensureTransferState(field);
    return transferFilterItems(
      transferRightItems(field),
      transferFilters[field.key].right,
    );
  }

  function isTransferChecked(field, side, value) {
    ensureTransferState(field);
    return transferChecks[field.key][side].includes(value);
  }

  function toggleTransferChecked(field, side, item) {
    if (item?.disabled || transferProp(field, 'disabled', false)) {
      return;
    }
    ensureTransferState(field);
    const checks = transferChecks[field.key][side];
    const idx = checks.indexOf(item.value);
    if (idx >= 0) {
      checks.splice(idx, 1);
    } else {
      checks.push(item.value);
    }
  }

  function isTransferAllChecked(field, side) {
    const items = side === 'left' ? transferFilteredLeft(field) : transferFilteredRight(field);
    const enabled = items.filter((item) => !item.disabled);
    if (!enabled.length) return false;
    ensureTransferState(field);
    return enabled.every((item) => transferChecks[field.key][side].includes(item.value));
  }

  function toggleTransferAll(field, side) {
    if (transferProp(field, 'disabled', false)) return;
    ensureTransferState(field);
    const items = (side === 'left' ? transferFilteredLeft(field) : transferFilteredRight(field))
      .filter((item) => !item.disabled);
    const values = items.map((item) => item.value);
    if (isTransferAllChecked(field, side)) {
      transferChecks[field.key][side] = [];
    } else {
      transferChecks[field.key][side] = values;
    }
  }

  function moveTransfer(field, direction) {
    if (transferProp(field, 'disabled', false)) return;
    ensureTransferState(field);
    const checks = transferChecks[field.key];
    const current = [...transferSelectedValues(field)];
    const maxCount = optionLimit(field, 'max');
    const minCount = optionLimit(field, 'min');

    if (direction === 'right') {
      const toAdd = checks.left.filter((value) => !current.includes(value));
      let next = [...current, ...toAdd];
      if (maxCount !== '' && next.length > Number(maxCount)) {
        uni.showToast({ title: `${field.label}最多选择${maxCount}项`, icon: 'none' });
        next = next.slice(0, Number(maxCount));
      }
      localValues[field.key] = next.length ? JSON.stringify(next) : '[]';
      checks.left = [];
    } else {
      const removeSet = new Set(checks.right);
      const next = current.filter((value) => !removeSet.has(value));
      if (minCount !== '' && next.length < Number(minCount)) {
        uni.showToast({ title: `${field.label}至少选择${minCount}项`, icon: 'none' });
        return;
      }
      localValues[field.key] = next.length ? JSON.stringify(next) : '[]';
      checks.right = [];
    }
    onChange();
  }

  function sliderProp(field, key, fallback) {
    return optionProp(field, key, fallback);
  }

  function sliderMin(field) {
    return Number(field.min ?? 0);
  }

  function sliderMax(field) {
    return Number(field.max ?? 100);
  }

  function sliderStep(field) {
    return Number(field.step ?? 1);
  }

  function sliderNumericValue(field) {
    const raw = localValues[field.key];
    const num = Number(raw ?? sliderMin(field));
    return Number.isNaN(num) ? sliderMin(field) : num;
  }

  function sliderActiveColor(field) {
    const color = String(sliderProp(field, 'activeColor', '') || '').trim();
    return color || 'var(--ui-BG-Main)';
  }

  function sliderBackgroundColor(field) {
    return String(sliderProp(field, 'backgroundColor', '') || '').trim();
  }

  function sliderBlockColor(field) {
    return String(sliderProp(field, 'blockColor', '') || '').trim();
  }

  function sliderBlockSize(field) {
    return Number(sliderProp(field, 'blockSize', 0) || 0);
  }

  function sliderDisplayValue(field) {
    const value = sliderNumericValue(field);
    const format = String(sliderProp(field, 'tipFormat', '') || '').trim();
    if (format) {
      return format.replace(/\{value\}/g, String(value));
    }
    return String(value);
  }

  function sliderShowDisplayValue(field) {
    return Boolean(sliderProp(field, 'showValue', true));
  }

  function sliderStops(field) {
    const min = sliderMin(field);
    const max = sliderMax(field);
    const step = sliderStep(field);
    if (step <= 0 || max <= min) {
      return [];
    }
    const stops = [];
    for (let value = min; value <= max + 1e-9; value += step) {
      stops.push(Number(Number(value).toFixed(6)));
      if (stops.length >= 50) {
        break;
      }
    }
    return stops;
  }

  function sliderStopStyle(field, stop) {
    const min = sliderMin(field);
    const max = sliderMax(field);
    const percent = max === min ? 0 : ((stop - min) / (max - min)) * 100;
    return { left: `${percent}%` };
  }

  function normalizeSliderNumber(field, raw) {
    let num = Number(raw);
    if (Number.isNaN(num)) {
      num = sliderMin(field);
    }
    num = Math.min(sliderMax(field), Math.max(sliderMin(field), num));
    const step = sliderStep(field);
    if (step > 0) {
      const base = sliderMin(field);
      num = base + Math.round((num - base) / step) * step;
    }
    if (Number.isInteger(num)) {
      return String(Math.round(num));
    }
    return String(num);
  }

  function onSliderChanging(field, e) {
    localValues[field.key] = String(e.detail.value ?? sliderMin(field));
    onChange();
  }

  function onSliderChange(field, e) {
    localValues[field.key] = normalizeSliderNumber(field, e.detail.value);
    onChange();
  }

  function onSliderInputChange(field, val) {
    localValues[field.key] = normalizeSliderNumber(field, val);
    onChange();
  }

  function dateProp(field, key, fallback) {
    return optionProp(field, key, fallback);
  }

  function datePickerType(field) {
    return String(dateProp(field, 'type', 'date') || 'date').toLowerCase();
  }

  function dateUsesDatetimePicker(field) {
    return ['date', 'datetime', 'daterange', 'datetimerange'].includes(datePickerType(field));
  }

  function dateUniType(field) {
    return datePickerType(field);
  }

  function dateIsRange(field) {
    return ['daterange', 'datetimerange'].includes(datePickerType(field));
  }

  function datePlaceholder(field) {
    const propPlaceholder = String(dateProp(field, 'placeholder', '') || '').trim();
    return propPlaceholder || field.placeholder || '请选择日期';
  }

  function dateClass(field) {
    return `date-type-${datePickerType(field)}`;
  }

  function parseDateRangeValue(raw) {
    if (Array.isArray(raw)) return raw;
    const text = String(raw ?? '').trim();
    if (!text) return [];
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function dateModelValue(field) {
    const raw = localValues[field.key];
    if (dateIsRange(field)) {
      return parseDateRangeValue(raw);
    }
    return raw || '';
  }

  function dateNativeFields(field) {
    const pickerType = datePickerType(field);
    if (pickerType === 'year') return 'year';
    if (pickerType === 'month') return 'month';
    return 'day';
  }

  function dateNativeValue(field) {
    const raw = String(localValues[field.key] || '').trim();
    const pickerType = datePickerType(field);
    if (!raw) {
      const now = new Date();
      if (pickerType === 'year') return String(now.getFullYear());
      if (pickerType === 'month') {
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      }
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }
    if (pickerType === 'year') return raw.slice(0, 4);
    if (pickerType === 'month') return raw.slice(0, 7);
    return raw;
  }

  function formatDateDisplay(value, format) {
    const text = String(value || '').trim();
    if (!text || !format) return text;
    const [datePart, timePart = ''] = text.split(/\s+/);
    const [year = '', month = '', day = ''] = datePart.split('-');
    const [hour = '00', minute = '00', second = '00'] = timePart.split(':');
    return String(format)
      .replace(/yyyy/g, year)
      .replace(/MM/g, month)
      .replace(/dd/g, day)
      .replace(/HH/g, hour)
      .replace(/mm/g, minute)
      .replace(/ss/g, second);
  }

  function dateDisplayText(field) {
    const raw = localValues[field.key];
    if (dateIsRange(field)) {
      const values = parseDateRangeValue(raw);
      if (!values.length) return '';
      const separator = String(dateProp(field, 'rangeSeparator', '至') || '至');
      const format = String(dateProp(field, 'format', '') || '').trim();
      if (format) {
        return values.map((item) => formatDateDisplay(item, format)).join(separator);
      }
      return values.join(separator);
    }
    const text = String(raw || '').trim();
    if (!text) return '';
    const format = String(dateProp(field, 'format', '') || '').trim();
    return format ? formatDateDisplay(text, format) : text;
  }

  function dateShowClear(field) {
    if (!dateProp(field, 'clearable', false) || dateProp(field, 'disabled', false)) {
      return false;
    }
    if (dateUsesDatetimePicker(field)) {
      return false;
    }
    return Boolean(String(localValues[field.key] || '').trim());
  }

  function onDatePickerChange(field, val) {
    if (dateIsRange(field)) {
      const values = Array.isArray(val) ? val.map((item) => String(item || '').trim()) : [];
      localValues[field.key] = values.length ? JSON.stringify(values) : '';
    } else {
      localValues[field.key] = String(val ?? '').trim();
    }
    onChange();
  }

  function onNativeDateChange(field, e) {
    localValues[field.key] = String(e.detail.value ?? '').trim();
    onChange();
  }

  function clearDate(field) {
    localValues[field.key] = '';
    onChange();
  }

  function timeProp(field, key, fallback) {
    return optionProp(field, key, fallback);
  }

  function timePickerType(field) {
    return String(timeProp(field, 'type', 'time') || 'time').toLowerCase();
  }

  function timeIsRange(field) {
    return timePickerType(field) === 'timerange';
  }

  function timePlaceholder(field) {
    const propPlaceholder = String(timeProp(field, 'placeholder', '') || '').trim();
    return propPlaceholder || field.placeholder || '请选择时间';
  }

  function timeStartPlaceholder(field) {
    const value = String(timeProp(field, 'startPlaceholder', '') || '').trim();
    return value || '开始时间';
  }

  function timeEndPlaceholder(field) {
    const value = String(timeProp(field, 'endPlaceholder', '') || '').trim();
    return value || '结束时间';
  }

  function timeClass(field) {
    return `time-type-${timePickerType(field)}`;
  }

  function parseTimeRangeValue(raw) {
    if (Array.isArray(raw)) return raw;
    const text = String(raw ?? '').trim();
    if (!text) return [];
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function normalizeTimeToken(field, raw) {
    const text = String(raw ?? '').trim();
    if (!text) return '';
    if (timeProp(field, 'hideSecond', false)) {
      return text.slice(0, 5);
    }
    return text.length === 5 ? `${text}:00` : text;
  }

  function formatTimeDisplay(value, format) {
    const text = String(value || '').trim();
    if (!text || !format) return text;
    const [hour = '00', minute = '00', second = '00'] = text.split(':');
    return String(format)
      .replace(/HH/g, hour)
      .replace(/mm/g, minute)
      .replace(/ss/g, second);
  }

  function timeNativeValue(field) {
    const raw = String(localValues[field.key] || '').trim();
    return raw ? raw.slice(0, 5) : '09:00';
  }

  function timeRangePart(field, index) {
    const values = parseTimeRangeValue(localValues[field.key]);
    const part = values[index];
    return part ? String(part).slice(0, 5) : '';
  }

  function timeDisplayText(field) {
    if (timeIsRange(field)) {
      const values = parseTimeRangeValue(localValues[field.key]);
      if (!values.length) return '';
      const separator = String(timeProp(field, 'rangeSeparator', '至') || '至');
      const format = String(timeProp(field, 'format', '') || '').trim();
      if (format) {
        return values.map((item) => formatTimeDisplay(item, format)).join(separator);
      }
      return values.join(separator);
    }
    const text = String(localValues[field.key] || '').trim();
    if (!text) return '';
    const format = String(timeProp(field, 'format', '') || '').trim();
    return format ? formatTimeDisplay(text, format) : text.slice(0, 5);
  }

  function timeShowClear(field) {
    return Boolean(timeProp(field, 'clearable', false))
      && !timeProp(field, 'disabled', false)
      && Boolean(String(localValues[field.key] || '').trim());
  }

  function onNativeTimeChange(field, e) {
    localValues[field.key] = normalizeTimeToken(field, e.detail.value);
    onChange();
  }

  function onTimeRangeChange(field, index, e) {
    const values = parseTimeRangeValue(localValues[field.key]);
    while (values.length < 2) values.push('');
    values[index] = normalizeTimeToken(field, e.detail.value);
    localValues[field.key] = values.some((item) => item)
      ? JSON.stringify(values.map((item) => String(item || '').trim()))
      : '';
    onChange();
  }

  function clearTime(field) {
    localValues[field.key] = '';
    onChange();
  }

  function getValues() {
    const out = {};
    for (const field of props.fields) {
      out[field.key] = String(localValues[field.key] ?? '').trim();
    }
    return out;
  }

  function onScan(key) {
    uni.scanCode({
      onlyFromCamera: false,
      sound: 'default',
      scanType: ['qrCode', 'barCode'],
      success: (res) => {
        localValues[key] = (res.result || '').trim();
        onChange();
      },
      fail: (err) => {
        if (err?.errMsg !== 'scanCode:fail cancel') {
          uni.showToast({ title: '扫码失败', icon: 'none' });
        }
      },
    });
  }

  function validate(values) {
    const current = values || getValues();
    for (const field of props.fields) {
      const text = String(current[field.key] || '').trim();
      if (field.required) {
        if (field.type === 'checkbox' || field.type === 'transfer') {
          if (!parseCheckboxValue(text).length) return `请填写${field.label}`;
        } else if (field.type === 'upload') {
          if (!parseUploadItems(text).length) return `请填写${field.label}`;
        } else if (field.type === 'switch') {
          if (!text) return `请填写${field.label}`;
        } else if (!text) {
          return `请填写${field.label}`;
        }
      }
      if (field.type === 'input') {
        const inputType = String(inputProp(field, 'type', 'text')).toLowerCase();
        const maxlength = inputMaxlength(field);
        if (text.length > maxlength) {
          return `${field.label}过长`;
        }
        if (inputType === 'tel' && text && !/^1\d{10}$/.test(text)) {
          return '请输入正确的手机号';
        }
        if (inputType === 'email' && text && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
          return '请输入正确的邮箱';
        }
        if (inputType === 'url' && text && !/^https?:\/\/[^\s]+$/i.test(text)) {
          return '请输入正确的链接';
        }
      }
      if (field.type === 'number' && text) {
        const num = Number(text);
        if (Number.isNaN(num)) {
          return `请填写正确的${field.label}`;
        }
        if (num < numberMin(field) || num > numberMax(field)) {
          return `${field.label}超出范围`;
        }
        const normalized = normalizeNumberValue(field, num);
        if (normalized !== String(text).trim()) {
          return `${field.label}必须是步长${numberStep(field)}的倍数`;
        }
      }
      if (field.type === 'radio' && text) {
        const disabledOpt = (field.options || []).find(
          (opt) => opt.value === text && opt.disabled,
        );
        if (disabledOpt) {
          return `${field.label}包含不可选选项`;
        }
      }
      if (field.type === 'select' && text) {
        const allowed = selectEnabledOptions(field).map((opt) => opt.value);
        if (allowed.length && !allowed.includes(text)) {
          return `${field.label}选项无效`;
        }
        const disabledOpt = (field.options || []).find(
          (opt) => opt.value === text && opt.disabled,
        );
        if (disabledOpt) {
          return `${field.label}包含不可选选项`;
        }
      }
      if (field.type === 'cascader' && text) {
        const values = parseCascaderValue(text);
        if (!values.length) {
          return `请填写正确的${field.label}`;
        }
      }
      if (field.type === 'transfer') {
        const values = parseCheckboxValue(text);
        if (field.required && !values.length) {
          return `请填写${field.label}`;
        }
        const disabledValues = (field.options || [])
          .filter((opt) => opt.disabled)
          .map((opt) => opt.value);
        if (values.some((value) => disabledValues.includes(value))) {
          return `${field.label}包含不可选选项`;
        }
        const minCount = optionLimit(field, 'min');
        const maxCount = optionLimit(field, 'max');
        if (minCount !== '' && values.length < Number(minCount)) {
          return `${field.label}至少选择${minCount}项`;
        }
        if (maxCount !== '' && values.length > Number(maxCount)) {
          return `${field.label}最多选择${maxCount}项`;
        }
      }
      if (field.type === 'checkbox') {
        const values = parseCheckboxValue(text);
        if (field.required && !values.length) {
          return `请填写${field.label}`;
        }
        const disabledValues = (field.options || [])
          .filter((opt) => opt.disabled)
          .map((opt) => opt.value);
        if (values.some((value) => disabledValues.includes(value))) {
          return `${field.label}包含不可选选项`;
        }
        const minCount = optionLimit(field, 'min');
        const maxCount = optionLimit(field, 'max');
        if (minCount !== '' && values.length < Number(minCount)) {
          return `${field.label}至少选择${minCount}项`;
        }
        if (maxCount !== '' && values.length > Number(maxCount)) {
          return `${field.label}最多选择${maxCount}项`;
        }
      }
      if (field.type === 'upload') {
        const items = parseUploadItems(text);
        if (field.required && !items.length) {
          return `请填写${field.label}`;
        }
        const minCount = uploadProp(field, 'min', '');
        const maxCount = uploadLimit(field);
        if (minCount !== '' && minCount !== null && items.length < Number(minCount)) {
          return `${field.label}至少上传${minCount}个文件`;
        }
        if (items.length > Number(maxCount)) {
          return `${field.label}最多上传${maxCount}个文件`;
        }
        const invalid = items.some((item) => !/^https?:\/\/[^\s]+$/i.test(String(item.url || '')));
        if (invalid) {
          return `${field.label}包含无效文件地址`;
        }
      }
      if (field.type === 'switch' && text) {
        const active = switchActiveValue(field);
        const inactive = switchInactiveValue(field);
        if (text !== active && text !== inactive) {
          return `请填写正确的${field.label}`;
        }
      }
      if (field.type === 'slider' && text) {
        const num = Number(text);
        if (Number.isNaN(num)) {
          return `请填写正确的${field.label}`;
        }
        if (num < sliderMin(field) || num > sliderMax(field)) {
          return `${field.label}超出范围`;
        }
        const normalized = normalizeSliderNumber(field, num);
        if (normalized !== String(text).trim()) {
          return `${field.label}必须是步长${sliderStep(field)}的倍数`;
        }
      }
      if (field.type === 'date' && text) {
        if (dateIsRange(field)) {
          const values = parseDateRangeValue(text);
          if (values.length !== 2) {
            return `请填写正确的${field.label}`;
          }
          const pattern = datePickerType(field) === 'datetimerange'
            ? /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}(:\d{2})?$/
            : /^\d{4}-\d{2}-\d{2}$/;
          if (!values.every((item) => pattern.test(String(item)))) {
            return `请填写正确的${field.label}`;
          }
        } else if (datePickerType(field) === 'datetime') {
          if (!/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}(:\d{2})?$/.test(text)) {
            return `请填写正确的${field.label}`;
          }
        } else if (datePickerType(field) === 'year') {
          if (!/^\d{4}$/.test(text)) {
            return `请填写正确的${field.label}`;
          }
        } else if (datePickerType(field) === 'month') {
          if (!/^\d{4}-\d{2}$/.test(text)) {
            return `请填写正确的${field.label}`;
          }
        } else if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
          return `请填写正确的${field.label}`;
        }
      }
      if (field.type === 'time' && text) {
        if (timeIsRange(field)) {
          const values = parseTimeRangeValue(text);
          if (values.length !== 2) {
            return `请填写正确的${field.label}`;
          }
          if (!values.every((item) => /^\d{2}:\d{2}(:\d{2})?$/.test(String(item)))) {
            return `请填写正确的${field.label}`;
          }
        } else if (!/^\d{2}:\d{2}(:\d{2})?$/.test(text)) {
          return `请填写正确的${field.label}`;
        }
      }
    }
    return '';
  }

  defineExpose({ validate, getValues });
</script>

<style lang="scss" scoped>
  .product-form-fields {
    padding-top: 10rpx;
  }

  .label-text {
    font-size: 26rpx;
    font-weight: 500;
    color: #333;
  }

  .required-mark {
    color: #e93323;
    margin-left: 4rpx;
  }

  .input-row {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
  }

  .number-row {
    display: flex;
    align-items: center;
  }

  .number-control {
    width: 100%;
  }

  .number-size-large :deep(.uni-numbox__value) {
    height: 64rpx;
    font-size: 30rpx;
  }

  .number-size-small :deep(.uni-numbox__value) {
    height: 48rpx;
    font-size: 24rpx;
  }

  .number-readonly-input :deep(.uni-numbox__value) {
    pointer-events: none;
  }

  .word-limit {
    align-self: flex-end;
    font-size: 22rpx;
    color: #999;
  }

  .option-row {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
  }

  .radio-field,
  .checkbox-field {
    width: 100%;
  }

  .radio-size-large :deep(.checklist-text),
  .checkbox-size-large :deep(.checklist-text) {
    font-size: 30rpx;
  }

  .radio-size-small :deep(.checklist-text),
  .checkbox-size-small :deep(.checklist-text) {
    font-size: 22rpx;
  }

  .option-item {
    display: flex;
    align-items: center;
    gap: 12rpx;
    font-size: 26rpx;
    color: #333;
  }

  .switch-row {
    display: flex;
    align-items: center;
    gap: 16rpx;
  }

  .switch-size-large switch {
    transform: scale(1.15);
    transform-origin: left center;
  }

  .switch-size-small switch {
    transform: scale(0.85);
    transform-origin: left center;
  }

  .switch-side-text {
    font-size: 24rpx;
    color: #666;
  }

  .switch-text {
    font-size: 26rpx;
    color: #666;
  }

  .picker-value {
    min-height: 64rpx;
    line-height: 64rpx;
    padding: 0 20rpx;
    border-radius: 8rpx;
    background: #f7f7f7;
    color: #333;
    font-size: 26rpx;
  }

  .select-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
  }

  .select-control {
    flex: 1;
  }

  .select-size-large .picker-value,
  .select-size-large :deep(.uni-combox__input) {
    min-height: 76rpx;
    line-height: 76rpx;
    font-size: 30rpx;
  }

  .select-size-small .picker-value,
  .select-size-small :deep(.uni-combox__input) {
    min-height: 56rpx;
    line-height: 56rpx;
    font-size: 24rpx;
  }

  .picker-empty {
    color: #999;
  }

  .picker-disabled {
    opacity: 0.55;
  }

  .select-clear {
    flex-shrink: 0;
    font-size: 24rpx;
    color: #999;
    padding: 8rpx 12rpx;
  }

  .cascader-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
  }

  .cascader-control {
    flex: 1;
    width: 100%;
  }

  .cascader-size-large :deep(.selected-area),
  .cascader-size-large :deep(.placeholder) {
    font-size: 30rpx;
  }

  .cascader-size-small :deep(.selected-area),
  .cascader-size-small :deep(.placeholder) {
    font-size: 24rpx;
  }

  .transfer-row {
    display: flex;
    align-items: stretch;
    gap: 12rpx;
  }

  .transfer-panel {
    flex: 1;
    min-width: 0;
    border: 1rpx solid #eee;
    border-radius: 8rpx;
    background: #fff;
    overflow: hidden;
  }

  .transfer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8rpx;
    padding: 16rpx 20rpx;
    background: #f7f7f7;
    border-bottom: 1rpx solid #eee;
  }

  .transfer-check-all {
    display: flex;
    align-items: center;
    gap: 8rpx;
    flex: 1;
    min-width: 0;
    font-size: 24rpx;
    color: #333;
  }

  .transfer-title {
    flex: 1;
    font-size: 24rpx;
    color: #333;
  }

  .transfer-count {
    font-size: 22rpx;
    color: #999;
  }

  .transfer-filter {
    padding: 12rpx 16rpx 0;
  }

  .transfer-body {
    max-height: 320rpx;
    padding: 8rpx 0;
  }

  .transfer-item {
    display: flex;
    align-items: center;
    gap: 12rpx;
    padding: 12rpx 20rpx;
    font-size: 24rpx;
    color: #333;
  }

  .transfer-item-disabled {
    color: #bbb;
  }

  .transfer-empty {
    padding: 24rpx 20rpx;
    text-align: center;
    font-size: 22rpx;
    color: #999;
  }

  .transfer-actions {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 16rpx;
    flex-shrink: 0;
  }

  .transfer-btn {
    width: 56rpx;
    height: 56rpx;
    line-height: 56rpx;
    text-align: center;
    border-radius: 8rpx;
    background: var(--ui-BG-Main, #e93323);
    color: #fff;
    font-size: 28rpx;
  }

  .transfer-btn[disabled] {
    opacity: 0.45;
  }

  .upload-row {
    width: 100%;
  }

  .upload-row :deep(.uni-file-picker) {
    width: 100%;
  }

  .date-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
  }

  .date-control {
    flex: 1;
  }

  .date-clear {
    flex-shrink: 0;
    font-size: 24rpx;
    color: #999;
    padding: 8rpx 12rpx;
  }

  .time-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
  }

  .time-range {
    display: flex;
    align-items: center;
    gap: 12rpx;
    flex: 1;
  }

  .time-control {
    flex: 1;
  }

  .time-separator {
    flex-shrink: 0;
    font-size: 24rpx;
    color: #666;
  }

  .time-clear {
    flex-shrink: 0;
    font-size: 24rpx;
    color: #999;
    padding: 8rpx 12rpx;
  }

  .slider-row {
    display: flex;
    align-items: center;
    gap: 16rpx;
  }

  .slider-main {
    position: relative;
    flex: 1;
  }

  .slider-row slider {
    width: 100%;
  }

  .slider-stops {
    position: relative;
    height: 8rpx;
    margin: 8rpx 16rpx 0;
  }

  .slider-stop {
    position: absolute;
    top: 0;
    width: 8rpx;
    height: 8rpx;
    margin-left: -4rpx;
    border-radius: 50%;
    background: #d9d9d9;
  }

  .slider-input {
    width: 140rpx;
    flex-shrink: 0;
  }

  .slider-value {
    min-width: 56rpx;
    text-align: right;
    font-size: 26rpx;
    color: #666;
  }

  .scan-row {
    display: flex;
    align-items: center;
    gap: 16rpx;
  }

  .scan-row :deep(.uni-easyinput) {
    flex: 1;
  }

  .scan-btn {
    flex-shrink: 0;
    min-width: 120rpx;
    height: 64rpx;
    padding: 0 24rpx;
    border-radius: 32rpx;
    background: var(--ui-BG-Main-light);
    color: var(--ui-BG-Main);
    font-size: 24rpx;
  }
</style>
