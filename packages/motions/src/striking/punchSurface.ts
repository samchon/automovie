import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPunch,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { StrikingBody } from "./StrikingBody";

/**
 * How a punch technique meets its target: the unit direction the striking
 * surface travels at contact, the hand's world rotation and the surface's
 * offset from the wrist in world metres.
 *
 * - `straight` lands the knuckles (`fist` socket) along the line, palm down;
 *   `hook` arrives across the line, palm down; `uppercut` rises, palm toward
 *   the puncher (IBA coaching manual pp. 42 to 45).
 * - `palmHeel` lands the open palm (`palm` socket, the palm's centre a few
 *   centimetres above its heel) along the line, the fingers up and the palm
 *   toward the target, which extends the wrist.
 * - `backfist` swings the back of the fist (the `handBack` region) out across the
 *   line, the fingers forward and the back of the hand toward its travel.
 * - `verticalFist` lands the knuckles along the line with the fist upright, the
 *   palm in, wing chun's centreline punch.
 * - `hammerfist` brings the fist's little-finger edge down, the fist upright with
 *   the palm in; the edge is read halfway from the wrist to the little finger's
 *   knuckle on the rest skeleton, inside the hand by its soft tissue.
 *
 * @param body The body.
 * @param side The striking hand.
 * @param technique The technique.
 * @param line The horizontal unit line to the target.
 * @param outward The horizontal unit direction away from the body on the
 *   striking hand's side.
 * @param straight The unit direction from the shoulder to the target.
 * @returns The surface at contact.
 */
export function punchSurface(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  technique: IAutoMovieMotionHumanPunch.Technique,
  line: IAutoMovieVector3,
  outward: IAutoMovieVector3,
  straight: IAutoMovieVector3,
): punchSurface.ISurface {
  const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const down: IAutoMovieVector3 = { x: 0, y: -1, z: 0 };
  const fist: IAutoMovieVector3 =
    body.surfaces.sockets[side === "left" ? "fistLeft" : "fistRight"].point;
  const placed = (
    direction: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion,
    surface: IAutoMovieVector3,
  ): punchSurface.ISurface => ({
    direction,
    rotation,
    socket: Quaternion.rotateVector(rotation, surface),
  });
  switch (technique) {
    case "straight":
      return placed(
        straight,
        StrikingBody.fist(body, side, straight, down),
        fist,
      );
    case "hook":
      return placed(
        punchSurface.direction("hook", line, outward, straight),
        StrikingBody.fist(body, side, straight, down),
        fist,
      );
    case "uppercut": {
      const direction: IAutoMovieVector3 = punchSurface.direction(
        "uppercut",
        line,
        outward,
        straight,
      );
      return placed(
        direction,
        StrikingBody.fist(body, side, direction, Vector3.scale(line, -1)),
        fist,
      );
    }
    case "verticalFist":
      return placed(
        straight,
        StrikingBody.fist(body, side, straight, Vector3.scale(outward, -1)),
        fist,
      );
    case "palmHeel":
      // The wrist extended: the fingers lean back toward the striker so the
      // open hand stands clear of the face the heel of the palm meets.
      return placed(
        straight,
        StrikingBody.fist(
          body,
          side,
          Vector3.normalize(
            Vector3.subtract(
              up,
              Vector3.scale(straight, punchSurface.PALM_TILT),
            ),
          ),
          straight,
        ),
        body.surfaces.sockets[side === "left" ? "palmLeft" : "palmRight"].point,
      );
    case "backfist": {
      const direction: IAutoMovieVector3 = punchSurface.direction(
        "backfist",
        line,
        outward,
        straight,
      );
      return placed(
        direction,
        StrikingBody.fist(body, side, line, Vector3.scale(direction, -1)),
        body.surfaces.regions[
          side === "left" ? "handBackLeft" : "handBackRight"
        ].point,
      );
    }
    case "hammerfist":
      return placed(
        punchSurface.direction("hammerfist", line, outward, straight),
        StrikingBody.fist(body, side, line, Vector3.scale(outward, -1)),
        Vector3.scale(
          Vector3.subtract(
            body.rest.get(`${side}LittleProximal`)!,
            body.rest.get(`${side}Hand`)!,
          ),
          0.5,
        ),
      );
  }
}

/** Companion types of {@link punchSurface}. */
export namespace punchSurface {
  /**
   * The direction a punch's striking surface drives: along the straight line
   * for the straight, vertical-fist and palm-heel punches; and blended 0.8 to
   * 0.6 with the line for the others: inward for a hook, up for an uppercut,
   * outward for a backfist and down for a hammerfist.
   *
   * @param technique The punch.
   * @param line The strike's line, horizontal unit.
   * @param outward The punching side's outward, horizontal unit.
   * @param straight The straight line from the fist to the target, unit.
   * @returns The unit direction.
   */
  export function direction(
    technique: IAutoMovieMotionHumanPunch.Technique,
    line: IAutoMovieVector3,
    outward: IAutoMovieVector3,
    straight: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const across: IAutoMovieVector3 | null =
      technique === "hook"
        ? Vector3.scale(outward, -1)
        : technique === "uppercut"
          ? { x: 0, y: 1, z: 0 }
          : technique === "backfist"
            ? outward
            : technique === "hammerfist"
              ? { x: 0, y: -1, z: 0 }
              : null;
    return across === null
      ? straight
      : Vector3.normalize(
          Vector3.add(Vector3.scale(across, 0.8), Vector3.scale(line, 0.6)),
        );
  }

  /**
   * How far a palm heel's fingers lean back toward the striker per unit up, the
   * wrist extended (provisional).
   */
  export const PALM_TILT: number = 0.6;

  /** A technique's striking surface at contact. */
  export interface ISurface {
    /** The unit direction the surface travels at contact, world. */
    direction: IAutoMovieVector3;

    /** The hand's world rotation at contact. */
    rotation: IAutoMovieQuaternion;

    /** The striking surface's offset from the wrist, world metres. */
    socket: IAutoMovieVector3;
  }
}
