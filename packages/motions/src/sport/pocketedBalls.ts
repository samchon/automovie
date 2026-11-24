import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBilliards,
  IAutoMovieMotionHumanPrecisionDeck,
  IAutoMoviePhysicalFrame,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicsCache,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Credit the balls a baked precision shot drops into a pocket or a cup, in the
 * order they drop.
 *
 * The bed, a cue table's or a green's, has open mouths at its pockets or cup,
 * so a pocketed ball leaves the bed plane. A ball is credited at the first
 * cache frame where its centre is more than one radius below the bed plane, so
 * the whole ball has passed the bed, to the mouth whose plan reach holds it at
 * that frame. A ball that falls below the bed outside every reach left the
 * table over a rail and is never credited.
 *
 * @param params The `balls` to credit, each one rigid sphere whose centre of
 *   mass is its centre, the table's `pockets` at bed height and the baked
 *   `result` shot.
 * @returns The pocketed balls in drop order; empty when none drops.
 * @throws {RangeError} When a ball has no sphere shape, there is no pocket, or
 *   a ball is missing from the cache.
 */
export function pocketedBalls(
  params: pocketedBalls.IRead,
): IAutoMovieMotionHumanBilliards.IPocketed {
  const { balls, pockets, result } = params;
  if (pockets.length === 0)
    throw new RangeError("A pocket credit needs at least one mouth");
  const bed: number = pockets[0]!.point.y;
  const pending: Map<string, pocketedBalls.IBall> =
    new Map(
      balls.map(
        (
          ball: pocketedBalls.IBall,
        ): [string, pocketedBalls.IBall] => [
          ball.id,
          ball,
        ],
      ),
    );
  const radii: Map<string, number> = new Map(
    balls.map(
      (ball: pocketedBalls.IBall): [string, number] => [
        ball.id,
        radius(ball),
      ],
    ),
  );
  const out: IAutoMovieMotionHumanPrecisionDeck.IPocketed[] = [];
  const frames: number = Math.round(result.cache.duration * result.cache.rate);
  for (let index: number = 0; index <= frames && pending.size > 0; ++index) {
    const seconds: number = index / result.cache.rate;
    const frame: IAutoMoviePhysicalFrame = result.cache.at(seconds);
    for (const [id, ball] of [...pending]) {
      const root: IAutoMovieRigidTransform | undefined = frame.bodies[id]?.root;
      if (root === undefined)
        throw new RangeError(`Ball ${id} is not in the deck cache`);
      const centre: IAutoMovieVector3 = Vector3.add(
        root.position,
        Quaternion.rotateVector(
          root.rotation,
          ball.profile.segments[0]!.centerOfMass,
        ),
      );
      if (centre.y >= bed - radii.get(id)!) continue;
      pending.delete(id);
      const mouth: IAutoMovieMotionHumanPrecisionDeck.IPocket | undefined =
        pockets.find(
          (pocket: IAutoMovieMotionHumanPrecisionDeck.IPocket): boolean =>
            plan(centre, pocket.point) <= pocket.reach,
        );
      if (mouth !== undefined)
        out.push({
          ball: id,
          pocket: mouth.id,
          seconds: result.release + seconds,
        });
    }
  }
  return out;
}

/** What a pocket credit reads of a baked shot. */
export namespace pocketedBalls {
  /** A ball: its id and its profile's first segment, a sphere about its centre. */
  export interface IBall {
    /** The ball's body id in the deck cache. */
    id: IAutoMovieMotionHumanPrecisionDeck.IRigid["id"];

    /** Its placed pose; the credit reads the cache, not this. */
    pose?: IAutoMovieMotionHumanPrecisionDeck.IRigid["pose"];

    /** Its profile, the first segment its sphere and centre of mass. */
    profile: {
      /** The profile's segments. */
      segments: readonly Pick<
        IAutoMoviePhysicalSegment,
        "shapes" | "centerOfMass"
      >[];
    };
  }

  /** The balls, the mouths and the baked shot. */
  export interface IRead {
    /** The balls to credit. */
    balls: readonly IBall[];

    /** The table's pockets at bed height. */
    pockets: readonly IAutoMovieMotionHumanPrecisionDeck.IPocket[];

    /** The baked shot: its release and its cache's frames. */
    result: Pick<IAutoMovieMotionHumanPrecisionDeck.IResult, "release"> & {
      /** The shot's physics cache. */
      cache: Pick<IAutoMoviePhysicsCache, "at" | "duration" | "rate">;
    };
  }
}

/** The horizontal distance between two points, metres. */
function plan(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

/** A ball's sphere radius, metres. */
function radius(ball: pocketedBalls.IBall): number {
  const segment: Pick<IAutoMoviePhysicalSegment, "shapes" | "centerOfMass"> | undefined =
    ball.profile.segments[0];
  const sphere: IAutoMoviePhysicalShape | undefined = segment?.shapes.find(
    (shape: IAutoMoviePhysicalShape): boolean => shape.kind === "sphere",
  );
  if (sphere?.kind !== "sphere")
    throw new RangeError(`Ball ${ball.id} needs a sphere shape`);
  return sphere.radius;
}
