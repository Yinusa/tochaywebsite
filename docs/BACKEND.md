# Backend & Database Roadmap (Supabase)
**Project**: Ultra-High-End Portfolio Web Application  
**Workspace**: `tochayportfolio`
**Stack**: Supabase PostgreSQL + Next.js Server Actions

---

## 0. Environment Variables Configuration

To run the application locally or in production, you must have a `.env.local` file in the root directory containing your active Supabase connection variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://jphgtjsanffsiqrkhdmo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

If these keys are missing, the Supabase client will default to placeholder endpoints (e.g. `https://placeholder-url.supabase.co`), which will fail with a `TypeError: Failed to fetch` browser error during save actions since placeholder domains do not exist.

---

## 1. Database Schema Specifications

When integrating the backend, we will configure a Supabase PostgreSQL instance with the following tables:

### 1.1 `projects` Table
Holds the details of our creative work and case studies.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` (PK) | Unique identifier (default: `gen_random_uuid()`) |
| `created_at` | `timestamp` | Date created |
| `title` | `text` | Project title |
| `slug` | `text` (Unique) | URL slug for routing |
| `category` | `text` | e.g. "Brand Identity", "Creative Technology" |
| `description` | `text` | Pitch summary |
| `content` | `jsonb` | Full case study rich-text layout / assets blocks |
| `cover_image` | `text` | Image asset URL path |
| `gallery` | `text[]` | Array of showcase images / videos URLs |
| `position` | `integer` | Ordering for showcase priority |
| `is_published` | `boolean` | Publishing visibility state |

### 1.2 `inquiries` Table
Captures submission leads from our "Let's Build" contact forms.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` (PK) | Unique identifier |
| `created_at` | `timestamp` | Date created |
| `name` | `text` | Client name |
| `email` | `text` | Contact email |
| `company` | `text` | Client company |
| `budget` | `text` | Selected budget range tier |
| `message` | `text` | Project brief details |
| `status` | `text` | e.g. "new", "replied", "archived" (default: "new") |

### 1.3 `showcase_images` Table
Holds the assets list displayed inside the expanding hero image bar.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` (PK) | Unique identifier (default: `gen_random_uuid()`) |
| `created_at` | `timestamp` | Date created |
| `url_path` | `text` | Public image asset URL (Supabase storage path or external URL) |
| `position` | `integer` | Slider order priority (ascending) |

---

## 2. Row Level Security (RLS) Policies

To match the offline-friendly, passcode bypass admin logins (`tochay2026` / `TOCHAYADMIN`), database RLS policies allow the **`public`** role (`anon` public API key) to execute read, write, and delete queries on portfolio configuration tables.

### 2.1 Projects, Showcase Images, and Site Settings Tables RLS
- **`SELECT` / `INSERT` / `UPDATE` / `DELETE`**: Allowed for all public users (`TO public`). This ensures passcode-bypassed administrators can update case studies, drag/reorder hero slides, or configure banking transfers without authentication errors.

### 2.2 Inquiries and Contact Messages Tables RLS
- **`SELECT` / `INSERT` / `DELETE`**: Allowed for all public users. This lets clients submit forms on the landing page, and allows the admin panel to display and delete inquiry logs cleanly.



---

## 3. Integration & Server Actions API

We will use Next.js **Server Actions** to interact with Supabase directly, avoiding standard REST API fetch calls and leveraging compiler-optimized secure handlers:

```typescript
// Example Server Action layout
"use server";

import { createClient } from "@/lib/supabase/server";

