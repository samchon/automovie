# src/human/body/IAutoMovieHumanBuildTraits.ts#IAutoMovieHumanBuildTraits

## @evidence contracts/development/common.md#meaningful-documentation

Build as four independent offsets, each zero at the population mean.

## @evidence contracts/development/design.md#principled-representation `adiposity`: Body fat: positive is fatter, negative leaner. `muscularity`: Lean mass: positive is more muscular, negative less. `slimness`: Skeletal frame: positive is a narrower frame with longer limbs for the stature, negative a broader, shorter-limbed frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanBuildTraits is the canonical exchange used by IAutoMovieHumanBuildTraitsSchema, IAutoMovieHumanTraits.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `adiposity`, `muscularity`, `slimness`, `cuteness`; callers supply the complete record.
