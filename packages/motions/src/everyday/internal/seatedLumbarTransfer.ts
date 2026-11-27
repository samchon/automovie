import { ROM_TOLERANCE, AutoMovieEngineMath, AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { HumanColliders } from "../../posture/internal/HumanColliders";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { GymnasticsFlight } from "../../sport/internal/GymnasticsFlight";
import { seatedPairDepth } from "./seatedPairDepth";

/*
 * Find how much flexion the thorax must take from the lumbar spine when the
 * seat first bears. The pelvis, feet and total forward inclination stay at the
 * original contact key.
 */
export function seatedLumbarTransfer(
  body: IAutoMovieMotionHumanBody,
  peak: IAutoMovieMotionHumanPosture,
): number {
  const pose: IAutoMovieMotionHumanPosture = GymnasticsFlight.frozen(
    body,
    peak,
  );
  const spine: NonNullable<typeof pose.joints.spine> = pose.joints.spine ?? [
    0, 0, 0,
  ];
  const chest: NonNullable<typeof pose.joints.chest> = pose.joints.chest ?? [
    0, 0, 0,
  ];
  const maximum: number =
    AutoMovieEngineKinematics.getConstraint("chest", body.bones.get("chest")?.constraint ?? null)?.flexion
      ?.max ?? chest[0];
  const limit: number = Math.min(spine[0], maximum - chest[0]);
  if (limit <= 0) return 0;
  const left: ReturnType<typeof seatedPairDepth> = seatedPairDepth(
    body,
    "spine",
    "leftUpperLeg",
  );
  const right: ReturnType<typeof seatedPairDepth> = seatedPairDepth(
    body,
    "spine",
    "rightUpperLeg",
  );
  const placed: ReturnType<typeof HumanColliders.placed> =
    HumanColliders.placed(
      body,
      poseBones(body, resolveHumanPosture(body, pose)),
    );
  if (Math.max(left(placed), right(placed)) === 0) return 0;
  const spineIndex: number = placed.findIndex(
    (part): boolean => part.bone === "spine",
  );
  const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set(["spine"]);
  const readSpine: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    body,
    requested,
  );
  const placeSpine: ReturnType<typeof HumanColliders.preparePlaced> =
    HumanColliders.preparePlaced(body, requested);
  const touching: (angle: number) => boolean = (angle: number): boolean => {
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...pose.joints,
      spine: [spine[0] - angle, spine[1], spine[2]],
      chest: [chest[0] + angle, chest[1], chest[2]],
    };
    const native: ReturnType<typeof resolveHumanPosture.seeded> =
      resolveHumanPosture.seeded(
        body,
        { ...pose, joints },
        undefined,
        {},
        undefined,
        requested,
      );
    placed[spineIndex] = placeSpine(readSpine(native.pose))[0]!;
    return Math.max(left(placed), right(placed)) > 0;
  };
  if (touching(limit)) return 0;
  return AutoMovieEngineMath.bracketedBisection(touching, 0, limit, ROM_TOLERANCE);
}
