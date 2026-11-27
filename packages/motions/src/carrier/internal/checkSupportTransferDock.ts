import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEngineViolationCollector } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";

/*
 * Check dock alignment on the film clock through trailing touchdown. Co-moving
 * supports must preserve the deck's position and orientation in the platform's
 * frame and keep both rectangles level. Prop readers provide evaluated frames,
 * so admission samples at intervals of at most 1/120 s. Co-moving admission
 * allows 1 mm at the deck centre and at all four corners, and 0.1 degrees of
 * relative rotation. Stationary docking uses these bounds at each prop frame.
 * Parameter from: The source support and its prop's live world frame reader.
 * Parameter to: The destination support and its prop's live world frame reader.
 * Parameter start: The film second of entry.
 * Parameter duration: Film seconds from entry until trailing touchdown.
 * Parameter coMoving: Compare alignment in the source frame when true, and in the
 * world otherwise.
 * If a checked sample violates the selected dock
 * alignment.
 */
export function checkSupportTransferDock(
  from: Endpoint,
  to: Endpoint,
  start: number,
  duration: number,
  coMoving: boolean,
): void {
  const endpoints: readonly Endpoint[] = [from, to];
  const admission: AutoMovieEngineViolationCollector = new AutoMovieEngineViolationCollector();
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
  const inversePlatform: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(
    from.propFrame.rotation,
  );
  const inverseDeck: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(
    to.propFrame.rotation,
  );
  const platformToSurface: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
    to.origin,
    from.propFrame.position,
  );
  const deckToSurface: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
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
          throw new AutoMovieMotionHumanRefusal({
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
    const platformTurn: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
      platform.rotation,
      inversePlatform,
    );
    const deckTurn: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
      deck.rotation,
      inverseDeck,
    );
    const platformRotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
      platformTurn,
      from.rotation,
    );
    const deckRotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
      deckTurn,
      to.rotation,
    );
    checkLevel(from, platformRotation, time);
    checkLevel(to, deckRotation, time);

    // Compare the named deck surface carried by each prop's rigid motion.
    // A small turn about a distant pivot can move the rectangle noticeably.
    const expected: IAutoMovieRigidTransform = {
      position: AutoMovieEngineVector3.add(
        platform.position,
        AutoMovieEngineQuaternion.rotateVector(platformTurn, platformToSurface),
      ),
      rotation: AutoMovieEngineQuaternion.multiply(platformTurn, to.rotation),
    };
    const actual: IAutoMovieRigidTransform = {
      position: AutoMovieEngineVector3.add(
        deck.position,
        AutoMovieEngineQuaternion.rotateVector(deckTurn, deckToSurface),
      ),
      rotation: deckRotation,
    };
    if (
      !aligned(expected, actual) ||
      corners.some(
        (corner: IAutoMovieVector3): boolean =>
          !closePoint(
            AutoMovieEngineVector3.add(
              expected.position,
              AutoMovieEngineQuaternion.rotateVector(expected.rotation, corner),
            ),
            AutoMovieEngineVector3.add(
              actual.position,
              AutoMovieEngineQuaternion.rotateVector(actual.rotation, corner),
            ),
          ),
      )
    )
      throw new AutoMovieMotionHumanRefusal({
        kind: "base",
        axis: "to",
        value: time,
        feasible: null,
        reason: "The deck moves relative to the platform during the crossing",
        fix: "Keep the dock gap fixed in the platform frame through trailing touchdown",
      });
  }
}

/*
 * The alternatives of `EndpointAxis`'s site.
 */
type EndpointAxis = "from" | "to";

/*
 * A named support rectangle and its owning prop's motion.
 */
interface Endpoint {
  /*
   * The transfer argument identifying the support.
   */
  axis: EndpointAxis;
  /*
   * Read the owning prop's world frame at a film second.
   */
  frame(seconds: number): IAutoMovieRigidTransform;
  /*
   * The owning prop's world frame at the transfer start.
   */
  propFrame: IAutoMovieRigidTransform;
  /*
   * The rectangle's world origin at the transfer start, metres.
   */
  origin: IAutoMovieVector3;
  /*
   * The rectangle's world orientation at the transfer start.
   */
  rotation: IAutoMovieQuaternion;
  /*
   * The rectangle's local half-width, metres.
   */
  x: number;
  /*
   * The rectangle's local half-depth, metres.
   */
  z: number;
}

/*
 * Require finite position and unit rotation before quaternion products.
 */
function checkFrame(
  admission: AutoMovieEngineViolationCollector,
  endpoint: Endpoint,
  frame: IAutoMovieRigidTransform,
  time: number,
): void {
  admission.unitQuaternion("rotation", frame.rotation, "Support rotation");
  if (admission.items.length !== 0)
    throw new AutoMovieMotionHumanRefusal({
      kind: "base",
      axis: endpoint.axis,
      value: time,
      feasible: null,
      reason: "A support frame has a nonfinite position or a non-unit rotation",
      fix: "Provide finite positions and unit quaternions on the film clock",
    });
}

/*
 * Require the support surface's normal to point up within the level tolerance.
 */
function checkLevel(
  endpoint: Endpoint,
  rotation: IAutoMovieQuaternion,
  time: number,
): void {
  if (!(AutoMovieEngineQuaternion.rotateVector(rotation, { x: 0, y: 1, z: 0 }).y >= 0.999999))
    throw new AutoMovieMotionHumanRefusal({
      kind: "base",
      axis: endpoint.axis,
      value: time,
      feasible: null,
      reason: "A support rectangle is tilted",
      fix: "Keep both support rectangles level through the crossing",
    });
}

/*
 * Compare positions in world metres at the docking tolerance.
 */
function closePoint(
  expected: IAutoMovieVector3,
  actual: IAutoMovieVector3,
): boolean {
  return AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(actual, expected)) <= 0.001;
}

/*
 * Compare frame origins in metres and their shortest angular difference.
 */
function aligned(
  expected: IAutoMovieRigidTransform,
  actual: IAutoMovieRigidTransform,
): boolean {
  const delta: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
    AutoMovieEngineQuaternion.inverse(expected.rotation),
    actual.rotation,
  );
  return (
    closePoint(expected.position, actual.position) &&
    Math.hypot(delta.x, delta.y, delta.z) <= Math.sin(Math.PI / 3600)
  );
}
