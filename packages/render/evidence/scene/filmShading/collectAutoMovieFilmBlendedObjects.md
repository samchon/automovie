# src/scene/filmShading/collectAutoMovieFilmBlendedObjects.ts#collectAutoMovieFilmBlendedObjects

## @evidence contracts/development/common.md#meaningful-documentation

States which materials blend, why the occlusion prepass leaves their objects out, and why an object with one opaque group is kept.

## @evidence contracts/development/implementation.md#principled-implementation

An object is blended when it is drawn (a non-zero layer mask) and every material is `transparent` or blends other than normally or not at all, which is how three.js draws a blended glass and an additive flame over what lies behind them; such an object covers nothing, so the depth and normal prepass, which draws every visible object as an opaque surface, would otherwise give the surface behind it the occluder's horizon.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The occlusion stage hides these objects beside the display overlays `collectAutoMovieFilmOverlays` finds, with the same mask restore; the two rules stay separate because overlays also leave the linear light, while blended objects stay in it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No object or kind is named; the rule reads only materials and masks.

## @evidence contracts/development/implementation.md#efficient-algorithms

One traversal of the scene per occlusion draw.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Recomputed per draw because placement and inspection change the scene between draws.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a map the caller holds for one prepass.
