import type { IAutoMovieMark } from "@automovie/engine";
import type {
  AutoMovieDrawSubjects,
  IAutoMovieDrawScene,
  IAutoMovieDrawSubject,
} from "@automovie/render";
import * as THREE from "three";

import { buildHumanCaptureFigure } from "../capture/buildHumanCaptureFigure";
import { listHumanCaptureSubjects } from "../capture/listHumanCaptureSubjects";

/** Width and height of every picture drawn, pixels: square, because a standing figure is read from all sides. */
const RASTER: number = 960;

/**
 * The Human figure as the subjects a draw-only page offers: every person the package defines, by name, in each pose it is drawn in, for `automovie capture --module src/executable/subjects.ts` and the inspector.
 *
 * Each subject is the person's figure from `buildHumanCaptureFigure`, its surface named by the figure's own parts and its construction curves as marks, on a light background under an ambient light and one key light. The figure stands still, so the subject lasts one frame and seeking does nothing. The delivery camera stands three-quarters to the figure's front at eye height and looks at its middle; the instrument's named views, fitted to what is drawn, are how it is read. The props are not read.
 *
 * ```bash
 * pnpm capture --views "front@ortho;right@ortho;three-quarter" --marks curve/*
 * ```
 */
export const subjects: AutoMovieDrawSubjects = (): Readonly<
  Record<string, IAutoMovieDrawSubject>
> =>
  Object.fromEntries(
    listHumanCaptureSubjects().map((name: string): [string, IAutoMovieDrawSubject] => [
      name,
      { create: async (): Promise<IAutoMovieDrawScene> => build(name) },
    ]),
  );

/** Build one subject's scene. */
function build(name: string): IAutoMovieDrawScene {
  const figure: ReturnType<typeof buildHumanCaptureFigure> = buildHumanCaptureFigure(name);
  const scene: THREE.Scene = new THREE.Scene();
  scene.background = new THREE.Color(0xeef1f5);
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const key: THREE.DirectionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
  key.position.set(1.5, 3, 2.5);
  scene.add(key, key.target, figure.object);

  // The delivery camera: three-quarters to the front, framing the standing figure.
  const box: THREE.Box3 = new THREE.Box3().setFromObject(figure.object);
  const centre: THREE.Vector3 = box.getCenter(new THREE.Vector3());
  const size: number = box.getSize(new THREE.Vector3()).length();
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(35, 1, 0.05, size * 10);
  camera.position.copy(centre).add(new THREE.Vector3(0.6, 0.1, 1).normalize().multiplyScalar(size * 1.8));
  camera.lookAt(centre);
  camera.updateMatrixWorld(true);
  return {
    scene,
    camera,
    durationSeconds: 1 / 30,
    fps: 30,
    width: RASTER,
    height: RASTER,
    marks: (): readonly IAutoMovieMark[] => figure.marks,
    seek: async (): Promise<void> => {},
    dispose: (): void => figure.dispose(),
  };
}
