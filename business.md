# NASAQ WPC Doors — Comprehensive Business Logic Specification

---

## 1. Executive Summary & Business Domain

### 1.1 Company Overview
**NASAQ (نسق)** is an enterprise manufacturing and sales management platform designed specifically for WPC (Wood-Plastic Composite) doors production, customization, showroom sales, and on-site installations.
- **Brand Identity**: Professional, manufacturing-focused ERP/CRM.
- **Brand Colors**: 
  - Primary: `#0D4F52` (Deep Teal)
  - Secondary: `#A99776` (Warm Sand Gold)
- **Official Workshop Contact**: +213 660 99 60 97
- **Base Currency**: Algerian Dinar (**DZD** / **DA**)
- **Unit of Measurement**: All architectural and technical dimensions (height, width, thickness, glass coordinates, revetment) are strictly measured and stored in **centimeters (cm)**.

---

## 2. Roles, Authentication & Access Control (RBAC & RLS)

### 2.1 System Roles
The application enforces two primary user roles stored in the `public.users` table:
1. **Admin (`admin`)**:
   - Complete operational and financial authority.
   - Manages product catalog (create, edit, delete, upload drawings).
   - Manages workers (salary configurations, advance requests, bonuses, deductions, payroll disbursement).
   - Full access to all client accounts and prospect leads across all sales reps.
   - Views all orders, status history, and system-wide financial analytics.
   - Generates official PDF reports (invoices, technical sheets, payroll reports).
   - Can void payment transactions and edit payment notes.
2. **Worker / Sales Representative (`worker`)**:
   - Access to active door products and specifications.
   - Creates and manages client contacts.
   - Registers and manages their own sales prospects (leads).
   - Views their own assigned orders.
   - Records payments/deposits received for their own orders.
   - Restricted from viewing other workers' orders, full company payroll, or deleting critical records.

### 2.2 Account Bootstrapping & Synchronization
- **First User Rule**: The database trigger `handle_new_user()` checks if the `public.users` table is empty upon user sign-up. The very first user created in Supabase Auth automatically receives the `admin` role. All subsequent registrations default to the `worker` role.
- **Sync Trigger**: Any new user created in Supabase Auth (`auth.users`) is automatically mirrored into `public.users` with `active: true`.
- **Application Login Toggle**: In the Worker Management module, workers can be created without an app login account, or have their app access toggled active/inactive independently.

### 2.3 Row Level Security (RLS) Policies
Every table in the database has Row-Level Security enabled with explicit security policies:
- **`door_products`**: Authenticated users can view; Admins have full write/edit/delete access.
- **`clients`**: Authenticated users can view, insert, and update; Admins have full access.
- **`prospects`**: Admins can view and update all prospects; Workers can only view and update prospects where `created_by = auth.uid()`. Only Admins can delete prospects.
- **`orders`**: Admins have full access; Workers can only select their own orders (`worker_id = auth.uid()`) and update draft orders they own.
- **`order_items`**: Admins have full access; Workers can view items for their own orders and insert/update items only if their order is in `draft` status.
- **`order_payments`**: Admins can view all payments, update notes, and void payments. Workers can view payments for their own orders and insert payments. Direct deletion of payment records is strictly disallowed in RLS.
- **`workers`, `worker_salary_history`, `salary_payments`, `salary_advances`, `salary_bonuses`, `salary_deductions`**: Restricted entirely to Admin access via the `public.is_admin()` security function.

---

## 3. Product Catalog & Technical Door Architecture

### 3.1 Door Design Reference System
A product reference identifies the visual design and structural pattern of the door, **not a fixed manufacturing dimension**. Actual dimensions are configured per order item.
- **Prefixes**:
  - `K` = Kitchen Door (e.g., `K1`, `K2`)
  - `C` = Chamber / Bedroom Door (e.g., `C1`, `C2`)
  - `B` = Bathroom Door
- **Categories**:
  - `Kitchen`
  - `Bedroom`
  - `Bathroom`
  - `Custom` (for one-off custom references)

