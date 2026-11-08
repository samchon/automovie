import * as THREE from "three";

import { HumanDebugPattern } from "../contracts/HumanDebugPattern";
import type { IHumanDebugOptions } from "../contracts/IHumanDebugOptions";

/** Part id namespace a pattern may leave out. */
const PREFIX: string = "human.skin.";

/**
 * Per-part visibility, colour and shading of the built surface parts, with edge and normal overlays.
 *
 * Shading modes, all on the supplied geometry and normals:
 *
 * - `appearance`: the part's own built material (skin, hair, eyes and their textures), recoloured
 *   when `partColor` names it.
 * - `clay`: a rough grey dielectric (or the part colour), double sided so a section shows inside.
 * - `normals`: world normal directions as RGB.
 * - `curvature`: unlit vertex colours of a discrete mean curvature, red convex, blue concave. At
 *   vertex i with unit normal n_i the estimate is the mean over its edges to j of
 *   (n_j - n_i)·(p_j - p_i) / |p_j - p_i|², which is 1/R on every edge of a sphere of radius R;
 *   the ramp saturates at the 95th percentile of |k| over the shown parts and maps
 *   sqrt(|k| / p95), a display convention that keeps gentle curvature readable beside sharp. It is
 *   computed once per part over the part's own triangles, so a seam vertex sees half its ring.
 *
 * The view comparison's reference parts (`human.skin.reference.*`) draw at `referenceOpacity`, every
 * other part at `opacity`.
 *
 * Each {@link apply} restores the built materials and releases what the previous apply made, so
 * styles never compound; {@link dispose} does the same once more and shows every part.
 */
export class HumanDebugShading {
  /** Edge and normal overlays in world coordinates. */
  public readonly overlays: THREE.Group = new THREE.Group();

  /** Each part's mesh, its built material and its cached curvature. */
  private readonly meshes: {
    id: string;
    object: THREE.Object3D;
    mesh: THREE.Mesh;
    original: THREE.Material | THREE.Material[];
    curvature?: Float32Array;
  }[] = [];

  /** Materials and geometries made by the latest apply. */
  private derived: { dispose(): void }[] = [];

  /**
   * Record every part's meshes and built materials.
   *
   * @param parts Built parts by id, from `buildModel(...).parts`.
   */
  public constructor(parts: ReadonlyMap<string, THREE.Object3D>) {
    for (const [id, object] of parts)
      object.traverse((node: THREE.Object3D): void => {
        if (node instanceof THREE.Mesh) this.meshes.push({ id, object, mesh: node, original: node.material });
      });
  }

  /**
   * Apply visibility, colour, shading and overlays.
   *
   * @param options Frame options; the part and surface fields are read.
   * @returns Ids of the parts now shown.
   */
  public apply(options: IHumanDebugOptions): string[] {
    this.release();
    const shown: Set<string> = new Set();
    const shared: Map<string, THREE.Material> = new Map();
    const visible: (id: string) => boolean = (id: string): boolean =>
      HumanDebugPattern.matches(id, options.parts, PREFIX) && !HumanDebugPattern.matches(id, options.hide, PREFIX);

    // Curvature colours saturate at one scale over every shown part.
    let scale: number = 0;
    if (options.shade === "curvature") {
      const magnitudes: number[] = [];
      for (const entry of this.meshes)
        if (visible(entry.id)) {
          entry.curvature ??= curvature(entry.mesh.geometry);
          for (const k of entry.curvature) magnitudes.push(Math.abs(k));
        }
      magnitudes.sort((a: number, b: number): number => a - b);
      scale = magnitudes[Math.floor(0.95 * (magnitudes.length - 1))] ?? 0;
    }

    for (const entry of this.meshes) {
      entry.object.visible = visible(entry.id);
      if (!entry.object.visible) continue;
      shown.add(entry.id);
      const colour: string | undefined = HumanDebugPattern.last(entry.id, options.partColor, PREFIX)?.colour;
      // The view comparison's reference draws at its own opacity.
      const opacity: number = entry.id.startsWith(PREFIX + "reference.") ? options.referenceOpacity : options.opacity;
      const key: string = [
        options.shade,
        opacity,
        colour ?? "",
        options.shade === "curvature" ? entry.id : "",
        options.shade === "appearance" ? entry.mesh.uuid : "",
      ].join(":");
      let material: THREE.Material | undefined = shared.get(key);
      if (material === undefined) {
        material = this.material(entry, options.shade, colour, scale);
        if (opacity < 1) {
          material.transparent = true;
          material.opacity = opacity;
          material.depthWrite = false;
        }
        shared.set(key, material);
        this.derived.push(material);
      }
      entry.mesh.material = material;

      if (options.wire) {
        const wire: THREE.Mesh = new THREE.Mesh(
          entry.mesh.geometry,
          new THREE.MeshBasicMaterial({ color: 0x1b1f24, wireframe: true, transparent: true, opacity: 0.35, depthWrite: false }),
        );
        wire.applyMatrix4(entry.mesh.matrixWorld);
        this.overlays.add(wire);
        this.derived.push(wire.material as THREE.Material);
      }
      if (options.normals) {
        const lines: THREE.LineSegments = normalLines(entry.mesh, options.normalLength / 1000);
        this.overlays.add(lines);
        this.derived.push(lines.geometry, lines.material as THREE.Material);
      }
    }
    return [...shown];
  }

