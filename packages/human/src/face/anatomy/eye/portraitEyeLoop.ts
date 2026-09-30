import type { IPortraitEyeSocket } from "./structures/IPortraitEyeSocket";

/**
 * Counterclockwise aperture identities, sharing both canthi exactly once.
 */
export const portraitEyeLoop = (socket: IPortraitEyeSocket): number[] => [
  ...socket.bottom,
  ...socket.top.slice(1, -1).reverse(),
];