### 3.2 Product Schema & Default Dimensions
Each product catalog entry contains:
- `reference`: Unique alphanumeric identifier (e.g. `C1`).
- `name`: Descriptive model name.
- `category`: Category classification.
- `height`: Default height in cm (positive value, standard `210 cm`).
- `width`: Default width in cm (positive value, standard `90 cm`).
- `thickness`: Default thickness in cm (positive value, standard `4 cm`).
- `description`: Optional architectural notes.
- `drawing_url`: URL pointing to vector CAD blueprints or technical drawings stored in Supabase Storage (`drawings` bucket).

### 3.3 Door Finishes & Color Palette
WPC doors are manufactured with certified wood-grain and solid color finishes:
- **Biro (`biro`)**: Natural beige wood finish (`#E5D3B3`)
- **Chêne Foncé (`chan_fance`)**: Dark Oak (`#5C4033`)
- **Gris Foncé (`gris_fance` / `gris_fonce`)**: Deep Slate Gray (`#4B5563`)
- **Irab (`irab`)**: Warm reddish-brown wood grain (`#A0522D`)
- **Teck Foncé (`teck_fance`)**: Dark Teak (`#8B5A2B`)
- **Vange (`vange`)**: Deep Espresso / Wenge (`#3E2723`)
- **Chêne Naturel (`chene_naturel`)**: Light Natural Oak (`#E8C590`)
- **Blanc (`white`)**: Crisp White (`#F9FAFB`)
- **Chêne Bois (`chene_bois`)**: Classic Wood Oak (`#D9A05B`)

### 3.4 Custom WPC Door Engineering Architecture (`DoorItemConfig`)
Each door item can be extensively customized with structural components:
1. **Door Leaf Structure**:
   - `single`: Single swinging door leaf.
   - `double`: Unequal double door leaf consisting of an active primary leaf and a semi-fixed secondary leaf.
   - `leftLeafPercent`: Proportion assigned to the semi-fixed leaf (default: `28%`; primary active leaf occupies `100 - leftLeafPercent`%).
2. **Revetment / Transom Panel (Imposte)**:
   - `hasRevetment`: Boolean flag indicating whether an upper cladding panel is attached.
   - `revetmentHeightCm`: Height in cm of the transom panel.
   - Total door unit height is calculated as:
     $$\text{Total Height} = \text{Leaf Height} + (\text{hasRevetment} ? \text{revetmentHeightCm} : 0)$$
3. **Glass Openings (`GlassPane`)**:
   - Doors can have zero glass openings (classified as **Porte Pleine**) or multiple custom glass panes.
   - Each pane specifies: `widthCm`, `heightCm`, `marginTopCm`, `marginLeftCm`, and target leaf (`left` or `right` for double doors).
   - **Boundary Constraints**:
     - $\text{marginLeftCm} + \text{widthCm} \le \text{Target Leaf Width}$
     - $\text{marginTopCm} + \text{heightCm} \le \text{Leaf Height}$
     - All dimension parameters must be strictly $> 0$.
4. **Dual Pricing Model**:
   - `priceNormal`: Standard unit catalog price.
   - `pricePromo`: Discounted commercial promotional unit price.
   - Dynamic switching occurs depending on whether promotion mode is enabled on the order.

### 3.5 2D CAD Blueprint & Technical Elevation Rendering
- Dynamic 2D rendering calculates DP-per-cm scale:
  $$\text{scale} = \frac{\text{CANVAS\_HEIGHT} - \text{PADDING}}{\max(\text{Total Height}, 120)}$$
- Automatically renders:
  - Outer sub-frame and leaf borders.
  - Revetment/transom upper panel with cladding design lines.
  - Double leaf split line with active door handle indicator.
  - Transparent glass pane openings with simulated 45-degree reflection line and dimension badges.
  - Dimension arrows for total height and total width.

---

## 4. Client Relationship Management (CRM) & Lead Pipeline

### 4.1 Client Records
Stores converted and verified purchasing clients:
- Name, phone number (indexed for fast search), delivery address, notes, and registration timestamp.

### 4.2 Lead Pipeline & Prospect Stages
Tracks prospective commercial leads through 6 sequential negotiation stages:
1. `new`: Freshly recorded lead.
2. `contacted`: Initial phone or workshop outreach conducted.
3. `interested`: Client showed strong interest in catalog references.
4. `negotiation`: Discussing dimensional requirements, finishes, and price quotations.
5. `converted`: Successfully converted into a formal paying client.
6. `lost`: Client abandoned inquiry or opted out.

