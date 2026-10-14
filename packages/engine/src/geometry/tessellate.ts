import { AutoMoviePrimitiveShape } from "@automovie/interface";
import { ITessellation } from "./ITessellation";
import { PRIMITIVE_RADIAL_SEGMENTS } from "./constants/PRIMITIVE_RADIAL_SEGMENTS";
import { PRIMITIVE_SPHERE_RINGS } from "./constants/PRIMITIVE_SPHERE_RINGS";
/**
 * Tessellate a {@link AutoMoviePrimitiveShape} into a triangle mesh.
 *
 * Lets the LLM-authored "named dimensions" path (a 0.4 m sphere, a capsule)
 * become concrete geometry a renderer can draw, without the model ever emitting
 * vertices. The engine owns this fixed primitive recipe independently of the
 * rendering host; renderer precision and appearance are separate observations.
 *
 * Coordinates are local metres, centred on the origin, and faces wind
 * counter-clockwise from outside. Dimensions must already have passed model
 * validation. Sphere, cylinder and cone use sixteen angular segments; the
 * sphere has twelve latitude rings. Planes retain the zero-height box topology.
 * Capsules currently use a closed bounding cylinder rather than hemispherical
 * caps, so their silhouette and volume are approximations requiring correction.
 * Each call returns fresh indexed position and normal arrays, without UVs.
 * Finite admitted dimensions can still overflow derived capsule height or
 * normal arithmetic; this producer does not refuse every extreme invalid mesh.
 *
 * @throws Error when the runtime primitive discriminator is unknown.
 *
 * @evidence contracts/common.md#principled-implementation Box faces use independent flat-normal corners, spheres sample latitude and longitude, and cylinders and cones use radial rings with slope-correct normals and cap fans. Validated dimensions and representable derived arithmetic are premises; finite scalar admission does not establish the latter. Sphere poles and cone apexes retain degenerate lattice faces, and the capsule cylinder approximation remains unresolved.
 * @evidence contracts/common.md#clear-and-simple-design One discriminator dispatches to private primitive builders shared by viewer geometry, model extents, drawing and GLB export; fixed angular resolution keeps the lightweight render deterministic without adding authoring options.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The capsule branch still substitutes its bounding cylinder for the declared rounded shape; this remaining compensation must be replaced and visually checked rather than certified as capsule geometry.
 * @evidence contracts/common.md#meaningful-documentation States local metre coordinates, winding, prior dimension validation, fixed sampling counts, zero-height plane topology, fresh output ownership and the capsule approximation.
 * @evidence contracts/performance.md#efficient-algorithms Box construction is constant size, radial primitives use O(S) positions and indices for S angular segments, and the sphere uses O(S times R) for R latitude rings; both resolution values are fixed here and each output element is emitted once.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Callers receive mutable fresh buffers, so the tessellator shares no arrays across calls; consumers such as the drawing index own any model-part memoization.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The builders retain no cache, handle or task; positions, normals and indices belong to the returned tessellation and temporary face tables are released on return.
 *
 * @author Samchon
 */
export const tessellate: (shape: AutoMoviePrimitiveShape) => ITessellation = (shape: AutoMoviePrimitiveShape): ITessellation => {
  switch (shape.type) {
    case "box":
      return box(shape.width, shape.height, shape.depth);
    case "plane":
      return box(shape.width, 0, shape.depth);
    case "sphere":
      return sphere(shape.radius, PRIMITIVE_RADIAL_SEGMENTS, PRIMITIVE_SPHERE_RINGS);
    case "cylinder":
      return cylinder(shape.radius, shape.radius, shape.height, PRIMITIVE_RADIAL_SEGMENTS);
    case "cone":
      return cylinder(shape.radius, 0, shape.height, PRIMITIVE_RADIAL_SEGMENTS);
    case "capsule":
      // Approximate a capsule by its closed bounding cylinder for now (the
      // SPHERICAL end caps are a future refinement); height spans body + both
      // radii.
      return cylinder(
        shape.radius,
        shape.radius,
        shape.height + 2 * shape.radius,
        PRIMITIVE_RADIAL_SEGMENTS,
      );
    default: {
      const unknown: { type: unknown } = shape as unknown as { type: unknown };
      throw new Error(`unknown primitive shape "${String(unknown.type)}"`);
    }
  }
};

