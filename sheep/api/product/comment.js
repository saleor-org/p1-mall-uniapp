import request from '@/sheep/request';
import { isSaleorBff, saleorEmpty } from '@/sheep/helper/saleor';

const CommentApi = {
  // 获得商品评价分页
  getCommentPage: (spuId, pageNo, pageSize, type) => {
    if (isSaleorBff) {
      return saleorEmpty.page();
    }
    return request({
      url: '/product/comment/page',
      method: 'GET',
      params: {
        spuId,
        pageNo,
        pageSize,
        type,
      },
      custom: {
        showLoading: false,
        showError: false,
      },
    });
  },
};
export default CommentApi;
