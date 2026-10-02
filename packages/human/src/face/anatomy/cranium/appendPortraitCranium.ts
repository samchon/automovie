import { linearInterpolate as mix } from "../../mesh/linearInterpolate";
import type { IControlMesh } from "../../mesh/structures/IControlMesh";
import { portraitCranialChinHeight } from "./portraitCranialChinHeight";
import { portraitFacialOvalVertices } from "./portraitFacialOvalVertices";
import { resolvePortraitCraniumShape } from "./resolvePortraitCraniumShape";
import { IPortraitCraniumShape } from "./structures/IPortraitCraniumShape";

/**
 * Continue the caller's facial boundary across the cranial vault and jaw.
 * Sagittal stations distinguish the forehead, crown, occiput and mandibular
 * underside. Their hidden-side dimensions are authored estimates, not recovered
 * measurements of the photographed person.
 *
 * The underside has an open collar from the submental region to the nape.
 * Its ordered boundary belongs to the neck builder, so the finished skin is one
 * surface rather than a closed head intersecting a separate cylinder.
 * The input retains the first 468 measured facial vertex identities.
 *
 * @evidence contracts/common.md#principled-implementation The hidden vault is a lattice of rings built from sagittal stations: each ring point is (width sin a, mix(floor, crown, (1 + cos a)/2), mix(z, crownZ, max(0, cos a)^2)) with the angle a of the measured oval vertex, blended with equal angular spacing towards the rear so the posterior cap gets balanced cells, and the first row leaves the measured oval by a transition fraction. The occiput is a linearly blended Coons patch of the rear ring whose depth is then set from physical head coordinates by an elliptic paraboloid, because the Coons map compresses parameter spacing near the boundary. The stations are authored estimates, as the docs state.
 * @evidence contracts/common.md#clear-and-simple-design Ring construction, collar cut-out and cap patch are three consecutive blocks over one lattice; the neck builder owns everything below the collar.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The collar rows and columns are fixed indices of the fixed 36-vertex oval of the landmark basis, which is a contract of that basis and not a per-subject rule.
 * @evidence contracts/common.md#meaningful-documentation States the stations, that hidden-side dimensions are estimates, the open collar and that its ordered boundary belongs to the neck builder.
 * @evidence contracts/modeling.md#part-identity-and-grouping The cranium is the hidden continuation of the head's one skin surface and shares its cage and subdivision with the face patch and the neck, so it is a region of one part and not a part of its own.
 * @evidence contracts/modeling.md#emitted-geometry The population follows from the station count and the fixed 36-vertex oval: (stations + 1) new rings of 36 vertices (the collar cut-out omits faces, not vertices), plus one 9 x 9 cap patch; no author feature changes it. A smaller lattice would not carry the jaw-to-vault turn.
 * @evidence contracts/modeling.md#shared-boundaries The first ring is the measured oval's own vertex identities and the collar boundary is returned in oriented order for the neck, so the face patch, cranium and neck are one connected surface with no duplicated corners; a station set that does not descend in depth refuses.
 * @evidence contracts/modeling.md#spatial-conventions Head-frame millimetres with +Y up and +Z anterior throughout.
 */
