# src/drawing/IAutoMovieDrawingSchedulePlace.ts#IAutoMovieDrawingSchedulePlace

## @evidence contracts/development/design.md#principled-representation

A discriminated union on `kind` lets `deriveAutoMovieDrawingSchedule` build the variant its subject owns and lets a reader narrow with one comparison; each variant's fields come from `builtEnvironment*` queries or the record's own references.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three variants keep fields that only mean something for one subject, such as a room's boxes or an opening's host boundary, off the other two, instead of one wide record of mostly `null` fields.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Membership and location come only from declared references; no variant matches id prefixes, and none carries review progress that would make the same design schedule to different bytes.

## @evidence contracts/development/common.md#meaningful-documentation

States the discriminant and its tie to the subject, where each variant's answers come from, and why review state is excluded.
