import type { IPortraitEyeSocket } from "./structures/IPortraitEyeSocket";

/**
 * Counterclockwise aperture identities, sharing both canthi exactly once.
 *
 * The loop runs the lower rim from its first to its last identity and returns
 * along the upper rim without repeating either canthus, so a socket of `n`
 * lower and `m` upper identities gives `n + m - 2` entries. It reads the
 * socket and returns a new array; a socket whose rims do not share their end
 * identities is not checked here, and its loop would repeat or miss a corner.
 *
 * @evidence contracts/common.md#principled-implementation Lower rim plus reversed upper interior forms the admitted counterclockwise aperture cycle with each shared canthus once.
 * @evidence contracts/common.md#clear-and-simple-design One ordinal-only loop owner is shared by component fitting, section generation and attachment.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Shared endpoint identity/order is a socket admission premise, not independently inferred from coordinates here.
 * @evidence contracts/common.md#meaningful-documentation The prose gives N+M-2 count, new array ownership and unchecked mismatched endpoint limitation.
 * @evidence contracts/performance.md#efficient-algorithms Copy/reverse work is linear in both rim populations.
 * @evidence contracts/performance.md#reuse-equivalent-work Every consumer shares this canonical ordering without mutating either rim.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a new identity array escapes; no socket, cache or resource is retained.
 */
export const portraitEyeLoop: (socket: IPortraitEyeSocket) => number[] = (
  socket: IPortraitEyeSocket,
): number[] => [...socket.bottom, ...socket.top.slice(1, -1).reverse()];
