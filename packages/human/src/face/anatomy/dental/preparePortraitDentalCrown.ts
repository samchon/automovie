import { portraitNormals } from "../../mesh/portraitNormals";
import { assertPortraitDentalCrown } from "./assertPortraitDentalCrown";
import { IPortraitDentalCrown } from "./structures/IPortraitDentalCrown";
import { IAutoMovieMesh } from "@automovie/interface";

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
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Constructs a closed enamel crown with independently located mesial and distal contours.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Samples both authored contact crests, joins cervical and incisal caps to their rings and derives normals from the resulting oriented loft.
 */
export function preparePortraitDentalCrown(
  s: IPortraitDentalCrown,
  mesialDirection: number = 1,
) {
  assertPortraitDentalCrown(s);
  if (mesialDirection !== 1 && mesialDirection !== -1)
    throw new Error(
      "A dental crown needs mesial direction +1 or -1 in its local X frame.",
    );
  const columns = 32,
    positions: number[] = [],
    indices: number[] = [];
  const contours = [s.contour?.mesial, s.contour?.distal].map((side) => ({
    contactHeight: side?.contactHeight ?? 0.3,
    cervicalWidth: side?.cervicalWidth ?? s.cervicalWidth,
    incisalRise: side?.incisalRise ?? s.edgeRise,
  }));
  const levels = [
    ...new Set([
      ...Array.from({ length: 11 }, (_, i) => i / 10),
      ...contours.map((c) => c.contactHeight),
    ]),
  ].sort((a, b) => a - b);
  const rows = levels.length - 1;
  const rounded = (v: number) => Math.sign(v) * Math.abs(v) ** 0.45;
  for (let row = 0; row <= rows; row++) {
    const v = levels[row];
    const thickness =
      0.22 + 0.78 * Math.sin((Math.min(1, v / 0.4) * Math.PI) / 2);
    for (let column = 0; column < columns; column++) {
      const a = (column / columns) * 2 * Math.PI,
        x = rounded(Math.cos(a));
      const contour = contours[x * mesialDirection >= 0 ? 0 : 1];
      const breadth =
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
  for (let row = 0; row < rows; row++)
    for (let column = 0; column < columns; column++) {
      const a = row * columns + column,
        b = row * columns + ((column + 1) % columns),
        c = a + columns,
        d = b + columns;
      indices.push(a, b, c, b, d, c);
    }
  const bottom = positions.length / 3;
  positions.push(0, -s.height / 2, 0, 0, s.height / 2, 0);
  for (let column = 0; column < columns; column++) {
    const next = (column + 1) % columns;
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
    normals: portraitNormals(positions, indices),
    uvs: null,
    skin: null,
  };
  // The cervical cap owns this directed cycle. Its row is determined by the
  // actual sampled levels, including independently authored proximal crests.
  // Keep these IDs at construction; recovering them later from height or a
  // fixed vertex count would break after sampling or a rigid oral placement.
  const cervical = Array.from(
    { length: columns },
    (_, column) => rows * columns + column,
  );
  return { mesh, cervical };
}
