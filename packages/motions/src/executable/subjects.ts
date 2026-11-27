import type { IAutoMovieMark, IAutoMoviePose } from "@automovie/interface";
import {
  type AutoMovieDrawSubjects,
  type IAutoMovieDrawScene,
  type IAutoMovieDrawSubject,
} from "@automovie/render";
import * as THREE from "three";

import { applyMotionCaptureGhost } from "./internal/applyMotionCaptureGhost";
import { markMotionCaptureCase } from "../capture/internal/markMotionCaptureCase";
import type { IMotionCaptureProps } from "./internal/IMotionCaptureProps";
import { MotionCaptureFigure } from "./internal/MotionCaptureFigure";

/*
 * The draw page's subjects for the motion capture harness: one subject, named
 * by the case, built from the case's props.
 *
 * The subject is the case's scene on a light background under an ambient light
 * and one sun: its performers as solid polygon men named by their ids, its
 * ghosts translucent and named `ghost-<id>`, its boxes as shaded meshes named
 * `box-<i>`, and a ground grid named `ground`, lines every 0.25 m over the
 * floor's rectangle under everything drawn at any instant with a margin of 0.18
 * m, so the ground widens no fitted view. Its clock is the case's grid. Seeking
 * a second places every figure in its pose at the sampled second within a
 * microsecond of it, a case instant or a grid frame, and any other second of
 * the clock at the grid frame at or before it, as a video holds a frame, so the
 * inspector plays the case; a second outside the clock throws. The case's
 * trails, targets and drift are its marks through `markMotionCaptureCase`, the
 * same at every second, and its labelled instants are the subject's named
 * instants, so each still's caption and record row name its beat. The delivery
 * camera stands on the three-quarter side looking at the middle of what is
 * drawn; the case is read through the fitted views `motionCapture` asks for.
 * Parameter props: The case's page data, from `planMotionCaptureProps`.
 * Returns: The case's subject under its name.
 * When the page was given no case data.
 */
export const subjects: AutoMovieDrawSubjects<IMotionCaptureProps | null> = (
  props: IMotionCaptureProps | null,
): Readonly<Record<string, IAutoMovieDrawSubject>> => {
  if (props === null)
    throw new Error("The motion case page was given no case data");
  return {
    [props.name]: {
      create: async (): Promise<IAutoMovieDrawScene> => build(props),
    },
  };
};

/*
 * Steps per second of the key that matches an asked second to a sampled
 * instant: microseconds, far finer than any two instants of a case and far
 * coarser than float error.
 */
const MICRO: number = 1_000_000;

/*
 * Margin in metres around everything a case draws, which the ground grid
 * covers.
 */
const MARGIN: number = 0.18;

/*
 * Side in metres of one cell of the ground grid.
 */
const GRID_CELL: number = 0.25;
/*
 * Build the case's scene.
 */
