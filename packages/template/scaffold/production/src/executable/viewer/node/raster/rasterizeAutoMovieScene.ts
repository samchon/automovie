import * as THREE from "three";

import { AutoMovieRasterLighting } from "./AutoMovieRasterLighting.js";
import { AutoMovieRasterTarget } from "./AutoMovieRasterTarget.js";
import type { IAutoMovieSceneRaster } from "./IAutoMovieSceneRaster.js";
import type { IRasterizeAutoMovieSceneProps } from "./IRasterizeAutoMovieSceneProps.js";

/**
 * Draw a three.js scene through its camera on the CPU, in Node, with no
 * browser or GPU: the inspection path for reading a film's poses, contacts,
 * staging and framing frame by frame.
 *
 * Visible meshes (including skinned, morphed and instanced meshes) are drawn
 * as flat-shaded triangles with a per-pixel depth buffer, honouring each
 * material's side, visibility, opacity, vertex or instance colours and
 * emissive colour; lit materials take the scene's lights through three.js's
 * Lambert convention and `MeshBasicMaterial` is unlit. Lines are drawn one
 * pixel wide; points are squares of their `PointsMaterial` size in output
 * pixels, attenuated by distance as three.js does when `sizeAttenuation` is
 * on; transparent surfaces are blended back to front after
 * opaque ones, and the result is converted to sRGB. Textures, shadows, fog,
 * sprites and post-processing are not drawn; the statistics count them.
 *
 * ```ts
 * production.seek(12.5);
 * const frame = rasterizeAutoMovieScene({ scene, camera, width: 720, height: 1280 });
 * await writeFile("f.png", encodeAutoMovieRasterPng(frame));
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment states the purpose, every drawn object kind and material property honoured, the shading convention, the transparency order and what is left out and where it is counted.
 * @evidence contracts/development/implementation.md#principled-implementation Vertices go through the camera's own projection and view matrices and are clipped against the near plane in clip space before division, so geometry behind the camera never wraps; skinned and morphed vertices come from three.js's own getVertexPosition, so poses match the Viewer's bones.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Traversal submits primitives; the raster target owns buffers and fills, the lighting owns irradiance, and transparent triangles are queued and drawn after the opaque pass.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Invalid raster sizes and supersampling factors throw; unsupported objects and materials are counted rather than silently dropped or guessed.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each mesh's vertices are transformed once per instance and shared by its triangles; triangle fill cost is bounded by each triangle's clipped bounding box.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Lights are flattened once per frame and scratch vectors are reused across triangles.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The frame allocates its buffers and per-mesh vertex arrays and keeps only the returned bytes; the scene and camera are read, never retained or modified beyond three.js's own world-matrix update.
 */
export function rasterizeAutoMovieScene(
  props: IRasterizeAutoMovieSceneProps,
): IAutoMovieSceneRaster {
  const factor: number = props.supersample ?? 1;
  if (
    ![props.width, props.height].every(
      (size: number): boolean => Number.isSafeInteger(size) && size > 0,
    ) ||
    props.width * props.height > 33_177_600
  )
    throw new Error("Raster size must be positive integers within 8K UHD");
  if (!Number.isSafeInteger(factor) || factor < 1 || factor > 4)
    throw new Error("Supersampling must be an integer from 1 to 4");

  const { scene, camera } = props;
  scene.updateMatrixWorld();
  if (camera.parent === null) camera.updateMatrixWorld();
  const width: number = props.width * factor;
  const height: number = props.height * factor;
  const background: THREE.Color =
    scene instanceof THREE.Scene && scene.background instanceof THREE.Color
      ? scene.background
      : new THREE.Color(props.background ?? 0x202020);
  const target: AutoMovieRasterTarget = new AutoMovieRasterTarget(
    width,
    height,
    [background.r, background.g, background.b],
  );
  const statistics: IAutoMovieSceneRaster.IStatistics = {
    meshes: 0,
    triangles: 0,
    lines: 0,
    points: 0,
    skipped: {},
    untextured: 0,
    approximated: 0,
  };
  const frame: IFrame = {
    target,
    statistics,
    lighting: new AutoMovieRasterLighting(scene, camera),
    viewProjection: new THREE.Matrix4().multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse,
    ),
    eye: new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld),
    forward: new THREE.Vector3(0, 0, -1).transformDirection(camera.matrixWorld),
    orthographic: camera instanceof THREE.OrthographicCamera,
    transparent: [],
    factor,
  };

  // Opaque primitives first, in traversal order; the depth buffer resolves visibility.
  scene.traverseVisible((object: THREE.Object3D): void => {
    if (object instanceof THREE.Mesh) {
      if ((object as { isBatchedMesh?: boolean }).isBatchedMesh === true)
        skip(statistics, object.type);
      else submitMesh(frame, object);
    } else if (object instanceof THREE.Line) submitLine(frame, object);
    else if (object instanceof THREE.Points) submitPoints(frame, object);
    else if (object instanceof THREE.Sprite) skip(statistics, object.type);
  });

  // Transparent surfaces blend far to near without writing depth, as the Viewer sorts them.
  frame.transparent.sort(
    (a: ITransparent, b: ITransparent): number => b.depth - a.depth,
  );
  for (const t of frame.transparent)
    target.triangle(...t.vertices, t.rgb, t.alpha, false);

  return {
    width: props.width,
    height: props.height,
    pixels: target.toSrgb(factor),
    statistics,
  };
}

