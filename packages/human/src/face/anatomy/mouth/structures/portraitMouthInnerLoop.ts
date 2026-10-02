import { IPortraitMouthSocket } from "./IPortraitMouthSocket";

/**
 * The closed loop of a mouth socket's inner boundary as vertex ids: the lower
 * boundary's ids, then the upper boundary's interior ids in reverse (its two
 * end ids are the ones the lower boundary already carries), so the loop runs
 * once around the aperture. Shared by `portraitLipTriangles` and
 * `createPortraitMouthComponent`.
 *
 * @evidence contracts/common.md#principled-implementation The aperture is one closed cycle, so the loop takes the whole lower curve and then the upper curve's interior identities in reverse; the two ends are omitted because the lower curve already carries them, which follows from the socket's shared endpoints.
 * @evidence contracts/common.md#clear-and-simple-design One expression, owned in one place and shared by the lip band selection and the mouth component instead of being rebuilt by each.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special case: the loop is a function of the socket's two curves only.
 * @evidence contracts/common.md#meaningful-documentation The comment states the order of the cycle, why the upper ends are dropped and both consumers.
 * @evidence contracts/modeling.md#spatial-conventions Inputs and outputs are host vertex identities; no unit or frame is involved.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function orders vertex identities and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidence contracts/modeling.md#shared-boundaries It is the aperture boundary definition that the lip band selection and the mouth component share, so both cut and flood along the same cycle; it holds while the socket's curves share their end identities, which the sampler enforces.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input shapes a form through this function.
 * @author Samchon
 */
export const portraitMouthInnerLoop = (
  socket: IPortraitMouthSocket,
): number[] => [...socket.lower, ...socket.upper.slice(1, -1).reverse()];
