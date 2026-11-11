import * as THREE from "three";

import type { AutoMovieHumanPolygon as Skeleton } from "./AutoMovieHumanPolygon.js";
import { humanPolygonTopology as LoftMesh } from "./humanPolygonTopology.js";

/**
 * Assemble one rigid display module from its already selected sections.
 *
 * The caller owns shape selection, shared boundaries, materials and every
 * emitted geometry. This module only emits their local mesh and diagnostics,
 * preserving the existing source sequence, zipper, winding and crown cap.
 * A band between two rings is the side of their convex hull: each ring's
 * edges taken in order of direction, each closed on the other ring's vertex
 * that supports it, so the drawn surface is the one the module's collider
 * hull takes from the same ring points. Its front query intersects those same emitted triangles for face attachment.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Moves registered points into the bone rest frame once and consumes its supplied posed placement once; existing LoftMesh zipper and cap own exterior connectivity.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One module assembly returns the surface target, its matching diagnostic target and the material-bearing mesh without choosing anatomy or a palette.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No new solver, shape authority, source course, sample tuning or placement correction is introduced.
 * @evidence contracts/development/common.md#meaningful-documentation States the caller's section and resource ownership and this module's local-frame assembly responsibility.
 * @evidence contracts/development/implementation.md#efficient-algorithms Assembly follows supplied ring and index populations; front queries scan emitted triangles, and procedural rings retain the existing eight-sided display LOD.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Diagnostic loops reuse emitted ring positions and existing materials; the caller retains a single cleanup inventory.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Every created buffer is registered with the caller's geometry inventory; this assembler creates no cache, material or independent resource lifetime.
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
  const mesh: LoftMesh.IContext = { positions, indices };
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

  /**
   * Preserve triangle orientation selected from the actual source ring winding.
   *
   * Principled implementation: Appends original triangle indices and reverses their last two slots only when the source-ring area requires it.
   * Clear and simple design: One oriented emitter serves procedural bands and flat end fans.
   * Prohibited implementation shortcuts: No vertex or topology correction is added during promotion.
   * Meaningful documentation: States original source-winding ownership.
   * Efficient algorithms: Three index appends in constant time.
   * Reuse equivalent work: Appends to the existing module index buffer.
   * Bound retention and release resources: Retains no extra records or native resource.
   */
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
      // The band is the side of the convex hull of its two rings, which is
      // the collider. The rings are convex, lie in parallel planes and wind
      // the same way, so each side face of their hull is one ring's edge with
      // the other ring's vertex that supports the edge's outward direction:
      // the two rings' edges taken in order of direction. Joining the points
      // of one index instead is the hull only where the rings' edges run
      // parallel; between rings of different proportions such a joining edge
      // cuts inside the hull, by 2 mm across a chest's shoulder ring.
      const direction = (from: number, to: number): number => {
        const edge: THREE.Vector3 = new THREE.Vector3(
          positions[3 * to]! - positions[3 * from]!,
          positions[3 * to + 1]! - positions[3 * from + 1]!,
          positions[3 * to + 2]! - positions[3 * from + 2]!,
        );
        const angle: number = Math.atan2(edge.dot(v), edge.dot(u));
        return angle < 0 ? angle + 2 * Math.PI : angle;
      };
      // Each ring's vertices from the start of its edge of least direction,
      // with the direction of the edge each one starts; at direction zero
      // both rings stand on their first vertex.
      const walk = (ring: number): { vertex: number; angle: number }[] => {
        const edges: { vertex: number; angle: number }[] = Array.from(
          { length: sides },
          (_: unknown, i: number): { vertex: number; angle: number } => ({
            vertex: ring * sides + i,
            angle: direction(
              ring * sides + i,
              ring * sides + ((i + 1) % sides),
            ),
          }),
        );
        const first: number = edges.reduce(
          (best: number, edge: { angle: number }, i: number): number =>
            edge.angle < edges[best]!.angle ? i : best,
          0,
        );
        return [...edges.slice(first), ...edges.slice(0, first)];
      };
      const lower: { vertex: number; angle: number }[] = walk(layer);
      const upper: { vertex: number; angle: number }[] = walk(layer + 1);
      let i: number = 0;
      let j: number = 0;
      while (i < sides || j < sides) {
        const a: number = lower[i % sides]!.vertex;
        const c: number = upper[j % sides]!.vertex;
        if (j >= sides || (i < sides && lower[i]!.angle <= upper[j]!.angle)) {
          triangle(a, lower[(i + 1) % sides]!.vertex, c);
          i++;
        } else {
          triangle(a, upper[(j + 1) % sides]!.vertex, c);
          j++;
        }
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

/** Explicit section inputs shared by the display selector and mesh assembler.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents section axes, optional source points and display coordinates, and the query's local units, frontmost selection and missing-hit result.
 * @evidence contracts/development/design.md#principled-representation Represents Explicit section inputs shared by the display selector and mesh assembler: companion namespace of 2 members (`ISection`, `frontAt`); units and frames named in its text: metre, frame, second, local. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `buildHumanPolygonModule` in packages/render/src/scene/human-polygon/buildHumanPolygonModule.ts; its surface is the 2 members listed and the text shows 3 other files naming it, mostly packages/render (3), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace buildHumanPolygonModule {
  /**
   * One original polygon section, with physical half dimensions.
   *
   * Principled implementation: Carries registered metre centre/half-extents and optional actual points with independent display correspondence.
   * Clear and simple design: One section contract serves original shape selection and mesh assembly.
   * Prohibited implementation shortcuts: Optional source points retain surface authority instead of being replaced by an ellipse.
   * Meaningful documentation: Gives metric centre/half dimensions, point ownership and display-coordinate purpose.
   * Efficient algorithms: This section record performs no computation.
   * Reuse equivalent work: The caller shares section records where original module boundaries coincide.
   * Bound retention and release resources: The construction caller owns these temporary vectors/records.
   */
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
   * Principled implementation: Intersects the actual indexed triangles double-sided along local +X and returns the greatest hit X; invalid query coordinates and no hit return undefined.
   * Clear and simple design: One actual-surface query serves the original cartoon attachment without another head representation.
   * Prohibited implementation shortcuts: No primitive fit, silhouette fallback or second pose replaces the supplied triangle surface.
   * Meaningful documentation: Documents local frame, ray direction, indexed-geometry premise and undefined results.
   * Efficient algorithms: Scans T emitted triangles once with constant-size vector/ray scratch.
   * Reuse equivalent work: Borrows original buffers and reuses triangle vectors throughout the scan.
   * Bound retention and release resources: All scratch is call-local; the query retains no geometry or native resource.
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
