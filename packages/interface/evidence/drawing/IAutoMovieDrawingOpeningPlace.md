# src/drawing/IAutoMovieDrawingOpeningPlace.ts#IAutoMovieDrawingOpeningPlace

## @evidence contracts/development/design.md#principled-representation `deriveAutoMovieDrawingSchedule` looks up the host boundary, copies and sorts its spaces with `compareAutoMovieRenderIds`, and resolves each with `builtEnvironmentBuildingOfSpace`, naming a unit only when every space resolves to the same one.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The `kind` discriminant lets the schedule place union narrow to this variant, and the variant holds only the two lookups an opening's location needs instead of the room fields that do not apply to a void.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A boundary straddling two building units yields `null` rather than the first unit, so the derivation never picks an owner it has no rule for.

## @evidence contracts/development/common.md#meaningful-documentation

States where each field comes from and that a type row carries only its first occurrence's place; members give when `building` is `null`, the ascending order and the one-or-two count of `separates`.
