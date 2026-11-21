import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanPrecisionDeck,
  IAutoMoviePhysicalFrame,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/** World up, the axis of an upright pin. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/**
 * Credit the pinfall of a baked bowling delivery: the pins down at the end
 * of its cache, in rack order.
 *
 * USBC counts a pin knocked down or off the deck; a pin moved but standing
 * does not count. A pin is down when its axis leans past its tip-over angle,
 * atan(r / h), where its centre of mass passes over the rim of its base: r is
 * the largest horizontal reach of the hull vertices on the base plane and h
 * the centre-of-mass height above it. Taking the vertex circumradius rather
 * than the footprint's inradius makes the angle slightly larger, so a
 * borderline lean is credited as standing.
 *
 * @param pins The placed pins, each upright on its base with +Y along its axis.
 * @param result The baked deck whose cache holds the pins.
 * @returns The ids of the pins down at the cache end.
 * @throws {RangeError} When a pin has no hull base below its centre of mass, or is missing from the cache.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the USBC rule, the tip-over criterion, its derivation, the read instant and the conservative bias.
 * @evidence contracts/development/implementation.md#principled-implementation A rigid pin resting on its base is stable only while its centre of mass projects inside the footprint; beyond the tip-over tilt it cannot rest upright, so it is down. The read uses the solved final attitude.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The deck solve stays generic in bakePrecisionDeck; this reader owns the bowling credit.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The angle comes from each pin's own geometry and mass properties, with no tuned threshold.
 * @evidence contracts/development/implementation.md#efficient-algorithms O(P * V) for P pins of V hull vertices, plus one cache read.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads one final frame for every pin.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh id list and retains nothing.
 */
export function bowlingPinfall(
  pins: readonly IAutoMovieMotionHumanPrecisionDeck.IRigid[],
  result: IAutoMovieMotionHumanPrecisionDeck.IResult,
): string[] {
  const last: IAutoMoviePhysicalFrame = result.cache.at(result.cache.duration);
  return pins
    .filter((pin: IAutoMovieMotionHumanPrecisionDeck.IRigid): boolean => {
      const root: IAutoMovieRigidTransform | undefined =
        last.bodies[pin.id]?.root;
      if (root === undefined)
        throw new RangeError(`Bowling pin ${pin.id} is not in the deck cache`);
      return (
        Quaternion.rotateVector(root.rotation, UP).y < Math.cos(tipOver(pin))
      );
    })
    .map((pin: IAutoMovieMotionHumanPrecisionDeck.IRigid): string => pin.id);
}

/** The tilt, radians, at which a standing pin's centre of mass passes over the rim of its base. */
function tipOver(pin: IAutoMovieMotionHumanPrecisionDeck.IRigid): number {
  const segment: IAutoMoviePhysicalSegment = pin.profile.segments[0]!;
  const points: IAutoMovieVector3[] = segment.shapes.flatMap(
    (shape: IAutoMoviePhysicalShape): IAutoMovieVector3[] =>
      shape.kind === "hull"
        ? shape.points.map(
            (point: IAutoMovieVector3): IAutoMovieVector3 =>
              Vector3.add(
                shape.transform.position,
                Quaternion.rotateVector(shape.transform.rotation, point),
              ),
          )
        : [],
  );
  const base: number = Math.min(
    ...points.map((point: IAutoMovieVector3): number => point.y),
  );
  const reach: number = Math.max(
    ...points
      .filter((point: IAutoMovieVector3): boolean => point.y - base < 1e-6)
      .map((point: IAutoMovieVector3): number => Math.hypot(point.x, point.z)),
  );
  const height: number = segment.centerOfMass.y - base;
  if (!(reach > 0 && height > 0))
    throw new RangeError(
      `Bowling pin ${pin.id} needs a hull base below its centre of mass`,
    );
  return Math.atan2(reach, height);
}
