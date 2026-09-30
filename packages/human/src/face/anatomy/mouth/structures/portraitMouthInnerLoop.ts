import { IPortraitMouthSocket } from "./IPortraitMouthSocket";

/**
 * The closed loop of a mouth socket's inner boundary as vertex ids: the lower
 * boundary's ids, then the upper boundary's interior ids in reverse (its two
 * end ids are the ones the lower boundary already carries), so the loop runs
 * once around the aperture. Shared by `portraitLipTriangles` and
 * `createPortraitMouthComponent`.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Binds a replaceable mouth to common outer vermilion and inner oral boundaries.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Defines ordered shared-corner upper/lower rims and a strictly interior lip-band seed without embedding landmark numbers.
 * @author Samchon
 */
export const portraitMouthInnerLoop = (socket: IPortraitMouthSocket): number[] => [
  ...socket.lower,
  ...socket.upper.slice(1, -1).reverse(),
];
