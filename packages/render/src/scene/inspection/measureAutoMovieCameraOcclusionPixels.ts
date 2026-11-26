import type {
  IAutoMovieCameraInspection,
  IAutoMovieSemanticMaskBinding,
  IAutoMovieSemanticMaskEntry,
} from "@automovie/interface";
import * as THREE from "three";

import { AutoMovieThreeKind } from "../AutoMovieThreeKind.js";
import { autoMovieSemanticMaskOf } from "../semanticMask/autoMovieSemanticMaskOf.js";
import { maskRoots } from "../semanticMask/maskRoots.js";
import { nearest } from "../semanticMask/nearest.js";
import { hasMaterialDisplacement } from "./internal/hasMaterialDisplacement.js";
import { isAutoMovieFloat32Point } from "./isAutoMovieFloat32Point.js";
import { renderAutoMovieCameraOcclusionMasks } from "./renderAutoMovieCameraOcclusionMasks.js";

/** One full audit of an original placed Draw frame. */
interface IProps {
  /** Native Draw renderer, with the default framebuffer selected. */
  renderer: THREE.WebGLRenderer;

  /** Original scene before inspection, with its source semantic binding. */
  scene: THREE.Scene;

  /** Original delivery camera with the delivery aspect and crop realized. */
  camera: THREE.PerspectiveCamera;

  /** Source-resolved root of the current subject requirement. */
  target: THREE.Object3D;

  /** Delivered raster width in pixels. */
  width: number;

  /** Delivered raster height in pixels. */
  height: number;

  /** Native Draw samples along a side of each delivered pixel. */
  factor: 1 | 2;
}

/**
 * Measure target-only and composited pixel occupancy for an admitted Draw
 * frame.
 *
 * Only the delivered pixels the subject's projected bounds can reach are
 * rendered. The scratch framebuffer covers that rectangle, and the viewport
 * keeps the full delivery raster at a negative offset, so each scratch sample
 * is rasterized at the same position, by the same camera, as in the delivered
 * frame. Pixels outside the rectangle cannot hold the subject. The audit has no
 * budget: it runs only in the capture and delivery hosts, which must complete
 * it, so any refusal is a scene or renderer the binary masks cannot reproduce.
 *
 * @param props Renderer, original scene and camera, required subject and
 *   delivered raster.
 * @returns The isolated and visible pixel counts with the passes rendered, or
 *   the reason the frame cannot be audited this way.
 */
