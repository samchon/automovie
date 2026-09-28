/** Roof boundaries retain ceramic cover instead of deleting whole modules. */
import assert from "node:assert/strict";
import test from "node:test";
import { validateMeshTopology } from "@automovie/engine";
import { TempleCladding } from "../../models/cladding";

void test("diagonal valley cuts preserve all surviving tile parts and close valid cut faces", () => {
  const plane = { x: 1, y: 0.2, z: -0.6, constant: 0.1 };
  const model = new TempleCladding().roofTileCut("valley", [plane]);
  assert.ok(model !== null);
  assert.deepEqual(model.parts.map((part) => part.id), ["tegula", "lip", "imbrex"]);
  for (const part of model.parts) {
    assert.equal(part.geometry.type, "mesh");
    if (part.geometry.type !== "mesh") continue;
    const mesh = part.geometry.mesh;
    assert.equal(validateMeshTopology({ mesh }).success, true, part.id);
    assert.equal(mesh.uvs!.length, mesh.positions.length / 3 * 2);
    for (let i = 0; i < mesh.positions.length; i += 3)
      assert.ok(plane.x * mesh.positions[i]! + plane.y * mesh.positions[i + 1]! + plane.z * mesh.positions[i + 2]! + plane.constant >= -1e-8);
    assert.ok(mesh.normals!.some((n) => n < -0.8), "outward ceramic cut normal survives");
  }
});

void test("ridge and eave cropping retains the exact metric footprint and refuses invalid planes", () => {
  const cladding = new TempleCladding();
  const model = cladding.roofTileCut("end", [{ x: 0, y: 0, z: -1, constant: 0.30 }]);
  assert.ok(model !== null);
  for (const part of model.parts) {
    if (part.geometry.type !== "mesh") continue;
    assert.equal(validateMeshTopology({ mesh: part.geometry.mesh }).success, true, part.id);
    assert.ok(part.geometry.mesh.positions.filter((_, i) => i % 3 === 2).every((z) => z <= 0.300000001));
  }
  assert.equal(cladding.roofTileCut("outside", [{ x: 1, y: 0, z: 0, constant: -1 }]), null);
  assert.throws(() => cladding.roofTileCut("invalid", [{ x: 0, y: 0, z: 0, constant: 1 }]), /invalid tile cut plane/);
});

void test("cuts through existing rib faces keep one closed solid with the independently computed volume", () => {
  for (const [x, expected] of [[-0.1, 0.00336], [0.1, 0.0016]] as const) {
    const model = new TempleCladding().roofTileCut(`rib-${x}`, [{ x: 1, y: 0, z: 0, constant: -x }])!;
    const part = model.parts.find((p) => p.id === "tegula")!;
    assert.equal(part.geometry.type, "mesh");
    if (part.geometry.type !== "mesh") continue;
    const mesh = part.geometry.mesh;
    assert.equal(validateMeshTopology({ mesh }).success, true);
    assert.ok(mesh.indices !== null);
    let volume = 0;
    for (let i = 0; i < mesh.indices.length; i += 3) {
      const [a, b, c] = mesh.indices.slice(i, i + 3).map((index) => mesh.positions.slice(index * 3, index * 3 + 3));
      volume += (a![0]! * (b![1]! * c![2]! - b![2]! * c![1]!) +
        a![1]! * (b![2]! * c![0]! - b![0]! * c![2]!) +
        a![2]! * (b![0]! * c![1]! - b![1]! * c![0]!)) / 6;
    }
    assert.ok(Math.abs(volume - expected) < 1e-10, `${x}: ${volume}`);
  }
  const tangent = new TempleCladding().roofTileCut("tangent", [{ x: 1, y: 0, z: 0, constant: -0.2 }])!;
  assert.deepEqual(tangent.parts.map((part) => part.id), ["imbrex"], "zero-thickness panel and lip are absent");
});

void test("the last ridge support strip keeps flat ceramic instead of raised ribs or an open seam", () => {
  for (const end of [-0.02, 0.04, 0.18]) {
    const model = new TempleCladding().roofTile(end);
    for (const part of model.parts) {
      if (part.geometry.type !== "mesh") continue;
      assert.equal(validateMeshTopology({ mesh: part.geometry.mesh }).success, true, `${end}/${part.id}`);
      const mesh = part.geometry.mesh;
      for (let i = 0; i < mesh.positions.length; i += 3)
        if (mesh.positions[i + 2]! > Math.max(0, end) + 1e-8) assert.ok(mesh.positions[i + 1]! <= 0.020000001);
    }
  }
  assert.throws(() => new TempleCladding().roofTile(Number.NaN), /invalid tile ridge end/);
});

void test("ridge terminal variants cut at the actual end while preserving the fixed row pitch", () => {
  for (const length of [0.015, 0.05, 0.30, 0.45]) {
    const model = new TempleCladding().ridgeTile(22, length);
    for (const part of model.parts) {
      assert.equal(part.geometry.type, "mesh");
      if (part.geometry.type !== "mesh") continue;
      assert.equal(validateMeshTopology({ mesh: part.geometry.mesh }).success, true);
      const zs = part.geometry.mesh.positions.filter((_, i) => i % 3 === 2);
      assert.equal(Math.min(...zs), 0);
      assert.equal(Math.max(...zs), length);
    }
  }
  assert.throws(() => new TempleCladding().ridgeTile(22, 0), /invalid ridge tile cut length/);
  assert.throws(() => new TempleCladding().ridgeTile(22, 0.46), /invalid ridge tile cut length/);
});
