---
name: VPS npm registry resilience
description: Deployment constraint for pnpm's supply-chain lockfile verification on the production VPS.
---

Keep the frozen lockfile and `minimumReleaseAge` supply-chain policy enabled for production Docker builds. The VPS's npm-registry connection times out when multiple pnpm installs perform whole-lockfile metadata verification concurrently.

**Why:** Parallel image builds generated hundreds of metadata requests and repeatedly failed with pnpm's metadata-timeout error, even though the lockfile itself was valid.

**How to apply:** Use a pinned pnpm version, share a BuildKit cache only among trusted builds, and build deployment images serially with conservative pnpm network concurrency. Make build stages explicit with `NODE_ENV=development`, `npm_config_production=false`, and `--prod=false` so compiler tools such as esbuild are present; use `NODE_ENV=production` and `--prod` only in runtime stages. Do not bypass the release-age policy as a workaround.