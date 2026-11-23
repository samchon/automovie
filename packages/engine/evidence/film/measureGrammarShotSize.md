# src/film/measureGrammarShotSize.ts#measureGrammarShotSize

## @evidence contracts/development/implementation.md#principled-implementation

Projects the subject's base and top through `projectToNdc`, the pinhole projection the review and keypoint passes share, so the vertical fill is half the NDC span; the horizontal fill is the radius over `depth · tan(fovY/2) · aspect`, the half-width of the view at the base's depth; both axes are read because `compileCameraMove` places the camera by whichever of height and width binds, so the vertical fill alone would report a wide subject one or two sizes looser than delivered.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One measurement shared by the shot-size check, the jump-cut size comparison and both re-establishing checks of `readFilmGrammar`, so they cannot disagree about a shot's size; classification stays with `classifyGrammarShotSize`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No subject, lens or framing is special-cased; a subject behind the lens or filling nothing answers null instead of a guessed size.

## @evidence contracts/development/common.md#meaningful-documentation

States every null case, how occupancy is formed from the two axes, and which function classifies it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time: one map lookup, two projections and one classification over the fixed framing table.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one shot boundary; `readFilmGrammar` memoizes its answer per shot and boundary, which is answered there.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates only the two projected points and the raised top vector, all released on return.
