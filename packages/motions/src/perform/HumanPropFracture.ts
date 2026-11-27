import { AutoMovieGravity, Quaternion, AutoMovieEnginePhysics, AutoMovieAir } from "@automovie/engine";
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
 * Prepare one authored fracture from the performance's observed hit. Detached
 * pieces preserve their displayed orientation and fly under gravity until their
 * lowest collider point reaches the flat floor. The remainder continues on the
 * original prop carrier.
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
    height = Math.min(height, AutoMovieEnginePhysics.physicalShapeBounds(frame, shape).min.y);
  if (!(height >= 0 && height < Infinity))
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
  const landed: IAutoMovieVector3 = AutoMovieAir.projectileAt(projectile, stop).position;
  const rest: IAutoMovieVector3 = {
    ...landed,
    y: frame.position.y - height,
  };
  return (seconds: number): IAutoMovieRigidTransform => ({
    position:
      seconds < stop ? AutoMovieAir.projectileAt(projectile, seconds).position : { ...rest },
    rotation: { ...frame.rotation },
  });
}
