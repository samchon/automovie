import assert from "node:assert/strict";
import test from "node:test";
import { ObjectMesh } from "../../geometry/object-mesh";

const close = (actual: number, expected: number): void =>
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);

void test("each planar object face projects metres with the outward normal's sign", () => {
  const mesh = new ObjectMesh().box("face", 1, 2, 3, 2, 1, 4).model("object.sample", "sample").parts[0]!.geometry;
  assert.equal(mesh.type, "mesh");
  if (mesh.type !== "mesh") return;
  const { positions: p, uvs: uv } = mesh.mesh;
  assert.ok(uv);
  for (let face = 0; face < 6; face++) {
    const first = face * 4 * 3;
    const a = p.slice(first, first + 3), b = p.slice(first + 3, first + 6), c = p.slice(first + 6, first + 9);
    const nx = (b[1]! - a[1]!) * (c[2]! - a[2]!) - (b[2]! - a[2]!) * (c[1]! - a[1]!);
    const ny = (b[2]! - a[2]!) * (c[0]! - a[0]!) - (b[0]! - a[0]!) * (c[2]! - a[2]!);
    const nz = (b[0]! - a[0]!) * (c[1]! - a[1]!) - (b[1]! - a[1]!) * (c[0]! - a[0]!);
    for (let corner = 0; corner < 4; corner++) {
      const vertex = face * 4 + corner, x = p[vertex * 3]!, y = p[vertex * 3 + 1]!, z = p[vertex * 3 + 2]!;
      const expected = Math.abs(ny) >= Math.abs(nx) && Math.abs(ny) >= Math.abs(nz)
        ? [x, ny >= 0 ? -z : z]
        : Math.abs(nx) >= Math.abs(nz) ? [nx >= 0 ? -z : z, y] : [nz >= 0 ? x : -x, y];
      close(uv![vertex * 2]!, expected[0]!);
      close(uv![vertex * 2 + 1]!, expected[1]!);
    }
  }
});

void test("a tapered object's U follows each ring radius and V follows slant length", () => {
  const mesh = new ObjectMesh().frustum("shell", 0, 0, 0, 1, 0.2, 0.3, 8)
    .model("object.sample", "sample").parts[0]!.geometry;
  assert.equal(mesh.type, "mesh");
  if (mesh.type !== "mesh") return;
  const { positions: p, uvs: uv } = mesh.mesh;
  assert.ok(uv);
  const first = 16;
  close(p[first * 3 + 2]!, 0);
  close(p[(first + 1) * 3 + 2]!, -0.2 * Math.sin(Math.PI / 4));
  close(uv![first * 2]!, 0);
  close(uv![(first + 1) * 2]!, 0.2 * Math.PI / 4);
  close(uv![(first + 2) * 2]!, 0.3 * Math.PI / 4);
  close(uv![(first + 2) * 2 + 1]!, Math.hypot(1, 0.1));
});

void test("vessel outside and inside unwrap from their separate low rings", () => {
  const mesh = new ObjectMesh().vessel("shell", 0, 0,
    [[0, 0.2], [1, 0.3]], [[1, 0.25], [0.1, 0.05]], 8)
    .model("object.sample", "sample").parts[0]!.geometry;
  assert.equal(mesh.type, "mesh");
  if (mesh.type !== "mesh") return;
  const uv = mesh.mesh.uvs!;
  close(uv[0]!, 0);
  close(uv[2]!, 0.2 * Math.PI / 4);
  close(uv[5]!, Math.hypot(1, 0.1));
  const innerSide = 2 * 8 * 4;
  close(uv[innerSide * 2 + 1]!, Math.hypot(0.9, 0.2));
  close(uv[(innerSide + 2) * 2 + 1]!, 0);
});
