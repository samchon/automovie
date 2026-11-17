import type { IAutoMovieResolveContactEvents } from "@automovie/interface";

/**
 * Read one weapon's actual geometry for one exact time and stop context.
 * The optional combined producer replaces separate endpoint callbacks while
 * retaining the weapon's declared sphere or capsule kind.
 *
 * @param weapon The moving weapon.
 * @param seconds The exact scan or contact second.
 * @param stops The current stop state, borrowed only for this invocation.
 * @returns The actual centre and optional capsule end, world metres.
 * @throws {Error} When a combined sample changes the declared sphere/capsule kind.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States exact time/context, world endpoints, combined versus legacy producer choice and geometry-kind refusal.
 * @evidence contracts/development/implementation.md#principled-implementation One combined source may produce both ends of the same physical axis; without it the existing position then optional tail callbacks are read in their original order. Declared tail presence fixes whether the weapon is a capsule.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One producer branch and one shape-kind check serve both first-impact samples and mutual-contact queries.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A capsule cannot silently become a sphere or a sphere a capsule through its optional sampler; every actual producer still runs and no pose, time or stop answer is cached.
 * @evidence contracts/development/implementation.md#efficient-algorithms Adds constant branching to one combined callback or the original one/two callbacks; the actual geometry costs remain with those producers.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares only endpoint-reading policy between real scan and mutual-contact consumers; each invocation recomputes its source under its own exact seconds and stops.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Stores no state or handle; the returned actual frame retains no new stop map, callback or query history.
 */
export function sampleAutoMovieContactWeapon(
  weapon: IAutoMovieResolveContactEvents.IWeapon,
  seconds: number,
  stops: IAutoMovieResolveContactEvents.IStops,
): IAutoMovieResolveContactEvents.IWeaponFrame {
  if (weapon.sample === undefined)
    return {
      position: weapon.position(seconds, stops),
      tail: weapon.tail?.(seconds, stops),
    };
  const frame: IAutoMovieResolveContactEvents.IWeaponFrame = weapon.sample(
    seconds,
    stops,
  );
  if ((frame.tail === undefined) !== (weapon.tail === undefined))
    throw new Error(
      `Contact weapon ${weapon.id} sampled a different sphere or capsule kind`,
    );
  return frame;
}