  /**
   * World bounds of the shown parts a pattern list names; every shown part for an empty list.
   *
   * @param patterns Part globs.
   * @returns The box in metres; empty when nothing matches.
   */
  public bounds(patterns: readonly string[]): THREE.Box3 {
    const box: THREE.Box3 = new THREE.Box3();
    for (const entry of this.meshes)
      if (entry.object.visible && (patterns.length === 0 || HumanDebugPattern.matches(entry.id, patterns, PREFIX)))
        box.union(this.meshBounds(entry.mesh));
    return box;
  }

  /**
   * Bound only complete triangles in the mesh's active index/draw range. Native reference crops
   * retain their original position buffer, whose unused vertices must not frame the whole body.
   * Human buildModel supplies ordinary/skinned triangle meshes, not instances. Its public vertex
   * reader retains current morph/skin evaluation, and matrixWorld retains the actual placement.
   * This reads O(I) drawn vertex references without changing buffers or keeping another cache.
   */
  private meshBounds(mesh: THREE.Mesh): THREE.Box3 {
    const box: THREE.Box3 = new THREE.Box3();
    const geometry: THREE.BufferGeometry = mesh.geometry;
    const position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute | undefined = geometry.getAttribute("position");
    if (position === undefined) return box;
    const index: THREE.BufferAttribute | null = geometry.getIndex();
    const start: number = Math.max(0, geometry.drawRange.start);
    const available: number = Math.min(index?.count ?? position.count, geometry.drawRange.start + geometry.drawRange.count) - start;
    const end: number = start + 3 * Math.floor(Math.max(0, available) / 3);
    const point: THREE.Vector3 = new THREE.Vector3();
    for (let offset: number = start; offset < end; offset++) {
      mesh.getVertexPosition(index === null ? offset : index.getX(offset), point);
      box.expandByPoint(point.applyMatrix4(mesh.matrixWorld));
    }
    return box;
  }

  /** Restore every built material and release what this class made. */
  public dispose(): void {
    this.release();
    for (const entry of this.meshes) entry.object.visible = true;
  }

  /** Put the built materials back and dispose the derived resources and overlays. */
  private release(): void {
    for (const entry of this.meshes) {
      entry.mesh.material = entry.original;
      if (entry.curvature !== undefined && entry.mesh.geometry.hasAttribute("color"))
        entry.mesh.geometry.deleteAttribute("color");
    }
    for (const resource of this.derived) resource.dispose();
    this.derived = [];
    this.overlays.clear();
  }

