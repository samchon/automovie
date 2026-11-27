import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBowling,
  IAutoMovieMotionHumanPrecisionDeck,
  IAutoMoviePhysicalFrame,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicsCache,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * World up, the axis of an upright pin.
 */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/*
 * Credit the pinfall of a baked bowling delivery: the pins down at the end of
 * its cache, in rack order.
 *
 * USBC counts a pin knocked down or off the deck; a pin moved but standing does
 * not count. A pin is down when its axis leans past its tip-over angle, atan(r
 * / h), where its centre of mass passes over the rim of its base: r is the
 * largest horizontal reach of the hull vertices on the base plane and h the
 * centre-of-mass height above it. Taking the vertex circumradius rather than
 * the footprint's inradius makes the angle slightly larger, so a borderline
 * lean is credited as standing.
 * Parameter params: The placed `pins`, each upright on its base with +Y along its
 * axis, and the baked `result` deck whose cache holds them.
 * Returns: The ids of the pins down at the cache end.
 * When a pin has no hull base below its centre of mass, or
 * is missing from the cache.
 */
export function bowlingPinfall(
  params: bowlingPinfall.IRead,
): IAutoMovieMotionHumanBowling.IPinfall {
  const last: IAutoMoviePhysicalFrame = params.result.cache.at(
    params.result.cache.duration,
  );
  return params.pins
    .filter((pin: bowlingPinfall.IPin): boolean => {
      const root: IAutoMovieRigidTransform | undefined =
        last.bodies[pin.id]?.root;
      if (root === undefined)
        throw new RangeError(`Bowling pin ${pin.id} is not in the deck cache`);
      return (
        Quaternion.rotateVector(root.rotation, UP).y < Math.cos(tipOver(pin))
      );
    })
    .map((pin: bowlingPinfall.IPin): string => pin.id);
}

/*
 * What a pinfall reads of a baked delivery.
 */
export namespace bowlingPinfall {
  /*
   * A placed pin: its id and its profile's first segment.
   */
  export interface IPin {
    /*
     * The pin's body id in the deck cache.
     */
    id: IAutoMovieMotionHumanPrecisionDeck.IRigid["id"];

    /*
     * Its placed pose; the pinfall reads the cache, not this.
     */
    pose?: IAutoMovieMotionHumanPrecisionDeck.IRigid["pose"];

    /*
     * Its profile, the first segment its hull and centre of mass.
     */
    profile: {
      /*
       * The profile's segments.
       */
      segments: readonly Pick<
        IAutoMoviePhysicalSegment,
        "shapes" | "centerOfMass"
      >[];
    };
  }

  /*
   * The pins and the baked deck's cache end.
   */
  export interface IRead {
    /*
     * The placed pins, each upright on its base with +Y along its axis.
     */
    pins: readonly IPin[];

    /*
     * The baked deck, its cache's duration and frame reader.
     */
    result: {
      /*
       * The deck's physics cache.
       */
      cache: Pick<IAutoMoviePhysicsCache, "at" | "duration">;
    };
  }
}

/*
 * The tilt, radians, at which a standing pin's centre of mass passes over the
 * rim of its base.
 */
function tipOver(pin: bowlingPinfall.IPin): number {
  const segment: Pick<IAutoMoviePhysicalSegment, "shapes" | "centerOfMass"> =
    pin.profile.segments[0]!;
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