### 4.3 Lead-to-Client Conversion Workflow
- Handled via `convertProspectToClient`:
  1. Retrieves the prospect's contact and address details.
  2. Inserts a new verified record into `clients`.
  3. Formats existing negotiation notes with `"Converted from Prospect. Notes: ..."`.
  4. Automatically transitions the prospect's status to `converted`.

### 4.4 Client Payment Statistics Ledger (`get_client_payment_stats`)
For any selected client, an aggregate database function calculates:
- `total_orders`: Total number of orders placed.
- `total_order_value`: Cumulative value of all non-cancelled orders.
- `total_paid`: Total verified payments collected.
- `outstanding_balance`: Cumulative remaining unpaid debt across non-cancelled orders:
  $$\text{Outstanding Balance} = \sum (\text{total\_amount} - \text{paid\_amount}) \quad [\text{where } \text{status} \ne \text{'cancelled'} \land \text{total\_amount} > \text{paid\_amount}]$$
- Recent Payment History: Chronological breakdown of the 10 most recent payment receipts linked to the client's orders.

---

## 5. Order Lifecycle & Status Workflow *(Excluding Order Creation)*

*(Note: In accordance with project instructions, the initial order creation process is omitted from this section).*

### 5.1 Order Identification Format
- Orders are assigned a unique, sequential order number formatted by a PostgreSQL sequence:
  $$\text{ORD-YYYY-XXXXX} \quad (\text{e.g., } \text{ORD-2026-01001})$$

### 5.2 9-Stage Order Workflow Lifecycle
Orders transition through 9 distinct lifecycle stages:
1. **`draft`**: Order is drafted; order items and specifications can be updated.
2. **`confirmed`**: Order specifications and prices are verified and approved by client.
3. **`manufacturing`**: Order sent to the workshop/factory; WPC doors are being sized, extruded, laminated, and routed.
4. **`ready_for_dispatch`**: Production completed; doors are checked for quality, packaged, and staged at the dispatch bay.
5. **`in_transit`**: Order loaded on logistics vehicles and en route to the installation or delivery site.
6. **`delivered`**: Doors unloaded and received at the client's address.
7. **`installation`**: Installation team is fitting door frames, leaves, hinges, and locks on-site.
8. **`completed`**: Installation approved by client; job complete.
9. **`cancelled`**: Order aborted or cancelled. Outstanding balances are omitted from company receivables.

### 5.3 Automated Audit Trail (`order_status_history`)
- The database trigger `trigger_log_order_status_change` logs every state transition:
  - Stores `order_id`, `old_status`, `new_status`, `changed_by` (authenticated user UID), and `changed_at`.
  - An entry is logged on initial creation (`old_status = null`) and on every subsequent status update.

### 5.4 Push Notification Dispatcher
- The database trigger `trigger_order_push_notification` invokes the `notify_push_webhook` function via `pg_net` asynchronous HTTP POST to a Supabase Edge Function (`push-notifications`).
- Triggers notifications to mobile devices when:
  - An order is updated to a new status.
  - An order reaches the `completed` status ("Order Completed! 🎉").
  - A new lead or prospect is registered.

### 5.5 Order Search & Multi-Factor Filtering
The order management interface provides multi-factor filtering:
- Free-text search by `order_number` and client name.
- Status filter: `All` or any of the 9 workflow stages.
- Date range: `All Time`, `Today`, `This Week`, `This Month`.
- Sales rep / Worker filter (for Admins): Filters orders generated by a specific worker.

---

## 6. Financial Management, Payments & Receivables

### 6.1 Automatic Totals Calculation
- **Item Level**: Trigger `calculate_order_item_totals()` ensures:
  $$\text{order\_items.total\_price} = \text{quantity} \times \text{unit\_price}$$
- **Order Grand Total**: Trigger `update_order_grand_total()` calculates:
  $$\text{orders.total\_amount} = \sum \text{order\_items.total\_price}$$
  Executed automatically upon any insertion, update, or deletion of order items.