/** Everything one frame's submissions share. */
interface IFrame {
  target: AutoMovieRasterTarget;
  statistics: IAutoMovieSceneRaster.IStatistics;
  lighting: AutoMovieRasterLighting;
  viewProjection: THREE.Matrix4;
  eye: THREE.Vector3;
  forward: THREE.Vector3;
  orthographic: boolean;
  transparent: ITransparent[];
  /** Supersampling factor: target pixels per output pixel along each axis. */
  factor: number;
}

/** One queued transparent triangle in screen coordinates. */
interface ITransparent {
  vertices: [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  rgb: [number, number, number];
  alpha: number;
  depth: number;
}

/** Count a visible object this rasterizer does not draw. */
function skip(
  statistics: IAutoMovieSceneRaster.IStatistics,
  type: string,
): void {
  statistics.skipped[type] = (statistics.skipped[type] ?? 0) + 1;
}

/** Submit every triangle of a mesh, once per instance. */
function submitMesh(frame: IFrame, mesh: THREE.Mesh): void {
  const geometry: THREE.BufferGeometry = mesh.geometry;
  const position:
    | THREE.BufferAttribute
    | THREE.InterleavedBufferAttribute
    | undefined = geometry.getAttribute("position");
  if (position === undefined) return;
  const materials: THREE.Material[] = Array.isArray(mesh.material)
    ? mesh.material
    : [mesh.material];
  for (const material of materials) {
    if ((material as { map?: unknown }).map) frame.statistics.untextured++;
    if (material instanceof THREE.ShaderMaterial)
      frame.statistics.approximated++;
  }

  // Local vertex positions with morph targets and skinning applied once.
  const count: number = position.count;
  const local: Float32Array = new Float32Array(count * 3);
  const vertex: THREE.Vector3 = new THREE.Vector3();
  const deformed: boolean =
    mesh instanceof THREE.SkinnedMesh ||
    (geometry.morphAttributes.position !== undefined &&
      (mesh.morphTargetInfluences ?? []).some((w: number): boolean => w !== 0));
  for (let i: number = 0; i < count; i++) {
    if (deformed) mesh.getVertexPosition(i, vertex);
    else vertex.fromBufferAttribute(position, i);
    local[i * 3] = vertex.x;
    local[i * 3 + 1] = vertex.y;
    local[i * 3 + 2] = vertex.z;
  }

  const index: THREE.BufferAttribute | null = geometry.getIndex();
  const total: number = index === null ? count : index.count;
  const ranges: { start: number; count: number; materialIndex: number }[] =
    Array.isArray(mesh.material) && geometry.groups.length > 0
      ? geometry.groups.map(
          (g: {
            start: number;
            count: number;
            materialIndex?: number;
          }): {
            start: number;
            count: number;
            materialIndex: number;
          } => ({
            start: g.start,
            count: g.count,
            materialIndex: g.materialIndex ?? 0,
          }),
        )
      : [{ start: 0, count: total, materialIndex: 0 }];
  const drawStart: number = geometry.drawRange.start;
  const drawEnd: number = Math.min(total, drawStart + geometry.drawRange.count);
  const colors:
    | THREE.BufferAttribute
    | THREE.InterleavedBufferAttribute
    | undefined = geometry.getAttribute("color");
  const instances: number =
    mesh instanceof THREE.InstancedMesh ? mesh.count : 1;
  const world: THREE.Matrix4 = new THREE.Matrix4();
  const instance: THREE.Matrix4 = new THREE.Matrix4();
  const tint: THREE.Color = new THREE.Color();
  const worlds: Float32Array = new Float32Array(count * 3);
  const clips: Float32Array = new Float32Array(count * 4);
  const p: THREE.Vector4 = new THREE.Vector4();

  for (let n: number = 0; n < instances; n++) {
    world.copy(mesh.matrixWorld);
    tint.setRGB(1, 1, 1);
    if (mesh instanceof THREE.InstancedMesh) {
      mesh.getMatrixAt(n, instance);
      world.multiply(instance);
      if (mesh.instanceColor !== null) mesh.getColorAt(n, tint);
    }
    frame.statistics.meshes++;
    const mirrored: boolean = world.determinant() < 0;

    // World and clip coordinates of every vertex of this instance.
    const e: number[] = world.elements;
    const v: number[] = frame.viewProjection.elements;
    for (let i: number = 0; i < count; i++) {
      const x: number = local[i * 3]!;
      const y: number = local[i * 3 + 1]!;
      const z: number = local[i * 3 + 2]!;
      const wx: number = e[0]! * x + e[4]! * y + e[8]! * z + e[12]!;
      const wy: number = e[1]! * x + e[5]! * y + e[9]! * z + e[13]!;
      const wz: number = e[2]! * x + e[6]! * y + e[10]! * z + e[14]!;
      worlds[i * 3] = wx;
      worlds[i * 3 + 1] = wy;
      worlds[i * 3 + 2] = wz;
      p.set(
        v[0]! * wx + v[4]! * wy + v[8]! * wz + v[12]!,
        v[1]! * wx + v[5]! * wy + v[9]! * wz + v[13]!,
        v[2]! * wx + v[6]! * wy + v[10]! * wz + v[14]!,
        v[3]! * wx + v[7]! * wy + v[11]! * wz + v[15]!,
      );
      clips[i * 4] = p.x;
      clips[i * 4 + 1] = p.y;
      clips[i * 4 + 2] = p.z;
      clips[i * 4 + 3] = p.w;
    }

    for (const range of ranges) {
      const material: THREE.Material | undefined =
        materials[range.materialIndex];
      if (material === undefined || !material.visible || material.opacity <= 0)
        continue;
      const start: number = Math.max(range.start, drawStart);
      const end: number = Math.min(range.start + range.count, drawEnd);
      for (let t: number = start; t + 2 < end; t += 3) {
        const a: number = index === null ? t : index.getX(t);
        const b: number = index === null ? t + 1 : index.getX(t + 1);
        const c: number = index === null ? t + 2 : index.getX(t + 2);
        submitTriangle(
          frame,
          material,
          worlds,
          clips,
          a,
          b,
          c,
          mirrored,
          colors,
          tint,
        );
      }
    }
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

/** Cull, shade, clip and fill one triangle of a mesh. */
function submitTriangle(
  frame: IFrame,
  material: THREE.Material,
  worlds: Float32Array,
  clips: Float32Array,
  a: number,
  b: number,
  c: number,
  mirrored: boolean,
  colors: THREE.BufferAttribute | THREE.InterleavedBufferAttribute | undefined,
  tint: THREE.Color,
): void {
  const { ab, ac, normal, centroid, view } = scratch;
  ab.set(
    worlds[b * 3]! - worlds[a * 3]!,
    worlds[b * 3 + 1]! - worlds[a * 3 + 1]!,
    worlds[b * 3 + 2]! - worlds[a * 3 + 2]!,
  );
  ac.set(
    worlds[c * 3]! - worlds[a * 3]!,
    worlds[c * 3 + 1]! - worlds[a * 3 + 1]!,
    worlds[c * 3 + 2]! - worlds[a * 3 + 2]!,
  );
  normal.crossVectors(ab, ac);
  const length: number = normal.length();
  if (!(length > 0)) return;
  normal.divideScalar(mirrored ? -length : length);
  centroid.set(
    (worlds[a * 3]! + worlds[b * 3]! + worlds[c * 3]!) / 3,
    (worlds[a * 3 + 1]! + worlds[b * 3 + 1]! + worlds[c * 3 + 1]!) / 3,
    (worlds[a * 3 + 2]! + worlds[b * 3 + 2]! + worlds[c * 3 + 2]!) / 3,
  );

  // Facing follows the material's side, with the normal turned toward the viewer when both sides draw.
  if (frame.orthographic) view.copy(frame.forward).negate();
  else view.subVectors(frame.eye, centroid);
  const front: boolean = normal.dot(view) > 0;
  if (material.side === THREE.FrontSide && !front) return;
  if (material.side === THREE.BackSide && front) return;
  if (!front) normal.negate();

  // Base colour: material colour, vertex colours and instance colour, linear RGB.
  const base: [number, number, number] = baseColor(material);
  if (material.vertexColors && colors !== undefined)
    for (let k: number = 0; k < 3; k++)
      base[k] =
        base[k]! *
        ((colors.getComponent(a, k) +
          colors.getComponent(b, k) +
          colors.getComponent(c, k)) /
          3);
  base[0] *= tint.r;
  base[1] *= tint.g;
  base[2] *= tint.b;
  const rgb: [number, number, number] = shade(
    frame,
    material,
    base,
    centroid,
    normal,
  );

  const polygon: number[][] = clipNear(
    [a, b, c].map((i: number): number[] => [
      clips[i * 4]!,
      clips[i * 4 + 1]!,
      clips[i * 4 + 2]!,
      clips[i * 4 + 3]!,
    ]),
  );
  if (polygon.length < 3) return;
  const screen: number[][] = polygon.map((q: number[]): number[] =>
    toScreen(frame.target, q),
  );
  const transparent: boolean = material.transparent && material.opacity < 1;
  for (let k: number = 1; k + 1 < screen.length; k++) {
    const vertices: ITransparent["vertices"] = [
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
        depth: (vertices[2] + vertices[5] + vertices[8]) / 3,
      });
    else frame.target.triangle(...vertices, rgb, 1, material.depthWrite);
  }
}

/** A material's linear base colour, or neutral clay for shader materials. */
function baseColor(material: THREE.Material): [number, number, number] {
  const color: unknown = (material as { color?: unknown }).color;
  if (
    material instanceof THREE.ShaderMaterial ||
    !(color instanceof THREE.Color)
  )
    return [0.6, 0.6, 0.6];
  return [color.r, color.g, color.b];
}

/** Lit or unlit colour of a surface point, including emission. */
function shade(
  frame: IFrame,
  material: THREE.Material,
  base: [number, number, number],
  point: THREE.Vector3,
  normal: THREE.Vector3,
): [number, number, number] {
  const unlit: boolean =
    material instanceof THREE.MeshBasicMaterial ||
    material instanceof THREE.MeshNormalMaterial ||
    material instanceof THREE.ShaderMaterial;
  let rgb: [number, number, number] = base;
  if (!unlit) {
    const metalness: number =
      (material as { metalness?: number }).metalness ?? 0;
    const irradiance: [number, number, number] = frame.lighting.irradiance(
      point,
      normal,
    );
    const diffuse: number = (1 - metalness) / Math.PI;
    rgb = [
      base[0] * irradiance[0] * diffuse,
      base[1] * irradiance[1] * diffuse,
      base[2] * irradiance[2] * diffuse,
    ];
  }
  const emissive: unknown = (material as { emissive?: unknown }).emissive;
  if (emissive instanceof THREE.Color) {
    const intensity: number =
      (material as { emissiveIntensity?: number }).emissiveIntensity ?? 1;
    rgb = [
      rgb[0] + emissive.r * intensity,
      rgb[1] + emissive.g * intensity,
      rgb[2] + emissive.b * intensity,
    ];
  }
  return rgb;
}

/** Clip a clip-space polygon against the near plane `z >= -w`. */
function clipNear(polygon: number[][]): number[][] {
  const out: number[][] = [];
  for (let i: number = 0; i < polygon.length; i++) {
    const current: number[] = polygon[i]!;
    const next: number[] = polygon[(i + 1) % polygon.length]!;
    const dc: number = current[2]! + current[3]!;
    const dn: number = next[2]! + next[3]!;
    if (dc >= 0) out.push(current);
    if (dc >= 0 !== dn >= 0) {
      const t: number = dc / (dc - dn);
      out.push(
        current.map(
          (value: number, k: number): number => value + (next[k]! - value) * t,
        ),
      );
    }
  }
  return out;
}

/** Perspective-divide a clip-space point into target pixels and device depth. */
function toScreen(target: AutoMovieRasterTarget, q: number[]): number[] {
  const clipW: number = q[3]!;
  const w: number = clipW === 0 ? 1e-9 : clipW;
  return [
    ((q[0]! / w) * 0.5 + 0.5) * target.width,
    (1 - ((q[1]! / w) * 0.5 + 0.5)) * target.height,
    q[2]! / w,
  ];
}

/** Draw a line object's segments, depth-tested unless its material disables it. */
function submitLine(frame: IFrame, line: THREE.Line): void {
  const position:
    | THREE.BufferAttribute
    | THREE.InterleavedBufferAttribute
    | undefined = line.geometry.getAttribute("position");
  const material: THREE.Material = Array.isArray(line.material)
    ? line.material[0]!
    : line.material;
  if (position === undefined || material === undefined || !material.visible)
    return;
  const rgb: [number, number, number] = baseColor(material);
  const stride: number = line instanceof THREE.LineSegments ? 2 : 1;
  const index: THREE.BufferAttribute | null = line.geometry.getIndex();
  const count: number = index === null ? position.count : index.count;
  const at: (k: number) => number = (k: number): number =>
    index === null ? k : index.getX(k);
  const loop: boolean = line instanceof THREE.LineLoop;
  const matrix: THREE.Matrix4 = new THREE.Matrix4().multiplyMatrices(
    frame.viewProjection,
    line.matrixWorld,
  );
  const a: THREE.Vector4 = new THREE.Vector4();
  const b: THREE.Vector4 = new THREE.Vector4();
  for (let k: number = 0; k + 1 < count + (loop ? 1 : 0); k += stride) {
    a.set(
      position.getX(at(k)),
      position.getY(at(k)),
      position.getZ(at(k)),
      1,
    ).applyMatrix4(matrix);
    const j: number = at((k + 1) % count);
    b.set(position.getX(j), position.getY(j), position.getZ(j), 1).applyMatrix4(
      matrix,
    );
    const clipped: number[][] = clipSegment(
      [a.x, a.y, a.z, a.w],
      [b.x, b.y, b.z, b.w],
    );
    if (clipped.length < 2) continue;
    const p: number[] = toScreen(frame.target, clipped[0]!);
    const q: number[] = toScreen(frame.target, clipped[1]!);
    frame.target.line(
      p[0]!,
      p[1]!,
      p[2]!,
      q[0]!,
      q[1]!,
      q[2]!,
      rgb,
      material.depthTest,
    );
    frame.statistics.lines++;
  }
}

/** Clip a clip-space segment against the near plane. */
function clipSegment(a: number[], b: number[]): number[][] {
  const da: number = a[2]! + a[3]!;
  const db: number = b[2]! + b[3]!;
  if (da < 0 && db < 0) return [];
  if (da >= 0 && db >= 0) return [a, b];
  const t: number = da / (da - db);
  const cut: number[] = a.map(
    (value: number, k: number): number => value + (b[k]! - value) * t,
  );
  return da >= 0 ? [a, cut] : [cut, b];
}

/** Draw a points object's vertices as small depth-tested squares. */
function submitPoints(frame: IFrame, points: THREE.Points): void {
  const position:
    | THREE.BufferAttribute
    | THREE.InterleavedBufferAttribute
    | undefined = points.geometry.getAttribute("position");
  const material: THREE.Material = Array.isArray(points.material)
    ? points.material[0]!
    : points.material;
  if (position === undefined || material === undefined || !material.visible)
    return;
  const rgb: [number, number, number] = baseColor(material);
  const matrix: THREE.Matrix4 = new THREE.Matrix4().multiplyMatrices(
    frame.viewProjection,
    points.matrixWorld,
  );
  // three.js draws a point `size` drawing-buffer pixels wide, times half the
  // buffer height over view depth when attenuated in perspective.
  const size: number =
    material instanceof THREE.PointsMaterial ? material.size : 1;
  const attenuate: boolean =
    material instanceof THREE.PointsMaterial &&
    material.sizeAttenuation &&
    !frame.orthographic;
  const p: THREE.Vector4 = new THREE.Vector4();
  for (let k: number = 0; k < position.count; k++) {
    p.set(position.getX(k), position.getY(k), position.getZ(k), 1).applyMatrix4(
      matrix,
    );
    if (p.w <= 0 || p.z < -p.w) continue;
    const s: number[] = toScreen(frame.target, [p.x, p.y, p.z, p.w]);
    const width: number =
      size *
      frame.factor *
      (attenuate ? frame.target.height / (2 * frame.factor) / p.w : 1);
    const radius: number = Math.max(0, Math.round((width - 1) / 2));
    frame.target.point(s[0]!, s[1]!, s[2]!, radius, rgb, material.depthTest);
    frame.statistics.points++;
  }
}
