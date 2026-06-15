import { loadEnv } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';
import path from 'path';
// import viteCompression from 'vite-plugin-compression';
import uniReadPagesV3Plugin from './sheep/router/utils/uni-read-pages-v3';
import mpliveMainfestPlugin from './sheep/libs/mplive-manifest-plugin';


// https://vitejs.dev/config/
export default ({ mode }) => {
	const env = loadEnv(mode, __dirname, 'SHOPRO_');
	const yudaoApiTarget =
		env.SHOPRO_YUDAO_API_TARGET ||
		(mode === 'yudao-local' ? 'http://127.0.0.1:48080' : 'http://api-dashboard.yudao.iocoder.cn');
	const saleorApiTarget = env.SHOPRO_SALEOR_API_TARGET || 'http://127.0.0.1:8010';
	const enableYudaoProxy =
		env.SHOPRO_SALEOR_BFF !== '1' && (mode === 'yudao-full' || mode === 'yudao-local');
	const enableSaleorProxy = env.SHOPRO_SALEOR_BFF === '1';
	return {
		envPrefix: "SHOPRO_",
		resolve: {
			alias: {
				'@': path.resolve(__dirname),
				sheep: path.resolve(__dirname, 'sheep'),
				// mp-weixin CLI 无 uni-h5-vite 的 vue 重定向，需显式指向 dcloudio 补丁版
				...(process.env.UNI_PLATFORM === 'mp-weixin'
					? { vue: '@dcloudio/uni-h5-vue' }
					: {}),
			},
		},
		plugins: [
			uni(),
			// viteCompression({
			// 	verbose: false
			// }),
			uniReadPagesV3Plugin({
				pagesJsonDir: path.resolve(__dirname, './pages.json'),
				includes: ['path', 'aliasPath', 'name', 'meta'],
			}),
			mpliveMainfestPlugin(env.SHOPRO_MPLIVE_ON)
		],
		server: {
			host: true,
			port: env.SHOPRO_DEV_PORT,
			hmr: {
				overlay: true,
			},
			proxy: enableSaleorProxy
				? {
						'/mall': {
							target: saleorApiTarget,
							changeOrigin: true,
							secure: false,
						},
						'/system': {
							target: saleorApiTarget,
							changeOrigin: true,
							secure: false,
						},
						'/pay': {
							target: saleorApiTarget,
							changeOrigin: true,
							secure: false,
						},
						...(env.SHOPRO_VOCECHAT_PROXY_TARGET
							? (() => {
									const voceTarget = env.SHOPRO_VOCECHAT_PROXY_TARGET;
									return {
										'/vocechat': {
											target: voceTarget,
											changeOrigin: true,
											secure: false,
											rewrite: (p) => p.replace(/^\/vocechat/, ''),
										},
										// VoceChat API（商城 BFF 走 /mall，不冲突）
										'/api': {
											target: voceTarget,
											changeOrigin: true,
											secure: false,
										},
										// 仅 widget 静态资源；勿代理整个 /static（会打断 uni-app 页面模块）
										'^/static/js/widget': {
											target: voceTarget,
											changeOrigin: true,
											secure: false,
										},
										'^/static/css/widget': {
											target: voceTarget,
											changeOrigin: true,
											secure: false,
										},
										'/resource': {
											target: voceTarget,
											changeOrigin: true,
											secure: false,
										},
									};
								})()
							: {}),
					}
				: enableYudaoProxy
				? {
						'/app-api': {
							target: yudaoApiTarget,
							changeOrigin: true,
							secure: false,
						},
					}
				: undefined,
		},
	};
};
