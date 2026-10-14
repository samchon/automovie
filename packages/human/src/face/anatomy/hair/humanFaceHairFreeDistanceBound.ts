import type { IHumanFaceHairFreeDistanceBoundProps } from "./IHumanFaceHairFreeDistanceBoundProps";

/**
 * Certify that an unqueried point remains outside a closed contact surface.
 *
 * The signed distance to that surface is 1-Lipschitz, so a sample d at p bounds a candidate q below by d - |q-p|. The caller supplies the same surface's required free distance and any numerical allowance already used by its contact rule; no curve or mesh is altered. A strict comparison and a scale-relative floating-point margin leave boundary cases to the original exact query. This bound is meaningful only for a closed, consistently oriented surface and finite points in its metre frame.
 *
 * The integrator uses it for a free step, the projector for successive strand stations, and the mesher for full ribbon width. They share this proof so a change to the numerical guard cannot make their contact rules disagree.
 *
 * @evidence contracts/common.md#principled-implementation A sampled signed-distance Lipschitz lower bound can certify a candidate against the same closed surface without querying it.
 * @evidence contracts/common.md#clear-and-simple-design The projector, free step and ribbon fit share strict boundary and scale-relative roundoff conventions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Finite points, same-snapshot distance and consistently oriented closed surface remain required; uncertain boundary cases return false for exact queries.
 * @evidence contracts/common.md#meaningful-documentation All distances are metres and allowance carries the contact owner's existing numerical margin.
 * @evidence contracts/performance.md#efficient-algorithms One Euclidean distance and fixed coordinate-scale maximum take constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work The proof owner is reused across three callers instead of independent skip-query heuristics.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No sample cache is created here; caller witness lifetime remains with its contact or fit owner.
 */
export function humanFaceHairFreeDistanceBound(
  props: IHumanFaceHairFreeDistanceBoundProps,
): boolean {
  const separation: number = Math.hypot(
    props.candidate.x - props.sampled.x,
    props.candidate.y - props.sampled.y,
    props.candidate.z - props.sampled.z,
  );
  const roundoff: number =
    64 *
    Number.EPSILON *
    Math.max(
      Math.abs(props.sampled.x),
      Math.abs(props.sampled.y),
      Math.abs(props.sampled.z),
      Math.abs(props.candidate.x),
      Math.abs(props.candidate.y),
      Math.abs(props.candidate.z),
      Math.abs(props.distance),
      separation,
      props.required,
      props.allowance,
    );
  return (
    props.distance - separation - props.allowance > props.required + roundoff
  );
}
