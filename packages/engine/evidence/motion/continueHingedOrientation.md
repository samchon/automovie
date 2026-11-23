# src/motion/continueHingedOrientation.ts#continueHingedOrientation

## @evidence contracts/development/implementation.md#principled-implementation

Eberly's bilinear two-axis quaternion surface intersects the known harmonic swivel family through a scalar sinusoid. Quaternion conjugation is linear, so fixed inverse parent/lower/rest products give its two exact algebraic coefficients up to irrelevant common scale. Existing clamping/orientation and actual prepared FK verify every proposed answer; no sampled global objective certificate is assumed.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

hingedArmSwivel owns branch/harmonic geometry; readHingeRange owns clinical range mapping; the projector owns two-axis coefficients and the shared math helper owns rank-one roots. This dispatcher owns only explicit curve candidate selection and actual feasibility, then the caller owns phase continuity/fallback.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No body, seed name, law, fixture, iteration cap, target substitute or enlarged physical tolerance selects a result. Current point uses the original PLANT_RESIDUAL_EPSILON and rotation/ROM use their existing degree tolerance. Unsupported objectives and uncertain roots decline rather than silently change their semantics; no global cold-score equivalence is claimed.

## @evidence contracts/development/implementation.md#efficient-algorithms

One selected hinge branch and at most two actual roots replace repeated near probes and nested effector projections on eligible curves. Each candidate retains actual orientation plus an O(J) source-prefix/frame scan; no repeated full swivel sweep occurs here. End-to-end speedup remains unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only the matching source rig, range, geometry, coefficient basis and fixed inverse are borrowed. The current harmonic family also supplies its original poser from the same completed branch aim. Every current point/rotation, post-clamp FK, changed joint and pole is checked anew. Previous poses are not returned or interpolated; near carries only the deterministic curve candidate.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One call owns a harmonic family, two transformed coefficients and at most two temporary oriented poses/frames. A qualified unique local-root return weakly owns O(J) original own-data output-slot guards and five scalar facts; no result is retained merely by the registry. Other candidates release on return/throw and no target history, result cache, handle or task is created.

## @evidence contracts/development/common.md#meaningful-documentation

States explicit policy eligibility, half-angle frames, proposal versus actual acceptance, degree/model-metre units, ambiguity and unsupported fallback.
