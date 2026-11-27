import {
  AutoMovieEngineKinematics,
} from "@automovie/engine";
import {
  IAutoMovieAngleRange,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  type IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieSkeleton,
  type IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeRng } from "../../internal/makeRng";
import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";
import { uniform } from "../../internal/uniform";
import { vclose } from "../../internal/vclose";

const REST: IAutoMovieTransform = {
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};
const bone: (
  name: IAutoMovieBone["bone"],
  constraint: IAutoMovieJointConstraint | null,
) => IAutoMovieBone = (
  name: IAutoMovieBone["bone"],
  constraint: IAutoMovieJointConstraint | null,
): IAutoMovieBone => ({ bone: name, parent: null, rest: REST, constraint });

// leftLowerArm carries an explicit override; leftHand falls back to the
// default table; hips has no constraint anywhere (pass-through).
const SKELETON: IAutoMovieSkeleton = {
  id: "s",
  bones: [
    bone("leftLowerArm", {
      flexion: { min: 0, max: 90 },
      abduction: null,
      twist: null,
    }),
    bone("leftHand", null),
    bone("leftUpperArm", null),
    bone("hips", null),
  ],
};

/**
 * Clamp joint angles into intervals, force immobile axes to zero and preserve
 * unconstrained values. These engine interval examples do not prove skeleton
 * membership, arbitrary cone projection or clinical suitability of the default
 * table.
 *
 * Scenarios:
 *
 * 1. Per-bone override: leftLowerArm flexion 120 → 90 (above max), its `null`
 *    abduction 30 → 0 (immobile axis), its `null`-angle twist stays `null`.
 * 2. Default-table fallback: leftHand flexion -200 goes to -80 (below min), and
 *    its in-range abduction 10 is left untouched. (The shoulder's default is
 *    gated by swing and twist, where -200 of flexion is the in-range 160, so a
 *    three-angle joint shows the fallback.)
 * 3. Bone not in the skeleton resolves to the default table (rightLowerArm flexion
 *    200 → 150).
 * 4. A bone with no constraint anywhere (hips) passes through unchanged, and the
 *    root transform is preserved.
 * 5. Property: for 200 seeded poses of angles in [-200, 200) on the override,
 *    table and unconstrained bones, clamping twice equals clamping once, and
 *    the first clamp changes each pose.
 * 6. Duplicate bone declarations use the first constraint: three leftLowerArm
 *    records against [-10, 20] with abduction immobile become (20, 0, null),
 *    (-10, 0, 0) and (4, null, null) in input order; the unconstrained record
 *    and the root keep their references, the input keeps its angles and the
 *    result is a new pose with a new joint list.
 * 7. A prepared pose clamp of the fixed rig answers A, then a reordered B with a
 *    null root, then A again, each independently of the earlier answers.
 * 8. Plain bounds mutated on the same rig are read by the next call: [-10, 20]
 *    becomes [-4, 7] and 35, -40 become 7, -4.
 * 9. Malformed axes on a constrained joint fail in input order (the spine first
 *    names flexion, the chest first names abduction) and on an unconstrained
 *    joint are not admitted; an empty pose keeps its root reference and a null
 *    root stays null.
 */