### 6.2 Payment Transaction Ledger (`order_payments`)
Instead of directly modifying an order's paid amount, payments are recorded as discrete, timestamped transaction entries:
- `order_id`: Referenced order.
- `amount`: Payment sum ($> 0$).
- `payment_date`: Date the payment was received.
- `notes`: Internal receipt notes (e.g., cash details, bank check number).
- `received_by`: Auto-populated with the recipient user ID via trigger `trigger_set_payment_received_by`.
- `status`: Transaction status (`successful` or `voided`).

### 6.3 Immutable Audit Policy & Voiding
- To preserve financial auditing integrity, **payment rows cannot be deleted** via RLS.
- If a payment was recorded in error, an Admin can **Void** (`voided`) the transaction.
- Voided transactions remain in the historical ledger with a strikethrough display and are excluded from order payment totals.
- Admins can update payment notes after insertion.

### 6.4 Automatic Paid Balance Synchronization
- Database trigger `trigger_update_order_paid_amount` listens to insertions, updates, or status changes on `order_payments`:
  $$\text{orders.paid\_amount} = \sum_{\text{status} = \text{'successful'}} \text{order\_payments.amount}$$

### 6.5 Payment Status Classification Rules
The system dynamically determines payment status:
- **`Pending`**: $\text{paid\_amount} = 0$
- **`Partially Paid`**: $0 < \text{paid\_amount} < \text{total\_amount}$
- **`Paid`**: $\text{paid\_amount} = \text{total\_amount}$
- **`Overpaid`**: $\text{paid\_amount} > \text{total\_amount}$ (flags an alert warning icon for excess deposit)

### 6.6 Cash Flow & Liquidity KPIs (`get_payment_dashboard_stats`)
Aggregated real-time metrics provide executive visibility:
- **Today's Cash**: Sum of successful payments on `current_date`.
- **Monthly Cash**: Sum of successful payments in the current calendar month.
- **Outstanding Balance**: Cumulative receivables on all non-cancelled orders where $\text{total\_amount} > \text{paid\_amount}$.
- **Order Payment Counts**: Number of fully paid, partially paid, and pending payment orders.

---

## 7. Worker Human Resources, Payroll & Advance System

### 7.1 Worker Profile Management
The `workers` table tracks enterprise staff:
- Name, phone, email, position (e.g., Workshop Lead, Assembler, Sales Rep).
- `employment_date`: Start date of employment.
- `status`: `active` or `inactive`.
- `base_salary`: Base monthly compensation in DZD ($\ge 0$).
- `payment_day`: Day of month for salary disbursement ($1 \le \text{day} \le 31$, default: $5^{\text{th}}$).
- `user_id`: Optional link to an authenticated `public.users` login account.

### 7.2 Historical Base Salary Auditing (`worker_salary_history`)
- The database trigger `trigger_handle_worker_salary_change` maintains a complete audit trail of salary changes:
  - On initial worker creation: Records the starting salary with `effective_from = now()`.
  - On base salary modification: Automatically closes the existing active record (`effective_to = now()`) and inserts a new effective salary block.

### 7.3 Salary Adjustments
1. **Bonuses (`salary_bonuses`)**:
   - Discretionary bonuses for performance or milestones (`amount > 0`, `reason`, `date`, `created_by`).
2. **Deductions (`salary_deductions`)**:
   - Financial penalties for late arrivals, damages, or infractions (`amount > 0`, `reason`, `date`, `created_by`).
3. **Salary Advances (`salary_advances`)**:
   - Short-term cash advances provided to workers (`amount > 0`, `reason`, `date`, `approved_by`, `is_settled`).
   - Tracked as unsettled until automatically deducted during payroll settlement.

### 7.4 Monthly Payroll Calculation & Settlement Engine
#### Net Salary Formula
The estimated and final disbursement amount is computed as:
$$\text{Final Disbursement} = \max(\text{Base Salary} + \text{Bonuses} - \text{Deductions} - \text{Unsettled Advances}, 0)$$

