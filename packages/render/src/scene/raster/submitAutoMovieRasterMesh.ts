import * as THREE from "three";

import type { IAutoMovieRasterFrame } from "./IAutoMovieRasterFrame.js";
import type { IAutoMovieRasterPaint } from "./IAutoMovieRasterPaint.js";
import { projectAutoMovieRasterPath } from "./projectAutoMovieRasterPath.js";
import { resolveAutoMovieRasterPaint } from "./resolveAutoMovieRasterPaint.js";

/**
 * Draw every triangle of one mesh into a frame, once per instance.
 *
 * Vertices take the mesh's morph targets and skinning through its own
 * `getVertexPosition`, so a pose matches the bones a GPU draws. Each triangle
 * is flat: one normal, one colour from its material's paint, culled by the
 * material's side, cut by the material's clipping planes and the near plane,
 * then filled with the depth test. A material with `wireframe` set draws its
 * triangles' three edges instead, one output pixel wide and without side
 * culling, each shaded as a front whichever way its triangle turns, because
 * a GPU reports every line as front-facing, and taking the paint's depth grey
 * as a fill does. A triangle without area has no
 * face and is not filled, while a wireframe still strokes its edges, so a
 * triangle collapsed onto a line shows in a wireframe as it does on a GPU.
 * Opaque triangles are filled at once; a transparent material's triangles are
 * queued on the frame with the mesh's render order for the transparent pass.
 *
 * A paint that displaces vertices, the outline shell, moves each posed vertex
 * along its skinned base normal; morph target normals are not applied to that
 * direction.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States where posed vertices come from, the order of culling, clipping and filling, what wireframe changes and how its edges face, what becomes of a triangle without area, where transparent triangles go and the one approximation in the displaced shell.
 * @evidence contracts/development/implementation.md#principled-implementation Facing is decided from the world-space face normal against the view vector, with a mirrored world matrix flipping the winding as three.js does, and clipping happens in world and clip space before the perspective division.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Three steps in order: resolve one paint per material, pose the local vertices once per distinct displacement, then for each instance place the vertices and submit each range's triangles through one triangle helper.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A mesh without positions draws nothing, and a triangle is found to be without area by its zero normal rather than by a tolerance, then left unfilled while a wireframe keeps its edges; textures and unknown shaders are counted on the frame's statistics instead of passing as exact.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in vertices times instances plus triangles; each vertex is posed once per displacement and transformed once per instance, however many triangles share it.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Paints, posed vertices and the world and clip arrays are shared by all triangles of the mesh, and the scratch vectors by every call.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Allocates three floats per vertex per displacement and seven per vertex for placement, all released with the call; only queued transparent triangles outlive it, on the frame.
 */
