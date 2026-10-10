import type { IAutoMovieMesh } from "@automovie/interface";

import { areaWeightedNormals } from "../../../common/mesh/areaWeightedNormals";
import { IPortraitTongueShape } from "./IPortraitTongueShape";
import { assertPortraitTongueShape } from "./assertPortraitTongueShape";
import { frontWeight } from "./frontWeight";
import { portraitTongueColumns } from "./portraitTongueColumns";
import { portraitTongueRingStation } from "./portraitTongueRingStation";
import { portraitTongueRows } from "./portraitTongueRows";
import { portraitTongueWidthEnvelope } from "./portraitTongueWidthEnvelope";

/**
 * Sample a closed tongue in a local millimetre frame. Elliptical cross-sections
 * join single anterior/posterior poles, with an upper-only median depression.
 * Their width follows `portraitTongueWidthEnvelope`, a rounded plan outline,
 * and their thickness follows sin(pi*v), so the tip is blunt from above and thin
 * from the side, with v the station from tip (0) to root (1) of `portraitTongueRingStation`,
 * whose rings are spaced by angle so a rounded pole is resolved.
 * Raise offsets the centreline by sin(pi*v)^2; advance moves the anterior body
 * by one minus smoothstep(v), leaving the posterior endpoint fixed. A backwards
 * advance that would reverse the longitudinal parameterization is refused.
 */
export function buildPortraitTongue(
  shape: IPortraitTongueShape,
  performance: { raise: number; advance: number } = { raise: 0, advance: 0 },
): IAutoMovieMesh {
  assertPortraitTongueShape(shape);
  if (
    ![performance.raise, performance.advance].every(
      (v) => Number.isFinite(v) && Math.abs(v) <= 16,
    )
  )
    throw new Error(
      "Tongue performance differences must be finite in [-16,16] mm.",
    );
  if (shape.length <= 1.5 * Math.max(0, -performance.advance))
    throw new Error(
      "Tongue retraction must preserve a strictly descending longitudinal coordinate.",
    );
  const positions: number[] = [0, 0, performance.advance],
    indices: number[] = [];
  for (let row = 1; row < portraitTongueRows; row++) {
    const v = portraitTongueRingStation(row),
      r = Math.sin(Math.PI * v),
      w = portraitTongueWidthEnvelope(v);
    for (let col = 0; col < portraitTongueColumns; col++) {
      const a = (2 * Math.PI * col) / portraitTongueColumns,
        x = shape.halfWidth * w * Math.cos(a);
      positions.push(
        x,
        shape.halfThickness * r * Math.sin(a) +
          (shape.dorsumRise + performance.raise) * r * r -
          shape.grooveDepth *
            Math.exp(-((x / shape.grooveWidth) ** 2)) *
            Math.max(0, Math.sin(a)) *
            r,
        -shape.length * v + performance.advance * frontWeight(v),
      );
    }
  }
  const back = positions.length / 3;
  positions.push(0, 0, -shape.length);
  for (let col = 0; col < portraitTongueColumns; col++) {
    const next = (col + 1) % portraitTongueColumns;
    indices.push(0, 1 + col, 1 + next);
    for (let row = 0; row < portraitTongueRows - 2; row++) {
      const a = 1 + row * portraitTongueColumns + col,
        b = a + portraitTongueColumns,
        c = 1 + row * portraitTongueColumns + next,
        d = c + portraitTongueColumns;
      indices.push(a, b, c, c, b, d);
    }
    indices.push(
      1 + (portraitTongueRows - 2) * portraitTongueColumns + col,
      back,
      1 + (portraitTongueRows - 2) * portraitTongueColumns + next,
    );
  }
  return {
    positions,
    indices,
    normals: areaWeightedNormals(positions, indices),
    uvs: null,
    skin: null,
  };
}