#### Automated Settlement Trigger (`trigger_handle_salary_payment_insertion`)
When an Admin registers a salary payment in `salary_payments` for month $M$ and year $Y$:
1. Identifies the cycle cut-off date $D_{\text{end}} = \text{last day of month } M$.
2. **Advances Settlement**: Automatically updates all unsettled advances for that worker with $\text{date} \le D_{\text{end}}$, setting `is_settled = true` and linking `salary_payment_id = payment.id`.
3. **Bonus Linkage**: Links all unlinked bonuses for that worker in month $M$ and year $Y$ to the payment ID.
4. **Deduction Linkage**: Links all unlinked deductions for that worker in month $M$ and year $Y$ to the payment ID.
5. **Duplicate Prevention**: A database constraint enforces `UNIQUE (worker_id, salary_month, salary_year)`.

### 7.5 Payroll Draft & Summary Database Functions
- **`get_payroll_draft(month, year)`**: Generates the draft payroll roll for all active workers for the given month, aggregating unlinked bonuses, unlinked deductions, unsettled advances, and project net payout.
- **`get_payroll_summary(month, year)`**: Aggregates total payroll outlay, total bonuses, total deductions, total advances recovered, average salary, and count of workers paid vs. pending.

---

## 8. Document Generation & PDF Export Engine

The application includes an automated PDF generation and native sharing engine:

### 8.1 Order Document Export Modes
1. **Standard Invoice (`Facture Standard`)**:
   - Uses standard unit pricing (`priceNormal`).
   - Includes full company branding header (NASAQ — Portes WPC, +213 660 99 60 97), invoice number, issue date, client contact and delivery address.
   - Itemized product specifications table: door reference, dimensions, finish, leaf configuration, transom/imposte height, glass pane count, quantity, unit price, and subtotal.
   - Embedded 2D scaled technical elevation mockup for each ordered item.
   - Financial totals: grand total, total paid, payment status label (in French), and remaining balance.
   - Chronological payment history table listing all successful payment installments with dates and amounts.
2. **Promotional Invoice (`Facture Promotionnelle / Devis Promo`)**:
   - Formatted identically to the standard invoice, but calculates item totals using the discounted promotional unit price (`pricePromo`).
3. **Technical Workshop Sheet (`Fiche Technique`)**:
   - Designed strictly for factory craftsmen, carpenters, and assemblers.
   - **Completely strips out all monetary amounts, unit prices, and financial balances**.
   - Emphasizes manufacturing parameters: exact finished dimensions, frame depth/thickness, laminate color finish, leaf split ratios, transom panel height, glass opening coordinates, and 2D visual elevations.

### 8.2 Monthly Payroll Report PDF
- Generates an executive payroll sheet for a selected month and year:
  - Summary KPI card: Total base salaries, total bonuses, total deductions, total advances recovered, and net company payroll outlay.
  - Worker breakdown table: Worker name, job position, base salary, bonus addition (+), deduction subtotal (-), advance deduction (-), net salary, payment status (`Paid` or `Draft`), and disbursement date.

---

## 9. Analytics & Executive Dashboard Metrics

### 9.1 Revenue Recognition Rules
- Revenue is recognized exclusively from orders that have passed confirmation into active fulfillment:
  $$\text{Recognized Revenue} = \sum \text{orders.total\_amount} \quad [\text{where } \text{status} \in \{\text{'delivered'}, \text{'installation'}, \text{'completed'}\}]$$
- Orders in `draft`, `confirmed`, `manufacturing`, or `cancelled` stages are excluded from realized revenue.

### 9.2 Best-Selling WPC Door References
- Analyzes item sales across `order_items` linked to door products.
- Groups and ranks products by total quantity sold and revenue generated.

### 9.3 Sales Representative Performance Leaderboard
- Tracks performance of workers assigned to delivered, installed, or completed orders.
- Ranks representatives by total sales volume and revenue contributed.

### 9.4 Real-Time Executive KPI Overview
- **Key Metrics**: Total Orders Handled, Realized Revenue, Active Clients in Database, Logged Prospects, Active Workers on Staff.
- **Order Pipeline Distribution**: Real-time count and visual progress breakdown across all 9 workflow statuses.
- **Cash Flow Summary**: Today's cash receipts, current month cash receipts, outstanding debt, and order payment status breakdown.
- **Payroll Outlay Card**: Total payroll outlay, number of paid workers, pending workers, and advance deductions for the current month.