export function measureAutoMovieCameraOcclusionPixels(
  props: IProps,
): measureAutoMovieCameraOcclusionPixels.IResult {
  const { renderer, scene, camera, target, width, height, factor } = props;
  const sampleWidth: number = width * factor;
  const sampleHeight: number = height * factor;
  const unsupported: (
    reason: string,
  ) => measureAutoMovieCameraOcclusionPixels.IResult = (
    reason: string,
  ): measureAutoMovieCameraOcclusionPixels.IResult => ({
    status: "unsupported",
    reason,
  });
  if (
    (factor !== 1 && factor !== 2) ||
    ![width, height, sampleWidth * sampleHeight * 4].every(
      (value: number): boolean => value > 0,
    )
  )
    return unsupported("invalid delivery pixel audit request");

  const context: WebGLRenderingContext | WebGL2RenderingContext =
    renderer.getContext();
  const attributes: WebGLContextAttributes | null =
    context.getContextAttributes();
  if (
    renderer.getRenderTarget() !== null ||
    renderer.getPixelRatio() !== 1 ||
    renderer.getScissorTest() ||
    context.isContextLost() ||
    attributes === null ||
    !attributes.depth ||
    attributes.antialias ||
    attributes.stencil ||
    renderer.xr.enabled ||
    renderer.shadowMap.enabled ||
    !renderer.autoClear ||
    !renderer.autoClearColor ||
    !renderer.autoClearDepth ||
    renderer.clippingPlanes.length !== 0 ||
    renderer.capabilities.reversedDepthBuffer ||
    renderer.capabilities.logarithmicDepthBuffer ||
    camera.coordinateSystem !== THREE.WebGLCoordinateSystem ||
    camera.reversedDepth ||
    scene.overrideMaterial !== null ||
    !nativeRenderCallbacks(scene)
  )
    return unsupported("unsupported delivery render state");

  const depthBits: number = context.getParameter(context.DEPTH_BITS);
  const maxRenderbuffer: number = context.getParameter(
    context.MAX_RENDERBUFFER_SIZE,
  );
  const maximum: number = Math.min(
    maxRenderbuffer,
    renderer.capabilities.maxTextureSize,
  );
  const viewport: ArrayLike<number> = context.getParameter(
    context.MAX_VIEWPORT_DIMS,
  );
  if (
    depthBits < 16 ||
    depthBits > 32 ||
    !(sampleWidth <= (viewport[0] ?? 0)) ||
    !(sampleHeight <= (viewport[1] ?? 0))
  )
    return unsupported("unsupported delivery framebuffer");

  const binding: IAutoMovieSemanticMaskBinding | null =
    autoMovieSemanticMaskOf(scene);
  if (binding === null || scene.children.length < binding.design.nodes.length)
    return unsupported("no admitted source semantic binding");
  const roots: Map<THREE.Object3D, IAutoMovieSemanticMaskEntry> = maskRoots({
    scene,
    design: binding.design,
    mask: binding.mask,
  });
  const required: IAutoMovieSemanticMaskEntry | undefined = roots.get(target);
  if (
    required === undefined ||
    required.slot !== null ||
    required.kind === "instance-set" ||
    [...roots].some(
      ([node, entry]: [THREE.Object3D, IAutoMovieSemanticMaskEntry]): boolean =>
        node !== target && entry.id === required.id,
    )
  )
    return unsupported("ambiguous required subject mask root");

  camera.updateWorldMatrix(true, false);
  scene.updateMatrixWorld();
  const projection: THREE.Matrix4 = new THREE.Matrix4().multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse,
  );
  const subjects: renderAutoMovieCameraOcclusionMasks.IRange = {
    min: new THREE.Vector3(Infinity, Infinity, Infinity),
    max: new THREE.Vector3(-Infinity, -Infinity, -Infinity),
  };
  const drawables: renderAutoMovieCameraOcclusionMasks.IDrawable[] = [];
  let reason: string | undefined;
  scene.traverseVisible((object: THREE.Object3D): void => {
    if (reason !== undefined || !object.layers.test(camera.layers)) return;
    if (!AutoMovieThreeKind.isMesh(object)) {
      if (
        AutoMovieThreeKind.isLine(object) ||
        AutoMovieThreeKind.isPoints(object) ||
        AutoMovieThreeKind.isSprite(object)
      )
        reason = "unsupported drawable in delivery scene";
      return;
    }
    const material: THREE.Material | THREE.Material[] = object.material;
    if (AutoMovieThreeKind.isMaterial(material) && !material.visible) return;
    const position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute =
      object.geometry.getAttribute("position");
    if (
      object.constructor !== THREE.Mesh ||
      !nativeRenderCallbacks(object) ||
      object.geometry.morphAttributes.position?.length ||
      !AutoMovieThreeKind.isBufferAttribute(position) ||
      !AutoMovieThreeKind.isMaterial(material) ||
      !nativeOpaqueMaterial(material)
    ) {
      reason = "unsupported opaque coverage in delivery scene";
      return;
    }
    const bounds: THREE.Box3 = new THREE.Box3()
      .setFromBufferAttribute(position)
      .applyMatrix4(object.matrixWorld);
    const range: renderAutoMovieCameraOcclusionMasks.IRange | undefined =
      projectRange(bounds, projection);
    if (range === undefined) {
      reason = "unsupported clip-space bounds";
      return;
    }
    const onTarget: boolean = nearest(object, roots)?.id === required.id;
    if (onTarget) {
      subjects.min.min(range.min);
      subjects.max.max(range.max);
    }
    drawables.push({
      mesh: object,
      material,
      layers: object.layers.mask,
      required: onTarget,
      range,
    });
  });
  if (reason !== undefined) return unsupported(reason);
  if (subjects.min.x === Infinity)
    return unsupported("no admitted required drawable");

  const region: renderAutoMovieCameraOcclusionMasks.IRegion | undefined =
    subjectRegion(subjects, sampleWidth, sampleHeight, factor);
  if (region === undefined)
    return {
      status: "measured",
      passes: 0,
      pixels: { isolated: 0, visible: 0 },
    };
  if (region.width > maximum || region.height > maximum)
    return unsupported("unsupported delivery framebuffer");

  // A second, composite pass is needed only when a blocker may cover the subject.
  const depthMargin: number = 16 / (2 ** depthBits - 1);
  let passes: 1 | 2 = 1;
  for (const drawable of drawables) {
    if (drawable.required) continue;
    const { min, max } = drawable.range;
    if (
      max.x + 2 / sampleWidth < subjects.min.x ||
      min.x - 2 / sampleWidth > subjects.max.x ||
      max.y + 2 / sampleHeight < subjects.min.y ||
      min.y - 2 / sampleHeight > subjects.max.y ||
      min.z - depthMargin > subjects.max.z
    )
      continue;
    if (max.z + depthMargin >= subjects.min.z)
      return unsupported("ambiguous target and blocker depth order");
    passes = 2;
  }
  return renderAutoMovieCameraOcclusionMasks({
    renderer,
    scene,
    camera,
    sampleWidth,
    sampleHeight,
    region,
    factor,
    depthBits,
    drawables,
    passes,
  });
}

