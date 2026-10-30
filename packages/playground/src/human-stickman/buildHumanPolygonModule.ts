import * as THREE from "three";

import { AutoMovieHumanLoftMesh as LoftMesh } from "../../../human/src/lofting/AutoMovieHumanLoftMesh";
import type { AutoMovieHumanSkeleton as Skeleton } from "../../../human/src/skeleton/AutoMovieHumanSkeleton";

/**
 * Assemble one rigid display module from its already selected sections.
 *
 * The caller owns shape selection, shared boundaries, materials and every
 * emitted geometry. This module only emits their local mesh and diagnostics,
 * preserving the existing source sequence, zipper, winding and crown cap.
 * Its front query intersects those same emitted triangles for face attachment.
 *
 * @evidence contracts/common.md#principled-implementation Moves registered points into the bone rest frame once and consumes its supplied posed placement once; existing LoftMesh zipper and cap own exterior connectivity.
 * @evidence contracts/common.md#clear-and-simple-design One module assembly returns the surface target, its matching diagnostic target and the material-bearing mesh without choosing anatomy or a palette.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No new solver, shape authority, source course, sample tuning or placement correction is introduced.
 * @evidence contracts/common.md#meaningful-documentation States the caller's section and resource ownership and this module's local-frame assembly responsibility.
 * @evidence contracts/performance.md#efficient-algorithms Assembly follows supplied ring and index populations; front queries scan emitted triangles, and procedural rings retain the existing eight-sided display LOD.
 * @evidence contracts/performance.md#reuse-equivalent-work Diagnostic loops reuse emitted ring positions and existing materials; the caller retains a single cleanup inventory.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Every created buffer is registered with the caller's geometry inventory; this assembler creates no cache, material or independent resource lifetime.
 */
