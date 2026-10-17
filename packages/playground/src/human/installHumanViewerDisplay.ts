import { HUMANOID_JOINT_AXES, HUMANOID_REST_FRAME } from "@automovie/engine";
import { IAutoMovieHumanConstructionNet } from "@automovie/human";
import { AutoMovieTextureBinding } from "@automovie/interface";
import {
  AutoMovieTextureCache,
  applyExpression,
  applyPose,
  buildModel,
  materialTextureBindings,
} from "@automovie/viewer";
import * as THREE from "three";

import type { HumanViewerPage } from "./HumanViewerPage";
import { IHumanViewerTextureState } from "./IHumanViewerTextureState";
import { drawHumanViewerConstruction } from "./drawHumanViewerConstruction";
import { humanViewerPartIds } from "./humanViewerPartIds";
import { observeHumanViewerTextures } from "./observeHumanViewerTextures";
import { setHumanViewerRelief } from "./setHumanViewerRelief";

/** Accepted documents and their reusable Human instance. */
type IAccepted = HumanViewerPage.IAccepted;

/** Install model display, texture completion, and construction lifetime operations.
 *
 * @evidence contracts/common.md#principled-implementation The same accepted model is posed, expressed and drawn, with stale asynchronous texture completion rejected by accepted-object identity.
 * @evidence contracts/common.md#clear-and-simple-design Model replacement, construction overlays and texture-cache lifetime share this scene owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the admitted public documents and the same live page instances; no fixture or capture-only geometry is substituted.
 * @evidence contracts/common.md#meaningful-documentation Describes the module's page responsibility and ownership boundary.
 * @evidence contracts/performance.md#efficient-algorithms Model build and construction drawing scale with the current model or net size; the existing Human cache remains authoritative.
 * @evidence contracts/performance.md#reuse-equivalent-work Session identity controls Human reuse; edits and captures use the current accepted state rather than a second model.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Removed model and construction trees release owned geometry/materials; texture caches and retained display materials have separate owners.
 */
