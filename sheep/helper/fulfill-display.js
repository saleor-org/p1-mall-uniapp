/** H5 虚拟品履约文案（卡密 vs 直充） */

function firstItemName(order) {
  const items = order?.items;
  if (!Array.isArray(items) || !items.length) {
    return '';
  }
  return String(items[0]?.spuName || '');
}

export function isCardFulfillProduct(order) {
  const name = firstItemName(order);
  return name.includes('卡密');
}

export function fulfillProcessingText(order) {
  return isCardFulfillProduct(order)
    ? '正在为您发放卡密，请稍候…'
    : '正在为您处理订单，请稍候…';
}

export function fulfillFailText(order) {
  return isCardFulfillProduct(order)
    ? '卡密暂未到账，请下拉刷新或到订单详情查看'
    : '充值暂未成功，请下拉刷新或到订单详情查看';
}

export function hasSupplierOrderAccepted(order) {
  const items = order?.items;
  if (!Array.isArray(items)) {
    return false;
  }
  return items.some((item) => String(item?.supplierOrderId || '').trim());
}

/** 支付结果页：无供应商单号时的 failed 仍继续轮询 */
export function shouldPollFulfillStatus(order, pollCount, maxPolls) {
  const status = String(order?.fulfillStatus || '');
  if (!status) {
    return false;
  }
  if (status === 'processing') {
    return true;
  }
  if (status === 'failed' && pollCount < maxPolls && !hasSupplierOrderAccepted(order)) {
    return true;
  }
  return false;
}

/** 展示用状态：轮询中不把 retryable failed 当最终失败 */
export function displayFulfillStatus(order, pollCount, maxPolls) {
  const status = String(order?.fulfillStatus || '');
  if (shouldPollFulfillStatus(order, pollCount, maxPolls) && status === 'failed') {
    return 'processing';
  }
  return status;
}
