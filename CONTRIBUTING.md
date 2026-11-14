# Contributing to the Ostiary panel

Thanks for helping out. This guide explains how to run the panel on your own machine and check your changes before you open a pull request.

The panel is a [Next.js](https://nextjs.org) app written in TypeScript. Its pages run in your browser and talk to Ostiary's admin API, which lives in the [main repository](https://github.com/fromScratchStudioGr/ostiary).

## What you need

- Node.js 22 and npm.
- A running Ostiary admin API. The easiest way is the main repository's Docker Compose, which serves the admin API at http://localhost:8081.

Docker Compose also starts its own copy of the panel on port 3001, the same port the development server uses. Stop it before you start the panel locally:

```
docker compose stop panel
```

## Running the panel locally

```
npm ci
npm run dev
```

The panel opens at http://localhost:3001. Sign in as `admin` with the password `admin` on a fresh Ostiary.

## Settings

The panel has one setting.

| Setting | What it does | Default |
|---|---|---|
| `ADMIN_API_URL` | The address of Ostiary's admin API, as your browser reaches it. It is also added to the panel's Content-Security-Policy, the browser rule that limits which addresses the panel may call. | `http://localhost:8081` |

To change it, put it in a `.env.local` file in the project folder and restart the development server. The panel's server reads it while it runs, not when the app is built, so the same build or Docker image works with any address. The browser gets it from the panel's `/api/config` route, and `proxy.ts` adds it to the Content-Security-Policy on each request.

The admin API has to accept requests from the panel. If you run the panel somewhere other than http://localhost:3001, set the admin API's `CORS_ALLOWED_ORIGIN` and `COOKIE_SAMESITE` as the [README](README.md#settings-on-the-admin-api) describes.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts the development server on port 3001. |
| `npm run build` | Builds the panel for production. |
| `npm run start` | Serves the production build on port 3001. |
| `npm run lint` | Checks the code with ESLint. |

## Checking your changes

There are no automated tests yet. Before you open a pull request, make sure both of these pass:

```
npm run lint
npm run build
```

Then try your change in the browser, on a narrow phone-sized window as well as a wide one.

## Building the Docker image

The `Dockerfile` builds a small production image that listens on port 3001. The image works for any deployment, because the admin API address is set when the container starts, with `ADMIN_API_URL`.

To check that the Dockerfile builds for both platforms the published image supports:

```
docker buildx build --platform linux/amd64,linux/arm64 .
```

Pushing a version tag such as `v1.2.3` runs `.github/workflows/image.yml`, which builds the image for both platforms and publishes it to the GitHub Container Registry.

## Finding your way around

- `app/(dashboard)/` holds the pages you see after signing in. `app/login/` is the sign-in page.
- `app/lib/queries/` holds one file per kind of data (provider keys, consumers, usage and so on), with the calls to the admin API. They use [TanStack Query](https://tanstack.com/query) to fetch and cache data.
- `app/lib/api.ts` sends every request to the admin API. Sign-in uses a cookie the admin API sets, so the panel never stores a token itself.
- `app/components/` holds shared building blocks such as buttons, form fields, dialogs and charts.

This project uses Next.js 16, which differs in places from older versions. When in doubt, check the guides that come with the installed version in `node_modules/next/dist/docs/`.
