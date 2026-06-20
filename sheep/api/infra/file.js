import { baseUrl, apiPath, tenantId } from '@/sheep/config';
import request, { getAccessToken } from '@/sheep/request';
import { isSaleorBff } from '@/sheep/helper/saleor';

const FileApi = {
  // 上传文件
  uploadFile: (file, directory = '') => {
    uni.showLoading({
      title: '上传中',
    });
    const uploadUrl = isSaleorBff
      ? baseUrl + '/mall/v1/infra/file/upload'
      : baseUrl + apiPath + '/infra/file/upload';
    return new Promise((resolve, reject) => {
      uni.uploadFile({
        url: uploadUrl,
        filePath: file,
        name: 'file',
        header: {
          Accept: '*/*',
          'tenant-id': tenantId,
          Authorization: 'Bearer ' + getAccessToken(),
        },
        formData: {
          directory,
        },
        success: (uploadFileRes) => {
          let result = JSON.parse(uploadFileRes.data);
          const failed = isSaleorBff ? result.code !== 0 : result.error === 1;
          if (failed) {
            uni.showToast({
              icon: 'none',
              title: result.msg || '上传失败',
            });
            reject(result);
            return;
          }
          resolve(result);
        },
        fail: (error) => {
          console.log('上传失败：', error);
          reject(error);
        },
        complete: () => {
          uni.hideLoading();
        },
      });
    });
  },

  // 获取文件预签名地址
  getFilePresignedUrl: (name, directory) => {
    return request({
      url: '/infra/file/presigned-url',
      method: 'GET',
      params: {
        name,
        directory,
      },
    });
  },

  // 创建文件
  createFile: (data) => {
    return request({
      url: '/infra/file/create', // 请求的 URL
      method: 'POST', // 请求方法
      data: data, // 要发送的数据
    });
  },
};

export default FileApi;
