import { IPortraitMouthSocket } from "./IPortraitMouthSocket";

/**
 * The closed loop of a mouth socket's inner boundary as vertex ids: the lower boundary's ids, then the upper boundary's interior ids in reverse (its two end ids are the ones the lower boundary already carries), so the loop runs once around the aperture. Shared by `portraitLipTriangles` and `createPortraitMouthComponent`.
 *
 * @evidence contracts/common.md#principled-implementation Lower ids followed by reversed interior upper ids form the registered aperture loop.
 * @evidence contracts/common.md#clear-and-simple-design Both lip-triangle selection and mouth fitting share this topology owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Paired shared corner endpoints are a socket premise; this helper neither repairs malformed loops nor infers anatomical vertices.
 * @evidence contracts/common.md#meaningful-documentation Original vertex ids and aperture winding survive while corner ids are included only once.
 * @evidence contracts/performance.md#efficient-algorithms Copying/reversing ids takes linear time in upper/lower boundary length.
 * @evidence contracts/performance.md#reuse-equivalent-work One loop formula replaces duplicated lip/component stitching.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The result owns a new id array while caller boundary arrays remain unchanged.
 *
 * @author Samchon
 */
export const portraitMouthInnerLoop: (socket: IPortraitMouthSocket) => number[] = (
  socket: IPortraitMouthSocket,
): number[] => [...socket.lower, ...socket.upper.slice(1, -1).reverse()];
