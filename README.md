<p align="center">
  <img src="public/ostiary-logo.png#gh-light-mode-only" alt="Ostiary" width="420">
  <img src="public/ostiary-logo-on-dark.png#gh-dark-mode-only" alt="Ostiary" width="420">
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT"></a>
</p>

This is the **admin panel for [Ostiary](https://github.com/fromScratchStudioGr/ostiary)**, the open source LLM gateway. It is a web app where you **add your provider keys**, give each of your applications **its own Ostiary key**, and **see what every request costs**. It only talks to Ostiary's admin API, the part of Ostiary that manages keys, consumers and usage.

**Your gateway, your keys, your panel.**

## What you can do with it

- Add provider keys for OpenAI, Anthropic, Google Gemini and DeepSeek, and switch them off or delete them.
- Re-encrypt all provider keys after you rotate the encryption key in OpenBao or Google Cloud KMS.
- Manage consumers: the applications, teams or people that use Ostiary.
- Give a consumer access to a provider key, with a spending limit in US dollars, or no limit at all.
- Issue Ostiary keys for each consumer, with an expiry date. Ostiary keys start with `ost_`, and the full key is shown only once. You can switch a key off and on again at any time.
- See usage and cost for the last 7, 14 or 21 days or for all time, for everyone or for a single consumer, and filter it by provider.
- Manage the admin users who can sign in to the panel.

## Getting started

The easiest way to run the panel is together with Ostiary. The [getting started steps in the main repository](https://github.com/fromScratchStudioGr/ostiary#getting-started) start Ostiary and this panel with one Docker Compose command, already set up to work together. The panel then opens at http://localhost:3001.

### Running the panel on its own

The panel is published as a Docker image, `ghcr.io/fromscratchstudiogr/ostiary-panel`, and listens on port 3001.

Tell it the address of Ostiary's admin API with the `ADMIN_API_URL` setting, for example `https://admin.example.com`. Your browser calls the admin API directly, so use an address your browser can open, not a name that only works inside Docker. If you leave it out, the panel uses `http://localhost:8081`.

```
docker run -d -p 3001:3001 -e ADMIN_API_URL=https://admin.example.com ghcr.io/fromscratchstudiogr/ostiary-panel
```

### Settings on the admin API

Two settings on the admin API must match where the panel runs, or signing in will not work. The main repository's Docker Compose already sets both for http://localhost:3001.

- `CORS_ALLOWED_ORIGIN` must be the panel's exact address, such as `https://panel.example.com`. The admin API only accepts requests from this address.
- `COOKIE_SAMESITE` must be `lax` if the panel and the admin API share a root domain, such as `panel.example.com` and `admin.example.com`. If they don't, it must be `none`. The panel keeps you signed in with a cookie, and this setting decides when the browser sends it.

### Signing in

The first time, sign in as `admin` with the password `admin`. Change the password straight away on the Admins page.

## Documentation

The [documentation](https://github.com/fromScratchStudioGr/ostiary-docs) covers setting up and running Ostiary and its panel in more detail.

## Contributing

Contributions are welcome. [CONTRIBUTING.md](CONTRIBUTING.md) explains how to run the panel locally.

## Security

If you find a security issue, please [report it privately through GitHub](https://github.com/fromScratchStudioGr/ostiary-panel/security/advisories/new) instead of opening a public issue.

## License

The Ostiary panel is released under the [MIT License](LICENSE).
