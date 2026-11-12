import * as THREE from "three";

/**
 * Create a complete sphere with one exact positional sample at its periodic seam.
 *
 * Finite segment counts use Three's floor/minimum normalization. The two UV
 * columns still have separate indices and texture coordinates, but the last
 * column reuses the first column's position and normal at the same longitude.
 * This preserves exact closure after a shared rigid world transform.
 * Nonfinite Float32 output, zero normals or collapsed indexed triangles refuse;
 * the admissible radius therefore also depends on the requested tessellation.
 *
 * @param radius Positive finite local-metre radius with representable, nondegenerate output.
 * @param widthSegments Finite longitude count, floored with minimum three.
 * @param heightSegments Finite latitude count, floored with minimum two.
 * @returns Caller-owned SphereGeometry; dispose it when its consumers retire.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Longitude zero and a full turn are the same parameter point. Copying that known endpoint sample constructs exact periodic identity without a proximity rule; Three retains its original triangles, UV split, radius and segment normalization. Exact finite/nonzero checks on the emitted Float32 buffers refuse arithmetic overflow, underflow and collapsed triangles without inventing a radius cutoff.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One primitive producer delegates tessellation to Three and owns its full-period boundary and output admission. Glove equipment and face marks consume this same source rather than repairing query inputs independently.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No geometry label, coordinate epsilon, vertex merge, triangle removal, collision exemption or fitted proxy participates. Invalid numeric inputs refuse before construction; unusable output refuses and is disposed before transfer.
 * @evidence contracts/development/common.md#meaningful-documentation States the complete-sphere domain, output-dependent radius admission, metre units, segment normalization, unchanged UV/index ownership, exact seam construction and caller disposal responsibility.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three creates O(width times height) vertices and triangles; seam copying adds O(height) work and output admission scans each vertex and triangle once. Constant-size vectors are reused; no extra geometry or query hierarchy is built. A complete scan is required to detect collapse at any latitude or longitude.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each latitude's first sample supplies its mathematically identical final longitude once. The caller decides whether immutable owned geometry is shared across instances; this producer retains no cross-request cache.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned geometry owns Three's position, normal, UV and index buffers. Failed output admission disposes them before throwing. The producer retains no closure, actor, renderer or task; callers dispose accepted geometry after its last mesh consumer.
 */
export function createAutoMovieClosedSphereGeometry(
  radius: number = 1,
  widthSegments: number = 32,
  heightSegments: number = 16,
): THREE.SphereGeometry {
  if (
    !Number.isFinite(radius) ||
    radius <= 0 ||
    !Number.isFinite(widthSegments) ||
    !Number.isFinite(heightSegments)
  )
    throw new Error(
      "A closed sphere requires a positive finite radius and finite segment counts",
    );
  const geometry: THREE.SphereGeometry = new THREE.SphereGeometry(
    radius,
    widthSegments,
    heightSegments,
  );
  const width: number = Math.max(3, Math.floor(widthSegments));
  const height: number = Math.max(2, Math.floor(heightSegments));
  const position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute =
    geometry.getAttribute("position");
  const normal: THREE.BufferAttribute | THREE.InterleavedBufferAttribute =
    geometry.getAttribute("normal");

  // A full turn shares the same exact sample; UV coordinates remain distinct.
  for (let row: number = 0; row <= height; row++) {
    const first: number = row * (width + 1);
    const last: number = first + width;
    position.setXYZ(
      last,
      position.getX(first),
      position.getY(first),
      position.getZ(first),
    );
    normal.setXYZ(
      last,
      normal.getX(first),
      normal.getY(first),
      normal.getZ(first),
    );
  }
  position.needsUpdate = true;
  normal.needsUpdate = true;
  const origin: THREE.Vector3 = new THREE.Vector3();
  const firstEdge: THREE.Vector3 = new THREE.Vector3();
  const secondEdge: THREE.Vector3 = new THREE.Vector3();

  // Validate the actual stored precision, since finite inputs can overflow or collapse.
  for (let vertex: number = 0; vertex < position.count; vertex++) {
    origin.fromBufferAttribute(position, vertex);
    firstEdge.fromBufferAttribute(normal, vertex);
    if (
      !Number.isFinite(origin.x) ||
      !Number.isFinite(origin.y) ||
      !Number.isFinite(origin.z) ||
      !Number.isFinite(firstEdge.x) ||
      !Number.isFinite(firstEdge.y) ||
      !Number.isFinite(firstEdge.z) ||
      firstEdge.lengthSq() === 0
    ) {
      geometry.dispose();
      throw new Error(
        "A closed sphere requires finite positions and nonzero finite normals at stored precision",
      );
    }
  }
  const indices: THREE.BufferAttribute = geometry.index!;

  // Float32 edge products and their squares fit in doubles even at subnormal scale.
  for (let triangle: number = 0; triangle < indices.count; triangle += 3) {
    origin.fromBufferAttribute(position, indices.getX(triangle));
    firstEdge
      .fromBufferAttribute(position, indices.getX(triangle + 1))
      .sub(origin);
    secondEdge
      .fromBufferAttribute(position, indices.getX(triangle + 2))
      .sub(origin);
    if (firstEdge.cross(secondEdge).lengthSq() === 0) {
      geometry.dispose();
      throw new Error(
        "A closed sphere requires nondegenerate triangles at stored precision",
      );
    }
  }
  return geometry;
}
