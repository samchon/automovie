import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../../../structures/IAutoMovieHumanBodyBasis";
import { humanBodyShoulderReaches } from "../../humanBodyShoulderReaches";

const AXES: readonly ("abduction" | "twist")[] = ["abduction", "twist"];

/**
 * Admit the landmark-defined public rig as one rooted joint tree.
 *
 * Shaped head/tail points are metres in the common right-handed Y-up, Z-forward frame. Clinical angles are degrees. Each parent precedes its child, a flexion line uses resident landmarks, and neutral angles live inside declared mobile ranges. The upper-arm tilt-and-torsion goal follows Chénier et al. 2022 (doi:10.1016/j.clinbiomech.2022.105573), which separates humerothoracic elevation plane, elevation and axial rotation while retaining singular plane coordinates at 0 and 180 degrees. It is tested against the measured A-pose and plane-dependent reach after the generic Euler axes are held. The public VRM shoulder slot does not provide an independent scapular bone or scapulothoracic joint; that anatomical limitation is not fixed by admitting a TT angle. The returned bone set is what skin attachment may name. Derived bone and flexion-line lengths must remain finite: finite source landmarks alone cannot prevent subtraction or norm overflow.
 *
 * @evidence contracts/common.md#principled-implementation A parent-first single-root tree with finite landmark-derived frames, resident flexion axes and admitted neutral/range/TT contracts establishes the source public rig before skin bindings.
 * @evidence contracts/common.md#clear-and-simple-design Joint admission owns frame/range/hierarchy premises and returns declared bones; separate source anatomical graphs retain independent articulation ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Derived non-finite lengths are rejected before angle tests can hide NaN comparisons; admitted public TT coordinates do not create an independent scapular bone or joint.
 * @evidence contracts/common.md#meaningful-documentation The prose gives meter/degree frames, parent order, TT singularity limits, returned skin-binding population and derived overflow refusal.
 * @evidence contracts/performance.md#efficient-algorithms Landmark maps and joint checks scan L points and J joints, with O(J²) worst-case child-count/ancestor traversals plus all shoulder-envelope knots; maps retain O(L+J) entries.
 * @evidence contracts/performance.md#reuse-equivalent-work Landmark positions and parent maps serve repeated frame/ancestry checks without reconstructing source coordinates; input admission is not cached across bases.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Position/parent maps and frame arrays are local; only J declared bone names escape, without modifying source landmarks or retaining evaluation tasks.
 */
