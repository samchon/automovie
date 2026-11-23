# src/internal/index.ts#IPackageChecklistClaimProps

## @evidence contracts/development/design.md#principled-representation

The object groups work-contract paths, addressed inside the production's `docs/contracts`, host selectors, explicit symbol granularity and activation flags for createPackageChecklistClaim; the checklist default is documented on its member.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One object owns document selection, host granularity and activation so createPackageChecklistClaim validates the relationship together.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Exact work paths and symbol validity are enforced by createPackageChecklistClaim rather than hidden type-level assumptions.

## @evidence contracts/development/common.md#meaningful-documentation

Members explain document-relative addressing, body-relative hosts, required host granularity, the checklist default and optional deferral.
