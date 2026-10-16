import { IAutoMovieSweepSection } from "@automovie/engine";

import { AutoMovieHumanSide } from "../../junction/AutoMovieHumanSide";
import { IAutoMovieHumanLegStation } from "./IAutoMovieHumanLegStation";

/**
 * The block-out section of one leg station, before its relief: an ellipse of the station's aspect whose four half axes differ, so its centre sits behind and lateral to the bone axis by the station's offsets.
 *
 * Its mean radius is the station's girth over 2π, its depth that over the square root of the aspect and its breadth that times it; the anterior half axis is the depth times `1 - posterior` and the posterior one times `1 + posterior`, the medial half axis the breadth less the lateral offset and the lateral one the breadth plus it. The section lies in the station's plane with its first axis anterior and its second the chart's counterclockwise quarter turn about the distal axis, which is medial on the left leg and lateral on the right. The loft then holds the station's row to its girth on the limit surface, relief included, so the ellipse sets the section's proportions rather than its size.
 *
 * @param station The station, with its girth and base shape
 * @param side Which leg
 * @returns The section in millimetres, in the station's plane
 */
export function shapeAutoMovieHumanLegSection(
  station: IAutoMovieHumanLegStation,
  side: AutoMovieHumanSide,
): IAutoMovieSweepSection {
  const mean: number = station.girth / (2 * Math.PI);
  const depth: number = mean / Math.sqrt(station.aspect);
  const breadth: number = mean * Math.sqrt(station.aspect);
  const medial: number = breadth - station.lateral;
  const lateral: number = breadth + station.lateral;
  return {
    type: "superellipse",
    right: depth * (1 - station.posterior),
    left: depth * (1 + station.posterior),
    up: side === "left" ? medial : lateral,
    down: side === "left" ? lateral : medial,
    exponents: [2, 2, 2, 2],
  };
}
