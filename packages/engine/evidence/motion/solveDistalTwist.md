# src/motion/solveDistalTwist.ts#solveDistalTwist

## @evidence contracts/development/implementation.md#principled-implementation

Rodrigues' formula makes the clinical-zero twist condition a first-order trigonometric equation. Its at most two roots, range ends and reference are ranked by the actual rotation from prepareJointRotationProjection, the same effector owner final display uses; this finite outer law is not a global combined-joint optimizer. A continued solve keeps the start's basin (Tolani, Goswami and Badler 2000, nearest feasible to the previous solution), bounded in closed form by the peaks of the effector's twist share (its half-turn root and its turning points, both first-order sinusoid zeros), so the twist is continuous where the least miss would cross between the range's ends and no candidate across a peak is taken.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Both ordinary and withProjection entries use one private bounded search; only paired mode retains the actual winning projection. prepare delegates fixed axis/clinical-zero readers to prepareDistalTwistEffector, leaving one equation/root/ranking owner here.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every lower twist is clamped to actual ROM, and every miss is read from actual projected articulation. The existing angular TIE policy chooses nearer starts among small differences; it is not a roundoff proof or a claim that the residual is zero. The chosen twist always owns its stored score.

## @evidence contracts/development/implementation.md#efficient-algorithms

Setup is O(B) without shared clamps/projector. At most five distinct clamped twists query the projector, seven in a continued solve (the start, two ends, at most two roots and two turning twists, in practice the few inside one basin), whose peaks cost two closed-form root pairs; eligible queries score at most nineteen unique articulations and generic queries keep their bounded refinement. Paired mode additionally copies one fixed-size actual reading per query, retaining only current/selected readings, so matching immediate consumers avoid another complete query. Original TIE stopping and all candidate counts remain, with unmeasured speedup.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Matching source bases/clamps/inverses/projector and fixed effector readings share unchanged dependencies. Raw/untwisted/held readers keep first-use order; component-identical rotations share needed as K after both reads. Only clampJointToSkeleton's genuine nonretaining factory callables may memoize Object.is-identical twists, preserving signed zero. Unknown/wrapped lower callbacks retain a fresh input and actual callback on every original at invocation, so a reused mutable callback output cannot stand for an older reading. Paired projection preserves actual demand/raw articulation and angleAfterNormalize keeps both normalization/Hamilton/atan2 boundaries. No answer crosses solves.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

With a genuine lower factory, one solve retains at most ten requested-twist/clamped-joint rows; foreign callbacks allocate no memo rows. Seven candidate twists, the basin's peaks and troughs, harmonic data and current/selected paired readings remain bounded. Everything releases on return/throw except the selected caller-owned result; source preparation remains its caller's, without growing history or handles.

## @evidence contracts/development/common.md#meaningful-documentation

States the degree-valued lower/effector articulations, model/local rotation frames, bounded roots/range/start law and tie. withProjection's child documentation defines the selected lower joint plus copied actual effector joint/raw quaternion/local demand, exact-demand reuse condition and caller ownership; prepare documents lazy unchanged fixed-frame readings.
