# src/production/IAutoMovieExternalModelProvenance.ts#IAutoMovieExternalModelProvenance

## @evidence contracts/development/design.md#principled-representation

An explicit model profile, LOD paths and separate collision/measurement references retain acquisition choices on AssetProvenance. Production inspection/adoption is retired, so this metadata neither verifies inspected facts nor installs an appearance or proxy; motion-only metadata has its own record.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Visual representations and the two semantic proxy roles stay separate, preventing one imported mesh declaration from silently supplying unrelated collision or measurement meaning.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

LOD paths are authored instead of inferred from filename conventions, and absent proxies do not fall back to mesh analysis or guessed geometry.

## @evidence contracts/development/common.md#meaningful-documentation

Defines the three model-only profiles, motion exclusion, explicit hero-near-far assets and the independent collision and measurement proxy requirements.
