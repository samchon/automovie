# src/schema/IAutoMovieHumanBodyAnatomySchema.ts#IAutoMovieHumanBodyAnatomySchema

## @evidence contracts/development/common.md#meaningful-documentation

The documentation distinguishes raw observations from resolved measures. It specifies landmark dimensions in millimetres, angular values in degrees and body fat as a percentage.

## @evidence contracts/development/design.md#principled-representation

Field-level typia bounds apply to supplied values. The body resolver uses sex and stature references, compatible trunk measures and relationships such as the mean of waist and hip girths for omitted high-hip girth. Whole-body compatibility belongs to preparation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The Interface owns optional raw observations and the sex category. Human attaches numeric ranges in this alias. Preparation produces resolved body measures consumed by the stock skeleton and profile.
