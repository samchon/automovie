# src/scene/IAutoMovieCameraClearanceReport.ts#IAutoMovieCameraClearanceReport

## @evidence contracts/development/design.md#principled-representation

The evaluator compares geometry revision, validates ordered samples and tests carried interval bounds. Conservative coverage relies on linear translation, the assumed rotation interpolation and endpoint obstacle boxes enclosing intermediate geometry; its small-angle normalized-lerp slack and binary64 limits remain unresolved rather than proving arbitrary continuous motion.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Sample plan and contacts expose the evaluated bounds while revision identities remain evaluation inputs, preserving stable compiled bytes across publication.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Stale evaluation returns empty samples and findings and cannot publish through the performing producer. Carried clear spelling is no independent freshness certificate, and interval bounds do not establish exact continuous deforming-mesh collision detection.

## @evidence contracts/development/common.md#meaningful-documentation

Defines sample clock, exact ordered instants, interval count, current/stale states and interval-ordered findings.
