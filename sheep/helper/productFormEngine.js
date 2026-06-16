/** Schema-driven product form engine: widget registry + checkout helpers. */

import SFormWidgetExpressPickup from '@/sheep/components/s-form-widget-express-pickup/s-form-widget-express-pickup.vue';
import SFormWidgetOauthPick from '@/sheep/components/s-form-widget-oauth-pick/s-form-widget-oauth-pick.vue';

export const DISPLAY_ONLY_FIELD_TYPES = new Set(['group', 'divider', 'action', 'fee-breakdown']);

function fenToYuan(fen) {
  const value = Number(fen);
  if (!Number.isFinite(value)) return '';
  return (value / 100).toFixed(2);
}

export function parseExpressQuotes(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  const text = String(raw).trim();
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

export function buildFeeBreakdownRows(field, values) {
  const props = fieldProps(field);
  const rowsCfg = Array.isArray(props.rows) ? props.rows : [];
  const source = values && typeof values === 'object' ? values : {};
  const rows = [];
  for (const row of rowsCfg) {
    if (!row || typeof row !== 'object') continue;
    const label = String(row.label || '').trim();
    const sourceKey = String(row.sourceKey || row.key || '').trim();
    if (!label || !sourceKey) continue;
    const raw = String(source[sourceKey] || '').trim();
    if (!raw) continue;
    const fmt = String(row.format || 'money_fen').trim().toLowerCase();
    let display = raw;
    if (fmt === 'money_fen') {
      display = `¥${fenToYuan(raw)}`;
    }
    rows.push({
      label,
      value: display,
      emphasis: Boolean(row.emphasis),
    });
  }
  return rows;
}

const WIDGET_REGISTRY = {
  'express-pickup': SFormWidgetExpressPickup,
  'oauth-movie': SFormWidgetOauthPick,
  'oauth-food': SFormWidgetOauthPick,
};

export function fieldProps(field) {
  return field?.props && typeof field.props === 'object' ? field.props : {};
}

export function resolveWidgetComponent(field) {
  const widgetId = String(fieldProps(field).widget || '').trim();
  return WIDGET_REGISTRY[widgetId] || null;
}

export function widgetIdFromField(field) {
  return String(fieldProps(field).widget || '').trim();
}

export function isDisplayOnlyField(field) {
  return DISPLAY_ONLY_FIELD_TYPES.has(String(field?.type || ''));
}

export function parseAddressPayload(raw) {
  if (!raw) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    const source = raw;
    const area = String(source.areaName || source.area || '').trim();
    const detail = String(source.detail || source.detailAddress || '').trim();
    const full = String(source.full || source.addr || '').trim() || `${area}${detail}`.trim();
    return {
      name: String(source.name || '').trim(),
      mobile: String(source.mobile || '').trim(),
      areaName: area,
      detail,
      full,
    };
  }
  const text = String(raw).trim();
  if (!text) return {};
  if (!text.startsWith('{')) {
    return { full: text, detail: text };
  }
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object') {
      return { full: text, detail: text };
    }
    return parseAddressPayload(parsed);
  } catch (_) {
    return { full: text, detail: text };
  }
}

export function resolveDependsOnValues(dependsOn, values) {
  const keys = Array.isArray(dependsOn) ? dependsOn : [];
  const out = {};
  for (const key of keys) {
    const name = String(key || '').trim();
    if (!name) continue;
    const raw = values?.[name];
    if (raw === undefined || raw === null) continue;
    const text = String(raw).trim();
    if (!text) continue;
    if (text.startsWith('{')) {
      const address = parseAddressPayload(text);
      out[name] = address.full || address.detail || text;
    } else {
      out[name] = text;
    }
  }
  return out;
}

export function submissionFieldKeys(fields) {
  return (fields || [])
    .filter((field) => !isDisplayOnlyField(field) && field?.type !== 'hidden')
    .map((field) => String(field.key || ''))
    .filter(Boolean);
}

function parseWidgetPayload(raw) {
  if (!raw) {
    return {};
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return { ...raw };
  }
  if (typeof raw !== 'string') {
    return {};
  }
  const text = raw.trim();
  if (!text) {
    return {};
  }
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (_) {
    return {};
  }
}

/** Merge widget/address JSON payloads into flat checkout formValues. */
const ADDRESS_ROLE_EXPAND = {
  send: ['send_name', 'send_mobile', 'send_addr'],
  rec: ['rec_name', 'rec_mobile', 'rec_addr'],
};

function addressFieldShouldExpand(field) {
  const props = fieldProps(field);
  if (props.expand === false) return false;
  if (props.expand === true) return Boolean(ADDRESS_ROLE_EXPAND[props.role]);
  return false;
}

function expandAddressField(field, out) {
  const props = fieldProps(field);
  const keys = ADDRESS_ROLE_EXPAND[props.role];
  if (!keys) return;
  const [nameKey, mobileKey, addrKey] = keys;
  if (nameKey in out || mobileKey in out) {
    if (field.key !== addrKey) {
      delete out[field.key];
    }
    return;
  }
  const parsed = parseAddressPayload(out[field.key]);
  if (!Object.keys(parsed).length) return;
  if (parsed.name) out[nameKey] = parsed.name;
  if (parsed.mobile) out[mobileKey] = parsed.mobile;
  const addr = parsed.full || parsed.detail || '';
  if (addr) out[addrKey] = addr;
  if (field.key !== addrKey) {
    delete out[field.key];
  }
}

export function flattenFormValues(fields, values) {
  const out = { ...(values || {}) };
  for (const field of fields || []) {
    if (isDisplayOnlyField(field)) {
      delete out[field.key];
      continue;
    }
    if (field?.type === 'address' && addressFieldShouldExpand(field)) {
      expandAddressField(field, out);
      continue;
    }
    if (field?.type !== 'widget') {
      continue;
    }
    if (fieldProps(field).expand === false) {
      continue;
    }
    const parsed = parseWidgetPayload(out[field.key]);
    if (!Object.keys(parsed).length) {
      continue;
    }
    Object.assign(out, parsed);
    delete out[field.key];
  }
  return out;
}

export function buildCheckoutPayload({ skuId, count = 1, formValues, requiresShipping = true }) {
  const payload = {
    items: [
      {
        skuId,
        count,
        formValues: formValues || {},
      },
    ],
  };
  if (requiresShipping === false) {
    payload.deliveryType = 3;
  }
  return payload;
}

export function checkoutFieldsFromSchema(formSchema) {
  return (formSchema || []).filter((field) => (field.phase || 'checkout') === 'checkout');
}

export function productNeedsFormPage(formSchema) {
  return checkoutFieldsFromSchema(formSchema).some((field) => field.type === 'widget');
}
