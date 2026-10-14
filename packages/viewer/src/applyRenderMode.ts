import {restoreAutoMovieRenderModeState} from "./restoreAutoMovieRenderModeState.js";
import * as THREE from "three";
import type {AutoMovieGuidePass} from "@automovie/interface";
import type {IAutoMovieRenderModeHandle} from "./IAutoMovieRenderModeHandle.js";
import {applyDepthMode} from "./applyDepthMode.js";
import {DEPTH_NORMALIZATION_RANGE} from "./DEPTH_NORMALIZATION_RANGE.js";
import {overrideAutoMovieRenderModeMaterials} from "./overrideAutoMovieRenderModeMaterials.js";
import {applyEdgeMode} from "./applyEdgeMode.js";
import {EDGE_WIDTH} from "./EDGE_WIDTH.js";
import {autoMovieSemanticMaskOf, type IAutoMovieSemanticMaskBinding} from "./semanticMask/index.js";
import {applyMaskMode} from "./applyMaskMode.js";
import {applySemanticMaskMode} from "./applySemanticMaskMode.js";
import {applyPoseMode} from "./applyPoseMode.js";
import {restoreAutoMovieRenderModeOnce} from "./restoreAutoMovieRenderModeOnce.js";
import {guardAutoMovieRenderModeRetirement} from "./guardAutoMovieRenderModeRetirement.js";

