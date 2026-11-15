import {
  type AutoMovieHumanPolygon,
  type IAutoMovieModelObject,
  buildHumanPolygon,
  buildModel,
} from "@automovie/render";
import * as THREE from "three";

import type { IPlaygroundComposition } from "../../playground/structures/IPlaygroundComposition";
import type { TakeClient } from "../../takes/TakeClient";
import type { ITake } from "../../takes/structures/ITake";
import { SCENE_REFUSAL } from "../SCENE_REFUSAL";
import { SceneTrack } from "../SceneTrack";
import { computeSceneTake } from "../computeSceneTake";
import type { IScene } from "../structures/IScene";
import type { IScenePlayer } from "../structures/IScenePlayer";
import { SceneArchetype } from "./SceneArchetype";

/**
 * Plays a take the take worker computed: the polygon man of every performer,
 * drawn by `@automovie/render` from the take's rest bones, and every placed
 * archetype, posed at any second from the take's track. This module computes
 * no motion and imports neither the motion nor the Human package.
 */
export namespace ScenePlayer {
  /** Metres between the floor grid's lines. */
  const CELL: number = 0.5;

  /** The directions, from the action's middle, each named view looks from. */
  const VIEWS: Readonly<Record<IScene.ICamera["view"], THREE.Vector3>> = {
    "three-quarter": new THREE.Vector3(0.62, 0.42, 0.66).normalize(),
    front: new THREE.Vector3(0, 0.28, 1).normalize(),
    side: new THREE.Vector3(1, 0.28, 0).normalize(),
    top: new THREE.Vector3(0, 1, 0.02).normalize(),
  };

  /**
   * Compute one take of a scene and build its player.
   *
   * A refusal of a scene whose record marks `refusedUntil` is thrown as an
   * error named `SCENE_REFUSAL`, its message the packages' words, which the
   * view shows as the scene's known refusal; any other refusal is an error,
   * since an unmarked scene record must plan.
   *
   * @param scene The scene's record.
   * @param take The take's index.
   * @param signal Aborted when the view stops waiting.
   * @returns The player.
   * @throws {Error} When the packages refuse the take, the worker fails, or `signal` aborts.
   */
  export async function load(
    scene: IScene,
    take: number,
    signal?: AbortSignal,
  ): Promise<IScenePlayer> {
    const result: TakeClient.Result = await computeSceneTake(
      scene,
      take,
      signal,
    );
    if (result.kind === "take") return build(scene, result.take);
    if (scene.refusedUntil !== undefined) {
      const refused: Error = new Error(result.refusal.message);
      refused.name = SCENE_REFUSAL;
      throw refused;
    }
    throw new Error(
      `The packages refused the scene ${scene.id}, take ${take}: ${result.refusal.message}`,
    );
  }

