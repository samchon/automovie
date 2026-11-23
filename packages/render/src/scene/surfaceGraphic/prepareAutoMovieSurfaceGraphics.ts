import {
  autoMovieSurfaceGraphicNodeName,
  sampleSurfaceGraphicKey,
} from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieFont,
  IAutoMovieImage,
  IAutoMovieModel,
  IAutoMovieSurfaceGraphicLayer,
  IAutoMovieSurfaceGraphicTrack,
} from "@automovie/interface";
import * as THREE from "three";

import { decodeAutoMovieFontSources } from "../../typography/decodeAutoMovieFontSources.js";
import type { IAutoMovieModelObject } from "../IAutoMovieModelObject.js";
import { decodeAutoMovieImage } from "../decodeAutoMovieImage.js";
import { AUTOMOVIE_SURFACE_GRAPHIC_KEY } from "./AUTOMOVIE_SURFACE_GRAPHIC_KEY.js";
import type { IAutoMovieSurfaceGraphicsObject } from "./IAutoMovieSurfaceGraphicsObject.js";
import type { IPrepareAutoMovieSurfaceGraphicsProps } from "./IPrepareAutoMovieSurfaceGraphicsProps.js";
import { buildAutoMovieSurfaceGraphicKey } from "./buildAutoMovieSurfaceGraphicKey.js";
import { createAutoMovieSurfaceGraphicMaterial } from "./createAutoMovieSurfaceGraphicMaterial.js";

/**
 * Lift of every graphic above its surface along the frame's `+Y`, metres: half
 * a millimetre, so the face does not fight the prop's own surface for depth.
 */
const LIFT: number = 0.0005;

/**
 * Build a shot's surface graphics once, before any frame is drawn, and mount
 * each on its prop.
 *
 * Every track becomes one group named `surface-graphic:<node>/<surface>`,
 * marked for the render-mode boundary, parented to the node's model object at
 * the surface affordance's frame and lifted half a millimetre along `+Y`. It
 * holds one group per key, built by `buildAutoMovieSurfaceGraphicKey`, of which
 * the returned `apply` shows only the key in force. Because the graphic rides
 * the model object, it follows the node's placement, its object motion and its
 * carriage at every sample time, and two props sharing one model show their own
 * graphics.
 *
 * The shot's font sources decode here first, all of them, so a source the
 * decoder refuses rejects with its diagnostic before anything is built; a text
 * layer then sets its glyphs from the decoded font it names. Images decode here
 * too, once per distinct image: an id the node's model carries decodes from its
 * PNG bytes, any other id loads through `loadImage`. Every texture is decoded
 * as sRGB and sampled with the first image row at the face's top. A node
 * without a mounted object, a surface that is not a sized `surface` affordance
 * of its model, or an image that resolves nowhere rejects naming the track,
 * after releasing everything already made.
 */
