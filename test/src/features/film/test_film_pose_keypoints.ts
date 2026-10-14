import { resolvePoseKeypoints } from "../../../../packages/engine/src/film/resolvePoseKeypoints";
import {
  AutoMovieHumanoidBone,
  IAutoMovieCamera,
  IAutoMovieClip,
  IAutoMovieDeliveryCrop,
  IAutoMoviePose,
  IAutoMoviePoseKeypoint,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

const IDENTITY_Q: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
const t3: (x: number, y: number, z: number) => IAutoMovieTransform = (x: number, y: number, z: number): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: IDENTITY_Q,
  scale: { x: 1, y: 1, z: 1 },
});

/**
 * Hips at the rig origin, head at `headRest` above it.
 */
const skeleton: (headRest: IAutoMovieTransform) => IAutoMovieSkeleton = (headRest: IAutoMovieTransform): IAutoMovieSkeleton => ({
  id: "sk",
  bones: [
    { bone: "hips", parent: null, rest: t3(0, 0, 0), constraint: null },
    { bone: "head", parent: "hips", rest: headRest, constraint: null },
  ],
});

/**
 * An articulation-free pose whose rig root sits at (x, y, z).
 */
const poseAt: (x: number, y: number, z: number) => IAutoMoviePose = (x: number, y: number, z: number): IAutoMoviePose => ({
  skeleton: "sk",
  root: t3(x, y, z),
  joints: [],
});

const camera: (over?: Partial<IAutoMovieCamera>) => IAutoMovieCamera = (over: Partial<IAutoMovieCamera> = {}): IAutoMovieCamera => ({
  id: "cam",
  transform: t3(0, 0, 0),
  fovY: 60,
  near: 0.1,
  far: 100,
  ...over,
  depthPrecision: over.depthPrecision ?? {
    minimumDepthBits: 24,
    maximumStepMeters: 100,
  },
});

const keypoints: (props: { pose: IAutoMoviePose; headRest?: IAutoMovieTransform; node?: IAutoMovieTransform; camera?: IAutoMovieCamera; joints?: readonly AutoMovieHumanoidBone[]; aspect?: number; crop?: IAutoMovieDeliveryCrop; cameraMotion?: IAutoMovieClip | null; time?: number }) => IAutoMoviePoseKeypoint[] = (props: {
  pose: IAutoMoviePose;
  headRest?: IAutoMovieTransform;
  node?: IAutoMovieTransform;
  camera?: IAutoMovieCamera;
  joints?: readonly AutoMovieHumanoidBone[];
  aspect?: number;
  crop?: IAutoMovieDeliveryCrop;
  cameraMotion?: IAutoMovieClip | null;
  time?: number;
}): IAutoMoviePoseKeypoint[] =>
  resolvePoseKeypoints({
    pose: props.pose,
    skeleton: skeleton(props.headRest ?? t3(0, 1, 0)),
    node: { transform: props.node ?? t3(0, 0, 0) },
    camera: props.camera ?? camera(),
    joints: props.joints ?? ["hips", "head"],
    aspect: props.aspect,
    crop: props.crop,
    cameraMotion: props.cameraMotion,
    time: props.time,
  });

const of: (ks: IAutoMoviePoseKeypoint[], bone: string) => IAutoMoviePoseKeypoint = (ks: IAutoMoviePoseKeypoint[], bone: string): IAutoMoviePoseKeypoint =>
  ks.find((k: IAutoMoviePoseKeypoint): boolean => k.bone === bone)!;

/**
 * Projects authored hip/head rig positions and checks normalized coordinates, crop-boundary admission, unclamped outside points, missing joints, node placement, aspect and sampled static camera.
 *
 * Scenarios:
 * 1. Project centered hips and a one-metre head, including a crop boundary.
 * 2. Preserve unclamped high/side coordinates and mark behind/far joints outside.
 * 3. Omit a missing joint and intersect the default set with the actual two-bone rig.
 * 4. Apply raised node placement, square aspect and a sampled static camera clip.
 *
 * @evidence contracts/testing.md#behavioral-verification Projects authored hip/head rig positions and checks normalized coordinates, crop-boundary admission, unclamped outside points, missing joints, node placement, aspect and sampled static camera.
 * @evidence contracts/testing.md#independent-expectations A 60-degree vertical pinhole lens maps the one-metre head at five-metre depth to y=(1-1/(5*tan(pi/6)))/2; centered hips and authored clip/crop bounds give the other expectations. This arithmetic tests portable projection, not ControlNet quality or rendered pixels.
 * @evidence contracts/testing.md#distinguishing-cases Preserves two joints, high/behind/far/beside positions, missing/default joint sets, crop boundary, raised node, square aspect and static camera sample; no nonstatic camera path is asserted here.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous test_film_pose_keypoints unit entry owns its assertions and delegated helpers through portable source functions; it opens no process, browser, GPU or installed consumer.
 */
