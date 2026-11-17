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
 * 1. Three particles with unequal segment lengths through a right-angle
 *    corner each have a ring centred at the particle with the supplied radius.
 * 2. An absent cord leaves no mesh in the scene; a zero radius is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the unequal lengths, ring-centre and radius checks, withdrawal and refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Projects actual Three.js geometry from an unindexed particle surface, observes visible indexed faces and measures the positions around each ring.
 * @evidence contracts/development/testing.md#independent-expectations Every ring's opposite radial points average to its supplied particle and all its vertices are one authored radius from it. Coordinates are exactly representable binary fractions with a 1e-9 m comparison allowance for Float32.
 * @evidence contracts/development/testing.md#distinguishing-cases Unequal lengths catch arc-length resampling that skips a particle, and the turned segment checks that a cord is not projected as a single straight cylinder. Empty and nonpositive-radius frames exercise withdrawal and refusal.
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
        positions: centres.flatMap(
          (point: THREE.Vector3): number[] => [point.x, point.y, point.z],
        ),
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
    const mesh: THREE.Object3D | undefined =
      scene.getObjectByName("soft:cord");
    TestValidator.predicate("a visible indexed tube follows the particles", () => {
      if (!(mesh instanceof THREE.Mesh) || !mesh.visible) return false;
      const geometry: THREE.BufferGeometry = mesh.geometry;
      const vertex:
        | THREE.BufferAttribute
        | THREE.InterleavedBufferAttribute = geometry.getAttribute("position");
      const ringSize: number = vertex.count / centres.length;
      const opposite: number = (ringSize - 1) / 2;
      if (
        !Number.isInteger(opposite) ||
        opposite < 2 ||
        (geometry.getIndex()?.count ?? 0) === 0
      )
        return false;
      const first: THREE.Vector3 = new THREE.Vector3();
      const other: THREE.Vector3 = new THREE.Vector3();
      for (let ring: number = 0; ring < centres.length; ++ring) {
        const start: number = ringSize * ring;
        const center: THREE.Vector3 = centres[ring]!;
        first.fromBufferAttribute(vertex, start);
        other.fromBufferAttribute(vertex, start + opposite);
        if (first.add(other).multiplyScalar(0.5).distanceTo(center) > 1e-9)
          return false;
        for (let side: number = 0; side < ringSize; ++side) {
          other.fromBufferAttribute(vertex, start + side);
          if (!nclose(other.distanceTo(center), radius, 1e-9)) return false;
        }
      }
      return true;
    });
    TestValidator.error("a cord radius must be positive", (): void =>
      layer.update([{ ...frame, cordRadius: 0 }]),
    );
    layer.update([]);
    TestValidator.equals("omitted cord is detached", scene.children.length, 0);
  } finally {
    layer.dispose();
  }
}
