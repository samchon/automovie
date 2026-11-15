import {
  type AutoMovieHumanPolygon,
  type IAutoMovieDrawScene,
  type IAutoMovieDrawSubject,
  buildHumanPolygon,
} from "@automovie/render";
import { mountAutoMovieInspectorPage } from "@automovie/viewer";
import * as THREE from "three";

import { SceneTrack } from "../../scenes/SceneTrack";
import { FILM_FPS } from "../../takes/FILM_FPS";
import type { ITake } from "../../takes/structures/ITake";
import type { IPlaygroundAdapter } from "../IPlaygroundAdapter";

/**
 * Draws a computed take with the shipped instrument: the polygon man of
 * `@automovie/render` for every performer, shown by the inspector of
 * `@automovie/viewer`.
 *
 * The playground adds no renderer and no camera code of its own. It only
 * states the subject the inspector draws: a scene with one polygon man per
 * performer on a floor grid, the film clock of the take, and a `seek` that
 * reads each person's pose from the take's track.
 */
export namespace PlaygroundStage {
  /**
   * Frames per second of the subject's clock and of the take it draws: film's
   * rate, the grid the package's own checks read, so every frame the
   * inspector steps to is a computed pose.
   */
  export const FPS: number = FILM_FPS;

  /** Side in metres of one cell of the floor grid. */
  const GRID_CELL: number = 0.25;

  /** Metres of floor drawn around every place a performer stands. */
  const MARGIN: number = 1.2;

  /** One performer's drawing and the group that puts it in the world. */
  interface IDrawn {
    /** The polygon man. */
    drawing: AutoMovieHumanPolygon.IDrawing;

    /** Its group under the reflection matrix. */
    group: THREE.Group;
  }

  /**
   * Mount the inspector over a take.
   *
   * @param root The element to draw into.
   * @param take The take, computed at `FPS`.
   * @returns What unmounts the inspector.
   */
  export function mount(
    root: HTMLElement,
    take: ITake,
  ): IPlaygroundAdapter.IMounted {
    // The inspector keys its canvas on the subject object, so the record is
    // made once per mount.
    const subjects: Readonly<Record<string, IAutoMovieDrawSubject>> = {
      performance: {
        create: async (): Promise<IAutoMovieDrawScene> => build(take),
      },
    };
    return mountAutoMovieInspectorPage({
      root,
      subjects,
      location: window.location,
      history: window.history,
    });
  }

  /** Build the scene of a take. */
  function build(take: ITake): IAutoMovieDrawScene {
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
    const reflect: THREE.Matrix4 = new THREE.Matrix4().fromArray(
      take.reflection,
    );
    const first: SceneTrack.IPlacement[][] = SceneTrack.sample(take.track, 0);
    const drawn: IDrawn[] = take.figures.map(
      (figure: ITake.IFigure, i: number): IDrawn => {
        const drawing: AutoMovieHumanPolygon.IDrawing = buildHumanPolygon({
          bones: figure.bones,
          posed: first[i]!,
        });
        const group: THREE.Group = new THREE.Group();
        group.name = figure.subject;
        group.matrixAutoUpdate = false;
        group.matrix.copy(reflect);
        group.add(drawing.object);
        scene.add(group);
        disposers.push((): void => drawing.dispose());
        return { drawing, group };
      },
    );

    // The floor under every place a performer passes, read from every
    // placement at nine evenly spaced instants of the film.
    const extent: THREE.Box3 = new THREE.Box3();
    const point: THREE.Vector3 = new THREE.Vector3();
    for (let k: number = 0; k <= 8; ++k)
      SceneTrack.sample(take.track, (take.duration * k) / 8)
        .slice(0, take.figures.length)
        .forEach((entries: SceneTrack.IPlacement[]): void => {
          for (const entry of entries) {
            point.fromArray(entry.position).applyMatrix4(reflect);
            extent.expandByPoint(new THREE.Vector3(point.x, 0, point.z));
            extent.expandByPoint(new THREE.Vector3(point.x, 2, point.z));
          }
        });
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
      durationSeconds: take.duration,
      fps: take.track.fps,
      width,
      height,
      seek: async (seconds: number): Promise<void> => {
        const sampled: SceneTrack.IPlacement[][] = SceneTrack.sample(
          take.track,
          seconds,
        );
        drawn.forEach((each: IDrawn, i: number): void => {
          each.drawing.setPose({ posed: sampled[i]! });
          each.group.updateMatrixWorld(true);
        });
      },
      dispose: (): void =>
        disposers.forEach((dispose: () => void): void => dispose()),
    };
  }
}
