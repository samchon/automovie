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
 *
 * @evidence contracts/common.md#principled-implementation Angle-spaced stations sample elliptical plan width, sinusoidal thickness and upper-only Gaussian groove; smoothstep-faded advance fixes the posterior pole, and its 1.5 derivative maximum supplies the backward-ordering bound.
 * @evidence contracts/common.md#clear-and-simple-design One local body owns closed pole/ring incidence and normals; its component separately owns oral attachment and jaw motion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Dimensions, tessellation and plus/minus16 millimetre performance are authored conventions, not clinical limits or muscular roots; invalid inputs and reversed longitudinal ordering refuse without clipping.
 * @evidence contracts/common.md#meaningful-documentation Prose gives millimetres, tip/root layout, independent profiles, performance fade and posterior fixation; those equations certify no anatomical collision or motion capacity.
 * @evidence contracts/performance.md#efficient-algorithms R rows and C columns produce O(RC) vertices/triangles followed by linear area-normal accumulation; fixed counts define representation resolution.
 * @evidence contracts/performance.md#reuse-equivalent-work Station and width/front profiles share their owners with arch and jaw readers; changed shape/performance needs new geometry and normals.
 * @evidence contracts/performance.md#bound-retention-and-release-resources New mesh buffers belong to the caller; shape/performance stay unchanged and no global geometry, task or handle is retained.
 */
export function buildPortraitTongue(
  shape: IPortraitTongueShape,
  performance: { raise: number; advance: number } = { raise: 0, advance: 0 },
): IAutoMovieMesh {
  assertPortraitTongueShape(shape);
  if (
    ![performance.raise, performance.advance].every(
      (v: number): boolean => Number.isFinite(v) && Math.abs(v) <= 16,
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
  for (let row: number = 1; row < portraitTongueRows; row++) {
    const v: number = portraitTongueRingStation(row),
      r: number = Math.sin(Math.PI * v),
      w: number = portraitTongueWidthEnvelope(v);
    for (let col: number = 0; col < portraitTongueColumns; col++) {
      const a: number = (2 * Math.PI * col) / portraitTongueColumns,
        x: number = shape.halfWidth * w * Math.cos(a);
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
  const back: number = positions.length / 3;
  positions.push(0, 0, -shape.length);
  for (let col: number = 0; col < portraitTongueColumns; col++) {
    const next: number = (col + 1) % portraitTongueColumns;
    indices.push(0, 1 + col, 1 + next);
    for (let row: number = 0; row < portraitTongueRows - 2; row++) {
      const a: number = 1 + row * portraitTongueColumns + col,
        b: number = a + portraitTongueColumns,
        c: number = 1 + row * portraitTongueColumns + next,
        d: number = c + portraitTongueColumns;
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
