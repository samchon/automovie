# src/render/inspection/IAutoMovieInspectionSweepUnit.ts#IAutoMovieInspectionSweepUnit

## @evidence contracts/development/design.md#principled-representation

One topmost selected inspection path and the other objects intersecting its expanded world box. expandAutoMovieInspectionSweep returns alone as a singleton unit list and neighbours in source order; neighbours exclude descendants already inside the unit and may be empty.

## @evidence contracts/development/design.md#minimal-and-owned-surface

expandAutoMovieInspectionSweep exchanges unit, alone, neighbours; their canonical owner is this contract and their concrete meanings are documented on the members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One topmost selected inspection path and the other objects intersecting its expanded world box. expandAutoMovieInspectionSweep returns alone as a singleton unit list and neighbours in source order; neighbours exclude descendants already inside the unit and may be empty.

## @evidence contracts/development/common.md#meaningful-documentation

One topmost selected inspection path and the other objects intersecting its expanded world box. expandAutoMovieInspectionSweep returns alone as a singleton unit list and neighbours in source order; neighbours exclude descendants already inside the unit and may be empty. The prose and members document how expandAutoMovieInspectionSweep interprets and admits these values.