export function appendPortraitCranium(
  cage: IControlMesh,
  shape?: IPortraitCraniumShape,
): {
  boundary: number[];
  exterior: number[][];
} {
  const { positions, indices, groups } = cage;
  const chinY = portraitCranialChinHeight(positions);
  // Each station gives posterior depth, half-width, crown and lower envelope.
  // Separate lower controls let the jaw turn towards its angle while the vault
  // continues around the braincase. These are independent anatomical envelopes;
  // the chin does not scale towards the cranial centre with the posterior vault.
  const { stations, capDepth, transition, frame } = resolvePortraitCraniumShape(
    chinY,
    shape,
  );
  const angles = portraitFacialOvalVertices.map((id) =>
    Math.atan2(
      positions[id][0] / frame.width,
      (positions[id][1] - frame.centerY) / frame.height,
    ),
  );
  const sections = stations.map((station, row) =>
    angles.map((measured, column) => {
      // Facial landmarks are denser around the chin than around the forehead.
      // Hidden rings gradually approach equal angular spacing so the posterior
      // cap receives balanced cells. The measured oval and first station retain
      // their correspondence; the squared blend changes only the hidden vault.
      const regular = (2 * Math.PI * column) / angles.length;
      const difference = Math.atan2(
        Math.sin(measured - regular),
        Math.cos(measured - regular),
      );
      const angle =
        regular + difference * (1 - (row / (stations.length - 1)) ** 2);
      return [
        station.width * Math.sin(angle),
        mix(station.floor, station.crown, (1 + Math.cos(angle)) / 2),
        // The frontal vault turns above the forehead before the temporal wall
        // reaches the same posterior station. Crown depth varies with angle.
        mix(station.z, station.crownZ, Math.max(0, Math.cos(angle)) ** 2),
      ];
    }),
  );
  // One transition row leaves the observed oval gradually. This is a control
  // row for the common subdivision surface, not an extra overlapping shell.
  sections.unshift(
    portraitFacialOvalVertices.map((id, i) =>
      positions[id].map((value, axis) =>
        mix(value, sections[0][i][axis], transition),
      ),
    ),
  );
  const rings = [portraitFacialOvalVertices];
  for (const section of sections)
    rings.push(section.map((point) => positions.push(point) - 1));

  // The collar occupies a rectangular part of this control lattice. The common
  // Loop refinement rounds its corners after the neck has joined these vertices.
  const firstRow = 1,
    lastRow = 5,
    // Include the jaw-angle region in the collar. Its lateral vertices become
    // shared neck attachments rather than closed underside panels.
    firstColumn = 12,
    lastColumn = 24;
  for (let row = 1; row < rings.length; row++)
    for (let column = 0; column < portraitFacialOvalVertices.length; column++) {
      if (
        row > firstRow &&
        row <= lastRow &&
        column >= firstColumn &&
        column < lastColumn
      )
        continue;
      const next = (column + 1) % portraitFacialOvalVertices.length;
      indices.push(
        rings[row - 1][column],
        rings[row - 1][next],
        rings[row][column],
        rings[row - 1][next],
        rings[row][next],
        rings[row][column],
      );
      groups.push(0, 0);
    }
  const rear = rings[rings.length - 1];
  // A four-sided Coons patch closes the occiput. Its 9 by 9 cells distribute
  // curvature across shared quads, keeping cap valence suitable for Loop
  // subdivision while preserving every vertex of the surrounding ring.
  const cells = rear.length / 4;
  const grid: number[][] = [];
  for (let row = 0; row <= cells; row++) {
    const line: number[] = [];
    for (let column = 0; column <= cells; column++) {
      if (row === 0) line.push(rear[column]);
      else if (column === cells) line.push(rear[cells + row]);
      else if (row === cells) line.push(rear[3 * cells - column]);
      else if (column === 0) line.push(rear[(rear.length - row) % rear.length]);
      else {
        const u = column / cells,
          v = row / cells;
        const top = positions[rear[column]],
          bottom = positions[rear[3 * cells - column]];
        const left = positions[rear[rear.length - row]],
          right = positions[rear[cells + row]];
        const point = [0, 1, 2].map(
          (axis) =>
            mix(top[axis], bottom[axis], v) +
            mix(left[axis], right[axis], u) -
            mix(
              mix(positions[rear[0]][axis], positions[rear[cells]][axis], u),
              mix(
                positions[rear[3 * cells]][axis],
                positions[rear[2 * cells]][axis],
                u,
              ),
              v,
            ),
        );
        // Curvature belongs to physical head coordinates. A sine of the patch
        // coordinates gave the same skull a visible round plateau because the
        // Coons map compresses its parameter spacing near the boundary.
        const station = stations[stations.length - 1];
        const middle = (station.crown + station.floor) / 2;
        const height = (station.crown - station.floor) / 2;
        const radiusSquared =
          (point[0] / station.width) ** 2 + ((point[1] - middle) / height) ** 2;
        point[2] = station.z - capDepth * (1 - radiusSquared);
        line.push(positions.push(point) - 1);
      }
    }
    grid.push(line);
  }
  for (let row = 0; row < cells; row++)
    for (let column = 0; column < cells; column++) {
      indices.push(
        grid[row][column],
        grid[row][column + 1],
        grid[row + 1][column],
        grid[row][column + 1],
        grid[row + 1][column + 1],
        grid[row + 1][column],
      );
      groups.push(0, 0);
    }

  // Follow the missing patch's winding: anterior edge, one side, posterior
  // edge, other side. No duplicated corners means every seam has two faces.
  const collar: number[] = [];
  const exterior: number[][] = [];
  const addCollar = (row: number, column: number): void => {
    collar.push(rings[row][column]);
    const neighbours: number[][] = [];
    if (row === firstRow) neighbours.push(positions[rings[row - 1][column]]);
    if (row === lastRow) neighbours.push(positions[rings[row + 1][column]]);
    if (column === firstColumn)
      neighbours.push(positions[rings[row][column - 1]]);
    if (column === lastColumn)
      neighbours.push(positions[rings[row][column + 1]]);
    exterior.push(
      [0, 1, 2].map(
        (axis) =>
          neighbours.reduce((sum, point) => sum + point[axis], 0) /
          neighbours.length,
      ),
    );
  };
  for (let column = firstColumn; column <= lastColumn; column++)
    addCollar(firstRow, column);
  for (let row = firstRow + 1; row <= lastRow; row++)
    addCollar(row, lastColumn);
  for (let column = lastColumn - 1; column >= firstColumn; column--)
    addCollar(lastRow, column);
  for (let row = lastRow - 1; row > firstRow; row--)
    addCollar(row, firstColumn);
  return { boundary: collar, exterior };
}
