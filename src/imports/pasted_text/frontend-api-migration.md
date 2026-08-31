# Mr.Pork Store — Frontend API Migration

You are modifying an **existing React + TypeScript + Vite frontend** for the Mr.Pork Store Marketplace Platform.

## CRITICAL RULE

Do NOT redesign, replace, or rebuild the existing UI.

Preserve the current:

* Layout
* Styling
* Colors
* Typography
* Components
* Navigation
* Responsive behavior
* Marketplace experience
* Admin dashboard structure
* Existing pages and user flows

The purpose of this task is to **connect the existing frontend to the real ASP.NET Core backend API**.

Do not remove existing functionality unless it is specifically being replaced because it currently depends on localStorage or fake/mock data.

---

# BACKEND

The backend is an ASP.NET Core Web API running at:

https://localhost:44309

API base URL:

https://localhost:44309/api

The backend uses:

* ASP.NET Core
* C#
* Dapper
* PostgreSQL / Neon
* JWT authentication
* Cloudinary for images

The backend is the source of truth.

Do NOT invent endpoints, properties, database fields, or response structures.

---

# 1. API CLIENT

Create/use:

src/lib/api.ts

The API base URL should be centralized.

Do not hardcode:

https://localhost:44309/api

throughout individual components.

Create reusable API request helpers where appropriate.

The frontend should handle:

* GET
* POST
* PUT
* PATCH
* DELETE
* JSON requests
* multipart/form-data requests
* JWT Authorization header

Do not send a Content-Type of application/json when uploading files with FormData.

---

# 2. AUTHENTICATION

The existing frontend currently has client-side/local admin password logic.

REMOVE the dependency on frontend admin passwords/localStorage authentication.

The backend JWT authentication is the source of truth.

Admin login must call the real backend authentication endpoint already implemented in the API.

After successful login:

* Store the returned JWT securely enough for the current frontend architecture.
* Include:

Authorization: Bearer <token>

on protected API requests.

Protected admin functionality must not rely on:

* adminPassword in frontend settings
* hardcoded passwords
* localStorage-only authentication
* fake authentication

If the backend authentication endpoint's exact request/response shape is already defined in the project, use it exactly. Do not invent a new shape.

---

# 3. PRODUCTS — PORK AND CHICKEN

IMPORTANT:

There is ONE product system for both Pork and Chicken.

Do NOT create separate:

* PigProductService
* ChickenProductService
* PigRepository
* ChickenRepository

The backend uses the generic Product model.

Backend Product structure:

```typescript
{
  id: string;
  name: string;
  description: string | null;
  category: string;
  productType: string;
  weightOrSize: string | null;
  price: number | null;
  stockQuantity: number | null;
  isAvailable: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

The existing frontend currently has an incompatible model using:

* subcategory
* imageUrl
* sizes[]
* available

Do not force the backend to return those old properties.

Instead, adapt the frontend to the actual backend response.

---

# 4. PRODUCT VARIANTS

Product sizes/weights/prices are represented by the backend ProductVariant model.

Backend ProductVariant:

```typescript
{
  id: string;
  productId: string;
  name: string;
  weightOrSize: string | null;
  price: number;
  stockQuantity: number | null;
  isAvailable: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}
```

The existing frontend's:

```typescript
sizes: ProductSize[]
```

should be migrated to use the real product variants.

A product may have:

* no variant
* one variant
* multiple variants

When a variant exists, display its:

* name
* weight/size
* price
* availability

Do not hardcode product prices in the frontend.

---

# 5. PRODUCT API

Use the existing backend Product endpoints.

Expected resource pattern:

```text
GET    /api/products
GET    /api/products/{id}
POST   /api/products
PUT    /api/products/{id}
DELETE /api/products/{id}
```

Use the exact endpoints already exposed by Swagger if their route differs.

For variants:

```text
GET    /api/products/{productId}/variants
GET    /api/product-variants/{id}
POST   /api/products/{productId}/variants
PUT    /api/product-variants/{id}
DELETE /api/product-variants/{id}
```

Again, inspect/use the actual routes exposed by the backend rather than inventing routes.

---

# 6. PIG MARKETPLACE

Keep the existing Pig Marketplace UI.

It must load its products from the backend.

Filter/display products using the backend fields:

```text
category
productType
```

Do not maintain a second local product database.

Pork products should be regular Products.

Examples:

```text
category = Pork
productType = Live Pig

category = Pork
productType = Butchered Pork
```

---

# 7. CHICKEN MARKETPLACE

Keep the existing Chicken Marketplace UI.

Chicken uses the exact same backend Product/ProductVariant system.

Examples:

```text
category = Chicken
productType = Live Chicken

