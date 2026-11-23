# src/animals/AutoMovieArchetypeEquineFall.ts#AutoMovieArchetypeEquineFall

## @evidence contracts/development/common.md#meaningful-documentation

States the deceleration, the blend, the floor support, the lateral rest that follows and the refusals.

## @evidence contracts/development/design.md#principled-representation

A ride in and a ride out on the same clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One entry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No tripping device and no simulation: the slide is a closed-form deceleration and the rest is the shared one.

# src/animals/AutoMovieArchetypeEquineFall.ts#AutoMovieArchetypeEquineFall.after

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the output and every refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Admit the cue, build the lateral rest at the stop, then per sample play the ride, the blended drop with the slide, or the rest from its lying pose.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admission, one clip, a three-phase sampler.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refusals are typed; the floor support raises the body by its lowest part only.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(P + A) per sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the shared lateral rest and floor reader.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the ride and the clip.