export async function prepareAutoMovieSurfaceGraphics(
  props: IPrepareAutoMovieSurfaceGraphicsProps,
): Promise<IAutoMovieSurfaceGraphicsObject> {
  const tracks: readonly IAutoMovieSurfaceGraphicTrack[] =
    props.shot.surfaceGraphics ?? [];
  const models: Map<string, IAutoMovieModel> = new Map(
    props.models.map((model: IAutoMovieModel): [string, IAutoMovieModel] => [
      model.id,
      model,
    ]),
  );
  const modelOfNode: Map<string, string> = new Map(
    props.scene.nodes.map(
      (node: { id: string; model: string }): [string, string] => [
        node.id,
        node.model,
      ],
    ),
  );
  const owned: { dispose(): void }[] = [];
  const textures: Map<string, THREE.Texture> = new Map();
  const roots: THREE.Group[] = [];
  const keyGroups: THREE.Group[][] = [];
  const feeds: IFeed[] = [];
  const release: () => void = (): void => {
    for (const root of roots) root.removeFromParent();
    for (const resource of owned) resource.dispose();
    for (const texture of textures.values()) texture.dispose();
    for (const feed of feeds) {
      feed.target.dispose();
      feed.standIn.dispose();
    }
  };

  try {
    // Every listed font decodes before anything is built, so a font the
    // decoder refuses refuses the shot before any frame is drawn.
    const fonts: Map<string, IAutoMovieFont> =
      (props.shot.fonts ?? []).length === 0
        ? new Map()
        : await decodeAutoMovieFontSources({
            sources: props.shot.fonts!,
            ...(props.readFontAsset === undefined
              ? {}
              : { readAsset: props.readFontAsset }),
          });
    for (const track of tracks) {
      const label: string = autoMovieSurfaceGraphicNodeName(
        track.node,
        track.surface,
      );
      const model: IAutoMovieModel | undefined = models.get(
        modelOfNode.get(track.node) ?? "",
      );
      const object: IAutoMovieModelObject | undefined = props.resolveNode(
        track.node,
      );
      const surface: IAutoMovieAffordance | undefined = (
        model?.affordances ?? []
      ).find(
        (entry: IAutoMovieAffordance): boolean => entry.id === track.surface,
      );
      if (model === undefined || object === undefined)
        throw new Error(`Surface graphic "${label}" has no mounted prop model`);
      if (
        surface?.kind !== "surface" ||
        !(surface.width! > 0) ||
        !(surface.depth! > 0)
      )
        throw new Error(
          `Surface graphic "${label}" names no sized "surface" affordance of model "${model.id}"`,
        );

      // Decode each distinct image the track's layers name, model-scoped for
      // carried images, path-scoped for project assets.
      for (const key of track.keys)
        for (const layer of key.graphic.layers)
          if (layer.kind === "image")
            await prepareImage(model, layer, label, props, textures);

      const root: THREE.Group = new THREE.Group();
      root.name = label;
      root.userData[AUTOMOVIE_SURFACE_GRAPHIC_KEY] = true;
      const { translation, rotation } = surface.frame;
      root.position.set(translation.x, translation.y, translation.z);
      root.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
      const lifted: THREE.Group = new THREE.Group();
      lifted.position.y = LIFT;
      root.add(lifted);
      const groups: THREE.Group[] = track.keys.map(
        (key: IAutoMovieSurfaceGraphicTrack["keys"][number]): THREE.Group => {
          const made: IFeed[] = [];
          const meshes: THREE.Mesh[] = [];
          const group: THREE.Group = buildAutoMovieSurfaceGraphicKey({
            graphic: key.graphic,
            feed: (
              layer: IAutoMovieSurfaceGraphicLayer.IFeed,
            ): THREE.Texture => {
              // As wide as the box's aspect on the face, `pixels` high.
              const height: number = layer.pixels;
              const width: number = Math.max(
                1,
                Math.round(
                  (height * layer.width * surface.width!) /
                    (layer.height * surface.depth!),
                ),
              );
              const target: THREE.WebGLRenderTarget =
                new THREE.WebGLRenderTarget(width, height);
              const standIn: THREE.Material =
                key.graphic.background === null
                  ? new THREE.MeshBasicMaterial({
                      colorWrite: false,
                      depthWrite: false,
                      transparent: true,
                    })
                  : createAutoMovieSurfaceGraphicMaterial(
                      key.graphic.emission,
                      key.graphic.background,
                    );
              made.push({
                target,
                standIn,
                camera: layer.camera,
                mesh: null!,
                group: null!,
              });
              feeds.push(made[made.length - 1]!);
              return target.texture;
            },
            feeds: meshes,
            width: surface.width!,
            depth: surface.depth!,
            image: (asset: string): THREE.Texture =>
              textures.get(imageKey(model, asset))!,
            font: (id: string): IAutoMovieFont => {
              const font: IAutoMovieFont | undefined = fonts.get(id);
              if (font === undefined)
                throw new Error(
                  `Surface graphic "${label}" names font "${id}", which the shot does not list`,
                );
              return font;
            },
            owned,
          });
          made.forEach((feed: IFeed, index: number): void => {
            feed.mesh = meshes[index]!;
            feed.group = group;
          });
          group.visible = false;
          lifted.add(group);
          return group;
        },
      );
      object.object.add(root);
      roots.push(root);
      keyGroups.push(groups);
    }
  } catch (error) {
    release();
    throw error;
  }

  let disposed: boolean = false;
  return {
    roots,
    apply: (seconds: number): void => {
      if (
        !Number.isFinite(seconds) ||
        seconds < 0 ||
        seconds >= props.shot.duration
      )
        throw new RangeError(
          `Surface graphics sample ${seconds} s must be inside the shot`,
        );
      tracks.forEach(
        (track: IAutoMovieSurfaceGraphicTrack, index: number): void => {
          const shown: number = sampleSurfaceGraphicKey(track, seconds);
          keyGroups[index]!.forEach((group: THREE.Group, key: number): void => {
            group.visible = key === shown;
          });
        },
      );
    },
    renderFeeds: (
      renderer: THREE.WebGLRenderer,
      scene: THREE.Scene,
      camera: (id: string) => THREE.Camera | undefined,
    ): void => {
      const shown: IFeed[] = feeds.filter(
        (feed: IFeed): boolean =>
          feed.group.visible && feed.group.parent?.parent?.visible === true,
      );
      if (shown.length === 0) return;

      // Every feed draws as its background inside a feed, so no screen shows
      // a view of itself and the feed stays one level deep.
      const materials: THREE.Material[] = feeds.map(
        (feed: IFeed): THREE.Material => feed.mesh.material as THREE.Material,
      );
      for (const feed of feeds) feed.mesh.material = feed.standIn;
      const previous: THREE.WebGLRenderTarget | null =
        renderer.getRenderTarget();
      try {
        for (const feed of shown) {
          const view: THREE.Camera | undefined = camera(feed.camera);
          if (view === undefined)
            throw new Error(
              `Surface feed camera "${feed.camera}" is not built`,
            );
          const perspective: THREE.PerspectiveCamera | null =
            (view as THREE.PerspectiveCamera).isPerspectiveCamera === true
              ? (view as THREE.PerspectiveCamera)
              : null;
          const aspect: number | undefined = perspective?.aspect;
          if (perspective !== null) {
            perspective.aspect = feed.target.width / feed.target.height;
            perspective.updateProjectionMatrix();
          }

          // The camera gets its own aspect back even when the draw throws.
          try {
            renderer.setRenderTarget(feed.target);
            renderer.render(scene, view);
          } finally {
            if (perspective !== null) {
              perspective.aspect = aspect!;
              perspective.updateProjectionMatrix();
            }
          }
        }
      } finally {
        renderer.setRenderTarget(previous);
        feeds.forEach((feed: IFeed, index: number): void => {
          feed.mesh.material = materials[index]!;
        });
      }
    },
    dispose: (): void => {
      if (disposed) return;
      disposed = true;
      release();
    },
  };
}

