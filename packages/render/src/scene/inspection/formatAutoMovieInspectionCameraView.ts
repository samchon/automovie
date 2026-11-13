import type { IAutoMovieInspectionCamera } from "./IAutoMovieInspectionCamera.js";
import { formatAutoMovieInspectionView } from "./formatAutoMovieInspectionView.js";

/** Tolerance on unit vectors below which two up directions are one, or a line of sight counts as vertical. */
const SAME: number = 1e-9;

/**
 * Write the view text that draws a resolved camera again: a fixed view at its eye looking at its target, with `@ortho=<metres per pixel>` for an orthographic camera and `@up=` when world `+Y` would roll the picture otherwise, written by `formatAutoMovieInspectionView`.
 *
 * A record keeps this text beside each cell's camera, so a later round copies it as is and draws through the same camera even when what is drawn changes, as when a surface is hidden and a fitted view would frame a smaller box. The up is written only when needed: when the line of sight is vertical, so `+Y` cannot orient the picture, or when the recorded up differs from the one `+Y` gives. A perspective camera repeats with the subject's own lens and clips; an orthographic one repeats its scale exactly, and its clips by the fixed view's rule of a quarter and three and a half times the eye's distance to the target, which are a fitted orthographic view's own clips.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the text produced, why the record keeps it, when the up is written, and what of the camera a repeat reproduces.
 * @evidence contracts/development/implementation.md#principled-implementation `lookAt` with an up direction keeps the up's component across the line of sight, so the up `+Y` gives is `Y` minus its projection on the line of sight, normalised; when that equals the recorded up the default reproduces the roll, and when the line of sight is vertical it is undefined and the recorded up must be written.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Build the fixed view from the record, then the shared view writer.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The tolerance only decides whether a written default would reproduce the record; it never rounds a written number.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure conversion of one record.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh string and keeps nothing.
 */
export function formatAutoMovieInspectionCameraView(
  camera: IAutoMovieInspectionCamera,
): string {
  const sight: [number, number, number] = [
    camera.target.x - camera.position.x,
    camera.target.y - camera.position.y,
    camera.target.z - camera.position.z,
  ];
  const length: number = Math.hypot(...sight);
  const forward: number[] = sight.map(
    (value: number): number => value / length,
  );

  // The up `+Y` gives: Y without its part along the line of sight.
  const along: number = forward[1]!;
  const implied: number[] = [
    -along * forward[0]!,
    1 - along * forward[1]!,
    -along * forward[2]!,
  ];
  const size: number = Math.hypot(...implied);
  const recorded: number[] = [camera.up.x, camera.up.y, camera.up.z];
  const norm: number = Math.hypot(...recorded);
  const same: boolean =
    size > SAME &&
    implied.every(
      (value: number, axis: number): boolean =>
        Math.abs(value / size - recorded[axis]! / norm) <= SAME,
    );
  return formatAutoMovieInspectionView({
    type: "fixed",
    position: { ...camera.position },
    target: { ...camera.target },
    metresPerPixel:
      camera.projection === "orthographic" ? camera.metresPerPixel : null,
    up: same ? null : { ...camera.up },
  });
}
