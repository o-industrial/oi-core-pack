# Agents Guide - oi-core-pack

Shared capability pack for workspace and surface management experiences. Packages modal workflows, capability managers, and supporting views backed by the atomic component library.

## Scope
- Export workspace runtime modals (`src/runtime/modals/*`) and menu helpers for downstream runtimes.
- Deliver capability slices under `src/capabilities/*` (connection, surface, simulator, warm-query, etc.).
- Re-export curated atomic components via `src/.deps.ts` so consumers stay aligned with the shared design system.
- Exclude runtime bootstrapping or API clients beyond helpers proxied through `@o-industrial/common`.

## Project Map
- `src/.pack.ts` - Default pack builder; defines public surface for `@o-industrial/oi-core-pack`.
- `src/capabilities/**/.exports.ts` - Capability-specific bundles (connections, surfaces, simulators).
- `src/runtime/modals/.exports.ts` - Workspace/environment/billing/API modal exports.
- `tests/` - Pack-level smoke tests; expand alongside new capability logic.
- `.deps.ts` - Central dependency surface; mirrors atomic + reference-architecture contracts.

## Commands
- `deno task check` - Format, lint, and type-check pack code.
- `deno task test` - Execute pack tests with coverage report.
- `deno task build` - Run formatting, linting, publish dry-run, and tests before release.
- `deno task deploy` - Clean coverage artifacts, run full build, and sync via `ftm`.

## Patterns
- Treat this pack as compositional glue: keep UI primitives in `@o-industrial/atomic`, business orchestration inside consuming runtimes, and expose only reusable capability slices.
- Prefer dependency injection via props/context so modals and inspectors remain testable.
- Follow the atomic compliance backlog; avoid reintroducing stateful atoms or fetch logic in molecules pulled into this pack.
- Keep exports small and purpose-driven; favor feature-specific `.exports.ts` barrels over broad re-exports.

## Review & Test Checklist
- Ensure pack exports remain tree-shakeable; validate via consumer build or local `deno task build`.
- Add targeted tests for new capability logic (validators, transformers, modal behaviors) rather than relying solely on the default smoke test.
- Confirm compatibility with the latest `@o-industrial/atomic` release and adjust imports when breaking changes land.
- Coordinate documentation updates when introducing new exports or deprecations.

## Safety & Guardrails
- Do not embed runtime secrets or environment-specific URLs; accept them via props or configuration.
- Align modal accessibility with the atomic Modal contract (focus trapping, aria labels).
- Avoid direct mutations of EaC objects outside Pack builders; use the fluent APIs supplied by `@o-industrial/common`.

## Ownership Signals
- **Primary owner:** Runtime Architecture Guild - Core Pack Maintainers.
- **Point of contact:** #open-industrial-runtime Slack channel.
- **Escalation:** Runtime Architecture Guild (Jordan Blake).

## Dependencies & Integrations
- Depends heavily on `@o-industrial/atomic` for atoms/molecules/organisms; monitor the [Atomic plan](../Atomic.plan.md) for breaking updates.
- Pulls types, clients, and fluent builders from `@o-industrial/common`.
- Interacts with runtime Workspace manager APIs; coordinate schema updates with workspace-runtime owners.

## Related Docs
- Atomic library: [`open-industrial-atomic/src/Agents.md`](../open-industrial-atomic/src/Agents.md).
- Runtime usage: [`open-industrial-workspace-runtime/AGENTS.md`](../open-industrial-workspace-runtime/AGENTS.md).
- Compliance backlog: [Atomic plan](../Atomic.plan.md).

## Changelog Expectations
- Update this guide when adding capability folders, introducing new modal categories, or changing export paths.
- Document deprecations and migration notes in release PRs so consuming runtimes can react promptly.
