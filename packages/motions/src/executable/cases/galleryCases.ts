import { AutoMovieHumanCanonicalBody } from "@automovie/human";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
} from "@automovie/interface";

import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { MotionBodies } from "../MotionBodies";

/**
 * Inspection cases of the polygon man itself: `gallery` shows one body in
 * single-joint clinical poses (each instant one pose), and `bodies` stands the
 * three fixture bodies side by side at clinical neutral.
 *
 * The gallery's verdicts check the frame: a left-arm forward flexion raises
 * the hand on +X (the anatomical left) and in front (+Z), and a right hip
 * flexion carries the right knee forward on -X.
 *
 * @returns The two cases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the cases, the poses they show and the frame checks.
 * @evidence contracts/development/implementation.md#principled-implementation Each pose sets named clinical angles on a full zero pose, so every other joint stands at clinical neutral.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure A pose table mapped to instants.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Verdicts read world positions from forward kinematics, not from the pose table.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
export function galleryCases(): IMotionCaptureCase[] {
  const body: AutoMovieHumanCanonicalBody.IBody =
    MotionBodies.population("m-average").body;
  const poses: {
    label: string;
    joints: Partial<Record<AutoMovieHumanoidBone, [number, number, number]>>;
  }[] = [
    { label: "neutral", joints: {} },
    { label: "L sh flex 90", joints: { leftUpperArm: [90, 0, 0] } },
    { label: "R sh abd 90", joints: { rightUpperArm: [0, 90, 0] } },
    {
      label: "L elbow 90 pron 90",
      joints: { leftUpperArm: [30, 0, 0], leftLowerArm: [90, 0, 90] },
    },
    { label: "R fist", joints: fist("right") },
    {
      label: "R hip 90 knee 90",
      joints: { rightUpperLeg: [90, 0, 0], rightLowerLeg: [90, 0, 0] },
    },
    { label: "L hip abd 45", joints: { leftUpperLeg: [0, 45, 0] } },
    {
      label: "ankles",
      joints: { leftFoot: [20, 0, 0], rightFoot: [-40, 0, 0] },
    },
    {
      label: "trunk",
      joints: {
        spine: [20, 0, 0],
        chest: [10, 0, 20],
        neck: [0, 0, 20],
        head: [-10, 0, 0],
      },
    },
    { label: "T rest (no joints)", joints: {} },
  ];
  const at = (index: number): IAutoMoviePose =>
    index === poses.length - 1
      ? { skeleton: body.skeleton.id, root: null, joints: [] }
      : zero(body, poses[index]!.joints);
  const hand = joint(body, at(1), "leftHand");
  const knee = joint(body, at(5), "rightLowerLeg");
  const gallery: IMotionCaptureCase = {
    name: "gallery",
    times: poses.map(
      (p: { label: string }, i: number): IMotionCaptureCase.ITime => ({
        seconds: i,
        label: p.label,
      }),
    ),
    performers: [
      { id: "a", body, pose: (s: number): IAutoMoviePose => at(Math.round(s)) },
    ],
    verdicts: [
      {
        name: "left forward flexion lifts the hand on the anatomical left, in front",
        passed: hand.x > 0.1 && hand.z > 0.4 && Math.abs(hand.y - 1.44) < 0.1,
        detail: `left hand at (${hand.x.toFixed(3)}, ${hand.y.toFixed(3)}, ${hand.z.toFixed(3)})`,
      },
      {
        name: "right hip flexion carries the right knee forward on the right",
        passed: knee.x < -0.05 && knee.z > 0.3,
        detail: `right knee at (${knee.x.toFixed(3)}, ${knee.y.toFixed(3)}, ${knee.z.toFixed(3)})`,
      },
    ],
  };
  const bodies: IMotionCaptureCase = {
    name: "bodies",
    times: [{ seconds: 0, label: "neutral" }],
    performers: (["f-small", "m-average", "m-tall"] as const).map(
      (id: string, i: number): IMotionCaptureCase.IPerformer => {
        const b: AutoMovieHumanCanonicalBody.IBody =
          MotionBodies.population(id).body;
        return {
          id,
          body: b,
          pose: (): IAutoMoviePose => ({
            ...zero(b, {}),
            root: {
              translation: { x: (i - 1) * 0.8, y: 0, z: 0 },
              rotation: { x: 0, y: 0, z: 0, w: 1 },
              scale: { x: 1, y: 1, z: 1 },
            },
          }),
        };
      },
    ),
  };
  return [gallery, bodies];
}

/** Every rig bone at clinical zero, with some bones' angles set. */
function zero(
  body: AutoMovieHumanCanonicalBody.IBody,
  set: Partial<Record<AutoMovieHumanoidBone, [number, number, number]>>,
): IAutoMoviePose {
  return {
    skeleton: body.skeleton.id,
    root: null,
    joints: body.skeleton.bones.map(
      (b: IAutoMovieBone): IAutoMovieJointPose => {
        const a: [number, number, number] = set[b.bone] ?? [0, 0, 0];
        return { bone: b.bone, flexion: a[0], abduction: a[1], twist: a[2] };
      },
    ),
  };
}

/** Every finger segment of one hand flexed into a fist. */
function fist(
  side: "left" | "right",
): Partial<Record<AutoMovieHumanoidBone, [number, number, number]>> {
  const out: Partial<Record<AutoMovieHumanoidBone, [number, number, number]>> =
    {};
  for (const digit of ["Index", "Middle", "Ring", "Little"])
    for (const k of ["Proximal", "Intermediate", "Distal"])
      out[`${side}${digit}${k}` as AutoMovieHumanoidBone] = [
        k === "Proximal" ? 85 : 95,
        0,
        0,
      ];
  out[`${side}ThumbProximal` as AutoMovieHumanoidBone] = [40, 0, 0];
  out[`${side}ThumbDistal` as AutoMovieHumanoidBone] = [50, 0, 0];
  return out;
}

/** One Human joint's canonical position under a pose. */
function joint(
  body: AutoMovieHumanCanonicalBody.IBody,
  pose: IAutoMoviePose,
  bone: string,
): { x: number; y: number; z: number } {
  return AutoMovieHumanCanonicalBody.place(body, pose).find(
    (p: AutoMovieHumanCanonicalBody.IPlacement): boolean => p.bone === bone,
  )!.position;
}
