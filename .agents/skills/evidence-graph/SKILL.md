---
name: evidence-graph
description: Defines repository requirement/specification/source traceability and honest evidence citations. Use when changing contracts, public-export evidence or graph configuration. Generated productions use their declared graph and installed package documentation; ordinary capture records are outside this scope.
---

# Evidence Graph

## Contract layers

Requirements own observable product promises; specifications own system behavior and boundaries; public JSDoc owns implementation meaning. Package usage belongs in READMEs. Research supports decisions but does not discharge product promises.

For reusable scaffold/language targets, follow [scaffold](../scaffold/SKILL.md) and the installed evidence package documentation. Consult relevant citations or the [source pool](references.md), and read each used source passage.

## Required triangle

Maintain positive edges `specification -> requirement`, `public source -> specification` and `public source -> requirement`. Every controlled unit needs coverage; each selected public export cites both layers. Its cited specification must positively reach the same requirement. Read the complete path for semantic agreement, not merely resolving tags.

Shared implementation is valid. Do not force one owner or one citation where several units or contributors are legitimate. Split independently implementable behaviors into stable units; leave unfinished units unpaid.

## Carrier population

Select complete public exports from source globs and enable `evidence/documented`. Include matching READMEs. Whole-population exclusions are limited to re-export barrels, process entries and generated files, with reasons. Specialized populations subtract from a complete residual; preserve ordered pattern semantics.

Packages outside this triangle retain their [implementation-contract](../contracts/SKILL.md) obligations under [project participation](../project/SKILL.md#layout).

## Stable identities

Keep controlled H2/H3 anchors explicit, unique, lowercase ASCII and stable. Update every dependent when an identity changes. Narrow README exclusions belong to eligible claim hosts; filename exceptions must not hide debt.

## Author citations

Place Markdown `@evidence` comments at the owning heading/file and TypeScript tags on selected public declarations. Resolve targets through the active claim's roots and selectors. Give each reason the actual host-specific behavior; interchangeable prose is not evidence.

Use `@evidenceExclude` only for a deliberate boundary, never unfinished work. It is not positive coverage and cannot satisfy `noEvidenceExclude`. Neither repository nor production graphs require companion review tags/fingerprints; keep repository `evidence/review` disabled.

## Change and verify

Inspect active configuration and affected hosts/targets before editing. Change contracts, anchors, citations, selections and consumers together. Preserve complete populations and truthful debt; repair the actual owner rather than weakening checks.

Run `pnpm run evidence` or the owning package's evidence script; build when source changes. Standalone evidence checks graph relationships, native guards check documented/singular/todo rules, and [Self-Review](../review/SKILL.md) judges semantic truth. Generated-production input invariants belong to `@automovie/evidence`.

For changed selectors, prove the intended positive and negative cases under [development](../development/SKILL.md#work-rules), restore temporary inputs and rerun the normal check. Use installed dependency types/diagnostics; add no duplicate validator or source-text test. Record unrun checks and their limits.