function build(data: IMotionCaptureProps): IAutoMovieDrawScene {
  const scene: THREE.Scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe9e6df);
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const sun: THREE.DirectionalLight = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(1.5, 3, 2.5);
  scene.add(sun, sun.target);
  const disposers: (() => void)[] = [];

  // Figures, solid and translucent.
  const figures: IBuildFiguresItem[] = [];
  for (const performer of data.performers) {
    const figure: MotionCaptureFigure = new MotionCaptureFigure(
      performer.body,
      performer.color ?? undefined,
    );
    figure.object.name = performer.id;
    scene.add(figure.object);
    figures.push({ figure, poses: performer.poses });
    disposers.push((): void => figure.dispose());
  }
  for (const ghost of data.ghosts) {
    const figure: MotionCaptureFigure = new MotionCaptureFigure(ghost.body);
    figure.object.name = `ghost-${ghost.id}`;
    disposers.push(
      applyMotionCaptureGhost(
        figure.object,
        ghost.color ?? 0x3a6ea5,
        ghost.opacity,
      ),
    );
    scene.add(figure.object);
    figures.push({ figure, poses: ghost.poses });
    disposers.push((): void => figure.dispose());
  }

  // Boxes the figures meet.
  const boxes: THREE.Mesh[] = [];
  data.boxes.forEach(
    (box: IMotionCaptureProps["boxes"][number], index: number): void => {
      const material: THREE.MeshStandardMaterial =
        new THREE.MeshStandardMaterial({ color: box.color, flatShading: true });
      const mesh: THREE.Mesh = new THREE.Mesh(
        new THREE.BoxGeometry(2 * box.half.x, 2 * box.half.y, 2 * box.half.z),
        material,
      );
      boxes.push(mesh);
      mesh.name = `box-${index}`;
      mesh.position.set(box.centre.x, box.centre.y, box.centre.z);
      scene.add(mesh);
      disposers.push((): void => {
        mesh.geometry.dispose();
        material.dispose();
      });
    },
  );

  // The floor under everything drawn at any instant.
  const marks: IAutoMovieMark[] = markMotionCaptureCase(data);
  const extent: THREE.Box3 = new THREE.Box3();
  data.seconds.forEach((_: number, index: number): void => {
    for (const { figure, poses } of figures) {
      figure.place(poses[index]!);
      extent.expandByObject(figure.object);
    }
  });
  for (const mesh of boxes) extent.expandByObject(mesh);
  for (const mark of marks) {
    if (mark.shape.type === "arrows") continue;
    const points: number[] = mark.shape.points;
    for (let k: number = 0; k + 2 < points.length; k += 3)
      extent.expandByPoint(
        new THREE.Vector3(points[k]!, points[k + 1]!, points[k + 2]!),
      );
  }
  extent.expandByPoint(new THREE.Vector3(extent.min.x, 0, extent.min.z));
  extent.expandByScalar(MARGIN);

  // Grid lines every cell along both floor axes, over exactly the floor's rectangle, so the ground widens no view's framing.
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
  const gridMaterial: THREE.LineBasicMaterial = new THREE.LineBasicMaterial({
    color: 0xc9c4ba,
  });
  const grid: THREE.LineSegments = new THREE.LineSegments(
    new THREE.BufferGeometry().setAttribute(
      "position",
      new THREE.Float32BufferAttribute(lines, 3),
    ),
    gridMaterial,
  );
  grid.name = "ground";
  scene.add(grid);
  disposers.push((): void => {
    grid.geometry.dispose();
    gridMaterial.dispose();
  });

  // A delivery camera on the three-quarter side.
  const centre: THREE.Vector3 = extent.getCenter(new THREE.Vector3());
  const size: number = extent.getSize(new THREE.Vector3()).length();
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    35,
    data.raster.width / data.raster.height,
    0.05,
    size * 10,
  );
  camera.position
    .copy(centre)
    .add(
      new THREE.Vector3(0.62, 0.42, 0.66)
        .normalize()
        .multiplyScalar(size * 1.6),
    );
  camera.lookAt(centre);

  // Instants keyed to the microsecond: a planner moves a second that lies on its frame grid to that frame's own second, which differs from the case's only by float error.
  const key: (seconds: number) => number = (seconds: number): number =>
    Math.round(seconds * MICRO);
  const index: Map<number, number> = new Map(
    data.seconds.map((seconds: number, at: number): [number, number] => [
      key(seconds),
      at,
    ]),
  );
  return {
    scene,
    camera,
    durationSeconds: data.durationSeconds,
    fps: data.fps,
    width: data.raster.width,
    height: data.raster.height,
    instants: data.instants,
    marks: (): readonly IAutoMovieMark[] => marks,
    seek: async (seconds: number): Promise<void> => {
      // A sampled second is drawn as sampled; any other second within the clock holds the grid frame at or before it, as a video does between frames.
      const frame: number = Math.min(
        Math.floor(seconds * data.fps + 1e-9),
        Math.round(data.durationSeconds * data.fps) - 1,
      );
      const at: number | undefined =
        index.get(key(seconds)) ??
        (frame >= 0 && seconds <= data.durationSeconds
          ? index.get(key(frame / data.fps))
          : undefined);
      if (at === undefined)
        throw new Error(
          `Case ${data.name} has no pose at ${seconds} s; its clock runs from 0 to ${data.durationSeconds} s`,
        );
      for (const { figure, poses } of figures) figure.place(poses[at]!);
    },
    dispose: (): void =>
      disposers.forEach((dispose: () => void): void => dispose()),
  };
}

/*
 * The record of `IBuildFiguresItem`'s site.
 */
type IBuildFiguresItem = {
  figure: MotionCaptureFigure;
  poses: IAutoMoviePose[];
};
