import { Quaternion, Vector3, ViolationCollector } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";

/** The alternatives of `EndpointAxis`'s site. */
type EndpointAxis = "from" | "to";

/** A named support rectangle and its owning prop's motion. */
interface Endpoint {
  /** The transfer argument identifying the support. */
  axis: EndpointAxis;
  /** Read the owning prop's world frame at a film second. */
  frame(seconds: number): IAutoMovieRigidTransform;
  /** The owning prop's world frame at the transfer start. */
  propFrame: IAutoMovieRigidTransform;
  /** The rectangle's world origin at the transfer start, metres. */
  origin: IAutoMovieVector3;
  /** The rectangle's world orientation at the transfer start. */
  rotation: IAutoMovieQuaternion;
  /** The rectangle's local half-width, metres. */
  x: number;
  /** The rectangle's local half-depth, metres. */
  z: number;
}

/**
 * Check dock alignment on the film clock through trailing touchdown. Co-moving
 * supports must preserve the deck's position and orientation in the platform's
 * frame and keep both rectangles level. Prop readers provide evaluated frames,
 * so admission samples at intervals of at most 1/120 s. Co-moving admission
 * allows 1 mm at the deck centre and at all four corners, and 0.1 degrees of
 * relative rotation. Stationary docking uses these bounds at each prop frame.
 *
 * @param from The source support and its prop's live world frame reader.
 * @param to The destination support and its prop's live world frame reader.
 * @param start The film second of entry.
 * @param duration Film seconds from entry until trailing touchdown.
 * @param coMoving Compare alignment in the source frame when true, and in the
 *   world otherwise.
 * @throws {HumanRefusal} If a checked sample violates the selected dock
 *   alignment.
 */
export function checkSupportTransferDock(
  from: Endpoint,
  to: Endpoint,
  start: number,
  duration: number,
  coMoving: boolean,
): void {
  const endpoints: readonly Endpoint[] = [from, to];
  const admission: ViolationCollector = new ViolationCollector();
  for (const endpoint of endpoints) {
    checkFrame(admission, endpoint, endpoint.propFrame, start);
    checkFrame(
      admission,
      endpoint,
      { position: endpoint.origin, rotation: endpoint.rotation },
      start,
    );
    checkLevel(endpoint, endpoint.rotation, start);
  }
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
  const corners: IAutoMovieVector3[] = coMoving
    ? [-to.x, to.x].flatMap((x: number): IAutoMovieVector3[] =>
        [-to.z, to.z].map((z: number): IAutoMovieVector3 => ({ x, y: 0, z })),
      )
    : [];
  for (let index: number = 1; index <= samples; ++index) {
    const time: number = start + (index / samples) * duration;
    const platform: IAutoMovieRigidTransform = from.frame(time);
    const deck: IAutoMovieRigidTransform = to.frame(time);
    if (!coMoving) {
      for (const [endpoint, frame] of [
        [from, platform],
        [to, deck],
      ] as const) {
        checkFrame(admission, endpoint, frame, time);
        if (!aligned(endpoint.propFrame, frame))
          throw new HumanRefusal({
            kind: "base",
            axis: endpoint.axis,
            value: time,
            feasible: null,
            reason: "A support moves before the trailing foot lands",
            fix: "Keep both props stationary through 82 percent of the transfer",
          });
      }
      continue;
    }

    checkFrame(admission, from, platform, time);
    checkFrame(admission, to, deck, time);
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
    checkLevel(from, platformRotation, time);
    checkLevel(to, deckRotation, time);

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
    if (
      !aligned(expected, actual) ||
      corners.some(
        (corner: IAutoMovieVector3): boolean =>
          !closePoint(
            Vector3.add(
              expected.position,
              Quaternion.rotateVector(expected.rotation, corner),
            ),
            Vector3.add(
              actual.position,
              Quaternion.rotateVector(actual.rotation, corner),
            ),
          ),
      )
    )
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

/** Require finite position and unit rotation before quaternion products. */
function checkFrame(
  admission: ViolationCollector,
  endpoint: Endpoint,
  frame: IAutoMovieRigidTransform,
  time: number,
): void {
  admission.unitQuaternion("rotation", frame.rotation, "Support rotation");
  if (admission.items.length !== 0)
    throw new HumanRefusal({
      kind: "base",
      axis: endpoint.axis,
      value: time,
      feasible: null,
      reason: "A support frame has a nonfinite position or a non-unit rotation",
      fix: "Provide finite positions and unit quaternions on the film clock",
    });
}

/** Require the support surface's normal to point up within the level tolerance. */
function checkLevel(
  endpoint: Endpoint,
  rotation: IAutoMovieQuaternion,
  time: number,
): void {
  if (!(Quaternion.rotateVector(rotation, { x: 0, y: 1, z: 0 }).y >= 0.999999))
    throw new HumanRefusal({
      kind: "base",
      axis: endpoint.axis,
      value: time,
      feasible: null,
      reason: "A support rectangle is tilted",
      fix: "Keep both support rectangles level through the crossing",
    });
}

/** Compare positions in world metres at the docking tolerance. */
function closePoint(
  expected: IAutoMovieVector3,
  actual: IAutoMovieVector3,
): boolean {
  return Vector3.length(Vector3.subtract(actual, expected)) <= 0.001;
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
    closePoint(expected.position, actual.position) &&
    Math.hypot(delta.x, delta.y, delta.z) <= Math.sin(Math.PI / 3600)
  );
}
