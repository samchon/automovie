import assert from "node:assert/strict";

import { MeshWriter } from "./orthogonal-mesh";
import { textileBody } from "./textile-mesh";

/** Independent volume and surface-height checks of the authored contact body. */
export function verifyTextileContact(): void {
  const bounds = {
    x: [-1, 1] as [number, number],
    y: [0, 0.24] as [number, number],
    z: [-1, 1] as [number, number],
  };
  for (const folded of [false, true]) {
    const writer = new MeshWriter();
    textileBody(writer, bounds, folded);
    const mesh = writer.finish();
    let volume = 0;
    for (let i = 0; i < mesh.indices!.length; i += 3) {
      const [a, b, c] = mesh
        .indices!.slice(i, i + 3)
        .map((j) => mesh.positions.slice(j * 3, j * 3 + 3));
      volume +=
        (a[0] * (b[1] * c[2] - b[2] * c[1]) +
          a[1] * (b[2] * c[0] - b[0] * c[2]) +
          a[2] * (b[0] * c[1] - b[1] * c[0])) /
        6;
    }
    // A 24-edge circle approximates the four r=.12 corners; the V groove
    // removes a 2m-long triangular prism, width 1/6m and depth .03m.
    const expected =
      (4 - 4 * 0.12 ** 2 + 12 * 0.12 ** 2 * Math.sin(Math.PI / 12)) * 0.24 -
      (folded ? 0.005 : 0);
    assert.ok(Math.abs(volume - expected) < 1e-10);
    let upper = 0,
      lower = 0,
      groove = 0;
    for (let i = 0; i < mesh.positions.length; i += 3) {
      const [x, y, z] = mesh.positions.slice(i, i + 3);
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
