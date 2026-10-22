# Section-chain lofting

This is the current generator design for campaign #2925. The JSDoc of `packages/human/src/lofting/` holds the formulas and premises; this note keeps the overall plan and its status.

## Plan

The body surface is a set of chains, each a family of horizontal sections indexed by world height in the registered frame (forward +X, up +Y, lateral +Z, mm). Horizontal sections match the saved Recovery loft, which slices the neutral A-pose body along Y, so every observed loop belongs to one chain without reslicing.

1. **Universal lofting logic.** A section is a closed harmonic curve: a Fourier series for x(t) and z(t). Its constant terms are the section centroid, so the chain's central axis is part of the same function. A correspondence rule assigns the phase t: polar angle for limb shafts, half-arclength between the front and back sagittal crossings for the trunk and head. Between two principal layers, coefficients follow the cubic Hermite polynomial of their values and height slopes. Tessellation bisects each interval recursively and stops when the midpoint section lies within a physical chord tolerance.
2. **Body layers.** Each chain keeps only its principal layers. The observation fitter starts from a chain's two ends and bisects at the middle observation wherever the Hermite interval misses a recovered section by more than the tolerance. Principal layers therefore fall where the shape changes.
3. **Branch events.** Where loops merge, as at the crotch and the axillae, the parent ring above is split at fixed pinch phases. The children below inherit those exact vertices and reassign them phases by their own rule. Parent and children therefore share one boundary, with no seam copies.
4. **Progressive conquest.** The first stage is whole-body outer form: two legs, the trunk, two arms, and the upper body with neck and head. Fingers, toes, ears, eyes and the mouth are then added as further branch events with the same machinery. Parameter laws come last: they normalize layer heights and section sizes by the public inputs, then are refitted across f1, f2, m1 and m2.

## f1 observations used

The saved f1 loft has closed loops at every height except 1338 to 1404 mm. In that band the loops cross the source's body and head mesh boundary and are saved as open pieces. Their endpoints coincide, so the fitter joins them into closed sections; the striping in the ruled reverse render over the shoulders comes from this band. Topology events are the crotch contact at 804.9 mm, the axillary contacts at 1276.6 mm, finger and toe merges below 990 mm and 19 mm, and facial and ear branches between 1490 and 1610 mm.

## Status

The lofting core and the fitter exist. The generator assembly, viewer delivery and rendered inspection are in progress, and no visual acceptance has been made.