/** The decoded-texture key of an image id as a node of `model` resolves it. */
function imageKey(model: IAutoMovieModel, asset: string): string {
  return (model.images ?? []).some(
    (image: IAutoMovieImage): boolean => image.id === asset,
  )
    ? `model:${model.id}:${asset}`
    : `asset:${asset}`;
}

/**
 * Decode one image layer's texture into `textures` unless an earlier layer
 * already did: a carried image from its own bytes, a project asset through the
 * host's loader. Either way the texture is sRGB with its first row at `v = 0`.
 */
async function prepareImage(
  model: IAutoMovieModel,
  layer: IAutoMovieSurfaceGraphicLayer.IImage,
  label: string,
  props: IPrepareAutoMovieSurfaceGraphicsProps,
  textures: Map<string, THREE.Texture>,
): Promise<void> {
  const key: string = imageKey(model, layer.asset);
  if (textures.has(key)) return;
  const carried: IAutoMovieImage | undefined = (model.images ?? []).find(
    (image: IAutoMovieImage): boolean => image.id === layer.asset,
  );
  if (carried === undefined && props.loadImage === undefined)
    throw new Error(
      `Surface graphic "${label}" image "${layer.asset}" is neither carried by model "${model.id}" nor loadable without an image loader`,
    );
  const texture: THREE.Texture =
    carried !== undefined
      ? await decodeAutoMovieImage(carried)
      : await props.loadImage!(layer.asset);
  textures.set(key, texture);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.needsUpdate = true;
}

/** One feed layer's render target, its stand-in material and its mounted mesh. */
interface IFeed {
  /** The target the camera's view is drawn into. */
  target: THREE.WebGLRenderTarget;

  /** The graphic's background, shown in place of the feed inside any feed. */
  standIn: THREE.Material;

  /** Id of the camera the feed shows. */
  camera: string;

  /** The feed layer's mesh. */
  mesh: THREE.Mesh;

  /** The key group holding the mesh, visible while its key is in force. */
  group: THREE.Group;
}
