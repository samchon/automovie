import type { IAutoMovieMark, IAutoMovieTransform } from "@automovie/interface";
import {
  type AutoMovieDrawSubjects,
  type IAutoMovieDrawScene,
  type IAutoMovieDrawSubject,
  type IAutoMovieModelObject,
  buildModel,
} from "@automovie/render";
import * as THREE from "three";

import { AutoMovieArchetypeMarks } from "../core";
import { archetypeCaptureCatalog } from "./archetypeCaptureCatalog";
import { archetypeQuadrupedMarks } from "./archetypeQuadrupedMarks";

/**
 * Width and height of every picture drawn, pixels: square, because an archetype
 * is read from all sides.
 */
const RASTER: number = 960;

/**
 * Side in metres of one cell of the floor grid, a scale to judge heights
 * against.
 */
const GRID_CELL: number = 0.25;

/** Gap in metres between neighbouring members along X and along Z. */
const GAP: number = 0.4;

/** Frames per second of a moving subject's clock. */
const FPS: number = 30;

/**
 * The archetypes as the subjects a draw-only page offers, for `automovie
 * capture --module src/executable/subjects.ts` and the inspector: every subject
 * of `archetypeCaptureCatalog`, by its name.
 *
 * Each subject holds one or several archetypes, each built by `render`'s
 * `buildModel` with its parts named by their ids under an object named after
 * the member inside the group `set`, several set along a diagonal so that a
 * front and a side view each show every member apart, on a light background
 * under an ambient light and one key light, over a floor grid named `ground`
 * with lines every 0.25 m. Its affordances are marks of the kinds
 * `affordance/<kind>` from `AutoMovieArchetypeMarks`, so `--marks affordance/*`
 * draws every contact frame and extent over the model. A still archetype lasts
 * one frame; a ridden one lasts its ride, and seeking rebuilds the model at
 * that second under its root's placement. The delivery camera stands
 * three-quarters to the front; the instrument's named views, fitted to what is
 * drawn, are how it is read. The props are not read.
 *
 * Quadrupeds with a neutral reference also expose native `rig/*` marks: bar
 * axes and joints, independently carried parent attachments, lowest
 * primitive-height rulers and sole supports. Rest consumers additionally supply
 * their same-sample terminal goals and goal-error segments. `surface=false`
 * draws these marks alone; `xray=true` explicitly shows them through surfaces.
 * These are model-space observations anchored to the same current member object
 * that drawing uses, including its ride/layout transform.
 *
 * ```powershell
 * pnpm capture --subject seats --views "three-quarter@focus=set/seat-office;right@ortho@focus=set/seat-office" --marks "affordance/*"
 * ```
 */
export const subjects: AutoMovieDrawSubjects = (): Readonly<
  Record<string, IAutoMovieDrawSubject>
> =>
  Object.fromEntries(
    Object.entries(archetypeCaptureCatalog()).map(
      ([name, entry]: [string, archetypeCaptureCatalog.ISubject]): [
        string,
        IAutoMovieDrawSubject,
      ] => [
        name,
        { create: async (): Promise<IAutoMovieDrawScene> => build(entry) },
      ],
    ),
  );

