import { portraitMix as mix } from "../../mesh/portraitMix";
import type { IControlMesh } from "../../mesh/structures/IControlMesh";
import { resolvePortraitCraniumShape } from "./resolvePortraitCraniumShape";
import { portraitCranialChinHeight } from "./portraitCranialChinHeight";
import { IPortraitCraniumShape } from "./structures/IPortraitCraniumShape";
import { facialOval } from "./facialOval";

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
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Continues the facial oval into distinct cranial vault, occipital and mandibular envelopes.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Builds ordered sagittal sections and a shared posterior cap while leaving an oriented collar for the neck.
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
  const angles = facialOval.map((id) =>
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
    facialOval.map((id, i) =>
      positions[id].map((value, axis) =>
        mix(value, sections[0][i][axis], transition),
      ),
    ),
  );
  const rings = [facialOval];
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
    for (let column = 0; column < facialOval.length; column++) {
      if (
        row > firstRow &&
        row <= lastRow &&
        column >= firstColumn &&
        column < lastColumn
      )
        continue;
      const next = (column + 1) % facialOval.length;
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
