import type { IPortraitComponentHost } from "../../surface/structures/IPortraitComponentHost";
import { createPortraitEyeComponent } from "../eye/createPortraitEyeComponent";
import type { IPortraitEyeShape } from "../eye/structures/IPortraitEyeShape";
import type { IPortraitEyeSocket } from "../eye/structures/IPortraitEyeSocket";
import { createPortraitFacialFrame } from "./createPortraitFacialFrame";
import type { IPortraitFacialFrameShape } from "./structures/IPortraitFacialFrameShape";

/**
 * The widest transverse facial scale, not above the requested one, at which
 * both eyes still fit their sockets. The limit is a property of the eye's fixed
 * globe against the fissure it must cover, and the eye owner's own fitting is
 * the only exact statement of it, so this asks that fit instead of copying its
 * conditions: the requested scale is tried first; when it fails, the largest
 * scale between one and the request at which both eyes fit is found by
 * bisection over that same fit, to a step of half a hundredth. A wider face scales the fissure and the iris
 * marker together, and a globe of fixed radius stops covering them at a small
 * widening, so the documented interval [0.7,1.3] is an upper envelope and the
 * subject's own limit is the tighter and true one.
 *
 * The other frame dimensions are held as given. The result equals the request
 * when it fits, and is at least one when the unscaled face fits; an unscaled
 * face that already fails returns one and leaves the eye's own refusal to
 * report it. Fits are monotone in the scale over the searched interval, which
 * holds because each failing condition compares a length that grows with the
 * scale with a fixed radius. Positions are head millimetres; the result is a
 * dimensionless scale.
 *
 * @evidence contracts/common.md#principled-implementation The bound comes from the same fit the build runs, so it cannot drift from it; bisection over a monotone predicate converges to the boundary within the step tolerance, and the request is returned unchanged when it already fits.
 * @evidence contracts/common.md#clear-and-simple-design One predicate over the two eyes and one search; the fit is the eye owner's.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or fixture is named and no constant copies the eye's conditions; only a thrown refusal of the fit is read as not fitting.
 * @evidence contracts/common.md#meaningful-documentation States the derivation, the search, the monotonicity premise, the cases at and below one and the units.
 * @evidence contracts/modeling.md#spatial-conventions Head-frame millimetres for the host; the result is a dimensionless scale.
 * @evidence contracts/anatomy.md#permitted-range The bound on widening a face is derived from the structure that limits it, the eye's globe against its fissure, by asking the fit that enforces it, and a face beyond it is reported with the widest admitted scale.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It is a computation over existing data and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines and consumes no parameter channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no primitive of its own.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It constructs no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation It owns no displayed part; the eyes it bounds are observed by their owner.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It defines no input through which a caller shapes a human form.
 */
export function portraitFacialFrameWidthLimit(
  host: IPortraitComponentHost,
  frame: IPortraitFacialFrameShape,
  eyes: readonly { socket: IPortraitEyeSocket; shape: IPortraitEyeShape }[],
): number {
  const requested = frame.widthScale ?? 1;
  const fits = (scale: number): boolean => {
    const framed = createPortraitFacialFrame(host, {
      ...frame,
      widthScale: scale,
    }).host;
    try {
      for (const { socket, shape } of eyes)
        createPortraitEyeComponent(socket, shape).fit(framed);
      return true;
    } catch {
      return false;
    }
  };
  if (requested <= 1 || fits(requested)) return requested;
  let low = 1,
    high = requested;
  if (!fits(low)) return low;
  while (high - low > 0.005) {
    const middle = (low + high) / 2;
    if (fits(middle)) low = middle;
    else high = middle;
  }
  return low;
}
