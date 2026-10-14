import { type Bounds, MeshWriter, cutBoxes } from "./orthogonal-mesh";

/**
 * Existing crossed grooves cut from the outdoor mat body.
 *
 * This production recipe places eight X and eight Z cuts at half-cell stations, each D/100 wide and H/7 deep, leaving the underside and inset ends solid for the authored mat dimensions. Finite positive dimensions are required; arbitrary extreme aspect ratios are not checked.
 *
 * Sixteen local cut records feed cutBoxes, including its interval-cell occupancy and coplanar UV-reference costs. The supplied writer owns appended geometry; no cut records or meshes are cached between calls.
 */
export function groovedMat(w: MeshWriter, b: Bounds): void {
  const W: number = b.x[1] - b.x[0],
    D: number = b.z[1] - b.z[0],
    H: number = b.y[1] - b.y[0];
  const width: number = D / 100,
    floor: number = b.y[1] - H / 7;
  const cuts: Bounds[] = [];
  for (let i: number = 0; i < 8; i++) {
    const x: number = b.x[0] + ((i + 0.5) * W) / 8;
    const z: number = b.z[0] + ((i + 0.5) * D) / 8;
    cuts.push({
      x: [x - width / 2, x + width / 2],
      y: [floor, b.y[1]],
      z: [b.z[0] + width, b.z[1] - width],
    });
    cuts.push({
      x: [b.x[0] + width, b.x[1] - width],
      y: [floor, b.y[1]],
      z: [z - width / 2, z + width / 2],
    });
  }
  cutBoxes(w, b, [], cuts);
}
