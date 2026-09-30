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
 * @evidence contracts/common.md#principled-implementation The body is a stack of elliptical rings between two poles: each ring has the plan half-width of `portraitTongueWidthEnvelope` and the vertical half-thickness of a sine envelope, with a dorsal rise added as sin^2 so both poles stay fixed, and an upper-only Gaussian groove. Raising offsets the centreline; advancing moves the anterior body by one minus smoothstep of the station, which leaves the posterior pole fixed, and a retraction that would reverse the longitudinal order is refused. Normals are area-weighted over the closed indexed surface, and the rings sit at angle-spaced stations so the rounded poles are resolved.
 * @evidence contracts/common.md#clear-and-simple-design One builder over one vertex layout, read by the station function; the rounding and weighting live in their own small owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or fixture is named; every constant is a documented dimension of the shape type or a tessellation count.
 * @evidence contracts/common.md#meaningful-documentation The comment states the sections, the two envelopes, what raise and advance do and the refused retraction.
 * @evidence contracts/modeling.md#part-identity-and-grouping The declaration builds one part, the tongue body, a single closed volume with no members.
 * @evidence contracts/modeling.md#parameter-channels Raise and advance are the two performance channels: raise is the dorsal centreline offset in millimetres and advance is the anterior body's displacement in millimetres, each zero at the observed body. Positive raise lifts the dorsum and positive advance moves the tip anteriorly (+Z). They vary independent traits; the admitted retraction depends on the body length, which the builder checks.
 * @evidence contracts/modeling.md#emitted-geometry The surface is a parametric stack of rings, 2 + (rows - 1) x columns vertices for every tongue whatever its dimensions; no per-feature primitive is emitted. A closed parametric ellipsoid-like body has no simpler representation that keeps the median groove and the raised dorsum.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres in a local frame: the tip at the origin, the root at -length along Z, X transverse and Y superior. The component maps this frame to the head in one named step.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The body is a free closed volume that shares no boundary with another part; contact with the teeth and lining is not solved, as the component's documentation states.
 * @evidence contracts/anatomy.md#parametric-authority Inputs are the eight named lingual dimensions in millimetres and two named performance offsets; none addresses a vertex, curve or patch.
 
 * @evidence contracts/modeling.md#rendered-observation The isolated tongue body was rendered on the real GPU with a directional key light in the normal pass at its minimum dimensions (5 by 20 by 2 mm, no rise or groove) from above at 70 degrees, the side, a 40 degree oblique, from below at 60 degrees and the front at 0.05 m, and in the beauty pass at the default dimensions with an 8 mm raise and 8 mm advance, and at its maximum dimensions (35 by 70 by 15 mm, 15 mm rise, 3 mm groove 8 mm wide) from the same five views at 0.14 m. The default body at rest was also seen assembled with the lips and teeth from six views, including the opposite oblique, before the ring spacing changed. Seen: a smooth closed volume with a round-ended plan outline and no pole nub, a median notch on the maximum body only at its posterior edge, an advance that curls the anterior body forward over a fixed posterior end. Named ceilings: the outline is a symmetric ellipse and not a measured tongue, the maximum body is wider than the mouth and the lower arch and no admitted-range check refuses that combination, and no clay pass, back view or population of tongues was rendered.*/
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
