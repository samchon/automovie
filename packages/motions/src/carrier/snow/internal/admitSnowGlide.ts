import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanSurface,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBound } from "../../../law/internal/HumanBound";
import { HumanRefusal } from "../../../law/HumanRefusal";

/** Both feet checked against each set of ski edges. */
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

/**
 * Admit an optional ski edge transfer or Nordic stroke before planning the
 * glide. An edge transfer occurs strictly inside the glide, counters by at most
 * 35 degrees, and switches to the opposite cant. Each edge stays within 45
 * degrees, and each pivot coordinate stays within one metre of the foot
 * origin.
 *
 * @param duration The authored glide duration in seconds.
 * @param transfer The requested edge transfer, if present.
 * @param stroke The requested Nordic stroke, if present.
 * @throws {HumanRefusal} When both techniques are requested or an edge transfer
 *   lies outside its allowed range.
 */
export function admitSnowGlide(
  duration: number,
  transfer: IAutoMovieMotionHumanSurface.ISkiEdgeTransfer | undefined,
  stroke: IAutoMovieMotionHumanSurface.INordicStroke | undefined,
): void {
  if (transfer !== undefined && stroke !== undefined)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "nordic",
      value: stroke,
      feasible: null,
      reason: "one snow glide uses either alpine edging or a Nordic stroke",
      fix: "stage the two techniques as separate glides",
    });
  if (transfer !== undefined) {
    HumanBound.within("edgeTransfer.at", transfer.at, 0, duration, "s", "both");
    HumanBound.within("edgeTransfer.counter", transfer.counter, 0, 35, "deg");
    for (const [name, edge] of [
      ["first", transfer.first],
      ["next", transfer.next],
    ] as const) {
      HumanBound.within(
        `edgeTransfer.${name}.degrees`,
        edge.degrees,
        -45,
        45,
        "deg",
      );
      for (const side of SIDES) {
        const pivot: IAutoMovieVector3 = edge.pivots[side];
        HumanBound.within(
          `edgeTransfer.${name}.pivots.${side}.x`,
          pivot.x,
          -1,
          1,
          "m",
        );
        HumanBound.within(
          `edgeTransfer.${name}.pivots.${side}.y`,
          pivot.y,
          -1,
          1,
          "m",
        );
        HumanBound.within(
          `edgeTransfer.${name}.pivots.${side}.z`,
          pivot.z,
          -1,
          1,
          "m",
        );
      }
    }
    if (transfer.first.degrees * transfer.next.degrees >= 0)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "edgeTransfer.next.degrees",
        value: transfer.next.degrees,
        feasible: null,
        reason: "the new ski edges must have the opposite sign",
        fix: "select the other pair of ski edges with the opposite cant",
      });
  }
}
