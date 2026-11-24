import { deriveAutoMovieSemanticMask } from "@automovie/engine";
import type {
  IAutoMovieInspectionDiagnostics,
  IAutoMovieScene,
} from "@automovie/interface";
import {
  type AutoMovieDrawSubjects,
  type IAutoMovieDrawScene,
  attachAutoMovieSemanticMask,
  observeAutoMoviePlacedCamera,
} from "@automovie/render";
import * as THREE from "three";

import { renderFixtureNode } from "../../../internal/renderFixtureNode";

/**
 * A staged camera fixture for portable inspection and the actual Draw host.
 *
 * Film seconds 0–7 address inactive offscreen, clear, half occluded, fully
 * occluded, unsupported alpha, coplanar depth, before near, and left crop.
 * At a ninety-degree square delivery camera the green quad's four-metre
 * sides at depth five cover a 40 by 40 output rectangle. At depth three the
 * wall's 2.4-metre sides cover exactly the same projection; shifted left by
 * 1.2 metres, its right edge divides the green projection into equal halves.
 *
 * analytically aligned screen extents and distinct beauty colors to recover
 * the visible 1600, 800 and zero pixel oracles independently of audit masks.
 * inspector hosts own rendering; this fixture only prepares and poses Three
 * state, so its ordinary unit consumer does not acquire a graphics context.
 * Records every posed control, camera units and computed pixel expectations.
 */
export const cameraInspectionDeliverySubjects: AutoMovieDrawSubjects = () => ({
  "camera-inspection": { create },
});

/** Constructs the original scene and gives the actual mesh roots source identities. */
async function create(): Promise<IAutoMovieDrawScene> {
  const scene: THREE.Scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    90,
    1,
    1,
    20,
  );
  const heroGeometry: THREE.PlaneGeometry = new THREE.PlaneGeometry(4, 4);
  const wallGeometry: THREE.PlaneGeometry = new THREE.PlaneGeometry(2.4, 2.4);
  const heroMaterial: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    toneMapped: false,
  });
  const wallMaterial: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    toneMapped: false,
  });
  const hero: THREE.Mesh = new THREE.Mesh(heroGeometry, heroMaterial);
  hero.name = "hero";
  const wall: THREE.Mesh = new THREE.Mesh(wallGeometry, wallMaterial);
  wall.name = "wall";
  scene.add(hero, wall);
  const design: IAutoMovieScene = {
    id: "camera-inspection",
    name: null,
    nodes: [
      renderFixtureNode("hero", "quad"),
      renderFixtureNode("wall", "quad"),
    ],
    cameras: [],
    lights: [],
  };
  attachAutoMovieSemanticMask(scene, {
    design,
    mask: deriveAutoMovieSemanticMask({ scene: design, models: [] }),
  });

  return {
    scene,
    camera,
    width: 100,
    height: 100,
    durationSeconds: 8,
    fps: 1,
    instants: [
      { seconds: 0, label: "inactive-offscreen" },
      { seconds: 1, label: "clear" },
      { seconds: 2, label: "half-occluded" },
      { seconds: 3, label: "fully-occluded" },
      { seconds: 4, label: "alpha-unsupported" },
      { seconds: 5, label: "coplanar" },
      { seconds: 6, label: "before-near" },
      { seconds: 7, label: "left-crop" },
    ],
    seek: async (seconds: number): Promise<void> => {
      const frame: number = Math.floor(seconds);
      hero.position.set(
        frame === 0 ? 9 : frame === 7 ? 4 : 0,
        0,
        frame === 6 ? -0.25 : -5,
      );
      wall.visible = frame >= 2 && frame <= 5;
      wall.position.set(frame === 2 ? -1.2 : 0, 0, frame === 5 ? -5 : -3);
      wall.scale.setScalar(frame === 5 ? 4 / 2.4 : 1);
      wallMaterial.alphaTest = frame === 4 ? 0.5 : 0;
      camera.aspect = 1;
      camera.clearViewOffset();
      if (frame === 7) camera.setViewOffset(200, 100, 0, 0, 100, 100);
    },
    inspectPlaced: (
      sample: IAutoMovieDrawScene.IPlacedSample,
    ): IAutoMovieInspectionDiagnostics => ({
      scope: "camera-inspection",
      time: sample.time,
      ...observeAutoMoviePlacedCamera({
        sample,
        targets:
          sample.time.filmSeconds < 1
            ? []
            : [{ path: "hero", target: hero, maxOcclusionRatio: 0.25 }],
      }),
    }),
    dispose: (): void => {
      heroGeometry.dispose();
      wallGeometry.dispose();
      heroMaterial.dispose();
      wallMaterial.dispose();
    },
  };
}
