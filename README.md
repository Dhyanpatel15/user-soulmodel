# CreatorHub — FastAPI-Connected Next.js Platform

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set your API URL (already set to localhost:8000)
# Edit .env.local if your FastAPI runs on a different port

# 3. Run dev server
npm run dev

# 4. Open http://localhost:3000
```

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## API Endpoints Used

| Page | Endpoints |
|------|-----------|
| Login | `POST /api/v1/auth/login` |
| Register | `POST /api/v1/auth/register` |
| Home | `GET /api/v1/user/subscriptions/` |
| Feed | `GET /api/v1/user/subscriptions/` + `GET /api/v1/user/browse/creators/{id}/posts` |
| Media | Same as Feed (extracts media from posts) |
| Chat | `GET /api/v1/user/conversations`, `POST /api/v1/user/conversations/{id}/messages` |
| Notifications | `GET /api/v1/user/notifications/` |
| Profile | `GET /api/v1/user/profile/me`, `PUT /api/v1/user/profile/me` |
| Payments | `GET /api/v1/user/payments/`, `GET /api/v1/user/wallet/`, `POST /api/v1/user/wallet/deposit` |
| Bookmarks | `GET /api/v1/user/bookmarks/` |
| Creator Page | `GET /api/v1/user/browse/creators/{id}`, `GET /api/v1/user/browse/creators/{id}/posts` |
| Subscribe | `POST /api/v1/user/subscriptions/creators/{id}` |
| Unsubscribe | `DELETE /api/v1/user/subscriptions/creators/{id}` |
| Like | `POST /api/v1/user/interact/posts/{id}/like` |
| Bookmark Post | `POST /api/v1/user/interact/posts/{id}/bookmark` |
| Comments | `GET/POST /api/v1/user/interact/posts/{id}/comments` |

## Auth Flow

- JWT token stored in `localStorage` as `access_token`
- All API calls automatically attach `Authorization: Bearer <token>`
- Redirects to `/login` on 401
- `/login` and `/register` are public routes

## Navigating to Creator Pages

Creator profile pages use the creator's **ID** (not username) in the URL:
`/user/{creator_id}`

Links are generated automatically from subscription and browse data.
