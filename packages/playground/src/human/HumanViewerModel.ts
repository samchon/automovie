import type { IAutoMovieModelPart } from "@automovie/interface";
import {
  AutoMovieTextureCache,
  type IAutoMovieModelObject,
  buildModel,
  collectAutoMovieOwnedResources,
  createAutoMovieResourceRetirement,
  materialTextureBindings,
} from "@automovie/viewer";
import * as THREE from "three";

import type { IAutoMovieHumanGenerated } from "../../../human/src/structures/IAutoMovieHumanGenerated";
import { HumanCaptureCamera } from "./HumanCaptureCamera";
import type { IHumanViewerPage } from "./IHumanViewerPage";
import { ModelPartStyling } from "./ModelPartStyling";
import { createHumanPartStyle } from "./createHumanPartStyle";
import { normalizeHumanCurves } from "./normalizeHumanCurves";
import type { normalizeHumanView } from "./normalizeHumanView";
import { pickHumanCurves } from "./pickHumanCurves";
import { resolveHumanCurves } from "./resolveHumanCurves";

/** Part id prefix the generator gives every construction part. */
const CONSTRUCTION: string = "human.construction.";

/**
 * One displayed Human result: its built scene graph, pass and curve selection.
 *
 * Parts whose id starts with `human.construction.` are construction (the
 * lofting curves); every other part is surface. The surface bounds frame every
 * camera, so all passes of one camera align pixel for pixel. Pass, selection,
 * isolation and garment/hair/material choices are display state only: each change resolves the selection and
 * re-applies the closure from {@link createHumanPartStyle} through one
 * {@link ModelPartStyling}, which never touches the built originals. The owner
 * adds {@link HumanViewerModel.object} to its scene and must call
 * {@link HumanViewerModel.dispose}.
 *
 * @evidence contracts/common.md#principled-implementation Bounds are the union of surface part boxes after a world-matrix update; display changes restyle from recorded originals, so shown state is a function of model, pass, selection, isolate and garment/hair/material display choices.
 * @evidence contracts/common.md#clear-and-simple-design Owns one built model and its display state; Human display rules are the createHumanPartStyle closure, curve resolution is resolveHumanCurves, and the generic override mechanism is ModelPartStyling.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A model without surface geometry or without construction for a construction pass throws instead of rendering an empty or wrong pass.
 * @evidence contracts/common.md#meaningful-documentation States the part classification, framing basis, display-state model and disposal duty.
 * @evidence contracts/performance.md#efficient-algorithms Building is O(V) in model vertices via buildModel plus one box per surface part; each display change is one ModelPartStyling.apply.
 * @evidence contracts/performance.md#reuse-equivalent-work The built model, bounds and part classification serve every pass, selection and capture of the generation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns the built resources and the styling's derived resources; dispose releases both, and a failed construction releases what was built.
 */
export class HumanViewerModel {
  /** Generator output this model displays. */
  public readonly result: IAutoMovieHumanGenerated;

  /** Root object to add to the scene. */
  public readonly object: THREE.Group;

  /** Whole surface bounds in metres. */
  public readonly bounds: THREE.Box3;

  /** Facts reported to callers of the page's load methods. */
  public readonly loaded: IHumanViewerPage.ILoaded;

  private readonly built: IAutoMovieModelObject;
  private readonly surface: THREE.Object3D[] = [];
  private readonly construction: THREE.Object3D[] = [];
  private readonly close: () => Promise<void>;
  private readonly styling: ModelPartStyling;
  private pass: IHumanViewerPage.Pass = "surface";
  private isolate: boolean = false;
  private display: Pick<
    normalizeHumanView.IView,
    "garment" | "hair" | "material"
  > = {
    garment: true,
    hair: true,
    material: "appearance",
  };
  private current: IHumanViewerPage.ISelection = resolveHumanCurves("", [], []);

