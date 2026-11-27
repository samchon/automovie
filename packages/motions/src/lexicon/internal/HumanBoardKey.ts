import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieAffordance, IAutoMovieHumanoidSurfaces, IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanBoard, IAutoMovieMotionHumanPerformerReader, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanPropReader, IAutoMovieMotionHumanSeated, IAutoMovieRigidTransform, IAutoMovieVector3 } from "@automovie/interface";

import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { seated } from "../../everyday/internal/seated";
import { sitPlace } from "../../everyday/internal/sitPlace";
import type { HumanMountedFrame } from "./HumanMountedFrame";
import { hangMountedLeg } from "./hangMountedLeg";

/*
 * A boarding's seated key in the seat's frame: upright and astride with the
 * legs hanging (`hangMountedLeg`), seated on the seat's declared depth, and,
 * for a passenger boarding behind a partner, set back along the seat's forward
 * axis until the front of the pelvis meets the partner's seat region as the
 * partner is displayed at the landing.
 * Parameter context: The boarding's context.
 * Parameter support: The carrier's reader.
 * Parameter carrier: The seat contact's moving frame.
 * Parameter from: The entry posture in the seat's frame.
 * Parameter flight: The flight's length, seconds.
 * Returns: The seat, the pillion's set-back and the key.
 */
export function HumanBoardKey(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanBoard>,
  support: IAutoMovieMotionHumanPropReader,
  carrier: HumanMountedFrame.Reader,
  from: IAutoMovieMotionHumanPosture,
  flight: number,
): HumanBoardKey.IKey {
  // The seated key, upright and astride with the legs hanging, in the seat's frame.
  const declared: IAutoMovieAffordance | undefined =
    support.prop.affordances?.find(
      (a: IAutoMovieAffordance): boolean => a.id === context.params.seat,
    );
  const seat: IAutoMovieMotionHumanSeated.ISeat = {
    at: { x: 0, y: 0, z: 0 },
    yaw: 0,
    astride: true,
    ...(declared?.depth === undefined ? {} : { depth: declared.depth }),
  };
  const upright: (typeof sitPlace.BACKS)["upright"] = sitPlace.BACKS.upright;
  const sat: (at: IAutoMovieVector3) => IAutoMovieMotionHumanPosture = (
    at: IAutoMovieVector3,
  ): IAutoMovieMotionHumanPosture => ({
    ...from,
    root: seated.root(
      context.body,
      seated.point(context.body, { ...seat, at }),
      {
        yaw: 0,
        pitch: upright.pitch,
        roll: 0,
      },
    ),
    yaw: 0,
    pitch: upright.pitch,
    roll: 0,
    joints: { ...upright.joints },
    limbs: {},
  });
  // A passenger boarding behind a partner (a pillion) sits directly behind
  // them, the front of the pelvis against the partner's seat, along the
  // seat's own forward axis: the bodies' own surfaces place it, not the
  // seat's point alone, so the hands reach the partner's waist on bent
  // elbows.
  const behind: IAutoMovieVector3 = ((): IAutoMovieVector3 => {
    const partner: string | undefined = context.params.hand?.partner;
    if (partner === undefined) return { x: 0, y: 0, z: 0 };
    const other: IAutoMovieMotionHumanPerformerReader =
      context.performer(partner);
    const landing: IAutoMovieRigidTransform = carrier(context.start + flight);
    const frame: IAutoMovieHumanoidSurfaces.IFrame =
      other.body.surfaces.regions.seat;
    const back: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      AutoMovieEngineQuaternion.inverse(landing.rotation),
      AutoMovieEngineVector3.subtract(
        AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace(
          frame,
          other
            .bones(
              context.start + flight,
              new Set<AutoMovieHumanoidBone>([frame.bone]),
            )
            .get(frame.bone)!,
        ).point,
        landing.position,
      ),
    );
    const front: IAutoMovieVector3 = HumanTrunk.region(
      context.body,
      sat({ x: 0, y: 0, z: 0 }),
      "groin",
    ).point;
    return { x: 0, y: 0, z: back.z - front.z };
  })();
  const sitting: IAutoMovieMotionHumanPosture = sat(behind);
  const key: IAutoMovieMotionHumanPosture = {
    ...sitting,
    limbs: {
      leftLeg: hangMountedLeg(context.body, sitting, "left"),
      rightLeg: hangMountedLeg(context.body, sitting, "right"),
    },
  };
  return { seat, behind, key };
}

/*
 * The records of HumanBoardKey.
 */
export namespace HumanBoardKey {
  /*
   * A boarding's seated key.
   */
  export interface IKey {
    /*
     * The seat, at the seat frame's origin, astride.
     */
    seat: IAutoMovieMotionHumanSeated.ISeat;

    /*
     * The pillion's set-back along the seat, seat-frame metres; zero alone.
     */
    behind: IAutoMovieVector3;

    /*
     * The seated key, in the seat's frame.
     */
    key: IAutoMovieMotionHumanPosture;
  }
}
