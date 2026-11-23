# src/geometry/construction/AutoMovieSolidJoin.ts#AutoMovieSolidJoin

## @evidence contracts/development/common.md#meaningful-documentation

States parameter units, boundary order, sampled acceptance and the supplied-curve diagnostic boundary.

## @evidence contracts/development/design.md#principled-representation

Represents Compose merge or diff from an intersection, kept-side rails and analytic ribbons: companion namespace of 8 members (`IAutoMovieSolidJoin.IJoin`, `IAutoMovieSolidJoin.IColumn`, `IAutoMovieSolidJoin.IInput`, `IAutoMovieSolidJoin.IResult`, `FOLD_SHARES`, `create`, ...); units and frames named in its text: radian, radians, local, second, world. It has no optional member, so no absent-value state combines with another.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the module that declares `AutoMovieSolidJoin` in packages/engine/src/geometry/construction/AutoMovieSolidJoin.ts; its surface is the 8 members listed and the text shows 17 other files naming it, mostly packages/engine (10), test (7), so no member is declared for a presumed future need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.

# src/geometry/construction/AutoMovieSolidJoin.ts#AutoMovieSolidJoin.create

## @evidence contracts/development/implementation.md#principled-implementation

Composes the trace or supplied curve, chord rails and analytic ribbons, then performs the original sampled domain/crossing/fold checks.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation owns admission order and returned closures while trace, rail, ribbon and blend owners retain their numerical methods.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A supplied curve suppresses its trace diagnostics; multi-face crossing and unsampled fold/domain behavior remain unchecked, with no width shrink or numerical repair.

## @evidence contracts/development/common.md#meaningful-documentation

States borrowed callbacks, supplied-curve admission gap, observed failures, units and result lifetime. Failed normal comparisons retain their signed dot, operands and actual rail addresses, distinguishing zero/nonfinite dot from reversal.

## @evidence contracts/development/implementation.md#efficient-algorithms

C sampled columns include cached/missed rail solves and fixed fold shares; the single-face strict crossing scan is O(C²). The normal observer adds only failed-path norms and fixed-size diagnostic serialization, with no extra geometry reads.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Caches rails and nulls at Map-equivalent parameters; neighbouring fold columns and ribbons are deliberately rebuilt. The normal observer reuses each compared first/along/normal and original dot for its failed context.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only successful returned readers retain the local Map/input/curve/atlas; keys are unbounded and no resource handle is acquired.
