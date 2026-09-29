/** Mutable build-local collection, never a persisted scene store. The complete
 * surface owners call these metric primitive operations; this module chooses no
 * room, facade, camera or furniture layout. Meshes come from public engine APIs. */
import type { IAutoMovieBuiltEnvironment, IAutoMovieMesh, IAutoMovieMaterial, IAutoMovieVector3, IAutoMovieQuaternion, AutoMoviePrimitiveShape } from "@automovie/interface";
import { srgbHexToLinearColor, tessellateToMesh } from "@automovie/engine";
import { architecturalOpticalMaterial } from "../materials/003-glass-and-roof";
import { houseFinish, houseFinishRole, houseTextureTile, isHouseFinish } from "../materials/house-finishes";
import { memberTexturePhase, metricMesh, woodGrainAxis } from "../materials/metric-uv";
import { partitionSurfaceMesh, type FaceFinishes } from "../materials/surface-parts";
import { partitionSurfaceRegions, type SurfaceRegion } from "../materials/surface-regions";
import { ellipsoidMetricMesh } from "../materials/ellipsoid-uv";
import { retainedArchitectureMaterial, sanitarySeatMaterial } from "../materials/006-wet-and-joinery";
export type State = { privacy: "day" | "private" | "night"; flex: "work" | "guest" };
export const initialState: State = { privacy: "day", flex: "work" };
export const v = (x: number, y: number, z: number): IAutoMovieVector3 => ({ x, y, z });
export const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
export const yaw = (angle: number): IAutoMovieQuaternion => ({ x: 0, y: Math.sin(angle / 2), z: 0, w: Math.cos(angle / 2) });
export const rectangle = (a: number, b: number, y0: number, y1: number) => [
  { x: a, y: y0 }, { x: b, y: y0 }, { x: b, y: y1 }, { x: a, y: y1 },
];
const palette: Record<string, string> = { stone: "#c9c3b5", paving: "#bfc1bd", plaster: "#e5e0d6", felt: "#a09a8d", tile: "#6f746f", oak: "#a78965", bark: "#665c47", walnut: "#765238", metal: "#293332", steel: "#b4bcb8", gasket: "#252b29", seal: "#252b29", linen: "#c8c3b6", green: "#69755b", grass: "#69755b", blue: "#657682", leaf: "#527644", soil: "#3c4132", pv: "#b9cedb", "canopy-metal": "#626e70", cassette: "#454d4a", glass: "#d2e2dc", frosted: "#b7ccc0", shade: "#aab3a0", glow: "#fff0cc", white: "#eeeae0", "sanitary-seat": "#e7e6df" };
const roughness: Record<string, number> = { stone: 0.82, paving: 0.86, plaster: 0.90, felt: 0.96, tile: 0.65, oak: 0.55, bark: 0.92, walnut: 0.48, metal: 0.38, steel: 0.24, gasket: 0.94, seal: 0.94, linen: 0.92, green: 0.76, grass: 0.98, blue: 0.94, leaf: 0.92, soil: 0.98, pv: 0.19, "canopy-metal": 0.36, cassette: 0.82, glass: 0.09, frosted: 0.70, shade: 0.88, glow: 0.76, white: 0.76, "sanitary-seat": 0.30 };
export class Assembly {
  readonly wallRecords: { frame: import("./walls").Frame; cuts: import("@automovie/engine").IAutoMovieWallOpening[] }[] = [];
  // One unit includes the house and its site; its logical root has no parent.
  readonly environment: IAutoMovieBuiltEnvironment = { version: 1, id: "citizen-house-2080", units: "meter", buildings: [{ id: "citizen-house", element: "house-root", space: "citizen-site" }], models: [], modelReferences: [], elements: [], populations: [], spaces: [], boundaries: [], openings: [], connectors: [], surfaces: [], walkable: [] };
  constructor(readonly state: State) {
    this.environment.elements.push({ id: "house-root", kind: "building", parent: null, model: null, space: "house", transform: { translation: v(0, 0, 0), rotation: identity, scale: v(1, 1, 1) } });
  }
  material(id: string): IAutoMovieMaterial {
    if (isHouseFinish(id)) return houseFinish(id);
    const optical = architecturalOpticalMaterial(id, this.state.privacy);
    if (optical) return optical;
    if (id === "sanitary-seat") return sanitarySeatMaterial();
    if (!(id in palette)) throw new Error("Unknown material: " + id);
    return retainedArchitectureMaterial({ id, name: id, baseColor: srgbHexToLinearColor(palette[id]), metallic: id === "steel" ? 0.85 : 0,
      roughness: roughness[id],
      opacity: 1, alphaMode: "opaque", doubleSided: false, baseColorTexture: null,
      emissive: id === "glow" ? srgbHexToLinearColor("#ffcf82") : null,
      transmission: 0, ior: 1.5, thickness: 0, clearcoat: 0 });
  }
  model(id: string, material: string, geometry: { type: "primitive"; shape: AutoMoviePrimitiveShape } | { type: "mesh"; mesh: IAutoMovieMesh }, regions?: readonly SurfaceRegion[]): string {
    const finish = /^(box|sphere|cylinder)-/.test(id) ? material : houseFinishRole(id, material) ?? material;
    const tile = houseTextureTile(finish);
    if (tile && geometry.type === "primitive")
      geometry = { type: "mesh", mesh: metricMesh(tessellateToMesh(geometry.shape), v(1, 1, 1), finish, id, tile) };
    else if (tile && geometry.type === "mesh" && !id.startsWith("metric:"))
      geometry = { type: "mesh", mesh: metricMesh(geometry.mesh, v(1, 1, 1), finish, id, tile) };
    if (!this.environment.models.some((m) => m.id === id)) {
      const pieces = regions && geometry.type === "mesh" ? partitionSurfaceRegions(geometry.mesh, finish, regions) : [{ finish, mesh: null }];
      this.environment.models.push({ id, name: id, origin: "generated", skeleton: null, asset: null, body: null,
        materials: pieces.map(p => this.material(p.finish)), parts: pieces.map(p => ({ id: p.mesh ? "surface/" + p.finish : "solid", name: id, material: p.finish, attachedBone: null, transform: null,
          geometry: p.mesh ? { type: "mesh", mesh: houseTextureTile(p.finish) ? metricMesh(p.mesh, v(1, 1, 1), p.finish, id, houseTextureTile(p.finish)!) : p.mesh } : geometry })) });
    }
    return id;
  }
  private metricPrimitive(material: string, shape: "box" | "sphere" | "cylinder", scale: IAutoMovieVector3, host: string): string {
    const tile = houseTextureTile(material);
    if (!tile) throw new Error(`${host}: material has no metric binding`);
    const phase = /stone-panels|floor-boards/.test(host) ? memberTexturePhase(host) : [0, 0];
    const grain = material.startsWith("oak-") ? woodGrainAxis(material, host, scale) : "none";
    const id = `metric:${material}:${shape}:${JSON.stringify([scale.x, scale.y, scale.z, phase, grain])}`;
    if (!this.environment.models.some((m) => m.id === id)) {
      const primitive: AutoMoviePrimitiveShape = shape === "box" ? { type: "box", width: 1, height: 1, depth: 1 } : shape === "sphere" ? { type: "sphere", radius: .5 } : { type: "cylinder", radius: .5, height: 1 };
      const solidWood = material === "oak-floor" || material === "oak-stair" || material === "oak-furniture" && /leg/.test(host);
      if (shape === "box" && solidWood) {
        const axis = woodGrainAxis(material, host, scale);
        const end = `wood-end/${material}`;
        const pieces = partitionSurfaceMesh(tessellateToMesh(primitive), material, { [`${axis}-`]: end, [`${axis}+`]: end });
        this.environment.models.push({ id, name: id, origin: "generated", skeleton: null, asset: null, body: null, materials: pieces.map(p => this.material(p.finish)),
          parts: pieces.map(p => ({ id: "surface/" + p.finish, name: p.finish, material: p.finish, attachedBone: null, transform: null,
            geometry: { type: "mesh", mesh: p.finish === end ? p.mesh : metricMesh(p.mesh, scale, material, host, tile) } })) });
      } else this.model(id, material, { type: "mesh", mesh: shape === "sphere" ? ellipsoidMetricMesh(tessellateToMesh(primitive), scale) : metricMesh(tessellateToMesh(primitive), scale, material, host, tile) });
    }
    return id;
  }
  primitive(material: string, shape: "box" | "sphere" | "cylinder" = "box"): string {
    return this.model(shape + "-" + material, material, { type: "primitive", shape: shape === "box" ? { type: "box", width: 1, height: 1, depth: 1 } : shape === "sphere" ? { type: "sphere", radius: 0.5 } : { type: "cylinder", radius: 0.5, height: 1 } });
  }
  place(id: string, kind: string, space: string, model: string, position: IAutoMovieVector3, scale = v(1, 1, 1), rotation = identity): string {
    const record = this.environment.models.find((entry) => entry.id === model);
    if (record?.parts[0]?.geometry.type === "primitive" && record.materials[0]) {
      const finish = houseFinishRole(id, record.materials[0].id) ?? record.materials[0].id;
      const shape = record.parts[0].geometry.shape.type;
      if (houseTextureTile(finish) && (shape === "box" || shape === "sphere" || shape === "cylinder"))
        model = this.metricPrimitive(finish, shape, scale, id);
    }
    this.environment.elements.push({ id, kind, space, parent: "house-root", model, transform: { translation: position, rotation, scale } });
    return id;
  }
  box(id: string, space: string, material: string, x: number, y: number, z: number, w: number, h: number, d: number, rotation = identity, faces?: FaceFinishes): string {
    const finish = houseFinishRole(id, material) ?? material;
    const scale = v(w, h, d);
    let model = houseTextureTile(finish) ? this.metricPrimitive(finish, "box", scale, id) : this.primitive(finish);
    if (faces) {
      model = `faces:${id}:${JSON.stringify([scale, faces])}`;
      if (!this.environment.models.some(m => m.id === model)) {
        const source = tessellateToMesh({ type: "box", width: 1, height: 1, depth: 1 });
        const pieces = partitionSurfaceMesh(source, finish, faces);
        const materials = pieces.map(p => this.material(p.finish));
        this.environment.models.push({ id: model, name: id, origin: "generated", skeleton: null, asset: null, body: null, materials,
          parts: pieces.map(p => ({ id: "surface/" + p.finish, name: p.finish, material: p.finish, attachedBone: null, transform: null,
            geometry: { type: "mesh", mesh: houseTextureTile(p.finish) ? metricMesh(p.mesh, scale, p.finish, id, houseTextureTile(p.finish)!) : p.mesh } })) });
      }
    }
    return this.place(id, "solid", space, model, v(x, y, z), scale, rotation);
  }
  ellipsoid(id: string, space: string, material: string, x: number, y: number, z: number, w: number, h: number, d: number): string {
    const finish = houseFinishRole(id, material) ?? material;
    const scale = v(w, h, d);
    const model = houseTextureTile(finish) ? this.metricPrimitive(finish, "sphere", scale, id) : this.primitive(finish, "sphere");
    return this.place(id, "rounded-solid", space, model, v(x, y, z), scale);
  }
  rod(id: string, space: string, material: string, a: IAutoMovieVector3, b: IAutoMovieVector3, radius: number): string {
    const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, length = Math.hypot(dx, dy, dz);
    if (length < 1e-7) throw new Error(id + ": zero length rod");
    const unit = v(dx / length, dy / length, dz / length);
    const norm = Math.hypot(unit.z, -unit.x, 1 + unit.y);
    const rotation = norm < 1e-7 ? { x: 1, y: 0, z: 0, w: 0 } : { x: unit.z / norm, y: 0, z: -unit.x / norm, w: (1 + unit.y) / norm };
    const finish = houseFinishRole(id, material) ?? material;
    const scale = v(radius * 2, length, radius * 2);
    const model = houseTextureTile(finish) ? this.metricPrimitive(finish, "cylinder", scale, id) : this.primitive(finish, "cylinder");
    return this.place(id, "rod", space, model, v((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2), scale, rotation);
  }
  repeat(id: string, space: string, material: string, transforms: { id: string; translation: IAutoMovieVector3; scale: IAutoMovieVector3; rotation: IAutoMovieQuaternion }[]): void {
    if (!transforms.length) return;
    const finish = houseFinishRole(id, material) ?? material;
    const textured = houseTextureTile(finish) !== null;
    const selected = transforms.map((item) => textured ? { ...item, prototype: this.metricPrimitive(finish, "box", item.scale, `instance:${id}:${item.id}`) } : item);
    const recipes = [...new Set(selected.map((item) => "prototype" in item ? item.prototype : this.primitive(finish)))];
    const modelRecipe = recipes[0]!;
    this.environment.populations!.push({ space, prototypeBounds: { min: v(-0.5, -0.5, -0.5), max: v(0.5, 0.5, 0.5) }, set: { id, modelRecipe, ...(textured ? { prototypes: recipes.map((recipe) => ({ id: recipe, modelRecipe: recipe, weight: 1 })) } : {}), count: transforms.length,
      layout: { kind: "explicit", transforms: selected }, anchor: v(0, 0, 0), facingDeg: 0, seed: 2080, variation: { scale: { min: 1, max: 1 }, palette: [palette[material] ?? "#e7e1d4"], traits: [] } } });
  }
}
