import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
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
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The first trial runs the complete cold canonical solve. Later trials borrow its direct-joint projection only through the canonical owner's private exact raw/rig proof; changed joints or unsupported context retain full resolution, and bracket/predicate/height stay unchanged.
 * @evidence contracts/development/implementation.md#efficient-algorithms Four shoulder/hip names prepare once. An eligible trial pays O(B+J) exact rig/raw proof checks and owned pose copying for B bones/J joints instead of repeated numerical ROM projection, then its actual demanded FK ancestry; every original halving remains and speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The crawl varies rigid pitch/root over unchanged direct joint angles with no limb/digit goals. A genuine cold preparation privately verifies every raw/rig prerequisite on each consumer before sharing that placement-independent projection; all changed/unsupported contexts retain canonical fallback.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One issued source preparation, FK/name readers and bounded ROM metadata end with this synchronous search. Current candidates own only weak provenance and do not accumulate; only the final fresh map and scalar pitch escape.
 */
export function crawlPitch(
  body: IHumanBody,
  hips: IAutoMovieVector3,
  shoulderY: number,
  posed: (degrees: number) => IHumanPosture,
): { pitch: number; bones: ReturnType<typeof poseBones> } {
  const resolution: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();
  const projection: ReturnType<typeof prepareHumanPostureProjection> =
    prepareHumanPostureProjection(body);
  const read: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    body,
    MEASURED,
  );
  let source: resolveHumanPosture.IPrepared | undefined;
  const at: (degrees: number) => ReturnType<typeof poseBones> = (
    degrees: number,
  ): ReturnType<typeof poseBones> => {
    const tilted: IHumanPosture = posed(degrees);
    const posture: IHumanPosture = {
      ...tilted,
      root: crawlFrame.rootFor(body, tilted, hips),
    };
    let pose: IAutoMoviePose;
    if (source === undefined) {
      source = resolveHumanPosture.prepare(
        body,
        posture,
        resolution,
        projection,
      );
      pose = source.pose;
    } else {
      pose = resolveHumanPosture.seeded(
        body,
        resolveHumanPosture.carried(source, posture),
        undefined,
        undefined,
        resolution,
        undefined,
        projection,
      ).pose;
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