  /**
   * Decode the result's carried images, then build and display its model.
   *
   * Texture bindings resolve only against `result.model.images`, the images
   * the generator carries (iris, sclera vessels, hair strands and their alpha
   * masks); a binding naming any other asset is refused, because a Human page
   * has no project asset loader. Priming completes before the synchronous
   * build, so no surface renders untextured while its image decodes. The cache
   * belongs to the returned model and is disposed with it, including when
   * priming or construction fails.
   *
   * @param result Generator output to display.
   * @param alias Registered alias of its parameters, or null.
   * @param modules Module-fit preview it was lofted from, or null.
   * @param milliseconds Generator time, or null for an externally generated result.
   * @param generation Page generation counter assigned to this model.
   * @returns The displayed model, owning its texture cache.
   *
   * @evidence contracts/common.md#principled-implementation Primes AutoMovieTextureCache with every material binding and the model's carried images before buildModel, exactly as buildAutoMovieMaterialLibrary does, and passes cache.resolve as the resolver.
   * @evidence contracts/common.md#clear-and-simple-design The async step lives in this factory so the constructor stays a synchronous build; the page awaits one call per load.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The loader rejects every non-carried asset and a decode failure rejects the load, so no texture is silently dropped.
   * @evidence contracts/common.md#meaningful-documentation States which images are served, why other assets are refused and who owns the cache.
   * @evidence contracts/performance.md#efficient-algorithms Each distinct carried image is decoded once, in parallel, then shared by binding-private clones.
   * @evidence contracts/performance.md#reuse-equivalent-work One cache per generation serves every material, pass, selection and capture of that model.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The cache holds the decoded images of one model; a failed prime or build disposes it, and the model's dispose releases it after the built resources.
   */
  public static async create(
    result: IAutoMovieHumanGenerated,
    alias: string | null,
    modules: string | null,
    milliseconds: number | null,
    generation: number,
  ): Promise<HumanViewerModel> {
    const textures: AutoMovieTextureCache = new AutoMovieTextureCache(
      (asset: string): Promise<THREE.Texture> =>
        Promise.reject(
          new Error(
            "Human model binds texture asset " +
              asset +
              " that it does not carry; project assets are not served",
          ),
        ),
    );
    try {
      await textures.prime(
        result.model.materials.flatMap(materialTextureBindings),
        result.model.images ?? [],
      );
      return new HumanViewerModel(
        result,
        { alias, modules, milliseconds, generation },
        textures,
      );
    } catch (error) {
      await textures.dispose().catch(console.error);
      throw error;
    }
  }

  /**
   * Build a result's model with already primed textures; the built resources are released if construction fails.
   *
   * @param result Generator output to display.
   * @param origin Its alias, preview, generator time and page generation counter, as for {@link create}.
   * @param textures Cache primed with the model's carried images; ownership passes to the model.
   */
  private constructor(
    result: IAutoMovieHumanGenerated,
    origin: {
      alias: string | null;
      modules: string | null;
      milliseconds: number | null;
      generation: number;
    },
    private readonly textures: AutoMovieTextureCache,
  ) {
    this.result = result;
    this.built = buildModel(result.model, textures.resolve);
    this.object = this.built.object;
    this.close = createAutoMovieResourceRetirement(
      collectAutoMovieOwnedResources(this.built.object).map(
        (resource: { dispose(): void }): (() => void) =>
          (): void =>
            resource.dispose(),
      ),
    );
    try {
      this.bounds = new THREE.Box3();
      this.object.updateMatrixWorld(true);
      for (const [id, object] of this.built.parts)
        if (id.startsWith(CONSTRUCTION)) this.construction.push(object);
        else {
          this.surface.push(object);
          this.bounds.union(new THREE.Box3().setFromObject(object));
        }
      if (this.bounds.isEmpty())
        throw new Error("Generated Human model has no surface geometry");
      this.loaded = {
        generation: origin.generation,
        alias: origin.alias,
        modules: origin.modules,
        generateMilliseconds: origin.milliseconds,
        parts: result.model.parts.map(count),
        bounds: {
          min: this.bounds.min.toArray(),
          max: this.bounds.max.toArray(),
        },
        construction: this.construction.length !== 0,
      };
      this.styling = new ModelPartStyling(result.model, this.built);
      this.restyle();
    } catch (error) {
      void this.close().catch(console.error);
      throw error;
    }
  }

