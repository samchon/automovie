# src/animals/AutoMovieArchetypeEquineGoniometry.ts#AutoMovieArchetypeEquineGoniometry.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Defines marker order, the vertex, arbitrary consistent length units, explicit plane orientation and the source convention the caller must reproduce.

## @evidence contracts/development/design.md#principled-representation

A fixed three-point tuple rules out a missing vertex at the type boundary; the normal and coordinates require finite/nondegenerate runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The input contains only measurement data and the existing source/bone identities needed for clinical comparison.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional plane, neutral-pose offset, assumed anatomical axis or invented measurement landmark is accepted.

# src/animals/AutoMovieArchetypeEquineGoniometry.ts#AutoMovieArchetypeEquineGoniometry.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Defines canonical [0,360) degrees, right-handed first-to-second orientation, unit projected rays, nullable comparison and unknown runtime limits.

## @evidence contracts/development/design.md#principled-representation

The normalized plane and ordered projected rays make the measured orientation inspectable; the diagnostic retains the selected primary row instead of an inferred anatomical verdict.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Measurement consumers receive the angle, its geometric interpretation and the same clinical comparison used by the reference API.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A missing reference remains null, and no mean-relative position becomes an accepted pose or an immobile axis.

# src/animals/AutoMovieArchetypeEquineGoniometry.ts#AutoMovieArchetypeEquineGoniometry.measure

## @evidence contracts/development/common.md#meaningful-documentation

Documents coordinate/scale invariants, angle orientation, acquisition/perspective limitations, finite/nondegenerate refusal and independent output ownership.

## @evidence contracts/development/implementation.md#principled-implementation

Shared Vector3 normalizes the supplied normal and marker displacements. The double cross n cross (d cross n) orthogonally projects each direction; atan2(n dot (a cross b), a dot b) gives the oriented planar angle, canonicalized to [0,360) degrees before the source-specific comparison.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Validate acquired components, normalize the explicit plane, project its two vertex-relative rays, compute the angle and call AutoMovieArchetypeEquineJointLimits.compare with the selected DOI.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No anatomical landmarks or plane are guessed; no copied IK solver, absolute-value folding, tolerance-based valid pose or mean-to-limit box substitutes for the measurement.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant vector work and O(S) source selection for at most two reference cohorts, with constant geometric storage and O(S) independently copied clinical rows.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Normalization of the plane is shared by both projections and angle orientation; primary statistics and source selection have one owner in AutoMovieArchetypeEquineJointLimits.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Inputs are read only; new normalized/projected vectors and comparison records retain no caller marker objects, handles, history or global cache.
