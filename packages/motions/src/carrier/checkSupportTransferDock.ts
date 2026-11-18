import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";

/** A named support rectangle and its owning prop's motion. */
interface Endpoint {
  /** The transfer argument identifying the support. */
  axis: "from" | "to";
  /** Read the owning prop's world frame at a film second. */
  frame(seconds: number): IAutoMovieRigidTransform;
  /** The owning prop's world frame at the transfer start. */
  propFrame: IAutoMovieRigidTransform;
  /** The rectangle's world origin at the transfer start, metres. */
  origin: IAutoMovieVector3;
  /** The rectangle's world orientation at the transfer start. */
  rotation: IAutoMovieQuaternion;
}

/**
 * Check dock alignment on the film clock through trailing touchdown.
 * Co-moving supports must preserve the deck's position and orientation in
 * the platform's frame and keep both rectangles level. Prop readers provide
 * evaluated frames, so admission samples at intervals of at most 1/120 s.
 * The tolerances are the docking contract's 1 mm and 0.1 degrees.
 *
 * @param from The source support and its prop's live world frame reader.
 * @param to The destination support and its prop's live world frame reader.
 * @param start The film second of entry.
 * @param duration Film seconds from entry until trailing touchdown.
 * @param coMoving Compare alignment in the source frame when true, and in the world otherwise.
 * @throws {HumanRefusal} If a checked sample violates the selected dock alignment.
 */
export function checkSupportTransferDock(
  from: Endpoint,
  to: Endpoint,
  start: number,
  duration: number,
  coMoving: boolean,
): void {
  const endpoints: readonly Endpoint[] = [from, to];
  const samples: number = Math.ceil(duration * 120);
  const inversePlatform: IAutoMovieQuaternion = Quaternion.inverse(
    from.propFrame.rotation,
  );
  const inverseDeck: IAutoMovieQuaternion = Quaternion.inverse(
    to.propFrame.rotation,
  );
  const platformToSurface: IAutoMovieVector3 = Vector3.subtract(
    to.origin,
    from.propFrame.position,
  );
  const deckToSurface: IAutoMovieVector3 = Vector3.subtract(
    to.origin,
    to.propFrame.position,
  );
  const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  for (let index: number = 1; index <= samples; ++index) {
    const time: number = start + (index / samples) * duration;
    if (!coMoving) {
      for (const endpoint of endpoints)
        if (!aligned(endpoint.propFrame, endpoint.frame(time)))
          throw new HumanRefusal({
            kind: "base",
            axis: endpoint.axis,
            value: time,
            feasible: null,
            reason: "A support moves before the trailing foot lands",
            fix: "Keep both props stationary through 82 percent of the transfer",
          });
      continue;
    }

    const platform: IAutoMovieRigidTransform = from.frame(time);
    const deck: IAutoMovieRigidTransform = to.frame(time);
    const platformTurn: IAutoMovieQuaternion = Quaternion.multiply(
      platform.rotation,
      inversePlatform,
    );
    const deckTurn: IAutoMovieQuaternion = Quaternion.multiply(
      deck.rotation,
      inverseDeck,
    );
    const platformRotation: IAutoMovieQuaternion = Quaternion.multiply(
      platformTurn,
      from.rotation,
    );
    const deckRotation: IAutoMovieQuaternion = Quaternion.multiply(
      deckTurn,
      to.rotation,
    );
    for (const [endpoint, rotation] of [
      [from, platformRotation],
      [to, deckRotation],
    ] as const)
      if (Quaternion.rotateVector(rotation, up).y < 0.999999)
        throw new HumanRefusal({
          kind: "base",
          axis: endpoint.axis,
          value: time,
          feasible: null,
          reason: "A co-moving support tilts before the trailing foot lands",
          fix: "Keep both support rectangles level through the crossing",
        });

    // Compare the named deck surface carried by each prop's rigid motion.
    // A small turn about a distant pivot can move the rectangle noticeably.
    const expected: IAutoMovieRigidTransform = {
      position: Vector3.add(
        platform.position,
        Quaternion.rotateVector(platformTurn, platformToSurface),
      ),
      rotation: Quaternion.multiply(platformTurn, to.rotation),
    };
    const actual: IAutoMovieRigidTransform = {
      position: Vector3.add(
        deck.position,
        Quaternion.rotateVector(deckTurn, deckToSurface),
      ),
      rotation: deckRotation,
    };
    if (!aligned(expected, actual))
      throw new HumanRefusal({
        kind: "base",
        axis: "to",
        value: time,
        feasible: null,
        reason: "The deck moves relative to the platform during the crossing",
        fix: "Keep the dock gap fixed in the platform frame through trailing touchdown",
      });
  }
}

/** Compare frame origins in metres and their shortest angular difference. */
function aligned(
  expected: IAutoMovieRigidTransform,
  actual: IAutoMovieRigidTransform,
): boolean {
  const delta: IAutoMovieQuaternion = Quaternion.multiply(
    Quaternion.inverse(expected.rotation),
    actual.rotation,
  );
  return (
    Vector3.length(Vector3.subtract(actual.position, expected.position)) <=
      0.001 && Math.hypot(delta.x, delta.y, delta.z) <= Math.sin(Math.PI / 3600)
  );
}
