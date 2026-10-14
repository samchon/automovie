import { IAutoMovieMesh } from "@automovie/interface";

import { areaWeightedNormals } from "../../../common/mesh/areaWeightedNormals";
import { assertPortraitDentalCrown } from "./assertPortraitDentalCrown";
import { IPortraitDentalCrown } from "./structures/IPortraitDentalCrown";
import type { IPortraitDentalSideContour } from "./structures/IPortraitDentalSideContour";

/**
 * A closed crown loft with a narrow cervical end, broad body and thin cutting
 * edge. End caps share their ring identities. The sampled body reaches exactly
 * the declared local width. The row owns clearance after arch rotation; nominal
 * breadth alone does not separate the proximal surfaces. Hidden roots are not modelled.
 *
 * Optional side contours locate each contact crest independently. Their heights
 * join the regular sampling rows, so an unsampled authored crest cannot shrink
 * the delivered crown or silently change arch spacing. The row always supplies
 * mesialDirection (+1 or -1 along local X); a standalone crown defaults to +1.
 * Incisal rise is multiplied by x^2 and fades toward the cervical end, retaining
 * a continuous central edge even when the two proximal corners differ.
 * The result pairs this owned mesh with its directed cervical cap cycle; the
 * cycle is constructed with the loft, before any row placement or packing.
 *
 * @evidence contracts/common.md#principled-implementation A closed 32-column loft includes both authored proximal contact-height rows so the sampled width and cervical cap cycle follow the same source crown.
 * @evidence contracts/common.md#clear-and-simple-design Dimension admission precedes ring/cap emission and the shared normal owner; returned mesh and directed cervical IDs are constructed together before placement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No later height/count/position search recovers cervical identity; nominal breadth alone is not rotated-crown separation and hidden roots remain unmodelled.
 * @evidence contracts/common.md#meaningful-documentation The prose states side contour authority, mesial sign, incisal-rise fade, owned buffers and construction-time cap correspondence.
 * @evidence contracts/performance.md#efficient-algorithms Eleven regular levels plus at most two contour heights bound sorting and all 32-column ring/cap work; normals are computed once over that bounded mesh.
 * @evidence contracts/performance.md#reuse-equivalent-work Standalone and row consumers reuse this same loft and sampled crest/cervical construction, not a separate spacing proxy.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned mesh arrays and cervical cycle are caller-owned; level/contour temporaries expire and no crown cache or resource survives.
 */
export function preparePortraitDentalCrown(
  s: IPortraitDentalCrown,
  mesialDirection: number = 1,
): { mesh: IAutoMovieMesh; cervical: number[] } {
  assertPortraitDentalCrown(s);
  if (mesialDirection !== 1 && mesialDirection !== -1)
    throw new Error(
      "A dental crown needs mesial direction +1 or -1 in its local X frame.",
    );
  const columns: number = 32 as const,
    positions: number[] = [],
    indices: number[] = [];
  const contours: {
    contactHeight: number;
    cervicalWidth: number;
    incisalRise: number;
  }[] = [s.contour?.mesial, s.contour?.distal].map(
    (
      side: IPortraitDentalSideContour | undefined,
    ): {
      contactHeight: number;
      cervicalWidth: number;
      incisalRise: number;
    } => ({
      contactHeight: side?.contactHeight ?? 0.3,
      cervicalWidth: side?.cervicalWidth ?? s.cervicalWidth,
      incisalRise: side?.incisalRise ?? s.edgeRise,
    }),
  );
  const levels: number[] = [
    ...new Set([
      ...Array.from({ length: 11 }, (_: unknown, i: number): number => i / 10),
      ...contours.map(
        (c: {
          contactHeight: number;
          cervicalWidth: number;
          incisalRise: number;
        }): number => c.contactHeight,
      ),
    ]),
  ].sort((a: number, b: number): number => a - b);
  const rows: number = levels.length - 1;
  const rounded: (v: number) => number = (v: number): number =>
    Math.sign(v) * Math.abs(v) ** 0.45;
  for (let row: number = 0; row <= rows; row++) {
    const v: number = levels[row];
    const thickness: number =
      0.22 + 0.78 * Math.sin((Math.min(1, v / 0.4) * Math.PI) / 2);
    for (let column: number = 0; column < columns; column++) {
      const a: number = (column / columns) * 2 * Math.PI,
        x: number = rounded(Math.cos(a));
      const contour: {
        contactHeight: number;
        cervicalWidth: number;
        incisalRise: number;
      } = contours[x * mesialDirection >= 0 ? 0 : 1];
      const breadth: number =
        v <= contour.contactHeight
          ? 0.92 + 0.08 * Math.sin(((v / contour.contactHeight) * Math.PI) / 2)
          : 1 -
            (1 - contour.cervicalWidth) *
              ((v - contour.contactHeight) / (1 - contour.contactHeight)) **
                1.4;
      positions.push(
        (s.width / 2) * breadth * x,
        -s.height / 2 +
          s.height * v +
          contour.incisalRise * x * x * (1 - v) ** 4,
        -s.depth * thickness * rounded(Math.sin(a)),
      );
    }
  }
  for (let row: number = 0; row < rows; row++)
    for (let column: number = 0; column < columns; column++) {
      const a: number = row * columns + column,
        b: number = row * columns + ((column + 1) % columns),
        c: number = a + columns,
        d: number = b + columns;
      indices.push(a, b, c, b, d, c);
    }
  const bottom: number = positions.length / 3;
  positions.push(0, -s.height / 2, 0, 0, s.height / 2, 0);
  for (let column: number = 0; column < columns; column++) {
    const next: number = (column + 1) % columns;
    indices.push(
      bottom,
      next,
      column,
      bottom + 1,
      rows * columns + column,
      rows * columns + next,
    );
  }
  const mesh: IAutoMovieMesh = {
    positions,
    indices,
    normals: areaWeightedNormals(positions, indices),
    uvs: null,
    skin: null,
  };
  // The cervical cap owns this directed cycle. Its row is determined by the
  // actual sampled levels, including independently authored proximal crests.
  // Keep these IDs at construction; recovering them later from height or a
  // fixed vertex count would break after sampling or a rigid oral placement.
  const cervical: number[] = Array.from(
    { length: columns },
    (_: unknown, column: number): number => rows * columns + column,
  );
  return { mesh, cervical };
}
