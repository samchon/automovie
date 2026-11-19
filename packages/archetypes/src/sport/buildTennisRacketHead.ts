import { extrudeAutoMovieRegion } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieProfilePoint,
} from "@automovie/interface";

import { TennisMesh } from "./TennisMesh";

/** Number of samples around each oval, with stations on both axes. */
const RIM_STATIONS: number = 32;

/** Provisional radial inset of the composite rim from the outer bounds, metres. */
const RIM_WIDTH: number = 0.011;

/** Typical 1.3 mm tennis string gauge in metres. */
const STRING_GAUGE: number = 0.0013;

/**
 * Build an oval composite rim and a Babolat-style 16 by 19 string bed at the tennis head's local origin. Width, length and thickness are in metres.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both optical parts, their frame, dimensions and the pattern.
 * @evidence contracts/development/implementation.md#principled-implementation Extrudes an elliptical annulus and ends each straight string on its analytic inner ellipse, with crossing strings laid at adjacent depths.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Compute the outer and inner ellipses once, extrude the annulus, then place the two string directions.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The annulus has a real opening and the bed consists of solid strands. Physical head proxy and contact frames belong to createRacket.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed 32 stations per ring and 35 string strips yield exactly two bounded meshes.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The same inner semiaxes locate the rim opening and every string end. Ring extrusion and strip indexing use existing owners.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns independent rim and string buffers without retaining input or external resources.
 */
export function buildTennisRacketHead(
  width: number,
  length: number,
  thickness: number,
): { rim: IAutoMovieMesh; strings: IAutoMovieMesh } {
  const outer: IAutoMovieProfilePoint[] = [];
  const inner: IAutoMovieProfilePoint[] = [];
  const radiusX: number = width / 2 - RIM_WIDTH;
  const radiusY: number = length / 2 - RIM_WIDTH;
  for (let i: number = 0; i < RIM_STATIONS; ++i) {
    const angle: number = (2 * Math.PI * i) / RIM_STATIONS;
    const x: number = Math.cos(angle);
    const y: number = Math.sin(angle);
    outer.push({ x: (x * width) / 2, y: (y * length) / 2 });
    inner.push({ x: x * radiusX, y: y * radiusY });
  }
  const bed: TennisMesh = new TennisMesh();
  const front: number = (thickness - STRING_GAUGE) / 2;
  for (let i: number = 1; i <= 16; ++i) {
    const t: number = (2 * i) / 17 - 1;
    const x: number = t * radiusX;
    const y: number = Math.sqrt(1 - t * t) * radiusY;
    bed.strip(
      [
        { x, y: -y },
        { x, y },
      ],
      STRING_GAUGE,
      STRING_GAUGE,
      front - STRING_GAUGE,
    );
  }
  for (let i: number = 1; i <= 19; ++i) {
    const t: number = (2 * i) / 20 - 1;
    const x: number = Math.sqrt(1 - t * t) * radiusX;
    const y: number = t * radiusY;
    bed.strip(
      [
        { x: -x, y },
        { x, y },
      ],
      STRING_GAUGE,
      STRING_GAUGE,
      front,
    );
  }
  return {
    rim: extrudeAutoMovieRegion({ outer, holes: [inner], depth: thickness }),
    strings: bed.mesh,
  };
}
