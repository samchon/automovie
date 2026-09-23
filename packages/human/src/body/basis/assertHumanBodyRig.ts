import { swingConeAngle } from "@automovie/engine";
import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";

const AXES = ["abduction", "twist"] as const;

/**
 * Admit the landmarks, joints and skin weights of a body basis.
 *
 * Called by `assertHumanBodyBasis` after the surfaces are known valid. The
 * joints must form one tree rooted at `hips` in parent-before-child order,
 * reference resident landmarks, carry a finite unit-length flexion reference
 * that is not parallel to the bone, declare a clinical sign exactly on the
 * axes their constraint leaves mobile (every axis for the unconstrained root),
 * and hold finite ranges that contain both zero and the measured rest angle,
 * and a swing cone, when declared, must admit every pure-plane extreme of
 * the flexion and abduction ranges.
 * A corrective's joint driver must name a mobile axis with a ramp inside the
 * clinical reach on its side of the rest. A coupling must name declared
 * joints, an open output axis that no coupling drives from or drives twice,
 * and a finite, strictly increasing curve that starts at zero no lower than
 * the source's rest elevation and keeps every rest-plus-ordinate inside that
 * axis's range.
 * Every surface's skin must bind each vertex to four declared joints with
 * weights that sum to one within a micro tolerance (the payload rounds them
 * to seven decimals). A slot the skin names but the joints do not declare is
 * refused, because it would skin to nothing.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-joints Refuses a rig whose joints, pivots, signs or ranges could not be evaluated as declared.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-joints Checks the tree order, landmark references, frame reference, sign-to-constraint agreement, the coupling table's open axes, acyclic sources and in-range curves, and the four-influence unit-sum skin.
 */
