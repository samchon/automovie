import {
  type IAutoMovieResolvedBone,
  resolveMorphTargetWeights,
  skinAutoMovieMesh,
} from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieMeshMorphTarget,
  IAutoMovieMorphTargetDriver,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkinnedTubeMesh } from "../internal/createSkinnedTubeMesh";
import { joint, makePose } from "../internal/fixtures";
import { nclose, vclose } from "../internal/predicates";

/**
 * Pose-driven morph target weights follow one clinical joint angle through a driven-key curve, and the skinning reference adds weighted targets before it skins.
 *
 * Scenarios:
 * 1. A flexion driver with points (0, 0) and (90, 1) reads 0.5 at 45 degrees and holds 1 past 90 and 0 below 0.
 * 2. An unlisted bone and a null axis read zero, so the weight is the curve at zero; a bone listed twice reads its last entry.
 * 3. A twist driver reads the twist axis, not flexion.
 * 4. An output above one is returned unclamped, and an undriven target is absent from the result.
 * 5. skinAutoMovieMesh displaces a vertex by the weighted delta in the rest frame and then rotates it with its bone; omitted weights and an unknown name leave the rest shape.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls resolveMorphTargetWeights on hand-built targets and poses and skinAutoMovieMesh on a synthetic tube; catches reading the wrong axis or the first duplicate, clamping, inventing weights for undriven targets, and applying a delta after skinning instead of before.
 * @evidence contracts/testing.md#independent-expectations Weights follow the documented piecewise-linear curve with held ends evaluated by hand, and the skinned point is the rest point plus the delta rotated 90 degrees about the joint, computed in closed form.
 * @evidence contracts/testing.md#distinguishing-cases Interior, below, above and exact curve points; listed, unlisted, null and duplicated joints; two axes; an overdriving curve; driven and undriven targets; and morph-then-skin against no weights and an unknown name. Admission belongs to the validation test, viewer writes to the viewer test.
 * @evidence contracts/testing.md#execution-ownership A portable unit over engine arithmetic and synthetic internal fixtures; it starts no browser, GPU or process.
 */
export function test_kinematics_morph_target_weights(): void {
  const driver: (
    axis: IAutoMovieMorphTargetDriver["axis"],
    outputs?: [number, number],
  ) => IAutoMovieMorphTargetDriver = (
    axis: IAutoMovieMorphTargetDriver["axis"],
    outputs: [number, number] = [0, 1],
  ): IAutoMovieMorphTargetDriver => ({
    bone: "spine",
    axis,
    curve: {
      points: [
        { source: 0, output: outputs[0] },
        { source: 90, output: outputs[1] },
      ],
    },
  });
  const target: (
    name: string,
    driven: IAutoMovieMorphTargetDriver | null,
  ) => IAutoMovieMeshMorphTarget = (
    name: string,
    driven: IAutoMovieMorphTargetDriver | null,
  ): IAutoMovieMeshMorphTarget => ({
    name,
    positions: [],
    normals: null,
    driver: driven,
  });
  const weight: (
    targets: IAutoMovieMeshMorphTarget[],
    joints: ReturnType<typeof joint>[],
    name: string,
  ) => number | undefined = (
    targets: IAutoMovieMeshMorphTarget[],
    joints: ReturnType<typeof joint>[],
    name: string,
  ): number | undefined =>
    resolveMorphTargetWeights(targets, makePose(joints)).get(name);
  const flex: IAutoMovieMeshMorphTarget[] = [
    target("bend", driver("flexion")),
  ];

  // 1. curve evaluation
  TestValidator.equals(
    "flexion drives the curve, holding its ends",
    [45, 120, -30, 90].map(
      (angle: number): boolean =>
        nclose(
          weight(flex, [joint("spine", { flexion: angle })], "bend")!,
          Math.min(1, Math.max(0, angle / 90)),
        ),
    ),
    [true, true, true, true],
  );

  // 2. neutral and duplicate readings
  TestValidator.equals(
    "an unlisted bone and a null axis read zero; a duplicate reads its last entry",
    [
      weight(flex, [joint("hips", { flexion: 90 })], "bend"),
      weight(flex, [joint("spine", { twist: 90 })], "bend"),
      weight(
        flex,
        [joint("spine", { flexion: 90 }), joint("spine", { flexion: 45 })],
        "bend",
      ),
    ],
    [0, 0, 0.5],
  );

  // 3. axis selection
  TestValidator.equals(
    "a twist driver reads twist",
    weight(
      [target("turn", driver("twist"))],
      [joint("spine", { flexion: 90, twist: 45 })],
      "turn",
    ),
    0.5,
  );

  // 4. unclamped output, undriven omitted
  const resolved: Map<string, number> = resolveMorphTargetWeights(
    [target("over", driver("flexion", [0, 2])), target("free", null)],
    makePose([joint("spine", { flexion: 90 })]),
  );
  TestValidator.equals(
    "outputs stay unclamped and undriven targets are omitted",
    [...resolved.entries()],
    [["over", 2]],
  );

  // 5. morph before skin
  const mesh: IAutoMovieMesh = createSkinnedTubeMesh();
  const top: number = 16 * 16 + 4; // (0, 2, 0.2), bound wholly to spine
  const delta: number[] = new Array<number>(mesh.positions.length).fill(0);
  delta[top * 3 + 2] = 0.1; // push outward along +z by 0.1
  mesh.targets = [{ name: "swell", positions: delta, normals: null }];
  const half: number = Math.SQRT1_2;
  const rest: IAutoMovieResolvedBone[] = [
    bone("hips", 0, { x: 0, y: 0, z: 0, w: 1 }),
    bone("spine", 1, { x: 0, y: 0, z: 0, w: 1 }),
  ];
  const posed: IAutoMovieResolvedBone[] = [
    bone("hips", 0, { x: 0, y: 0, z: 0, w: 1 }),
    bone("spine", 1, { x: half, y: 0, z: 0, w: half }),
  ];
  const at: (positions: number[]) => { x: number; y: number; z: number } = (
    positions: number[],
  ): { x: number; y: number; z: number } => ({
    x: positions[top * 3]!,
    y: positions[top * 3 + 1]!,
    z: positions[top * 3 + 2]!,
  });
  // rest (0, 2, 0.2 + 0.5 * 0.1) relative to the joint is (0, 1, 0.25);
  // 90 degrees about +x maps (y, z) to (-z, y)
  TestValidator.predicate(
    "a weighted delta applies in the rest frame before skinning",
    vclose(at(skinAutoMovieMesh(mesh, rest, posed, new Map([["swell", 0.5]]))), {
      x: 0,
      y: 1 - 0.25,
      z: 1,
    }),
  );
  TestValidator.predicate(
    "omitted weights and an unknown name leave the rest shape",
    vclose(at(skinAutoMovieMesh(mesh, rest, posed)), { x: 0, y: 0.8, z: 1 }) &&
      vclose(
        at(skinAutoMovieMesh(mesh, rest, posed, new Map([["absent", 1]]))),
        { x: 0, y: 0.8, z: 1 },
      ),
  );
}

function bone(
  name: IAutoMovieResolvedBone["bone"],
  height: number,
  rotation: IAutoMovieResolvedBone["worldRotation"],
): IAutoMovieResolvedBone {
  return {
    bone: name,
    localRotation: rotation,
    worldPosition: { x: 0, y: height, z: 0 },
    worldRotation: rotation,
  };
}