  /** Build the scene of a computed take. */
  function build(record: IScene, take: ITake): IScenePlayer {
    const track: SceneTrack.ITrack = take.track;
    const scene: THREE.Scene = new THREE.Scene();
    const style: CSSStyleDeclaration = getComputedStyle(
      document.documentElement,
    );
    scene.background = new THREE.Color(
      style.getPropertyValue("--am-viewport").trim() || "#e9e6df",
    );
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8d8a83, 1.2));
    const sun: THREE.DirectionalLight = new THREE.DirectionalLight(
      0xffffff,
      1.5,
    );
    sun.position.set(2, 4, 3);
    scene.add(sun);
    const disposers: (() => void)[] = [];

    // Each figure under the matrix that puts Human's own frame in the world.
    const first: SceneTrack.IPlacement[][] = SceneTrack.sample(track, 0);
    const reflect: THREE.Matrix4 = new THREE.Matrix4().fromArray(
      take.reflection,
    );
    const figures: AutoMovieHumanPolygon.IDrawing[] = take.figures.map(
      (figure: ITake.IFigure, i: number): AutoMovieHumanPolygon.IDrawing => {
        const drawing: AutoMovieHumanPolygon.IDrawing = buildHumanPolygon({
          bones: figure.bones,
          posed: first[i]!,
        });
        const group: THREE.Group = new THREE.Group();
        group.matrixAutoUpdate = false;
        group.matrix.copy(reflect);
        group.add(drawing.object);
        scene.add(group);
        disposers.push((): void => drawing.dispose());
        return drawing;
      },
    );

    // Each prop as its archetype, moved by its frame.
    const objects: readonly IPlaygroundComposition.IObject[] =
      record.composition?.objects ?? [];
    const props: THREE.Object3D[] = take.props.map(
      (subject: string): THREE.Object3D => {
        const placed: IPlaygroundComposition.IObject | undefined = objects.find(
          (o: IPlaygroundComposition.IObject): boolean => o.subject === subject,
        );
        const group: THREE.Group = new THREE.Group();
        if (placed !== undefined) {
          const model: IAutoMovieModelObject = buildModel(
            SceneArchetype.model(placed) as Parameters<typeof buildModel>[0],
          );
          group.add(model.object);
          disposers.push((): void =>
            model.object.traverse((node: THREE.Object3D): void => {
              if (!(node instanceof THREE.Mesh)) return;
              node.geometry.dispose();
              for (const material of [node.material].flat())
                (material as THREE.Material).dispose();
            }),
          );
        }
        scene.add(group);
        return group;
      },
    );

    // The floor under everything the take moves through, read from the
    // first entry of every figure and prop at every second.
    const box: THREE.Box3 = new THREE.Box3();
    const point: THREE.Vector3 = new THREE.Vector3();
    for (let s: number = 0; s <= take.duration + 1e-9; s += 0.5)
      SceneTrack.sample(track, s).forEach(
        (entries: SceneTrack.IPlacement[], i: number): void => {
          for (const entry of entries) {
            point.fromArray(entry.position);
            if (i < figures.length) point.applyMatrix4(reflect);
            box.expandByPoint(point);
          }
        },
      );
    box.min.y = 0;
    box.max.y = Math.max(box.max.y, 1.8);
    const centre: THREE.Vector3 = box.getCenter(new THREE.Vector3());
    const floor: THREE.Box3 = box.clone().expandByScalar(1);
    const lines: number[] = [];
    for (
      let x: number = Math.ceil(floor.min.x / CELL) * CELL;
      x <= floor.max.x;
      x += CELL
    )
      lines.push(x, 0, floor.min.z, x, 0, floor.max.z);
    for (
      let z: number = Math.ceil(floor.min.z / CELL) * CELL;
      z <= floor.max.z;
      z += CELL
    )
      lines.push(floor.min.x, 0, z, floor.max.x, 0, z);
    const grid: THREE.LineSegments = new THREE.LineSegments(
      new THREE.BufferGeometry().setAttribute(
        "position",
        new THREE.Float32BufferAttribute(lines, 3),
      ),
      new THREE.LineBasicMaterial({
        color: new THREE.Color(
          style.getPropertyValue("--am-viewport-grid").trim() || "#c9c4ba",
        ),
      }),
    );
    scene.add(grid);
    disposers.push((): void => {
      grid.geometry.dispose();
      (grid.material as THREE.Material).dispose();
    });

    // The camera stands where the record's view looks from, far enough for
    // the whole action to fit.
    const size: number = box.getSize(new THREE.Vector3()).length();
    const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
      35,
      16 / 9,
      0.05,
      size * 20 + 10,
    );
    const frame: (view: IScene.ICamera["view"]) => void = (
      view: IScene.ICamera["view"],
    ): void => {
      const distance: number =
        record.camera.distance ?? Math.max(3, size * 1.15);
      camera.position.copy(centre).addScaledVector(VIEWS[view], distance);
      camera.lookAt(centre);
    };
    frame(record.camera.view);

    const seek: (seconds: number) => void = (seconds: number): void => {
      const sampled: SceneTrack.IPlacement[][] = SceneTrack.sample(
        track,
        seconds,
      );
      figures.forEach(
        (drawing: AutoMovieHumanPolygon.IDrawing, i: number): void =>
          drawing.setPose({ posed: sampled[i]! }),
      );
      props.forEach((object: THREE.Object3D, i: number): void => {
        const entry: SceneTrack.IPlacement = sampled[figures.length + i]![0]!;
        object.position.fromArray(entry.position);
        object.quaternion.fromArray(entry.rotation);
      });
    };
    seek(0);

    return {
      scene,
      camera,
      duration: take.duration,
      fps: track.fps,
      timeline: take.timeline,
      centre: centre.toArray() as [number, number, number],
      seek,
      frame,
      dispose: (): void => disposers.forEach((d: () => void): void => d()),
    };
  }
}