/** Outcomes of one delivery pixel audit. */
export namespace measureAutoMovieCameraOcclusionPixels {
  /** An exact matched count, or the reason the frame cannot be audited. */
  export type IResult =
    | {
        /** The subject's pixels were counted. */
        status: "measured";

        /**
         * Delivered pixels of the subject alone, and the subset still visible
         * in the composite.
         */
        pixels: IAutoMovieCameraInspection.IPixels;

        /** Passes rendered: zero when the subject's box misses the raster. */
        passes: 0 | 1 | 2;
      }
    | {
        /** The scene, renderer or subject cannot be audited with binary masks. */
        status: "unsupported";

        /** Why the audit refused. */
        reason: string;
      };
}

/**
 * Bounds the native samples the subject's projected box can reach, widened by
 * the same two-sample guard as the blocker overlap test and aligned outward to
 * whole delivered pixels. Undefined when the box misses the raster.
 */
function subjectRegion(
  subjects: renderAutoMovieCameraOcclusionMasks.IRange,
  sampleWidth: number,
  sampleHeight: number,
  factor: 1 | 2,
): renderAutoMovieCameraOcclusionMasks.IRegion | undefined {
  const span: (
    min: number,
    max: number,
    size: number,
  ) => [number, number] | undefined = (
    min: number,
    max: number,
    size: number,
  ): [number, number] | undefined => {
    const from: number = Math.max(
      0,
      Math.floor((Math.floor(((min + 1) / 2) * size) - 2) / factor) * factor,
    );
    const to: number = Math.min(
      size,
      Math.ceil((Math.ceil(((max + 1) / 2) * size) + 2) / factor) * factor,
    );
    return to > from ? [from, to] : undefined;
  };
  const x: [number, number] | undefined = span(
    subjects.min.x,
    subjects.max.x,
    sampleWidth,
  );
  const y: [number, number] | undefined = span(
    subjects.min.y,
    subjects.max.y,
    sampleHeight,
  );
  return x === undefined || y === undefined
    ? undefined
    : { x: x[0], y: y[0], width: x[1] - x[0], height: y[1] - y[0] };
}

/** Checks the native callbacks that could otherwise change either mask draw. */
function nativeRenderCallbacks(object: THREE.Object3D): boolean {
  return (
    object.onBeforeRender === THREE.Object3D.prototype.onBeforeRender &&
    object.onAfterRender === THREE.Object3D.prototype.onAfterRender
  );
}

/** Admits only built-in rigid surface coverage reproduced by the binary mask. */
function nativeOpaqueMaterial(material: THREE.Material): boolean {
  if (
    !(
      AutoMovieThreeKind.isMeshBasicMaterial(material) ||
      AutoMovieThreeKind.isMeshStandardMaterial(material) ||
      AutoMovieThreeKind.isMeshLambertMaterial(material) ||
      AutoMovieThreeKind.isMeshPhongMaterial(material)
    ) ||
    ![
      THREE.MeshBasicMaterial,
      THREE.MeshStandardMaterial,
      THREE.MeshLambertMaterial,
      THREE.MeshPhongMaterial,
    ].some((type: unknown): boolean => material.constructor === type)
  )
    return false;
  return (
    material.onBeforeCompile === THREE.Material.prototype.onBeforeCompile &&
    material.onBeforeRender === THREE.Material.prototype.onBeforeRender &&
    material.precision === null &&
    material.side === THREE.FrontSide &&
    !material.transparent &&
    material.opacity === 1 &&
    (material.blending === THREE.NormalBlending ||
      material.blending === THREE.NoBlending) &&
    material.alphaTest === 0 &&
    !material.alphaHash &&
    !material.alphaToCoverage &&
    !material.wireframe &&
    !material.polygonOffset &&
    !material.stencilWrite &&
    material.depthTest &&
    material.depthWrite &&
    material.depthFunc === THREE.LessEqualDepth &&
    material.colorWrite &&
    !material.clippingPlanes?.length &&
    !hasMaterialDisplacement(material)
  );
}

/** Projects the enclosing box only where the homogeneous divide is continuous. */
function projectRange(
  bounds: THREE.Box3,
  projection: THREE.Matrix4,
): renderAutoMovieCameraOcclusionMasks.IRange | undefined {
  if (bounds.isEmpty()) return undefined;
  const min: THREE.Vector3 = new THREE.Vector3(Infinity, Infinity, Infinity);
  const max: THREE.Vector3 = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
  const clip: THREE.Vector4 = new THREE.Vector4();
  const point: THREE.Vector3 = new THREE.Vector3();
  for (const x of [bounds.min.x, bounds.max.x])
    for (const y of [bounds.min.y, bounds.max.y])
      for (const z of [bounds.min.z, bounds.max.z]) {
        clip.set(x, y, z, 1).applyMatrix4(projection);
        if (!(clip.w > 0)) return undefined;
        point.set(clip.x / clip.w, clip.y / clip.w, clip.z / clip.w);
        if (!isAutoMovieFloat32Point(point)) return undefined;
        min.min(point);
        max.max(point);
      }
  return { min, max };
}
