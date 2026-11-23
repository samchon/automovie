import type {
  AutoMovieGuidePass,
  IAutoMovieSemanticMaskBinding,
} from "@automovie/interface";
import * as THREE from "three";

import { DEPTH_NORMALIZATION_RANGE } from "./DEPTH_NORMALIZATION_RANGE.js";
import { EDGE_WIDTH } from "./EDGE_WIDTH.js";
import type { IAutoMovieRenderModeHandle } from "./IAutoMovieRenderModeHandle.js";
import { applyDepthMode } from "./applyDepthMode.js";
import { applyEdgeMode } from "./applyEdgeMode.js";
import { applyMaskMode } from "./applyMaskMode.js";
import { applyPoseMode } from "./applyPoseMode.js";
import { applySemanticMaskMode } from "./applySemanticMaskMode.js";
import { createAutoMovieAlbedoMaterial } from "./createAutoMovieAlbedoMaterial.js";
import { guardAutoMovieRenderModeRetirement } from "./guardAutoMovieRenderModeRetirement.js";
import { overrideAutoMovieRenderModeMaterials } from "./overrideAutoMovieRenderModeMaterials.js";
import { restoreAutoMovieRenderModeOnce } from "./restoreAutoMovieRenderModeOnce.js";
import { restoreAutoMovieRenderModeState } from "./restoreAutoMovieRenderModeState.js";
import { autoMovieSemanticMaskOf } from "./semanticMask/index.js";
import { applyAutoMovieGraphicsMode } from "./surfaceGraphic/applyAutoMovieGraphicsMode.js";
import { hideAutoMovieSurfaceGraphics } from "./surfaceGraphic/hideAutoMovieSurfaceGraphics.js";

/** A renderable that is NOT a mesh: a line/grid/helper, points, or a sprite. */
const isNonMeshRenderable: (object: THREE.Object3D) => boolean = (
  object: THREE.Object3D,
): boolean =>
  (object as THREE.Line).isLine === true ||
  (object as THREE.Points).isPoints === true ||
  (object as THREE.Sprite).isSprite === true;

/**
 * Hide every currently-visible non-mesh renderable in the scene (grids and
 * other `LineSegments`/`Line` helpers, `Points`, `Sprite`s) and return a
 * restore that makes them visible again. A structural guide pass segments only
 * the subject MESH geometry, so any non-mesh renderable left visible would draw
 * its live beauty material over the pass's black background: a grid reading as
 * "very close" in the depth pass, a non-palette color in the mask, a stray line
 * beside the skeleton in the pose pass (#1226). Hidden BEFORE a pass builds its
 * own overlay (the pose skeleton is itself `LineSegments`), so that overlay,
 * added afterward, stays visible.
 */
const hideNonMeshRenderables: (scene: THREE.Scene) => () => void = (
  scene: THREE.Scene,
): (() => void) => {
  const hidden: THREE.Object3D[] = [];
  scene.traverse((object: THREE.Object3D<THREE.Object3DEventMap>): void => {
    if (isNonMeshRenderable(object) && object.visible) {
      object.visible = false;
      hidden.push(object);
    }
  });
  return (): void => {
    for (const object of hidden) object.visible = true;
  };
};