export function submitAutoMovieRasterMesh(
  frame: IAutoMovieRasterFrame,
  mesh: THREE.Mesh,
): void {
  const geometry: THREE.BufferGeometry = mesh.geometry;
  const position:
    | THREE.BufferAttribute
    | THREE.InterleavedBufferAttribute
    | undefined = geometry.getAttribute("position");
  if (position === undefined) return;

  // One paint per material, resolved before any triangle.
  const materials: THREE.Material[] = Array.isArray(mesh.material)
    ? mesh.material
    : [mesh.material];
  const paints: IAutoMovieRasterPaint[] = materials.map(
    (material: THREE.Material): IAutoMovieRasterPaint => {
      const paint: IAutoMovieRasterPaint = resolveAutoMovieRasterPaint(
        frame,
        material,
      );
      if ((material as { map?: unknown }).map) frame.statistics.untextured++;
      if (paint.approximated) frame.statistics.approximated++;
      return paint;
    },
  );

  // Index ranges by material, bounded by the geometry's draw range.
  const count: number = position.count;
  const index: THREE.BufferAttribute | null = geometry.getIndex();
  const total: number = index === null ? count : index.count;
  const ranges: IRange[] =
    Array.isArray(mesh.material) && geometry.groups.length > 0
      ? geometry.groups.map(
          (g: {
            start: number;
            count: number;
            materialIndex?: number;
          }): IRange => ({
            start: g.start,
            count: g.count,
            materialIndex: g.materialIndex ?? 0,
          }),
        )
      : [{ start: 0, count: total, materialIndex: 0 }];
  const drawStart: number = geometry.drawRange.start;
  const drawEnd: number = Math.min(total, drawStart + geometry.drawRange.count);

  // Posed local vertices, once per distinct displacement among the paints.
  const locals: Map<number, Float32Array> = new Map<number, Float32Array>();
  for (const paint of paints)
    if (!locals.has(paint.extrude))
      locals.set(paint.extrude, pose(mesh, position, paint.extrude));

  const instances: number =
    mesh instanceof THREE.InstancedMesh ? mesh.count : 1;
  const world: THREE.Matrix4 = new THREE.Matrix4();
  const instance: THREE.Matrix4 = new THREE.Matrix4();
  const draw: IDraw = {
    worlds: new Float32Array(count * 3),
    clips: new Float32Array(count * 4),
    mirrored: false,
    order: mesh.renderOrder,
    colors: geometry.getAttribute("color"),
    tint: new THREE.Color(),
  };
  for (let n: number = 0; n < instances; n++) {
    world.copy(mesh.matrixWorld);
    draw.tint.setRGB(1, 1, 1);
    if (mesh instanceof THREE.InstancedMesh) {
      mesh.getMatrixAt(n, instance);
      world.multiply(instance);
      if (mesh.instanceColor !== null) mesh.getColorAt(n, draw.tint);
    }
    frame.statistics.meshes++;
    draw.mirrored = world.determinant() < 0;

    for (const [extrude, local] of locals) {
      place(frame, local, world, draw);
      for (const range of ranges) {
        const material: THREE.Material | undefined =
          materials[range.materialIndex];
        const paint: IAutoMovieRasterPaint | undefined =
          paints[range.materialIndex];
        if (
          material === undefined ||
          paint === undefined ||
          paint.extrude !== extrude ||
          !material.visible ||
          material.opacity <= 0
        )
          continue;
        const start: number = Math.max(range.start, drawStart);
        const end: number = Math.min(range.start + range.count, drawEnd);
        for (let t: number = start; t + 2 < end; t += 3)
          triangle(
            frame,
            material,
            paint,
            draw,
            index === null ? t : index.getX(t),
            index === null ? t + 1 : index.getX(t + 1),
            index === null ? t + 2 : index.getX(t + 2),
          );
      }
    }
  }
}

/** A run of indices drawn with one material. */
interface IRange {
  /** First index of the run. */
  start: number;

  /** Number of indices in the run. */
  count: number;

  /** Position of the run's material in the mesh's material list. */
  materialIndex: number;
}

/** What the triangles of one instance share. */
interface IDraw {
  /** World metres, three per vertex. */
  worlds: Float32Array;

  /** Clip coordinates, four per vertex. */
  clips: Float32Array;

  /** Whether the instance's world matrix mirrors, which flips the winding. */
  mirrored: boolean;

  /** The mesh's `renderOrder`, the first sort key of its transparent triangles. */
  order: number;

  /** The geometry's vertex colours, when it has them. */
  colors: THREE.BufferAttribute | THREE.InterleavedBufferAttribute | undefined;

  /** The instance colour, white without one. */
  tint: THREE.Color;
}