export function test_engine_rom_clamp_pose(): void {
  duplicates();
  boundsRead();
  axesOrder();
  const pose: IAutoMoviePose = {
    skeleton: "s",
    root: REST,
    joints: [
      { bone: "leftLowerArm", flexion: 120, abduction: 30, twist: null },
      { bone: "leftHand", flexion: -200, abduction: 10, twist: null },
      { bone: "rightLowerArm", flexion: 200, abduction: null, twist: null },
      { bone: "hips", flexion: 999, abduction: null, twist: null },
    ],
  };
  const out: IAutoMoviePose = AutoMovieEngineKinematics.clampPose(pose, SKELETON);
  const byBone: (b: string) => IAutoMovieJointPose = (
    b: string,
  ): IAutoMovieJointPose =>
    out.joints.find((j: IAutoMovieJointPose): boolean => j.bone === b)!;

  // 1. override
  TestValidator.predicate(
    "flexion clamped to override max",
    nclose(byBone("leftLowerArm").flexion!, 90, 0),
  );
  TestValidator.predicate(
    "immobile abduction → 0",
    nclose(byBone("leftLowerArm").abduction!, 0, 0),
  );
  TestValidator.equals(
    "null twist stays null",
    byBone("leftLowerArm").twist,
    null,
  );

  // 2. default-table fallback
  TestValidator.predicate(
    "flexion clamped to table min",
    nclose(byBone("leftHand").flexion!, -80, 0),
  );
  TestValidator.predicate(
    "in-range abduction untouched",
    nclose(byBone("leftHand").abduction!, 10, 0),
  );

  // 3. bone absent from the skeleton → default table
  TestValidator.predicate(
    "absent bone uses table",
    nclose(byBone("rightLowerArm").flexion!, 150, 0),
  );

  // 4. unconstrained bone passes through; root preserved
  TestValidator.predicate(
    "unconstrained passes through",
    nclose(byBone("hips").flexion!, 999, 0),
  );
  TestValidator.predicate(
    "root preserved",
    out.root !== null &&
      vclose(out.root.translation, REST.translation, 0) &&
      vclose(out.root.scale, REST.scale, 0) &&
      nclose(out.root.rotation.x, REST.rotation.x, 0) &&
      nclose(out.root.rotation.y, REST.rotation.y, 0) &&
      nclose(out.root.rotation.z, REST.rotation.z, 0) &&
      nclose(out.root.rotation.w, REST.rotation.w, 0),
  );
  const rng: () => number = makeRng(0x7c3f0055);
  const bones: IAutoMovieJointPose["bone"][] = [
    "leftLowerArm",
    "leftHand",
    "leftUpperArm",
    "hips",
  ];
  let fixed: boolean = true;
  let changed: boolean = true;
  for (let index: number = 0; index < 200; ++index) {
    const wild: IAutoMoviePose = {
      skeleton: "s",
      root: REST,
      joints: bones.map(
        (name: IAutoMovieJointPose["bone"]): IAutoMovieJointPose => ({
          bone: name,
          flexion: uniform(rng, -200, 200),
          abduction: uniform(rng, -200, 200),
          twist: uniform(rng, -200, 200),
        }),
      ),
    };
    const once: IAutoMoviePose = AutoMovieEngineKinematics.clampPose(wild, SKELETON);
    fixed &&=
      JSON.stringify(AutoMovieEngineKinematics.clampPose(once, SKELETON)) === JSON.stringify(once);
    changed &&= JSON.stringify(once.joints) !== JSON.stringify(wild.joints);
  }
  TestValidator.predicate("clamping is idempotent", fixed);
  TestValidator.predicate("and the first clamp acts", changed);
}

/** The angles of a joint, in the order flexion, abduction, twist. */
const angles: (joint: IAutoMovieJointPose) => (number | null)[] = (
  joint: IAutoMovieJointPose,
): (number | null)[] => [joint.flexion, joint.abduction, joint.twist];

/** A pose of the rig "current-rig" with the given root and joints. */
const pose: (
  joints: IAutoMovieJointPose[],
  root?: IAutoMovieTransform | null,
) => IAutoMoviePose = (
  joints: IAutoMovieJointPose[],
  root: IAutoMovieTransform | null = REST,
): IAutoMoviePose => ({ skeleton: "current-rig", root, joints });

/**
 * Scenarios 6 and 7: the first duplicate wins and the prepared clamp is
 * stateless.
 */
function duplicates(): void {
  const first: IAutoMovieJointConstraint = {
    flexion: { min: -10, max: 20 },
    abduction: null,
    twist: null,
  };
  const later: IAutoMovieJointConstraint = {
    flexion: { min: -40, max: 50 },
    abduction: null,
    twist: null,
  };
  const skeleton: IAutoMovieSkeleton = {
    id: "current-rig",
    bones: [bone("leftLowerArm", first), bone("leftLowerArm", later)],
  };
  const untouched: IAutoMovieJointPose = {
    bone: "hips",
    flexion: 999,
    abduction: 7,
    twist: null,
  };
  const input: IAutoMoviePose = pose([
    { bone: "leftLowerArm", flexion: 35, abduction: 31, twist: null },
    untouched,
    { bone: "leftLowerArm", flexion: -40, abduction: -3, twist: 10 },
    { bone: "leftLowerArm", flexion: 4, abduction: null, twist: null },
  ]);
  const out: IAutoMoviePose = AutoMovieEngineKinematics.clampPose(input, skeleton);
  TestValidator.equals(
    "the first constraint, record by record",
    [0, 2, 3].map((index: number): (number | null)[] =>
      angles(out.joints[index]!),
    ),
    [
      [20, 0, null],
      [-10, 0, 0],
      [4, null, null],
    ],
  );
  TestValidator.predicate(
    "references, root and input",
    out !== input &&
      out.joints !== input.joints &&
      out.root === input.root &&
      out.joints[1] === untouched &&
      input.joints[0]!.flexion === 35,
  );
  const prepared: (value: IAutoMoviePose) => IAutoMoviePose =
    AutoMovieEngineKinematics.prepareClampPose(skeleton);
  const a: IAutoMoviePose = prepared(input);
  input.joints[0]!.flexion = -12;
  input.joints[2]!.flexion = 35;
  const b: IAutoMoviePose = prepared({
    ...input,
    root: null,
    joints: [input.joints[2]!, untouched, input.joints[0]!],
  });
  input.joints[0]!.flexion = 35;
  input.joints[2]!.flexion = -40;
  const restored: IAutoMoviePose = prepared(input);
  TestValidator.equals(
    "A, then B, then A again",
    [
      angles(a.joints[0]!),
      angles(b.joints[0]!),
      angles(b.joints[2]!),
      angles(restored.joints[0]!),
      angles(a.joints[0]!),
    ],
    [
      [20, 0, null],
      [20, 0, 0],
      [-10, 0, null],
      [20, 0, null],
      [20, 0, null],
    ],
  );
  TestValidator.predicate(
    "roots and independence",
    a.root === input.root &&
      b.root === null &&
      restored.root === input.root &&
      a.joints !== restored.joints &&
      a.joints[1] === untouched &&
      b.joints[1] === untouched,
  );
}