/** A renderable that is NOT a mesh: a line/grid/helper, points, or a sprite. */
const isNonMeshRenderable: (object: THREE.Object3D) => boolean = (object: THREE.Object3D): boolean =>
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
const hideNonMeshRenderables: (scene: THREE.Scene) => (() => void) = (scene: THREE.Scene): (() => void) => {
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
 * handle. The override is applied at snapshot time and reversed right after, so
 * the viewer stays a thin projection of the engine result:
 *
 * - `beauty`: no override (the ordinary shaded render).
 * - `depth`: meshes use clamp(1-viewZ/range,0,1) with camera-space depth and a shared {@link DEPTH_NORMALIZATION_RANGE}, independent of near/far normalization. Camera changes can change a world point's viewZ; black is the far-range/background convention.
 * - `mask`: the segmentation pass. A scene handed its palette by
 *   {@link attachAutoMovieSemanticMask} is painted by
 *   {@link applyAutoMovieSemanticMask}, so every colour is the one that entity's
 *   own semantic id earned and survives a rebuild in a different order. A scene
 *   handed none keeps the legacy ramp, where each top-level child gets a flat
 *   unlit colour by its index: readable as coverage and silhouette, never as
 *   identity, because inserting one node repaints everything after it.
 * - `normal`: every mesh swapped to `MeshNormalMaterial`: the unlit
 *   surface-normal conditioning pass (#1166).
 * - `outline`: black fills plus inverted-hull back-face shells extruded by {@link EDGE_WIDTH} in model space, leaving white contours on black. Object/instance scaling and camera projection affect world thickness and screen line weight.
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
 * Active or failed scene retirement refuses every mode before setup, including
 * beauty. Failed restoration retains its complete owner callback and cause;
 * nested owned cleanup still runs independently beneath the active boundary.
 *
 * Direct embedders can override depthRange and edgeWidth. The bundled __afPass capture path uses the defaults, keeping the camera-space depth normalization consistent while preserving differences caused by camera pose. Depth beyond the default range clamps to black; changing that range requires a direct call.
 *
 * @author Samchon
 * @evidence contracts/common.md#principled-implementation Selects the requested supported guide projection, excludes existing nonmesh beauty renderables, suspends fog/image lighting and returns a reversible handle; uses attached semantic masks when present and documented positional fallback otherwise. Depth/edge numeric options remain caller premises and anonymous instanced members have no bone graph for the pose overlay.
 * @evidence contracts/common.md#clear-and-simple-design This boundary owns temporary scene atmosphere/helper suspension and mode dispatch; each builder owns its pass resources and the shared restore coordinator attempts independent release without hiding failure.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Resolves an unknown mode before mutation and restores boundary suspensions if its builder throws; default range/width and legacy mask are explicit supported conventions, not fixture branches or substitute foreign methods. Builder-internal partial mutations are not automatically undone by boundary suspension cleanup.
 * @evidence contracts/common.md#meaningful-documentation Explains all six modes, semantic/legacy mask distinction, frame-independent depth default, outline extrusion, pose population gap, caller options and the returned restoration obligation.
 * @evidence contracts/performance.md#efficient-algorithms Structural installation traverses scene helpers plus builder mesh/bone populations; the generic override allocates per mesh, legacy masks/shells share by their declared child/cycle keys, and pose/outline overlays scale with the subject graph. Healthy beauty returns a constant no-op handle.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses the same mode builders for embedded/capture paths and builder-local equivalent materials; independent installs require separate original-state snapshots, so no scene/mode-only cached restoration is shared.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Three boundary callbacks retain helper visibility, fog and environment/background snapshots; builders nest their own background transitions and own pass resources. Failed returned-handle restoration retains the complete boundary callback and cause under the scene guard. Builder throw still independently restores boundary snapshots with its primary error, while partial acquisition depends on that builder's rollback capability.
 */
export const applyRenderMode: (scene: THREE.Scene, mode: AutoMovieGuidePass, options?: { depthRange?: number; edgeWidth?: number; }) => IAutoMovieRenderModeHandle = (
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
     * Model-space normal extrusion for the outline pass; defaults to {@link EDGE_WIDTH} (0.02). Object/instance scale changes its world thickness; the capture path keeps the default.
     */
    edgeWidth?: number;
  },
): IAutoMovieRenderModeHandle => {
  guardAutoMovieRenderModeRetirement(scene);
  if (mode === "beauty") return { mode, semantic: null, restore: (): void => {} };
  // Resolve (and validate) the structural pass builder BEFORE touching the
  // scene, so an unknown mode throws without leaving anything hidden.
  const build: () => IAutoMovieRenderModeHandle = ((): (() => IAutoMovieRenderModeHandle) => {
    switch (mode) {
      case "depth":
        return (): IAutoMovieRenderModeHandle =>
          applyDepthMode(
            scene,
            options?.depthRange ?? DEPTH_NORMALIZATION_RANGE,
          );
      case "normal":
        return (): IAutoMovieRenderModeHandle =>
          overrideAutoMovieRenderModeMaterials(scene, mode, (): THREE.MeshNormalMaterial => new THREE.MeshNormalMaterial());
      case "outline":
        return (): IAutoMovieRenderModeHandle => applyEdgeMode(scene, options?.edgeWidth ?? EDGE_WIDTH);
      case "mask": {
        const semantic: IAutoMovieSemanticMaskBinding | null = autoMovieSemanticMaskOf(scene);
        return semantic === null
          ? (): IAutoMovieRenderModeHandle => applyMaskMode(scene)
          : (): IAutoMovieRenderModeHandle => applySemanticMaskMode(scene, semantic);
      }
      case "pose":
        return (): IAutoMovieRenderModeHandle => applyPoseMode(scene);
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
  const restoreFog: () => void = suspendFog(scene);
  const restoreEnvironment: () => void = suspendEnvironment(scene);
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
    restore: restoreAutoMovieRenderModeOnce((): void => {
      guardAutoMovieRenderModeRetirement(scene, { run: (): void => {
        restoreAutoMovieRenderModeState([handle.restore,restoreEnvironment,restoreFog,restoreRenderables]);
      } });
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
const suspendFog: (scene: THREE.Scene) => (() => void) = (scene: THREE.Scene): (() => void) => {
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
const suspendEnvironment: (scene: THREE.Scene) => (() => void) = (scene: THREE.Scene): (() => void) => {
  const environment: THREE.Texture<unknown, THREE.TextureEventMap> | null = scene.environment;
  const background: THREE.Color | THREE.Texture<unknown, THREE.TextureEventMap> | null = scene.background;
  scene.environment = null;
  scene.background = new THREE.Color(0x000000);
  return (): void => {
    scene.environment = environment;
    scene.background = background;
  };
};
