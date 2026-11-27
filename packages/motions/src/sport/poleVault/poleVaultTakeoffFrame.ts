import { preparePoseResolution } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGymnasticsTakeoff,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { walkPoleFrame } from "../../actions/internal/walkPoleFrame";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";

/**
 * The plant's shoulders and root on the take-off's trunk (`poleVault.plan`):
 * the take-off's posture at its instant, with each holding arm's shoulder joint
 * resolved on it.
 *
 * @param body The vaulter's body.
 * @param takeoff The vault's take-off.
 * @param pole The pole in the hands that hold it.
 * @returns The holding shoulders and the take-off's root.
 */
export function poleVaultTakeoffFrame(
  body: IAutoMovieMotionHumanBody,
  takeoff: IAutoMovieMotionHumanGymnasticsTakeoff.ITakeoff,
  pole: walkPoleFrame.IPole,
): poleVaultTakeoffFrame.IFrame {
  const shoulderBones: ReadonlySet<AutoMovieHumanoidBone> =
    new Set<AutoMovieHumanoidBone>(
      pole.hands.map(
        (hand: walkPoleFrame.IHand): AutoMovieHumanoidBone =>
          `${hand.side}UpperArm`,
      ),
    );
  const resolution: ReturnType<typeof preparePoseResolution> =
    preparePoseResolution();
  const projection: ReturnType<typeof prepareHumanPostureProjection> =
    prepareHumanPostureProjection(body);
  const raw: IAutoMovieMotionHumanPosture = takeoff.plan.posture(
    takeoff.seconds,
    undefined,
    resolution,
    projection,
  );
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    resolveHumanPosture.seeded(
      body,
      raw,
      undefined,
      undefined,
      resolution,
      shoulderBones,
      projection,
    ).pose,
    resolution,
    shoulderBones,
  );
  const shoulders: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>> = {};
  for (const hand of pole.hands)
    shoulders[hand.side] = bones.get(`${hand.side}UpperArm`)!.worldPosition;
  return { shoulders, root: raw.root };
}

/** Companion types of {@link poleVaultTakeoffFrame}. */
export namespace poleVaultTakeoffFrame {
  /** The take-off's holding shoulders and root. */
  export interface IFrame {
    /**
     * Each holding arm's shoulder joint as the take-off solves it, world
     * metres.
     */
    shoulders: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>>;

    /** The take-off's root, world metres. */
    root: IAutoMovieVector3;
  }
}