category = Chicken
productType = Dressed Chicken
```

Do not create a separate chicken backend model.

---

# 8. PRODUCT IMAGES

Product images are stored in Cloudinary through the backend.

Do not make the frontend responsible for Cloudinary configuration or API secrets.

The backend handles Cloudinary.

The frontend should consume returned image URLs.

For admin image upload:

* Use multipart/form-data.
* Send the actual selected file.
* Use the backend product image endpoint already implemented.
* Do not expose Cloudinary API secret/key in frontend code.

Existing product image functionality should be connected to the backend instead of localStorage.

---

# 9. ORDERS

The order system is already implemented in the backend.

The frontend cart/order flow must call the real API.

Customer creates an order using:

```typescript
{
  customerName: string;
  phoneNumber: string;
  email?: string;
  deliveryAddress?: string;
  items: [
    {
      productId: string;
      productVariantId?: string | null;
      quantity: number;
    }
  ];
}
```

IMPORTANT:

The frontend must NOT send:

* unitPrice
* subtotal
* totalAmount

as authoritative values.

The backend calculates prices from the database.

Example:

```text
Product price = ₦45,000
Quantity = 2

Backend calculates:
₦45,000 × 2 = ₦90,000
```

The frontend should display the backend response.

---

# 10. ORDER RESPONSE

The frontend should support the backend order response:

```typescript
{
  id: string;
  customerName: string;
  phoneNumber: string;
  email: string | null;
  deliveryAddress: string | null;
  status: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  items: [
    {
      id: string;
      productId: string;
      productVariantId: string | null;
      productName: string;
      variantLabel: string | null;
      unitPrice: number;
      quantity: number;
      subtotal: number;
    }
  ];
}
```

---

# 11. ORDER STATUS

The backend supports:

```text
NEW
CONFIRMED
PROCESSING
COMPLETED
CANCELLED
```

Do not create alternative status values in the frontend.

The admin dashboard should use the backend status values exactly.

---

# 12. ADMIN ORDERS

Admin functionality should use the protected backend order endpoints.

The existing admin dashboard should:

* Load real orders
* Display customer information
* Display order items
* Display prices
* Display totals
* Display status
* Allow status updates

Do not use localStorage as the source of truth.

---

# 13. WHATSAPP / APP SETTINGS

The backend has:

```typescript
{
  id: string;
  whatsappNumber: string;
  businessName: string;
  createdAt: string;
  updatedAt: string;
}
```

Endpoint:

```text
GET /api/app-settings
PUT /api/app-settings
```

GET is public.

PUT is admin-protected.

The frontend must remove its old:

```typescript
airtimeWhatsapp
adminPassword
```

settings model.

Do NOT expect those fields from the backend.

The WhatsApp number used for customer communication should come from:

```text
GET /api/app-settings
```

Do not hardcode the WhatsApp number.

The current database number is only a test number and may later be replaced by Mr.Pork Store's actual number.

---

# 14. SELL YOUR PIG

The existing Sell Your Pig UI must be connected to the real backend.

Backend pig submission fields:

```typescript
{
  farmerName: string;
  phoneNumber: string;
  email?: string | null;
  location?: string | null;
  pigDetails?: string | null;
  weight?: number | null;
  expectedPrice?: number | null;
}
```

Backend response includes:

```text
id
farmerName
phoneNumber
email
location
pigDetails
weight
expectedPrice
status
createdAt
updatedAt
```

The backend statuses are:

```text
NEW
CONTACTED
APPROVED
REJECTED
```

Do not use the old frontend statuses:

```text
new
contacted
closed
```

Map the existing form fields intelligently to the backend.

For example:

```text
name              → farmerName
phone             → phoneNumber
location          → location
estimatedWeight   → weight
expectedPrice     → expectedPrice
notes             → pigDetails
```

If the existing UI contains `animalType` or `count`, do not send unsupported fields to the backend.

Preserve the UI where possible, but only send fields supported by the API.

---

# 15. SELL YOUR PIG IMAGES

Pig submission images are stored through the backend and Cloudinary.

The frontend should:

* Submit the pig submission first.
* Receive its ID.
* Upload selected images using the submission image endpoint.
* Display returned image URLs.
* Allow admin to view/delete images where supported.

Do not put Cloudinary secrets in frontend code.

Do not save pig submission images in localStorage.

---

# 16. SELL DATA

The frontend currently has a generic SellDataItem model.

That must be replaced with the actual backend structure.

The backend has:

## Data Networks

```typescript
{
  id: string;
  name: string;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## Data Plans

```typescript
{
  id: string;
  networkId: string;
  networkName: string;
  networkLogoUrl: string | null;
  name: string;
  dataSize: string;
  validity: string | null;
  price: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}
```

The frontend should use the network + plan relationship.

Do NOT expect:

```text
title
description
```

from the backend DataPlan model unless the existing API explicitly provides them.

---

# 17. DATA NETWORKS

The Sell Data/Airtime interface should load networks from the backend rather than localStorage.

Only active networks should be displayed to customers.

Admins should be able to manage networks using the existing backend endpoints.

Use the exact routes exposed in Swagger.

---

# 18. DATA PLANS

The frontend should:

* Load real data plans
* Group/display them by network
* Show data size
* Show validity
* Show price
* Respect isAvailable
* Allow admin management

Do not hardcode data plans in React.

---

# 19. REMOVE LOCALSTORAGE AS DATABASE

The existing:

```text
src/lib/storage.ts
```

was used as the application's local database.

Do NOT immediately delete it if doing so would break the application.

Instead:

Migrate each feature from localStorage to the real API.

After a feature is successfully migrated and no longer depends on storage.ts, remove its obsolete storage functions.

Do not maintain two competing sources of truth.

BAD:

```text
API data + localStorage data
```

GOOD:

```text
Backend API
    ↓
React state
    ↓
UI
```

---

# 20. FRONTEND TYPES

Update TypeScript interfaces gradually so they match the real API.

Do not blindly rename every existing property across the entire application at once.

Avoid creating compatibility hacks that pretend the backend has properties it does not have.

Use separate interfaces where appropriate:

```text
Product
ProductVariant
ProductImage
Order
OrderItem
PigSubmission
PigSubmissionImage
DataNetwork
DataPlan
AppSetting
```

---

# 21. ERROR HANDLING

The frontend should properly handle:

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
500 Internal Server Error
```

Display user-friendly messages.

Do not expose raw stack traces.

If JWT expires or authentication fails:

* Clear the invalid session/token where appropriate.
* Return the user to the admin login when necessary.

---

# 22. LOADING STATES

When replacing localStorage with API calls, preserve or add appropriate:

* Loading indicators
* Empty states
* Error states
* Retry behavior where appropriate

Do not make the UI appear broken while waiting for the API.

---

# 23. SECURITY

Never put any of these in frontend source code:

```text
Cloudinary API Secret
Database password
JWT signing key
Backend secrets
Email service secrets
```

Never trust frontend prices.

Never use frontend-only admin authentication.

Never expose admin-only API operations to unauthenticated users.

---

# 24. IMPORTANT DEVELOPMENT RULE

Do NOT rewrite the entire project.

Do NOT redesign the UI.

Do NOT create duplicate backend concepts.

Do NOT invent API endpoints.

Do NOT invent properties.

Do NOT delete working components unnecessarily.

Do NOT change the backend just to accommodate the old frontend model.

The backend API is authoritative.

---

# 25. MIGRATION ORDER

Perform the migration in this order:

### Phase 1

Create/finalize the centralized API client.

### Phase 2

Authentication and JWT.

### Phase 3

App Settings.

### Phase 4

Products.

### Phase 5

Product Variants.

### Phase 6

Product Images.

### Phase 7

Pork Marketplace.

### Phase 8

Chicken Marketplace.

### Phase 9

Cart and Orders.

### Phase 10

Sell Your Pig.

### Phase 11

Pig Submission Images.

### Phase 12

Data Networks.

### Phase 13

Data Plans / Sell Data.

### Phase 14

Admin Dashboard integration.

### Phase 15

Remove obsolete localStorage logic.

---

# 26. BUILD AFTER EACH PHASE

After completing each phase, run:

```bash
npm run build
```

Do not continue blindly if the build fails.

Fix TypeScript/runtime errors before moving to the next phase.

---

# FINAL REQUIREMENT

Before making changes, inspect the existing project and identify:

1. Which components currently use localStorage.
2. Which components use the old Product interface.
3. Which components use the old FarmerSubmission interface.
4. Which components use the old SellDataItem interface.
5. Which components use AppSettings.
6. Where admin authentication currently happens.
7. Where cart/order creation currently happens.
8. Where WhatsApp links are generated.
9. Where product images are uploaded/displayed.
10. Which files should be changed for each migration phase.

Do NOT immediately rewrite everything.

First establish the migration map.

Then implement the migration **one phase at a time while preserving the current UI**.

The final application must have:

```text
CUSTOMER
    ↓
Pork Marketplace ─────┐
Chicken Marketplace ──┤
Sell Your Pig ────────┤
Sell Data ────────────┤
Cart / Orders ─────────┤
                       ↓
                ASP.NET Core API
                       ↓
                 PostgreSQL/Neon
                       ↓
                   Cloudinary

ADMIN
    ↓
JWT Login
    ↓
Admin Dashboard
    ↓
Products
Variants
Images
Orders
Pig Submissions
Pig Images
Data Networks
Data Plans
App Settings
```

The existing UI is valuable. **Preserve it. The goal is to turn the current frontend into the real production frontend for the backend API, not to rebuild the design.**
