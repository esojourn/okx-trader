# OKX Trader Skill

A professional-grade automated trading agent skill for OKX. This skill enables the AI agent to manage grid trading strategies, monitor account performance, and handle market execution with built-in safety protocols.

## System Capabilities

### 1. Dual-Grid Execution
The agent operates two concurrent strategies:
- **Macro Grid:** Heavy positions for capturing major trend movements.
- **Micro Grid:** High-frequency scalp positions for extracting profit from minor volatility.

### 2. Auto-Trailing (Rescale) Logic
The skill automatically detects when the market price drifts outside the active grid range. It performs a "Rescale" operation:
- Cancels all legacy orders associated with the bot.
- Recalculates and re-centers the grid layout based on the current market ticker.
- Persists new range settings to `grid_settings.json`.

### 3. Risk Management & Protection
- **Cost Basis Guard:** Prevents the agent from placing sell orders below the average entry price (including a minimum profit buffer).
- **Inventory Control:** Respects `maxPosition` limits to prevent over-leveraging during extended downtrends.
- **Order Throttling:** Built-in delays between API calls to prevent rate-limiting.

## Available Tools

### `okx_report`
Generates a highly condensed PnL and status report optimized for LLM context windows.
- **Metrics included:** Trade count (Buy/Sell), Average prices, Total USDT volume per grid type, and Top pending orders.
- **Token Efficiency:** Uses pre-formatted text to ensure 0 token waste on raw data processing.

### `okx_grid_maintain`
The core execution tool that maintains the grid structure.
- **Functionality:** Synchronizes the local strategy state with the OKX order book. It places missing orders, cleans up stale orders, and triggers the Rescale logic if necessary.
- **Usage:** Typically run every 5 minutes via Cron.

## Internal Dependencies
This skill requires the following local files to exist in the workspace:
- `okx_data/config.json`: API credentials and simulation mode flag.
- `okx_data/grid_settings.json`: Strategy parameters (min/max price, grid count, sizes).
- `okx_data/logs/rescale_audit.json`: Persistent execution logs for auditing performance.

## Intelligence Instructions
When interacting with this skill, the agent should:
1. **Prefer formatted reports:** Use `okx_report` when the user asks "How is my trading doing?".
2. **Handle Errors Gracefully:** If an API error occurs (e.g., balance insufficient), report the specific error code to the user.
3. **Monitor Rescales:** Proactively notify the user if a significant price movement triggers a grid re-centering.
