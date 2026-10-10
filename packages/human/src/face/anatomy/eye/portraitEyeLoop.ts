import type { IPortraitEyeSocket } from "./structures/IPortraitEyeSocket";

/**
 * Counterclockwise aperture identities, sharing both canthi exactly once.
 *
 * The loop runs the lower rim from its first to its last identity and returns
 * along the upper rim without repeating either canthus, so a socket of `n`
 * lower and `m` upper identities gives `n + m - 2` entries. It reads the
 * socket and returns a new array; a socket whose rims do not share their end
 * identities is not checked here, and its loop would repeat or miss a corner.
 */
export const portraitEyeLoop = (socket: IPortraitEyeSocket): number[] => [
  ...socket.bottom,
  ...socket.top.slice(1, -1).reverse(),
];
