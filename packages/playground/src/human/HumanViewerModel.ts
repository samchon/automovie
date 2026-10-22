import type { IAutoMovieMaterial, IAutoMovieModelPart } from "@automovie/interface";
import {
  type IAutoMovieModelObject,
  buildModel,
  collectAutoMovieOwnedResources,
  createAutoMovieResourceRetirement,
} from "@automovie/viewer";
import * as THREE from "three";

import type { IAutoMovieHumanGenerated } from "../../../human/src/structures/IAutoMovieHumanGenerated";
import { HumanCaptureCamera } from "./HumanCaptureCamera";
import type { IHumanViewerPage } from "./IHumanViewerPage";
import { ModelPartStyling } from "./ModelPartStyling";
import { createHumanPartStyle } from "./createHumanPartStyle";
import { normalizeHumanCurves } from "./normalizeHumanCurves";
import { resolveHumanCurves } from "./resolveHumanCurves";

/** Part id prefix the generator gives every construction part. */
const CONSTRUCTION: string = "human.construction.";

/**
 * One displayed Human result: its built scene graph, pass and curve selection.
 *
 * Parts whose id starts with `human.construction.` are construction (the
 * lofting curves); every other part is surface. The surface bounds frame every
 * camera, so all passes of one camera align pixel for pixel. Pass and
 * selection are display state only: each change resolves the selection and
 * re-applies the closure from {@link createHumanPartStyle} through one
 * {@link ModelPartStyling}, which never touches the built originals. The owner
 * adds {@link HumanViewerModel.object} to its scene and must call
 * {@link HumanViewerModel.dispose}.
 *
 * @evidence contracts/common.md#principled-implementation Bounds are the union of surface part boxes after a world-matrix update; display changes always restyle from the recorded originals, so the shown state is a function of (model, pass, selection).
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
  private current: IHumanViewerPage.ISelection = {
    curves: "",
    selected: [],
    shaped: [],
  };

  /**
   * Build a result's model; the built resources are released if construction fails.
   *
   * @param result Generator output to display.
   * @param alias Registered alias of its parameters, or null.
   * @param milliseconds Generator time, or null for an externally generated result.
   * @param generation Page generation counter assigned to this model.
   */
  public constructor(
    result: IAutoMovieHumanGenerated,
    alias: string | null,
    milliseconds: number | null,
    generation: number,
  ) {
    this.result = result;
    this.built = buildModel(result.model);
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
        generation,
        alias,
        generateMilliseconds: milliseconds,
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
      shaped: [...this.current.shaped],
    };
  }

  /**
   * CSS colours of the legend: axis and section from the model's materials, selected from the page.
   *
   * @evidence contracts/common.md#principled-implementation Converts the linear material colours of the first axis and section parts to sRGB CSS strings, the colours the unlit curves display.
   * @evidence contracts/common.md#clear-and-simple-design The legend reads the model instead of repeating generator colours in the page.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A role without a part reports null instead of a guessed colour.
   * @evidence contracts/common.md#meaningful-documentation States where each colour comes from.
   * @evidence contracts/performance.md#efficient-algorithms O(P) search over parts and materials.
   * @evidence contracts/performance.md#reuse-equivalent-work The page calls it once per load.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing.
   */
  public legend(): { axis: string | null; section: string | null; selected: string } {
    const css: (part: IAutoMovieModelPart | undefined) => string | null = (
      part: IAutoMovieModelPart | undefined,
    ): string | null => {
      const material: IAutoMovieMaterial | undefined =
        this.result.model.materials.find(
          (candidate: IAutoMovieMaterial): boolean => candidate.id === part?.material,
        );
      if (material === undefined) return null;
      const colour: THREE.Color = new THREE.Color().setRGB(
        material.baseColor.r,
        material.baseColor.g,
        material.baseColor.b,
      );
      return colour.getStyle();
    };
    const curves: IAutoMovieModelPart[] = this.result.model.parts.filter(
      (part: IAutoMovieModelPart): boolean => part.id.startsWith(CONSTRUCTION),
    );
    const highlight: { r: number; g: number; b: number } =
      createHumanPartStyle.highlight;
    return {
      axis: css(curves.find((part: IAutoMovieModelPart): boolean => part.id.endsWith("/axis"))),
      section: css(curves.find((part: IAutoMovieModelPart): boolean => !part.id.endsWith("/axis"))),
      selected: new THREE.Color()
        .setRGB(highlight.r, highlight.g, highlight.b)
        .getStyle(),
    };
  }

  /**
   * Find the construction curve under or near a normalized device coordinate.
   *
   * Tubes are a few pixels wide, so rays are cast at offsets of up to six
   * pixels in rings of growing radius and the first ring with a hit wins. In
   * `overlay` a section counts only when it is not behind the skin (within one
   * centimetre of the first skin hit); axes, drawn through the skin, always count.
   *
   * @param camera Camera the coordinate belongs to.
   * @param pointer Pointer position in normalized device coordinates.
   * @param pixel Size of one pixel in normalized device units, per axis.
   * @returns The curve id, or null in the surface pass or when nothing is near.
   *
   * @evidence contracts/common.md#principled-implementation Raycasts the displayed (possibly thickened) curve meshes and applies the same see-through rule the styling uses, so a click picks what is drawn there.
   * @evidence contracts/common.md#clear-and-simple-design Picking lives with the model that knows its parts; the page only converts pointer coordinates.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No curve id is guessed; a miss returns null.
   * @evidence contracts/common.md#meaningful-documentation States the tolerance rings and the occlusion rule.
   * @evidence contracts/performance.md#efficient-algorithms At most 25 rays, each testing bounding spheres before triangles of the construction and, in overlay, the surface parts.
   * @evidence contracts/performance.md#reuse-equivalent-work One raycaster and one owner map serve every ray of the click.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing after the call.
   */
  public pick(
    camera: THREE.Camera,
    pointer: THREE.Vector2,
    pixel: THREE.Vector2,
  ): string | null {
    if (this.pass === "surface") return null;
    const owners: Map<THREE.Object3D, string> = new Map();
    for (const [id, object] of this.built.parts)
      if (id.startsWith(CONSTRUCTION))
        object.traverse((node: THREE.Object3D): void => {
          owners.set(node, id.slice(CONSTRUCTION.length));
        });

    const ray: THREE.Raycaster = new THREE.Raycaster();
    for (let radius: number = 0; radius <= 6; radius += 2)
      for (let step: number = 0; step < (radius === 0 ? 1 : 8); ++step) {
        const angle: number = (step / 8) * Math.PI * 2;
        ray.setFromCamera(
          new THREE.Vector2(
            pointer.x + Math.cos(angle) * radius * pixel.x,
            pointer.y + Math.sin(angle) * radius * pixel.y,
          ),
          camera,
        );
        const skin: number =
          this.pass === "overlay"
            ? (ray.intersectObjects(this.surface, true)[0]?.distance ?? Infinity)
            : Infinity;
        const hit: THREE.Intersection | undefined = ray
          .intersectObjects(this.construction, true)
          .find(
            (candidate: THREE.Intersection): boolean =>
              candidate.distance < skin + 0.01 ||
              owners.get(candidate.object)?.endsWith("/axis") === true,
          );
        if (hit !== undefined) return owners.get(hit.object) ?? null;
      }
    return null;
  }

  /**
   * Remove the model from its parent and release the styling and built resources.
   *
   * @evidence contracts/common.md#principled-implementation Restores originals before the built resources are retired, so nothing references a disposed derived resource.
   * @evidence contracts/common.md#clear-and-simple-design The single retirement path of a displayed generation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Retirement failures propagate from the built-resource retirement.
   * @evidence contracts/common.md#meaningful-documentation States the release order.
   * @evidence contracts/performance.md#efficient-algorithms Linear in owned resources.
   * @evidence contracts/performance.md#reuse-equivalent-work Nothing survives; the next load builds anew.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Detaches the object and releases derived and built resources.
   */
  public async dispose(): Promise<void> {
    this.styling.dispose();
    this.object.removeFromParent();
    await this.close();
  }

  /**
   * Resolve a camera name against this model, including the part-based close-ups.
   *
   * @param name One of `HumanCaptureCamera.names`.
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
  public describe(name: string): HumanCaptureCamera.IDescriptor {
    return HumanCaptureCamera.describe(
      name,
      this.bounds,
      (prefixes: readonly string[]): THREE.Box3 => {
        const box: THREE.Box3 = new THREE.Box3();
        for (const [id, object] of this.built.parts)
          if (
            !id.startsWith(CONSTRUCTION) &&
            prefixes.some((prefix: string): boolean => id.startsWith(prefix))
          )
            box.union(new THREE.Box3().setFromObject(object));
        return box;
      },
    );
  }

  /** Re-apply the Human styling for the current pass and selection. */
  private restyle(): void {
    this.styling.apply(
      createHumanPartStyle(
        this.pass,
        this.current,
        this.bounds.max.y - this.bounds.min.y,
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
function count(part: IAutoMovieModelPart): IHumanViewerPage.ILoaded["parts"][0] {
  if (part.geometry.type !== "mesh")
    return { id: part.id, vertices: 0, triangles: 0 };
  const vertices: number = part.geometry.mesh.positions.length / 3;
  return {
    id: part.id,
    vertices,
    triangles: (part.geometry.mesh.indices?.length ?? vertices) / 3,
  };
}
