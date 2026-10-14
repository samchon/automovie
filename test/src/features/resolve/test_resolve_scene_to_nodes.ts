import {
  IAutoMovieModel,
  type IAutoMovieMotion,
  type IAutoMovieNode,
  type IAutoMoviePose,
  IAutoMovieScene,
  type IAutoMovieSkeleton,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { type IAutoMovieResolvedBone, resolvePose, Matrix4, type IAutoMovieMotionClipBridge, motionToClip, composeScene, resolveFrame, sceneToNodes } from "@automovie/engine";







import { createModel } from "../internal/createModel";
import { createSkeleton } from "../internal/createSkeleton";
import { joint } from "../internal/joint";
import { keyframe } from "../internal/keyframe";
import { makeMotion } from "../internal/makeMotion";
import { makePose } from "../internal/makePose";
import { namedFacts } from "../internal/namedFacts";
import { qclose } from "../internal/qclose";
import { vclose } from "../internal/vclose";

const T: (
  x: number,
  y: number,
  z: number,
  rotY?: { y: number; w: number },
) => IAutoMovieTransform = (
  x: number,
  y: number,
  z: number,
  rotY?: { y: number; w: number },
): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation:
    rotY === undefined
      ? { x: 0, y: 0, z: 0, w: 1 }
      : { x: 0, y: rotY.y, z: 0, w: rotY.w },
  scale: { x: 1, y: 1, z: 1 },
});

/**
 * Lower scene rest structure into placement groups, camera/light payloads and prefixed skeleton subtrees, then play a held pose through clip overrides. Checks cover placement position/rotation, camera/light positions, bone position/rotation parity and the folded root position; full matrix and scale parity are not established.
 *
 * Scenarios:
 *
 * 1. A placement group's world position/rotation match its scene-node transform;
 *    camera and light world positions match authored translations. Full camera,
 *    light and scale parity is not separately checked here.
 * 2. A skeleton-less prop placement lowers no subtree: its group node is the only
 *    node carrying its id prefix.
 * 3. A held pose played as a constant clip (bridged with the placement's
 *    `nodePrefix`) reproduces the specialized path on every bone: world ≡
 *    `placement ∘ resolvePose(pose)` (position and rotation).
 * 4. The actor's synthetic root world position matches `placement ∘ pose.root` (the
 *    fold contract), not the placement alone: the negative twin distinguishes
 *    the two whenever `pose.root` is non-identity.
 *
 * @evidence contracts/testing.md#behavioral-verification Lowers existing scene placements/camera/light/skeleton nodes, composes rest worlds and plays a held-pose bridge, observing expected positions/rotations and a nonidentity root fold.
 * @evidence contracts/testing.md#independent-expectations Authored scene transforms give rest translations; placement multiplied by specialized resolvePose supplies a parity oracle for held bones, sharing product math rather than an external FK reference. Camera/light assertions here check positions, not every transform coefficient.
 * @evidence contracts/testing.md#distinguishing-cases Rigid versus rigged placements and rest versus held nonidentity-root pose distinguish missing/extra subtree and lost root folding; namespace admission and moving clip parity belong to adjacent scene tests.
 * @evidence contracts/testing.md#execution-ownership The named test_resolve_scene_to_nodes entry owns portable synchronous lowering/bridge/FK comparison on existing engine fixtures; it does not render a scene or certify anatomical pose quality.
 */
