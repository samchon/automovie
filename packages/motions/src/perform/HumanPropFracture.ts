import {
  AutoMovieGravity,
  Quaternion,
  physicalShapeBounds,
  projectileAt,
} from "@automovie/engine";
import type {
  IAutoMovieInteractionEvent,
  IAutoMovieMotionHumanObject,
  IAutoMovieMotionHumanPropFracture,
  IAutoMoviePhysicalShape,
  IAutoMovieProjectile,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Prepare one authored fracture from the performance's observed hit.
 * Detached pieces preserve their displayed orientation and fly under gravity
 * until their lowest collider point reaches the flat floor. The remainder
 * continues on the original prop carrier.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the observed contact, authored split, fixed orientation and first floor support.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the observed hit clock and displayed model transform, rotates the provider's local launch velocities into world space, and solves the first downward floor contact of each fixed-orientation piece from its actual world collider minimum and uniform gravity.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Calls the model's split once, then prepares the dated contact and one sampler per detached piece.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The author supplies the fracture budget. The plan adds no material assumptions, bounce, spin, fragment collisions or shape approximations.
 * @evidence contracts/development/implementation.md#efficient-algorithms Plan work is the provider's split plus one bounds traversal per piece. A query reads one carrier frame when a remainder exists and one closed-form sample per detached piece still in flight.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Both the displayed launch frame and each fragment's flight and floor stop are prepared once. Airborne queries reuse the engine projectile reader.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains its contact, the carrier reader and its pieces' flight and rest data. Releasing the plan releases these records.
 */
export function HumanPropFracture<
  Piece extends IAutoMovieMotionHumanObject.IModel,
>(
  request: IAutoMovieMotionHumanPropFracture.IRequest<Piece>,
  hit: IAutoMovieInteractionEvent,
  carrier: (seconds: number) => IAutoMovieRigidTransform,
): IAutoMovieMotionHumanPropFracture.IPlan<Piece> | null {
  const split: ReturnType<typeof request.model.broken> = request.model.broken(
    request.budget,
  );
  if (split === null) return null;

  const start: number = hit.time;
  const frame: IAutoMovieRigidTransform = carrier(start);
  const origin: IAutoMovieRigidTransform = {
    position: { ...frame.position },
    rotation: { ...frame.rotation },
  };
  const remainder: Piece | null = split.remainder;
  const contact: IAutoMovieInteractionEvent = {
    ...hit,
    id: `${hit.id}:fracture`,
    kind: "contact",
    source: "impactOutput",
  };
  const detached: {
    fragment: string;
    model: Piece;
    at: (seconds: number) => IAutoMovieRigidTransform;
  }[] = split.fragments.map(
    ({ id, archetype, velocity }: (typeof split.fragments)[number]) => ({
      fragment: id,
      model: archetype,
      at: flight(archetype, origin, velocity),
    }),
  );
  return {
    contact,
    at(
      seconds: number,
    ): readonly IAutoMovieMotionHumanPropFracture.IPlaced<Piece>[] | null {
      if (!Number.isFinite(seconds))
        throw new RangeError("A fracture frame requires finite film seconds.");
      if (seconds < start) return null;

      const placed: IAutoMovieMotionHumanPropFracture.IPlaced<Piece>[] = [];
      if (remainder !== null)
        placed.push({
          fragment: null,
          model: remainder,
          frame: carrier(seconds),
        });
      for (const piece of detached)
        placed.push({
          fragment: piece.fragment,
          model: piece.model,
          frame: piece.at(seconds - start),
        });
      return placed;
    },
  };
}

/** Prepare world gravity flight and the inelastic floor stop of one fragment. */
function flight(
  model: IAutoMovieMotionHumanObject.IModel,
  frame: IAutoMovieRigidTransform,
  localVelocity: IAutoMovieVector3,
): (seconds: number) => IAutoMovieRigidTransform {
  const shapes: readonly IAutoMoviePhysicalShape[] = model.shapes?.() ?? [];
  let height: number = Infinity;
  for (const shape of shapes)
    height = Math.min(height, physicalShapeBounds(frame, shape).min.y);
  if (!Number.isFinite(height) || height < 0)
    throw new RangeError(
      "A departing fragment needs finite colliders on or above the floor at the fracture.",
    );

  const velocity: IAutoMovieVector3 = Quaternion.rotateVector(
    frame.rotation,
    localVelocity,
  );
  const projectile: IAutoMovieProjectile = {
    origin: frame.position,
    velocity,
    gravity: AutoMovieGravity.DOWN,
  };

  // The positive root of h + vy*t - g*t²/2. Rationalize the descending
  // branch to avoid subtracting nearly equal speeds near the floor.
  const gravity: number = AutoMovieGravity.STANDARD;
  const impactSpeed: number = Math.hypot(
    velocity.y,
    Math.sqrt(height) * Math.sqrt(2 * gravity),
  );
  const stop: number =
    velocity.y < 0
      ? height / (impactSpeed / 2 - velocity.y / 2)
      : velocity.y / gravity + impactSpeed / gravity;
  const landed: IAutoMovieVector3 = projectileAt(projectile, stop).position;
  if (![landed.x, landed.y, landed.z].every(Number.isFinite))
    throw new RangeError("A departing fragment needs a finite floor position.");
  const rest: IAutoMovieVector3 = {
    ...landed,
    y: frame.position.y - height,
  };
  return (seconds: number): IAutoMovieRigidTransform => ({
    position:
      seconds < stop ? projectileAt(projectile, seconds).position : { ...rest },
    rotation: { ...frame.rotation },
  });
}
