import { Quaternion, Vector3, AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../../posture/internal/HumanFoot";

/** Posed bones of the ankles, knees and actual sole sockets. */
type Bones = Parameters<typeof HumanFoot.sockets>[1];

/** One retained point of a sole, selected by the posture it bears on. */
interface IPin {
  /** The leg keeping this plant. */
  side: AutoMovieHumanSide;

  /** The point of the sole about which the foot rolls. */
  socket: IAutoMovieMotionHumanFoot.Socket;

  /** The foot's point of contact at the standing key, world metres. */
  point: IAutoMovieVector3;

  /** The toe hinge's available extension, degrees, when its skin bears. */
  extension: number;
}

/** Place the actual landed root and its two foot goals. */
type Write = (
  posture: IAutoMovieMotionHumanPosture,
  bones: Bones,
) => IAutoMovieMotionHumanPosture;

/**
 * Keep both soles fixed while a standing body lowers before it lies down. Each
 * foot pivots on its own bearing socket from the route's first key. The root's
 * existing averaged course and the displayed foot orientations supply the knee
 * poles and foot rotations for the two-bone solver.
 *
 * @param body The body's sole sockets.
 * @param standing The posed standing feet, in world metres.
 * @param landing The relative bones of the first lowered posture.
 * @returns The writer for the initial descent.
 */
export function prepareLieDownFootPins(
  body: IAutoMovieMotionHumanBody,
  standing: Bones,
  landing: Bones,
): Write {
  const feet: IPin[] = SIDES.map((side: AutoMovieHumanSide): IPin => {
    const socket: IAutoMovieMotionHumanFoot.Socket = HumanFoot.sockets(
      body,
      landing,
      side,
    ).reduce(
      (
        lowest: IAutoMovieMotionHumanFoot.ISocket,
        other: IAutoMovieMotionHumanFoot.ISocket,
      ): IAutoMovieMotionHumanFoot.ISocket =>
        other.point.y < lowest.point.y ? other : lowest,
    ).socket;
    return {
      side,
      socket,
      extension:
        socket === "toe"
          ? (AutoMovieEngineKinematics.getConstraint(
              `${side}Toes`,
              body.bones.get(`${side}Toes`)?.constraint ?? null,
            )?.flexion?.max ?? 0)
          : 0,
      point: HumanFoot.sockets(body, standing, side).find(
        (s: IAutoMovieMotionHumanFoot.ISocket): boolean => s.socket === socket,
      )!.point,
    };
  });
  return (
    posture: IAutoMovieMotionHumanPosture,
    bones: Bones,
  ): IAutoMovieMotionHumanPosture => {
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...posture.joints,
    };
    for (const { side, socket, point, extension } of feet) {
      const ankle: IAutoMovieResolvedBone = bones.get(`${side}Foot`)!;
      const knee: IAutoMovieResolvedBone = bones.get(`${side}LowerLeg`)!;
      if (socket === "toe") {
        // The front of the forefoot stays level on its entry point while
        // the heel rises, up to the toe hinge's admitted extension. The
        // ankle retains its actual world rotation about the material toe.
        const toes: number = Math.min(
          extension,
          Math.max(0, -HumanFoot.pitch(ankle.worldRotation)),
        );
        const local: IAutoMovieVector3 = HumanFoot.offset(
          body,
          side,
          socket,
          toes,
        );
        joints[`${side}Toes`] = [toes, 0, 0];
        limbs[`${side}Leg`] = {
          point: Vector3.subtract(
            point,
            Quaternion.rotateVector(ankle.worldRotation, local),
          ),
          rotation: ankle.worldRotation,
          bend: Vector3.add(knee.worldPosition, posture.root),
          planted: true,
        };
        continue;
      }
      const placed: IAutoMovieVector3 = HumanFoot.sockets(
        body,
        bones,
        side,
      ).find(
        (s: IAutoMovieMotionHumanFoot.ISocket): boolean => s.socket === socket,
      )!.point;
      limbs[`${side}Leg`] = {
        point: Vector3.add(
          point,
          Vector3.subtract(ankle.worldPosition, placed),
        ),
        rotation: ankle.worldRotation,
        bend: Vector3.add(knee.worldPosition, posture.root),
        planted: true,
      };
    }
    return { ...posture, joints, limbs };
  };
}

/** Fixed order for the feet of a standing posture. */
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];
