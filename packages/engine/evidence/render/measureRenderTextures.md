# src/render/measureRenderTextures.ts#measureRenderTextures

## @evidence contracts/development/common.md#meaningful-documentation

States when the phase runs, what it adds to the material table, which rows and gaps it appends, what it returns and its refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Resolves the shadow profile the scene or the target settings ask for, completes the material table with the drawn parts' own materials, and closes textures over that table with `measureAutoMovieRenderTextureClosure`, which owns sharing, residency and the conservative storage bounds; asset rows are the owner's own cost and renderer-made textures runtime cost, and unknown or unsafe sums stay `null` with a `not-run` gap.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The inventory's material and texture phase, split from the orchestrator by responsibility as the population and simulation phases are; the orchestrator keeps the order and the totals.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unsupported shadow profile refuses, and no unknown texture fact is replaced by an estimate.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the drawn models' parts and in the closure rows, after the closure's own work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each inventory runs it once; the shared material table is the orchestrator's.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Adds to the caller's material table, rows and gaps and returns fresh closure rows; it retains nothing.

# src/render/measureRenderTextures.ts#measureRenderTextures.ICaster

## @evidence contracts/development/design.md#principled-representation

One shadow map's light id, its depth faces and its filtering draws, the counts the pass phase multiplies by.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The fields the shadow profile reports and the pass phase reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Mirrors the shadow profile's caster record rather than a new identity.

## @evidence contracts/development/common.md#meaningful-documentation

Each field states what it counts.

# src/render/measureRenderTextures.ts#measureRenderTextures.IProps

## @evidence contracts/development/design.md#principled-representation

The subject, the optional target settings, the earlier phases' model and material tables and the shared row and gap sinks.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only what the phase reads or appends to.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The row sink keeps the simulation phase's signature, so every phase appends the same rows.

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what it holds and whether the phase changes it.

# src/render/measureRenderTextures.ts#measureRenderTextures.IResult

## @evidence contracts/development/design.md#principled-representation

The casters, the closure rows and their sums, `null` where unknown.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Exactly what the orchestrator and the pass phase read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unknown sums are `null`, not zero.

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what it sums and when it is `null`.