export function assertHumanBodyRigJoints(
  basis: IAutoMovieHumanBodyBasis,
): Set<AutoMovieHumanoidBone> {
  const landmarks: Set<string> = new Set(basis.landmarks.ids);
  if (
    basis.landmarks.ids.length === 0 ||
    landmarks.size !== basis.landmarks.ids.length ||
    basis.landmarks.ids.some((id: string): boolean => id.trim() === "") ||
    basis.landmarks.positions.length !== basis.landmarks.ids.length * 3 ||
    !basis.landmarks.positions.every(Number.isFinite)
  )
    throw new Error(
      "Body landmarks need unique names and one finite XYZ each.",
    );
  const positions: Map<string, number[]> = new Map(
    basis.landmarks.ids.map((id: string, i: number): [string, number[]] => [
      id,
      basis.landmarks.positions.slice(i * 3, i * 3 + 3),
    ]),
  );
  const declared: Set<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>();
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
    const head: number[] | undefined = positions.get(joint.head);
    const tail: number[] | undefined = positions.get(joint.tail);
    if (head === undefined || tail === undefined || joint.head === joint.tail)
      throw new Error(
        "Body joint ends must be distinct resident landmarks: " + joint.bone,
      );
    // a spread twist runs from the bone's head to its one child's head
    if (
      joint.distributeTwist !== undefined &&
      (typeof joint.distributeTwist !== "boolean" ||
        (joint.distributeTwist &&
          basis.joints.filter((one: IAutoMovieHumanBodyBasis["joints"][number]): boolean => one.parent === joint.bone).length !== 1))
    )
      throw new Error(
        "Body joint spreads its twist only as a boolean on a bone with one child joint: " +
          joint.bone,
      );
    const axis: number[] = [tail[0] - head[0], tail[1] - head[1], tail[2] - head[2]];
    const length: number = Math.hypot(...axis);
    const reference: IAutoMovieHumanBodyBasis["joints"][number]["reference"] = joint.reference;
    const norm: number = Math.hypot(...reference);
    if (
      !Number.isFinite(length) || length === 0 ||
      !reference.every(Number.isFinite) ||
      Math.abs(norm - 1) > 1e-6
    )
      throw new Error(
        "Body joint needs a nonzero bone and a unit flexion reference: " +
          joint.bone,
      );
    const along: number =
      (axis[0] * reference[0] +
        axis[1] * reference[1] +
        axis[2] * reference[2]) /
      length;
    if (
      !Number.isFinite(along) ||
      Math.hypot(...reference.map((v: number, k: number): number => v - (along * axis[k]) / length)) <
      1e-6
    )
      throw new Error(
        "Body joint flexion reference is parallel to the bone: " + joint.bone,
      );
    // a declared flexion axis runs between two resident landmarks and lies
    // within 60 degrees of the frame's X, so the orthonormal basis built on
    // it never degenerates
    if (joint.flexionAxis !== undefined) {
      const from: number[] | undefined = positions.get(joint.flexionAxis[0]);
      const to: number[] | undefined = positions.get(joint.flexionAxis[1]);
      const line: number[] | null =
        from === undefined || to === undefined
          ? null
          : [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
      const size: number = line === null ? 0 : Math.hypot(...line);
      const y: number[] = axis.map((v: number): number => v / length);
      const f: number[] = reference.map((v: number, k: number): number => v - along * y[k]);
      const x: number[] = [
        y[1] * f[2] - y[2] * f[1],
        y[2] * f[0] - y[0] * f[2],
        y[0] * f[1] - y[1] * f[0],
      ];
      const alignment: number = line === null
        ? NaN
        : Math.abs(line[0] * x[0] + line[1] * x[1] + line[2] * x[2]) /
          (size * Math.hypot(...x));
      if (
        line === null ||
        !Number.isFinite(size) || size === 0 ||
        !Number.isFinite(alignment) || alignment < 0.5
      )
        throw new Error(
          "Body joint flexion axis must run between two distinct resident landmarks within 60 degrees of its frame's X: " +
            joint.bone,
        );
    }
    // An unconstrained joint (the root) is mobile on every axis and so must
    // declare every sign; a constrained joint declares one exactly where the
    // constraint leaves the axis mobile.
    for (const axisName of AXES) {
      const mobile: boolean =
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
      const value: number = joint.neutral[axisName];
      const range: { min: number; max: number } | null =
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
    const cone: number | null = joint.constraint?.swingDeg ?? null;
    if (cone !== null) {
      const reach: number = Math.max(
        ...(["flexion", "abduction"] as const).flatMap((axisName: "flexion" | "abduction"): number[] => {
          const range: { min: number; max: number } | null = joint.constraint?.[axisName] ?? null;
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
    const upperArm: boolean =
      joint.bone === "leftUpperArm" || joint.bone === "rightUpperArm";
    if (upperArm !== (joint.shoulder !== undefined))
      throw new Error(
        "Upper arms need an explicit thorax-tt shoulder contract; old fixed-axis bases cannot be reinterpreted: " +
          joint.bone,
      );
    if (joint.shoulder !== undefined) {
      const shoulder: NonNullable<IAutoMovieHumanBodyBasis["joints"][number]["shoulder"]> = joint.shoulder;
      const side: number = joint.bone === "leftUpperArm" ? 1 : -1;
      const expectedElevation: number =
        (Math.acos(Math.max(-1, Math.min(1, -axis[1] / length))) * 180) /
        Math.PI;
      const expectedPlane: number =
        (Math.atan2(axis[2], side * axis[0]) * 180) / Math.PI;
      if (
        shoulder.coordinates !== "thorax-tt" ||
        joint.constraint === null ||
        (["flexion", "abduction", "twist"] as const).some(
          (name: "flexion" | "abduction" | "twist"): boolean =>
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
      const knots: typeof shoulder.range.envelope = shoulder.range.envelope;
      if (
        knots.length < 3 ||
        knots.some(
          ([plane, limit]: readonly [number, number], k: number): boolean =>
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
  const parentOf: Map<AutoMovieHumanoidBone, AutoMovieHumanoidBone | null> = new Map(
    basis.joints.map((joint: IAutoMovieHumanBodyBasis["joints"][number]): [AutoMovieHumanoidBone, AutoMovieHumanoidBone | null] => [joint.bone, joint.parent]),
  );
  for (const joint of basis.joints) {
    if (joint.shoulder === undefined) continue;
    let ancestor: AutoMovieHumanoidBone | null = joint.parent;
    while (ancestor !== null && ancestor !== "upperChest")
      ancestor = parentOf.get(ancestor) ?? null;
    if (ancestor !== "upperChest")
      throw new Error(
        "Thorax-relative shoulder needs upperChest as an ancestor: " +
          joint.bone,
      );
  }
  return declared;
}
