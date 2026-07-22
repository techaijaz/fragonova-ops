# Perfume Decanting Business — Order, Inventory & Finance App
## PRD + TRD + App Flow + UI/UX Design Brief

---

# 1. PRODUCT REQUIREMENTS DOCUMENT (PRD)

## 1.1 Overview
A standalone web application to run a perfume decanting business end-to-end — replacing the current Google Sheets-based order and inventory management. The store operates on **Shopify**; shipping is fulfilled through **ShipRocket**. The app will sync data from both platforms and add layers (decant-specific inventory, vendor accounts, profit tracking) that neither Shopify nor ShipRocket natively provide for a decanting business model.

## 1.2 Problem Statement
- Orders come in via Shopify but are manually tracked in Google Sheets — error-prone, no automation, no real-time stock visibility.
- No system currently models the "decanting" business logic: one source bottle → multiple sellable decant units of different sizes.
- Shipping status requires manually opening ShipRocket dashboard and searching by AWB number — no unified view.
- No financial visibility: vendor dues, inventory valuation, per-order profit (after shipping + gateway charges), and expenses are not tracked systematically.

## 1.3 Goals
1. Eliminate Google Sheets — single source of truth for orders, products, and inventory.
2. Automate order intake from Shopify (webhooks, near real-time).
3. Model two-layer inventory: source bottles → decant stock, with full batch traceability.
4. Automate shipping: create shipments, generate AWBs, and track deliveries from within the app (no separate ShipRocket dashboard visits).
5. Sync COD remittance from ShipRocket for payment reconciliation.
6. Provide a complete Accounts module: vendor ledgers, inventory valuation, sales, all charges/expenses, and net profit — at order, day, month, and product level.

## 1.4 Target User
- The business owner/operator (single or small team use), managing orders, decanting, shipping, and finances personally.

## 1.5 Out of Scope (for now)
- Customer-facing storefront changes (Shopify storefront remains as-is).
- Multi-warehouse support (single location assumed).
- Multi-currency (INR only).
- Automated tax filing/GST return generation (expense/sales data can feed into this later, but not built now).

## 1.6 Features & User Stories

### A. Orders
- As the owner, I want Shopify orders to appear in my app automatically, so I don't manually copy data from Sheets.
- As the owner, I want to see order status (New → Confirmed → Decanting Pending → Packed → Shipped → Delivered/RTO/Cancelled) so I know what needs action.
- As the owner, I want to manually add an offline order (e.g., Instagram DM sale) so all sales are in one place.

### B. Products
- As the owner, I want each fragrance and its decant sizes (3ml, 6ml, 10ml, full bottle) mapped to their Shopify product/variant, so stock and orders stay in sync.

### C. Inventory (Two-Layer)
- As the owner, I want to log source bottle purchases (batch, ml, cost, date) so I know my raw stock.
- As the owner, I want to log a "decanting session" (source batch → size → quantity produced) so decant-ready stock updates automatically and source ml is deducted.
- As the owner, I want low-stock alerts on both source bottles and decant-ready stock so I never run out unexpectedly.
- As the owner, I want to see which source batch a shipped decant came from, for traceability (e.g., quality complaints).

### D. Shipping (ShipRocket)
- As the owner, I want to create a ShipRocket shipment and generate an AWB directly from a packed order, without logging into ShipRocket separately.
- As the owner, I want to see live tracking status (In Transit, Out for Delivery, Delivered, RTO) inside my order list.
- As the owner, I want COD remittance data synced so I know what ShipRocket has settled to me and what's pending.

### E. Accounts & Finance
- As the owner, I want to see total inventory value in ₹ at any time.
- As the owner, I want a vendor ledger — how much I've ordered, paid, and still owe each vendor.
- As the owner, I want to see gross sales, and net profit after cost of goods, ShipRocket shipping charges, payment gateway charges, and general expenses.
- As the owner, I want to log general expenses (packaging, rent, marketing, etc.) manually.
- As the owner, I want profit visibility per order, per fragrance, per day/month.

## 1.7 Success Metrics
- Zero manual Google Sheets entry for new orders within Phase 1.
- Order-to-ship time visibility (dashboard reduces missed/delayed orders).
- Monthly P&L available without manual spreadsheet reconciliation.

---

# 2. TECHNICAL REQUIREMENTS DOCUMENT (TRD)

## 2.1 Tech Stack
- **Frontend:** React + Vite + Tailwind CSS + ShadCN UI + Framer Motion + React Icons
- **Backend:** Node.js + Express
- **ORM:** Prisma
- **Database:** MySQL
- **Hosting:** Existing VPS, managed via PM2 (separate app instance/subdomain from HOPS)
- **External APIs:** Shopify Admin API (REST/GraphQL + Webhooks), ShipRocket API

