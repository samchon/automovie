import { AutoMovieEnginePlanarRegion } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieProfilePoint,
} from "@automovie/interface";

import { TennisMesh } from "./TennisMesh";

/**
 * Build a composite rim with a split throat and a Babolat-style 16 by 19 string
 * bed at the tennis head's local origin. All dimensions are in metres.
 * `gripTop` is the handle's upper end along local Y and `gripRadius` sizes the
 * frame's neck.
 */
export function buildTennisRacketHead(
  width: number,
  length: number,
  thickness: number,
  gripTop: number,
  gripRadius: number,
): { rim: IAutoMovieMesh; strings: IAutoMovieMesh } {
  const outer: IAutoMovieProfilePoint[] = [];
  const inner: IAutoMovieProfilePoint[] = [];
  const throat: IAutoMovieProfilePoint[] = [];
  const radiusX: number = width / 2 - RIM_WIDTH;
  const radiusY: number = length / 2 - RIM_WIDTH;
  const neckHalfWidth: number = Math.sqrt(
    gripRadius ** 2 - (thickness / 2) ** 2,
  );
  const neckBottom: number = gripTop - RIM_WIDTH / 2;
  for (let i: number = 0; i < RIM_STATIONS; ++i) {
    const angle: number = (2 * Math.PI * i) / RIM_STATIONS;
    const x: number = Math.cos(angle);
    const y: number = Math.sin(angle);
    const point: IAutoMovieProfilePoint = {
      x: (x * width) / 2,
      y: (y * length) / 2,
    };
    const fromBottom: number = Math.abs(i - BOTTOM_STATION);
    if (fromBottom >= SHOULDER_OFFSET) outer.push(point);
    if (i === BOTTOM_STATION)
      outer.push(
        { x: -neckHalfWidth, y: neckBottom },
        { x: neckHalfWidth, y: neckBottom },
      );
    if (fromBottom <= SHOULDER_OFFSET / 2)
      throat.push({ x: point.x, y: point.y - RIM_WIDTH / 2 });
    inner.push({ x: x * radiusX, y: y * radiusY });
  }
  throat.push(
    { x: neckHalfWidth / 2, y: gripTop + 2 * RIM_WIDTH },
    { x: -neckHalfWidth / 2, y: gripTop + 2 * RIM_WIDTH },
  );

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
    const start: number = bed.mesh.positions.length;
    bed.strip(
      [
        { x: -x, y },
        { x: -x + STRING_SEAT_LENGTH, y },
        { x: x - STRING_SEAT_LENGTH, y },
        { x, y },
      ],
      STRING_GAUGE,
      STRING_GAUGE,
      front,
    );
    // Lower the end sections under the rim where the analytic endpoint meets the faceted opening.
    const positions: number[] = bed.mesh.positions;
    for (let vertex: number = start; vertex < positions.length; vertex += 3)
      if (Math.abs(positions[vertex]!) === x)
        positions[vertex + 2] = positions[vertex + 2]! - STRING_SEAT_DEPTH;
  }
  return {
    rim: AutoMovieEnginePlanarRegion.extrude({
      outer,
      holes: [inner, throat],
      depth: thickness,
    }),
    strings: bed.mesh,
  };
}

/** Number of samples around each oval, with stations on both axes. */
const RIM_STATIONS: number = 32;

/** Station at the bottom of the oval. */
const BOTTOM_STATION: number = (3 * RIM_STATIONS) / 4;

/** Angular distance in stations from the oval's bottom to each fork shoulder. */
const SHOULDER_OFFSET: number = RIM_STATIONS / 8;

/** Provisional radial inset of the composite rim from the outer bounds, metres. */
const RIM_WIDTH: number = 0.011;

/** Typical 1.3 mm tennis string gauge in metres. */
const STRING_GAUGE: number = 0.0013;

/** Distance in metres to seat each front string end beneath the frame surface. */
const STRING_SEAT_DEPTH: number = 0.00035;

/** Length in metres over which a front string approaches its seat. */
const STRING_SEAT_LENGTH: number = 4 * STRING_GAUGE;
