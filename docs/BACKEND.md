# Backend & Database Roadmap (Supabase)
**Project**: Ultra-High-End Portfolio Web Application  
**Workspace**: `tochayportfolio`
**Stack**: Supabase PostgreSQL + Next.js Server Actions

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

To secure our backend API keys and block unauthorized edits to our projects:

### 2.1 Projects Table RLS
- **`SELECT`**: Allowed for all users (`anon` public key) where `is_published = true`.
- **`INSERT` / `UPDATE` / `DELETE`**: Restricted exclusively to Authenticated Admin users (`authenticated` role).

### 2.2 Inquiries Table RLS
- **`INSERT`**: Open for anyone (`anon` role) to submit inquiries.
- **`SELECT` / `UPDATE` / `DELETE`**: Restricted exclusively to Authenticated Admin users.

### 2.3 Showcase Images Table RLS
- **`SELECT`**: Open to public readers (`anon` role) to display slides.
- **`INSERT` / `UPDATE` / `DELETE`**: Restricted exclusively to Authenticated Admin users.


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
