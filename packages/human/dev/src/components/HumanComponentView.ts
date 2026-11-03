import type { IAutoMovieModelPart } from "@automovie/interface";
import { buildAutoMovieConstruction, buildModel, collectAutoMovieOwnedResources, createAutoMovieResourceRetirement } from "@automovie/viewer";
import * as THREE from "three";

import { HumanCaptureCamera } from "../human/HumanCaptureCamera";
import { HumanComponentModel } from "./HumanComponentModel";

/** A static real-patch scene, sharing the ordinary renderer and Human camera without creating a rig or person. */
export class HumanComponentView {
  /** The two groups are toggled independently for matching structural passes. */
  public readonly object: THREE.Group = new THREE.Group();
  /** Exact source geometry in metre units, used for framing and receipts. */
  public readonly result: HumanComponentModel.IResult;
  /** Actual scene-resource owner; retirement is idempotent. */
  private readonly retire: () => Promise<void>;
  /** Generic static renderer result, without bone attachments. */
  private readonly surface: ReturnType<typeof buildModel>;
  /** Same-source generating curves, without proxy tubes or refitted paths. */
  private readonly construction: ReturnType<typeof buildAutoMovieConstruction>;
  /** Current exact source patch addresses. */
  private selected: string[];
  /** Current structural pass. */
  private pass: "surface" | "overlay" | "construction" = "surface";
  /** Disposal is terminal. */
  private closed: boolean = false;

  /** Admit everything before allocating; roll back model resources if generating-line construction fails. */
  public constructor(parts: readonly HumanComponentModel.IPart[]) {
    this.result = HumanComponentModel.assemble(parts);
    this.selected = parts.map((part: HumanComponentModel.IPart): string => part.id);
    this.surface = buildModel(this.result.model);
    const resources: readonly { dispose(): void }[] = collectAutoMovieOwnedResources(this.surface.object);
    const surfaceClose: () => Promise<void> = createAutoMovieResourceRetirement(resources.map((resource: { dispose(): void }): (() => void) => (): void => resource.dispose()));
    try {
      this.construction = buildAutoMovieConstruction(this.result.curves, { color: 0x1670df, maxPoints: this.result.curves.reduce((sum: number, curve: HumanComponentModel.ICurve): number => sum + curve.points.length, 0) || 1 });
    } catch (error) {
      void surfaceClose().catch(console.error);
      throw error;
    }
    this.retire = createAutoMovieResourceRetirement([surfaceClose, this.construction.dispose]);
    this.object.add(this.surface.object, this.construction.object);
    this.apply("surface", this.selected);
  }

  /** Commit selection and pass together; selection contains real emitted mesh identities only. */
  public apply(pass: "surface" | "overlay" | "construction", ids: readonly string[]): void {
    if (this.closed) throw new Error("Component view is disposed");
    HumanComponentModel.selection(this.result, ids);
    this.pass = pass;
    this.selected = [...ids];
    const selected: Set<string> = new Set(ids);
    const chains: Set<string> = new Set(ids.map((id: string): string => id.slice("human.skin.".length, id.lastIndexOf("/"))));
    for (const [id, object] of this.surface.parts) {
      object.visible = selected.has(id);
      if (object instanceof THREE.Mesh) {
        const materials: THREE.Material[] = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          material.polygonOffset = pass === "overlay";
          material.polygonOffsetFactor = pass === "overlay" ? 1 : 0;
          material.polygonOffsetUnits = pass === "overlay" ? 1 : 0;
        }
      }
    }
    for (const curve of this.construction.object.children) {
      const chain: string = curve.name.slice("human.construction.".length, curve.name.lastIndexOf("/"));
      curve.visible = chains.has(chain);
    }
    this.surface.object.visible = pass !== "construction";
    this.construction.object.visible = pass !== "surface";
  }

  /** Fit the selected actual mesh under the same camera rule for all three passes. Angles are degrees. */
  public place(camera: THREE.PerspectiveCamera, key: THREE.DirectionalLight, azimuth: number, elevation: number, aspect: number): HumanCaptureCamera.IPlacement {
    if (this.closed) throw new Error("Component view is disposed");
    if (![azimuth, elevation, aspect].every(Number.isFinite) || aspect <= 0 || Math.abs(elevation) > 90) throw new Error("A finite camera direction and positive aspect are required");
    const bounds: HumanComponentModel.IBounds = HumanComponentModel.selection(this.result, this.selected);
    const box: THREE.Box3 = new THREE.Box3(new THREE.Vector3(...bounds.min), new THREE.Vector3(...bounds.max));
    return HumanCaptureCamera.place(camera, key, { name: "component-selection", azimuth: THREE.MathUtils.degToRad(azimuth), elevation: THREE.MathUtils.degToRad(elevation), region: box }, box, aspect);
  }

  /** Report exact component/curve identities and source bounds, independently of viewport appearance. */
  public snapshot(): { selected: string[]; pass: string; bounds: HumanComponentModel.IBounds; vertices: number; triangles: number; curves: string[] } {
    return { selected: [...this.selected], pass: this.pass, bounds: HumanComponentModel.selection(this.result, this.selected), vertices: this.result.model.parts.reduce((sum: number, part: IAutoMovieModelPart): number => sum + (part.geometry.type === "mesh" ? part.geometry.mesh.positions.length / 3 : 0), 0), triangles: this.result.model.parts.reduce((sum: number, part: IAutoMovieModelPart): number => sum + (part.geometry.type === "mesh" ? (part.geometry.mesh.indices?.length ?? 0) / 3 : 0), 0), curves: this.result.curves.map((curve: HumanComponentModel.ICurve): string => curve.id) };
  }

  /** Detach the component and retire its own geometry and materials once; no shared source buffers are mutated. */
  public async dispose(): Promise<void> {
    this.closed = true;
    this.object.removeFromParent();
    await this.retire();
  }
}