## 2.2 Integrations

### Shopify
- **Auth:** Custom App (created in Shopify Admin → Settings → Apps → Develop apps) → Admin API access token, stored in `.env`, never in chat/code.
- **Webhooks consumed:**
  - `orders/create`
  - `orders/updated`
  - `orders/cancelled`
- **Sync jobs:**
  - Product/variant sync (manual trigger or scheduled) to map Shopify products ↔ internal product/variant records.
  - Nightly reconciliation cron: re-fetch last 24h of orders as a backup in case a webhook is missed.

### ShipRocket
- **Auth:** Email + password login → `POST /v1/external/auth/login` → Bearer token (valid ~10 days). Cron job refreshes token before expiry.
- **Endpoints used:**
  - `GET /v1/external/courier/serviceability` — courier options + rates by pincode/weight
  - `POST /v1/external/orders/create/adhoc` — create shipment from a packed order
  - `POST /v1/external/courier/assign/awb` — AWB generation
  - `POST /v1/external/courier/generate/pickup` — schedule pickup
  - `GET/POST /v1/external/courier/generate/label`, `/v1/external/manifests/generate` — label/manifest generation
  - `GET /v1/external/courier/track/awb/{awb}` — tracking status (polled periodically; webhook used instead if available on account tier)
  - Remittance/payment report endpoint (exact path to be confirmed against ShipRocket's current API docs/account plan at integration time) — for COD settlement sync

## 2.3 Data Model (Core Tables — high level)

- `products` — fragrance master (name, description, category)
- `product_variants` — decant size per product (size_ml, price, shopify_variant_id)
- `orders` — synced from Shopify + manual entries (customer, status, payment_status, totals, source: shopify/manual)
- `order_items` — line items per order (variant, qty, price)
- `source_batches` — bottle purchases (product, batch_no, total_ml, cost, purchase_date, vendor_id)
- `decant_sessions` — decanting log (source_batch_id, variant_id, qty_produced, wastage_ml, date)
- `decant_stock` — current ready-to-ship stock per variant (derived/maintained by decant_sessions and order deductions)
- `shipments` — ShipRocket shipment per order (awb, courier, status, shipping_charge, pickup details)
- `vendors` — vendor master (name, contact)
- `purchases` — vendor purchase records (linked to source_batches, amount, paid/due)
- `expenses` — manual expense entries (category, amount, date, note)
- `order_charges` — per-order deductions (shipping_charge, gateway_charge)
- `remittances` — ShipRocket COD settlement records (amount, date, linked orders)

## 2.4 Non-Functional Requirements
- Webhook endpoints must verify Shopify HMAC signature for security.
- API tokens/secrets stored only in environment variables, never committed or shared in plaintext chat.
- Idempotent webhook handling (Shopify may retry webhooks — avoid duplicate order records).
- Basic role: single-user/admin access is sufficient for MVP (no multi-user roles required initially).

## 2.5 Build Phasing
1. **Phase 1:** Shopify order + product sync, two-layer inventory, decanting log — replaces Google Sheets.
2. **Phase 2:** ShipRocket integration — shipment creation, AWB, tracking.
3. **Phase 3:** Accounts module — vendors, expenses, charges, P&L.
4. **Phase 4:** Reports (best-sellers, margin analysis, wastage %) and polish.

---

# 3. APP FLOW

## 3.1 Order Lifecycle
```
Shopify Order Created
   → Webhook received → Order saved in app (status: New)
   → Decant stock check:
        - Sufficient → status: Confirmed
        - Insufficient → status: Needs Decanting (flagged in queue)
   → Owner logs decanting session (if needed) → stock updated → status: Confirmed
   → Owner packs order → status: Packed
   → Owner clicks "Ship Now" → ShipRocket shipment created → AWB generated → status: Shipped
   → Tracking polling/webhook updates → In Transit → Delivered / RTO
   → (If COD) Remittance sync matches payment → order marked reconciled
```

## 3.2 Inventory Flow
```
Vendor Purchase → Source Batch created (ml, cost, vendor linked)
   → Decanting Session logged → source ml deducted, decant stock (per size) increased
   → Order placed → decant stock deducted at order-confirm
   → Low stock thresholds trigger alerts (source bottle level + decant level)
```

## 3.3 Shipping Flow
```
Packed Order → Check courier serviceability (pincode/weight)
   → Select/auto-select courier → Create shipment (ShipRocket API)
   → AWB assigned → Schedule pickup → Generate label/manifest
   → Track status (poll/webhook) → Update order status in app
```

## 3.4 Finance Flow
```
Vendor Purchase → Purchase record + Vendor ledger updated (amount due)
Order Delivered → Revenue recognized
Shipment → Shipping charge logged against order (order_charges)
Payment settled → Gateway charge logged against order (order_charges)
Manual Expense entries → logged independently (category-wise)

Net Profit (per order/day/month/product) =
   Revenue − COGS (decant cost basis) − Shipping charges − Gateway charges − Expenses
```

## 3.5 Key User Journeys
1. **Morning check:** Owner opens dashboard → sees today's new orders, low-stock alerts, "needs decanting" queue.
2. **Decanting session:** Owner selects source batch → size → quantity → logs it → stock updates instantly.
3. **Pack & ship:** Owner marks order Packed → clicks Ship Now → AWB auto-generated → label printed.
4. **Month-end:** Owner opens Accounts → sees P&L, vendor dues, inventory valuation — no manual spreadsheet work.

---

# 4. UI/UX DESIGN BRIEF

## 4.1 Design Principles
- **Operational clarity over decoration** — this is a daily-use ops tool, not a marketing site. Prioritize scanability: status badges, color-coded alerts, dense-but-readable tables.
- **Single dashboard as home base** — owner should get the full "what needs my attention today" picture within one screen, no digging.
- **Minimal clicks for repetitive actions** — logging a decanting session, shipping an order, and adding an expense should each be reachable in 1-2 clicks from relevant screens.

### 4.1.1 UI Technology Stack
- **Component Library:** ShadCN UI — accessible, composable primitives built on Radix UI, styled with Tailwind CSS.
- **Animations:** Framer Motion — smooth transitions, micro-interactions, and gesture-based animations throughout the app.
- **Icons:** React Icons — consistent, lightweight iconography across all screens.
- **Design Patterns:** UI UX Pro Max — modern, dense operational UI patterns optimized for desktop workflows with data-heavy tables and quick-action workflows.

## 4.2 Core Screens

### Dashboard (Home)
- Today's new orders count + list
- "Needs Decanting" queue (highlighted, action-required styling)
- Low stock alerts (source bottles + decant stock), color-coded (yellow = low, red = critical)
- Quick stats cards: Today's Orders, Today's Revenue, Pending Shipments, Vendor Dues Total
- Ready-to-ship queue with one-click "Ship Now"

### Orders
- Table view: Order #, Customer, Items, Status (badge), Payment Status, Tracking (AWB + carrier + live status), Date
- Filter/sort by status, date range, fragrance
- Order detail drawer/page: full item breakdown, shipping info, timeline of status changes
- Manual order entry form (for offline sales)

### Products & Inventory
- Product list with variants (sizes) and current decant stock per variant
- Source batch table: batch #, product, ml remaining, cost, vendor, purchase date
- "Log Decanting Session" form: select source batch → variant/size → quantity → auto-shows ml deducted, wastage buffer field
- Stock history/timeline per product for traceability

### Shipping
- Ready-to-ship queue (packed, not yet shipped)
- Shipment creation flow: courier options (rate comparison), AWB confirmation, label/manifest download
- Shipped orders with live tracking status; RTO/failed delivery flagged distinctly

### Accounts
- P&L snapshot card: Revenue, COGS, Shipping Charges, Gateway Charges, Expenses, Net Profit — selectable time range (today/week/month/custom)
- Vendor ledger table: vendor name, total ordered, total paid, amount due
- Inventory valuation widget (total ₹ tied up in stock)
- Expense entry form + expense list (category-filterable)
- Remittance log (ShipRocket COD settlements vs expected)

### Reports (Phase 4)
- Best-selling fragrance/size (chart)
- Margin per decant (table/chart)
- Wastage % over time

## 4.3 Visual/Interaction Notes
- Status badges: consistent color system across the app (e.g., grey=new, blue=confirmed, amber=needs action, purple=shipped, green=delivered, red=RTO/cancelled).
- Tables are the primary UI pattern (this is a data-dense ops tool) — sorting, filtering, and search should be available on every major table.
- Forms for logging (decanting session, expense entry, manual order) should be quick — minimal required fields, sensible defaults, keyboard-friendly.
- Mobile responsiveness is a plus but not primary — this is expected to be used mostly on desktop/laptop given the data density, though a simplified mobile view for checking today's orders/tracking would be valuable.

---

*End of document. This covers Phases 1–4 as scoped in discussion. Sections can be expanded further (e.g., exact API request/response schemas, wireframes) once implementation begins.*
