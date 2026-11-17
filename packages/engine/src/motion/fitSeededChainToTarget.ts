import type { IAutoMovieSeededChainFit } from "./IAutoMovieSeededChainFit";
import type { IFitChainToTargetProps } from "./IFitChainToTargetProps";
import { fitChainBend } from "./fitChainBend";
import { orientChainEffector } from "./orientChainEffector";

/**
 * Fit a reachable two-bone chain to a model-frame target under the rig's effective ROM, retaining authored non-chain joints. A deterministic finite bend-plane search scores clamped FK and keeps the original pose unless its 1e-7-metre residual bucket improves or equal-bucket continuity improves toward an explicit prior pose; it is a bounded search, not a global-optimum guarantee.
 *
 * For a hinged mid joint (an elbow or a knee, whose abduction is immobile) the swivel parameterisation of Tolani, Goswami and Badler (2000) comes first and wins whenever it reaches: the hinge angle follows from the span and the swivel about the root-to-target axis is swept for the least range-of-motion overshoot and then the least continuous cost of effector-rotation error, swing from the hint's side and turn from the `referencePose` (`fitHingedChainCandidate`), because a free-swing candidate turns the hinge about the plane normal and the clamp of its abduction moves the effector. Otherwise, and for other chains, the bend hint's plane and then the 32-plane sweep follow, the first exact one winning. When nothing reaches, the least clamped residual is returned, so an unreachable target leaves the effector on the reachable shell, not a pretended reach.
 *
 * A hinged chain's answer comes with its seed, the branch and swivel its candidate was chosen at, which a fit of a nearby target continues from (`near`, `IAutoMovieSwivelNear`): that fit refines the seed alone instead of sweeping. The seed is null when another candidate is the answer.
 *
 * With `effectorRotation`, a mid bone that declares a distal twist (a forearm) first takes the twist share of the requested rotation about its own length (swing-twist decomposition), clamped to its range, and the effector the remaining swing, so pronation and supination are the forearm's and the wrist keeps its place.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Prepares actual chain frames, solves analytic two-bone candidates, clamps upper/lower joints to rig ROM and measures their actual effector; residual buckets rank first, then squared sign-insensitive quaternion geodesic distance to the prior pose and finally exact residual.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The bend search (`fitChainBend`) and the effector's orientation (`orientChainEffector`), composed here, while preparation, analytic candidate solve and fast candidate FK have single owners; this split exposes the geometry shared by all bend candidates.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Missing/invalid/degenerate preparation and analytic solve preserve the original pose; no ideal target measurement replaces post-clamp FK. A 32-angle sweep and ten local halvings bound the heuristic, with 1e-12 continuity and 1e-6 normal-degeneracy thresholds.
 * @evidence contracts/development/common.md#meaningful-documentation States model-metre target, unchanged joints, residual-bucket ranking, prior-pose tie meaning and the bounded-search limitation without claiming every unreachable pin can be solved.
 * @evidence contracts/development/implementation.md#efficient-algorithms Preparation and authored/reference FK scale with rig/joints; at most34 initial candidates plus at most32minima times20 refinement candidates use constant-size fast FK, though candidate pose copies scale with authored joints. Early exact-bucket/continuity satisfaction stops the search. A hinged chain adds up to two swivel sweeps of 720 decomposed candidates (360 one-degree swivels per bend branch), each with constant-size quaternion work and, with an effector rotation, two more decompositions; they run only when the hint plane misses or a rotation is requested.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work All bend candidates share prepared frames/domains and reference-angle maps; only candidate joints and scores vary, while per-frame parent pose changes force new preparation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Sweep/minima arrays are bounded by32 entries and all temporary poses/maps are released after completion; the caller owns the selected pose, which may be the original, and no handles or background tasks exist.
 */
export const fitSeededChainToTarget: (
  props: IFitChainToTargetProps,
) => IAutoMovieSeededChainFit = (
  input: IFitChainToTargetProps,
): IAutoMovieSeededChainFit => {
  const bend: IAutoMovieSeededChainFit = fitChainBend(input);
  return {
    pose: orientChainEffector(input, bend.pose),
    seed: bend.seed,
    ...(bend.value === undefined ? {} : { value: bend.value }),
  };
};
