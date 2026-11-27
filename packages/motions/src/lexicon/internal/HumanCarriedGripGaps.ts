import { Quaternion, Vector3, AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanSide, AutoMovieHumanoidBone, AutoMovieHumanoidRegion, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanCarried, IAutoMovieMotionHumanCarriedCouplingPose, IAutoMovieResolvedBone, IAutoMovieVector3 } from "@automovie/interface";

import { HumanHandTarget } from "../../posture/internal/HumanHandTarget";
import type { HumanCarriedCouplingFit } from "./HumanCarriedCouplingFit";
import { HumanCarriedCouplingPose } from "./HumanCarriedCouplingPose";
import { HumanCarriedStraddle } from "./HumanCarriedStraddle";
import { HumanCarriedWristCircle } from "./HumanCarriedWristCircle";

type Bones = ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
type HeldRegion = AutoMovieHumanoidRegion | null;
type Grip = readonly [HeldRegion, HeldRegion];
type IRead = HumanCarriedCouplingFit.IRead;
type Gaps = (reading: IRead) => number[];

/** The current gap for one bearing arm at a known surface. */
type Gap = (
  bones: Bones,
  place: IAutoMovieMotionHumanCarriedCouplingPose.IHold,
) => number;

/**
 * Measure the current occupied wrists and, for a straddle, the knees against
 * their actual support.
 */
export namespace HumanCarriedGripGaps {
  /**
   * A second planted bearer's support height fixes one further world
   * coordinate.
   */
  export interface IPlantedContact {
    /** Region on the borne body carried by this second support. */
    region: AutoMovieHumanoidRegion;
    /** The second bearer's resting region height above the common floor, metres. */
    height: number;
  }
  /**
   * Prepare the fixed palm geometry once for every active hand in the key-pose
   * fit.
   */
  export function prepare(
    bearer: IAutoMovieMotionHumanBody,
    borne: IAutoMovieMotionHumanBody,
    row: IAutoMovieMotionHumanCarried.IRow,
    grips: Grip,
    sides: readonly AutoMovieHumanSide[],
    planted?: IPlantedContact,
  ): Gaps {
    const reach: Gap[] = sides.map(
      (side: AutoMovieHumanSide): Gap =>
        prepareGap(bearer, side, row.holds[side === "left" ? 0 : 1]?.shape),
    );

    return (reading: IRead): number[] => {
      const { fit, mine, theirs }: IRead = reading;
      const gaps: number[] = sides.map(
        (side: AutoMovieHumanSide, index: number): number => {
          const k: number = side === "left" ? 0 : 1;
          const surface: IAutoMovieMotionHumanBody["surfaces"]["regions"][AutoMovieHumanoidRegion] =
            borne.surfaces.regions[grips[k]!];
          const local: IAutoMovieMotionHumanCarriedCouplingPose.IHold =
            AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace(
              surface,
              mine.get(surface.bone)!,
            );
          const fingers: IAutoMovieVector3 | undefined = row.holds[k]?.fingers;
          return reach[index]!(theirs, {
            point: fit.place(local.point),
            normal: Quaternion.rotateVector(fit.turn, local.normal),
            ...(fingers === undefined
              ? {}
              : {
                  forward: Quaternion.rotateVector(
                    fit.turn,
                    Quaternion.rotateVector(
                      mine.get(surface.bone)!.worldRotation,
                      fingers,
                    ),
                  ),
                }),
          });
        },
      );
      if (planted !== undefined) {
        const local: IAutoMovieVector3 = HumanCarriedCouplingPose.region(
          borne,
          mine,
          planted.region,
        );
        const height: number = fit.place(local).y - planted.height;
        gaps.push(height, -height);
      }
      return row.straddles === true
        ? [...gaps, ...HumanCarriedStraddle(bearer, borne, reading)]
        : gaps;
    };
  }
  /**
   * Distance in metres beyond the bearing arm's real wrist reach, or at most
   * zero within reach.
   */
  export function gap(
    bearer: IAutoMovieMotionHumanBody,
    bones: Bones,
    side: AutoMovieHumanSide,
    place: IAutoMovieMotionHumanCarriedCouplingPose.IHold,
    shape?: IAutoMovieMotionHumanCarried.IHold["shape"],
  ): number {
    return prepareGap(bearer, side, shape)(bones, place);
  }

  /**
   * The changing palm normal places its wrist while the fixed hand geometry is
   * shared.
   */
  function prepareGap(
    bearer: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    shape?: IAutoMovieMotionHumanCarried.IHold["shape"],
  ): Gap {
    const palm: ReturnType<typeof HumanHandTarget.prepareMoving>["wrist"] =
      HumanHandTarget.prepareMoving(
        bearer,
        side,
        shape === undefined ? undefined : { shape },
      ).wrist;
    const arm: number = bearer.measure.upperArm + bearer.measure.forearm;
    return (
      bones: Bones,
      place: IAutoMovieMotionHumanCarriedCouplingPose.IHold,
    ): number => {
      const wrist: IAutoMovieVector3 = palm(
        { root: { x: 0, y: 0, z: 0 }, yaw: 0 },
        place,
        place.forward,
      ).point;
      const shoulder: IAutoMovieVector3 = bones.get(
        `${side}UpperArm`,
      )!.worldPosition;
      if (place.forward !== undefined)
        return Vector3.distance(wrist, shoulder) - arm;
      return (
        HumanCarriedWristCircle(place.point, place.normal, wrist, shoulder)
          .distance - arm
      );
    };
  }
}