export function installHumanViewerDisplay(page: HumanViewerPage): void {
  let issued: WeakMap<THREE.Texture, AutoMovieTextureBinding> = new WeakMap();
  page.observeTextures = (): IHumanViewerTextureState => {
    const current: IHumanViewerTextureState = structuredClone(
      page.textureState,
    );
    if (page.closed) return { ...current, status: "closed", materials: [] };
    if (current.status === "ready")
      current.materials = observeHumanViewerTextures({
        object: page.object,
        issued,
      });
    return current;
  };
  /**
   * Display an accepted person and rebuild the controls from its documents.
   *
   * The model is shown at once with flat materials, and again with its textures once the images it carries are decoded, which is asynchronous; a newer person displayed meanwhile wins and the older textures are released.
   */
  function show(accepted: IAccepted): void {
    issued = new WeakMap();
    page.textureState = {
      generation: page.textureState.generation + 1,
      status: "pending",
      declaredOccurrences: accepted.model.materials.flatMap(
        materialTextureBindings,
      ).length,
      resolvedOccurrences: 0,
      error: null,
      materials: [],
    };
    try {
      page.display(accepted, undefined);
      page.mountCurveInspection();
      page.renderPanels();
    } catch (cause) {
      page.textureState = {
        ...page.textureState,
        status: "failed",
        error: cause instanceof Error ? cause.message : String(cause),
      };
      throw cause;
    }
    const previous: AutoMovieTextureCache | null = page.textures;
    page.textures = null;
    void previous?.dispose().catch(page.error);
    page.textured = page.texture(accepted);
    // Reporting observes the rejection without converting capture readiness to
    // success. An older person's failure must not overwrite a newer display.
    void page.textured.catch((cause: unknown): void => {
      if (!page.closed && page.current === accepted) {
        page.textureState = {
          ...page.textureState,
          status: "failed",
          materials: [],
          error: cause instanceof Error ? cause.message : String(cause),
        };
        page.error(cause);
      }
    });
  }
  page.show = show;

  /** Decode the images the person's materials sample and display it with them, unless another person replaced it meanwhile. */
  async function texture(accepted: IAccepted): Promise<void> {
    const bindings: ReturnType<typeof materialTextureBindings> =
      accepted.model.materials.flatMap(materialTextureBindings);
    if (bindings.length === 0) {
      if (!page.closed && page.current === accepted)
        page.textureState = {
          ...page.textureState,
          status: "ready",
          materials: observeHumanViewerTextures({
            object: page.object,
            issued,
          }),
        };
      return;
    }
    const cache: AutoMovieTextureCache = new AutoMovieTextureCache(
      (asset: string): Promise<THREE.Texture> =>
        Promise.reject(
          new Error(`The Human page carries no texture asset "${asset}".`),
        ),
    );
    let retiring: boolean = false;
    try {
      await cache.prime(bindings, accepted.model.images ?? []);
      if (page.closed || page.current !== accepted) {
        retiring = true;
        await cache.dispose();
        return;
      }
      const currentIssued: WeakMap<THREE.Texture, AutoMovieTextureBinding> =
        new WeakMap();
      let occurrences: number = 0;
      page.display(
        accepted,
        (binding: AutoMovieTextureBinding): THREE.Texture => {
          const texture: THREE.Texture = cache.resolve(binding);
          currentIssued.set(texture, binding);
          ++occurrences;
          page.textureState.resolvedOccurrences = occurrences;
          return texture;
        },
      );
      const materials: IHumanViewerTextureState["materials"] =
        observeHumanViewerTextures({
          object: page.object,
          issued: currentIssued,
        });
      const previous: AutoMovieTextureCache | null = page.textures;
      page.textures = cache;
      issued = currentIssued;
      page.textureState = {
        ...page.textureState,
        status: "ready",
        resolvedOccurrences: occurrences,
        error: null,
        materials,
      };
      void previous?.dispose().catch(page.error);
    } catch (cause) {
      if (retiring) throw cause;
      try {
        await cache.dispose();
      } catch (cleanup) {
        throw new AggregateError(
          [cause, cleanup],
          "Human texture completion and disposal failed",
        );
      }
      throw cause;
    }
  }
  page.texture = texture;

  /** Toggle the actual surface materials even while construction/net mode substitutes another material. */
  function applyRelief(): void {
    page.object?.object.traverse((node: THREE.Object3D): void => {
      const mesh: THREE.Mesh = node as THREE.Mesh;
      if (mesh.isMesh !== true) return;
      const surface: THREE.Material | THREE.Material[] = (mesh.userData
        .surfaceMaterial ?? mesh.material) as THREE.Material | THREE.Material[];
      for (const material of Array.isArray(surface) ? surface : [surface]) {
        const standard: THREE.MeshStandardMaterial =
          material as THREE.MeshStandardMaterial;
        if (standard.normalMap === undefined || standard.normalMap === null)
          continue;
        setHumanViewerRelief(standard, page.relief);
      }
    });
  }
  page.applyRelief = applyRelief;

  /** Draw the shown person in the current display mode. */
  function applyDisplayMode(): void {
    if (page.construction !== null) {
      page.scene.remove(page.construction);
      page.disposeObject(page.construction);
      page.construction = null;
    }
    if (page.object === null) return;
    const designOnly: boolean = page.curveDisplay?.surface === "hidden";
    page.object.object.traverse((node: THREE.Object3D): void => {
      const mesh: THREE.Mesh = node as THREE.Mesh;
      if (mesh.isMesh !== true) return;
      mesh.userData.surfaceMaterial ??= mesh.material;
      mesh.material =
        designOnly || page.displayMode === "construction"
          ? page.CONSTRUCTION_ONLY
          : page.displayMode === "net"
            ? page.GHOST
            : (mesh.userData.surfaceMaterial as THREE.Material);
    });
    // Surface means the independently generated skin alone. When that surface
    // is explicitly hidden, the selected design remains the only visible asset.
    if (page.displayMode === "surface" && !designOnly) return;
    const selectedNets: IAutoMovieHumanConstructionNet[] =
      page.curveDisplay?.nets ?? (page.nets ??= page.current.human.inspect());
    page.construction = drawHumanViewerConstruction({
      nets: selectedNets.filter(
        (net: IAutoMovieHumanConstructionNet): boolean =>
          !page.hidden.has(humanViewerPartIds.construction(net)),
      ),
      occluded: page.displayMode === "overlay",
      showControls: page.curveDisplay?.metadata.showControlPoints !== false,
    });
    page.scene.add(page.construction);
  }
  page.applyDisplayMode = applyDisplayMode;

  /** Put the person's model in the scene, posed and expressed, replacing the one shown. */
  function display(
    accepted: IAccepted,
    resolveTexture: AutoMovieTextureCache["resolve"] | undefined,
  ): void {
    page.current = accepted;
    if (page.object !== null) {
      page.scene.remove(page.object.object);
      page.disposeObject(page.object.object);
    }
    if (page.bonesHelper !== null) {
      page.scene.remove(page.bonesHelper);
      page.bonesHelper.dispose();
      page.bonesHelper = null;
    }
    page.object = buildModel(accepted.model, resolveTexture);
    page.scene.add(page.object.object);
    applyPose(
      page.object,
      accepted.pose,
      accepted.skeleton,
      HUMANOID_JOINT_AXES,
      HUMANOID_REST_FRAME,
    );
    applyExpression(page.object, accepted.expression);
    page.object.object.updateMatrixWorld(true);
    if (page.showBones) {
      page.bonesHelper = new THREE.SkeletonHelper(page.object.object);
      page.scene.add(page.bonesHelper);
    }
    page.applyVisibility();
    page.nets = null;
    page.applyDisplayMode();
    page.applyRelief();
    page.error(null);
  }
  page.display = display;

  /** applyVisibility updates the page through its owning module. */
  function applyVisibility(): void {
    if (page.object === null) return;
    const parts: Array<{
      id: string;
      material: string | null;
    }> = page.current.model.parts;
    const skinned: boolean = parts.some(
      (p: { id: string; material: string | null }): boolean =>
        p.material === "skin",
    );
    const stick: Set<string> = new Set(
      parts
        .filter(
          (p: { id: string; material: string | null }): boolean =>
            p.material?.startsWith("stick.") === true,
        )
        .map((p: { id: string; material: string | null }): string => p.id),
    );
    for (const [id, part] of page.object.parts)
      part.visible =
        !page.hidden.has(id) && (page.showStick || !skinned || !stick.has(id));
    if (page.construction !== null) page.applyDisplayMode();
  }
  page.applyVisibility = applyVisibility;
}
