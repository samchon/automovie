# src/physics/IAutoMoviePhysicalContactBindingRows.ts#IAutoMoviePhysicalContactBindingRows.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Identifies source seed, simultaneous receiver poses and borrowed no-dynamics geometry for one fit.

## @evidence contracts/development/design.md#principled-representation

Body/bone identities resolve canonical profiles and world-metre poses; bindings remain in authored order for row attribution.

## @evidence contracts/development/design.md#minimal-and-owned-surface

physicalContactBindingRows builds residual closures from the shared profile, binding and geometry query contracts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A missing contact witness is a refusal, and external receivers remain actual while same-body candidate dependencies are tracked explicitly.

# src/physics/IAutoMoviePhysicalContactBindingRows.ts#IAutoMoviePhysicalContactBindingRows.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Documents original binding ids and the lifetime of residual closures retaining borrowed fit inputs.

## @evidence contracts/development/design.md#principled-representation

An ordered list pairs each binding identity with its metre-valued nonlinear/local row group.

## @evidence contracts/development/design.md#minimal-and-owned-surface

planPhysicalContactTargets uses the id for residual attribution and the shared IRows protocol for the articulation solve.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Keeping a row alive also keeps its fit data alive; release rows after fitting and do not reinterpret residuals as contact receipts.
