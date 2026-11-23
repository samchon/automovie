# src/posture/HumanColliderBound.ts#HumanColliderBound

## @evidence contracts/development/implementation.md#principled-implementation

A sphere bounds itself, a capsule fits within its half length plus radius, a box within its half diagonal, and a convex hull within its existing vertex-mean radius; rigid placement preserves these containing radii.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns the unchanged kind formulas behind HumanColliders.bound while physicalHullFaces remains the hull geometry/preparation owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves the original origin creation, kind order, radius expressions and unknown-kind error; the sphere is a conservative screen, never a replacement signed-distance result.

## @evidence contracts/development/implementation.md#efficient-algorithms

Primitive kinds take constant work; hulls read existing cached centre/radius and pay their geometry owner's preparation only for a cold points array. The facade adds constant delegation with no second record.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads admitted current shape dimensions and shares only physicalHullFaces' existing unchanged-points metadata; operation-local consumers may reuse a bound only while that shape stays unchanged.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one fresh ball record with a fresh primitive origin or borrowed immutable hull centre; this owner retains no shape, query, result history or new cache, and existing hull retention stays with its engine owner.

## @evidence contracts/development/common.md#meaningful-documentation

Defines every containing formula, local frame/metre units, admitted-geometry premise, conservative use, failure and fresh-versus-borrowed ownership.
