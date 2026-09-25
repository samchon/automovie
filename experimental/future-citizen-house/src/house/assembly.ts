/** Mutable build-local collection, never a persisted scene store. The complete
 * surface owners call these metric primitive operations; this module chooses no
 * room, facade, camera or furniture layout. Meshes come from public engine APIs. */
import type { IAutoMovieBuiltEnvironment, IAutoMovieMesh, IAutoMovieMaterial, IAutoMovieVector3, IAutoMovieQuaternion, AutoMoviePrimitiveShape } from "@automovie/interface";
import { srgbHexToLinearColor } from "@automovie/engine";
import { pvTextureBinding } from "./canopy-finish";
import { materialTexture } from "../materials/bindings";
export type State = { privacy: "day" | "private" | "night"; flex: "work" | "guest" };
export const initialState: State = { privacy: "day", flex: "work" };
export const v = (x: number, y: number, z: number): IAutoMovieVector3 => ({ x, y, z });
export const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
export const yaw = (angle: number): IAutoMovieQuaternion => ({ x: 0, y: Math.sin(angle / 2), z: 0, w: Math.cos(angle / 2) });
export const rectangle = (a: number, b: number, y0: number, y1: number) => [
  { x: a, y: y0 }, { x: b, y: y0 }, { x: b, y: y1 }, { x: a, y: y1 },
];
const palette: Record<string, string> = { stone: "#c9c3b5", paving: "#bfc1bd", plaster: "#e5e0d6", felt: "#a09a8d", tile: "#6f746f", oak: "#a78965", bark: "#665c47", walnut: "#765238", metal: "#293332", steel: "#b4bcb8", gasket: "#252b29", linen: "#c8c3b6", green: "#69755b", grass: "#69755b", blue: "#657682", leaf: "#527644", soil: "#3c4132", pv: "#b9cedb", "canopy-metal": "#626e70", cassette: "#454d4a", glass: "#d2e2dc", frosted: "#b7ccc0", shade: "#aab3a0", glow: "#fff0cc", white: "#eeeae0", "sanitary-seat": "#e7e6df" };
const roughness: Record<string, number> = { stone: 0.82, paving: 0.86, plaster: 0.90, felt: 0.96, tile: 0.65, oak: 0.55, bark: 0.92, walnut: 0.48, metal: 0.38, steel: 0.24, gasket: 0.94, linen: 0.92, green: 0.76, grass: 0.98, blue: 0.94, leaf: 0.92, soil: 0.98, pv: 0.19, "canopy-metal": 0.36, cassette: 0.82, glass: 0.09, frosted: 0.70, shade: 0.88, glow: 0.76, white: 0.76, "sanitary-seat": 0.30 };
export class Assembly {
  readonly wallRecords: { frame: import("./walls").Frame; cuts: import("@automovie/engine").IAutoMovieWallOpening[] }[] = [];
  // One unit includes the house and its site; its logical root has no parent.
  readonly environment: IAutoMovieBuiltEnvironment = { version: 1, id: "citizen-house-2080", units: "meter", buildings: [{ id: "citizen-house", element: "house-root", space: "citizen-site" }], models: [], modelReferences: [], elements: [], populations: [], spaces: [], boundaries: [], openings: [], connectors: [], surfaces: [], walkable: [] };
  constructor(readonly state: State) {
    this.environment.elements.push({ id: "house-root", kind: "building", parent: null, model: null, space: "house", transform: { translation: v(0, 0, 0), rotation: identity, scale: v(1, 1, 1) } });
  }
  material(id: string): IAutoMovieMaterial {
    const glass = id === "glass" || id === "frosted";
    const tint = id === "glass" && this.state.privacy !== "day";
    if (!(id in palette)) throw new Error("Unknown material: " + id);
    return { id, name: id, baseColor: srgbHexToLinearColor(tint ? "#526c64" : palette[id]), metallic: id === "steel" ? 0.85 : id === "canopy-metal" ? 0.65 : 0,
      roughness: roughness[id],
      opacity: 1, alphaMode: id === "pv" ? "blend" : "opaque", doubleSided: false, baseColorTexture: id === "pv" ? pvTextureBinding : materialTexture(id),
      emissive: id === "glow" ? srgbHexToLinearColor("#ffcf82") : null,
      transmission: glass ? (id === "frosted" ? 0.28 : tint ? 0.38 : 0.94) : 0,
      ior: 1.5, thickness: id === "pv" ? 0.012 : glass ? 0.018 : 0, clearcoat: id === "pv" ? 0.25 : 0 };
  }
  model(id: string, material: string, geometry: { type: "primitive"; shape: AutoMoviePrimitiveShape } | { type: "mesh"; mesh: IAutoMovieMesh }): string {
    if (!this.environment.models.some((m) => m.id === id)) this.environment.models.push({ id, name: id, origin: "generated", skeleton: null, asset: null, body: null,
      materials: [this.material(material)], parts: [{ id: "solid", name: id, material, attachedBone: null, transform: null, geometry }] });
    return id;
  }
  primitive(material: string, shape: "box" | "sphere" | "cylinder" = "box"): string {
    return this.model(shape + "-" + material, material, { type: "primitive", shape: shape === "box" ? { type: "box", width: 1, height: 1, depth: 1 } : shape === "sphere" ? { type: "sphere", radius: 0.5 } : { type: "cylinder", radius: 0.5, height: 1 } });
  }
  place(id: string, kind: string, space: string, model: string, position: IAutoMovieVector3, scale = v(1, 1, 1), rotation = identity): string {
    this.environment.elements.push({ id, kind, space, parent: "house-root", model, transform: { translation: position, rotation, scale } });
    return id;
  }
  box(id: string, space: string, material: string, x: number, y: number, z: number, w: number, h: number, d: number, rotation = identity): string {
    return this.place(id, "solid", space, this.primitive(material), v(x, y, z), v(w, h, d), rotation);
  }
  ellipsoid(id: string, space: string, material: string, x: number, y: number, z: number, w: number, h: number, d: number): string {
    return this.place(id, "rounded-solid", space, this.primitive(material, "sphere"), v(x, y, z), v(w, h, d));
  }
  rod(id: string, space: string, material: string, a: IAutoMovieVector3, b: IAutoMovieVector3, radius: number): string {
    const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, length = Math.hypot(dx, dy, dz);
    if (length < 1e-7) throw new Error(id + ": zero length rod");
    const unit = v(dx / length, dy / length, dz / length);
    const norm = Math.hypot(unit.z, -unit.x, 1 + unit.y);
    const rotation = norm < 1e-7 ? { x: 1, y: 0, z: 0, w: 0 } : { x: unit.z / norm, y: 0, z: -unit.x / norm, w: (1 + unit.y) / norm };
    return this.place(id, "rod", space, this.primitive(material, "cylinder"), v((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2), v(radius * 2, length, radius * 2), rotation);
  }
  repeat(id: string, space: string, material: string, transforms: { id: string; translation: IAutoMovieVector3; scale: IAutoMovieVector3; rotation: IAutoMovieQuaternion }[]): void {
    if (!transforms.length) return;
    this.environment.populations!.push({ space, prototypeBounds: { min: v(-0.5, -0.5, -0.5), max: v(0.5, 0.5, 0.5) }, set: { id, modelRecipe: this.primitive(material), count: transforms.length,
      layout: { kind: "explicit", transforms }, anchor: v(0, 0, 0), facingDeg: 0, seed: 2080, variation: { scale: { min: 1, max: 1 }, palette: [palette[material] ?? "#e7e1d4"], traits: [] } } });
  }
}
