# src/render/IAutoMovieMeasureRenderTextureClosure.ts#IAutoMovieMeasureRenderTextureClosure.IProps

## @evidence contracts/development/design.md#principled-representation

Used materials, asset source facts and optional context residency bind current and retained texture consumers to actual upload identities.

## @evidence contracts/development/design.md#minimal-and-owned-surface

measureRenderTextureClosure borrows canonical materials, source and residency records; host graphics objects cross only as equality identities already owned by those contracts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Absent residency means a fresh context; missing multi-scope identities leave bytes unknown, and environment initialization unions remain upper bounds.

## @evidence contracts/development/common.md#meaningful-documentation

Documents context scope, optional defaults, identity requirements and exclusions from storage counts.
