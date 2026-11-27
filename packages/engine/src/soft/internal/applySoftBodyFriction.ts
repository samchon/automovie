import type { IAutoMovieApplySoftBodyFriction } from "@automovie/interface";

/*
 * Apply Coulomb friction to one particle a collider has just pushed out, in
 * place: the position-based friction of Macklin, Müller, Chentanez and Kim 2014
 * ("Unified particle physics for real-time applications", ACM TOG 33(4):153,
 * section 6.1), with one coefficient for sticking and sliding.
 *
 * The collider's push (the predicted position after contact projection less the
 * one before it) gives the contact normal and the penetration depth d. The
 * particle's travel over the step (its predicted position less its position at
 * the step's start) is split into its part along the normal and its tangential
 * part t. A tangential travel shorter than mu d is removed entirely, so the
 * particle sticks; a longer one is shortened by mu d, so it slides against a
 * force bounded by mu times the normal one. The collider is taken as still over
 * the step: a static collider is, and a moving body capsule's own travel is not
 * subtracted, so friction against a moving limb drags the cloth toward rest
 * rather than along with the limb.
 * Parameter props: The particle, the buffers, its position before projection and
 * the coefficient.
 */
export function applySoftBodyFriction(
  props: IAutoMovieApplySoftBodyFriction.IProps,
): void {
  if (props.friction === 0) return;
  const base: number = props.particle * 3;
  const push: number[] = [0, 1, 2].map(
    (axis: number): number =>
      props.predicted[base + axis] - props.before[axis]!,
  );
  const depth: number = Math.hypot(push[0]!, push[1]!, push[2]!);
  if (depth === 0) return;
  const n: number[] = push.map((v: number): number => v / depth);
  const travel: number[] = [0, 1, 2].map(
    (axis: number): number =>
      props.predicted[base + axis] - props.position[base + axis],
  );
  const along: number =
    travel[0]! * n[0]! + travel[1]! * n[1]! + travel[2]! * n[2]!;
  const tangent: number[] = travel.map(
    (v: number, axis: number): number => v - along * n[axis]!,
  );
  const slide: number = Math.hypot(tangent[0]!, tangent[1]!, tangent[2]!);
  if (slide === 0) return;
  const limit: number = props.friction * depth;
  const keep: number = slide < limit ? 1 : limit / slide;
  for (let axis: number = 0; axis < 3; ++axis)
    props.predicted[base + axis] -= keep * tangent[axis]!;
}
