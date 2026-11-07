import type { IAutoMovieContactReceipt as Receipt } from "@automovie/interface";
import assert from "node:assert/strict";
import * as THREE from "three";

import { BoutEffects } from "../../../src/physics/BoutEffects";

/**
 * The real effect adapter preserves contact provenance and deterministic sampling.
 *
 * Scenarios:
 * 1. A solver aggregate with omitted samples supplies its declared impact.
 * 2. Explicitly empty solver samples emit nothing instead of falling back to the aggregate.
 * 3. Geometric receipts need their separately declared formula impulse; omitted and empty samples then render identically.
 * 4. Body contacts exclude blood, while head stains survive and arbitrary seeks repeat.
 *
 * These unit receipts test the adapter, not native contact or moving-picture acceptance.
 */
export function test_physical_bout_effects(): void {
  const receipt: Receipt = {
    id: "synthetic-unit-contact",
    source: "solver",
    seconds: 10,
    endSeconds: 10,
    a: {
      body: "a",
      bone: "rightHand",
      shape: "right-glove",
      material: "glove",
    },
    b: { body: "b", bone: "head", shape: "head-surface", material: "skin" },
    point: { x: 0, y: 1.6, z: 0 },
    normal: { x: 1, y: 0, z: 0 },
    impulse: 2,
    separation: -0.002,
    compression: 0.002,
  };
  const face: BoutEffects = new BoutEffects();
  const repeat: BoutEffects = new BoutEffects();
  const empty: BoutEffects = new BoutEffects();
  const body: BoutEffects = new BoutEffects();
  const geometric: BoutEffects = new BoutEffects();
  const geometricEmpty: BoutEffects = new BoutEffects();
  const withoutFormula: BoutEffects = new BoutEffects();
  face.configure([{ actionId: "unit-head", relation: "head", receipt }]);
  repeat.configure([{ actionId: "unit-head", relation: "head", receipt }]);
  empty.configure([
    {
      actionId: "unit-head",
      relation: "head",
      receipt: { ...receipt, samples: [] },
    },
  ]);
  body.configure([
    {
      actionId: "unit-body",
      relation: "body",
      receipt: { ...receipt, b: { ...receipt.b, bone: "chest" } },
    },
  ]);
  const geometricReceipt: Receipt = {
    ...receipt,
    id: "synthetic-unit-geometric",
    source: "geometric",
    impulse: null,
  };
  geometric.configure(
    [
      {
        actionId: "unit-geometric-head",
        relation: "head",
        receipt: geometricReceipt,
      },
    ],
    { [geometricReceipt.id]: 2 },
  );
  geometricEmpty.configure(
    [
      {
        actionId: "unit-geometric-head",
        relation: "head",
        receipt: { ...geometricReceipt, samples: [] },
      },
    ],
    { [geometricReceipt.id]: 2 },
  );
  assert.throws(
    (): void =>
      withoutFormula.configure([
        {
          actionId: "unit-geometric-head",
          relation: "head",
          receipt: geometricReceipt,
        },
      ]),
    /requires a measured or formula impulse/,
  );
  /** Inspect actual rendered colors and live instance matrices, without a parallel particle implementation. */
  const meshes: (
    effects: BoutEffects,
  ) => THREE.InstancedMesh<THREE.BufferGeometry, THREE.ShaderMaterial>[] = (
    effects: BoutEffects,
  ): THREE.InstancedMesh<THREE.BufferGeometry, THREE.ShaderMaterial>[] =>
    effects.object.children as THREE.InstancedMesh<
      THREE.BufferGeometry,
      THREE.ShaderMaterial
    >[];
  try {
    face.update(9.9);
    assert.ok(
      meshes(face).every(
        (mesh: THREE.InstancedMesh): boolean => mesh.count === 0,
      ),
    );
    face.update(10.15);
    repeat.update(10.15);
    empty.update(10.15);
    body.update(10.15);
    geometric.update(10.15);
    geometricEmpty.update(10.15);
    withoutFormula.update(10.15);
    assert.ok(
      meshes(empty).every(
        (mesh: THREE.InstancedMesh): boolean => mesh.count === 0,
      ),
      "empty instantaneous solver samples cannot emit an aggregate-backed impact",
    );
    assert.ok(
      meshes(withoutFormula).every(
        (mesh: THREE.InstancedMesh): boolean => mesh.count === 0,
      ),
      "a geometric receipt alone supplies no impulse",
    );
    assert.ok(
      meshes(geometric).some(
        (mesh: THREE.InstancedMesh): boolean => mesh.count > 0,
      ),
      "the explicit geometric formula reaches actual effect instances",
    );
    assert.deepEqual(
      meshes(geometricEmpty).map((mesh: THREE.InstancedMesh): number[] =>
        Array.from(mesh.instanceMatrix.array),
      ),
      meshes(geometric).map((mesh: THREE.InstancedMesh): number[] =>
        Array.from(mesh.instanceMatrix.array),
      ),
      "geometric omitted and empty samples preserve the same explicitly estimated impact",
    );
    assert.ok(
      meshes(face).some(
        (
          mesh: THREE.InstancedMesh<THREE.BufferGeometry, THREE.ShaderMaterial>,
        ): boolean =>
          mesh.count > 0 &&
          (
            mesh.material.uniforms.automovieColor!.value as THREE.Color
          ).getHexString() === "8c0b12",
      ),
    );
    assert.ok(
      meshes(body).every(
        (
          mesh: THREE.InstancedMesh<THREE.BufferGeometry, THREE.ShaderMaterial>,
        ): boolean =>
          (
            mesh.material.uniforms.automovieColor!.value as THREE.Color
          ).getHexString() !== "8c0b12",
      ),
    );
    face.update(179);
    assert.ok(
      meshes(face).some((mesh: THREE.InstancedMesh): boolean => mesh.count > 0),
      "settled blood remains on the canvas",
    );
    face.update(10.15);
    assert.deepEqual(
      meshes(face).map((mesh: THREE.InstancedMesh): number[] =>
        Array.from(mesh.instanceMatrix.array),
      ),
      meshes(repeat).map((mesh: THREE.InstancedMesh): number[] =>
        Array.from(mesh.instanceMatrix.array),
      ),
    );
    face.update(0);
    assert.ok(
      meshes(face).every(
        (mesh: THREE.InstancedMesh): boolean => mesh.count === 0,
      ),
      "backward seek clears future effects",
    );
  } finally {
    face.dispose();
    repeat.dispose();
    empty.dispose();
    body.dispose();
    geometric.dispose();
    geometricEmpty.dispose();
    withoutFormula.dispose();
  }
}
