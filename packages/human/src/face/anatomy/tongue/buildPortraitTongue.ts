import type { IAutoMovieMesh } from "@automovie/interface";
import { portraitNormals } from "../../mesh/portraitNormals";
import { assertPortraitTongueShape } from "./assertPortraitTongueShape";
import { IPortraitTongueShape } from "./IPortraitTongueShape";
import { frontWeight } from "./frontWeight";
import { rows } from "./rows";

/**
 * Sample a closed tongue in a local millimetre frame. Sinusoidal cross-sections
 * join single anterior/posterior poles, with an upper-only median depression.
 * Raise offsets the centreline by sin(pi*v)^2; advance moves the anterior body
 * by one minus smoothstep(v), leaving the posterior endpoint fixed. A backwards
 * advance that would reverse the longitudinal parameterization is refused.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Constructs independent lingual volume rather than colouring the cavity back wall.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Produces closed indexed rings, shared poles and geometric normals from named lingual dimensions.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-expression Separates observed shape from current dorsal and anterior displacement.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-expression Applies endpoint-aware observed-relative tongue displacements without changing enamel or lips.
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
  for (let row = 1; row < rows; row++) {
    const v = row / rows,
      r = Math.sin(Math.PI * v);
    for (let col = 0; col < columns; col++) {
      const a = (2 * Math.PI * col) / columns,
        x = shape.halfWidth * r * Math.cos(a);
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
  for (let col = 0; col < columns; col++) {
    const next = (col + 1) % columns;
    indices.push(0, 1 + col, 1 + next);
    for (let row = 0; row < rows - 2; row++) {
      const a = 1 + row * columns + col,
        b = a + columns,
        c = 1 + row * columns + next,
        d = c + columns;
      indices.push(a, b, c, c, b, d);
    }
    indices.push(
      1 + (rows - 2) * columns + col,
      back,
      1 + (rows - 2) * columns + next,
    );
  }
  return {
    positions,
    indices,
    normals: portraitNormals(positions, indices),
    uvs: null,
    skin: null,
  };
}

/** How many samples go round each lingual ring. */
const columns = 48;