  /** The material of one shading mode for one part. */
  private material(
    entry: (typeof this.meshes)[number],
    shade: IHumanDebugOptions["shade"],
    colour: string | undefined,
    scale: number,
  ): THREE.Material {
    if (shade === "normals") return new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });
    if (shade === "curvature") {
      // The colours ride the built geometry as a `color` attribute only while this mode is
      // applied; release removes it, so no other material reads them.
      const colours: Float32Array = new Float32Array(entry.curvature!.length * 3);
      entry.curvature!.forEach((k: number, i: number): void => {
        const f: number = scale > 0 ? Math.sign(k) * Math.sqrt(Math.min(1, Math.abs(k) / scale)) : 0;
        colours.set(f >= 0 ? [1, 1 - f, 1 - f] : [1 + f, 1 + f, 1], 3 * i);
      });
      entry.mesh.geometry.setAttribute("color", new THREE.Float32BufferAttribute(colours, 3));
      return new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
    }
    if (shade === "clay")
      return new THREE.MeshStandardMaterial({
        color: "#" + (colour ?? "b9b9b9"),
        roughness: 1,
        metalness: 0,
        side: THREE.DoubleSide,
      });
    const source: THREE.Material = Array.isArray(entry.original) ? entry.original[0]! : entry.original;
    const material: THREE.Material = source.clone();
    if (colour !== undefined && "color" in material) (material.color as THREE.Color).set("#" + colour);
    return material;
  }
}

/** Discrete mean curvature per vertex in 1/m; see the class comment. */
function curvature(geometry: THREE.BufferGeometry): Float32Array {
  const position: THREE.BufferAttribute = geometry.getAttribute("position") as THREE.BufferAttribute;
  const normal: THREE.BufferAttribute | undefined = geometry.getAttribute("normal") as THREE.BufferAttribute | undefined;
  const count: number = position.count;
  if (normal === undefined) return new Float32Array(count);
  const sum: Float64Array = new Float64Array(count);
  const edges: Uint32Array = new Uint32Array(count);
  const index: ArrayLike<number> =
    geometry.index?.array ?? Array.from({ length: count }, (_: unknown, i: number): number => i);
  const add: (i: number, j: number) => void = (i: number, j: number): void => {
    const dx: number = position.getX(j) - position.getX(i);
    const dy: number = position.getY(j) - position.getY(i);
    const dz: number = position.getZ(j) - position.getZ(i);
    const length: number = dx * dx + dy * dy + dz * dz;
    if (length === 0) return;
    sum[i] +=
      ((normal.getX(j) - normal.getX(i)) * dx + (normal.getY(j) - normal.getY(i)) * dy + (normal.getZ(j) - normal.getZ(i)) * dz) /
      length;
    ++edges[i];
  };

  // Each triangle edge is visited from both ends; an edge shared by two triangles counts twice at
  // each end, which weights the mean but not its sign or scale.
  for (let t: number = 0; t + 2 < index.length; t += 3)
    for (const [a, b] of [[0, 1], [1, 2], [2, 0]] as const) {
      add(index[t + a]!, index[t + b]!);
      add(index[t + b]!, index[t + a]!);
    }
  return Float32Array.from(sum, (s: number, i: number): number => (edges[i] === 0 ? 0 : s / edges[i]!));
}

/** One world-space line per vertex along its normal. */
function normalLines(mesh: THREE.Mesh, length: number): THREE.LineSegments {
  const position: THREE.BufferAttribute = mesh.geometry.getAttribute("position") as THREE.BufferAttribute;
  const normal: THREE.BufferAttribute | undefined = mesh.geometry.getAttribute("normal") as THREE.BufferAttribute | undefined;
  const values: number[] = [];
  const matrix: THREE.Matrix3 = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
  for (let i: number = 0; normal !== undefined && i < position.count; ++i) {
    const p: THREE.Vector3 = new THREE.Vector3().fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld);
    const n: THREE.Vector3 = new THREE.Vector3().fromBufferAttribute(normal, i).applyMatrix3(matrix).normalize();
    values.push(p.x, p.y, p.z, p.x + n.x * length, p.y + n.y * length, p.z + n.z * length);
  }
  const geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(values, 3));
  return new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0x0c8599 }));
}