/** Scenario 8: plain bounds are read at each call. */
function boundsRead(): void {
  const range: IAutoMovieAngleRange = { min: -10, max: 20 };
  const skeleton: IAutoMovieSkeleton = {
    id: "current-rig",
    bones: [
      bone("leftLowerArm", { flexion: range, abduction: null, twist: null }),
    ],
  };
  const input: IAutoMoviePose = pose([
    { bone: "leftLowerArm", flexion: 35, abduction: null, twist: null },
    { bone: "leftLowerArm", flexion: -40, abduction: null, twist: null },
  ]);
  const read: () => (number | null)[] = (): (number | null)[] =>
    AutoMovieEngineKinematics.clampPose(input, skeleton).joints.map(
      (joint: IAutoMovieJointPose): number | null => joint.flexion,
    );
  const before: (number | null)[] = read();
  range.min = -4;
  range.max = 7;
  TestValidator.equals(
    "bounds mutated between calls",
    [before, read()],
    [
      [20, -10],
      [7, -4],
    ],
  );
}

/** Scenario 9: malformed axes and the empty pose. */
function axesOrder(): void {
  const valid: IAutoMovieJointAxes = {
    flexion: { x: 1, y: 0, z: 0 },
    abduction: { x: 0, y: 1, z: 0 },
    twist: { x: 0, y: 0, z: 1 },
  };
  const gated: IAutoMovieJointConstraint = {
    flexion: { min: -30, max: 30 },
    abduction: { min: -30, max: 30 },
    twist: { min: -90, max: 90 },
    swingTwist: { twist: { min: -15, max: 15 } },
  };
  const withAxes: (
    name: IAutoMovieBone["bone"],
    constraint: IAutoMovieJointConstraint | null,
    axes: IAutoMovieJointAxes,
  ) => IAutoMovieBone = (
    name: IAutoMovieBone["bone"],
    constraint: IAutoMovieJointConstraint | null,
    axes: IAutoMovieJointAxes,
  ): IAutoMovieBone => ({ ...bone(name, constraint), axes });
  const ordered: IAutoMovieSkeleton = {
    id: "current-rig",
    bones: [
      withAxes("spine", gated, { ...valid, flexion: { x: 0, y: 0, z: 0 } }),
      withAxes("chest", gated, { ...valid, abduction: { x: 0, y: 0, z: 0 } }),
    ],
  };
  const spine: IAutoMovieJointPose = {
    bone: "spine",
    flexion: 0,
    abduction: 0,
    twist: 50,
  };
  const chest: IAutoMovieJointPose = { ...spine, bone: "chest" };
  TestValidator.predicate(
    "malformed axes fail in input order",
    throwsError(
      (): IAutoMoviePose => AutoMovieEngineKinematics.clampPose(pose([spine, chest]), ordered),
      "axes.flexion",
    ) &&
      throwsError(
        (): IAutoMoviePose => AutoMovieEngineKinematics.clampPose(pose([chest, spine]), ordered),
        "axes.abduction",
      ),
  );
  const hips: IAutoMovieJointPose = {
    bone: "hips",
    flexion: 5,
    abduction: 999,
    twist: null,
  };
  const empty: IAutoMoviePose = pose([]);
  TestValidator.predicate(
    "unconstrained, empty and null root",
    AutoMovieEngineKinematics.clampPose(pose([hips]), {
      id: "current-rig",
      bones: [
        withAxes("hips", null, { ...valid, flexion: { x: 0, y: 0, z: 0 } }),
      ],
    }).joints[0] === hips &&
      AutoMovieEngineKinematics.clampPose(empty, ordered).root === empty.root &&
      AutoMovieEngineKinematics.clampPose(pose([], null), ordered).root === null,
  );
}
