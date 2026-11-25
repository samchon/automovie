# src/human/generation/IAutoMovieHumanBodyCourses.ts#IAutoMovieHumanBodyCourses.LowerThighModel

## @evidence contracts/development/common.md#meaningful-documentation

Lower thigh circumference at suprapatella on stature, body mass index and age, women and men: ANSUR II model B (`docs/sources/ansur-ii.md`, "Model B girth regressions"), R2 0.71 and 0.79, residual SD 18.9 and 14.6 mm, `a + stature S + bmi BMI + age A` with S in mm.

## @evidence contracts/development/design.md#principled-representation

Lower thigh circumference at suprapatella on stature, body mass index and age, women and men: ANSUR II model B (`docs/sources/ansur-ii.md`, "Model B girth regressions"), R2 0.71 and 0.79, residual SD 18.9 and 14.6 mm, `a + stature S + bmi BMI + age A` with S in mm. The outer tuple/array is readonly; nested element types determine whether their contents can change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanBodyCourses.LowerThighModel is the canonical exchange used by AutoMovieHumanBodyCourses.LOWER_THIGH_MODEL.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanBodyCourses.LOWER_THIGH_MODEL for lower thigh circumference at suprapatella on stature, body mass index and age, women and men: ANSUR II model B (`docs/sources/ansur-ii.md`, "Model B girth regressions"), R2 0.71 and 0.79, residual SD 18.9 and 14.6 mm, `a + stature S + bmi BMI + age A` with S in mm.
