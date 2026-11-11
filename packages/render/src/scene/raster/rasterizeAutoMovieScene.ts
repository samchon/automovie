import * as THREE from "three";

import { AutoMovieRasterLighting } from "./AutoMovieRasterLighting.js";
import { AutoMovieRasterTarget } from "./AutoMovieRasterTarget.js";
import type { IAutoMovieRasterFrame } from "./IAutoMovieRasterFrame.js";
import type { IAutoMovieSceneRaster } from "./IAutoMovieSceneRaster.js";
import type { IRasterizeAutoMovieSceneProps } from "./IRasterizeAutoMovieSceneProps.js";
import { proxyAutoMovieRasterLineSegments } from "./proxyAutoMovieRasterLineSegments.js";
import { submitAutoMovieRasterMesh } from "./submitAutoMovieRasterMesh.js";
import { submitAutoMovieRasterStrokes } from "./submitAutoMovieRasterStrokes.js";

/**
 * Draw a three.js scene through its camera on the CPU, with no browser or
 * GPU: the inspection path for reading a form, a pose, a contact, staging and
 * framing frame by frame, in Node or anywhere else.
 *
 * An object is drawn when it and its ancestors are visible and it is on a
 * layer the camera sees, which three.js tests per object, not per subtree.
 * Visible meshes (including skinned, morphed and instanced meshes) are drawn
 * as flat-shaded triangles with a per-pixel depth buffer, honouring each
 * material's side, visibility, opacity, wireframe flag, clipping planes,
 * vertex or instance colours and emissive colour; lit materials take the
 * scene's lights through three.js's Lambert convention and
 * `MeshBasicMaterial` is unlit. The materials the structural render passes
 * install are reproduced as data: depth as a per-pixel grey, the normal pass
 * as a packed view-space normal, the outline pass as its displaced white
 * shell over black fills. Lines take their material's width, vertex colours
 * and clipping planes, and a screen-space `LineSegments2` is drawn as its
 * segments at its `LineMaterial` width; points are squares of their `PointsMaterial` size.
 * Opaque objects are drawn in ascending `renderOrder`, and in scene order
 * where that is equal, so a stroke whose material has the depth test off
 * stays on top only of what is drawn before it; a group's own `renderOrder`
 * is not read. After them comes the transparent pass, as three.js draws its
 * transparent list after its opaque one: the triangles of transparent
 * surfaces, blended without writing depth, and the lines and points whose
 * material is flagged `transparent`, in ascending `renderOrder` and from far
 * to near where that is equal. A triangle is sorted by its own depth and a
 * line or point object by its origin's, and where both keys are equal the
 * triangle is drawn first. A stroke flagged `transparent` with the highest
 * render order is therefore drawn over every transparent surface too. The
 * result is converted to sRGB. Textures, shadows, fog, sprites and
 * post-processing are not drawn; the statistics count them.
 *
 * ```ts
 * production.seek(12.5);
 * const frame = rasterizeAutoMovieScene({ scene, camera, width: 720, height: 1280 });
 * await writeFile("f.png", await encodeAutoMovieRasterPng(frame));
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment states the purpose, every drawn object kind and material property honoured, which pass materials are reproduced as data, the opaque order, the transparent pass with its two sort keys, and what is left out and where it is counted.
 * @evidence contracts/development/implementation.md#principled-implementation The frame carries the camera's own view and projection matrices, so every submitter clips before the perspective division and recovers depth with the same projection that produced it.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Validation, frame construction, one traversal that collects the drawn objects, the opaque ones submitted in render order, then one merge of the sorted transparent triangles with the sorted transparent strokes; the target owns buffers and fills, the lighting owns irradiance and the submitters own primitives.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Invalid raster sizes and supersampling factors throw; unsupported objects are counted by type rather than silently dropped.
 * @evidence contracts/development/implementation.md#efficient-algorithms One traversal of the visible scene; the drawn objects, the transparent triangles and the transparent strokes are each sorted once and merged in one pass, and fill cost is bounded by each triangle's clipped bounding box.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Lights and camera matrices are flattened once per frame and shared by every submission.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The frame allocates its buffers and keeps only the returned bytes; the scene and camera are read, never retained or modified beyond three.js's own world-matrix update.
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
  const background: THREE.Color =
    scene instanceof THREE.Scene && scene.background instanceof THREE.Color
      ? scene.background
      : new THREE.Color(props.background ?? 0x202020);
  const frame: IAutoMovieRasterFrame = {
    target: new AutoMovieRasterTarget(
      props.width * factor,
      props.height * factor,
      [background.r, background.g, background.b],
    ),
    statistics: {
      meshes: 0,
      triangles: 0,
      lines: 0,
      points: 0,
      skipped: {},
      untextured: 0,
      approximated: 0,
    },
    lighting: new AutoMovieRasterLighting(scene, camera),
    viewProjection: new THREE.Matrix4().multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse,
    ),
    view: camera.matrixWorldInverse.clone(),
    projection: camera.projectionMatrix.clone(),
    eye: new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld),
    forward: new THREE.Vector3(0, 0, -1).transformDirection(camera.matrixWorld),
    orthographic: camera instanceof THREE.OrthographicCamera,
    transparent: [],
    factor,
  };

  // Opaque primitives first. The depth buffer resolves visibility, so their order shows only where a material leaves the depth test or the depth write off.
  const skip: (type: string) => void = (type: string): void => {
    frame.statistics.skipped[type] = (frame.statistics.skipped[type] ?? 0) + 1;
  };
  const drawn: (THREE.Mesh | THREE.Line | THREE.Points)[] = [];
  scene.traverseVisible((object: THREE.Object3D): void => {
    // A layer mismatch leaves this object out and still visits its children, as three.js does.
    if (!object.layers.test(camera.layers)) return;

    // A screen-space line is a mesh of widened quads; its segments are drawn as lines of its width.
    if ((object as { isLineSegments2?: boolean }).isLineSegments2 === true)
      drawn.push(proxyAutoMovieRasterLineSegments(object as THREE.Mesh));
    else if (object instanceof THREE.Mesh) {
      if ((object as { isBatchedMesh?: boolean }).isBatchedMesh === true)
        skip(object.type);
      else drawn.push(object);
    } else if (object instanceof THREE.Line || object instanceof THREE.Points)
      drawn.push(object);
    else if (object instanceof THREE.Sprite) skip(object.type);
  });
  // The sort is stable, so objects of one render order keep their traversal order.
  drawn.sort(
    (a: THREE.Object3D, b: THREE.Object3D): number =>
      a.renderOrder - b.renderOrder,
  );
  // A mesh queues its own transparent triangles; a line or point object whose material is flagged transparent is held back whole, keyed by its origin's device depth.
  const held: { object: THREE.Line | THREE.Points; depth: number }[] = [];
  const origin: THREE.Vector3 = new THREE.Vector3();
  for (const object of drawn)
    if (object instanceof THREE.Mesh) submitAutoMovieRasterMesh(frame, object);
    else if (
      (Array.isArray(object.material) ? object.material[0] : object.material)
        ?.transparent === true
    )
      held.push({
        object,
        depth: origin
          .setFromMatrixPosition(object.matrixWorld)
          .applyMatrix4(frame.viewProjection).z,
      });
    else submitAutoMovieRasterStrokes(frame, object);

  // The transparent pass: ascending render order, then far to near, as three.js sorts its transparent list. Both sorts are stable.
  frame.transparent.sort(
    (
      a: IAutoMovieRasterFrame.ITransparent,
      b: IAutoMovieRasterFrame.ITransparent,
    ): number => a.order - b.order || b.depth - a.depth,
  );
  held.sort(
    (
      a: { object: THREE.Object3D; depth: number },
      b: { object: THREE.Object3D; depth: number },
    ): number =>
      a.object.renderOrder - b.object.renderOrder || b.depth - a.depth,
  );
  let next: number = 0;
  for (const t of frame.transparent) {
    // Every held stroke that sorts strictly before this triangle is drawn first.
    for (; next < held.length; next++) {
      const stroke: { object: THREE.Line | THREE.Points; depth: number } =
        held[next]!;
      if (
        stroke.object.renderOrder > t.order ||
        (stroke.object.renderOrder === t.order && stroke.depth <= t.depth)
      )
        break;
      submitAutoMovieRasterStrokes(frame, stroke.object);
    }
    frame.target.triangle(...t.vertices, t.rgb, t.alpha, false, t.ramp);
  }
  for (; next < held.length; next++)
    submitAutoMovieRasterStrokes(frame, held[next]!.object);

  return {
    width: props.width,
    height: props.height,
    pixels: frame.target.toSrgb(factor),
    statistics: frame.statistics,
  };
}