/**
 * Apply one diffusion-guide render mode to a built scene, returning the restore
 * handle. A capture applies the override at snapshot time and reverses it right
 * after, so the viewer stays a thin projection of the engine result. A caller
 * that keeps an override across frames calls the handle's `update` before
 * drawing each one, which `outline` and `pose` supply because they hold copies
 * the scene's animation does not move:
 *
 * - `beauty`: no override (the ordinary shaded render).
 * - `depth`: meshes use clamp(1-viewZ/range,0,1) with camera-space depth and a
 *   shared {@link DEPTH_NORMALIZATION_RANGE}, independent of near/far
 *   normalization. Camera changes can change a world point's viewZ; black is
 *   the far-range/background convention.
 * - `mask`: the segmentation pass. A scene handed its palette by
 *   {@link attachAutoMovieSemanticMask} is painted by
 *   {@link applyAutoMovieSemanticMask}, so every colour is the one that entity's
 *   own semantic id earned and survives a rebuild in a different order. A scene
 *   handed none keeps the legacy ramp, where each top-level child gets a flat
 *   unlit colour by its index: readable as coverage and silhouette, never as
 *   identity, because inserting one node repaints everything after it.
 * - `normal`: every mesh swapped to `MeshNormalMaterial`: the unlit
 *   surface-normal conditioning pass (#1166).
 * - `outline`: black fills plus inverted-hull back-face shells extruded by
 *   {@link EDGE_WIDTH} in model space, leaving white contours on black.
 *   Object/instance scaling and camera projection affect world thickness and
 *   screen line weight.
 * - `pose`: meshes hidden, and a line-segment overlay of every bone→child bone
 *   connection drawn over a black background: the skeleton pose pass.
 * - `albedo`: every mesh drawn unlit in its material's base colour on black, one
 *   `createAutoMovieAlbedoMaterial` per original material: the material channel
 *   for a neural renderer that is given lighting separately.
 *
 * Surface graphics from `prepareAutoMovieSurfaceGraphics` draw in `beauty`,
 * `mask` and `graphics` only; every other pass hides them for its duration.
 *
 * - `graphics`: {@link applyAutoMovieGraphicsMode}: the surface graphics as beauty
 *   draws them, every other mesh writing depth only, no backdrop, with the
 *   scene's fog and image lighting kept.
 *
 * Every pass that swaps a material carries a formation's baked cycle onto the
 * replacement, so a marching crowd marches in `depth`, `normal`, `mask`,
 * `outline` and `albedo` exactly as it does in `beauty`. `pose` is the standing
 * exception: an anonymous member has no bones in the scene for the overlay to
 * draw, which is the same gap it had before the crowd could move at all.
 *
 * An unknown mode is a caller bug and throws. Active or failed scene retirement
 * refuses every mode before setup, including beauty. Failed restoration retains
 * its complete owner callback and cause; nested owned cleanup still runs
 * independently beneath the active boundary.
 *
 * Direct embedders can override depthRange and edgeWidth. The bundled __afPass
 * capture path uses the defaults, keeping the camera-space depth normalization
 * consistent while preserving differences caused by camera pose. Depth beyond
 * the default range clamps to black; changing that range requires a direct
 * call.
 */
export const applyRenderMode: (
  scene: THREE.Scene,
  mode: AutoMovieGuidePass,
  options?: { depthRange?: number; edgeWidth?: number },
) => IAutoMovieRenderModeHandle = (
  scene: THREE.Scene,
  mode: AutoMovieGuidePass,
  options?: {
    /**
     * Metric range (m) the depth pass normalizes onto. Defaults to
     * {@link DEPTH_NORMALIZATION_RANGE} (20). Direct callers only: the capture
     * path keeps the scene-stable default (see above).
     */
    depthRange?: number;

    /**
     * Model-space normal extrusion for the outline pass; defaults to
     * {@link EDGE_WIDTH} (0.02). Object/instance scale changes its world
     * thickness; the capture path keeps the default.
     */
    edgeWidth?: number;
  },
): IAutoMovieRenderModeHandle => {
  guardAutoMovieRenderModeRetirement(scene);
  if (mode === "beauty")
    return { mode, semantic: null, restore: (): void => {} };
  // Resolve (and validate) the structural pass builder BEFORE touching the
  // scene, so an unknown mode throws without leaving anything hidden.
  const build: () => IAutoMovieRenderModeHandle =
    ((): (() => IAutoMovieRenderModeHandle) => {
      switch (mode) {
        case "depth":
          return (): IAutoMovieRenderModeHandle =>
            applyDepthMode(
              scene,
              options?.depthRange ?? DEPTH_NORMALIZATION_RANGE,
            );
        case "normal":
          return (): IAutoMovieRenderModeHandle =>
            overrideAutoMovieRenderModeMaterials(
              scene,
              mode,
              (): THREE.MeshNormalMaterial => new THREE.MeshNormalMaterial(),
            );
        case "outline":
          return (): IAutoMovieRenderModeHandle =>
            applyEdgeMode(scene, options?.edgeWidth ?? EDGE_WIDTH);
        case "mask": {
          const semantic: IAutoMovieSemanticMaskBinding | null =
            autoMovieSemanticMaskOf(scene);
          return semantic === null
            ? (): IAutoMovieRenderModeHandle => applyMaskMode(scene)
            : (): IAutoMovieRenderModeHandle =>
                applySemanticMaskMode(scene, semantic);
        }
        case "pose":
          return (): IAutoMovieRenderModeHandle => applyPoseMode(scene);
        case "graphics":
          return (): IAutoMovieRenderModeHandle =>
            applyAutoMovieGraphicsMode(scene);
        case "albedo":
          return (): IAutoMovieRenderModeHandle =>
            overrideAutoMovieRenderModeMaterials(
              scene,
              mode,
              (
                original: THREE.Material | THREE.Material[],
              ): THREE.Material | THREE.Material[] =>
                Array.isArray(original)
                  ? original.map(createAutoMovieAlbedoMaterial)
                  : createAutoMovieAlbedoMaterial(original),
            );
        default:
          throw new Error(`unknown render mode "${String(mode)}"`);
      }
    })();
  // A structural pass renders only the subject mesh geometry: hide every
  // non-mesh renderable first (#1226), suspend the scene's atmosphere and
  // image lighting, then build the pass (whose own overlay, if any, is added
  // afterward and stays visible). Restore reverses these three suspensions and
  // the pass builder's own resources and background transition.
  const restoreRenderables: () => void = hideNonMeshRenderables(scene);
  // The graphics plate keeps the beauty pass's fog and image lighting and
  // removes the backdrop itself, so it suspends neither.
  const restoreFog: () => void =
    mode === "graphics" ? (): void => {} : suspendFog(scene);
  const restoreEnvironment: () => void =
    mode === "graphics" ? (): void => {} : suspendEnvironment(scene);
  // Surface graphics draw only in beauty and mask: elsewhere the prop's own
  // surface beneath already draws, and a control channel carries no lettering.
  const restoreGraphics: () => void =
    mode === "mask" || mode === "graphics"
      ? (): void => {}
      : hideAutoMovieSurfaceGraphics(scene);
  // A builder that throws returns no handle, so the three suspensions above
  // would have no way back and the scene would keep drawing on black with its
  // atmosphere off for the rest of the session. The semantic mask pass is the
  // first builder that CAN throw (a palette whose design names more staged
  // nodes than the scene holds refuses rather than resolving positionally
  // against the wrong objects), and undoing them here keeps that a refusal
  // instead of a refusal plus a broken scene.
  let handle: IAutoMovieRenderModeHandle;
  try {
    handle = build();
  } catch (error) {
    restoreAutoMovieRenderModeState(
      [restoreGraphics, restoreEnvironment, restoreFog, restoreRenderables],
      { error },
    );
  }
  return {
    mode,
    semantic: handle.semantic,
    ...(handle.update === undefined ? {} : { update: handle.update }),
    restore: restoreAutoMovieRenderModeOnce((): void => {
      guardAutoMovieRenderModeRetirement(scene, {
        run: (): void => {
          restoreAutoMovieRenderModeState([
            handle.restore,
            restoreGraphics,
            restoreEnvironment,
            restoreFog,
            restoreRenderables,
          ]);
        },
      });
    }),
  };
};