export async function submitInquiry(formData: InquiryData) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("inquiries")
    .insert([formData])
    .select();
    
  if (error) throw new Error(error.message);
  return { success: true };
}
```
This architecture is modular, fast, and secure. We will build it when we expand from the hero section to the backend integration.

---

## 4. Offline Fallback & Local Storage Synchronization

To support local offline development and handle Supabase endpoint network failures (like `TypeError: Failed to fetch`), the application implements a robust hybrid storage architecture:

### 4.1 Slideshow Images
- **Reads**: If fetching `showcase_images` from Supabase throws a network error, fails to resolve, or returns zero rows, the client falls back to reading the image array cached in `localStorage` under `tochay_offline_showcase_images`.
- **Writes**: When the admin clicks **Save Changes**, the system attempts to sync the changes directly with the cloud database. If it encounters a connection issue (e.g. placeholder client settings or network dropouts), it caches the updates in `localStorage` and alerts the user that changes are saved locally to the browser cache.

### 4.2 Image Uploads
- Direct uploads from the device try to write to the `showcase` bucket.
- If it fails (due to permissions, RLS policies, or CORS errors), it converts the image file to a **Base64 data-URI string** and writes it directly to the corresponding database text column (`url_path` or `image`).
- **Quota & Memory Compression (HTML5 Canvas)**:
  - To prevent browser `QuotaExceededError` crashes (which happen when local Base64 string arrays exceed browser localStorage limits of **5MB**), images are compressed client-side before conversion.
  - The client scales images down to a maximum width of `1200px` and applies a `0.7` quality compression factor.
  - This reduces raw file sizes by **90%+** (typically compressing 3MB down to ~200KB) while maintaining excellent aesthetic sharpness for retina screens.
  - Pages natively render both public URL paths and Base64 strings.



---

## 5. Rates, Pricing & Discount Codes Schema

To manage dynamic invoice generation and rates configuration, the application utilizes three relational tables matching the pricing catalog:

### 5.1 `master_services` Table
Stores one-off stand-alone services and standard base rates.
- `id`: `uuid` (PK)
- `name`: `text` (Service name)
- `description`: `text`
- `price`: `numeric` (Standard base rate)

### 5.2 `service_cards` Table
Stores suite package retainers and bundles.
- `id`: `uuid` (PK)
- `name`: `text` (Package name)
- `category`: `text` (e.g., "identity" or "asset")
- `tier`: `text` (e.g., "basic", "standard", "premium")
- `price`: `numeric` (Bundled package price)
- `description`: `text` (Comma-separated inclusion notes)

### 5.3 `card_service_items` Table
Relational mapping table linking a package (`service_cards`) to its component deliverables (`master_services`).
- `id`: `uuid` (PK)
- `card_id`: `uuid` (FK -> `service_cards.id` ON DELETE CASCADE)
- `service_id`: `uuid` (FK -> `master_services.id` ON DELETE CASCADE)
- `custom_name`: `text` (Optional label override for PDF invoices)
- `price_override`: `numeric` (Optional rate value override for PDF invoices)

### 5.4 `discount_codes` Table
Promo coupons applied at checkout.
- `id`: `uuid` (PK)
- `code`: `text` (Unique uppercase promo code)
- `type`: `text` ("percentage" or "fixed")
- `value`: `numeric` (Discount amount or percentage)
- `expires_at`: `timestamp` (Optional expiration limit)

### 5.5 PDF Invoice Itemization Engine
When compiling the client's PDF invoice (using jsPDF + AutoTable):
- If the cart item is a package (`type === "card"`), the generator inserts the main package row (e.g., `₦50,000` standard bundle price).
- It then queries `card_service_items` for that package. For each associated deliverable, it appends an indented sub-row showing the internal value rate of that item:
  - Label: `item.custom_name` ?? `master_services.name`
  - Price: `item.price_override` ?? `master_services.price`
  - Total: Printed as `"Included"`.
- This provides an itemized breakdown of the package value without altering the package's bundled price total.



---

## 6. Storage Buckets & Policies

To store raw portfolio cover images and home page slideshow elements, the application requires a Supabase Storage bucket with public access:

### 6.1 `showcase` Bucket
- **Visibility**: Public (allows files to be resolved via standard public URLs).
- **RLS Policies**:
  - **INSERT**: `CREATE POLICY "Allow public upload showcase" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'showcase');`
  - **SELECT**: `CREATE POLICY "Allow public read showcase" ON storage.objects FOR SELECT TO public USING (bucket_id = 'showcase');`
  - **UPDATE**: `CREATE POLICY "Allow public update showcase" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'showcase');`
  - **DELETE**: `CREATE POLICY "Allow public delete showcase" ON storage.objects FOR DELETE TO public USING (bucket_id = 'showcase');`
- If these policies are missing, uploads fail with `403 Forbidden`, causing the app to fall back to storing compressed Base64 strings in the database.

### 6.2 Low-Quality Base64 Fallback & Troubleshooting
- **Symptom**: Slideshow images look pixelated or blurry, and inspecting the database URL starts with `data:image/jpeg;base64,...`.
- **Cause**: The storage upload failed (typically `403 Forbidden` due to missing RLS storage policies). The app fell back to converting images to Base64 data-URIs to write them directly into the table. To avoid exceeding the browser's `LocalStorage` 5MB quota limit, the app scales Base64 fallbacks down to `1200px` width at `0.7` quality.
- **Resolution**: Apply the SQL statements listed in `6.1` to define the RLS storage policies. Once configured, uploads will succeed directly to the Supabase cloud bucket in full, raw quality without compression.

### 6.3 Automatic Storage Assets Deletion Policy (Storage Optimization)
To prevent orphaned files from accumulating and consuming your Supabase Storage quota, the workspace enforces an **automatic storage cleanup policy**. Deleting data entries or configurations immediately removes their associated files from the storage bucket:

1. **Slideshow Images Manager**:
   - Saving your hero slideshow settings automatically identifies any slideshow image URLs removed from the local state list and deletes the corresponding file from the `showcase/hero/` folder.
2. **Portfolio Case Studies**:
   - Deleting a project case study automatically reads its `image` (cover) and parses its `media` JSON blocks to delete all associated layout and gallery images from the `showcase/portfolio/` folder.
3. **Custom Forms**:
   - Deleting a form template automatically queries all its associated responses, parses their uploaded files, and deletes the files in a batch from the `showcase/form-uploads/` folder before deleting the database row.
4. **Form Submissions**:
   - Deleting an individual client response row fetches its file deliverables metadata and deletes those files from the storage bucket to free up space immediately.