export function test_resolve_scene_to_nodes(): void {
  const skeleton: IAutoMovieSkeleton = createSkeleton();
  const actorModel: IAutoMovieModel = { ...createModel(skeleton), id: "hero" };
  const propModel: IAutoMovieModel = { ...createModel(null), id: "crate" };
  const scene: IAutoMovieScene = {
    id: "scene-1",
    name: null,
    nodes: [
      {
        id: "actor",
        model: "hero",
        // 90° about +Y at (1, 0, 2).
        transform: T(1, 0, 2, { y: Math.SQRT1_2, w: Math.SQRT1_2 }),
        motion: null,
        pose: null,
      },
      {
        id: "box",
        model: "crate",
        transform: T(-3, 0.5, 0),
        motion: null,
        pose: null,
      },
    ],
    cameras: [
      {
        id: "cam",
        transform: T(0, 1.5, 4),
        fovY: 40,
        near: 0.1,
        far: 100,
        depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
      },
    ],
    lights: [
      {
        id: "sun",
        type: "directional",
        transform: T(0, 5, 0),
        color: { r: 1, g: 1, b: 1, a: null, hex: null },
        intensity: 1,
      },
    ],
  };
  const models: { hero: IAutoMovieModel; crate: IAutoMovieModel } = {
    hero: actorModel,
    crate: propModel,
  };
  const nodes: IAutoMovieNode[] = sceneToNodes({ scene, models });

  // 1. rest structure worlds ≡ declared transforms
  const rest: Map<string, number[]> = composeScene(nodes);
  const placement: IAutoMovieTransform = scene.nodes[0]!.transform;
  const placementMatrix: number[] = Matrix4.compose(
    placement.translation,
    placement.rotation,
    placement.scale,
  );
  TestValidator.equals(
    "placement group world equals its scene transform",
    namedFacts([
      [
        "vcloseMatrix4Position",
        (): boolean =>
          vclose(Matrix4.position(rest.get("actor")!), placement.translation),
      ],
      [
        "qcloseMatrix4Decompose",
        (): boolean =>
          qclose(
            Matrix4.decompose(rest.get("actor")!).rotation,
            placement.rotation,
          ),
      ],
    ]),
    { vcloseMatrix4Position: true, qcloseMatrix4Decompose: true },
  );
  TestValidator.predicate(
    "camera node world equals the camera transform",
    vclose(Matrix4.position(rest.get("cam")!), { x: 0, y: 1.5, z: 4 }),
  );
  TestValidator.predicate(
    "light node world equals the light transform",
    vclose(Matrix4.position(rest.get("sun")!), { x: 0, y: 5, z: 0 }),
  );

  // 2. the prop lowers no subtree
  TestValidator.equals(
    "skeleton-less prop lowers only its group node",
    nodes.filter((node: IAutoMovieNode): boolean => node.id.startsWith("box"))
      .length,
    1,
  );
  TestValidator.equals(
    "the actor lowers its bone subtree under the placement",
    namedFacts([
      [
        "nodesSomeNode",
        (): boolean =>
          nodes.some(
            (node: IAutoMovieNode): boolean => node.id === "actor/hips",
          ),
      ],
      [
        "nodesSomeNode2",
        (): boolean =>
          nodes.some(
            (node: IAutoMovieNode): boolean => node.id === "actor/root",
          ),
      ],
    ]),
    { nodesSomeNode: true, nodesSomeNode2: true },
  );

  // 3.-4. held pose through the clip path ≡ placement ∘ resolvePose(pose)
  const pose: IAutoMoviePose = makePose(
    [
      joint("leftUpperArm", { flexion: 30, abduction: 45 }),
      joint("leftLowerArm", { flexion: 90 }),
    ],
    T(0.5, 0, 0, { y: Math.SQRT1_2, w: Math.SQRT1_2 }),
  );
  const held: IAutoMovieMotion = makeMotion(
    [keyframe(0, pose), keyframe(1, pose)],
    1,
  );
  const bridge: IAutoMovieMotionClipBridge = motionToClip({
    motion: held,
    skeleton,
    nodePrefix: "actor/",
  });
  const world: Map<string, number[]> = resolveFrame({
    nodes,
    clip: bridge.clip,
    limits: [],
    seconds: 0.5,
  }).world;
  const expected: IAutoMovieResolvedBone[] = resolvePose(pose, skeleton);
  let bonesMatch: boolean = true;
  for (const bone of expected) {
    const matrix: number[] | undefined = world.get(`actor/${bone.bone}`);
    if (matrix === undefined) {
      bonesMatch = false;
      break;
    }
    const specialized: number[] = Matrix4.multiply(
      placementMatrix,
      Matrix4.compose(bone.worldPosition, bone.worldRotation, {
        x: 1,
        y: 1,
        z: 1,
      }),
    );
    if (
      !vclose(Matrix4.position(matrix), Matrix4.position(specialized)) ||
      !qclose(
        Matrix4.decompose(matrix).rotation,
        Matrix4.decompose(specialized).rotation,
      )
    ) {
      bonesMatch = false;
      break;
    }
  }
  TestValidator.predicate(
    "held pose through the clip path equals placement ∘ resolvePose",
    bonesMatch,
  );

  const rootWorld: number[] = world.get("actor/root")!;
  const folded: number[] = Matrix4.multiply(
    placementMatrix,
    Matrix4.compose(
      pose.root!.translation,
      pose.root!.rotation,
      pose.root!.scale,
    ),
  );
  TestValidator.predicate(
    "the synthetic root sits at placement ∘ pose.root",
    vclose(Matrix4.position(rootWorld), Matrix4.position(folded)),
  );
  TestValidator.predicate(
    "…which differs from the bare placement (the fold is real)",
    !vclose(Matrix4.position(rootWorld), placement.translation),
  );
}
