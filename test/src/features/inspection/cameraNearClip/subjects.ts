import type { IAutoMovieInspectionDiagnostics } from "@automovie/interface";
import {
  type AutoMovieDrawSubjects,
  type IAutoMovieDrawScene,
  observeAutoMoviePlacedCamera,
} from "@automovie/render";
import * as THREE from "three";

/**
 * A staged near-plane fixture for capture stills in the actual Draw host.
 *
 * Film seconds 0, 1 and 2 place a unit box turned 0.35 rad about the vertical
 * clear of, crossing and, with a translucent surface, crossing the 1 m near
 * plane of a 90-degree camera on a 16:9 delivery raster. At second 1 its
 * nearest edge lies 0.391 m in front of the near plane, so the delivered
 * picture shows the box cut open and the review capture draws a red cube on
 * the near plane at the cut; at second 2 the cube is amber because the cut
 * surface may be invisible anyway.
 *
 * @evidence contracts/development/testing.md#independent-expectations The turned box's nearest edge is 0.5 (cos 0.35 + sin 0.35) = 0.641 m in front of its centre, so centres 1.675 m and 1.25 m away put that edge 0.034 m beyond and 0.391 m in front of the 1 m near plane; six flat face colours keep the cut faces distinguishable in a still.
 * @evidence contracts/development/testing.md#execution-ownership Draw and inspector hosts own rendering; this fixture only prepares and poses Three state.
 * @evidence contracts/development/common.md#meaningful-documentation Records each second's placement, camera units and expected review marks.
 */
export const subjects: AutoMovieDrawSubjects = () => ({
  "camera-near-clip": { create },
});

/** Builds the box, its two surfaces and the source requirement. */
async function create(): Promise<IAutoMovieDrawScene> {
  const scene: THREE.Scene = new THREE.Scene();
  scene.background = new THREE.Color(0x202020);
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    90,
    16 / 9,
    1,
    20,
  );
  const geometry: THREE.BoxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const faces: THREE.MeshBasicMaterial[] = [
    0xd94f4f, 0x4fd9d9, 0x4fd94f, 0xd94fd9, 0x4f4fd9, 0xd9d94f,
  ].map(
    (color: number): THREE.MeshBasicMaterial =>
      new THREE.MeshBasicMaterial({ color, toneMapped: false }),
  );
  const glass: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({
    color: 0x9fb7ff,
    transparent: true,
    opacity: 0.4,
    toneMapped: false,
  });
  const hero: THREE.Mesh = new THREE.Mesh(geometry, faces);
  hero.name = "hero";
  hero.rotation.y = 0.35;
  scene.add(hero);

  return {
    scene,
    camera,
    width: 320,
    height: 180,
    durationSeconds: 3,
    fps: 1,
    instants: [
      { seconds: 0, label: "clear" },
      { seconds: 1, label: "opaque-cut" },
      { seconds: 2, label: "translucent-cut" },
    ],
    seek: async (seconds: number): Promise<void> => {
      const frame: number = Math.floor(seconds);
      hero.position.set(0, 0, frame === 0 ? -1.675 : -1.25);
      hero.material = frame === 2 ? glass : faces;
    },
    inspectPlaced: (
      sample: IAutoMovieDrawScene.IPlacedSample,
    ): IAutoMovieInspectionDiagnostics => ({
      scope: "camera-near-clip",
      time: sample.time,
      ...observeAutoMoviePlacedCamera({
        sample,
        targets: [{ path: "hero", target: hero }],
      }),
    }),
    dispose: (): void => {
      geometry.dispose();
      for (const face of faces) face.dispose();
      glass.dispose();
    },
  };
}
