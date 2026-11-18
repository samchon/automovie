import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanSignature,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import { HumanColliders, HumanSignature } from "@automovie/motions";

/**
 * Find the deepest joint-centre overlap and its witness in either direction.
 *
 * @param first One performer.
 * @param second The other performer.
 * @param times The film seconds whose displayed bones are checked.
 * @returns The least signed distance in metres, with the time and joint pair.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the signed geometric quantity, both directions and the witness.
 * @evidence contracts/development/implementation.md#principled-implementation Queries each joint centre against the opposite performer's displayed colliders, as HumanSignature.apart does, retaining the earliest witness for equal distances.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One displayed bone map and one collider reader per performer and sample, then a minimum over both directions.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads the same joint and collider populations as the existing separation measure.
 * @evidence contracts/development/implementation.md#efficient-algorithms Collider placement is shared for all joints tested against one body's displayed frame, while every joint query still runs against the current other body.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses HumanColliders.reading and the filled maps until each sample ends.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources No sample data or collider reader survives its traversal. The result retains only the numerical witness.
 */
export function inspectHumanPairSeparation(
  first: IAutoMovieMotionHumanSignature.IReader,
  second: IAutoMovieMotionHumanSignature.IReader,
  times: readonly number[],
): ISeparation {
  let least: ISeparation = {
    distance: Infinity,
    where: "no joint",
    seconds: 0,
  };
  for (const seconds of times) {
    const a: IPlaced = {
      reader: first,
      bones: HumanSignature.bones(first, seconds),
    };
    const b: IPlaced = {
      reader: second,
      bones: HumanSignature.bones(second, seconds),
    };
    for (const [source, target] of [
      [a, b],
      [b, a],
    ] as const) {
      const read: ReturnType<typeof HumanColliders.reading> =
        HumanColliders.reading(target.reader.body, target.bones);
      for (const [name, joint] of source.bones) {
        const hit: IAutoMovieMotionHumanColliders.IDistance = read.segment(
          joint.worldPosition,
          joint.worldPosition,
        );
        if (hit.distance < least.distance || Number.isNaN(hit.distance))
          least = {
            distance: hit.distance,
            seconds,
            where: `${source.reader.subject}.${name} inside ${target.reader.subject}.${hit.bone}`,
          };
      }
    }
  }
  return least;
}

/** The observed minimum signed separation with its location. */
interface ISeparation {
  /** Metres, negative for a joint inside a collider. */
  distance: number;

  /** The two subjects' observed joint and collider names. */
  where: string;

  /** Film second of this overlap. */
  seconds: number;
}

/** One body's shared presentation at one film second. */
interface IPlaced {
  /** The performer who owns the body. */
  reader: IAutoMovieMotionHumanSignature.IReader;

  /** The same displayed pose for all query directions at this second. */
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
}