/**
 * Take the scene's fog off for the duration of a structural pass, and put it
 * back exactly as it was.
 *
 * A guide pass states a geometric fact, and fog is not one: `three.js` fogs any
 * material whose shader carries the chunks, which is every `MeshBasicMaterial`
 * the mask and outline passes install. Left on, an atmosphere would mix the
 * mask's flat palette color toward the fog color with distance, so a
 * segmentation consumer would read a far node as a different node than the same
 * node near, and the outline pass's black fill would lighten until the white
 * contour stopped being a contour. The depth and edge passes escape only by
 * accident, their `ShaderMaterial`s never include the fog chunks; relying on
 * that accident is how the next pass written in `MeshBasicMaterial` inherits
 * the bug.
 *
 * The beauty pass is deliberately NOT covered: that one IS the film, and it
 * must carry the atmosphere the scene declares.
 */
const suspendFog: (scene: THREE.Scene) => () => void = (
  scene: THREE.Scene,
): (() => void) => {
  const fog: THREE.Fog | THREE.FogExp2 | null = scene.fog;
  scene.fog = null;
  return (): void => {
    scene.fog = fog;
  };
};

/**
 * Remove image lighting and its background while a structural pass renders.
 *
 * Normal materials ignore the environment as a light source but would still
 * render its background. The other structural builders currently install a
 * black background themselves; central suspension makes that invariant belong
 * to the pass boundary instead of to each material implementation.
 */
const suspendEnvironment: (scene: THREE.Scene) => () => void = (
  scene: THREE.Scene,
): (() => void) => {
  const environment: THREE.Texture<unknown, THREE.TextureEventMap> | null =
    scene.environment;
  const background:
    | THREE.Color
    | THREE.Texture<unknown, THREE.TextureEventMap>
    | null = scene.background;
  scene.environment = null;
  scene.background = new THREE.Color(0x000000);
  return (): void => {
    scene.environment = environment;
    scene.background = background;
  };
};