export function test_film_pose_keypoints(): void {
  // 1. basic projection.
  const centered: IAutoMoviePoseKeypoint[] = keypoints({ pose: poseAt(0, 0, -5) });
  TestValidator.equals("hips + head keypoints", centered.length, 2);
  const hips: IAutoMoviePoseKeypoint = of(centered, "hips");
  const head: IAutoMoviePoseKeypoint = of(centered, "head");
  TestValidator.predicate(
    "hips project to frame center, in frame",
    nclose(hips.x, 0.5) && nclose(hips.y, 0.5) && hips.inFrame,
  );
  TestValidator.predicate(
    "the head 1 m up projects above center, in frame",
    nclose(head.x, 0.5) &&
      nclose(head.y, (1 - 1 / (5 * Math.tan(Math.PI / 6))) / 2, 1e-6) && head.inFrame,
  );
  const croppedHips: IAutoMoviePoseKeypoint = of(
    keypoints({
      pose: poseAt(0, 0, -5),
      crop: { left: 0.5, top: 0, right: 1, bottom: 1 },
    }),
    "hips",
  );
  TestValidator.predicate(
    "a keypoint on the crop boundary maps to the output edge and stays in frame",
    nclose(croppedHips.x, 0) && nclose(croppedHips.y, 0.5) && croppedHips.inFrame,
  );

  // 2. out-of-frame joints project honestly (unclamped) with inFrame false.
  const high: IAutoMoviePoseKeypoint = of(
    keypoints({ pose: poseAt(0, 0, -5), headRest: t3(0, 20, 0) }),
    "head",
  );
  TestValidator.predicate(
    "a joint high above the frame is out, not clamped",
    high.inFrame === false && high.y < 0,
  );
  TestValidator.equals(
    "a joint behind the camera is out",
    of(keypoints({ pose: poseAt(0, 0, 5) }), "hips").inFrame,
    false,
  );
  TestValidator.equals(
    "a joint past the far plane is out",
    of(keypoints({ pose: poseAt(0, 0, -200) }), "hips").inFrame,
    false,
  );
  const beside: IAutoMoviePoseKeypoint = of(keypoints({ pose: poseAt(20, 0, -5) }), "hips");
  TestValidator.predicate(
    "a joint beside the frame is out, not clamped",
    beside.inFrame === false && beside.x > 1,
  );

  // 3. missing bone + default joint set.
  TestValidator.equals(
    "a bone the rig lacks yields no keypoint",
    keypoints({ pose: poseAt(0, 0, -5), joints: ["hips", "leftHand"] }).length,
    1,
  );
  TestValidator.equals(
    "the default joint set emits only the rig's bones",
    resolvePoseKeypoints({
      pose: poseAt(0, 0, -5),
      skeleton: skeleton(t3(0, 1, 0)),
      node: { transform: t3(0, 0, 0) },
      camera: camera(),
    }).length,
    2,
  );

  // 4. node placement, aspect, and a sampled camera move.
  const raised: IAutoMoviePoseKeypoint = of(
    keypoints({ pose: poseAt(0, 0, -5), node: t3(0, 3, 0) }),
    "hips",
  );
  TestValidator.equals(
    "the staged node lifts the actor out of frame",
    raised.inFrame,
    false,
  );
  TestValidator.equals(
    "a square aspect narrows the horizontal frame",
    of(keypoints({ pose: poseAt(4, 0, -5), aspect: 1 }), "hips").inFrame,
    false,
  );
  const still: IAutoMoviePoseKeypoint = of(
    keypoints({
      pose: poseAt(0, 0, -5),
      cameraMotion: {
        id: "m",
        name: null,
        duration: 1,
        loop: false,
        tracks: [
          {
            channel: { kind: "node", node: "cam", path: "translation" },
            times: [0, 1],
            values: [0, 0, 0, 0, 0, 0],
            interpolation: "linear",
          },
        ],
      },
      time: 0.5,
    }),
    "hips",
  );
  TestValidator.predicate(
    "a sampled static camera move keeps the subject centered",
    nclose(still.x, 0.5) && still.inFrame,
  );
}
