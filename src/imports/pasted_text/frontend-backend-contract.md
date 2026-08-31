# Mr.Pork Store — FINAL Frontend/Backend Contract Correction

You are modifying the existing Mr.Pork Store React + TypeScript + Vite frontend.

The backend has now been verified directly from the ASP.NET Core source code.

Your job is to correct the frontend so it matches the backend EXACTLY.

## CRITICAL

Do NOT redesign the UI.

Do NOT rebuild the application.

Do NOT change the visual design.

Do NOT invent endpoints.

Do NOT invent DTO properties.

Do NOT change backend routes.

Do NOT create mock/local data.

Preserve the existing UI and functionality while correcting API contracts.

---

# 1. AUTHENTICATION — FIX LOGIN

The backend LoginRequest is:

```typescript
{
  email: string;
  password: string;
}
```

The frontend currently sends `username`.

Change the admin login form from:

```typescript
username
```

to:

```typescript
email
```

The request must be:

```json
{
  "email": "admin@example.com",
  "password": "..."
}
```

Endpoint:

```text
POST /api/auth/login
```

Backend response:

```typescript
{
  token: string;
  expiresAt: string;
  email: string;
}
```

Use `token`.

Do not expect `username`, `accessToken`, or other invented properties.

---

# 2. ADMIN PASSWORD MANAGEMENT

The backend already supports:

```text
POST /api/auth/change-password
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

Implement the frontend UI for these endpoints.

## Change Password

Authenticated admin:

```text
POST /api/auth/change-password
```

Body:

```json
{
  "currentPassword": "...",
  "newPassword": "..."
}
```

Add a Change Password section to the admin settings/account area.

## Forgot Password

Public endpoint:

```text
POST /api/auth/forgot-password
```

Body:

```json
{
  "email": "..."
}
```

Display the backend's generic success message.

Do not reveal whether the email exists.

## Reset Password

Public endpoint:

```text
POST /api/auth/reset-password
```

Body:

```json
{
  "token": "...",
  "newPassword": "..."
}
```

Create a reset-password page that reads:

```text
?token=...
```

from the URL.

IMPORTANT:

The backend currently uses a development EmailService that logs the reset link instead of sending email.

Therefore:

* Do not require an email provider.
* Do not create fake email functionality.
* The frontend must still support the reset URL.
* The reset URL can be opened manually during development.
* Do not block the application because email sending is not configured.

The real email provider will be connected later.

---

# 3. APP SETTINGS

Public:

```text
GET /api/app-settings
```

Admin:

```text
PUT /api/app-settings
```

Update body:

```json
{
  "whatsappNumber": "...",
  "businessName": "Mr.Pork Store"
}
```

Do NOT use:

```text
adminPassword
airtimeWhatsapp
```

in AppSettings.

The backend does not have those fields.

---

# 4. PRODUCTS

Backend Product:

```typescript
{
  id: string;
  name: string;
  description: string | null;
  category: string;
  productType: string;
  weightOrSize: string | null;
  price: number;
  stockQuantity: number | null;
  isAvailable: boolean;
  isActive: boolean;
  createdAt: string;
}
```

Do not require `updatedAt` if the backend ProductResponse does not return it.

Remove the assumption that Product contains:

```text
imageUrl
sizes
subcategory
available
```

These are not backend Product properties.

---

# 5. PRODUCT IMAGES

Images are a separate backend resource.

Use:

```text
GET  /api/products/{productId}/images
POST /api/products/{productId}/images
DELETE /api/product-images/{imageId}
```

Upload using multipart/form-data:

```text
File
```

Do not put Cloudinary secrets in the frontend.

Do not store product images in localStorage.

Do not treat imageUrl as a property of Product.

Where the UI needs a product image, obtain it from ProductImage data.

---

# 6. PRODUCT VARIANTS

Backend supports:

```text
GET    /api/products/{productId}/variants
POST   /api/products/{productId}/variants
PUT    /api/product-variants/{id}
DELETE /api/product-variants/{id}
```

ProductVariant:

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
}
```

The admin UI must support:

* Create variant
* Edit variant
* Delete variant
* Change availability
* Change price
* Change stock
* Change display order