const box: (w: number, h: number, d: number) => ITessellation = (w: number, h: number, d: number): ITessellation => {
  const x: number = w / 2;
  const y: number = h / 2;
  const z: number = d / 2;
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const faces: ReadonlyArray<[number[], number[]]> = [
    [
      [x, -y, -z, x, y, -z, x, y, z, x, -y, z],
      [1, 0, 0],
    ], // +X
    [
      [-x, -y, z, -x, y, z, -x, y, -z, -x, -y, -z],
      [-1, 0, 0],
    ], // -X
    [
      [-x, y, -z, -x, y, z, x, y, z, x, y, -z],
      [0, 1, 0],
    ], // +Y
    [
      [-x, -y, z, -x, -y, -z, x, -y, -z, x, -y, z],
      [0, -1, 0],
    ], // -Y
    [
      [-x, -y, z, x, -y, z, x, y, z, -x, y, z],
      [0, 0, 1],
    ], // +Z
    [
      [x, -y, -z, -x, -y, -z, -x, y, -z, x, y, -z],
      [0, 0, -1],
    ], // -Z
  ];
  for (const [verts, n] of faces) {
    const base: number = positions.length / 3;
    for (let i: number = 0; i < 4; ++i) {
      positions.push(verts[i * 3]!, verts[i * 3 + 1]!, verts[i * 3 + 2]!);
      normals.push(n[0]!, n[1]!, n[2]!);
    }
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  return { positions, normals, indices };
};

const sphere: (radius: number, segments: number, rings: number) => ITessellation = (
  radius: number,
  segments: number,
  rings: number,
): ITessellation => {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  for (let r: number = 0; r <= rings; ++r) {
    const phi: number = (r / rings) * Math.PI;
    const sinPhi: number = Math.sin(phi);
    const cosPhi: number = Math.cos(phi);
    for (let s: number = 0; s <= segments; ++s) {
      const theta: number = (s / segments) * Math.PI * 2;
      const nx: number = sinPhi * Math.cos(theta);
      const ny: number = cosPhi;
      const nz: number = sinPhi * Math.sin(theta);
      normals.push(nx, ny, nz);
      positions.push(nx * radius, ny * radius, nz * radius);
    }
  }
  const stride: number = segments + 1;
  // wind counter-clockwise seen from OUTSIDE (#1053), the glTF front-face
  // contract, and what a front-side renderer needs to not cull the surface
  for (let r: number = 0; r < rings; ++r)
    for (let s: number = 0; s < segments; ++s) {
      const a: number = r * stride + s;
      const b: number = a + stride;
      indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
  return { positions, normals, indices };
};

const cylinder: (radiusTop: number, radiusBottom: number, height: number, segments: number) => ITessellation = (
  radiusTop: number,
  radiusBottom: number,
  height: number,
  segments: number,
): ITessellation => {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const halfH: number = height / 2;
  // Side ring (top then bottom). The outward normal follows the SLANT (#1143):
  // the profile line (radiusTop, +h/2) → (radiusBottom, −h/2) has the outward
  // perpendicular (height, radiusBottom − radiusTop) in the (radial, y) plane,
  // which degenerates to the horizontal ring normal at equal radii.
  const slant: number = Math.hypot(height, radiusBottom - radiusTop);
  const nRadial: number = height / slant;
  const nY: number = (radiusBottom - radiusTop) / slant;
  for (let s: number = 0; s <= segments; ++s) {
    const theta: number = (s / segments) * Math.PI * 2;
    const cos: number = Math.cos(theta);
    const sin: number = Math.sin(theta);
    positions.push(cos * radiusTop, halfH, sin * radiusTop);
    normals.push(cos * nRadial, nY, sin * nRadial);
    positions.push(cos * radiusBottom, -halfH, sin * radiusBottom);
    normals.push(cos * nRadial, nY, sin * nRadial);
  }
  // counter-clockwise from outside, matching the sphere lattice (#1053)
  for (let s: number = 0; s < segments; ++s) {
    const a: number = s * 2;
    indices.push(a, a + 2, a + 1, a + 2, a + 3, a + 1);
  }
  // Cap disks close the solid (#1143): a fan per non-degenerate end, flat ±Y
  // normals, wound counter-clockwise seen from outside like everything else.
  // Without them the tube is open and a top-down framing sees through the prop.
  const cap: (radius: number, y: number, up: 1 | -1) => void = (radius: number, y: number, up: 1 | -1): void => {
    if (radius <= 0) return; // a cone's apex end is a point, not a disk
    const center: number = positions.length / 3;
    positions.push(0, y, 0);
    normals.push(0, up, 0);
    for (let s: number = 0; s <= segments; ++s) {
      const theta: number = (s / segments) * Math.PI * 2;
      positions.push(Math.cos(theta) * radius, y, Math.sin(theta) * radius);
      normals.push(0, up, 0);
    }
    for (let s: number = 0; s < segments; ++s) {
      const a: number = center + 1 + s;
      if (up === 1) indices.push(center, a + 1, a);
      else indices.push(center, a, a + 1);
    }
  };
  cap(radiusTop, halfH, 1);
  cap(radiusBottom, -halfH, -1);
  return { positions, normals, indices };
};
