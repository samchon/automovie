import { swingConeAngle } from "@automovie/engine";
import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import { assertHumanBodyPelvifemoral } from "./assertHumanBodyPelvifemoral";
import { humanBodyShoulderOrientationDistance } from "./humanBodyShoulderOrientationDistance";
import { humanBodyShoulderReaches } from "./humanBodyShoulderReaches";

const AXES = ["abduction", "twist"] as const;

/**
 * Admit the landmarks, joints and skin weights of a body basis.
 *
 * Called by `assertHumanBodyBasis` after the surfaces are known valid. The
 * joints must form one tree rooted at `hips` in parent-before-child order,
 * reference resident landmarks, carry a finite unit-length frame reference
 * that is not parallel to the bone, declare a clinical sign exactly on the
 * axes their generic constraint leaves mobile, and hold finite ranges that
 * contain zero and the measured rest angle. An upper arm additionally needs
 * an explicit thorax TT coordinate contract whose neutral elevation and
 * plane match the source landmarks, and a joint-sinus envelope of at least
 * three increasing canonical planes whose maxima are positive and in range
 * and whose region holds that rest; its old generic axes must be held. The
 * swing cone, when declared for another joint, admits each pure-plane extreme.
 * A corrective's joint driver names a mobile generic axis or a TT shoulder
 * elevation/axial axis with a ramp inside its reach. A coupling names declared
 * joints, an open output axis that no coupling drives from or drives twice,
 * and a finite, strictly increasing curve that starts at zero no lower than
 * the source's TT or generic rest elevation and keeps every rest-plus-ordinate inside that
 * axis's range. A declared pelvifemoral rhythm is admitted by
 * `assertHumanBodyPelvifemoral`.
 * Every surface's skin must bind each vertex to four declared joints with
 * weights that sum to one within a micro tolerance (the payload rounds them
 * to seven decimals). A slot the skin names but the joints do not declare is
 * refused, because it would skin to nothing.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-joints Refuses a rig whose joints, pivots, signs or ranges could not be evaluated as declared.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-joints Checks the tree, measured upper-arm TT neutrals and joint-sinus envelopes, held obsolete axes, coupling elevation source and in-range curves, and four-influence unit-sum skin.
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
    // a spread twist runs from the bone's head to its one child's head
    if (
      joint.distributeTwist !== undefined &&
      (typeof joint.distributeTwist !== "boolean" ||
        (joint.distributeTwist &&
          basis.joints.filter((one) => one.parent === joint.bone).length !== 1))
    )
      throw new Error(
        "Body joint spreads its twist only as a boolean on a bone with one child joint: " +
          joint.bone,
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
    const upperArm =
      joint.bone === "leftUpperArm" || joint.bone === "rightUpperArm";
    if (upperArm !== (joint.shoulder !== undefined))
      throw new Error(
        "Upper arms need an explicit thorax-tt shoulder contract; old fixed-axis bases cannot be reinterpreted: " +
          joint.bone,
      );
    if (joint.shoulder !== undefined) {
      const shoulder = joint.shoulder;
      const side = joint.bone === "leftUpperArm" ? 1 : -1;
      const expectedElevation =
        (Math.acos(Math.max(-1, Math.min(1, -axis[1] / length))) * 180) /
        Math.PI;
      const expectedPlane =
        (Math.atan2(axis[2], side * axis[0]) * 180) / Math.PI;
      if (
        shoulder.coordinates !== "thorax-tt" ||
        joint.constraint === null ||
        (["flexion", "abduction", "twist"] as const).some(
          (name) =>
            joint.constraint?.[name] !== null || joint.neutral[name] !== 0,
        ) ||
        (joint.constraint.swingDeg !== null &&
          joint.constraint.swingDeg !== undefined) ||
        joint.signs.abduction !== null ||
        joint.signs.twist !== null ||
        !Number.isFinite(shoulder.neutral.plane) ||
        shoulder.neutral.plane < -180 ||
        shoulder.neutral.plane >= 180 ||
        !Number.isFinite(shoulder.neutral.elevation) ||
        Math.abs(shoulder.neutral.elevation - expectedElevation) > 0.01 ||
        Math.abs(shoulder.neutral.plane - expectedPlane) > 0.01 ||
        shoulder.neutral.axialRotation !== 0 ||
        shoulder.range.elevation.min !== 0 ||
        !Number.isFinite(shoulder.range.elevation.max) ||
        shoulder.range.elevation.max > 180 ||
        shoulder.range.elevation.max < shoulder.neutral.elevation ||
        !Number.isFinite(shoulder.range.axialRotation.min) ||
        !Number.isFinite(shoulder.range.axialRotation.max) ||
        shoulder.range.axialRotation.min > 0 ||
        shoulder.range.axialRotation.max < 0 ||
        shoulder.range.axialRotation.min >= shoulder.range.axialRotation.max
      )
        throw new Error(
          "Body thorax-tt shoulders need a measured A-pose, held Euler axes, total elevation [0, <=180] and a valid axial range: " +
            joint.bone,
        );
      // The joint sinus: one maximum per plane, so at least three knots
      // around the hanging arm, planes on one canonical period, maxima
      // positive (every plane admits the hanging arm) and inside the total
      // elevation range, with the measured rest inside the region.
      const knots = shoulder.range.envelope;
      if (
        knots.length < 3 ||
        knots.some(
          ([plane, limit], k) =>
            !Number.isFinite(plane) ||
            !Number.isFinite(limit) ||
            plane < -180 ||
            plane >= 180 ||
            (k > 0 && plane <= knots[k - 1][0]) ||
            limit <= 0 ||
            limit > shoulder.range.elevation.max,
        ) ||
        !humanBodyShoulderReaches(shoulder, shoulder.neutral)
      )
        throw new Error(
          "Body thorax-tt shoulders need a joint-sinus envelope of three or more increasing canonical planes with positive in-range maxima that admits the rest: " +
            joint.bone,
        );
    }
    declared.add(joint.bone);
  }
  const parentOf = new Map(
    basis.joints.map((joint) => [joint.bone, joint.parent]),
  );
  for (const joint of basis.joints) {
    if (joint.shoulder === undefined) continue;
    let ancestor = joint.parent;
    while (ancestor !== null && ancestor !== "upperChest")
      ancestor = parentOf.get(ancestor) ?? null;
    if (ancestor !== "upperChest")
      throw new Error(
        "Thorax-relative shoulder needs upperChest as an ancestor: " +
          joint.bone,
      );
  }
  // A joint driver names a mobile axis and a ramp that lies within the
  // clinical reach on its side of the rest, so a corrective cannot be armed
  // by an angle the pose validator would refuse or by an axis that never moves.
  const joints = new Map(basis.joints.map((joint) => [joint.bone, joint]));
  for (const corrective of basis.correctives ?? [])
    for (const input of corrective.inputs) {
      if ("shoulder" in input) {
        const shoulder = joints.get(input.shoulder)?.shoulder;
        const goal = { bone: input.shoulder, ...input.orientation };
        const rest =
          shoulder === undefined
            ? null
            : { bone: input.shoulder, ...shoulder.neutral };
        if (
          shoulder === undefined ||
          goal.plane < -180 ||
          goal.plane >= 180 ||
          !humanBodyShoulderReaches(shoulder, goal) ||
          !Number.isFinite(input.innerDegrees) ||
          !Number.isFinite(input.outerDegrees) ||
          input.innerDegrees < 0 ||
          input.innerDegrees >= input.outerDegrees ||
          input.outerDegrees > 180 ||
          (rest !== null &&
            humanBodyShoulderOrientationDistance(rest, goal) <
              input.outerDegrees)
        )
          throw new Error(
            "A body shoulder corrective needs an admitted TT centre, finite nested geodesic radii and zero rest activation: " +
              corrective.id,
          );
        continue;
      }
      if (!("bone" in input)) continue;
      const joint = joints.get(input.bone);
      const range =
        input.axis === "elevation"
          ? (joint?.shoulder?.range[input.axis] ?? null)
          : (joint?.constraint?.[input.axis] ?? null);
      const neutral =
        input.axis === "elevation"
          ? (joint?.shoulder?.neutral[input.axis] ?? 0)
          : (joint?.neutral[input.axis] ?? 0);
      const reach =
        joint === undefined || range === null
          ? null
          : input.side === "positive"
            ? range.max - neutral
            : neutral - range.min;
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
  for (const corrective of basis.correctives ?? []) {
    const kernels = corrective.inputs.filter(
      (input): input is Extract<typeof input, { shoulder: string }> =>
        "shoulder" in input,
    );
    for (let first = 0; first < kernels.length; first++)
      for (let second = first + 1; second < kernels.length; second++) {
        const a = kernels[first];
        const b = kernels[second];
        if (
          a.shoulder === b.shoulder &&
          humanBodyShoulderOrientationDistance(
            { bone: a.shoulder, ...a.orientation },
            { bone: b.shoulder, ...b.orientation },
          ) === 0
        )
          throw new Error(
            "A body corrective cannot multiply equivalent shoulder orientation kernels: " +
              corrective.id,
          );
      }
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
  assertHumanBodyPelvifemoral(basis);
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
