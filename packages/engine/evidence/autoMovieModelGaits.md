# src/autoMovieModelGaits.ts#autoMovieModelGaits

## @evidence contracts/development/implementation.md#principled-implementation

A first-match scan over the profiles in declaration order, which is the precedence the model author already controls; returning the stored array keeps its order exactly.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One owner for a model's gait repertoire, shared by the viewer's gait bake and gait selection and by `validateAutoMovieFormationMotions`, so the validator and the renderer cannot disagree on which gaits exist.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No gait name, profile or model is special-cased, and no fallback gait is invented for a model that declares none.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states the first-profile rule and why, who reads it, the aliasing of the returned array and the duty not to mutate it, the empty cases, and that later profiles are ignored.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the profile count with an early return, and no copy of the gait list.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure lookup over one model that coordinates no work; it returns the model's own array, so repeated calls share it without a cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates nothing but a possible empty array and retains nothing; the returned list is owned by the model.
