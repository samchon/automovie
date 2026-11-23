# src/cinematics/IAutoMovieCameraClearanceRuntime.ts#IAutoMovieCameraClearanceRuntime

## @evidence contracts/development/design.md#principled-representation

Staleness is decided by exact string equality of two opaque revision tokens supplied by the owner of the geometry, and the fixed clock is a positive sample rate, so the engine never infers freshness from object identity or wall time.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three fields, the revision the models were built from, the revision current at the gate, and the inspection clock, which is everything the clearance gate cannot know from the shot itself; the builder fills it once per shot.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A missing record, a bad rate or a revision mismatch is a violation rather than a default clock or a silent pass, and the engine does not interpret the revision strings beyond comparing them.

## @evidence contracts/development/common.md#meaningful-documentation

States the reader and when it reads the record, each refusal, how the sample rate is used, that the fields are copied into the reports, and for each member its meaning and unit.
