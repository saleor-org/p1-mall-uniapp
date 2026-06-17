# p1-mall-uniapp 本地开发速查

> Saleor 微信小程序商城前端。UI 来自 [yudao-mall-uniapp](https://github.com/yudaocode/yudao-mall-uniapp)，API 逐步对接到 `p1-wechat-shop`（Saleor BFF）。  
> 总方案见仓库根目录 [WECHAT-MALL-SCHEME.md](../WECHAT-MALL-SCHEME.md)。

## 三种启动模式（必记）

| 命令 | 连哪个后台 | 地址 | 干什么用 |
|------|------------|------|----------|
| **`npm run dev:yudao-local`** | **本地 ruoyi-vue-pro** | Vite 代理 → `http://127.0.0.1:48080/app-api` | **推荐摸底**：完整 UI + 本地数据，整理需求后再换 Saleor |
| **`npm run dev:yudao-full`** | **芋道官方演示 Java API** | 经 Vite 代理 → `api-dashboard.yudao.iocoder.cn` | 演示站（WSL 常超时，仅网络通时用） |
| **`npm run dev:saleor`** | **p1-wechat-shop BFF → Saleor** | `http://127.0.0.1:8010` | **对接 Saleor** 真实商品/订单（已实现模块才有效） |

`npm run dev:h5` 与 `dev:saleor` 相同。

### 数据流示意

**yudao-full（完整界面）：**

```
浏览器 localhost:3000  →  /app-api/*  →  api-dashboard.yudao.iocoder.cn（芋道演示，非 Saleor）
```

**saleor（你的商城）：**

```
浏览器 localhost:3000  →  /mall/v1/*、/wx/v1/*  →  p1-wechat-shop:8010  →  Saleor GraphQL :8000
```

## 配置文件

| 文件 | 模式 |
|------|------|
| `.env.yudao-local` | 本地芋道 Java（`SHOPRO_YUDAO_API_TARGET=http://127.0.0.1:48080`） |
| `.env.yudao-full` | 芋道云端演示（`SHOPRO_SALEOR_BFF=0`，`SHOPRO_API_PATH=/app-api`） |
| `.env.saleor` | Saleor BFF（`SHOPRO_SALEOR_BFF=1`，`SHOPRO_API_PATH=` 空） |
| `.env` | 默认等同 `.env.saleor` |

## 常用命令

```bash
cd ~/saleor-org/p1-mall-uniapp

# 第一次
npm install --legacy-peer-deps --registry=https://registry.npmmirror.com

# 完整芋道 UI + 本地 Java 后台（需先启动 ruoyi-vue-pro，见下）
npm run dev:yudao-local
# → http://localhost:3000/

# 完整芋道 UI + 官方演示 API（网络需能访问 iocoder.cn）
npm run dev:yudao-full
# → http://localhost:3000/

# Saleor 对接（需先启动 BFF + Saleor）
npm run dev:saleor
# → http://localhost:3000/
```

### Saleor 模式前置

```bash
# 终端 1
cd ~/saleor-org && ./setup-e2e-db.sh

# 终端 2
cd ~/saleor-org/p1-wechat-shop && source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8010
```

## 本地芋道后台（dev:yudao-local 前置）

> 目标：先跑通「芋道后台 + H5」，摸清全部页面/API，再按模块用 Saleor 替换。

### 1. 启用商城模块

`ruoyi-vue-pro/yudao-server/pom.xml` 里默认**注释掉了**商城依赖，需取消注释至少：

- `yudao-module-member`
- `yudao-module-pay`
- `yudao-module-product` / `promotion` / `trade` / `statistics`

### 2. 导入完整商城数据（与官方演示站一致）

资料目录（Windows）：`C:\Users\flynn\Desktop\yudao\00-sql文件`  
WSL 路径：`/mnt/c/Users/flynn/Desktop/yudao/00-sql文件`

一键导入（基础库 + mall + pay + member）：

```bash
~/saleor-org/ruoyi-vue-pro/script/import-full-mall.sh
~/saleor-org/ruoyi-vue-pro/script/start-yudao-server.sh
```

导入后约 **122 张表**、**13 个商品**、**41 个会员**、完整 DIY 演示首页与购物车数据。租户 1 已绑定 `127.0.0.1:3000` 与 `localhost:3000`。

**H5 会员登录（本地）**：任意 SQL 里存在的手机号 + 验证码 **`9999`**（`application.yaml` 里固定测试码）。

### 3. 基础设施

| 服务 | 端口 | 说明 |
|------|------|------|
| MySQL 8 | 3306 | `ruoyi-vue-pro.sql` + 官方 mall/pay/member SQL |
| Redis | 6379 | 可与 Saleor Valkey **共用**，芋道用 `database: 1` |
| yudao-server | **48080** | `/app-api` 给 H5，`/admin-api` 给管理端 |
| yudao-ui-admin-vue3 | 5173 等 | 运营后台（需单独 clone，见下） |

无本机 Java 时用 Docker Maven 编译：

```bash
cd ~/saleor-org/ruoyi-vue-pro
docker run --rm -v "$(pwd)":/work -v yudao-m2:/root/.m2 -w /work \
  maven:3.9-eclipse-temurin-17 mvn clean install -DskipTests -pl yudao-server -am
~/saleor-org/ruoyi-vue-pro/script/start-yudao-server.sh
```

管理端（可选，改商品/优惠券/支付配置）：

```bash
git clone https://gitee.com/yudaocode/yudao-ui-admin-vue3.git ~/saleor-org/yudao-ui-admin-vue3
cd ~/saleor-org/yudao-ui-admin-vue3
pnpm install && pnpm dev
# 登录 admin / admin123，API 指向 http://127.0.0.1:48080
```

### 4. 启动 H5

```bash
cd ~/saleor-org/p1-mall-uniapp
npm run dev:yudao-local
```

### 5. 摸底 → 需求清单 → Saleor 替换

按 `sheep/api/` 目录逐模块记录（商品/分类/购物车/订单/优惠券/秒杀/拼团/分销/会员/支付…），对照 `pages.json` 页面。每确认一项，在 BFF 实现对应 `/mall/v1/*`，前端切 `dev:saleor` 验证。

## 演示 API 连不上时

若 `api-dashboard.yudao.iocoder.cn` 超时（网络/防火墙）：

- `dev:yudao-full` 会自动使用 **本地 Mock 首页**（搜索栏 + 宫格 + Tab），避免白屏
- 分类/购物车等**业务数据**仍需要演示 API 或本地 RuoYi；对接 Saleor 请用 `dev:saleor`

## 当前已对接 Saleor 的模块

| 模块 | 状态 |
|------|------|
| 商品列表 / 搜索 / 详情 | ✅ `sheep/api/product/spu.js` |
| 分类 | ✅ `sheep/api/product/category.js` |
| 登录（本地短信 9999） | ✅ `sheep/api/member/auth.js` |
| 会员信息 | ✅ `sheep/api/member/user.js` |
| 购物车 | ✅ `sheep/api/trade/cart.js`（Saleor Checkout） |
| 地址 | ✅ `sheep/api/member/address.js` |
| 结算 / 下单 / 订单 | ✅ `sheep/api/trade/order.js` |
| 支付 | ❌ Phase 2 |

Saleor 模式下首页会跳转到商品列表（无 DIY 装修）。

## 不需要 HBuilderX 吗？

- **H5 浏览器**：`npm run dev:*` 即可，**不必** HBuilderX
- **微信小程序**：可用 `npm run dev:mp-weixin`，或 HBuilderX 运行到微信开发者工具

## Git 远程

- `origin` → `saleor-org/p1-mall-uniapp`（你的仓库）
- `upstream` → `yudaocode/yudao-mall-uniapp`（上游 UI，仅同步参考）
