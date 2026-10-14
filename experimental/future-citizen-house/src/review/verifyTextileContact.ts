import type { IAutoMovieMesh } from "@automovie/interface";
import assert from "node:assert/strict";

import { MeshWriter } from "../common/model-geometry/orthogonal-mesh";
import { textileBody } from "../common/model-geometry/textile-mesh";

/**
 * Pin folded and unfolded textile bounds, signed volume and projected UVs from the emitted mesh.
 *
 * Scenarios:
 * 1. Both branches retain the sole at zero, top within 0.24 metres, nonempty upper/sole populations and analytic rounded-outline volume.
 * 2. The folded branch removes a triangular-prism volume of 0.005 cubic metres and places centre groove vertices at 0.21 metres.
 * 3. Upper UVs retain X/Z projected metre coordinates, including the folded case.
 *
 * Volume expectations use the sampled rounded-corner polygon area and independent prism arithmetic. Projected UV checks do not establish the design's slope-length requirement. Degenerate bounds, other textile sizes and full catalog meshes are outside these cases; model-source-audit owns the catalog population. pure-tests.ts discovers this portable function through textile-mesh.test.ts without a browser, GPU or native artifact.
 */
export function verifyTextileContact(): void {
  const bounds: { x: [number, number]; y: [number, number]; z: [number, number]; } = {
    x: [-1, 1] as [number, number],
    y: [0, 0.24] as [number, number],
    z: [-1, 1] as [number, number],
  };
  for (const folded of [false, true]) {
    const writer: MeshWriter = new MeshWriter();
    textileBody(writer, bounds, folded);
    const mesh: IAutoMovieMesh = writer.finish();
    let volume: number = 0;
    for (let i: number = 0; i < mesh.indices!.length; i += 3) {
      const [a, b, c]: number[][] = mesh
        .indices!.slice(i, i + 3)
        .map((j: number) : number[] => mesh.positions.slice(j * 3, j * 3 + 3));
      volume +=
        (a[0] * (b[1] * c[2] - b[2] * c[1]) +
          a[1] * (b[2] * c[0] - b[0] * c[2]) +
          a[2] * (b[0] * c[1] - b[1] * c[0])) /
        6;
    }
    // A 24-edge circle approximates the four r=.12 corners; the V groove
    // removes a 2m-long triangular prism, width 1/6m and depth .03m.
    const expected: number =
      (4 - 4 * 0.12 ** 2 + 12 * 0.12 ** 2 * Math.sin(Math.PI / 12)) * 0.24 -
      (folded ? 0.005 : 0);
    assert.ok(Math.abs(volume - expected) < 1e-10);
    let upper: number = 0,
      lower: number = 0,
      groove: number = 0;
    for (let i: number = 0; i < mesh.positions.length; i += 3) {
      const [x, y, z]: number[] = mesh.positions.slice(i, i + 3);
      assert.ok(y >= 0 && y <= 0.24);
      if (mesh.normals![i + 1] < -0.99) {
        assert.equal(y, 0);
        lower++;
      }
      if (mesh.normals![i + 1] > 0) {
        upper++;
        assert.ok(Math.abs(mesh.uvs![(i / 3) * 2] - (x + 1)) < 1e-10);
        assert.ok(Math.abs(mesh.uvs![(i / 3) * 2 + 1] - (z + 1)) < 1e-10);
        if (Math.abs(z) < 1e-12) {
          assert.ok(Math.abs(y - 0.21) < 1e-10);
          groove++;
        } else if (!folded) assert.equal(y, 0.24);
      }
    }
    assert.ok(upper && lower);
    if (folded) assert.ok(groove);
  }
}
