# src/animals/AutoMovieArchetypeEquineComfort.ts#AutoMovieArchetypeEquineComfort

## @evidence contracts/development/common.md#meaningful-documentation

States each act's expansion, the neutral return, the seeded cycle and what is authored.

## @evidence contracts/development/design.md#principled-representation

Acts in, a ride out; an idle cycle is a list of acts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two entries: play acts over a halt, and draw an idle cycle.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The behaviours are the stance's and the expression layer's own; no pose is duplicated here.

# src/animals/AutoMovieArchetypeEquineComfort.ts#AutoMovieArchetypeEquineComfort.after

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the output and every refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Admit each act, expand it into stance rows and expression cues, play the rows through the stance and layer the cues over it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admission, expansion, two layers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A moving horse refuses; nothing is clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the acts; sampling costs are the two layers'.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the stance and the expression layer.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned ride retains the layers'.

# src/animals/AutoMovieArchetypeEquineComfort.ts#AutoMovieArchetypeEquineComfort.idle

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the determinism and the bound on the last act.

## @evidence contracts/development/implementation.md#principled-implementation

Each slot draws a neutral gap, a kind, a length within that kind's bounds and its parameters from `seededValue` over the seed, the slot and a domain number; rests alternate sides; the cycle stops before an act would end after `to`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop of slots.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No global random stream: every draw is a pure function of its seed parts.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per act.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the engine's seeded value.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh acts and retains nothing.
