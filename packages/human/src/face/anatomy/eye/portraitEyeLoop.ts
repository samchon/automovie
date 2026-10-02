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
 * @evidence contracts/common.md#principled-implementation Walking the lower rim forwards and the upper rim backwards with the shared corner identities dropped once is the boundary traversal of a closed aperture, and its orientation is the one the lid-row builder assumes for outward normals.
 * @evidence contracts/common.md#clear-and-simple-design One expression owns the loop order that the fit, the lid rows and the finish all read, so they cannot disagree about it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The loop is a function of the socket alone and names no subject or fixture.
 * @evidence contracts/common.md#meaningful-documentation The comment states the orientation, the length, that corners are shared once, and that shared end identities are the caller's precondition and are not checked.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function orders identities and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The function handles host vertex identities and carries no unit or frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function only orders the identities of the seam the socket already names; the lid rows and the host reservation build the surfaces that meet there from this same loop.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part and displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function defines and converts no input.
 */
export const portraitEyeLoop = (socket: IPortraitEyeSocket): number[] => [
  ...socket.bottom,
  ...socket.top.slice(1, -1).reverse(),
];