/** Build one subject's scene. */
function build(entry: archetypeCaptureCatalog.ISubject): IAutoMovieDrawScene {
  const scene: THREE.Scene = new THREE.Scene();
  scene.background = new THREE.Color(0xeef1f5);
  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const key: THREE.DirectionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
  key.position.set(1.5, 3, 2.5);
  scene.add(key, key.target);

  // Every member hangs under one group, so a sweep over `set/*` draws each alone.
  const set: THREE.Group = new THREE.Group();
  set.name = "set";
  scene.add(set);

  // Members stand along a diagonal, each clear of the others along both X and Z, so a front and a side view each show every member apart.
  const offsets: { x: number; z: number }[] = [];
  const arrows: number[] = [];
  let cursor: number = 0;
  let depth: number = 0;
  for (const member of entry.members) {
    const probe: IAutoMovieModelObject = buildModel(member.at(0).archetype);
    const box: THREE.Box3 = new THREE.Box3().setFromObject(probe.object);
    offsets.push(
      entry.members.length === 1
        ? { x: 0, z: 0 }
        : { x: cursor - box.min.x, z: depth - box.min.z },
    );
    arrows.push(
      Math.max(
        0.015,
        Math.min(
          AutoMovieArchetypeMarks.ARROW,
          0.35 * box.getSize(new THREE.Vector3()).length(),
        ),
      ),
    );
    cursor += box.max.x - box.min.x + GAP;
    depth += box.max.z - box.min.z + GAP;
    release(probe);
  }

  // The models at a second: rebuilt on every seek, because articulation moves parts and a ride moves the root.
  const diagnostics: ReturnType<typeof archetypeQuadrupedMarks>[] =
    entry.members.map(
      (
        member: archetypeCaptureCatalog.IMember,
      ): ReturnType<typeof archetypeQuadrupedMarks> =>
        archetypeQuadrupedMarks(member.reference),
    );
  let current: IAutoMovieModelObject[] = [];
  let marks: IAutoMovieMark[] = [];
  const place = (seconds: number): THREE.Object3D[] => {
    for (const built of current) release(built);
    current = [];
    marks = [];
    try {
      entry.members.forEach(
        (member: archetypeCaptureCatalog.IMember, index: number): void => {
          const posed: ReturnType<archetypeCaptureCatalog.IMember["at"]> =
            member.at(seconds);
          const placement: IAutoMovieTransform = {
            translation: {
              x: (posed.placement?.translation.x ?? 0) + offsets[index]!.x,
              y: posed.placement?.translation.y ?? 0,
              z: (posed.placement?.translation.z ?? 0) + offsets[index]!.z,
            },
            rotation: posed.placement?.rotation ?? { x: 0, y: 0, z: 0, w: 1 },
            scale: { x: 1, y: 1, z: 1 },
          };
          const observed: readonly IAutoMovieMark[] = [
            ...diagnostics[index]!(
              posed.archetype,
              `set/${member.name}`,
              posed.goals,
            ),
            ...AutoMovieArchetypeMarks.of(
              `set/${member.name}`,
              posed.archetype.affordances,
              placement,
              arrows[index]!,
            ),
          ];
          const built: IAutoMovieModelObject = buildModel(posed.archetype);
          built.object.name = member.name;
          built.object.position.set(
            placement.translation.x,
            placement.translation.y,
            placement.translation.z,
          );
          built.object.quaternion.set(
            placement.rotation.x,
            placement.rotation.y,
            placement.rotation.z,
            placement.rotation.w,
          );
          built.object.updateMatrixWorld(true);
          set.add(built.object);
          set.updateMatrixWorld(true);
          current.push(built);
          marks.push(...observed);
        },
      );
    } catch (error) {
      for (const built of current) release(built);
      current = [];
      marks = [];
      throw error;
    }
    return current.map(
      (built: IAutoMovieModelObject): THREE.Object3D => built.object,
    );
  };

  // The floor under everything drawn at any second, and the delivery camera framing it.
  const duration: number = entry.duration ?? 1 / FPS;
  const extent: THREE.Box3 = new THREE.Box3();
  const samples: number = entry.duration === undefined ? 1 : 24;
  for (let k: number = 0; k < samples; k++)
    for (const object of place((duration * k) / Math.max(1, samples - 1)))
      extent.expandByObject(object);
  place(0);
  extent.expandByPoint(new THREE.Vector3(extent.min.x, 0, extent.min.z));
  extent.expandByScalar(0.1);
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
    new THREE.LineBasicMaterial({ color: 0xc3c8d0 }),
  );
  grid.name = "ground";
  scene.add(grid);

  const centre: THREE.Vector3 = extent.getCenter(new THREE.Vector3());
  const size: number = extent.getSize(new THREE.Vector3()).length();
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    35,
    1,
    Math.max(0.005, size / 100),
    size * 10,
  );
  camera.position
    .copy(centre)
    .add(
      new THREE.Vector3(0.6, 0.45, 1).normalize().multiplyScalar(size * 1.7),
    );
  camera.lookAt(centre);
  camera.updateMatrixWorld(true);
  return {
    scene,
    camera,
    durationSeconds: duration,
    fps: FPS,
    width: RASTER,
    height: RASTER,
    instants: entry.instants,
    marks: (): readonly IAutoMovieMark[] => marks,
    seek: async (seconds: number): Promise<void> => {
      place(seconds);
    },
    dispose: (): void => {
      for (const built of current) release(built);
      grid.geometry.dispose();
      (grid.material as THREE.Material).dispose();
    },
  };
}

/** Take a built model out of its parent and release its geometry and materials. */
function release(built: IAutoMovieModelObject): void {
  built.object.removeFromParent();
  built.object.traverse((object: THREE.Object3D): void => {
    // three's literal class flag tells a mesh, whose resources are its own.
    const mesh: THREE.Mesh = object as THREE.Mesh;
    if (mesh.isMesh !== true) return;
    mesh.geometry.dispose();
    for (const material of [mesh.material].flat()) material.dispose();
  });
}
