# Backend Integration Guide

This guide explains how to connect the mailbox-ui-clone frontend to the Keycloak SSO backend.

## Prerequisites

1. **Backend running** on `http://localhost:8081`
2. **Keycloak running** on `http://localhost:8080`
3. **Keycloak realm** `pilot180` configured
4. **Keycloak client** `ai-email-assistant` created

---

## Keycloak Client Setup

Go to your Keycloak Admin Console at `http://localhost:8080/admin`:

1. Navigate to **Realm: pilot180**
2. Go to **Clients** → **Create**
3. Configure the client:
   - **Client ID**: `ai-email-assistant`
   - **Access Type**: `public`
   - **Root URL**: `http://localhost:3006`
   - **Valid Redirect URIs**: `http://localhost:3006/*`
   - **Web Origins**: `*`
4. Click **Save**

---

## Environment Configuration

The `.env` file has been created with the following configuration:

```env
VITE_KEYCLOAK_URL=http://localhost:8080/
VITE_KEYCLOAK_REALM=pilot180
VITE_KEYCLOAK_CLIENT_ID=ai-email-assistant
VITE_API_BASE=http://localhost:8081/api
```

You can modify these values if your setup is different.

---

## Running the Application

### 1. Start the Backend

From your backend folder:

```bash
npm start
```

Or using Docker Compose:

```bash
docker compose up -d
```

### 2. Start the Frontend

From this directory:

```bash
npm run dev
```

The application will be available at [http://localhost:3006](http://localhost:3006)

---

## How It Works

### Authentication Flow

1. **Keycloak Initialization** ([index.tsx](index.tsx#L13))
   - When the app starts, Keycloak is initialized with `onLoad: "login-required"`
   - If not authenticated, the user is redirected to the Keycloak login page
   - After successful login, the app is mounted

2. **Token Management** ([api.ts](api.ts))
   - All API requests automatically include the JWT token in the `Authorization` header
   - The token is automatically refreshed if it's about to expire
   - If the token is invalid, the user is redirected to login

3. **API Requests** ([App.tsx](App.tsx))
   - The app fetches emails from `/api/mail/inbox` and `/api/mail/sent`
   - Backend responses are transformed to match the frontend data structure

### File Structure

```
mailbox-ui-clone/
├── .env                    # Environment variables
├── keycloak.ts            # Keycloak configuration
├── api.ts                 # Axios instance with auth interceptors
├── emailTransformer.ts    # Transform backend data to frontend format
├── types.ts               # TypeScript interfaces
├── index.tsx              # App entry point with Keycloak init
├── App.tsx                # Main app component with API integration
└── components/            # UI components
```

---

## Backend API Endpoints

The frontend uses these backend endpoints:

| Endpoint                 | Method | Description        |
| ------------------------ | ------ | ------------------ |
| `/api/mail/inbox`        | GET    | Fetch user inbox   |
| `/api/mail/sent`         | GET    | Fetch sent emails  |
| `/api/mail/:id`          | GET    | Get message by ID  |
| `/api/mail/send`         | POST   | Send a new message |
| `/api/mail/search?q=...` | GET    | Search user emails |

---

## Troubleshooting

### Login Redirect Loop

If you're stuck in a login loop:
1. Check that the Keycloak client has the correct redirect URIs
2. Clear your browser cookies and local storage
3. Verify the backend is running and accessible

### CORS Errors

If you see CORS errors:
1. Ensure the backend allows requests from `http://localhost:3006`
2. Check that `Web Origins` is set to `*` or `http://localhost:3006` in Keycloak

### No Emails Loading

If emails don't load:
1. Check the browser console for API errors
2. Verify the backend is running on port 8081
3. Check that your user has emails in the database
4. Verify the JWT token is being sent (check Network tab in DevTools)

### Token Expired

If you see "Token expired" errors:
- The app automatically refreshes tokens, but if that fails, you'll be redirected to login
- This is normal behavior if you've been idle for a long time

---

## Development Workflow

1. Make sure Keycloak, backend, and PostgreSQL are running
2. Start the frontend dev server: `npm run dev`
3. Login with your Keycloak credentials
4. You'll see your real emails from the backend

---

## Next Steps

You can extend the integration by:

1. **Adding send email functionality**
   - Create a compose component that POSTs to `/api/mail/send`

2. **Implementing search**
   - Wire up the search bar to `/api/mail/search`

3. **Adding real-time updates**
   - Use WebSockets or polling to fetch new emails

4. **Implementing folders**
   - Add backend support for custom folders
   - Update the folder navigation to use real data

---

## Security Notes

- Never commit the `.env` file with production credentials
- The current setup uses `public` client type - suitable for SPAs
- Tokens are stored in memory (not localStorage) for better security
- Always use HTTPS in production

---

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check the backend logs
3. Verify Keycloak configuration
4. Ensure all services are running on the correct ports
