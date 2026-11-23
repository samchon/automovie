# src/index.ts#IAutoMovieSectionRenderer

## @evidence contracts/development/design.md#principled-representation

Models Three's actual localClippingEnabled property, which determines whether per-material clipping planes participate in rendering.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A single structural property is the complete renderer capability applyAutoMovieSectionPlanes needs, leaving drawing and context ownership outside clipping application.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The real renderer structurally satisfies this seam without a replacement method, fake context or test-only branch.

## @evidence contracts/development/common.md#meaningful-documentation

Explains the clipping switch's effect and why this boundary does not require full WebGLRenderer capability.
