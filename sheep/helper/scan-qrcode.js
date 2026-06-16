/**
 * Scan QR code from camera or image file.
 * Image decode uses multi-scale + multiple inversion modes (WeChat QR with logo).
 */
import jsQR from 'jsqr';

const IMAGE_DECODE_SCALES = [0.4, 0.5, 0.6, 0.75, 1, 1.25, 1.5, 2];
const MAX_DECODE_DIM = 1600;

function decodeWithJsQR(imageData) {
  const attempts = ['attemptBoth', 'dontInvert', 'invertFirst'];
  for (const inversionAttempts of attempts) {
    const result = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts,
    });
    if (result?.data) {
      return String(result.data).trim();
    }
  }
  return '';
}

function decodeImageDataMultiScale(imageData, width, height, redrawAtScale) {
  const direct = decodeWithJsQR(imageData);
  if (direct) {
    return direct;
  }
  for (const scale of IMAGE_DECODE_SCALES) {
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));
    if (Math.max(w, h) > MAX_DECODE_DIM) {
      continue;
    }
    const scaled = redrawAtScale(w, h);
    if (!scaled) {
      continue;
    }
    const text = decodeWithJsQR(scaled);
    if (text) {
      return text;
    }
  }
  return '';
}

function scanFromCamera() {
  return new Promise((resolve, reject) => {
    uni.scanCode({
      onlyFromCamera: true,
      sound: 'default',
      scanType: ['qrCode', 'barCode'],
      success: (res) => {
        const text = String(res.result || '').trim();
        if (!text) {
          reject(new Error('未识别到二维码内容'));
          return;
        }
        resolve(text);
      },
      fail: (err) => {
        if (err?.errMsg === 'scanCode:fail cancel') {
          reject(new Error('cancel'));
          return;
        }
        reject(new Error('扫码失败'));
      },
    });
  });
}

function decodeImageOnH5(filePath) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      try {
        const srcW = image.naturalWidth || image.width;
        const srcH = image.naturalHeight || image.height;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('图片解析失败'));
          return;
        }
        const redrawAtScale = (w, h) => {
          canvas.width = w;
          canvas.height = h;
          ctx.clearRect(0, 0, w, h);
          ctx.drawImage(image, 0, 0, w, h);
          return ctx.getImageData(0, 0, w, h);
        };
        canvas.width = srcW;
        canvas.height = srcH;
        ctx.drawImage(image, 0, 0, srcW, srcH);
        const text = decodeImageDataMultiScale(
          ctx.getImageData(0, 0, srcW, srcH),
          srcW,
          srcH,
          redrawAtScale,
        );
        if (!text) {
          reject(new Error('未识别到二维码，请换一张清晰的图片'));
          return;
        }
        resolve(text);
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => reject(new Error('图片加载失败'));
    if (filePath.startsWith('blob:') || filePath.startsWith('data:')) {
      image.src = filePath;
      return;
    }
    image.crossOrigin = 'anonymous';
    image.src = filePath;
  });
}

function decodeImageOnMp(filePath, canvasSize = 1024) {
  return new Promise((resolve, reject) => {
    uni.getImageInfo({
      src: filePath,
      success: (info) => {
        const srcW = info.width;
        const srcH = info.height;
        const scales = IMAGE_DECODE_SCALES;
        let scaleIdx = 0;

        const tryNext = () => {
          if (scaleIdx >= scales.length) {
            reject(new Error('未识别到二维码，请换一张清晰的图片'));
            return;
          }
          const scale = scales[scaleIdx];
          scaleIdx += 1;
          const w = Math.max(1, Math.round(srcW * scale));
          const h = Math.max(1, Math.round(srcH * scale));
          if (Math.max(w, h) > MAX_DECODE_DIM) {
            tryNext();
            return;
          }
          const ctx = uni.createCanvasContext('mallQrDecodeCanvas');
          ctx.clearRect(0, 0, canvasSize, canvasSize);
          ctx.drawImage(filePath, 0, 0, w, h);
          ctx.draw(false, () => {
            setTimeout(() => {
              uni.canvasGetImageData({
                canvasId: 'mallQrDecodeCanvas',
                x: 0,
                y: 0,
                width: w,
                height: h,
                success: (res) => {
                  const imageData = {
                    data: new Uint8ClampedArray(res.data),
                    width: res.width,
                    height: res.height,
                  };
                  const text = decodeWithJsQR(imageData);
                  if (text) {
                    resolve(text);
                    return;
                  }
                  tryNext();
                },
                fail: () => tryNext(),
              });
            }, 80);
          });
        };

        tryNext();
      },
      fail: () => reject(new Error('图片加载失败')),
    });
  });
}

function currentUniPlatform() {
  try {
    return uni.getSystemInfoSync().uniPlatform || '';
  } catch (error) {
    return '';
  }
}

function chooseQrImage() {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count: 1,
      sourceType: ['album'],
      sizeType: ['original'],
      success: async (res) => {
        const filePath = res?.tempFilePaths?.[0];
        if (!filePath) {
          reject(new Error('未选择图片'));
          return;
        }
        try {
          const platform = currentUniPlatform();
          if (platform === 'web') {
            resolve(await decodeImageOnH5(filePath));
            return;
          }
          if (platform === 'mp-weixin') {
            resolve(await decodeImageOnMp(filePath));
            return;
          }
          reject(new Error('当前平台请使用摄像头扫码'));
        } catch (error) {
          reject(error);
        }
      },
      fail: (err) => {
        if (err?.errMsg?.includes('cancel')) {
          reject(new Error('cancel'));
          return;
        }
        reject(new Error('选择图片失败'));
      },
    });
  });
}

export async function scanQrCode({ fromImage = false } = {}) {
  if (fromImage) {
    return chooseQrImage();
  }
  return scanFromCamera();
}

export default {
  scanQrCode,
};
