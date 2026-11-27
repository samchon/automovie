import { Transform } from "@automovie/engine";
import { AutoMovieHumanCanonicalBody } from "@automovie/human";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanCanonicalBody,
  IAutoMoviePose,
} from "@automovie/interface";

import type { IMotionCaptureCase } from "../internal/IMotionCaptureCase";
import { MotionBodies } from "../internal/MotionBodies";
import { galleryCaseFist } from "./internal/galleryCaseFist";
import { galleryCaseZero } from "./internal/galleryCaseZero";

/*
 * Inspection cases of the polygon man itself: `gallery` shows one body in
 * single-joint clinical poses (each instant one pose), and `bodies` stands the
 * three fixture bodies side by side at clinical neutral.
 *
 * The gallery's verdicts check the frame: a left-arm forward flexion raises the
 * hand on +X (the anatomical left) and in front (+Z), and a right hip flexion
 * carries the right knee forward on -X.
 * Returns: The two cases.
 */
export function galleryCases(): IMotionCaptureCase[] {
  const body: IAutoMovieHumanCanonicalBody.IBody =
    MotionBodies.population("m-average").body;
  const poses: IGalleryCasesPosesItem[] = [
    { label: "neutral", joints: {} },
    { label: "L sh flex 90", joints: { leftUpperArm: [90, 0, 0] } },
    { label: "R sh abd 90", joints: { rightUpperArm: [0, 90, 0] } },
    {
      label: "L elbow 90 pron 90",
      joints: { leftUpperArm: [30, 0, 0], leftLowerArm: [90, 0, 90] },
    },
    { label: "R fist", joints: galleryCaseFist("right") },
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
      : galleryCaseZero(body, poses[index]!.joints);
  const hand = joint(body, at(1), "leftHand");
  const knee = joint(body, at(5), "rightLowerLeg");
  const gallery: IMotionCaptureCase = {
    name: "gallery",
    times: poses.map(
      (p: IGalleryCasesGalleryP, i: number): IMotionCaptureCase.ITime => ({
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
        const b: IAutoMovieHumanCanonicalBody.IBody =
          MotionBodies.population(id).body;
        return {
          id,
          body: b,
          pose: (): IAutoMoviePose => ({
            ...galleryCaseZero(b, {}),
            root: Transform.of(
              { x: (i - 1) * 0.8, y: 0, z: 0 },
              { x: 0, y: 0, z: 0, w: 1 },
            ),
          }),
        };
      },
    ),
  };
  return [gallery, bodies];
}

/*
 * The record of `IGalleryCasesGalleryP`'s site.
 */
type IGalleryCasesGalleryP = { label: string };

/*
 * The record of `IGalleryCasesPosesItem`'s site.
 */
type IGalleryCasesPosesItem = {
  label: string;
  joints: Partial<Record<AutoMovieHumanoidBone, [number, number, number]>>;
};

/*
 * The record of `IJointResult`'s site.
 */
type IJointResult = { x: number; y: number; z: number };

/*
 * One Human joint's canonical position under a pose.
 */
function joint(
  body: IAutoMovieHumanCanonicalBody.IBody,
  pose: IAutoMoviePose,
  bone: string,
): IJointResult {
  return AutoMovieHumanCanonicalBody.place(body, pose).find(
    (p: IAutoMovieHumanCanonicalBody.IPlacement): boolean => p.bone === bone,
  )!.position;
}
