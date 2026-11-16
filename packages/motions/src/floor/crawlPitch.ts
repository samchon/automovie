import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { crawlFrame } from "./crawlFrame";

/**
 * Solve the crawl's trunk pitch with the hip joints at a fixed world point
 * and the shoulders at the body's required arm height above its palms.
 *
 * @param body The unchanged body of this plan.
 * @param hips The fixed hip midpoint, world metres.
 * @param shoulderY Required shoulder height, world metres.
 * @param posed The law's directly authored posture at a pitch in degrees.
 * @returns The original bisection's pitch and its measured shoulder/hip bones.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the pitch goal, fixed world-metre geometry, authored input and returned measured bones.
 * @evidence contracts/development/implementation.md#principled-implementation Uses crawlFrame's unchanged pitch bracket and halving count; each predicate compares the same two shoulder heights after placing the root under the fixed hip midpoint.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One synchronous exact-FK workspace owns the predicate and the final bone reading, apart from the retained time evaluator.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every trial still resolves the complete authored posture with canonical clamp/digit policies; neither the bracket, predicate nor required height changes.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each original trial demands only four measured shoulder/hip outputs and their ancestry, sharing exact unchanged dependency work across this one search; no speedup is claimed.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed hip placement and one exact dependency reader are shared across pitch trials; every changed authored posture still reaches canonical resolution.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader ends when this synchronous helper returns or throws; only the final fresh map and scalar pitch escape into the crawl plan.
 */
export function crawlPitch(
  body: IHumanBody,
  hips: IAutoMovieVector3,
  shoulderY: number,
  posed: (degrees: number) => IHumanPosture,
): { pitch: number; bones: ReturnType<typeof poseBones> } {
  const resolution: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();
  const at = (degrees: number): ReturnType<typeof poseBones> => {
    const tilted: IHumanPosture = posed(degrees);
    const posture: IHumanPosture = {
      ...tilted,
      root: crawlFrame.rootFor(body, tilted, hips),
    };
    return poseBones(
      body,
      resolveHumanPosture.seeded(
        body,
        posture,
        undefined,
        undefined,
        resolution,
      ).pose,
      resolution(),
      MEASURED,
    );
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
