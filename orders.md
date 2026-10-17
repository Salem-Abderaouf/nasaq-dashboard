# Business Logic & Pricing Engine Documentation — NASAQ WPC

This document summarizes all business rules, pricing schedules, customization options, and billing workflows integrated into the **NASAQ** WPC door configurator.

---

## 1. Brand Identity & General Parameters

- **Brand**: NASAQ WPC Joinery
- **Color Palette**:
  - Primary Teal: `#1c4b46`
  - Dark Teal: `#123330`
  - Gold Accent: `#a3895c`
  - Light Gold: `#c2aa7e`
- **Contact & Support**:
  - Phone: `+213 660 99 60 97`
  - Email: `nasaq.decore@gmail.com`
- **Currency**: Algerian Dinar (DA)

---

## 2. Base Pricing Schedule (Unit Price Calculation Engine)

The unit price of a door excluding optional services ($P_{\text{door}}$) is dynamically calculated using the following formula:

$$P_{\text{door}} = P_{\text{structure}} + S_{\text{pattern}} + S_{\text{glass}} + S_{\text{cladding}}$$

### 2.1. Leaf Structure ($P_{\text{structure}}$)

| Leaf Type  | Description                                    | Base Price (DA) |
| :--------- | :--------------------------------------------- | :-------------- |
| **Single** | Standard 1-Leaf Door                           | **39,800 DA**   |
| **Double** | Double-Leaf Door (Main leaf + Semi-fixed leaf) | **59,800 DA**   |

_Technical note for double doors_: The semi-fixed leaf ratio is customizable (default value: 28% of total opening width).

---

### 2.2. Decorative Grooves & CNC Inserts ($S_{\text{pattern}}$)

- **Smooth / Flush (No pattern)**: **0 DA**
- **Machined Pattern / CNC Grooves & Inserts**: **+4,000 DA**
  - _Supported catalog_: Geometric Prism (`geo_prism`), 4 Horizontal Lines (`lines_4h`), Asymmetric L-Corner (`l_corner`), Rectangular Frame (`frame_cadre`), Arrow / Chevron Line (`arrow_line`), Offset Lines (`shift_h2`).
  - _Rule for double doors_: Grooves and decorative inserts are applied exclusively to the primary (right) leaf.

---

### 2.3. Glass Panes & Vision Panels ($S_{\text{glass}}$)

The surcharge depends on the total count of individual glass panes ($N$) installed on the door:

- **0 glass panes (Solid / Flush Door)**: **0 DA**
- **1 glass pane**: **+4,000 DA**
- **Each additional glass pane ($N \ge 2$)**: **+2,000 DA** per extra pane.

$$\text{If } N = 0 \implies S_{\text{glass}} = 0\text{ DA}$$
$$\text{If } N \ge 1 \implies S_{\text{glass}} = 4,000 + (N - 1) \times 2,000\text{ DA}$$

_Standard breakdown examples:_

- 1 glass pane: $4,000\text{ DA}$
- 2 glass panes: $4,000 + 2,000 = 6,000\text{ DA}$
- 3 glass panes: $4,000 + 2,000 + 2,000 = 8,000\text{ DA}$
- 4 glass panes: $4,000 + 3 \times 2,000 = 10,000\text{ DA}$

---

### 2.4. Upper Cladding & WPC Transom / Imposte ($S_{\text{cladding}}$)

- **Without transom / cladding panel**: **0 DA**
- **With WPC upper cladding panel**: **+13,000 DA**
  - The height of the cladding panel is fully adjustable (default value: 110 cm).
  - Rendered cleanly in the 2D technical elevation without text tags, maintaining continuous wood grain with a horizontal gold accent joint line.

---

## 3. Additional Services (Order / Project Level)

Toggleable options are available to include installation and transportation fees:

### 3.1. Installation & Fitting (Per Door)

Enabled via the `cfg-pose-enable` toggle switch:

- **Single Door**: **5,000 DA** per door.
- **Double Door (2 leaves)**: **6,000 DA** per door.

$$\text{Total Installation} = (N_{\text{single}} \times 5,000\text{ DA}) + (N_{\text{double}} \times 6,000\text{ DA})$$

### 3.2. Transportation & Delivery (Per Order)

Enabled via the `cfg-transport-enable` toggle switch:

- **Flat Rate**: **3,000 DA** per order (applied whenever the order contains at least one door).

---

## 4. Totals Calculation & Financial Flow

### 4.1. Standard Client Invoice

1. **Doors Subtotal**:
   $$S_{\text{doors}} = \sum_{i=1}^{k} P_{\text{normal}, i}$$
2. **Grand Total**:
   $$T_{\text{grand}} = S_{\text{doors}} + \text{Total Installation} + \text{Delivery Fee}$$
3. **Remaining Balance**:
   $$R_{\text{balance}} = \max(0, T_{\text{grand}} - \text{Deposit Paid})$$

---

### 4.2. Promotional Quotation (When Enabled)

Enabled via the `cfg-promo-enable` toggle switch:

1. **Initial Doors Subtotal (Pre-discount)**: $\sum P_{\text{normal}, i}$
2. **Applied Commercial Discount**:
   $$\text{Discount} = \sum (P_{\text{normal}, i} - P_{\text{promo}, i})$$
3. **Discounted Doors Subtotal**:
   $$S_{\text{doors, promo}} = \sum P_{\text{promo}, i}$$
4. **Net Promotional Total**:
   $$T_{\text{promo}} = S_{\text{doors, promo}} + \text{Total Installation} + \text{Delivery Fee}$$
5. **Remaining Balance (Promo)**:
   $$R_{\text{balance, promo}} = \max(0, T_{\text{promo}} - \text{Deposit Paid})$$

---

## 5. Technical Workshop Specifications (Fabrication Sheet)

The internal workshop document contains **no pricing information** and records:

- **Exact Machining Dimensions**: Nominal Door Height $\times$ Width, or Total Overall Height including cladding ($H_{\text{door}} + H_{\text{cladding}}$).
- **Hardware Finishes**:
  - `black`: Matte Black (rosette handle and matching black hinges).
  - `chrome`: Brushed Chrome (steel/chrome handle and hinges).
- **CNC Machining**: Pattern name and target leaf.
- **Glass Pane Cutouts**: Number of cutouts, exact dimensions ($W \times H$), top margin, and left edge offset for each vision panel.
- **Quality Control Checklist**: Quality checkbox for workshop staging and packaging.
