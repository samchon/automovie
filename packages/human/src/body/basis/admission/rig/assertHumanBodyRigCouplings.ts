import { swingConeAngle } from "@automovie/engine";
import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../../../structures/IAutoMovieHumanBodyBasis";

/**
 * Admit declared one-way clinical joint couplings in basis order.
 *
 * Each curve starts at zero from the source rest elevation, adds only
 * to one mobile output axis, and keeps the resulting clinical angle in
 * range. Chained drivers, cycles and double writes of one output axis
 * are refused. Seth et al. 2016 (doi:10.1371/journal.pone.0141028) model
 * scapulothoracic elevation, abduction, upward rotation and winging as four
 * degrees of freedom; this legacy public-girdle coupling has no such joint.
 * The nanodegree allowance below addresses the numerical
 * error of `2 acos(cos θ)` when reading the same rest cone, not a
 * morphology tolerance. A public shoulder coupling still cannot
 * create the absent scapulothoracic degrees of freedom or skin binding.
 */
export function assertHumanBodyRigCouplings(
  basis: IAutoMovieHumanBodyBasis,
  joints: ReadonlyMap<
    AutoMovieHumanoidBone,
    IAutoMovieHumanBodyBasis["joints"][number]
  >,
): void {
  // A coupling is a declared driver, so everything it names must resolve and
  // everything it can add must already be admissible: declared source and
  // output joints, an open output axis (the unconstrained root has none), at
  // least two finite knots strictly increasing in elevation, the first at or
  // above the source's rest elevation (the swing cone of its rest angles) with
  // a zero ordinate so the rest and every pose below it add nothing, and every
  // rest-plus-ordinate inside the axis's range, so a coupling alone never
  // produces an angle the pose validator refuses. The rest elevation is read
  // through the same cone formula the evaluation uses, whose pure-plane
  // result carries float error (`2 acos(cos 10)` is not exactly 20), so a
  // first knot authored at the rest angle is admitted within a nanodegree
  // and the evaluation treats that nanodegree as below the knot. An output joint
  // that is any coupling's source (its own included) would chain, and a
  // second coupling into one axis would add twice, so both are refused.
  const sources = new Set(
    (basis.couplings ?? []).map((coupling) => coupling.source.bone),
  );
  const outputs = new Set<string>();
  const couplingIds = new Set<string>();
  for (const coupling of basis.couplings ?? []) {
    const source = joints.get(coupling.source.bone);
    const output = joints.get(coupling.output.bone);
    const range = output?.constraint?.[coupling.output.axis] ?? null;
    const key = coupling.output.bone + "." + coupling.output.axis;
    const curve = coupling.curve;
    if (
      coupling.id.trim() === "" ||
      couplingIds.has(coupling.id) ||
      source === undefined ||
      output === undefined ||
      range === null ||
      sources.has(coupling.output.bone) ||
      outputs.has(key) ||
      curve.length < 2 ||
      curve[0][0] <
        (source.shoulder?.neutral.elevation ??
          swingConeAngle(source.neutral.flexion, source.neutral.abduction)) -
          1e-9 ||
      curve[0][1] !== 0 ||
      curve.some(
        ([elevation, degrees], i) =>
          !Number.isFinite(elevation) ||
          !Number.isFinite(degrees) ||
          (i > 0 && elevation <= curve[i - 1][0]) ||
          output.neutral[coupling.output.axis] + degrees < range.min ||
          output.neutral[coupling.output.axis] + degrees > range.max,
      )
    )
      throw new Error(
        "A body coupling needs a unique id, declared joints, an open output axis no coupling drives from or twice, and an increasing curve starting at zero from the source's rest elevation inside the axis's range: " +
          coupling.id +
          " " +
          coupling.source.bone +
          " -> " +
          key,
      );
    couplingIds.add(coupling.id);
    outputs.add(key);
  }
}
