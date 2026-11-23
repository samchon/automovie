# src/film/resolveProductionRenderTierFrameFormat.ts#resolveProductionRenderTierFrameFormat

## @evidence contracts/development/implementation.md#principled-implementation

Keeping every Nth frame of a rational clock n/d gives n/(d*N), reduced by canonicalProductionFrameRate after the denominator product is formed in binary64; an overflowed or unsafe term is refused by that helper. Proxy raster flooring yields even dimensions with a two-pixel minimum, which can exceed a tiny scaled source. Valid source raster and crop are caller premises, and final returns an unchecked copy.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The function owns only the projection; tier admission is `normalizeRenderTier`'s and frame-rate resolution the engine's, so the planner and publication's identity check derive the same output format from one place.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No raster, rate or production is special-cased; the minimum of 2 pixels is the smallest even raster and applies only when a tiny source and scale would round to zero.

## @evidence contracts/development/common.md#meaningful-documentation

The doc states the final-tier behavior, the raster rounding and its floor, how the rate is divided and reduced, which fields are kept, and when the call throws.

## @evidence contracts/development/implementation.md#efficient-algorithms

The call does constant work: one tier check, one rate resolution and reduction by greatest common divisor, and one small record copy.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The planner and publication's identity check each call it once per plan or identity on a few-field record, so there is no costly equivalent work to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function retains nothing after returning a new format its caller owns and opens no handle or task.
