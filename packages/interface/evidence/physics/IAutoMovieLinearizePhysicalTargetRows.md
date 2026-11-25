# src/physics/IAutoMovieLinearizePhysicalTargetRows.ts#IAutoMovieLinearizePhysicalTargetRows.IRows

## @evidence contracts/development/common.md#meaningful-documentation

Defines candidate-bone dependencies, exact acceptance residuals and frozen local witness callbacks.

## @evidence contracts/development/design.md#principled-representation

Residual vectors use metres and preserve dimensions across probes; rigidInvariant applies only to same-body separation under common rigid motion.

## @evidence contracts/development/design.md#minimal-and-owned-surface

physicalContactBindingRows and physicalContactSupportRows create these groups; linearizePhysicalTargetRows uses their dependency sets to reuse unaffected rows.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The explicit bone set must include every candidate dependency; external body poses remain fixed actual inputs, not silently refitted candidates.
