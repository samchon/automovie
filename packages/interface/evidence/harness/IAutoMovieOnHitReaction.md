# src/harness/IAutoMovieOnHitReaction.ts#IAutoMovieOnHitReaction

## @evidence contracts/development/design.md#principled-representation

The reaction source is one metre upstream of the computed landing velocity direction, or of the origin-to-aim sightline below 1e-9 m/s landing speed. React synthesis then projects the source-to-actor direction horizontally in the actor's staged frame; it is choreographed recoil and need not reproduce the projectile's full 3D incoming direction.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two fields mirror the `react` verb's force and unbalance, because the engine expands this record into a `react` and reuses that verb's synthesis and range-of-motion gate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A point or group does not identify which actor was struck, so the gate refuses that onHit declaration rather than silently dropping it or choosing a group member; a camera cannot receive actor recoil.

## @evidence contracts/development/common.md#meaningful-documentation

States react expansion, impact timing and incoming source, the single-struck-actor requirement and point, group and camera refusals; members give force bounds and the limits of unbalance behavior.
