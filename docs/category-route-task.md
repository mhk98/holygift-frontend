# Task: Category page এর জন্য আলাদা route (ISR + SEO)

> এই file টা কোনো AI agent কে হুবহু দেওয়ার জন্য লেখা। কাজ শুরুর আগে নিশ্চিত হন:
>
> - `src/components/SiteChrome.tsx` আর product page এর ISR (`src/app/product/[id]/page.tsx`) deploy হয়ে গেছে।
> - Google Tag Manager এ `?menu=` URL দিয়ে কোনো trigger আছে কিনা দেখে নিয়েছেন।

---

Holy Gift storefront (holydeen-frontend, Next.js 16 App Router) এ category page এর জন্য আলাদা route বানাতে হবে, যাতে পুরো page cache (ISR) হয় আর SEO ভালো হয়।

## এখনকার অবস্থা

- Category page আসলে homepage: `/?menu=<Category>&sub=<Subcategory>&child=<Childcategory>`। `src/app/page.tsx` searchParams পড়ে, 200 product fetch করে, আর category/sub/child এর নাম (case-insensitive) মিলিয়ে filter করে। searchParams এর কারণে page টা dynamic, প্রতিটা request এ render হয় (প্রায় 0.6–0.9s)।
- Product details page (`src/app/product/[id]/page.tsx`) এ আগে থেকেই ISR আছে: `export const revalidate = 60` + `generateStaticParams() { return [] }`। এই pattern টাই অনুসরণ করবে।
- Header/Footer এর data আসে `src/components/SiteChrome.tsx` থেকে (server-side, cached)।

## যা করতে হবে

1. নতুন route: `/category/[id]/[slug]`, আর sub/child এর জন্য উপযুক্ত nested route বা query-free path, যেমন `/category/[id]/[slug]/[subId]/...`। URL এ category এর ID থাকবে, যাতে admin এ নাম বদলালে বা নাম বাংলায় হলে link না ভাঙে। Slug শুধু দেখানোর জন্য। Slug ভুল হলে সঠিক slug এ redirect করবে।
2. Category, subcategory আর child-category এর Id menu API থেকে পাওয়া যায় (`src/services/menuService.ts`, `/api/v1/menu/public`, প্রতিটা item এ `Id` আছে)।
3. Page এ `export const revalidate = 60` আর খালি `generateStaticParams` দেবে। Category পাওয়া না গেলে `notFound()`। কিন্তু network বা backend error হলে throw করবে, যাতে ISR আগের ভালো page টাই রাখে (`fetchProductById` যেভাবে করে)।
4. প্রতিটা category page এর নিজের metadata (title/description) থাকবে। Backend category model এ `metaTitle` আর `metaDescription` আছে। দরকার হলে public menu API তে এগুলো যোগ করবে (holydeen-backend, `app/modules/category/category.service.js` → `getPublicMenu`)।
5. Category URL বানানোর জন্য একটা helper function বানাবে (যেমন `src/lib/categoryUrl.ts`), আর নিচের সব জায়গায় `/?menu=...` link এর বদলে সেটা ব্যবহার করবে:
   - `src/components/Header.tsx`: desktop menu, dropdown, mobile menu (`router.push` সহ) এর সব link। Active menu এর highlight এখন `useSearchParams().get("menu"/"sub"/"child")` থেকে আসে, সেটা নতুন URL থেকে পড়ার ব্যবস্থা করবে (যেমন `usePathname`)।
   - `src/components/TopCategories.tsx`
   - `src/components/ProductSection.tsx` (`menuParam` আর "see more" link)
   - `src/components/ProductDetailClient.tsx` (category/subcategory link)

   Shell এ `grep -rn 'menu=' src` চালালে এমন কোনো link বাকি থাকবে না।

6. পুরনো URL: `/?menu=X&sub=Y&child=Z` এ এলে নতুন URL এ 308 permanent redirect করবে, যাতে পুরনো Facebook ad, post বা bookmark না ভাঙে। Homepage (`/` কোনো menu param ছাড়া) আগের মতোই থাকবে।

## শর্ত

- Design বা UI তে কোনো পরিবর্তন করবে না। নতুন page এ এখনকার filtered view এর মতোই Header, "← সব পণ্য দেখুন" link, ProductSection আর Footer থাকবে, একই DOM আর style এ।
- `next.config.ts` আর `src/lib/api.ts` এ API URL এর local বদল (`localhost:5000`) থাকতে পারে। এগুলো commit করবে না।
- `AGENTS.md` পড়বে। Next 16 এ breaking change আছে, তাই `node_modules/next/dist/docs/` এর docs মেনে কাজ করবে।
- আমার অনুমতি ছাড়া commit বা push করবে না। Push করলে Hostinger এ auto deploy হয়।

## যাচাই

- `npx tsc --noEmit` আর `npm run build` (`NEXT_PUBLIC_API_URL=http://localhost:5000` দিয়ে) সফল হবে। Build output এ category route `●` (ISR) দেখাবে, `ƒ` না।
- `next start` চালিয়ে প্রতিটা category, subcategory আর child-category খুলে মিলিয়ে দেখবে:
  - পুরনো `/?menu=...` URL এ যে product আসে, নতুন URL এও ঠিক সেগুলোই আসছে।
  - দ্বিতীয় request এ `x-nextjs-cache: HIT` আসছে।
  - পুরনো URL ঠিক page এ redirect হচ্ছে।
  - Header এর active highlight কাজ করছে।
  - না থাকা category এ 404 দেয়।
- শেষে কী বদলেছে, test এর ফল কী, আর আমাকে কী check করতে হবে (যেমন Google Tag Manager এ `?menu=` ভিত্তিক trigger আছে কিনা), সেটা জানাবে।
