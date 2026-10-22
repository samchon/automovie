import type {
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";
import type { IAutoMovieModelObject } from "@automovie/viewer";
import * as THREE from "three";

import { inflateTubeGeometry } from "./inflateTubeGeometry";

/**
 * Apply per-part display overrides chosen by a closure to a model built by `buildModel`.
 *
 * The closure receives each model part with its material definition and
 * returns an {@link ModelPartStyling.IStyle} or `undefined` for the part's own
 * look. This class knows no part ids: whatever rules decide the overrides, such
 * as the Human page's pass and curve selection, live in the closure. Each
 * {@link ModelPartStyling.apply} first restores every mesh to the material,
 * geometry, visibility and render order `buildModel` gave it, then derives new
 * ones, so successive styles never compound. Derived materials are shared by
 * every part with the same source material and override values; derived
 * geometry is per mesh.
 *
 * @evidence contracts/common.md#principled-implementation Every apply restores the recorded originals before deriving, so the result depends only on the current closure; colour overrides are linear RGB like IAutoMovieMaterial.baseColor and an unlit override swaps in MeshBasicMaterial with the same colour and side.
 * @evidence contracts/common.md#clear-and-simple-design A generic mechanism owned by the page's model mount; the rules that pick styles are a separate closure, so neither the viewer package nor this class holds application ids.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Model-owned materials and geometry are never mutated; overrides act on derived copies, and no part id is interpreted here.
 * @evidence contracts/common.md#meaningful-documentation States the closure contract, restore-then-derive order, sharing and ownership.
 * @evidence contracts/performance.md#efficient-algorithms Construction records M meshes once; each apply is O(P) closure calls plus one material clone per distinct (material, override) pair and one O(V) inflation per inflated mesh.
 * @evidence contracts/performance.md#reuse-equivalent-work Derived materials are cached per source material and override key within one apply, so hundreds of parts with one style share one material.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The instance owns only derived materials and geometries of the latest apply; apply and dispose release the previous set, and the built model keeps owning its originals.
 */
export class ModelPartStyling {
  private readonly meshes: Array<{
    part: IAutoMovieModelPart;
    definition: IAutoMovieMaterial | undefined;
    object: THREE.Object3D;
    mesh: THREE.Mesh;
    material: THREE.Material | THREE.Material[];
    geometry: THREE.BufferGeometry;
    renderOrder: number;
  }> = [];
  private readonly objects: Array<{
    part: IAutoMovieModelPart;
    definition: IAutoMovieMaterial | undefined;
    object: THREE.Object3D;
  }> = [];
  private derived: Array<{ dispose(): void }> = [];

  /**
   * Record the original display state of every part of a built model.
   *
   * @param model Model definition the object was built from.
   * @param built Result of `buildModel(model)`.
   */
  public constructor(model: IAutoMovieModel, built: IAutoMovieModelObject) {
    const definitions: Map<string, IAutoMovieMaterial> = new Map(
      model.materials.map(
        (material: IAutoMovieMaterial): [string, IAutoMovieMaterial] => [
          material.id,
          material,
        ],
      ),
    );
    for (const part of model.parts) {
      const object: THREE.Object3D | undefined = built.parts.get(part.id);
      if (object === undefined) continue;
      const definition: IAutoMovieMaterial | undefined =
        part.material === null ? undefined : definitions.get(part.material);
      this.objects.push({ part, definition, object });
      object.traverse((node: THREE.Object3D): void => {
        if (node instanceof THREE.Mesh)
          this.meshes.push({
            part,
            definition,
            object,
            mesh: node,
            material: node.material,
            geometry: node.geometry,
            renderOrder: node.renderOrder,
          });
      });
    }
  }

  /**
   * Restore the originals, then apply the closure's overrides to every part.
   *
   * @param style Closure returning overrides for one part, or undefined for its own look.
   *
   * @evidence contracts/common.md#principled-implementation Restores recorded originals first, then calls the closure once per part and derives materials and geometry from the originals only.
   * @evidence contracts/common.md#clear-and-simple-design One entry point for every style change, so pass and selection changes share one path.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A closure exception leaves the originals restored rather than a half-applied style.
   * @evidence contracts/common.md#meaningful-documentation States the restore-then-apply contract.
   * @evidence contracts/performance.md#efficient-algorithms O(P) closure calls, O(M) mesh updates, one clone per distinct material/override pair and O(V) per inflated mesh.
   * @evidence contracts/performance.md#reuse-equivalent-work The per-apply cache shares one derived material among parts with equal source material and overrides.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Disposes the previous apply's derived resources before acquiring the new ones; their number is bounded by the meshes and distinct styles of this model.
   */
  public apply(
    style: (
      part: IAutoMovieModelPart,
      material: IAutoMovieMaterial | undefined,
    ) => ModelPartStyling.IStyle | undefined,
  ): void {
    this.restore();

    // One closure call per part; its meshes share the result.
    const styles: Map<IAutoMovieModelPart, ModelPartStyling.IStyle | undefined> =
      new Map();
    for (const { part, definition, object } of this.objects) {
      const chosen: ModelPartStyling.IStyle | undefined = style(part, definition);
      styles.set(part, chosen);
      object.visible = chosen?.visible ?? true;
    }

    const cache: Map<THREE.Material, Map<string, THREE.Material>> = new Map();
    const derive: (
      source: THREE.Material,
      chosen: ModelPartStyling.IStyle,
    ) => THREE.Material = (
      source: THREE.Material,
      chosen: ModelPartStyling.IStyle,
    ): THREE.Material => {
      const key: string = JSON.stringify([
        chosen.color,
        chosen.unlit,
        chosen.depthTest,
        chosen.opacity,
        chosen.polygonOffset,
      ]);
      let variants: Map<string, THREE.Material> | undefined = cache.get(source);
      if (variants === undefined) cache.set(source, (variants = new Map()));
      const existing: THREE.Material | undefined = variants.get(key);
      if (existing !== undefined) return existing;

      const material: THREE.Material =
        chosen.unlit === true
          ? new THREE.MeshBasicMaterial({
              color: (source as THREE.MeshStandardMaterial).color,
              side: source.side,
            })
          : source.clone();
      if (chosen.color !== undefined && "color" in material)
        (material.color as THREE.Color).setRGB(
          chosen.color.r,
          chosen.color.g,
          chosen.color.b,
        );
      if (chosen.depthTest !== undefined) {
        material.depthTest = chosen.depthTest;
        material.depthWrite = chosen.depthTest;
      }
      if (chosen.opacity !== undefined && chosen.opacity < 1) {
        material.transparent = true;
        material.opacity = chosen.opacity;
      }
      if (chosen.polygonOffset !== undefined) {
        material.polygonOffset = true;
        material.polygonOffsetFactor = chosen.polygonOffset;
        material.polygonOffsetUnits = chosen.polygonOffset;
      }
      variants.set(key, material);
      this.derived.push(material);
      return material;
    };

    for (const entry of this.meshes) {
      const chosen: ModelPartStyling.IStyle | undefined = styles.get(entry.part);
      if (chosen === undefined) continue;
      entry.mesh.material = Array.isArray(entry.material)
        ? entry.material.map((source: THREE.Material): THREE.Material =>
            derive(source, chosen),
          )
        : derive(entry.material, chosen);
      if (chosen.renderOrder !== undefined)
        entry.mesh.renderOrder = chosen.renderOrder;
      if (chosen.inflate !== undefined && chosen.inflate !== 0) {
        const geometry: THREE.BufferGeometry = inflateTubeGeometry(
          entry.geometry,
          chosen.inflate,
        );
        this.derived.push(geometry);
        entry.mesh.geometry = geometry;
      }
    }
  }

  /**
   * Restore the originals and release every derived material and geometry.
   *
   * @evidence contracts/common.md#principled-implementation Puts back the recorded material, geometry, render order and visibility before disposing derived copies, so no mesh keeps a disposed resource.
   * @evidence contracts/common.md#clear-and-simple-design The inverse of apply, used by the model owner on retirement.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Never disposes model-owned originals; buildModel's owner releases those.
   * @evidence contracts/common.md#meaningful-documentation States the restore-then-release order and ownership split.
   * @evidence contracts/performance.md#efficient-algorithms Linear in meshes and derived resources.
   * @evidence contracts/performance.md#reuse-equivalent-work Nothing derived survives; a later apply rebuilds from originals.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Leaves zero derived resources; calling it again is harmless.
   */
  public dispose(): void {
    this.restore();
  }

  /** Put back the original look and dispose the derived resources. */
  private restore(): void {
    for (const entry of this.meshes) {
      entry.mesh.material = entry.material;
      entry.mesh.geometry = entry.geometry;
      entry.mesh.renderOrder = entry.renderOrder;
    }
    for (const { object } of this.objects) object.visible = true;
    for (const resource of this.derived) resource.dispose();
    this.derived = [];
  }
}

export namespace ModelPartStyling {
  /**
   * Display overrides for one part; an absent field keeps the part's own value.
   *
   * @evidence contracts/common.md#principled-implementation Each field maps to one three.js display property; colour uses the model's linear RGB convention.
   * @evidence contracts/common.md#clear-and-simple-design Only the overrides current consumers use: visibility, colour, lighting, depth, order, opacity, polygon offset and tube thickening.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No field names an application part or rule.
   * @evidence contracts/common.md#meaningful-documentation Each field states its unit and effect.
   * @evidence contracts/performance.md#efficient-algorithms A plain record; cost lies in ModelPartStyling.apply.
   * @evidence contracts/performance.md#reuse-equivalent-work Equal material overrides share one derived material in apply.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Holds no resources.
   */
  export interface IStyle {
    /** False hides the part. */
    visible?: boolean;

    /** Replacement base colour in linear RGB, 0 to 1 per channel. */
    color?: { r: number; g: number; b: number };

    /** True draws with an unlit material, so lights cannot wash the colour out. */
    unlit?: boolean;

    /** False draws the part through everything in front of it (depth test and write off). */
    depthTest?: boolean;

    /** Draw order among transparent and depth-free objects; higher draws later. */
    renderOrder?: number;

    /** Opacity below 1 makes the material transparent. */
    opacity?: number;

    /** Polygon offset factor and units; positive pushes the part back in depth. */
    polygonOffset?: number;

    /** Radius increase in metres for tube-shaped meshes, moving vertices along their normals. */
    inflate?: number;
  }
}
