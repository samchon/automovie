import { AutoMovieHumanCanonicalBody } from "@automovie/human";
import type { IAutoMovieVector3 } from "@automovie/interface";
import type { HumanPerformance } from "@automovie/motions";
import {
  type AutoMovieHumanPolygon,
  type IAutoMovieDrawScene,
  type IAutoMovieDrawSubject,
  buildHumanPolygon,
} from "@automovie/render";
import { mountAutoMovieInspectorPage } from "@automovie/viewer";
import * as THREE from "three";

import type { IPlaygroundAdapter } from "../IPlaygroundAdapter";

/**
 * Draws a performance with the shipped instrument: the polygon man of
 * `@automovie/render` for every performer, shown by the inspector of
 * `@automovie/viewer`.
 *
 * The playground adds no renderer and no camera code of its own. It only
 * states the subject the inspector draws: a scene with one polygon man per
 * performer on a floor grid, the film clock of the performance, and a `seek`
 * that asks the performance for each person's pose.
 */
export namespace PlaygroundStage {
  /** Frames per second of the subject's clock: the grid the package's own checks read. */
  export const FPS: number = 24;

  /** Side in metres of one cell of the floor grid. */
  const GRID_CELL: number = 0.25;

  /** Metres of floor drawn around every place a performer stands. */
  const MARGIN: number = 1.2;

  /** One performer to draw. */
  export interface IFigure {
    /** The performer's subject id, which names the figure in the scene. */
    subject: string;

    /** The performer's canonical body. */
    canonical: AutoMovieHumanCanonicalBody.IBody;
  }

  /**
   * Mount the inspector over a performance.
   *
   * @param root The element to draw into.
   * @param performance The performance.
   * @param figures Its performers' bodies.
   * @returns What unmounts the inspector.
   */
  export function mount(
    root: HTMLElement,
    performance: HumanPerformance,
    figures: readonly IFigure[],
  ): IPlaygroundAdapter.IMounted {
    // The inspector keys its canvas on the subject object, so the record is
    // made once per mount.
    const subjects: Readonly<Record<string, IAutoMovieDrawSubject>> = {
      performance: {
        create: async (): Promise<IAutoMovieDrawScene> =>
          build(performance, figures),
      },
    };
    return mountAutoMovieInspectorPage({
      root,
      subjects,
      location: window.location,
      history: window.history,
    });
  }

  /** Build the scene of a performance. */
  function build(
    performance: HumanPerformance,
    figures: readonly IFigure[],
  ): IAutoMovieDrawScene {
    const scene: THREE.Scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe9e6df);
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const sun: THREE.DirectionalLight = new THREE.DirectionalLight(
      0xffffff,
      1.6,
    );
    sun.position.set(1.5, 3, 2.5);
    scene.add(sun, sun.target);
    const disposers: (() => void)[] = [];

    // One polygon man per performer, under the matrix that puts Human's own
    // frame in the canonical world.
    const drawn: {
      figure: IFigure;
      drawing: AutoMovieHumanPolygon.IDrawing;
      group: THREE.Group;
    }[] = figures.map((figure: IFigure) => {
      const drawing: AutoMovieHumanPolygon.IDrawing = buildHumanPolygon(
        AutoMovieHumanCanonicalBody.display(figure.canonical),
      );
      const group: THREE.Group = new THREE.Group();
      group.name = figure.subject;
      group.matrixAutoUpdate = false;
      group.matrix.fromArray([...AutoMovieHumanCanonicalBody.REFLECTION]);
      group.add(drawing.object);
      scene.add(group);
      disposers.push((): void => drawing.dispose());
      return { figure, drawing, group };
    });

    // The floor under every place a performer's root passes, read from the
    // postures at nine evenly spaced instants of the film.
    const extent: THREE.Box3 = new THREE.Box3();
    for (const figure of figures)
      for (let k: number = 0; k <= 8; ++k) {
        const root: IAutoMovieVector3 = performance.posture(
          figure.subject,
          (performance.duration * k) / 8,
        ).root;
        extent.expandByPoint(new THREE.Vector3(root.x, 0, root.z));
        extent.expandByPoint(new THREE.Vector3(root.x, 2, root.z));
      }
    extent.min.x -= MARGIN;
    extent.min.z -= MARGIN;
    extent.max.x += MARGIN;
    extent.max.z += MARGIN;

    const lines: number[] = [];
    for (
      let x: number = Math.ceil(extent.min.x / GRID_CELL) * GRID_CELL;
      x <= extent.max.x;
      x += GRID_CELL
    )
      lines.push(x, 0, extent.min.z, x, 0, extent.max.z);
    for (
      let z: number = Math.ceil(extent.min.z / GRID_CELL) * GRID_CELL;
      z <= extent.max.z;
      z += GRID_CELL
    )
      lines.push(extent.min.x, 0, z, extent.max.x, 0, z);
    const grid: THREE.LineSegments = new THREE.LineSegments(
      new THREE.BufferGeometry().setAttribute(
        "position",
        new THREE.Float32BufferAttribute(lines, 3),
      ),
      new THREE.LineBasicMaterial({ color: 0xc9c4ba }),
    );
    grid.name = "ground";
    scene.add(grid);
    disposers.push((): void => {
      grid.geometry.dispose();
      (grid.material as THREE.Material).dispose();
    });

    // A delivery camera on the three-quarter side, looking at the middle.
    const width: number = 960;
    const height: number = 540;
    const centre: THREE.Vector3 = extent.getCenter(new THREE.Vector3());
    const size: number = extent.getSize(new THREE.Vector3()).length();
    const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
      35,
      width / height,
      0.05,
      size * 10,
    );
    camera.position
      .copy(centre)
      .add(
        new THREE.Vector3(0.62, 0.42, 0.66).normalize().multiplyScalar(size),
      );
    camera.lookAt(centre);

    return {
      scene,
      camera,
      durationSeconds: performance.duration,
      fps: FPS,
      width,
      height,
      seek: async (seconds: number): Promise<void> => {
        const at: number = Math.min(performance.duration, Math.max(0, seconds));
        for (const { figure, drawing, group } of drawn) {
          drawing.setPose({
            posed: AutoMovieHumanCanonicalBody.display(
              figure.canonical,
              performance.pose(figure.subject, at),
            ).posed,
          });
          group.updateMatrixWorld(true);
        }
      },
      dispose: (): void =>
        disposers.forEach((dispose: () => void): void => dispose()),
    };
  }
}