/** Local vertex positions with morph targets, skinning and a normal displacement applied. */
function pose(
  mesh: THREE.Mesh,
  position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
  extrude: number,
): Float32Array {
  const geometry: THREE.BufferGeometry = mesh.geometry;
  const local: Float32Array = new Float32Array(position.count * 3);
  const vertex: THREE.Vector3 = new THREE.Vector3();
  const direction: THREE.Vector4 = new THREE.Vector4();
  const normals:
    | THREE.BufferAttribute
    | THREE.InterleavedBufferAttribute
    | undefined = extrude === 0 ? undefined : geometry.getAttribute("normal");
  const deformed: boolean =
    mesh instanceof THREE.SkinnedMesh ||
    (geometry.morphAttributes.position !== undefined &&
      (mesh.morphTargetInfluences ?? []).some((w: number): boolean => w !== 0));
  for (let i: number = 0; i < position.count; i++) {
    if (deformed) mesh.getVertexPosition(i, vertex);
    else vertex.fromBufferAttribute(position, i);

    // The shell's order: pose first, then move along the posed unit normal.
    if (normals !== undefined) {
      direction.set(normals.getX(i), normals.getY(i), normals.getZ(i), 0);
      if (mesh instanceof THREE.SkinnedMesh)
        mesh.applyBoneTransform(i, direction);
      const length: number = Math.hypot(direction.x, direction.y, direction.z);
      if (length > 0) {
        vertex.x += (direction.x / length) * extrude;
        vertex.y += (direction.y / length) * extrude;
        vertex.z += (direction.z / length) * extrude;
      }
    }
    local[i * 3] = vertex.x;
    local[i * 3 + 1] = vertex.y;
    local[i * 3 + 2] = vertex.z;
  }
  return local;
}

/** Write the world and clip coordinates of every vertex of one instance. */
function place(
  frame: IAutoMovieRasterFrame,
  local: Float32Array,
  world: THREE.Matrix4,
  draw: IDraw,
): void {
  const e: number[] = world.elements;
  const v: number[] = frame.viewProjection.elements;
  for (let i: number = 0; i * 3 < local.length; i++) {
    const x: number = local[i * 3]!;
    const y: number = local[i * 3 + 1]!;
    const z: number = local[i * 3 + 2]!;
    const wx: number = e[0]! * x + e[4]! * y + e[8]! * z + e[12]!;
    const wy: number = e[1]! * x + e[5]! * y + e[9]! * z + e[13]!;
    const wz: number = e[2]! * x + e[6]! * y + e[10]! * z + e[14]!;
    draw.worlds[i * 3] = wx;
    draw.worlds[i * 3 + 1] = wy;
    draw.worlds[i * 3 + 2] = wz;
    draw.clips[i * 4] = v[0]! * wx + v[4]! * wy + v[8]! * wz + v[12]!;
    draw.clips[i * 4 + 1] = v[1]! * wx + v[5]! * wy + v[9]! * wz + v[13]!;
    draw.clips[i * 4 + 2] = v[2]! * wx + v[6]! * wy + v[10]! * wz + v[14]!;
    draw.clips[i * 4 + 3] = v[3]! * wx + v[7]! * wy + v[11]! * wz + v[15]!;
  }
}

/** Scratch vectors shared by triangle submissions. */
const scratch: {
  ab: THREE.Vector3;
  ac: THREE.Vector3;
  normal: THREE.Vector3;
  centroid: THREE.Vector3;
  view: THREE.Vector3;
} = {
  ab: new THREE.Vector3(),
  ac: new THREE.Vector3(),
  normal: new THREE.Vector3(),
  centroid: new THREE.Vector3(),
  view: new THREE.Vector3(),
};