export function buildHumanPolygonModule(
  bone: Skeleton.IBone,
  rings: buildHumanPolygonModule.ISection[],
  placement: Skeleton.IPlacement,
  material: THREE.MeshStandardMaterial,
  lineMaterial: THREE.LineBasicMaterial,
  geometries: THREE.BufferGeometry[],
  axis: THREE.Vector3,
  breadth?: THREE.Vector3,
  topPole?: [number, number, number],
): { group: THREE.Group; diagnostic: THREE.Group; part: THREE.Mesh } {
  if (
    !placement.position.every(Number.isFinite) ||
    !placement.rotation.every(Number.isFinite)
  )
    throw new Error(`Missing or invalid polygon placement: ${bone.bone}`);
  const normal: THREE.Vector3 = axis.clone().normalize();
  const u: THREE.Vector3 =
    breadth === undefined
      ? new THREE.Vector3(1, 0, 0)
      : breadth.clone().cross(normal);
  u.addScaledVector(normal, -u.dot(normal));
  if (u.lengthSq() < Number.EPSILON)
    u.set(0, 1, 0).addScaledVector(normal, -normal.y);
  u.normalize();
  const v: THREE.Vector3 = normal.clone().cross(u).normalize();
  const supplied: buildHumanPolygonModule.ISection | undefined = rings.find(
    (ring: buildHumanPolygonModule.ISection): boolean =>
      ring.points !== undefined,
  );
  const sides: number = supplied?.points?.length ?? SIDES;
  let reverse: boolean = false;
  if (supplied?.points !== undefined) {
    const area: THREE.Vector3 = new THREE.Vector3();
    for (let i: number = 0; i < sides; ++i)
      area.add(
        supplied.points[i]!.clone()
          .sub(supplied.centre)
          .cross(
            supplied.points[(i + 1) % sides]!.clone().sub(supplied.centre),
          ),
      );
    reverse = area.dot(normal) < 0;

    // Preserve source phase order, including its winding. Reversing the
    // procedural ring's parameterization leaves its polygon shape unchanged.
    if (reverse) v.negate();
  }
  const positions: number[] = [];
  const indices: number[] = [];
  // These helpers only connect indices; registered positions stay in metres.
  const mesh: LoftMesh.IContext = { positions, indices, groups: [] };
  const diagnostic: THREE.Group = new THREE.Group();
  const group: THREE.Group = new THREE.Group();
  group.name = `human.polygon.${bone.bone}`;
  diagnostic.name = `${group.name}.sections`;
  for (const ring of rings) {
    if (
      !(ring.depth > 0 && ring.breadth > 0) ||
      !Number.isFinite(ring.depth + ring.breadth) ||
      !ring.centre.toArray().every(Number.isFinite)
    )
      throw new Error(`Invalid polygon section: ${bone.bone}`);
    const loop: THREE.Vector3[] = [];
    if (ring.points !== undefined && ring.points.length !== sides)
      throw new Error(
        `Polygon sections require the same display point count: ${bone.bone}`,
      );
    for (let i: number = 0; i < sides; ++i) {
      const angle: number = (2 * Math.PI * i) / sides;
      const p: THREE.Vector3 =
        ring.points === undefined
          ? ring.centre
              .clone()
              .addScaledVector(u, Math.cos(angle) * ring.depth)
              .addScaledVector(v, Math.sin(angle) * ring.breadth)
          : ring.points[i]!.clone();
      if (!p.toArray().every(Number.isFinite))
        throw new Error(`Non-finite polygon point: ${bone.bone}`);
      p.sub(new THREE.Vector3(...bone.position));
      positions.push(p.x, p.y, p.z);
      loop.push(p);
    }
    const lines: THREE.BufferGeometry =
      new THREE.BufferGeometry().setFromPoints(loop);
    geometries.push(lines);
    diagnostic.add(new THREE.LineLoop(lines, lineMaterial));
  }
  const triangle: (a: number, b: number, c: number) => void = (
    a: number,
    b: number,
    c: number,
  ): void => {
    indices.push(a, reverse ? c : b, reverse ? b : c);
  };
  for (let layer: number = 0; layer < rings.length - 1; ++layer) {
    const lower: readonly number[] | undefined =
      rings[layer]!.displayCoordinates;
    const upper: readonly number[] | undefined =
      rings[layer + 1]!.displayCoordinates;
    if (lower !== undefined && upper !== undefined) {
      const start: number = indices.length;
      LoftMesh.zipper(
        mesh,
        Array.from(
          { length: sides },
          (_: unknown, i: number): number => layer * sides + i,
        ),
        lower,
        Array.from(
          { length: sides },
          (_: unknown, i: number): number => (layer + 1) * sides + i,
        ),
        upper,
      );
      if (!reverse)
        for (let i: number = start; i < indices.length; i += 3)
          [indices[i + 1], indices[i + 2]] = [indices[i + 2]!, indices[i + 1]!];
    } else {
      for (let i: number = 0; i < sides; ++i) {
        const a: number = layer * sides + i;
        const b: number = layer * sides + ((i + 1) % sides);
        triangle(a, b, a + sides);
        triangle(b, b + sides, a + sides);
      }
    }
  }
  for (const end of [0, rings.length - 1]) {
    if (end !== 0 && topPole !== undefined) continue;
    const centre: THREE.Vector3 = rings[end]!.centre.clone().sub(
      new THREE.Vector3(...bone.position),
    );
    const k: number = positions.length / 3;
    positions.push(centre.x, centre.y, centre.z);
    for (let i: number = 0; i < sides; ++i) {
      const a: number = end * sides + i;
      const b: number = end * sides + ((i + 1) % sides);
      if (end === 0) triangle(k, b, a);
      else triangle(k, a, b);
    }
  }
  if (topPole !== undefined) {
    const pole: THREE.Vector3 = new THREE.Vector3(...topPole).sub(
      new THREE.Vector3(...bone.position),
    );
    const apex: number = positions.length / 3;
    positions.push(pole.x, pole.y, pole.z);
    const ring: number[] = Array.from(
      { length: sides },
      (_: unknown, i: number): number => (rings.length - 1) * sides + i,
    );
    const start: number = indices.length;
    LoftMesh.cap(mesh, ring, apex, true);
    if (!reverse)
      for (let i: number = start; i < indices.length; i += 3)
        [indices[i + 1], indices[i + 2]] = [indices[i + 2]!, indices[i + 1]!];
    const spokes: THREE.BufferGeometry =
      new THREE.BufferGeometry().setFromPoints(
        ring.flatMap((index: number): THREE.Vector3[] => [
          new THREE.Vector3(...LoftMesh.position(mesh, index)),
          pole,
        ]),
      );
    geometries.push(spokes);
    diagnostic.add(new THREE.LineSegments(spokes, lineMaterial));
  }
  const geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometries.push(geometry);
  const part: THREE.Mesh = new THREE.Mesh(geometry, material);
  group.add(part);
  for (const node of [group, diagnostic]) {
    node.position.set(...placement.position);
    node.quaternion.set(...placement.rotation);
  }

  return { group, diagnostic, part };
}

