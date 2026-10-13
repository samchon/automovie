import {restoreAutoMovieRenderModeState} from "./restoreAutoMovieRenderModeState.js";
import * as THREE from "three";
import type {AutoMovieGuidePass} from "@automovie/interface";
import type {IAutoMovieRenderModeHandle} from "./IAutoMovieRenderModeHandle.js";
import {applyDepthMode} from "./applyDepthMode.js";
import {DEPTH_NORMALIZATION_RANGE} from "./DEPTH_NORMALIZATION_RANGE.js";
import {overrideAutoMovieRenderModeMaterials} from "./overrideAutoMovieRenderModeMaterials.js";
import {applyEdgeMode} from "./applyEdgeMode.js";
import {EDGE_WIDTH} from "./EDGE_WIDTH.js";
import {autoMovieSemanticMaskOf} from "./semanticMask/index.js";
import {applyMaskMode} from "./applyMaskMode.js";
import {applySemanticMaskMode} from "./applySemanticMaskMode.js";
import {applyPoseMode} from "./applyPoseMode.js";
import {restoreAutoMovieRenderModeOnce} from "./restoreAutoMovieRenderModeOnce.js";

/** A renderable that is NOT a mesh: a line/grid/helper, points, or a sprite. */
const isNonMeshRenderable = (object: THREE.Object3D): boolean =>
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
const hideNonMeshRenderables = (scene: THREE.Scene): (() => void) => {
  const hidden: THREE.Object3D[] = [];
  scene.traverse((object) => {
    if (isNonMeshRenderable(object) && object.visible) {
      object.visible = false;
      hidden.push(object);
    }
  });
  return () => {
    for (const object of hidden) object.visible = true;
  };
};

/**
 * Apply one diffusion-guide render mode to a built scene, returning the restore
 * handle. The override is applied at snapshot time and reversed right after, so
 * the viewer stays a thin projection of the engine result:
 *
 * - `beauty`: no override (the ordinary shaded render).
 * - `depth`: every mesh swapped to a normalized-metric depth shader (#1167):
 *   grays linear in camera-space distance over a scene-stable range
 *   ({@link DEPTH_NORMALIZATION_RANGE}, overridable) instead of the camera's
 *   near/far clip planes, so the same world depth reads the same gray across
 *   shots, cuts, and chunks; black background = infinitely far.
 * - `mask`: the segmentation pass. A scene handed its palette by
 *   {@link attachAutoMovieSemanticMask} is painted by
 *   {@link applyAutoMovieSemanticMask}, so every colour is the one that entity's
 *   own semantic id earned and survives a rebuild in a different order. A scene
 *   handed none keeps the legacy ramp, where each top-level child gets a flat
 *   unlit colour by its index: readable as coverage and silhouette, never as
 *   identity, because inserting one node repaints everything after it.
 * - `normal`: every mesh swapped to `MeshNormalMaterial`: the unlit
 *   surface-normal conditioning pass (#1166).
 * - `outline`: REAL silhouette edges (#1166): black fills plus inverted-hull
 *   back-face shells offset {@link EDGE_WIDTH} meters along their normals,
 *   leaving white contour lines on a black background, no host
 *   post-processing.
 * - `pose`: meshes hidden, and a line-segment overlay of every bone→child bone
 *   connection drawn over a black background: the skeleton pose pass.
 *
 * Every pass that swaps a material carries a formation's baked cycle onto the
 * replacement, so a marching crowd marches in `depth`, `normal`, `mask` and
 * `outline` exactly as it does in `beauty`. `pose` is the standing exception:
 * an anonymous member has no bones in the scene for the overlay to draw, which
 * is the same gap it had before the crowd could move at all.
 *
 * An unknown mode is a caller bug and throws.
 *
 * `options` (`depthRange`, `edgeWidth`) is an escape hatch for a direct
 * embedder tuning the passes to an unusual scene. The bundled capture path
 * (`__afPass`) deliberately omits it: a screenshot pass reads the same world
 * depth as the same gray only when the normalization range is a scene-stable
 * constant, so the capture side is fixed to the defaults on purpose (#1167). A
 * scene whose depth of interest exceeds {@link DEPTH_NORMALIZATION_RANGE} would
 * clamp to black past that range in the bundled capture. Override via a direct
 * call, not the hook.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-beauty-structural-distinction Keeps this surface explicit about beauty versus structural output.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Implements that distinction as a reversible render-product pass.
 * @author Samchon
 */
export const applyRenderMode = (
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
     * Silhouette edge width (m) of the outline pass. Defaults to
     * {@link EDGE_WIDTH} (0.02). Direct callers only: the capture path keeps the
     * default.
     */
    edgeWidth?: number;
  },
): IAutoMovieRenderModeHandle => {
  if (mode === "beauty") return { mode, semantic: null, restore: () => {} };
  // Resolve (and validate) the structural pass builder BEFORE touching the
  // scene, so an unknown mode throws without leaving anything hidden.
  const build = ((): (() => IAutoMovieRenderModeHandle) => {
    switch (mode) {
      case "depth":
        return () =>
          applyDepthMode(
            scene,
            options?.depthRange ?? DEPTH_NORMALIZATION_RANGE,
          );
      case "normal":
        return () =>
          overrideAutoMovieRenderModeMaterials(scene, mode, () => new THREE.MeshNormalMaterial());
      case "outline":
        return () => applyEdgeMode(scene, options?.edgeWidth ?? EDGE_WIDTH);
      case "mask": {
        const semantic = autoMovieSemanticMaskOf(scene);
        return semantic === null
          ? () => applyMaskMode(scene)
          : () => applySemanticMaskMode(scene, semantic);
      }
      case "pose":
        return () => applyPoseMode(scene);
      default:
        throw new Error(`unknown render mode "${String(mode)}"`);
    }
  })();
  // A structural pass renders only the subject mesh geometry: hide every
  // non-mesh renderable first (#1226), suspend the scene's atmosphere and
  // image lighting, then build the pass (whose own overlay, if any, is added
  // afterward and stays visible). Restore reverses all four.
  const restoreRenderables = hideNonMeshRenderables(scene);
  const restoreFog = suspendFog(scene);
  const restoreEnvironment = suspendEnvironment(scene);
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
    restoreAutoMovieRenderModeState([restoreEnvironment,restoreFog,restoreRenderables],{error});
  }
  return {
    mode,
    semantic: handle.semantic,
    restore: restoreAutoMovieRenderModeOnce(() => {
      restoreAutoMovieRenderModeState([handle.restore,restoreEnvironment,restoreFog,restoreRenderables]);
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
const suspendFog = (scene: THREE.Scene): (() => void) => {
  const fog = scene.fog;
  scene.fog = null;
  return () => {
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
const suspendEnvironment = (scene: THREE.Scene): (() => void) => {
  const environment = scene.environment;
  const background = scene.background;
  scene.environment = null;
  scene.background = new THREE.Color(0x000000);
  return () => {
    scene.environment = environment;
    scene.background = background;
  };
};
