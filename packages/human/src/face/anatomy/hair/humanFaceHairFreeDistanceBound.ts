import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Certify that an unqueried point remains outside a closed contact surface.
 *
 * The signed distance to that surface is 1-Lipschitz, so a sample d at p
 * bounds a candidate q below by d - |q-p|. The caller supplies the same
 * surface's required free distance and any numerical allowance already used
 * by its contact rule; no curve or mesh is altered. A strict comparison and a
 * scale-relative floating-point margin leave boundary cases to the original
 * exact query. This bound is meaningful only for a closed, consistently
 * oriented surface and finite points in its metre frame.
 *
 * The integrator uses it for a free step, the projector for successive strand
 * stations, and the mesher for full ribbon width. They share this proof so a
 * change to the numerical guard cannot make their contact rules disagree.
 */
export function humanFaceHairFreeDistanceBound(props: {
  sampled: IAutoMovieVector3;
  distance: number;
  candidate: IAutoMovieVector3;
  required: number;
  allowance: number;
}): boolean {
  const separation = Math.hypot(
    props.candidate.x - props.sampled.x,
    props.candidate.y - props.sampled.y,
    props.candidate.z - props.sampled.z,
  );
  const roundoff =
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
  return props.distance - separation - props.allowance > props.required + roundoff;
}