export function assertHumanBodyRig(basis: IAutoMovieHumanBodyBasis): void {
  const landmarks = new Set(basis.landmarks.ids);
  if (
    basis.landmarks.ids.length === 0 ||
    landmarks.size !== basis.landmarks.ids.length ||
    basis.landmarks.ids.some((id) => id.trim() === "") ||
    basis.landmarks.positions.length !== basis.landmarks.ids.length * 3 ||
    !basis.landmarks.positions.every(Number.isFinite)
  )
    throw new Error(
      "Body landmarks need unique names and one finite XYZ each.",
    );
  const positions = new Map(
    basis.landmarks.ids.map((id, i) => [
      id,
      basis.landmarks.positions.slice(i * 3, i * 3 + 3),
    ]),
  );
  const declared = new Set<AutoMovieHumanoidBone>();
  if (
    basis.joints.length === 0 ||
    basis.joints[0].parent !== null ||
    basis.joints[0].bone !== "hips"
  )
    throw new Error("Body joints must start with the root hips joint.");
  for (const joint of basis.joints) {
    if (declared.has(joint.bone))
      throw new Error("Body joints must be unique: " + joint.bone);
    if (
      joint.parent === null ? declared.size !== 0 : !declared.has(joint.parent)
    )
      throw new Error(
        "Body joints need one root and parents declared before children: " +
          joint.bone,
      );
    const head = positions.get(joint.head);
    const tail = positions.get(joint.tail);
    if (head === undefined || tail === undefined || joint.head === joint.tail)
      throw new Error(
        "Body joint ends must be distinct resident landmarks: " + joint.bone,
      );
    const axis = [tail[0] - head[0], tail[1] - head[1], tail[2] - head[2]];
    const length = Math.hypot(...axis);
    const reference = joint.reference;
    const norm = Math.hypot(...reference);
    if (
      length === 0 ||
      !reference.every(Number.isFinite) ||
      Math.abs(norm - 1) > 1e-6
    )
      throw new Error(
        "Body joint needs a nonzero bone and a unit flexion reference: " +
          joint.bone,
      );
    const along =
      (axis[0] * reference[0] +
        axis[1] * reference[1] +
        axis[2] * reference[2]) /
      length;
    if (
      Math.hypot(...reference.map((v, k) => v - (along * axis[k]) / length)) <
      1e-6
    )
      throw new Error(
        "Body joint flexion reference is parallel to the bone: " + joint.bone,
      );
    // An unconstrained joint (the root) is mobile on every axis and so must
    // declare every sign; a constrained joint declares one exactly where the
    // constraint leaves the axis mobile.
    for (const axisName of AXES) {
      const mobile =
        joint.constraint === null || joint.constraint[axisName] !== null;
      if (mobile !== (joint.signs[axisName] !== null))
        throw new Error(
          "Body joint signs must be declared exactly on the mobile axes: " +
            joint.bone +
            "." +
            axisName,
        );
    }
    // The rest is a pose too: its clinical angle must be finite, zero on a
    // held axis, and inside the range on a mobile one, or the empty document
    // would already be a refused pose.
    for (const axisName of ["flexion", "abduction", "twist"] as const) {
      const value = joint.neutral[axisName];
      const range =
        joint.constraint === null ? null : joint.constraint[axisName];
      if (
        !Number.isFinite(value) ||
        (joint.constraint !== null && range === null && value !== 0) ||
        (range !== null &&
          (!Number.isFinite(range.min) ||
            !Number.isFinite(range.max) ||
            range.min > 0 ||
            range.max < 0 ||
            value < range.min ||
            value > range.max))
      )
        throw new Error(
          "Body joint ranges must be finite, contain zero and contain the rest angle: " +
            joint.bone +
            "." +
            axisName,
        );
    }
    // A swing cone caps the combined flexion and abduction; each pure-plane
    // extreme of the ranges must still lie inside it, or the range promises
    // an angle the pose validator refuses on its own.
    const cone = joint.constraint?.swingDeg ?? null;
    if (cone !== null) {
      const reach = Math.max(
        ...(["flexion", "abduction"] as const).flatMap((axisName) => {
          const range = joint.constraint?.[axisName] ?? null;
          return range === null
            ? [0]
            : [
                Math.abs(range.min - joint.neutral[axisName]),
                Math.abs(range.max - joint.neutral[axisName]),
              ];
        }),
      );
      if (!Number.isFinite(cone) || cone < reach)
        throw new Error(
          "Body joint swing cone must admit every pure-plane extreme of its ranges: " +
            joint.bone,
        );
    }
    declared.add(joint.bone);
  }
  // A joint driver names a mobile axis and a ramp that lies within the
  // clinical reach on its side of the rest, so a corrective cannot be armed
  // by an angle the pose validator would refuse or by an axis that never moves.
  const joints = new Map(basis.joints.map((joint) => [joint.bone, joint]));
  for (const corrective of basis.correctives ?? [])
    for (const input of corrective.inputs) {
      if (!("bone" in input)) continue;
      const joint = joints.get(input.bone);
      const range = joint?.constraint?.[input.axis] ?? null;
      const reach =
        joint === undefined || range === null
          ? null
          : input.side === "positive"
            ? range.max - joint.neutral[input.axis]
            : joint.neutral[input.axis] - range.min;
      if (
        reach === null ||
        !Number.isFinite(input.onset) ||
        !Number.isFinite(input.full) ||
        input.onset < 0 ||
        input.full <= input.onset ||
        input.full > reach + 1e-9
      )
        throw new Error(
          "A body joint driver needs a mobile axis and a ramp inside its clinical reach: " +
            corrective.id +
            " " +
            input.bone +
            "." +
            input.axis +
            ` onset ${input.onset} full ${input.full} reach ${reach}`,
        );
    }
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
        swingConeAngle(source.neutral.flexion, source.neutral.abduction) -
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
  for (const surface of basis.surfaces) {
    const vertices = surface.positions.length / 3;
    const skin = surface.skin;
    if (
      skin.joints.length === 0 ||
      new Set(skin.joints).size !== skin.joints.length ||
      skin.joints.some((bone) => !declared.has(bone)) ||
      skin.boneIndices.length !== vertices * 4 ||
      skin.weights.length !== vertices * 4 ||
      skin.boneIndices.some(
        (index) =>
          !Number.isInteger(index) || index < 0 || index >= skin.joints.length,
      ) ||
      skin.weights.some((weight) => !Number.isFinite(weight) || weight < 0)
    )
      throw new Error(
        "Body skin needs four declared-joint influences with nonnegative weights per vertex: " +
          surface.id,
      );
    for (let v = 0; v < vertices; v++) {
      const total =
        skin.weights[4 * v] +
        skin.weights[4 * v + 1] +
        skin.weights[4 * v + 2] +
        skin.weights[4 * v + 3];
      if (Math.abs(total - 1) > 1e-5)
        throw new Error(
          "Body skin weights must sum to one per vertex: " + surface.id,
        );
    }
  }
}
