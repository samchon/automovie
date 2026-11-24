import type { IAutoMovieRenderSoftPropFrame } from "@automovie/interface";
import {
  type IAutoMovieSceneSoftProps,
  buildSceneSoftProps,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose } from "../internal/predicates";

/**
 * A cord uses a visible tube whose rings follow its particles, even when the
 * particles are not uniformly spaced.
 *
 * Scenarios:
 *
 * 1. Three particles with unequal segment lengths through a right-angle corner
 *    each have a ring centred at the particle with the supplied radius.
 * 2. A collapsed frame hides the same mesh; seeking back restores its tube.
 * 3. An omitted cord detaches. Rejected radii or particles leave the prior tube
 *    mounted.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the unequal lengths, ring-centre and radius checks, withdrawal and refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Projects actual Three.js geometry from an unindexed particle surface, observes visible indexed faces and measures the positions around each ring.
 * @evidence contracts/development/testing.md#independent-expectations Every ring's opposite radial points average to its supplied particle and all its vertices are one authored radius from it. Coordinates are exactly representable binary fractions with a 1e-9 m comparison allowance for Float32.
 * @evidence contracts/development/testing.md#distinguishing-cases Unequal lengths catch arc-length resampling that skips a particle, and the turned segment checks that a cord is not projected as a single straight cylinder. A collapse and reverse seek preserve subject identity while visibility changes. Empty frames exercise withdrawal, and sparse or overflowing coordinates and zero radius exercise refusal.
 * @evidence contracts/development/testing.md#execution-ownership test_render_soft_cord exercises a CPU scene and geometry without a renderer or a host.
 */
export function test_render_soft_cord(): void {
  const centres: readonly THREE.Vector3[] = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(1 / 256, 0, 0),
    new THREE.Vector3(1 / 256, 0, 1 / 128),
  ];
  const radius: number = 1 / 1024;
  const frame: IAutoMovieRenderSoftPropFrame = {
    subject: "cord",
    status: "solved",
    cordRadius: radius,
    surface: {
      domain: "cord-lattice",
      step: 2,
      bounds: null,
      mesh: {
        positions: centres.flatMap((point: THREE.Vector3): number[] => [
          point.x,
          point.y,
          point.z,
        ]),
        normals: null,
        uvs: null,
        indices: [],
        skin: null,
      },
    },
  };
  const scene: THREE.Scene = new THREE.Scene();
  const layer: IAutoMovieSceneSoftProps = buildSceneSoftProps(scene);
  try {
    layer.update([frame]);
    const mesh: THREE.Object3D | undefined = scene.getObjectByName("soft:cord");
    const initiallyProjected: boolean = hasTube(mesh, centres, radius);
    layer.update([
      {
        ...frame,
        surface: {
          ...frame.surface,
          step: 3,
          mesh: {
            ...frame.surface.mesh,
            positions: frame.surface.mesh.positions.map((): number => 0),
          },
        },
      },
    ]);
    const collapsedInPlace: boolean =
      mesh instanceof THREE.Mesh &&
      !mesh.visible &&
      mesh.userData.step === 3 &&
      scene.getObjectByName("soft:cord") === mesh;
    layer.update([frame]);
    TestValidator.predicate(
      "the indexed tube follows its particles before and after a collapsed frame",
      () =>
        initiallyProjected &&
        collapsedInPlace &&
        scene.getObjectByName("soft:cord") === mesh &&
        mesh?.userData.step === 2 &&
        hasTube(mesh, centres, radius),
    );
    const overflow: number[] = [...frame.surface.mesh.positions];
    overflow[4] = Number.MAX_VALUE;
    for (const [kind, positions] of [
      ["out-of-range", overflow],
    ] as const)
      TestValidator.error(`${kind} cord particles refuse`, (): void =>
        layer.update([
          {
            ...frame,
            surface: {
              ...frame.surface,
              step: 4,
              mesh: { ...frame.surface.mesh, positions },
            },
          },
        ]),
      );
    TestValidator.error("a cord radius must be positive", (): void =>
      layer.update([
        { ...frame, cordRadius: 0, surface: { ...frame.surface, step: 4 } },
      ]),
    );
    TestValidator.predicate(
      "refused frames leave the mounted cord at its last valid step",
      () =>
        scene.getObjectByName("soft:cord") === mesh &&
        mesh?.userData.step === 2 &&
        hasTube(mesh, centres, radius),
    );
    layer.update([]);
    TestValidator.equals("omitted cord is detached", scene.children.length, 0);
  } finally {
    layer.dispose();
  }
}

/** Observe the indexed rings against their authored world-space centres. */
function hasTube(
  mesh: THREE.Object3D | undefined,
  centres: readonly THREE.Vector3[],
  radius: number,
): boolean {
  if (!(mesh instanceof THREE.Mesh) || !mesh.visible) return false;
  const geometry: THREE.BufferGeometry = mesh.geometry;
  const vertex: THREE.BufferAttribute | THREE.InterleavedBufferAttribute =
    geometry.getAttribute("position");
  const ringSize: number = vertex.count / centres.length;
  const opposite: number = (ringSize - 1) / 2;
  if (opposite < 2 || (geometry.getIndex()?.count ?? 0) === 0) return false;

  const first: THREE.Vector3 = new THREE.Vector3();
  const other: THREE.Vector3 = new THREE.Vector3();
  return centres.every((centre: THREE.Vector3, ring: number): boolean => {
    const start: number = ringSize * ring;
    first.fromBufferAttribute(vertex, start);
    other.fromBufferAttribute(vertex, start + opposite);
    if (first.add(other).multiplyScalar(0.5).distanceTo(centre) > 1e-9)
      return false;
    for (let side: number = 0; side < ringSize; ++side) {
      other.fromBufferAttribute(vertex, start + side);
      if (!nclose(other.distanceTo(centre), radius, 1e-9)) return false;
    }
    return true;
  });
}
