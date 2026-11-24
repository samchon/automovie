import type { IAutoMovieMark } from "@automovie/interface";
import type {
  AutoMovieDrawSubjects,
  IAutoMovieDrawScene,
  IAutoMovieDrawSubject,
} from "@automovie/render";
import * as THREE from "three";

import { buildHumanCaptureFigure } from "../capture/buildHumanCaptureFigure";
import { listHumanCaptureSubjects } from "../capture/listHumanCaptureSubjects";

/** Square raster for reading a subject from the same views. */
const RASTER: number = 960;

/**
 * Named Human studies offered by `automovie capture` and the inspector.
 *
 * Each subject has an admitted surface and named construction marks from
 * `buildHumanCaptureFigure`. The scene lasts one frame and the camera is fitted
 * to the subject's surface.
 *
 * ```powershell
 * pnpm capture --subject ansur-upper-arm-envelope --views "front@ortho;right@ortho;three-quarter" --marks "curve/*"
 * ```
 */
export const subjects: AutoMovieDrawSubjects = (): Readonly<
  Record<string, IAutoMovieDrawSubject>
> =>
  Object.fromEntries(
    listHumanCaptureSubjects().map(
      (name: string): [string, IAutoMovieDrawSubject] => [
        name,
        { create: async (): Promise<IAutoMovieDrawScene> => build(name) },
      ],
    ),
  );

/** Build one subject's scene. */
function build(name: string): IAutoMovieDrawScene {
  const figure: ReturnType<typeof buildHumanCaptureFigure> =
    buildHumanCaptureFigure(name);
  const scene: THREE.Scene = new THREE.Scene();
  scene.background = new THREE.Color(0xeef1f5);
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const key: THREE.DirectionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
  key.position.set(1.5, 3, 2.5);
  scene.add(key, key.target, figure.object);

  // Fit the three-quarter camera to the admitted surface.
  const box: THREE.Box3 = new THREE.Box3().setFromObject(figure.object);
  const centre: THREE.Vector3 = box.getCenter(new THREE.Vector3());
  const size: number = box.getSize(new THREE.Vector3()).length();
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    35,
    1,
    0.05,
    size * 10,
  );
  camera.position
    .copy(centre)
    .add(new THREE.Vector3(0.6, 0.1, 1).normalize().multiplyScalar(size * 1.8));
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
