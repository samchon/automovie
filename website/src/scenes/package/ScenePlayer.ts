import {
  type AutoMovieHumanPolygon,
  type IAutoMovieModelObject,
  buildHumanPolygon,
  buildModel,
} from "@automovie/render";
import * as THREE from "three";

import { SITE_BASE } from "../../SITE_BASE";
import type { IPlaygroundComposition } from "../../playground/structures/IPlaygroundComposition";
import { SCENE_REFUSAL } from "../SCENE_REFUSAL";
import { SceneTrack } from "../SceneTrack";
import type { IScene } from "../structures/IScene";
import type { ISceneManifest } from "../structures/ISceneManifest";
import type { IScenePlayer } from "../structures/IScenePlayer";
import { SceneArchetype } from "./SceneArchetype";

/**
 * Plays a baked take: the polygon man of every performer, drawn by
 * `@automovie/render` from the baked rest bones, and every placed archetype,
 * posed at any second from the take's track. No motion is computed here.
 */
export namespace ScenePlayer {
  /** Where the bake's files are served from, under the site's base path. */
  const BAKED: string = `${SITE_BASE}/baked`;

  /** Metres between the floor grid's lines. */
  const CELL: number = 0.5;

  /** The directions, from the action's middle, each named view looks from. */
  const VIEWS: Readonly<Record<IScene.ICamera["view"], THREE.Vector3>> = {
    "three-quarter": new THREE.Vector3(0.62, 0.42, 0.66).normalize(),
    front: new THREE.Vector3(0, 0.28, 1).normalize(),
    side: new THREE.Vector3(1, 0.28, 0).normalize(),
    top: new THREE.Vector3(0, 1, 0.02).normalize(),
  };

  let manifest: Promise<ISceneManifest> | null = null;
  const bodies: Map<string, Promise<AutoMovieHumanPolygon.IBone[]>> = new Map();
  const tracks: Map<string, Promise<Int16Array>> = new Map();

  /**
   * The bake's manifest, fetched once; a failed fetch is forgotten, so a
   * later view asks again.
   *
   * @returns The manifest.
   * @throws {Error} When it cannot be fetched or is of another version.
   */
  export function index(): Promise<ISceneManifest> {
    manifest ??= fetch(`${BAKED}/manifest.json`).then(
      async (response: Response): Promise<ISceneManifest> => {
        if (!response.ok)
          throw new Error(`The baked scenes did not load (${response.status})`);
        const read: ISceneManifest = await response.json();
        if (read.version !== 1)
          throw new Error(
            `The baked scenes are of version ${String(read.version)}; this page reads version 1`,
          );
        return read;
      },
    );
    manifest.catch((): void => {
      manifest = null;
    });
    return manifest;
  }

  /**
   * Load one take of a scene.
   *
   * @param scene The scene's record.
   * @param take The take's index.
   * @returns The player.
   * @throws {Error} When the take was not baked or a file does not load.
   */
  export async function load(
    scene: IScene,
    take: number,
  ): Promise<IScenePlayer> {
    const read: ISceneManifest = await index();
    const baked: ISceneManifest.ITake | undefined =
      read.scenes[scene.id]?.takes[take];
    if (baked === undefined)
      throw new Error(`The scene ${scene.id} has no baked take ${take}`);
    if (baked.refusal !== undefined) {
      const refused: Error = new Error(baked.refusal);
      refused.name = SCENE_REFUSAL;
      throw refused;
    }

    const [values, rests]: [Int16Array, AutoMovieHumanPolygon.IBone[][]] =
      await Promise.all([
        samples(baked.file),
        Promise.all(
          baked.figures.map(
            (
              figure: ISceneManifest.IFigure,
            ): Promise<AutoMovieHumanPolygon.IBone[]> =>
              rest(read, figure.body),
          ),
        ),
      ]);
    const track: SceneTrack.ITrack = {
      fps: baked.fps,
      frames: baked.frames,
      orders: [
        ...baked.figures.map(
          (figure: ISceneManifest.IFigure): string[] =>
            read.bodies[figure.body]!.order,
        ),
        ...baked.props.map((): string[] => ["frame"]),
      ],
      values,
    };
    return build(scene, baked, track, rests, read.reflection);
  }

  /** A take's track, fetched once for every view that shows it; a failed fetch is forgotten. */
  function samples(file: string): Promise<Int16Array> {
    let known: Promise<Int16Array> | undefined = tracks.get(file);
    if (known === undefined) {
      known = fetch(`${BAKED}/${file}`).then(
        async (response: Response): Promise<Int16Array> => {
          if (!response.ok)
            throw new Error(`The take did not load (${response.status})`);
          return new Int16Array(await response.arrayBuffer());
        },
      );
      known.catch((): void => {
        tracks.delete(file);
      });
      tracks.set(file, known);
    }
    return known;
  }

  /** A body's rest bones, fetched once; a failed fetch is forgotten. */
  function rest(
    read: ISceneManifest,
    body: string,
  ): Promise<AutoMovieHumanPolygon.IBone[]> {
    let known: Promise<AutoMovieHumanPolygon.IBone[]> | undefined =
      bodies.get(body);
    if (known === undefined) {
      const entry: ISceneManifest.IBody | undefined = read.bodies[body];
      if (entry === undefined)
        return Promise.reject(new Error(`No baked body is named ${body}`));
      known = fetch(`${BAKED}/${entry.file}`).then(
        async (response: Response): Promise<AutoMovieHumanPolygon.IBone[]> => {
          if (!response.ok)
            throw new Error(
              `The body ${body} did not load (${response.status})`,
            );
          const json: { bones: AutoMovieHumanPolygon.IBone[] } =
            await response.json();
          return json.bones;
        },
      );
      known.catch((): void => {
        bodies.delete(body);
      });
      bodies.set(body, known);
    }
    return known;
  }

  /** Build the scene of a loaded take. */
  function build(
    record: IScene,
    baked: ISceneManifest.ITake,
    track: SceneTrack.ITrack,
    rests: AutoMovieHumanPolygon.IBone[][],
    reflection: number[],
  ): IScenePlayer {
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
    const reflect: THREE.Matrix4 = new THREE.Matrix4().fromArray(reflection);
    const figures: AutoMovieHumanPolygon.IDrawing[] = rests.map(
      (
        bones: AutoMovieHumanPolygon.IBone[],
        i: number,
      ): AutoMovieHumanPolygon.IDrawing => {
        const drawing: AutoMovieHumanPolygon.IDrawing = buildHumanPolygon({
          bones,
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
    const props: THREE.Object3D[] = baked.props.map(
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
    for (let s: number = 0; s <= baked.duration + 1e-9; s += 0.5)
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
      duration: baked.duration,
      fps: baked.fps,
      centre: centre.toArray() as [number, number, number],
      seek,
      frame,
      dispose: (): void => disposers.forEach((d: () => void): void => d()),
    };
  }
}