Do not use the old frontend `ProductSize` model as the backend data model.

---

# 7. PIG MARKETPLACE

Pork is simply:

```text
Product.category = "Pork"
```

Use the generic Product API.

Examples:

```text
Pork + Live Pig
Pork + Butchered Pork
```

Do not create a separate Pig product API.

---

# 8. CHICKEN MARKETPLACE

Chicken is the same Product system:

```text
Product.category = "Chicken"
```

Examples:

```text
Chicken + Live Chicken
Chicken + Dressed Chicken
```

Do not create a separate Chicken product API.

---

# 9. ORDERS

Create orders using:

```text
POST /api/orders
```

Body:

```json
{
  "customerName": "...",
  "phoneNumber": "...",
  "email": "...",
  "deliveryAddress": "...",
  "items": [
    {
      "productId": "...",
      "productVariantId": null,
      "quantity": 2
    }
  ]
}
```

IMPORTANT:

Do NOT send frontend-calculated:

```text
unitPrice
subtotal
totalAmount
```

The backend calculates authoritative pricing.

The backend response contains:

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
  items: [...]
}
```

---

# 10. ADMIN ORDERS

Admin:

```text
GET /api/orders
```

Update:

```text
PATCH /api/orders/{id}/status
```

Body:

```json
{
  "status": "CONFIRMED"
}
```

Supported statuses:

```text
NEW
CONFIRMED
PROCESSING
COMPLETED
CANCELLED
```

Do not invent different status values.

---

# 11. SELL YOUR PIG — CUSTOMER

Customer submission endpoint is:

```text
POST /api/sell-your-pig
```

Body:

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

Existing UI fields may be mapped:

```text
name              → farmerName
phone             → phoneNumber
location          → location
estimatedWeight   → weight
expectedPrice     → expectedPrice
notes             → pigDetails
```

If the UI has:

```text
animalType
count
```

these must be combined into `pigDetails`.

Do not send unsupported properties to the backend.

---

# 12. SELL YOUR PIG — ADMIN ROUTES

IMPORTANT: the frontend currently uses incorrect routes.

Replace them with the actual backend routes.

Get all:

```text
GET /api/admin/pig-submissions
```

Get one:

```text
GET /api/admin/pig-submissions/{id}
```

Update status:

```text
PUT /api/admin/pig-submissions/{id}/status
```

Body:

```json
{
  "status": "CONTACTED"
}
```

Delete:

```text
DELETE /api/admin/pig-submissions/{id}
```

Supported statuses:

```text
NEW
CONTACTED
APPROVED
REJECTED
```

Do NOT use:

```text
PATCH /api/pig-submissions/{id}
```

Do NOT use:

```text
new
contacted
closed
```

---

# 13. SELL YOUR PIG — IMAGES

Actual backend routes:

```text
GET    /api/admin/pig-submissions/{submissionId}/images
POST   /api/admin/pig-submissions/{submissionId}/images
DELETE /api/admin/pig-submission-images/{imageId}
```

Upload using:

```text
multipart/form-data
File
```

The frontend must use these exact routes.

Do not use:

```text
/api/pig-submissions/{id}/images
/api/pig-submission-images/{id}
```

without the `/admin/` prefix.

---

# 14. DATA NETWORKS — CUSTOMER

Public active networks:

```text
GET /api/data-networks
```

Use this for the customer Airtime/Data page.

---

# 15. DATA NETWORKS — ADMIN

Admin must use:

```text
GET /api/data-networks/all
```

for management.

Admin create:

```text
POST /api/data-networks
```

Admin update:

```text
PUT /api/data-networks/{id}
```

Admin delete:

```text
DELETE /api/data-networks/{id}
```

Do not use the public GET endpoint as the admin management list.

---

# 16. DATA PLANS — CUSTOMER

Available plans:

```text
GET /api/data-plans
```

Plans by network:

```text
GET /api/data-plans/network/{networkId}
```

Do NOT use:

```text
GET /api/data-plans?networkId=...
```

because that is not the backend route.

---

# 17. DATA PLANS — ADMIN

Admin list:

```text
GET /api/data-plans/all
```

Create:

```text
POST /api/data-plans
```

Update:

```text
PUT /api/data-plans/{id}
```

Delete:

```text
DELETE /api/data-plans/{id}
```

DataPlan:

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

Do not invent:

```text
title
description
```

for DataPlan.

---

# 18. DATA NETWORK / PLAN CUSTOMER FLOW

Customer:

```text
GET /api/data-networks
        ↓
