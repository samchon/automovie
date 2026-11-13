import { AutoMovieHumanCanonicalBody } from "@automovie/human";
import {
  type AutoMovieHumanPolygon,
  type IAutoMovieDrawScene,
  type IAutoMovieDrawSubject,
  buildHumanPolygon,
} from "@automovie/render";
import { mountAutoMovieInspectorPage } from "@automovie/viewer";
import * as THREE from "three";

import { PlaygroundBodies } from "../../playground/package/PlaygroundBodies";

/**
 * The inspector of `@automovie/viewer` on one of the site's bodies, drawn as
 * the polygon man in its rest pose: the instrument a production uses to look
 * at a figure, with its views, shading, marks and selection of every bone.
 * Preparing the body takes a few seconds the first time.
 */
export namespace HumanInspector {
  /**
   * Mount the inspector on a body.
   *
   * @param root The element to draw into.
   * @param body The body's id.
   * @returns What unmounts it.
   */
  export function mount(root: HTMLElement, body: string): { unmount(): void } {
    const subjects: Readonly<Record<string, IAutoMovieDrawSubject>> = {
      [body]: {
        create: async (): Promise<IAutoMovieDrawScene> => build(body),
      },
    };
    return mountAutoMovieInspectorPage({
      root,
      subjects,
      location: window.location,
      history: window.history,
    });
  }

  /** The scene of one body standing in its rest pose on a floor grid. */
  function build(id: string): IAutoMovieDrawScene {
    const scene: THREE.Scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe9ebef);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8d8a83, 1.2));
    const sun: THREE.DirectionalLight = new THREE.DirectionalLight(
      0xffffff,
      1.5,
    );
    sun.position.set(2, 4, 3);
    scene.add(sun);

    const prepared: PlaygroundBodies.IPrepared = PlaygroundBodies.get(id);
    const drawing: AutoMovieHumanPolygon.IDrawing = buildHumanPolygon(
      AutoMovieHumanCanonicalBody.display(prepared.canonical),
    );
    const group: THREE.Group = new THREE.Group();
    group.name = id;
    group.matrixAutoUpdate = false;
    group.matrix.fromArray([...AutoMovieHumanCanonicalBody.REFLECTION]);
    group.add(drawing.object);
    scene.add(group);
    const grid: THREE.GridHelper = new THREE.GridHelper(
      4,
      16,
      0xbfc5ce,
      0xbfc5ce,
    );
    grid.name = "ground";
    scene.add(grid);

    const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
      35,
      16 / 9,
      0.05,
      50,
    );
    camera.position.set(2.2, 1.6, 3.2);
    camera.lookAt(0, 0.9, 0);
    return {
      scene,
      camera,
      durationSeconds: 1,
      fps: 24,
      width: 960,
      height: 540,
      seek: async (): Promise<void> => undefined,
      dispose: (): void => {
        drawing.dispose();
        grid.geometry.dispose();
        (grid.material as THREE.Material).dispose();
      },
    };
  }
}
