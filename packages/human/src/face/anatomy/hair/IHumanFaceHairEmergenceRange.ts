/**
 * The exit elevations, in degrees above the scalp's tangent plane, that the cited placement guide allows at one root.
 *
 * For the legacy scalp mode, `lowest` is the lower-end placement convention blended from frontal hairline to mid scalp by coverage; `highest` blends the corresponding upper ends. The integrator first tries the lower end and rises only after a typed numerical stem refusal. That refusal does not prove every geometric alternative infeasible. An explicit authored emergence angle bypasses this interval.
 *
 * @evidence contracts/common.md#principled-implementation Lower and upper elevations remain distinct bounds in degrees above the tangent plane; the selected convention is not a measured individual follicle.
 * @evidence contracts/common.md#clear-and-simple-design A two-bound interval exposes the emergence owner's admitted search range without duplicating its coverage blend or trial selection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The lower-end convention and conditional rise are explicit policy; this schema adds no root-specific exception beyond that interval.
 * @evidence contracts/common.md#meaningful-documentation The prose states degree units, tangent-plane reference, legacy coverage blending, authored-angle bypass and the limited meaning of numerical stem refusal.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This range type selects neither coverage evaluation nor elevation search; those operations belong to emergence and integration owners.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Interval bounds are output quantities, not a cache of successful roots or interchangeable trial results.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Two elevation scalars carry no sampled surface, running walk or separately released resource.
 *
 * @author Samchon
 */
export interface IHumanFaceHairEmergenceRange {
  /** Lower end of the cited range at this root: the emergence convention. */
  lowest: number;

  /** Upper end emitted by the legacy scalp placement-convention owner at this root, in degrees. */
  highest: number;
}
