# OKX-Trader Skill for OpenClaw

A professional-grade automated trading skill for OpenClaw, specifically optimized for the OKX exchange. It provides a robust, dual-strategy grid trading system with built-in risk management and high-efficiency reporting.

## 🌟 Core Concepts: The Dual-Grid Strategy

This skill is designed with a **Macro + Micro** dual-layer approach to maximize market coverage:

1.  **Macro Grid (0.0020 BTC Base):**
    *   **Purpose:** Long-term accumulation and capital growth.
    *   **Logic:** Larger position sizes designed to capture significant market moves and maintain a core position during bullish trends.
2.  **Micro Grid (0.0003 BTC Scalper):**
    *   **Purpose:** High-frequency cash flow and activity.
    *   **Logic:** Small, agile positions that scalp minor price fluctuations (0.1% - 0.5%) to generate consistent small profits even in sideways markets.

## 🛠 Trading Logic & Protections

*   **Auto-Trailing (Rescale):** The system monitors the price 24/7. If the market moves beyond the active grid range, it automatically cancels old orders and "re-centers" the grid around the new price.
*   **Cost Protection:** Built-in logic prevents the bot from selling below your average cost basis plus a minimum profit margin, avoiding "selling at a loss" during dips.
*   **Overload Protection:** You can define a `maxPosition` limit. Once reached, the bot will stop buying and wait for recovery to protect your account balance.
*   **Efficiency:** Formatted output is optimized for AI agents, using minimal tokens for reporting and status checks.

## 🚀 Getting Started

### 1. Installation
```bash
openclaw skill install okx-trader
```

### 2. Configuration
Add your API credentials to your `openclaw.json`. Ensure your API key has **Trade** and **Read** permissions enabled.
```json
"skills": {
  "entries": {
    "okx": {
      "apiKey": "YOUR_API_KEY",
      "secretKey": "YOUR_SECRET_KEY",
      "passphrase": "YOUR_PASSPHRASE",
      "isSimulation": false
    }
  }
}
```

### 3. Automated Tasks (Cron)
We recommend setting up two Cron jobs:
- `okx_grid_maintain`: Every 5 minutes (Silent mode).
- `okx_report`: Every hour (Announce mode).

---

# OKX-Trader 交易技能 (OpenClaw)

这是一个为 OpenClaw 设计的专业级自动化交易技能，专门针对 OKX 交易所进行了优化。它提供了一套稳健的“双层网格”交易系统，内置风险控制和高效率的报表功能。

## 🌟 核心理念：双重网格策略

本技能采用 **大网格 (Macro) + 小网格 (Micro)** 的双层架构，旨在全方位捕捉市场机会：

1.  **大网格 (0.0020 BTC 底仓):**
    *   **设计目的**：长期积累与资产增值。
    *   **交易逻辑**：较大的单笔仓位，旨在捕捉市场的主流波段，在趋势行情中维持核心底仓并获取大额利润。
2.  **小网格 (0.0003 BTC 高频):**
    *   **设计目的**：维持现金流与账户活跃度。
    *   **交易逻辑**：极小的单笔仓位，灵活捕捉 0.1% - 0.5% 的细微波动。即使在横盘震荡行情中，也能通过频繁成交贡献持续的小额收益。

## 🛠 交易逻辑与保护机制

*   **自动追踪 (Rescale)**：系统 24/7 监控价格。一旦价格偏离当前网格有效范围，脚本会自动撤销旧单并在新价格中心重新铺设网格，确保策略永不踏空。
*   **成本保护**：内置成本校验逻辑。当价格处于成本价以下时，系统将拒绝执行任何导致亏损的卖出操作，确保每一笔配对成交都是盈利的。
*   **过载保护**：可配置 `maxPosition` 最大持仓限制。达到上限后系统将自动停止买入补仓，保护账户资金安全。
*   **AI 友好**：报表输出经过极简化设计，在保证信息完整的条件下，将 Token 消耗降至最低。

## 🚀 快速开始

### 1. 安装
```bash
openclaw skill install okx-trader
```

### 2. 配置
在您的 `openclaw.json` 中添加 API 信息（建议仅开启“交易”与“读取”权限）：
```json
"skills": {
  "entries": {
    "okx": {
      "apiKey": "你的APIKEY",
      "secretKey": "你的SECRET",
      "passphrase": "你的口令",
      "isSimulation": false
    }
  }
}
```

### 3. 自动化任务建议
建议在 OpenClaw 中配置以下 Cron：
- `okx_grid_maintain`: 每 5 分钟执行一次，用于维护挂单。
- `okx_report`: 每小时执行一次，用于推送收益报表。

## 📄 License
MIT
