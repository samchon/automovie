import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditContact } from "../audit/AutoMovieMotionHumanAuditContact";
import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { HumanBalance } from "../everyday/HumanBalance";
import { HumanFrame } from "../posture/HumanFrame";
import { lowerHumanPosture } from "../posture/lowerHumanPosture";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { StrikingStance } from "../striking/StrikingStance";
import { StrikingTarget } from "../striking/StrikingTarget";
import { staggerBounds } from "./staggerBounds";

/** The record of `IBendingShiftMore2`'s site. */
type IBendingShiftMore2 = {
  pitch: number;
  roll: number;
};

/** The record of `IBendingShiftMore`'s site. */
type IBendingShiftMore = {
  pitch: number;
  roll: number;
};

/** The alternatives of `BendingEntryResult`'s site. */
type BendingEntryResult = "pitch" | "roll";

/**
 * The body readings a stagger's legs and trunk share (`StaggerFeet`,
 * `staggerAdmission`, `stagger`): the trunk's shift of the centre of mass, the
 * knee's hint and the share of a swing a foot rises in.
 */
export namespace staggerKnots {
  /**
   * The centre of mass's shift per sine of the trunk's tilt about the hips, on
   * the entry's feet: the posture tilted `REFERENCE` degrees in pitch and in
   * roll (`AutoMovieMotionHumanLean.pivot`) and its centre of mass read
   * (`HumanBalance.centre`).
   *
   * @param body The body.
   * @param entry The posture the push meets.
   * @param source Optional same-body FK source borrowed from the surrounding
   *   synchronous entry observation.
   * @param projector Optional genuine same-body ROM metadata borrowed by that
   *   same operation.
   * @returns The horizontal shift per sine of the pitch and of the roll,
   *   metres.
   */
  export function bending(
    body: IAutoMovieMotionHumanActionContext["body"],
    entry: IAutoMovieMotionHumanActionContext["entry"],
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
    projector?: ReturnType<typeof prepareHumanPostureProjection>,
  ): Record<BendingEntryResult, IAutoMovieVector3> {
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(source);
    const projection: ReturnType<typeof prepareHumanPostureProjection> =
      projector ?? prepareHumanPostureProjection(body);
    const centreOf: ReturnType<typeof HumanBalance.prepareCentre> =
      HumanBalance.prepareCentre(body);
    const standing: IAutoMovieMotionHumanPosture = {
      ...entry.posture,
      limbs: {
        ...entry.posture.limbs,
        ...StrikingStance.legs(body, StrikingTarget.feet(entry)),
      },
    };
    const upright: IAutoMovieVector3 = centreOf(
      standing,
      resolution,
      projection,
    );
    const sine: number = Math.sin((staggerBounds.REFERENCE * Math.PI) / 180);
    const shift: (more: IBendingShiftMore) => IAutoMovieVector3 = (
      more: IBendingShiftMore2,
    ): IAutoMovieVector3 => {
      const tilted: IAutoMovieMotionHumanPosture =
        AutoMovieMotionHumanLean.pivot(body, standing, more);
      const centre: IAutoMovieVector3 = centreOf(
        {
          ...tilted,
          root: lowerHumanPosture(
            body,
            tilted,
            lowerHumanPosture.KNEE,
            resolution,
          ).root,
        },
        resolution,
        projection,
      );
      return {
        x: (centre.x - upright.x) / sine,
        y: 0,
        z: (centre.z - upright.z) / sine,
      };
    };
    return {
      pitch: shift({ pitch: staggerBounds.REFERENCE, roll: 0 }),
      roll: shift({ pitch: 0, roll: staggerBounds.REFERENCE }),
    };
  }

  /**
   * The point a leg's knee bends toward: ahead over its foot's heading from
   * where the knee rests under the root.
   *
   * @param body The body.
   * @param root The lowered root, world metres.
   * @param yaw The pelvis's heading, degrees.
   * @param side The leg.
   * @param heading The foot's heading, degrees.
   * @returns World metres.
   */
  export function kneePole(
    body: IAutoMovieMotionHumanActionContext["body"],
    root: IAutoMovieVector3,
    yaw: number,
    side: AutoMovieHumanSide,
    heading: number,
  ): IAutoMovieVector3 {
    return HumanFrame.point(
      {
        origin: HumanFrame.point(
          { origin: root, yaw },
          body.rest.get(`${side}LowerLeg`)!,
        ),
        yaw: heading,
      },
      { x: 0, y: 0, z: 1 },
    );
  }

  /**
   * The share of a swing a stepping foot takes to rise clear of the floor: the
   * share of a walking swing its lift takes to set down from the floor's
   * contact height (`walkFoot.prepareSwing`).
   *
   * @param body The body.
   * @returns The share.
   */
  export function risingOf(
    body: IAutoMovieMotionHumanActionContext["body"],
  ): number {
    return (
      Math.asin(
        Math.sqrt(
          AutoMovieMotionHumanAuditContact.HEIGHT /
            (staggerBounds.LIFT * body.measure.hipHeight),
        ),
      ) / Math.PI
    );
  }
}
