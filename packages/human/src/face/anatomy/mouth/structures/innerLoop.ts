import { IPortraitMouthSocket } from "./IPortraitMouthSocket";

/**
 * Shared by IPortraitMouthShape, portraitLipTriangles, createPortraitMouthComponent, which were one file until each public identity took its own.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Binds a replaceable mouth to common outer vermilion and inner oral boundaries.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Defines ordered shared-corner upper/lower rims and a strictly interior lip-band seed without embedding landmark numbers.
 * @author Samchon
 */
export const innerLoop = (socket: IPortraitMouthSocket): number[] => [
  ...socket.lower,
  ...socket.upper.slice(1, -1).reverse(),
];
