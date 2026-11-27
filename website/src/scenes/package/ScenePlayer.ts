import {
  AutoMovieRenderFrameGrid,
  AutoMovieRenderHumanPolygon,
  AutoMovieRenderSceneLayout,
  type IAutoMovieRenderModelObject,
} from "@automovie/render";
import * as THREE from "three";

import { BakedClient } from "../../baked/BakedClient";
import type { IPlaygroundComposition } from "../../playground/structures/IPlaygroundComposition";
import type { TakeClient } from "../../takes/TakeClient";
import type { ITake } from "../../takes/structures/ITake";
import { SCENE_REFUSAL } from "../SCENE_REFUSAL";
import { SceneTrack } from "../SceneTrack";
import { computeSceneTake } from "../computeSceneTake";
import type { IScene } from "../structures/IScene";
import type { IScenePlayer } from "../structures/IScenePlayer";
import { SceneArchetype } from "./SceneArchetype";
import { scenePracticalLight } from "./scenePracticalLight";

/** A drawn prop: its moving group, its articulated parts by id and the practical lights it carries. */
interface IPropDrawing {
  /** The prop's world group, moved by its frame. */
  group: THREE.Group;

  /** The model's articulated parts by part id. */
  parts: IAutoMovieRenderModelObject["parts"];