select network
        ↓
GET /api/data-plans/network/{networkId}
        ↓
select plan
        ↓
WhatsApp purchase message
```

Use the actual backend plan price and data information.

---

# 19. TOKEN HANDLING

Continue using the centralized API client.

Authenticated requests must automatically send:

```text
Authorization: Bearer <JWT>
```

Do not hardcode JWTs.

Do not store admin passwords.

Do not store backend secrets.

If a protected request returns 401:

* Clear the token.
* Return the admin to login.

---

# 20. LOCAL STORAGE

Do not use localStorage as the database.

The backend is the source of truth.

Local/session storage may only be used for appropriate client-side session/token state.

Do not persist:

```text
products
orders
pig submissions
data networks
data plans
app settings
admin passwords
```

as the application's database.

---

# 21. API ERROR HANDLING

For every API feature, handle:

```text
400
401
403
404
500
network errors
```

with useful user-facing messages.

Do not silently swallow important API errors.

---

# 22. DO NOT MODIFY THE BACKEND

The backend has already been implemented and tested.

Do not change backend routes to accommodate old frontend code.

Correct the frontend to match the backend.

---

# 23. FINAL API CONTRACT

The frontend must ultimately use these backend resources:

```text
AUTH
POST /api/auth/login
POST /api/auth/change-password
POST /api/auth/forgot-password
POST /api/auth/reset-password

APP SETTINGS
GET /api/app-settings
PUT /api/app-settings

PRODUCTS
GET /api/products
GET /api/products/{id}
POST /api/products
PUT /api/products/{id}
DELETE /api/products/{id}

PRODUCT VARIANTS
GET /api/products/{id}/variants
POST /api/products/{id}/variants
PUT /api/product-variants/{id}
DELETE /api/product-variants/{id}

PRODUCT IMAGES
GET /api/products/{id}/images
POST /api/products/{id}/images
DELETE /api/product-images/{id}

ORDERS
POST /api/orders
GET /api/orders
GET /api/orders/{id}
PATCH /api/orders/{id}/status

SELL YOUR PIG
POST /api/sell-your-pig
GET /api/admin/pig-submissions
GET /api/admin/pig-submissions/{id}
PUT /api/admin/pig-submissions/{id}/status
DELETE /api/admin/pig-submissions/{id}

PIG SUBMISSION IMAGES
GET /api/admin/pig-submissions/{id}/images
POST /api/admin/pig-submissions/{id}/images
DELETE /api/admin/pig-submission-images/{id}

DATA NETWORKS
GET /api/data-networks
GET /api/data-networks/{id}
GET /api/data-networks/all
POST /api/data-networks
PUT /api/data-networks/{id}
DELETE /api/data-networks/{id}

DATA PLANS
GET /api/data-plans
GET /api/data-plans/network/{networkId}
GET /api/data-plans/{id}
GET /api/data-plans/all
POST /api/data-plans
PUT /api/data-plans/{id}
DELETE /api/data-plans/{id}
```

Use these routes exactly.

---

# 24. FINAL REQUIREMENT

After making these corrections:

1. Run `npm run build`.
2. Fix every TypeScript error.
3. Do not change the UI unnecessarily.
4. Do not create mock data.
5. Do not create duplicate API services.
6. Do not invent backend properties.
7. Do not invent backend endpoints.
8. Do not remove existing marketplace features.
9. Keep Pork and Chicken using the same Product/ProductVariant system.
10. Keep Sell Your Pig.
11. Keep Sell Data.
12. Keep Orders.
13. Keep Admin Dashboard.
14. Keep App Settings.
15. Add proper admin password management UI using the existing backend authentication endpoints.

The objective is simple:

**Make the existing frontend accurately consume the backend that already exists.**
