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
 * @param template The law's actual fixed joint-only clinical shape, with no limb/digit/rotation goals; only its rigid pitch/root vary in this search.
 * @returns The original bisection's pitch and its measured shoulder/hip bones.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the pitch goal, fixed world-metre geometry, authored input and returned measured bones.
 * @evidence contracts/development/implementation.md#principled-implementation Uses crawlFrame's unchanged pitch bracket and halving count; each predicate compares the same two shoulder heights after placing the root under the fixed hip midpoint.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The crawl supplies its actual fixed native template, one cold source owns its clinical shape and each later native rigid constructor supplies only current placement. One synchronous exact-FK scope serves all predicates and the final bone map.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The first trial runs the complete cold solve. Later candidates are constructed from that actual private source, never certified from arbitrary callback output or JSON equality; live rig/ROM changes retain native full fallback, and every bracket/predicate/height remains unchanged.
 * @evidence contracts/development/implementation.md#efficient-algorithms Four shoulder/hip names prepare once. Fixed native clinical shape construction removes repeated joint-map setup and nonlinear ROM projection; each later trial retains owned shape copying, native live rig checks and actual demanded FK. Every original halving remains and speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The actual crawlFrame.posed producer supplies one goal-free clinical template with fixed share/hike/neck/body/yaw. Only explicit root/pitch placement varies; the native rigid constructor owns raw copying/provenance and seeded still verifies live body/rig/ROM before sharing the source projection.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One issued source preparation, FK/name readers and bounded ROM metadata end with this synchronous search. Current candidates own only weak provenance and do not accumulate; only the final fresh map and scalar pitch escape.
 */
export function crawlPitch(
  body: IHumanBody,
  hips: IAutoMovieVector3,
  shoulderY: number,
  template: IHumanPosture,
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
    const tilted: IHumanPosture = { ...template, pitch: degrees };
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
        resolveHumanPosture.rigid(
          source,
          posture.root,
          posture.yaw,
          posture.pitch,
          posture.roll,
        ),
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
