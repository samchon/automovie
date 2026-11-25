import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanPosturePreparation } from "../posture/HumanPosturePreparation";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { crawlFrame } from "./crawlFrame";

/** The record of `ICrawlPitchResult`'s site. */
type ICrawlPitchResult = { pitch: number; bones: ReturnType<typeof poseBones> };

/**
 * Solve the crawl's trunk pitch with the hip joints at a fixed world point and
 * the shoulders at the body's required arm height above its palms.
 *
 * @param body The unchanged body of this plan.
 * @param hips The fixed hip midpoint, world metres.
 * @param shoulderY Required shoulder height, world metres.
 * @param template The law's actual fixed joint-only clinical shape, with no
 *   limb/digit/rotation goals; only its rigid pitch/root vary in this search.
 * @returns The original bisection's pitch and its measured shoulder/hip bones.
 */
export function crawlPitch(
  body: IAutoMovieMotionHumanBody,
  hips: IAutoMovieVector3,
  shoulderY: number,
  template: IAutoMovieMotionHumanPosture,
): ICrawlPitchResult {
  const resolution: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();
  const projection: ReturnType<typeof prepareHumanPostureProjection> =
    prepareHumanPostureProjection(body);
  const read: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    body,
    MEASURED,
  );
  let source: HumanPosturePreparation.IPrepared | undefined;
  const at: (degrees: number) => ReturnType<typeof poseBones> = (
    degrees: number,
  ): ReturnType<typeof poseBones> => {
    const tilted: IAutoMovieMotionHumanPosture = {
      ...template,
      pitch: degrees,
    };
    const posture: IAutoMovieMotionHumanPosture = {
      ...tilted,
      root: crawlFrame.rootFor(body, tilted, hips),
    };
    let pose: IAutoMoviePose;
    if (source === undefined) {
      source = HumanPosturePreparation.prepare(
        body,
        posture,
        resolution,
        projection,
      );
      pose = source.pose;
    } else {
      pose = HumanPosturePreparation.rigid(
        source,
        posture.root,
        posture.yaw,
        posture.pitch,
        posture.roll,
      ).fit().pose;
    }
    return read(pose, resolution());
  };
  const pitch: number = crawlFrame.pitched((degrees: number): boolean => {
    const bones: ReturnType<typeof poseBones> = at(degrees);
    return (
      (bones.get("leftUpperArm")!.worldPosition.y +
        bones.get("rightUpperArm")!.worldPosition.y) /
        2 >
      shoulderY
    );
  });
  return { pitch, bones: at(pitch) };
}

/** The residual's shoulders and the downstream nominal hip places. */
const MEASURED: ReadonlySet<AutoMovieHumanoidBone> = new Set([
  "leftUpperArm",
  "rightUpperArm",
  "leftUpperLeg",
  "rightUpperLeg",
]);
