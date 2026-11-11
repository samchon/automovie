import * as THREE from "three";

import { AUTO_MOVIE_INSPECTION_PALETTE } from "./AUTO_MOVIE_INSPECTION_PALETTE.js";
import type { IAutoMovieInspectionConstruction } from "./IAutoMovieInspectionConstruction.js";
import type { IAutoMovieInspectionLegendEntry } from "./IAutoMovieInspectionLegendEntry.js";
import type { IAutoMovieInspectionOverlay } from "./IAutoMovieInspectionOverlay.js";
import { createAutoMovieInspectionSegments } from "./createAutoMovieInspectionSegments.js";
import { followAutoMovieInspectionSource } from "./followAutoMovieInspectionSource.js";
import { mergeAutoMovieInspectionLegends } from "./mergeAutoMovieInspectionLegends.js";

/**
 * Draw the construction curves of one form as coloured line segments that follow the form's object.
 *
 * Every given curve is drawn: consecutive points are joined, and a closed curve is joined back to its first point. A curve takes the palette colour of its kind, or the flagged colour when its sampler flagged it, so a ring or a guide the construction could not evaluate cleanly stands out from its neighbours. The legend counts curves, not segments, under `section curve`, `guide curve`, `axis curve` and `flagged curve`.
 *
 * It throws for a curve whose points are not whole xyz triples or are fewer than two.
 *
 * ```ts
 * const overlay = buildAutoMovieInspectionCurves(
 *   { parent: torso, curves: sampleAutoMovieConstructionCurves(realization) },
 *   { stroke: 3, xray: false },
 * );
 * scene.add(overlay.object);
 * overlay.update();
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is joined, the colour rule and why the flag overrides the kind, what the legend counts, the refusal, and shows the build, attach and update order.
 * @evidence contracts/development/implementation.md#principled-implementation The curve points are the form's rest geometry in its object's space, so the overlay takes that object's world matrix and the points themselves are never transformed.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission and counting, one fill of the two buffers, then the overlay record.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Colours come from the palette by kind and flag, with no curve id or part name read, and a malformed curve is refused instead of drawn short.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two passes over the points: one to size the buffers exactly, one to fill them. Every curve of the form is one draw call.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The line object, the follow rule and the legend tally are the shared inspection helpers. `buildAutoMovieConstruction` is not used: it draws one colour per call and releases asynchronously, where a picture needs a colour per curve and a synchronous restore.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The overlay owns one geometry and one material and releases both in `dispose`; it borrows the parent object and keeps no curve record.
 */
export function buildAutoMovieInspectionCurves(
  construction: IAutoMovieInspectionConstruction,
  options: { stroke: number; xray: boolean },
): IAutoMovieInspectionOverlay {
  // Admit every curve and count its segments before allocating.
  let count: number = 0;
  for (const curve of construction.curves) {
    if (curve.points.length % 3 !== 0 || curve.points.length < 6)
      throw new Error(
        `Construction curve "${curve.id}" holds ${curve.points.length} components, not two or more xyz points`,
      );
    count += curve.points.length / 3 - 1 + (curve.closed ? 1 : 0);
  }

  // Two vertices per segment, each with the colour of its curve.
  const positions: Float32Array = new Float32Array(count * 6);
  const colors: Float32Array = new Float32Array(count * 6);
  const legend: IAutoMovieInspectionLegendEntry[][] = [];
  const color: THREE.Color = new THREE.Color();
  let cursor: number = 0;
  for (const curve of construction.curves) {
    const hex: number = curve.flagged
      ? AUTO_MOVIE_INSPECTION_PALETTE.flagged
      : AUTO_MOVIE_INSPECTION_PALETTE.curve[curve.kind];
    legend.push([
      {
        label: curve.flagged ? "flagged curve" : `${curve.kind} curve`,
        color: hex,
        count: 1,
      },
    ]);
    color.setHex(hex);

    const points: number = curve.points.length / 3;
    const segments: number = points - 1 + (curve.closed ? 1 : 0);
    for (let s: number = 0; s < segments; s++)
      for (const point of [s, (s + 1) % points]) {
        positions[cursor] = curve.points[point * 3]!;
        positions[cursor + 1] = curve.points[point * 3 + 1]!;
        positions[cursor + 2] = curve.points[point * 3 + 2]!;
        colors[cursor] = color.r;
        colors[cursor + 1] = color.g;
        colors[cursor + 2] = color.b;
        cursor += 3;
      }
  }

  const object: THREE.LineSegments = createAutoMovieInspectionSegments(
    positions,
    colors,
    options,
  );
  return {
    object,
    legend: mergeAutoMovieInspectionLegends(legend),
    update: (): void =>
      followAutoMovieInspectionSource(object, construction.parent),
    dispose: (): void => {
      object.removeFromParent();
      object.geometry.dispose();
      (object.material as THREE.Material).dispose();
    },
  };
}
