# Release Runbook — `@diamondslab/diamonds-hardhat-foundry`

Tag-triggered OIDC publish (`.github/workflows/release.yml`). **[Eng]** = any
maintainer; **[Owner]** = DiamondsLab org admin + npm `@diamondslab` access.

- **Package:** `@diamondslab/diamonds-hardhat-foundry` (public) · **Registry:** npmjs.com
- **Repo:** <https://github.com/DiamondsLab/diamonds-hardhat-foundry> (submodule of diamonds-dev-env)
- **Toolchain:** Node ≥ 18, Yarn 4.10.3 · **Tag = publish trigger**
- No git hooks (instant push). No standalone `yarn.lock` — CI/publish use
  `yarn install --no-immutable`. Peer deps are also devDeps, so CI builds standalone.

> Kit-instantiated (M4-E5). First cut on this runbook: **v2.5.0** (from 2.4.0).
> **Publishing is irreversible**; recovery is forward-only (§7). Replace `X.Y.Z`.
> **Note:** the release builds in **CI (standalone checkout → single hoisted deps → green)**;
> the local dev workspace has a known multi-copy `tsc --build` limitation (out-of-scope
> hardhat-diamonds reconciliation) that does NOT affect the published artifact.

---

## 0. Preflight — [Eng], gated by [Owner]

- [ ] Clean tree on `release/vX.Y.Z`.
- [ ] `yarn build && yarn test` green (in CI; local build may hit the workspace multi-copy limitation — CI is authoritative). No lint gate (prettier backlog deferred).
- [ ] CI green on origin (Actions).
- [ ] **[Owner]** npm Trusted Publisher for `@diamondslab/diamonds-hardhat-foundry` bound to
      `DiamondsLab/diamonds-hardhat-foundry` + `release.yml`, **exact org casing** (`DiamondsLab`),
      **"Allow npm Stage publish" on**. Existing package → direct bind (no bootstrap).
- [ ] **[Owner]** §B rulesets — branch protection **WITHOUT "Restrict creations/updates"**
      (those block PR merges — M3 lesson) + `v*` tag ruleset with releaser bypass (B4 self-test).
- [ ] Consumer-green fast+full; `yarn forge:test` (integration sanity — record if infra-limited).

## 1. Version bump — [Eng]

```bash
npm pkg set version=X.Y.Z     # 2.5.0 for this cut
node -p "require('./package.json').version"
```

## 2. Finalize the changelog — [Eng]

- [ ] `## [Unreleased]` → `## [X.Y.Z] - YYYY-MM-DD`; fresh `[Unreleased]` above.
- [ ] Version headings: only `v1.0.0` and `v2.4.0` exist on the remote — link those; leave
      others (incl. the new one, until tagged) unlinked.

## 3. Build + pack audit — [Eng]

```bash
yarn build      # (or verify via a standalone checkout if the local workspace build is blocked)
npm pack --dry-run
```

- [ ] Manifest ships: `dist/**` (incl. `dist/templates/`, no `.map`), **`contracts/*.sol`**
      (the Foundry helpers), `LICENSE`, `README.md`, `CHANGELOG.md`, `package.json`.
      **Excludes** `src/` (TS source).
- [ ] `npm pack`; install into a throwaway project; probe `.`, `./package.json`, and
      **`./contracts/DiamondForgeHelpers.sol`** (the Foundry consumer import path).

```bash
git add package.json CHANGELOG.md && git commit -m "chore(release): vX.Y.Z"
```

## 4. Merge to `main` + tag — [Owner]

- [ ] **[Owner]** merge PR `release/vX.Y.Z` → `main` (CI green).
- [ ] **[Owner]** push the tag — **triggers the irreversible publish**:

```bash
git checkout main && git pull
git tag vX.Y.Z && git push origin vX.Y.Z
```

> If a ruleset blocks the push, create the ref via
> `gh api repos/DiamondsLab/diamonds-hardhat-foundry/git/refs -f ref=refs/tags/vX.Y.Z -f sha=<sha>`.

## 5. Verify — [Owner/Eng]

- [ ] `Release` workflow green.
- [ ] `npm view @diamondslab/diamonds-hardhat-foundry version` → `X.Y.Z`; provenance badge.
- [ ] Clean install resolves `.`, `./package.json`, `./contracts/DiamondForgeHelpers.sol`.
- [ ] Diagnose a publish failure with `npm publish --loglevel http`: id-token GET 200 then
      registry `oidc/token/exchange` POST 404 = npm-side config mismatch (fix + re-run; no new tag).

## 6. Dry-run rehearsal — [Eng] (before §4)

```bash
npm publish --dry-run    # (standalone if local build blocked)
npm pack
```
Then root `yarn compile` + consumer-green + `yarn forge:test`.

## 7. Rollback / recovery

Pre-tag: don't push the tag; revert the `main` merge. Post-publish (irreversible):

```bash
npm deprecate '@diamondslab/diamonds-hardhat-foundry@X.Y.Z' 'Broken release — use X.Y.(Z+1)'
npm dist-tag add @diamondslab/diamonds-hardhat-foundry@X.Y.(Z+1) latest
```

## 8. Post-release — [Eng] + [Owner]

- [ ] Bump the monorepo root submodule pointer; root builds green; consumer-green; `yarn forge:test`.
- [ ] **[Owner] §G:** npm Publishing access → "Require 2FA and disallow tokens" (after the
      trusted publisher binds).
- [ ] (Optional) GitHub Release with the `[X.Y.Z]` changelog section.
- [ ] **This is the final fleet release — write the fleet-completion summary.**