/** Cull, shade, clip and fill one triangle, or stroke its edges for a wireframe material. */
function triangle(
  frame: IAutoMovieRasterFrame,
  material: THREE.Material,
  paint: IAutoMovieRasterPaint,
  draw: IDraw,
  a: number,
  b: number,
  c: number,
): void {
  const { ab, ac, normal, centroid, view } = scratch;
  const w: Float32Array = draw.worlds;
  ab.set(
    w[b * 3]! - w[a * 3]!,
    w[b * 3 + 1]! - w[a * 3 + 1]!,
    w[b * 3 + 2]! - w[a * 3 + 2]!,
  );
  ac.set(
    w[c * 3]! - w[a * 3]!,
    w[c * 3 + 1]! - w[a * 3 + 1]!,
    w[c * 3 + 2]! - w[a * 3 + 2]!,
  );
  normal.crossVectors(ab, ac);
  const length: number = normal.length();
  const wire: boolean =
    (material as { wireframe?: boolean }).wireframe === true;
  // A triangle without area has no face to fill; a wireframe still strokes its edges, shaded with the zero normal.
  if (!(length > 0) && !(wire && length === 0)) return;
  if (length > 0) normal.divideScalar(draw.mirrored ? -length : length);
  centroid.set(
    (w[a * 3]! + w[b * 3]! + w[c * 3]!) / 3,
    (w[a * 3 + 1]! + w[b * 3 + 1]! + w[c * 3 + 1]!) / 3,
    (w[a * 3 + 2]! + w[b * 3 + 2]! + w[c * 3 + 2]!) / 3,
  );

  // Facing follows the material's side; a wireframe shows both sides.
  if (frame.orthographic) view.copy(frame.forward).negate();
  else view.subVectors(frame.eye, centroid);
  const front: boolean = normal.dot(view) > 0;
  if (!wire && material.side === THREE.FrontSide && !front) return;
  if (!wire && material.side === THREE.BackSide && front) return;
  // A GPU reports every line as front-facing, so a wireframe edge is shaded as a front whichever way its triangle turns.
  const facing: boolean = wire || front;
  if (!facing) normal.negate();

  // Tint: mean vertex colour times instance colour, linear RGB.
  const tint: [number, number, number] = [
    draw.tint.r,
    draw.tint.g,
    draw.tint.b,
  ];
  if (material.vertexColors && draw.colors !== undefined)
    for (let k: number = 0; k < 3; k++)
      tint[k] =
        tint[k]! *
        ((draw.colors.getComponent(a, k) +
          draw.colors.getComponent(b, k) +
          draw.colors.getComponent(c, k)) /
          3);
  const rgb: [number, number, number] = paint.shade(
    tint,
    centroid,
    normal,
    facing,
  );

  const path: number[][] = [a, b, c].map((i: number): number[] => [
    w[i * 3]!,
    w[i * 3 + 1]!,
    w[i * 3 + 2]!,
    draw.clips[i * 4]!,
    draw.clips[i * 4 + 1]!,
    draw.clips[i * 4 + 2]!,
    draw.clips[i * 4 + 3]!,
  ]);
  const planes: readonly THREE.Plane[] = material.clippingPlanes ?? [];

  // Wireframe: the three edges, each clipped on its own.
  if (wire) {
    for (let k: number = 0; k < 3; k++) {
      const edge: number[][] = projectAutoMovieRasterPath(
        frame,
        [path[k]!, path[(k + 1) % 3]!],
        planes,
      );
      if (edge.length === 2)
        frame.target.line(
          edge[0]![0]!,
          edge[0]![1]!,
          edge[0]![2]!,
          edge[1]![0]!,
          edge[1]![1]!,
          edge[1]![2]!,
          rgb,
          material.depthTest,
          frame.factor,
          paint.ramp,
        );
    }
    frame.statistics.triangles++;
    return;
  }

  // Surface: a fan over the clipped polygon.
  const screen: number[][] = projectAutoMovieRasterPath(frame, path, planes);
  const transparent: boolean = material.transparent && material.opacity < 1;
  for (let k: number = 1; k + 1 < screen.length; k++) {
    const vertices: IAutoMovieRasterFrame.ITransparent["vertices"] = [
      screen[0]![0]!,
      screen[0]![1]!,
      screen[0]![2]!,
      screen[k]![0]!,
      screen[k]![1]!,
      screen[k]![2]!,
      screen[k + 1]![0]!,
      screen[k + 1]![1]!,
      screen[k + 1]![2]!,
    ];
    frame.statistics.triangles++;
    if (transparent)
      frame.transparent.push({
        vertices,
        rgb,
        alpha: material.opacity,
        order: draw.order,
        depth: (vertices[2] + vertices[5] + vertices[8]) / 3,
        ramp: paint.ramp,
      });
    else
      frame.target.triangle(
        ...vertices,
        rgb,
        1,
        material.depthWrite,
        paint.ramp,
      );
  }
}