/** Explicit section inputs shared by the display selector and mesh assembler. */
export namespace buildHumanPolygonModule {
  /** One elliptical polygon section, with physical half dimensions. */
  export interface ISection {
    /** Centre in the skeleton's registered rest frame. */
    centre: THREE.Vector3;
    /** Half dimension along the section's first in-plane axis. */
    depth: number;
    /** Half dimension along its second in-plane axis. */
    breadth: number;
    /** Actual registered points when a source section owns the shape and phase. */
    points?: THREE.Vector3[];

    /** Separate front-anchored projected polygon arclength for display joining. */
    displayCoordinates?: readonly number[];
  }

  /**
   * Query the frontmost local triangle X for a face attachment at Y/Z.
   * The caller supplies the emitted indexed triangle geometry and its actual
   * local bounds. A +X ray starts behind those bounds, accepts either winding
   * and selects the greatest hit X. Nonfinite Y+Z or no hit returns undefined.
   * The query borrows the mesh and does not apply its posed placement again.
   *
   * @evidence contracts/common.md#principled-implementation Intersects the actual emitted indexed triangles along local +X and returns their greatest hit X, preserving the head mesh as attachment authority.
   * @evidence contracts/common.md#clear-and-simple-design A single triangle scan reads supplied local bounds and buffers; no reconstructed head profile or separate attachment surface is used.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not clamp a missing hit onto the silhouette, fit a primitive or apply another world or bone transform; indexed triangle geometry is an explicit caller premise.
   * @evidence contracts/common.md#meaningful-documentation States local coordinates, +X direction, double-sided intersection, frontmost selection and undefined results for invalid queries or absent intersections.
   * @evidence contracts/performance.md#efficient-algorithms Visits T indexed triangles once and keeps a constant-size set of ray and vector temporaries.
   * @evidence contracts/performance.md#reuse-equivalent-work Reads the original geometry attributes and reuses the same triangle and hit vectors throughout the scan instead of creating another mesh.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows geometry and bounds only for the call and returns a number or undefined; temporary vectors acquire no GPU handle or retained query cache.
   */
  export function frontAt(
    geometry: THREE.BufferGeometry,
    bounds: THREE.Box3,
    y: number,
    z: number,
  ): number | undefined {
    if (!Number.isFinite(y + z)) return undefined;
    const ray: THREE.Ray = new THREE.Ray(
      new THREE.Vector3(bounds.min.x - (bounds.max.x - bounds.min.x), y, z),
      new THREE.Vector3(1, 0, 0),
    );
    const positions: THREE.BufferAttribute | THREE.InterleavedBufferAttribute =
      geometry.getAttribute("position");
    const indices: THREE.BufferAttribute = geometry.getIndex()!;
    const a: THREE.Vector3 = new THREE.Vector3();
    const b: THREE.Vector3 = new THREE.Vector3();
    const c: THREE.Vector3 = new THREE.Vector3();
    const hit: THREE.Vector3 = new THREE.Vector3();
    let front: number | undefined;
    for (let i: number = 0; i < indices.count; i += 3) {
      a.fromBufferAttribute(positions, indices.getX(i));
      b.fromBufferAttribute(positions, indices.getX(i + 1));
      c.fromBufferAttribute(positions, indices.getX(i + 2));
      if (ray.intersectTriangle(a, b, c, false, hit) !== null)
        front = front === undefined ? hit.x : Math.max(front, hit.x);
    }
    return front;
  }
}

/** Explicit polygon LOD, independent of body dimensions. */
const SIDES: number = 8;