  /**
   * Curve ids, the construction part ids without their prefix, in model order.
   *
   * @evidence contracts/common.md#principled-implementation Strips the generator's construction prefix from the built part ids.
   * @evidence contracts/common.md#clear-and-simple-design Feeds the page's curve list and selection resolution from one source.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Lists actual model parts, never a fixed catalogue.
   * @evidence contracts/common.md#meaningful-documentation States the id form and order.
   * @evidence contracts/performance.md#efficient-algorithms O(P) over the model's parts.
   * @evidence contracts/performance.md#reuse-equivalent-work Callers keep the list while the model is displayed.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a new array the caller owns.
   */
  public curveIds(): string[] {
    return this.ids(CONSTRUCTION);
  }

  /**
   * Show the parts of one pass, keeping the current selection.
   *
   * @param pass Pass to show; overlay and construction throw when the model has no construction part.
   * @returns Ids of the parts now visible.
   *
   * @evidence contracts/common.md#principled-implementation Restyles through the pass closure, then reads actual part visibility.
   * @evidence contracts/common.md#clear-and-simple-design Pass and selection share one restyle path.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Throws instead of silently showing the surface when no construction exists.
   * @evidence contracts/common.md#meaningful-documentation States the failure and the returned visibility.
   * @evidence contracts/performance.md#efficient-algorithms One ModelPartStyling.apply plus an O(P) visibility scan.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the resolved selection; only display state changes.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The styling releases the previous pass's derived resources.
   */
  public setPass(pass: IHumanViewerPage.Pass): string[] {
    if (pass !== "surface" && this.construction.length === 0)
      throw new Error(
        "Human model has no construction part (id prefix human.construction.); the " +
          pass +
          " pass is unavailable",
      );
    this.pass = pass;
    this.restyle();
    return [...this.built.parts.entries()]
      .filter(([, object]: [string, THREE.Object3D]): boolean => object.visible)
      .map(([id]: [string, THREE.Object3D]): string => id);
  }

  /**
   * Replace the curve selection; a malformed or unmatched pattern throws and keeps the old one.
   *
   * @param value Raw or canonical `curves` value; empty clears the selection.
   * @returns The canonical value, the selected curve ids and the skin intervals they shape.
   *
   * @evidence contracts/common.md#principled-implementation Normalizes, resolves against this model's ids and only then commits and restyles, so a failure leaves the previous selection displayed.
   * @evidence contracts/common.md#clear-and-simple-design Grammar, resolution and styling stay in their own functions.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unmatched patterns throw rather than rendering an unselected frame.
   * @evidence contracts/common.md#meaningful-documentation States the failure behaviour and the returned facts.
   * @evidence contracts/performance.md#efficient-algorithms One resolution over the model ids and one ModelPartStyling.apply.
   * @evidence contracts/performance.md#reuse-equivalent-work The resolved selection is kept for later pass changes and snapshots.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Retains only the latest resolved id lists.
   */
  public setCurves(value: string | null): IHumanViewerPage.ISelection {
    this.current = resolveHumanCurves(
      normalizeHumanCurves(value),
      this.curveIds(),
      this.ids("human.skin."),
    );
    this.restyle();
    return this.selection();
  }

  /**
   * Current canonical selection with its resolved curve and skin ids.
   *
   * @evidence contracts/common.md#principled-implementation Returns the last committed resolution.
   * @evidence contracts/common.md#clear-and-simple-design Read-only view for snapshots and capture metadata.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Copies the arrays so callers cannot alter the displayed state.
   * @evidence contracts/common.md#meaningful-documentation States what the record holds.
   * @evidence contracts/performance.md#efficient-algorithms O(n) copies of the id lists.
   * @evidence contracts/performance.md#reuse-equivalent-work No recomputation; the stored resolution is reused.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns caller-owned copies.
   */
  public selection(): IHumanViewerPage.ISelection {
    return {
      curves: this.current.curves,
      selected: [...this.current.selected],
      colours: [...this.current.colours],
      shaped: [...this.current.shaped],
      shapedColours: [...this.current.shapedColours],
    };
  }

