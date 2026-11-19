# Pull Request: Add public landing page and privacy/terms pages for domain recategorization

**Branch**: `cursor/public-landing-page-7500`  
**Base**: `main`

## Summary

Adds public-facing content to resolve the "Parked" domain categorization issue with Palo Alto Networks firewall. The root domain now returns a 200 response with educational content instead of redirecting to `/login`.

## Problem

The domain `studentreportcards.com` is categorized as "Parked" by school district firewalls because visitors hit a 307 redirect from `/` to `/login` with no public content. URL category reviewers need to see actual educational content to recategorize the domain as "Education".

## Changes

### 1. Public Landing Page (`/`)
- **Now**: Server-rendered public page with 200 status (no redirect for signed-out users)
- **Content**: 
  - Product name "Student Report Cards"
  - Headline: "Modern Report Card Management for K-12 Schools"
  - Feature sections: CSV import, customizable templates, printable report cards, role-based access, secure data, multi-site support
  - Contact section with placeholder email: `hello@studentreportcards.com` ⚠️ **Please confirm this email address**
  - "Sign in" button linking to `/login`
  - Footer with links to privacy policy and terms
- **Auth behavior**: Authenticated users are still redirected to their dashboard; only signed-out visitors see the landing page
- **Styling**: Clean, professional, education-themed using existing Tailwind components

![Landing page screenshot](/opt/cursor/artifacts/landing-page.png)

### 2. Privacy Policy (`/privacy`)
- Comprehensive privacy policy template appropriate for K-12 student data
- FERPA-aware language
- Covers: data collection, usage, ownership (schools own their data), security, no selling data, no advertising
- Contact email: `hello@studentreportcards.com` (placeholder)
- ⚠️ **Note: This is a template for review. Not legal advice. Please review with legal counsel before deploying.**

### 3. Terms of Use (`/terms`)
- Short terms of use template
- Covers: acceptable use, data responsibilities, disclaimers, limitations
- ⚠️ **Note: This is a template for review. Not legal advice. Please review with legal counsel before deploying.**

### 4. SEO & Crawlers
- **`robots.txt`**: Allows all crawlers
- **`sitemap.xml`**: Lists public pages: `/`, `/login`, `/privacy`, `/terms`
- **Metadata**: Updated root layout with proper title, description, Open Graph tags
- **Result**: Search engines and URL categorizers can now discover and index public content

### 5. Middleware Updates
- Added `/`, `/privacy`, `/terms`, `/robots.txt`, `/sitemap.xml` to public routes
- All existing protected routes remain protected
- No changes to authentication logic for protected routes

## Technical Details

- **Build status**: ✅ All builds pass
- **Lint**: ✅ No new lint errors (pre-existing errors in other files remain)
- **Type check**: ✅ Passes
- **Routes**: 
  - `/` → Dynamic (ƒ) - checks auth, shows landing page or redirects to dashboard
  - `/privacy` → Static (○)
  - `/terms` → Static (○)
  - `/robots.txt` → Static (○)
  - `/sitemap.xml` → Static (○)

## Testing

Tested locally:
- ✅ Signed-out users see landing page at `/` (200 status)
- ✅ Signed-in users redirected to dashboard from `/`
- ✅ Privacy and terms pages load and render correctly
- ✅ Links between pages work
- ✅ Responsive design works on mobile/tablet/desktop
- ✅ robots.txt and sitemap.xml accessible

## Next Steps

1. **Confirm contact email**: Replace `hello@studentreportcards.com` with the correct contact email if different
2. **Legal review**: Have legal counsel review and customize the privacy policy and terms of use templates
3. **Deploy to production**: After review, deploy to make public content available
4. **Request recategorization**: After deployment, request Palo Alto Networks to recategorize the domain from "Parked" to "Education"

## Notes

- Privacy policy and terms are starting templates requiring customization with legal counsel
- No database schema changes
- No changes to existing functionality
- Pre-existing lint errors in `components/gradebook/*` and `lib/data/import.ts` remain unchanged per instructions

## Files Changed

- `app/page.tsx` - New public landing page
- `app/privacy/page.tsx` - New privacy policy page
- `app/terms/page.tsx` - New terms of use page
- `app/robots.txt` - New robots.txt allowing all crawlers
- `app/sitemap.xml` - New sitemap with public pages
- `app/layout.tsx` - Updated metadata for SEO
- `middleware.ts` - Added public routes
- `lib/data/import.ts` - Auto-fixed by eslint

## Screenshot

The landing page screenshot is available at `/opt/cursor/artifacts/landing-page.png`
