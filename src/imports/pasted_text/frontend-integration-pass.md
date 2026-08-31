This is the FINAL integration pass for the existing Mr.Pork Store frontend.

IMPORTANT:

* Do not redesign the application.
* Do not change the backend.
* Do not create new backend endpoints.
* Do not create mock/fake API data.
* Do not remove any existing feature.
* Work with the existing backend endpoints and response structures already used in this project.
* Before changing any API-related code, inspect the existing API service functions and TypeScript interfaces and preserve the actual backend contract.

Fix ONLY the following issues.

## 1. FIX WHATSAPP LINKS

The backend AppSettings may contain a Nigerian local number such as:

08012345678

WhatsApp links must use international format:

2348012345678

Create one reusable helper:

```typescript
function normalizeWhatsAppNumber(value: string): string {
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("234")) {
    return digits;
  }

  if (digits.startsWith("0")) {
    return `234${digits.substring(1)}`;
  }

  return digits;
}
```

Use the normalized number whenever creating a WhatsApp `wa.me` URL.

Apply this everywhere WhatsApp is used:

* Customer order confirmation
* Product enquiry
* Pork enquiry/order
* Chicken enquiry/order
* Sell Your Pig
* Data/Airtime
* Any other WhatsApp contact button

Do NOT modify the WhatsApp number stored in the backend/database.

If the configured number is not registered on WhatsApp, do not attempt to solve that in code.

---

## 2. FIX PRODUCT IMAGE UPLOAD

The backend product-image upload endpoint already exists.

Use the exact endpoint and response structure already defined by the backend.

The backend expects the multipart form field:

```text
File
```

Therefore use:

```typescript
formData.append("File", file);
```

NOT:

```typescript
formData.append("image", file);
```

After a successful image upload:

1. Keep the returned image URL/data from the backend.
2. Refresh/reload the product data or images.
3. Display the actual uploaded image in the marketplace.
4. Do not continue displaying the cartoon placeholder when a real product image exists.

The cartoon pig/chicken should ONLY be used as a fallback when the product genuinely has no image.

Do not hardcode image URLs.

---

## 3. FIX PRODUCT IMAGE DISPLAY

Product images are managed separately from the main Product record.

Inspect the existing backend Product Image API and use its actual response.

The marketplace must display the real image returned by the backend/Cloudinary.

Do not assume that Product itself contains `imageUrl` if the backend uses a separate ProductImage resource.

If a product has multiple images, use the first available image as the product-card image unless the existing UI already supports a gallery.

If there is no image, use the existing fallback placeholder.

---

## 4. FIX PIG SUBMISSION IMAGE UPLOAD

Use the existing backend pig-submission image endpoint.

The multipart field must be:

```text
File
```

Therefore:

```typescript
formData.append("File", file);
```

Do NOT use:

```typescript
formData.append("image", file);
```

Do not invent a new public image-upload endpoint.

Keep the existing customer Sell Your Pig flow.

---

# 5. ADD A REAL SHOPPING CART

The current marketplace needs a cart because a customer may want to order multiple products at once.

Implement the cart in the FRONTEND ONLY.

Do NOT modify the backend.

The existing backend order endpoint already supports multiple order items, so the frontend should collect the cart items and create one order.

The cart must work across BOTH:

* Pig Marketplace
* Chicken Marketplace

A customer must be able to put pork and chicken in the same cart.

---

## 6. CART ITEM

Use a frontend cart structure similar to:

```typescript
interface CartItem {
  productId: string;
  productName: string;
  productVariantId: string | null;
  variantLabel: string | null;
  unitPrice: number;
  quantity: number;
}
```

Use the actual product/variant data already returned by the backend.

Do not invent prices.

Do not allow two identical product + variant combinations to become separate duplicate cart lines. Increase the quantity instead.

Different variants must remain separate cart items.

Example:

```text
Fresh Butchered Pork — 1kg
Fresh Butchered Pork — 5kg
```

must be two separate cart items.

---

## 7. CART FEATURES

Add a visible Cart button/icon to the main navigation.

Show the number of items/units in the cart.

The cart must allow:

* Add to cart
* Increase quantity
* Decrease quantity
* Remove item
* Clear cart
* Continue shopping
* View subtotal/estimated total
* Checkout