  /**
   * Find the curves a click at a normalized device coordinate toggles (see {@link pickHumanCurves}).
   *
   * @param camera Camera the coordinate belongs to.
   * @param pointer Pointer position in normalized device coordinates.
   * @param pixel Size of one pixel in normalized device units, per axis.
   * @returns The curve under or near the pointer, or in `overlay` the curves shaping the skin interval under it; null in the surface pass or when nothing is near.
   *
   * @evidence contracts/common.md#principled-implementation Passes this model's built parts and displayed pass to pickHumanCurves, which raycasts what is drawn.
   * @evidence contracts/common.md#clear-and-simple-design Picking is asked of the model that knows its parts; the rule lives in pickHumanCurves and the page only converts pointer coordinates.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Returns only ids the model has; a miss returns null.
   * @evidence contracts/common.md#meaningful-documentation States both results and the null cases.
   * @evidence contracts/performance.md#efficient-algorithms At most 26 rays over the built parts.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the built part map.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing after the call.
   */
  public pick(
    camera: THREE.Camera,
    pointer: THREE.Vector2,
    pixel: THREE.Vector2,
  ): string[] | null {
    return pickHumanCurves(this.built.parts, this.pass, camera, pointer, pixel);
  }

  /**
   * Remove the model from its parent and release the styling, built resources and texture cache.
   *
   * @evidence contracts/common.md#principled-implementation Restores originals before the built resources are retired, so nothing references a disposed derived resource.
   * @evidence contracts/common.md#clear-and-simple-design The single retirement path of a displayed generation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Retirement failures propagate from the built-resource retirement.
   * @evidence contracts/common.md#meaningful-documentation States the release order, texture cache last because the built subtree only borrows its wrappers.
   * @evidence contracts/performance.md#efficient-algorithms Linear in owned resources.
   * @evidence contracts/performance.md#reuse-equivalent-work Nothing survives; the next load builds anew.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Detaches the object and releases derived and built resources, then the texture cache even when the built retirement fails.
   */
  public async dispose(): Promise<void> {
    this.styling.dispose();
    this.object.removeFromParent();
    try {
      await this.close();
    } finally {
      // Texture wrappers belong to the cache, not to the built subtree.
      await this.textures.dispose();
    }
  }

  /**
   * Resolve a camera name against this model, including the part-based close-ups.
   *
   * @param name One of `HumanCaptureCamera.names`.
   * @param view Free-view overrides; `fit=selection` frames the selected curves and, outside the construction pass, the skin they shape.
   * @returns The camera's direction and region; unknown names and missing close-up parts throw.
   *
   * @evidence contracts/common.md#principled-implementation Supplies HumanCaptureCamera.describe with the whole surface bounds and a bounds-by-prefix query over the built surface parts in world space.
   * @evidence contracts/common.md#clear-and-simple-design The camera rules stay in HumanCaptureCamera; the model only answers which of its parts match.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Construction parts never enter a close-up region, and an empty match is reported to the caller rather than replaced.
   * @evidence contracts/common.md#meaningful-documentation States the failure cases.
   * @evidence contracts/performance.md#efficient-algorithms Whole and row cameras are constant work; a close-up scans the parts once per prefix set and boxes the matching ones in O(V) of their vertices.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the built parts and the stored surface bounds.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a new descriptor; retains nothing.
   */
  public describe(
    name: string,
    view?: normalizeHumanView.IView,
  ): HumanCaptureCamera.IDescriptor {
    const named: HumanCaptureCamera.IDescriptor = HumanCaptureCamera.describe(
      name,
      this.bounds,
      (prefixes: readonly string[]): THREE.Box3 =>
        this.box(
          (id: string): boolean =>
            !id.startsWith(CONSTRUCTION) &&
            prefixes.some((prefix: string): boolean => id.startsWith(prefix)),
        ),
    );
    if (view === undefined) return named;

    // fit=selection frames the selected curves and, unless only curves are
    // shown, the skin intervals they shape.
    const curves: Set<string> = new Set(this.current.selected);
    const skin: Set<string> = new Set(
      this.pass === "construction" ? [] : this.current.shaped,
    );
    return HumanCaptureCamera.override(
      named,
      view,
      this.box(
        (id: string): boolean =>
          (id.startsWith(CONSTRUCTION) &&
            curves.has(id.slice(CONSTRUCTION.length))) ||
          (id.startsWith("human.skin.") &&
            skin.has(id.slice("human.skin.".length))),
      ),
    );
  }

