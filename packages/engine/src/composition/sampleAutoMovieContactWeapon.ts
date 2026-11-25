import type { IAutoMovieResolveContactEvents } from "@automovie/interface";

/**
 * Read one weapon's actual geometry for one exact time and stop context. The
 * optional combined producer replaces separate endpoint callbacks while
 * retaining the weapon's declared sphere or capsule kind.
 *
 * @param weapon The moving weapon.
 * @param seconds The exact scan or contact second.
 * @param stops The current stop state, borrowed only for this invocation.
 * @returns The actual centre and optional capsule end, world metres.
 * @throws {Error} When a combined sample changes the declared sphere/capsule
 *   kind.
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
