import type { IPortraitEyeSocket } from "./structures/IPortraitEyeSocket";

/**
 * Counterclockwise aperture identities, sharing both canthi exactly once.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Orders the socket's lower and upper rims for shared lid construction.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Retains caller vertex identities while reversing only the upper interior.
 */
export const portraitEyeLoop = (socket: IPortraitEyeSocket): number[] => [
  ...socket.bottom,
  ...socket.top.slice(1, -1).reverse(),
];
