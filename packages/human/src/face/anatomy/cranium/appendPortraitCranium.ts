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
 * @evidence contracts/common.md#principled-implementation Measured facial oval identities join authored sagittal vault/jaw rings, an open neck collar and a Coons-patch posterior cap on one shared control cage.
 * @evidence contracts/common.md#clear-and-simple-design Shape resolution owns admitted station controls while this assembler appends positions/triangles/groups and returns the ordered collar plus outside-neighbour means.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The original 468 measured identities remain intact; hidden dimensions are authored estimates and an open collar avoids an overlapping closed-head/neck shell.
 * @evidence contracts/common.md#meaningful-documentation The prose states sagittal roles, hidden-measurement limitation, cage identity retention and oriented neck attachment ownership.
 * @evidence contracts/performance.md#efficient-algorithms For R admitted stations and fixed 36-point oval, rings scale with R; the fixed 9-by-9 posterior patch and 32-point collar add bounded work and allocations.
 * @evidence contracts/performance.md#reuse-equivalent-work Resolved station controls and one oval-angle list are reused for every ring; original cage vertices are referenced directly rather than duplicated at seams.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller's cage owns appended geometry and returned collar data; temporary rings/grid/sections expire and no cage or generation cache is retained.
 */
export function appendPortraitCranium(
  cage: IControlMesh,
  shape?: IPortraitCraniumShape,
): {
  boundary: number[];
  exterior: number[][];
} {
  const { positions, indices, groups }: IControlMesh = cage;
  const chinY: number = portraitCranialChinHeight(positions);
  // Each station gives posterior depth, half-width, crown and lower envelope.
  // Separate lower controls let the jaw turn towards its angle while the vault
  // continues around the braincase. These are independent anatomical envelopes;
  // the chin does not scale towards the cranial centre with the posterior vault.
  const { stations, capDepth, transition, frame }: ReturnType<typeof resolvePortraitCraniumShape> = resolvePortraitCraniumShape(
    chinY,
    shape,
  );
  const angles: number[] = portraitFacialOvalVertices.map((id: number): number  =>
    Math.atan2(
      positions[id][0] / frame.width,
      (positions[id][1] - frame.centerY) / frame.height,
    ),
  );
  const sections: number[][][] = stations.map((station: ReturnType<typeof resolvePortraitCraniumShape>["stations"][number], row: number): number[][] =>
    angles.map((measured: number, column: number): number[]  => {
      // Facial landmarks are denser around the chin than around the forehead.
      // Hidden rings gradually approach equal angular spacing so the posterior
      // cap receives balanced cells. The measured oval and first station retain
      // their correspondence; the squared blend changes only the hidden vault.
      const regular: number = (2 * Math.PI * column) / angles.length;
      const difference: number = Math.atan2(
        Math.sin(measured - regular),
        Math.cos(measured - regular),
      );
      const angle: number =
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
    portraitFacialOvalVertices.map((id: number, i: number): number[]  =>
      positions[id].map((value: number, axis: number): number  =>
        mix(value, sections[0][i][axis], transition),
      ),
    ),
  );
  const rings: number[][] = [portraitFacialOvalVertices];
  for (const section of sections)
    rings.push(section.map((point: number[]): number  => positions.push(point) - 1));

  // The collar occupies a rectangular part of this control lattice. The common
  // Loop refinement rounds its corners after the neck has joined these vertices.
  const firstRow: number = 1 as const,
    lastRow: number = 5 as const,
    // Include the jaw-angle region in the collar. Its lateral vertices become
    // shared neck attachments rather than closed underside panels.
    firstColumn: number = 12 as const,
    lastColumn: number = 24 as const;
  for (let row: number = 1; row < rings.length; row++)
    for (let column: number = 0; column < portraitFacialOvalVertices.length; column++) {
      if (
        row > firstRow &&
        row <= lastRow &&
        column >= firstColumn &&
        column < lastColumn
      )
        continue;
      const next: number = (column + 1) % portraitFacialOvalVertices.length;
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
  const rear: number[] = rings[rings.length - 1];
  // A four-sided Coons patch closes the occiput. Its 9 by 9 cells distribute
  // curvature across shared quads, keeping cap valence suitable for Loop
  // subdivision while preserving every vertex of the surrounding ring.
  const cells: number = rear.length / 4;
  const grid: number[][] = [];
  for (let row: number = 0; row <= cells; row++) {
    const line: number[] = [];
    for (let column: number = 0; column <= cells; column++) {
      if (row === 0) line.push(rear[column]);
      else if (column === cells) line.push(rear[cells + row]);
      else if (row === cells) line.push(rear[3 * cells - column]);
      else if (column === 0) line.push(rear[(rear.length - row) % rear.length]);
      else {
        const u: number = column / cells,
          v: number = row / cells;
        const top: number[] = positions[rear[column]],
          bottom: number[] = positions[rear[3 * cells - column]];
        const left: number[] = positions[rear[rear.length - row]],
          right: number[] = positions[rear[cells + row]];
        const point: number[] = [0, 1, 2].map(
          (axis: number): number  =>
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
        const station: ReturnType<typeof resolvePortraitCraniumShape>["stations"][number] = stations[stations.length - 1];
        const middle: number = (station.crown + station.floor) / 2;
        const height: number = (station.crown - station.floor) / 2;
        const radiusSquared: number =
          (point[0] / station.width) ** 2 + ((point[1] - middle) / height) ** 2;
        point[2] = station.z - capDepth * (1 - radiusSquared);
        line.push(positions.push(point) - 1);
      }
    }
    grid.push(line);
  }
  for (let row: number = 0; row < cells; row++)
    for (let column: number = 0; column < cells; column++) {
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
  const addCollar: (row: number, column: number) => void = (row: number, column: number): void => {
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
        (axis: number): number  =>
          neighbours.reduce((sum: number, point: number[]): number  => sum + point[axis], 0) /
          neighbours.length,
      ),
    );
  };
  for (let column: number = firstColumn; column <= lastColumn; column++)
    addCollar(firstRow, column);
  for (let row: number = firstRow + 1; row <= lastRow; row++)
    addCollar(row, lastColumn);
  for (let column: number = lastColumn - 1; column >= firstColumn; column--)
    addCollar(lastRow, column);
  for (let row: number = lastRow - 1; row > firstRow; row--)
    addCollar(row, firstColumn);
  return { boundary: collar, exterior };
}
