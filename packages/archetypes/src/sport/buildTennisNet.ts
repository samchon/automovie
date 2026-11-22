import type { IAutoMovieMesh } from "@automovie/interface";

import { TennisMesh } from "./TennisMesh";

/** Representative 45 mm pitch and 3.5 mm twine in metres (Edwards doubles tennis nets). */
const PITCH: number = 0.045;
const TWINE: number = 0.0035;

/** Visible tape width in metres, inside ITF Rule 1's 50 to 63.5 mm band. */
const TAPE: number = 0.055;

/**
 * Build a doubles net's open lattice and white binding in its local XY plane. All inputs are metres. `halfSpan` is post-to-centre distance, `centre` and `post` locate the physical cable, and `cordDiameter` and `strapWidth` size its covering.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the visual parts and their metre-valued frame and dimensions.
 * @evidence contracts/development/implementation.md#principled-implementation Tape wraps the two existing straight cable runs. Vertical strands reach the sagging tape; horizontal runs sag by their proportional height and meet each strand at the same level on both sides.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Share the linear cable profile for the lattice and tape, then add the centre strap to the tape mesh.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The V-shaped physical cable retains its profile, and the lattice records holes without physical parts per strand.
 * @evidence contracts/development/implementation.md#efficient-algorithms Sized by span and height at a 45 mm pitch, with two stations per vertical strand and three per horizontal run. The rule-sized net emits two meshes and fewer than 4,000 triangles.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One cable profile drives every endpoint and one mesh buffer serves all pieces of each finish.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the two bounded mesh buffers survive the call; no paths or external resources are retained.
 */
export function buildTennisNet(
  halfSpan: number,
  centre: number,
  post: number,
  cordDiameter: number,
  strapWidth: number,
): { twine: IAutoMovieMesh; tape: IAutoMovieMesh } {
  const tapeCentre: number = centre + (cordDiameter - TAPE) / 2;
  const tapePost: number = post + (cordDiameter - TAPE) / 2;
  const bottom: number = TWINE / 2;
  const meshCentre: number = tapeCentre - TAPE / 2 + TWINE;
  const meshPost: number = tapePost - TAPE / 2 + TWINE;
  const spanCells: number = Math.ceil(halfSpan / PITCH);
  const heightCells: number = Math.ceil((meshPost - bottom) / PITCH);
  const twine: TennisMesh = new TennisMesh();
  for (let i: number = -spanCells; i <= spanCells; ++i) {
    const t: number = i / spanCells;
    const x: number = t * halfSpan;
    const y: number = meshCentre + (meshPost - meshCentre) * Math.abs(t);
    twine.strip(
      [
        { x, y: bottom },
        { x, y },
      ],
      TWINE,
      TWINE,
      TWINE / 3,
    );
  }
  for (let i: number = 0; i < heightCells; ++i) {
    const t: number = i / heightCells;
    const y: number = bottom + t * (meshPost - bottom);
    twine.strip(
      [
        { x: -halfSpan, y },
        { x: 0, y: bottom + t * (meshCentre - bottom) },
        { x: halfSpan, y },
      ],
      TWINE,
      TWINE,
      -TWINE / 3,
    );
  }
  const tape: TennisMesh = new TennisMesh();
  tape.strip(
    [
      { x: -halfSpan, y: tapePost },
      { x: 0, y: tapeCentre },
      { x: halfSpan, y: tapePost },
    ],
    TAPE,
    cordDiameter + TWINE,
  );
  tape.strip(
    [
      { x: 0, y: 0 },
      { x: 0, y: tapeCentre },
    ],
    strapWidth,
    cordDiameter + TWINE,
  );
  return { twine: twine.mesh, tape: tape.mesh };
}
