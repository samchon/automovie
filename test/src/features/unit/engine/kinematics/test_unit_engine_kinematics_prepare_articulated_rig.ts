import { prepareArticulatedRig } from "@automovie/engine";
import type {
  IAutoMovieArticulatedRig,
  IAutoMovieJointPose,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Closed non-humanoid controls for the independent planar fixture. */
type Bone = "base" | "link" | "tip";
/** Local degree input without any humanoid identity. */
type Rotation = Pick<IAutoMovieJointPose, "flexion" | "abduction" | "twist">;

/**
 * Named rigid FK admits its graph and computes current parent-space rotations.
 *
 * Scenarios:
 *
 * 1. An unsorted three-link tree has neutral points (0,0),(1,0),(2,0). A base Z
 *    quarter turn gives (0,0),(0,1),(0,2); a link Z quarter turn gives
 *    (0,0),(1,0),(1,1), independently of node declaration order.
 * 2. A translated root moves every frame, prepared data ignore later source
 *    mutations, output mutation cannot corrupt another read, and current
 *    joint-map changes are observed rather than replaying an old pose.
 * 3. Explicit degree boxes include endpoints and reject an overshoot or an
 *    immobile-axis turn. Malformed trees, scales, rotations, axes and intervals
 *    refuse without a substitute pose.
 */
export function test_unit_engine_kinematics_prepare_articulated_rig(): void {
  const findings: string[] = [];
  const source: IAutoMovieArticulatedRig<Bone> = rig();
  const reader: ReturnType<typeof prepareArticulatedRig<Bone>> =
    prepareArticulatedRig(source);
  const joints: Map<Bone, Rotation> = new Map();
  points("neutral", reader.read(), [
    [0, 0],
    [1, 0],
    [2, 0],
  ]);
  joints.set("base", { flexion: 0, abduction: 90, twist: 0 });
  points("ancestor", reader.read(joints), [
    [0, 0],
    [0, 1],
    [0, 2],
  ]);
  joints.clear();
  joints.set("link", { flexion: null, abduction: 90, twist: null });
  points("child", reader.read(joints), [
    [0, 0],
    [1, 0],
    [1, 1],
  ]);
  points(
    "root",
    reader.read(joints, {
      translation: { x: 3, y: 4, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    }),
    [
      [3, 4],
      [4, 4],
      [4, 5],
    ],
  );
  source.bones[2]!.rest.translation.x = 1000;
  source.bones[2]!.axes.flexion.x = 0;
  points("input ownership", reader.read(), [
    [0, 0],
    [1, 0],
    [2, 0],
  ]);
  const output: ReadonlyMap<Bone, IAutoMovieTransform> = reader.read();
  output.get("tip")!.translation.x = 999;
  points("output ownership", reader.read(), [
    [0, 0],
    [1, 0],
    [2, 0],
  ]);
  joints.clear();
  points("current joints", reader.read(joints), [
    [0, 0],
    [1, 0],
    [2, 0],
  ]);

  for (const value of [90.001]) {
    joints.set("link", { flexion: 0, abduction: value, twist: 0 });
    refuses(`box/finite ${value}`, (): unknown => reader.read(joints));
  }
  joints.set("link", { flexion: 0, abduction: 0, twist: 1 });
  refuses("immobile axis", (): unknown => reader.read(joints));

  for (const damage of [
    (value: IAutoMovieArticulatedRig<Bone>): void => {
      value.bones[0]!.bone = "base";
    },

    (value: IAutoMovieArticulatedRig<Bone>): void => {
      value.bones[2]!.parent = "tip";
    },
    (value: IAutoMovieArticulatedRig<Bone>): void => {
      value.bones[2]!.parent = null;
    },
    (value: IAutoMovieArticulatedRig<Bone>): void => {
      value.bones[0]!.rest.scale.x = 2;
    },
    (value: IAutoMovieArticulatedRig<Bone>): void => {
      value.bones[0]!.rest.rotation.w = 0;
    },

    (value: IAutoMovieArticulatedRig<Bone>): void => {
      value.bones[0]!.axes.abduction.x = 1;
    },
    (value: IAutoMovieArticulatedRig<Bone>): void => {
      value.bones[2]!.limits!.abduction!.min = 100;
    },
  ]) {
    const invalid: IAutoMovieArticulatedRig<Bone> = rig();
    damage(invalid);
    refuses("malformed rig", (): unknown => prepareArticulatedRig(invalid));
  }
  TestValidator.equals("named articulated FK and admission", findings, []);

  /**
   * Independent literal planar positions test the complete transformed
   * hierarchy.
   */
  function points(
    label: string,
    frames: ReadonlyMap<Bone, IAutoMovieTransform>,
    expected: readonly (readonly [number, number])[],
  ): void {
    for (const [index, bone] of (["base", "link", "tip"] as const).entries()) {
      const frame: IAutoMovieTransform | undefined = frames.get(bone);
      if (
        frame === undefined ||
        !nclose(frame.translation.x, expected[index]![0], 1e-12) ||
        !nclose(frame.translation.y, expected[index]![1], 1e-12) ||
        !nclose(frame.translation.z, 0, 1e-12)
      )
        findings.push(`${label}/${bone} has a wrong world point`);
    }
  }

  /**
   * Each independent invalid case must throw rather than returning a fabricated
   * frame.
   */
  function refuses(label: string, run: () => unknown): void {
    try {
      run();
      findings.push(`${label} was accepted`);
    } catch {}
  }
}

/**
 * An unsorted tree and its declared degree box, independent of the engine's
 * prepared graph.
 */
function rig(): IAutoMovieArticulatedRig<Bone> {
  return {
    id: "planar-links",
    bones: (["tip", "base", "link"] as const).map(
      (bone: Bone): IAutoMovieArticulatedRig<Bone>["bones"][number] => ({
        bone,
        parent: bone === "base" ? null : bone === "link" ? "base" : "link",
        rest: {
          translation: { x: bone === "base" ? 0 : 1, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
        axes: {
          flexion: { x: 1, y: 0, z: 0 },
          abduction: { x: 0, y: 0, z: 1 },
          twist: { x: 0, y: 1, z: 0 },
        },
        limits:
          bone === "link"
            ? {
                flexion: { min: -45, max: 45 },
                abduction: { min: 0, max: 90 },
                twist: null,
              }
            : null,
      }),
    ),
  };
}