  /** Each light's setter for a film second. */
  lights: ((seconds: number) => void)[];
}

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
   * @param baked Where the first take was baked, which plays from its bytes; a take never baked is computed instead.
   * @returns The player.
   * @throws {Error} When the packages refuse the take, the worker fails, a baked take is broken, or `signal` aborts.
   */
  export async function load(
    scene: IScene,
    take: number,
    signal?: AbortSignal,
    baked?: BakedClient.Kind,
  ): Promise<IScenePlayer> {
    // A take the build computed plays at once; the worker computes it only
    // when the site was served without a bake.
    if (baked !== undefined && take === 0) {
      let read: ITake | null = null;
      try {
        read = await BakedClient.take(baked, scene.id);
      } catch (error: unknown) {
        // Only a take that was never baked falls back; a broken one fails.
        if (!(error instanceof Error) || error.name !== BakedClient.MISSING)
          throw error;
      }
      if (signal?.aborted === true)
        throw new DOMException("The view stopped waiting.", "AbortError");
      if (read !== null) return build(scene, read);
    }
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
    const entriesPerFrame: number = track.orders.reduce(
      (count: number, order: string[]): number => count + order.length,
      0,
    );
    if (
      !Number.isFinite(take.duration) ||
      take.duration < 0 ||
      !Number.isFinite(track.fps) ||
      track.fps <= 0 ||
      !Number.isInteger(track.frames) ||
      track.frames < 1 ||
      (track.duration !== undefined &&
        (track.duration !== take.duration ||
          track.frames !==
            AutoMovieRenderFrameGrid.last(take.duration, track.fps) + 1)) ||
      entriesPerFrame === 0 ||
      track.orders.length !== take.figures.length + take.props.length ||
      track.orders.some((order: string[]): boolean => order.length === 0) ||
      track.values.length !== track.frames * entriesPerFrame * SceneTrack.STRIDE
    )
      throw new Error(`The scene ${record.id} has no trackable take.`);
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
    const figures: AutoMovieRenderHumanPolygon.IDrawing[] = take.figures.map(
      (figure: ITake.IFigure, i: number): AutoMovieRenderHumanPolygon.IDrawing => {
        const drawing: AutoMovieRenderHumanPolygon.IDrawing = AutoMovieRenderHumanPolygon.build({
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
    const props: IPropDrawing[] = take.props.map(
      (subject: string): IPropDrawing => {
        const placed: IPlaygroundComposition.IObject | undefined = objects.find(
          (o: IPlaygroundComposition.IObject): boolean => o.subject === subject,
        );
        const group: THREE.Group = new THREE.Group();
        let parts: IAutoMovieRenderModelObject["parts"] = new Map();
        const lights: ((seconds: number) => void)[] = [];
        if (placed !== undefined) {
          const archetype: SceneArchetype.Model = SceneArchetype.model(placed);
          const model: IAutoMovieRenderModelObject = AutoMovieRenderSceneLayout.buildModel(archetype);
          group.add(model.object);
          parts = model.parts;
          for (const light of record.practicalLights ?? [])
            if (light.prop === subject)
              lights.push(
                scenePracticalLight(group, archetype, take.timeline, light),
              );
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
        return { group, parts, lights };
      },
    );

    const seek: (seconds: number) => void = (seconds: number): void => {
      const sampled: SceneTrack.IPlacement[][] = SceneTrack.sample(
        track,
        seconds,
      );
      figures.forEach(
        (drawing: AutoMovieRenderHumanPolygon.IDrawing, i: number): void =>
          drawing.setPose({ posed: sampled[i]! }),
      );
      props.forEach(
        ({ group, parts, lights }: IPropDrawing, i: number): void => {
          const [entry, ...articulation]: SceneTrack.IPlacement[] =
            sampled[figures.length + i]!;
          group.position.fromArray(entry!.position);
          group.quaternion.fromArray(entry!.rotation);
          for (const setLight of lights) setLight(seconds);
          for (const moved of articulation) {
            const part: THREE.Object3D | undefined = parts.get(
              moved.bone.slice(SceneTrack.PROP_PART.length),
            );
            if (part === undefined) continue;
            part.position.fromArray(moved.position);
            part.quaternion.fromArray(moved.rotation);
          }
        },
      );
    };
    seek(0);

    // Start with the drawn bodies and props, then include every recorded
    // position. Interpolated positions lie between the recorded endpoints.
    const box: THREE.Box3 = new THREE.Box3().setFromObject(scene);
    const point: THREE.Vector3 = new THREE.Vector3();
    const propFrame: THREE.Vector3 = new THREE.Vector3();
    const propRotation: THREE.Quaternion = new THREE.Quaternion();
    let offset: number = 0;
    for (let frame: number = 0; frame < track.frames; frame++)
      for (const [group, order] of track.orders.entries())
        for (let entry: number = 0; entry < order.length; entry++) {
          point
            .fromArray(track.values, offset)
            .divideScalar(SceneTrack.POSITION_SCALE);
          if (group < figures.length) point.applyMatrix4(reflect);
          else if (entry === 0) {
            propFrame.copy(point);
            propRotation.fromArray(track.values, offset + 3);
            propRotation.normalize();
          } else point.applyQuaternion(propRotation).add(propFrame);
          box.expandByPoint(point);
          offset += SceneTrack.STRIDE;
        }
    box.min.y = Math.min(0, box.min.y);
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

    // The camera stands where the record's view looks from, just far enough
    // for the action's box to fit the frame at the camera's aspect, which a
    // view sets to its canvas's shape: the box's corners are measured along
    // the view's own right and up, so a tall single figure and a wide pair
    // are both framed closely, with a tenth to spare.
    const bounds: THREE.Sphere = box.getBoundingSphere(new THREE.Sphere());
    const fieldOfView: number = 35;
    const aspect: number = 16 / 9;
    const tangent: number = Math.tan(THREE.MathUtils.degToRad(fieldOfView / 2));
    const corners: THREE.Vector3[] = [0, 1, 2, 3, 4, 5, 6, 7].map(
      (i: number): THREE.Vector3 =>
        new THREE.Vector3(
          i & 1 ? box.max.x : box.min.x,
          i & 2 ? box.max.y : box.min.y,
          i & 4 ? box.max.z : box.min.z,
        ).sub(centre),
    );
    const fit: (toward: THREE.Vector3, ratio: number) => number = (
      toward: THREE.Vector3,
      ratio: number,
    ): number => {
      if (record.camera.distance !== undefined) return record.camera.distance;
      const right: THREE.Vector3 = new THREE.Vector3(0, 1, 0)
        .cross(toward)
        .normalize();
      if (right.lengthSq() < 1e-6) right.set(1, 0, 0);
      const up: THREE.Vector3 = toward.clone().cross(right).normalize();
      let needed: number = 0;
      for (const corner of corners) {
        const near: number = corner.dot(toward);
        needed = Math.max(
          needed,
          Math.abs(corner.dot(up)) / tangent + near,
          Math.abs(corner.dot(right)) / (tangent * ratio) + near,
        );
      }
      return needed * 1.1;
    };
    const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
      fieldOfView,
      aspect,
      0.05,
      fit(VIEWS["top"], aspect) +
        fit(VIEWS["side"], aspect) +
        bounds.radius * 4,
    );
    const frame: (view: IScene.ICamera["view"]) => void = (
      view: IScene.ICamera["view"],
    ): void => {
      camera.position
        .copy(centre)
        .addScaledVector(VIEWS[view], fit(VIEWS[view], camera.aspect));
      camera.lookAt(centre);
    };
    frame(record.camera.view);

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
