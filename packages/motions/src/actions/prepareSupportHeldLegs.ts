import { hingedArmSwivel } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieSwivelNear,
  IAutoMovieSwivelSeed,
} from "@automovie/interface";

import { HumanColliders } from "../posture/HumanColliders";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { type prepareSupportHeldFrames } from "./prepareSupportHeldFrames";

/**
 * A reader of the lowest collider of a support interval's held legs as their
 * goals fit them, reading only their chains (`prepareSupportInterval`), with
 * the legs' seeds at a posture and their swivels carried between two seeds.
 * Moved unchanged out of `prepareSupportInterval` to keep that file under the
 * repository's 500-line limit.
 *
 * @param body The unchanged body.
 * @param frames The interval's held-limb frames.
 * @returns The reader; null where no leg is held.
 */
export function prepareSupportHeldLegs(
  body: IAutoMovieMotionHumanBody,
  frames: readonly prepareSupportHeldFrames.IHeldFrames[],
): prepareSupportHeldLegs.IReader | null {
  const requested: Set<AutoMovieHumanoidBone> = new Set();
  for (const frame of frames) {
    if (!frame.limb.endsWith("Leg")) continue;
    const side: AutoMovieHumanSide = frame.limb.startsWith("left")
      ? "left"
      : "right";
    for (const bone of ["UpperLeg", "LowerLeg", "Foot", "Toes"] as const)
      requested.add(`${side}${bone}`);
  }
  if (requested.size === 0) return null;
  const placed: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    body,
    requested,
  );
  const minimum: ReturnType<typeof HumanColliders.prepareMinima> =
    HumanColliders.prepareMinima(body, [requested]);
  const held: prepareSupportHeldLegs.HeldLeg[] = frames.flatMap(
    (
      frame: prepareSupportHeldFrames.IHeldFrames,
    ): prepareSupportHeldLegs.HeldLeg[] =>
      frame.limb === "leftLeg" || frame.limb === "rightLeg" ? [frame.limb] : [],
  );
  return {
    lowest: (
      posture: IAutoMovieMotionHumanPosture,
      read: ReturnType<typeof prepareHumanPoseResolution>,
      project: ReturnType<typeof prepareHumanPostureProjection>,
      near?: IAutoMovieMotionHumanResolveHumanPosture.INear,
    ): number =>
      minimum(
        placed(
          resolveHumanPosture.seeded(
            body,
            posture,
            undefined,
            near,
            read,
            requested,
            project,
          ).pose,
          read(),
        ),
      )[0]!,
    seeds: (
      posture: IAutoMovieMotionHumanPosture,
      read: ReturnType<typeof prepareHumanPoseResolution>,
      project: ReturnType<typeof prepareHumanPostureProjection>,
    ): IAutoMovieMotionHumanResolveHumanPosture.INear => {
      const seeds: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"] =
        resolveHumanPosture.seeded(
          body,
          posture,
          undefined,
          undefined,
          read,
          requested,
          project,
        ).seeds;
      const out: Partial<
        Record<prepareSupportHeldLegs.HeldLeg, IAutoMovieSwivelNear>
      > = {};
      for (const limb of held) {
        const seed: IAutoMovieSwivelSeed | null | undefined = seeds[limb];
        if (seed !== null && seed !== undefined)
          out[limb] = {
            branch: seed.branch,
            swivel: seed.swivel,
            tolerance: hingedArmSwivel.RESOLUTION,
          };
      }
      return out;
    },
    between: (
      a: IAutoMovieMotionHumanResolveHumanPosture.INear,
      b: IAutoMovieMotionHumanResolveHumanPosture.INear,
      w: number,
    ): IAutoMovieMotionHumanResolveHumanPosture.INear => {
      // The swivel the shorter way round on the ends' common branch; a leg
      // whose ends differ in branch, or lack a seed, is swept as before.
      const out: Partial<
        Record<prepareSupportHeldLegs.HeldLeg, IAutoMovieSwivelNear>
      > = {};
      for (const limb of held) {
        const from: IAutoMovieSwivelNear | undefined = a[limb];
        const to: IAutoMovieSwivelNear | undefined = b[limb];
        if (from === undefined || to === undefined || from.branch !== to.branch)
          continue;
        const turn: number = to.swivel - from.swivel;
        const delta: number = turn - 360 * Math.round(turn / 360);
        out[limb] = {
          branch: from.branch,
          swivel: from.swivel + w * delta,
          tolerance: hingedArmSwivel.RESOLUTION,
        };
      }
      return out;
    },
  };
}

/** Companion types of {@link prepareSupportHeldLegs}. */
export namespace prepareSupportHeldLegs {
  /** A held leg's limb goal name: the legs are the limbs a floor lift clears. */
  export type HeldLeg = `${AutoMovieHumanSide}Leg`;

  /** The held legs' readers. */
  export interface IReader {
    /** The lowest collider of the held legs fitted on a posture, world metres. */
    lowest(
      posture: IAutoMovieMotionHumanPosture,
      read: ReturnType<typeof prepareHumanPoseResolution>,
      project: ReturnType<typeof prepareHumanPostureProjection>,
      near?: IAutoMovieMotionHumanResolveHumanPosture.INear,
    ): number;

    /** The held legs' seeds as the resolver fits them on a posture. */
    seeds(
      posture: IAutoMovieMotionHumanPosture,
      read: ReturnType<typeof prepareHumanPoseResolution>,
      project: ReturnType<typeof prepareHumanPostureProjection>,
    ): IAutoMovieMotionHumanResolveHumanPosture.INear;

    /**
     * Two seeds' swivels carried at a share, the shorter way round on a common
     * branch.
     */
    between(
      a: IAutoMovieMotionHumanResolveHumanPosture.INear,
      b: IAutoMovieMotionHumanResolveHumanPosture.INear,
      w: number,
    ): IAutoMovieMotionHumanResolveHumanPosture.INear;
  }
}
