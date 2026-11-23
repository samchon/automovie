# src/core/ArchetypeTrackProfile.ts#ArchetypeTrackProfile

## @evidence contracts/development/common.md#meaningful-documentation

States the scalar profile, endpoint clock representation and supported numeric domain.

## @evidence contracts/development/implementation.md#principled-implementation

Q(u)=u cubed P(u), P=10-15u+6u squared, and Q(1-u)=1-Q(u). Playback multiplies span,r,r,rP before exposing a rounded profile, then adds from the nearer endpoint. A crossing tests endpoint membership first and solves log Q(r)=log(distance)-log(abs(span)) using the native 4<=P(r)<=10 bounds for r<=1/2. Its derivative is distance*30(1-r)^2/(T*rP), the same law after cancelling Q(r), with the shared exact exceptional quotient.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit span, then return the endpoint value and crossing operations over fixed scalars.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No clamping, epsilon, altered curve or invented physical data hides an out-of-range request. Logarithms locate the same native root; existing 60 bisections now resolve its scale instead of stopping at 2^-60 on a unit interval.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant scalar playback, with exceptional bounded scalar arithmetic only when needed; a crossing uses at most 60 constant-work iterations. No model pose or previous sample is retained.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One compiled span/duration serves both endpoints, the inverse and its derivative through shared arithmetic owners.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only source scalars and pure closures escape; no model, mutable props, sample history or external resource is retained.
