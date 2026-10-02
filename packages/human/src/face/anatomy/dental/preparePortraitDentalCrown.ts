import { IAutoMovieMesh } from "@automovie/interface";

import { areaWeightedNormals } from "../../../common/mesh/areaWeightedNormals";
import { assertPortraitDentalCrown } from "./assertPortraitDentalCrown";
import { IPortraitDentalCrown } from "./structures/IPortraitDentalCrown";

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
 * @evidence contracts/common.md#principled-implementation The crown is a loft of 32-sided rings whose half-width follows a contact-crest profile (0.92 to 1 by the crest, then a power-law narrowing to the cervical ratio), whose depth follows a sine thickening from a thin cutting edge, and whose edge corners rise as x^2 (1-v)^4; the exponents 0.45 on the cosine and sine round the section toward a rounded rectangle. Regular sampling rows and the contour crests share one sorted level list, so a crest cannot be skipped. Normals are area-weighted. The premises are the admitted crown and a mesial direction of plus or minus one.
 * @evidence contracts/modeling.md#part-identity-and-grouping The declaration builds the enamel of one tooth, the smallest part, and pairs it with its own cervical loop; hidden roots are not modelled.
 * @evidence contracts/modeling.md#emitted-geometry The primitive count follows the loft's resolution, 32 columns and 11 sampled levels plus the distinct contour crests, and is independent of the crown's dimensions; a smaller representation would lose the width, cervical and incisal-edge shaping the loft is for.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres in the crown's local frame with +Y towards the gingiva and +Z towards the lip; the cervical cycle is vertex identities.
 * @evidenceExclude contracts/modeling.md#parameter-channels The declaration consumes the crown's dimensions as inputs and defines no channel of its own.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The declaration builds one crown; the clearance between neighbours is the row's separation.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input shapes a form through this function beyond the crown type's named dimensions.
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
    normals: areaWeightedNormals(positions, indices),
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
