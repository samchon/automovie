# src/validation/IAutoMovieValidateMaterialProcedural.ts#IAutoMovieValidateMaterialProcedural

## @evidence contracts/development/common.md#meaningful-documentation

Names the input of `validateMaterialProcedural`, the engine's admission of one material's procedural surface.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It mirrors the existing lobe admission input instead of borrowing its name, so each admission states its own purpose.

## @evidence contracts/development/design.md#principled-representation

The material, the model's parts and the diagnostic paths of both, with the caller's collector.

## @evidence contracts/development/design.md#minimal-and-owned-surface

`interface` owns it; `validateModel` builds it and `validateMaterialProcedural` reads it.

# src/validation/IAutoMovieValidateMaterialProcedural.ts#IAutoMovieValidateMaterialProcedural.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what it supplies: the material, its diagnostic path, the parts searched for citations, their path and the collector.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Parts are borrowed read-only; the admission reports and never repairs them.

## @evidence contracts/development/design.md#principled-representation

The parts are present because a pattern piece requires UV0 on every part that cites its material.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Every member is read by the admission.