  /**
   * Show only the selection and the skin it shapes, or everything again.
   *
   * @param isolate Whether to isolate the current curve selection.
   *
   * @evidence contracts/common.md#principled-implementation Restyles through the Human closure with the isolation flag; part data is untouched.
   * @evidence contracts/common.md#clear-and-simple-design Same restyle path as pass and selection.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Isolating an empty selection throws instead of showing an empty frame.
   * @evidence contracts/common.md#meaningful-documentation States the failure.
   * @evidence contracts/performance.md#efficient-algorithms One ModelPartStyling.apply.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the resolved selection.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The styling releases the previous derived resources.
   */
  public setIsolate(isolate: boolean): void {
    if (isolate && this.current.selected.length === 0)
      throw new Error("Human isolate=1 needs a non-empty curves selection");
    this.isolate = isolate;
    this.restyle();
  }

  /**
   * Apply garment and hair visibility and the skin material inspection mode.
   *
   * @param display Parsed view; only garment, hair and material are retained.
   *
   * @evidence contracts/common.md#principled-implementation Restyles through the Human closure using the three inspection fields; generated part data, normals and bounds remain unchanged.
   * @evidence contracts/common.md#clear-and-simple-design Same restyle path as pass, selection and isolation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Visibility uses generated part prefixes and clay is a display material; neither changes skin vertices or framing.
   * @evidence contracts/common.md#meaningful-documentation States what is hidden and that framing is unchanged.
   * @evidence contracts/performance.md#efficient-algorithms One ModelPartStyling.apply.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the built parts and the resolved selection.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The styling releases the previous derived resources.
   */
  public setDisplay(display: normalizeHumanView.IView): void {
    this.display = {
      garment: display.garment,
      hair: display.hair,
      material: display.material,
    };
    this.restyle();
  }

  /** Union of the world bounds of the parts whose id passes the filter. */
  private box(filter: (id: string) => boolean): THREE.Box3 {
    const box: THREE.Box3 = new THREE.Box3();
    for (const [id, object] of this.built.parts)
      if (filter(id)) box.union(new THREE.Box3().setFromObject(object));
    return box;
  }

  /** Re-apply the Human styling for the current pass and selection. */
  private restyle(): void {
    this.styling.apply(
      createHumanPartStyle(
        this.pass,
        this.current,
        this.bounds.max.y - this.bounds.min.y,
        this.isolate,
        this.display,
      ),
    );
  }

  /** Part ids with one prefix, the prefix removed, in model order. */
  private ids(prefix: string): string[] {
    return [...this.built.parts.keys()]
      .filter((id: string): boolean => id.startsWith(prefix))
      .map((id: string): string => id.slice(prefix.length));
  }
}

/** Mesh vertex and triangle counts of one part; other geometry counts zero. */
function count(
  part: IAutoMovieModelPart,
): IHumanViewerPage.ILoaded["parts"][0] {
  if (part.geometry.type !== "mesh")
    return { id: part.id, vertices: 0, triangles: 0 };
  const vertices: number = part.geometry.mesh.positions.length / 3;
  return {
    id: part.id,
    vertices,
    triangles: (part.geometry.mesh.indices?.length ?? vertices) / 3,
  };
}
