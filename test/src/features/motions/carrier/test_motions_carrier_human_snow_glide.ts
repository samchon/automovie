import type { IAutoMovieMotionHumanSurface } from "@automovie/interface";
import { HumanRefusal, HumanSnowGlide } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `HumanSnowGlide.admit` admits a snow glide's own requests before its glide is
 * planned: alpine edging or a Nordic stroke, not both; an edge transfer inside
 * the glide, its counter-rotation within 35 degrees, each edge pair within 45
 * degrees, and the new edges of the opposite cant.
 *
 * Scenarios, a 2 s glide:
 *
 * 1. A transfer at 1 s from a 20 degree to a -20 degree edge, countering 10
 *    degrees, is admitted.
 * 2. A transfer with a Nordic stroke is refused on `nordic`; one at 3 s on
 *    `edgeTransfer.at`; one countering 40 degrees on `edgeTransfer.counter`;
 *    one to a 20 degree edge on `edgeTransfer.next.degrees`.
 */
export function test_motions_carrier_human_snow_glide(): void {
  const pivots = { left: { x: 0, y: 0, z: 0 }, right: { x: 0, y: 0, z: 0 } };
  const transfer: IAutoMovieMotionHumanSurface.ISkiEdgeTransfer = {
    first: { degrees: 20, pivots },
    next: { degrees: -20, pivots },
    at: 1,
    counter: 10,
  };
  const nordic: IAutoMovieMotionHumanSurface.INordicStroke = {
    hand: "right",
    on: "track",
    grip: "pole",
    window: [0.2, 0.8],
    kick: 0.3,
  };
  const refused = (
    edgeTransfer: IAutoMovieMotionHumanSurface.ISkiEdgeTransfer,
    stroke?: IAutoMovieMotionHumanSurface.INordicStroke,
  ): string | undefined => {
    try {
      HumanSnowGlide.admit({
        duration: 2,
        edgeTransfer,
        ...(stroke === undefined ? {} : { nordic: stroke }),
      });
    } catch (error: unknown) {
      return error instanceof HumanRefusal ? error.axis : "error";
    }
    return undefined;
  };
  TestValidator.equals(
    "the transfer",
    [
      refused(transfer),
      refused(transfer, nordic),
      refused({ ...transfer, at: 3 }),
      refused({ ...transfer, counter: 40 }),
      refused({ ...transfer, next: { degrees: 20, pivots } }),
    ],
    [
      undefined,
      "nordic",
      "edgeTransfer.at",
      "edgeTransfer.counter",
      "edgeTransfer.next.degrees",
    ],
  );
}
