import type { IPortraitComponentHost } from "../../surface/structures/IPortraitComponentHost";
import { createPortraitEyeComponent } from "../eye/createPortraitEyeComponent";
import type { IPortraitEyeShape } from "../eye/structures/IPortraitEyeShape";
import type { IPortraitEyeSocket } from "../eye/structures/IPortraitEyeSocket";
import { createPortraitFacialFrame } from "./createPortraitFacialFrame";
import type { IPortraitFacialFrameShape } from "./structures/IPortraitFacialFrameShape";

/**
 * Select a transverse scale through widening trials of both eyes' current
 * fitting predicate. It asks the eye owner's own
 * fitting instead of copying its optical, tissue and host-support conditions.
 * The requested scale is tried first; when it fails, bisection selects a
 * fitting scale between one and the request to a step of 0.005. The documented
 * [0.7,1.3] frame envelope alone does not establish that both eyes fit.
 *
 * The other frame dimensions are held as given. Requests at or below one are
 * returned without fitting. A widening request is returned when it fits, and
 * the result is at least one when the unscaled face fits; an unscaled
 * face that already fails returns one and leaves the eye's own refusal to
 * report it. Bisection assumes monotone fitting over the searched interval
 * for the fixed admitted eye and host inputs; this function does not establish
 * that premise for every supplied combination or prove a global maximum.
 * The same paired sockets support nonzero brow projection during every trial.
 * Positions are head millimetres; the result is a
 * dimensionless scale.
 *
 * @evidence contracts/common.md#principled-implementation Bisection queries the existing two-eye fitting predicate over fixed admitted host/shape inputs to select a fitting scale within 0.005, under its stated monotonic premise.
 * @evidence contracts/common.md#clear-and-simple-design The eye component owns all fit conditions and the frame owner receives the same paired sockets on every nonzero-brow projection trial.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unscaled failure returns one without a false successful-fit claim; catches summarize eye-fit failure and this search does not prove monotonicity or a global maximum for arbitrary inputs.
 * @evidence contracts/common.md#meaningful-documentation The prose states the requested-first path, no-widening fast path, bisection precision, fallback and paired-socket dependency.
 * @evidence contracts/performance.md#efficient-algorithms The [0.7,1.3] admitted scale envelope bounds the logarithmic number of bisection trials; each trial includes a full host frame and both eye components' actual fitting work.
 * @evidence contracts/performance.md#reuse-equivalent-work Trials intentionally recompute for their different widthScale and reuse canonical frame/eye owners, not an unrelated cached success; only fixed caller inputs decide equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Trial hosts/components/plans are call-local and released after each predicate evaluation; only the selected scalar survives and no geometry or task cache is retained.
 */
export function portraitFacialFrameWidthLimit(
  host: IPortraitComponentHost,
  frame: IPortraitFacialFrameShape,
  eyes: readonly { socket: IPortraitEyeSocket; shape: IPortraitEyeShape }[],
): number {
  const requested: number = frame.widthScale ?? 1;
  const fits: (scale: number) => boolean = (scale: number): boolean => {
    const framed: { positions: number[][]; indices: number[]; viewRay: number[]; } = createPortraitFacialFrame(
      host,
      { ...frame, widthScale: scale },
      eyes.map(({ socket }: { socket: IPortraitEyeSocket; shape: IPortraitEyeShape; }): IPortraitEyeSocket  => socket),
    ).host;
    try {
      for (const { socket, shape } of eyes)
        createPortraitEyeComponent(socket, shape).fit(framed);
      return true;
    } catch {
      return false;
    }
  };
  if (requested <= 1 || fits(requested)) return requested;
  let low: number = 1,
    high: number = requested;
  if (!fits(low)) return low;
  while (high - low > 0.005) {
    const middle: number = (low + high) / 2;
    if (fits(middle)) low = middle;
    else high = middle;
  }
  return low;
}
