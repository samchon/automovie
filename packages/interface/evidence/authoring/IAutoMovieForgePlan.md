# src/authoring/IAutoMovieForgePlan.ts#IAutoMovieForgePlan

## @evidence contracts/development/design.md#principled-representation `forgeCast` indexes the cast once, checks each entry, then walks the cast again to report every member with a `null` `modelRef` that no entry forged, so the plan must be an exact cover of the stand-in members.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One entry list is the whole plan; the cast and its `modelRef` choices stay on the script, so the plan states only the models it supplies.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A missing stand-in is reported rather than filled with a default rig, and a second entry for one node is refused rather than letting the later one win.

## @evidence contracts/development/common.md#meaningful-documentation

States which consumer reads the plan, what it returns, and the exact-cover rule over cast members with and without a `modelRef`.