Make the cart responsive on mobile.

Persist the cart in localStorage using:

```text
mrpork_cart
```

Do not store passwords, JWTs, API keys or other secrets in localStorage.

---

## 8. PRODUCT CARDS

Keep the existing:

```text
Order Now
Enquire
```

buttons.

Add:

```text
Add to Cart
```

For products with variants, the customer must select the variant before adding it to the cart.

Example:

```text
1kg Pack
2kg Pack
5kg Pack
```

The selected variant's:

* productVariantId
* label
* price

must be stored in the cart.

For products without variants, use:

```text
productVariantId: null
```

Do not invent variant IDs.

---

## 9. CHECKOUT

The customer should enter:

```text
Customer Name
Phone Number
Email (optional)
Delivery Address (optional)
```

Then create ONE backend order containing ALL cart items.

IMPORTANT:

Use the exact existing `POST /api/orders` request DTO already defined in this project.

Do NOT invent or change the backend request contract.

Only send the fields the backend actually expects for each order item, such as:

```text
productId
productVariantId
quantity
```

Do not calculate or submit authoritative:

```text
totalAmount
subtotal
unitPrice
```

if the backend already calculates these.

The backend remains the source of truth for pricing.

---

## 10. ORDER SUCCESS

After successful order creation:

Display:

* Order placed successfully
* Order ID
* Total amount returned by the backend
* Ordered items

Then provide:

```text
Confirm Order on WhatsApp
```

The WhatsApp message should contain ALL items from the order.

Example:

```text
Hello Mr.Pork Store! 👋

I just placed an order.

Order ID: XXXXX

Items:
• Fresh Butchered Pork — 5kg × 2
• Chicken — 2kg × 5

Total: ₦XX,XXX

Name: John
Phone: 08012345678

Please confirm my order and arrange delivery. Thank you!
```

Use the normalized WhatsApp number.

---

## 11. ORDER NOW

Do not remove the existing Order Now functionality.

Order Now can continue to provide a fast checkout for a single product.

Add to Cart is for customers who want to build a larger order.

Both flows must ultimately use the existing backend order API.

---

## 12. CLEAR CART

Only clear the cart AFTER the backend successfully creates the order.

If order creation fails:

* Do not clear the cart.
* Show the error.
* Allow the customer to retry.

---

## 13. PORK AND CHICKEN FILTERING

The backend `GET /api/products` does not use a category query parameter.

Use:

```text
GET /api/products
```

Then filter on the frontend.

Pork:

```typescript
product.category.toLowerCase() === "pork"
```

Chicken:

```typescript
product.category.toLowerCase() === "chicken"
```

Also respect:

```typescript
product.isActive
```

Do not call:

```text
/api/products?category=Pork
/api/products?category=Chicken
```

---

## 14. PRODUCT UPDATE

The backend PUT product endpoint returns a success message rather than a Product object.

Therefore do NOT expect:

```typescript
saved.id
```

from the PUT response.

When editing an existing product:

1. Keep the existing product ID.
2. PUT `/api/products/{existingProductId}`.
3. If an image was selected, upload the image using that same existing product ID.
4. Reload the product/images after the operation.

Never use an ID from a PUT response if the backend does not return a Product object.

---

## 15. DO NOT BREAK EXISTING FEATURES

Preserve all current functionality:

* Pig Marketplace
* Chicken Marketplace
* Sell Your Pig
* Data & Airtime
* Admin Login
* Admin Dashboard
* Product Management
* Product Variants
* Product Images
* Orders
* App Settings
* WhatsApp Settings
* Change Password
* Forgot Password
* Reset Password

Do not redesign the application.

Do not remove existing navigation.

Do not hardcode products.

Do not hardcode prices.

Do not hardcode the WhatsApp number.

Do not replace real backend data with mock data.

---

## 16. FINAL CODE QUALITY CHECK

After making the changes:

Run:

```bash
npm run build
```

The build must succeed.

Fix any TypeScript errors caused by these changes.

Also check for:

* broken API URLs
* undefined IDs
* incorrect FormData field names
* incorrect response assumptions
* broken mobile layout
* duplicate cart items
* cart quantity bugs
* WhatsApp URL formatting problems
* images failing to display

Do not make any other changes beyond the issues listed above.

This should be the final frontend integration pass.
