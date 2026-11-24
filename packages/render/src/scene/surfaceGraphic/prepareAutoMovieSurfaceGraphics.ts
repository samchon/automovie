import {
  autoMovieSurfaceFeedWidth,
  autoMovieSurfaceGraphicNodeName,
  sampleSurfaceGraphicKey,
} from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieFilmOptics,
  IAutoMovieFont,
  IAutoMovieImage,
  IAutoMovieModel,
  IAutoMovieSurfaceGraphicLayer,
  IAutoMovieSurfaceGraphicTrack,
} from "@automovie/interface";
import * as THREE from "three";

import { decodeAutoMovieFontSources } from "../../typography/decodeAutoMovieFontSources.js";
import type { IAutoMovieModelObject } from "../IAutoMovieModelObject.js";
import type { IMaterialShaderPatch } from "../IMaterialShaderPatch.js";
import { addMaterialShaderPatch } from "../addMaterialShaderPatch.js";
import { decodeAutoMovieImage } from "../decodeAutoMovieImage.js";
import { AutoMovieFilmResponseStage } from "../filmResponse/AutoMovieFilmResponseStage.js";
import type { IAutoMovieFilmResponseRenderer } from "../filmResponse/IAutoMovieFilmResponseRenderer.js";
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
 * holds one group per key, built by `buildAutoMovieSurfaceGraphicKey` and
 * clipped to the surface's `outline` when it declares one, of which the
 * returned `apply` shows only the key in force. Because the graphic rides the
 * model object, it follows the node's placement, its object motion and its
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

  // Whether the feed targets hold display-encoded pictures from the film
  // response stage, which their materials decode, or plain linear light.
  const encoded: { value: number } = { value: 0 };
  const release: () => void = (): void => {
    for (const root of roots) root.removeFromParent();
    for (const resource of owned) resource.dispose();
    for (const texture of textures.values()) texture.dispose();
    for (const feed of feeds) {
      feed.target.dispose();
      feed.standIn.dispose();
      feed.stage?.dispose();
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
      const { translation, rotation }: typeof surface.frame = surface.frame;
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
              // As wide as the box's aspect on the face, `pixels` high, by the
              // rule the render inventory counts the target with.
              const target: THREE.WebGLRenderTarget =
                new THREE.WebGLRenderTarget(
                  autoMovieSurfaceFeedWidth(
                    layer,
                    surface.width!,
                    surface.depth!,
                  ),
                  layer.pixels,
                );
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
                stage: null,
              });
              feeds.push(made[made.length - 1]!);
              return target.texture;
            },
            feeds: meshes,
            width: surface.width!,
            depth: surface.depth!,
            ...(surface.outline === undefined
              ? {}
              : { outline: surface.outline }),
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
            addMaterialShaderPatch(
              feed.mesh.material as THREE.Material,
              decodeFeedPatch(encoded),
            );
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
      renderer: IAutoMovieFilmResponseRenderer,
      scene: THREE.Scene,
      camera: (id: string) => THREE.Camera | undefined,
      response?: { optics: IAutoMovieFilmOptics; seconds: number },
    ): void => {
      const shown: IFeed[] = feeds.filter(
        (feed: IFeed): boolean =>
          feed.group.visible && feed.group.parent?.parent?.visible === true,
      );
      if (shown.length === 0) return;
      encoded.value = response === undefined ? 0 : 1;

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
            if (response === undefined) renderer.render(scene, view);
            else {
              // The film's own response, so the screen shows the exposed and
              // graded picture; each feed keeps a stage at its own raster.
              feed.stage ??= new AutoMovieFilmResponseStage();
              feed.stage.draw({
                renderer,
                scene,
                camera: view,
                optics: response.optics,
                seconds: response.seconds,
                width: feed.target.width,
                height: feed.target.height,
              });
            }
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

  /** The film response stage the feed draws through, made on its first use. */
  stage: AutoMovieFilmResponseStage | null;
}

/**
 * The shader patch that decodes a feed's sampled picture from sRGB while
 * `encoded.value` is 1, because the film response stage writes its picture
 * encoded for a display, so the screen's white is the graphic's luminance. At 0
 * the target holds the scene's linear light and is read as it is.
 */
function decodeFeedPatch(encoded: { value: number }): IMaterialShaderPatch {
  return {
    key: "automovie-surface-feed-decode",
    apply: (shader: THREE.WebGLProgramParametersWithUniforms): void => {
      shader.uniforms.automovieFeedEncoded = encoded;
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          "#include <common>\nuniform float automovieFeedEncoded;",
        )
        .replace(
          "#include <map_fragment>",
          [
            "#ifdef USE_MAP",
            "  vec4 sampledDiffuseColor = texture2D( map, vMapUv );",
            "  if ( automovieFeedEncoded > 0.5 ) sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );",
            "  diffuseColor *= sampledDiffuseColor;",
            "#endif",
          ].join("\n"),
        );
    },
  };
}
