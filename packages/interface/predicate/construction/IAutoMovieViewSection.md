# src/construction/IAutoMovieViewSection.ts#IAutoMovieViewSection.IBox

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives the direction order and valid half-extent input premise.

## @evidence contracts/development/design.md#principled-representation

ViewSectionConic uses adjacent positive supports as the two endpoints of each quarter. The source's admission rules check usable conic data.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A four-slot box captures the section geometry's support limits. Sign conversion and world placement stay with the view and axis owners.

# src/construction/IAutoMovieViewSection.ts#IAutoMovieViewSection.IBox.extents

## @evidence contracts/development/common.md#meaningful-documentation

The field documentation fixes the shared slot semantics.

# src/construction/IAutoMovieViewSection.ts#IAutoMovieViewSection.ISection

## @evidence contracts/development/common.md#meaningful-documentation

The comment distinguishes the two preparation capabilities and names the measurement provenance.

## @evidence contracts/development/design.md#principled-representation

ViewSection.bare prepares the actual source and its observation partition. Of reads each corner direction and numerical native arc length without replacing the conic source.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The section uses one box, one native geometry and derived inspection data. Consumers still read native geometry when evaluating radii.

# src/construction/IAutoMovieViewSection.ts#IAutoMovieViewSection.ISection.box

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the input connection to support geometry.

# src/construction/IAutoMovieViewSection.ts#IAutoMovieViewSection.ISection.shoulders

## @evidence contracts/development/common.md#meaningful-documentation

The comment specifies the order and geometric role of the fullness controls.

# src/construction/IAutoMovieViewSection.ts#IAutoMovieViewSection.ISection.guides

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies actual guide sampling and its derivative role.

# src/construction/IAutoMovieViewSection.ts#IAutoMovieViewSection.ISection.knots

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the source and intended use of these observations.

# src/construction/IAutoMovieViewSection.ts#IAutoMovieViewSection.ISection.conics

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the owner of actual radial geometry and refusal.

# src/construction/IAutoMovieViewSection.ts#IAutoMovieViewSection.ISection.fullness

## @evidence contracts/development/common.md#meaningful-documentation

The comment documents the retained field's value and points to the active owner.

# src/construction/IAutoMovieViewSection.ts#IAutoMovieViewSection.ISection.girth

## @evidence contracts/development/common.md#meaningful-documentation

The comment defines the units, default in bare mode and failed-observation value.

# src/construction/IAutoMovieViewSection.ts#IAutoMovieViewSection.ISection.diagonals

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies both the independent angular directions and default.

# src/construction/IAutoMovieViewSection.ts#IAutoMovieViewSection.IRange

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives endpoint order, units through their fields and the shared departure policy.

## @evidence contracts/development/design.md#principled-representation

ViewSectionRange.create searches inward from shoulder boundaries using actual source faults and checks that the measured endpoint girths rise.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The record pairs common shoulder bounds with matching length samples for the girth solver. The solver queries the source geometry through its separate trial reader.

# src/construction/IAutoMovieViewSection.ts#IAutoMovieViewSection.IRange.shoulder

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies values the numeric solve can bracket.

# src/construction/IAutoMovieViewSection.ts#IAutoMovieViewSection.IRange.girth

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies how measurements align to the shoulder bounds.

# src/construction/IAutoMovieViewSection.ts#IAutoMovieViewSection.ISolved

## @evidence contracts/development/common.md#meaningful-documentation

The comment describes the valid, fallback and refused return states.

## @evidence contracts/development/design.md#principled-representation

ViewSection.solve tries an eligible local bracket before complete reach search. It compares the measured candidate length with the requested girth and preserves its selected endpoint or best available section with the actual diagnostic.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result pairs source-backed geometry with diagnostics for inspection. Loft construction determines whether those diagnostics permit final publication.

# src/construction/IAutoMovieViewSection.ts#IAutoMovieViewSection.ISolved.section

## @evidence contracts/development/common.md#meaningful-documentation

The comment states which geometry callers can inspect under a refusal.

# src/construction/IAutoMovieViewSection.ts#IAutoMovieViewSection.ISolved.diagnostics

## @evidence contracts/development/common.md#meaningful-documentation

The comment distinguishes the actual failure reasons from a successful solve.
