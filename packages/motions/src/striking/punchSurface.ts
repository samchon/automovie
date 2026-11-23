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
 * - `backfist` swings the back of the fist (the `handBack` region) out across
 *   the line, the fingers forward and the back of the hand toward its travel.
 * - `verticalFist` lands the knuckles along the line with the fist upright,
 *   the palm in, wing chun's centreline punch.
 * - `hammerfist` brings the fist's little-finger edge down, the fist upright
 *   with the palm in; the edge is read halfway from the wrist to the little
 *   finger's knuckle on the rest skeleton, inside the hand by its soft
 *   tissue.
 *
 * @param body The body.
 * @param side The striking hand.
 * @param technique The technique.
 * @param line The horizontal unit line to the target.
 * @param outward The horizontal unit direction away from the body on the striking hand's side.
 * @param straight The unit direction from the shoulder to the target.
 * @returns The surface at contact.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each technique's surface, travel and hand attitude with its source and the hammerfist's approximation.
 * @evidence contracts/development/implementation.md#principled-implementation The hand's attitude aligns the rest finger axis and palm normal to the technique's directions (`StrikingBody.fist`), and the surface is the body's own socket, region or rest joint carried by that rotation.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per technique, each a direction, a rotation and a surface.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every surface is read from the canonical body; the hammerfist's edge is stated as a joint-centre approximation.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
        Vector3.normalize(
          Vector3.add(Vector3.scale(outward, -0.8), Vector3.scale(line, 0.6)),
        ),
        StrikingBody.fist(body, side, straight, down),
        fist,
      );
    case "uppercut": {
      const direction: IAutoMovieVector3 = Vector3.normalize(
        Vector3.add(Vector3.scale(up, 0.8), Vector3.scale(line, 0.6)),
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
      const direction: IAutoMovieVector3 = Vector3.normalize(
        Vector3.add(Vector3.scale(outward, 0.8), Vector3.scale(line, 0.6)),
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
        Vector3.normalize(
          Vector3.add(Vector3.scale(down, 0.8), Vector3.scale(line, 0.6)),
        ),
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

/**
 * Companion types of {@link punchSurface}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three members and their frames and units.
 * @evidence contracts/development/design.md#principled-representation World unit direction, world rotation and a world offset in metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What the punch's contact reads of a technique.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface vector and quaternion.
 */
export namespace punchSurface {
  /** How far a palm heel's fingers lean back toward the striker per unit up, the wrist extended (provisional). */
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
