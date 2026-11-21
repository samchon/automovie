import type {
  IAutoMovieCameraInspection,
  IAutoMovieSemanticMaskBinding,
  IAutoMovieSemanticMaskEntry,
} from "@automovie/interface";
import * as THREE from "three";

import { captureAutoMovieFramebufferRestore } from "../captureAutoMovieFramebufferRestore.js";
import { restoreAutoMovieRenderModeState } from "../restoreAutoMovieRenderModeState.js";
import { autoMovieSemanticMaskOf } from "../semanticMask/autoMovieSemanticMaskOf.js";
import { maskRoots } from "../semanticMask/maskRoots.js";
import { nearest } from "../semanticMask/nearest.js";
import { countAutoMovieCameraOcclusionPixels } from "./countAutoMovieCameraOcclusionPixels.js";

/** One explicitly scheduled full audit of an original placed Draw frame. */
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

  /** Total native samples available to the one or two audit passes. */
  maxSamples: number;

  /** Total geometry entry budget in triangles across the audit passes. */
  maxTriangles: number;
}

/**
 * An exact matched count, or the specific reason to leave coverage open. Both
 * report the native samples actually rendered, which the caller's per-frame
 * budget pays for.
 */
type IResult =
  | {
      status: "measured";
      pixels: IAutoMovieCameraInspection.IPixels;
      passes: 0 | 1 | 2;
      samples: number;
    }
  | { status: "deferred"; reason: string; samples: number };

/** Native sample rectangle of the delivery raster, origin at the bottom left. */
interface IRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Conservative clip-space interval of a drawable's world envelope. */
interface IRange {
  /** Left, bottom and near extents in divided clip coordinates. */
  min: THREE.Vector3;

  /** Right, top and far extents in divided clip coordinates. */
  max: THREE.Vector3;
}

/** Borrowed drawable state and its admitted semantic/depth membership. */
interface IDrawable {
  /** Original ordinary rigid mesh. */
  mesh: THREE.Mesh;

  /** Original unswapped material. */
  material: THREE.Material;

  /** Original layer mask, including all non-camera layers. */
  layers: number;

  /** Membership in the exact source semantic identity. */
  required: boolean;

  /** Projected interval of the enclosing world box. */
  range: IRange;
}

/**
 * Measure target-only and composited pixel occupancy for an admitted Draw frame.
 *
 * Only the delivered pixels the subject's projected bounds can reach are
 * rendered. The scratch framebuffer covers that rectangle, and the viewport
 * keeps the full delivery raster at a negative offset, so each scratch sample
 * is rasterized at the same position, by the same camera, as in the delivered
 * frame. Pixels outside the rectangle cannot hold the subject.
 *
 * @evidence contracts/development/implementation.md#principled-implementation
 * Source-owned semantic roots determine which actual drawable triangles belong
 * to the subject. The audit preserves front-face opaque depth behavior and matches
 * canvas depth precision in a private framebuffer. Overlapping projected bounds
 * with ambiguous depth cannot certify parity after material replacement. The
 * conservative projected box of every subject drawable, widened by two native
 * samples and aligned to whole delivered pixels, bounds the subject's coverage.
 * @evidence contracts/development/implementation.md#efficient-algorithms
 * Geometry admission precedes raster allocation, and the raster is the
 * subject's rectangle, not the frame. Either the disjoint/behind bounds
 * certificate removes the composite pass or the sample budget admits both;
 * the same RGBA buffer is reused and the coverage baseline needs one bit per
 * output pixel in the rectangle.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources
 * Borrowed mesh materials/layers, background and framebuffer/raster are
 * restored independently on success or error. Owned mask materials and
 * the temporary framebuffer are then disposed. The original canvas pixels
 * are never used as scratch storage.
 * @evidence contracts/development/common.md#meaningful-documentation The
 * metric is delivered pixel membership, with source identity, eligibility,
 * the rendered rectangle, pass budgets, coverage refusals and resource
 * ownership explicit.
 */
export function measureAutoMovieCameraOcclusionPixels(props: IProps): IResult {
  const {
    renderer,
    scene,
    camera,
    target,
    width,
    height,
    factor,
    maxSamples,
    maxTriangles,
  } = props;
  const sampleWidth: number = width * factor;
  const sampleHeight: number = height * factor;
  const deferred = (reason: string): IResult => ({
    status: "deferred",
    reason,
    samples: 0,
  });
  if (
    (factor !== 1 && factor !== 2) ||
    ![width, height, maxTriangles, sampleWidth * sampleHeight * 4].every(
      (value: number): boolean => Number.isSafeInteger(value) && value > 0,
    ) ||
    !Number.isSafeInteger(maxSamples) ||
    maxSamples < 0
  )
    return deferred("invalid delivery pixel audit request");

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
    return deferred("unsupported delivery render state");

  const depthBits: number = context.getParameter(context.DEPTH_BITS) as number;
  const maxRenderbuffer: number = context.getParameter(
    context.MAX_RENDERBUFFER_SIZE,
  ) as number;
  const maximum: number = Math.min(
    maxRenderbuffer,
    renderer.capabilities.maxTextureSize,
  );
  const viewport: ArrayLike<number> = context.getParameter(
    context.MAX_VIEWPORT_DIMS,
  ) as Int32Array;
  if (
    !Number.isSafeInteger(depthBits) ||
    depthBits < 16 ||
    depthBits > 32 ||
    !Number.isSafeInteger(maximum) ||
    !(sampleWidth <= (viewport[0] ?? 0)) ||
    !(sampleHeight <= (viewport[1] ?? 0))
  )
    return deferred("unsupported delivery framebuffer");

  const binding: IAutoMovieSemanticMaskBinding | null =
    autoMovieSemanticMaskOf(scene);
  if (binding === null || scene.children.length < binding.design.nodes.length)
    return deferred("no admitted source semantic binding");
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
      ([node, entry]): boolean => node !== target && entry.id === required.id,
    )
  )
    return deferred("ambiguous required subject mask root");

  camera.updateWorldMatrix(true, false);
  scene.updateMatrixWorld();
  const projection: THREE.Matrix4 = new THREE.Matrix4().multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse,
  );
  const subjects: IRange = {
    min: new THREE.Vector3(Infinity, Infinity, Infinity),
    max: new THREE.Vector3(-Infinity, -Infinity, -Infinity),
  };
  const drawables: IDrawable[] = [];
  let triangles: number = 0;
  let reason: string | undefined;
  scene.traverseVisible((object: THREE.Object3D): void => {
    if (reason !== undefined || !object.layers.test(camera.layers)) return;
    if (!(object instanceof THREE.Mesh)) {
      if (
        object instanceof THREE.Line ||
        object instanceof THREE.Points ||
        object instanceof THREE.Sprite
      )
        reason = "unsupported drawable in delivery scene";
      return;
    }
    const material: THREE.Material | THREE.Material[] = object.material;
    if (!Array.isArray(material) && !material.visible) return;
    const position = object.geometry.getAttribute("position");
    if (
      object.constructor !== THREE.Mesh ||
      !nativeRenderCallbacks(object) ||
      object.geometry.morphAttributes.position?.length ||
      !(position instanceof THREE.BufferAttribute) ||
      Array.isArray(material) ||
      !nativeOpaqueMaterial(material)
    ) {
      reason = "unsupported opaque coverage in delivery scene";
      return;
    }
    triangles += Math.ceil(
      Math.max(position.count, object.geometry.index?.count ?? 0) / 3,
    );
    if (triangles > maxTriangles) {
      reason = "delivery geometry audit budget";
      return;
    }
    const bounds: THREE.Box3 = new THREE.Box3()
      .setFromBufferAttribute(position)
      .applyMatrix4(object.matrixWorld);
    const range: IRange | undefined = projectRange(bounds, projection);
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
  if (reason !== undefined) return deferred(reason);
  if (subjects.min.x === Infinity)
    return deferred("no admitted required drawable");

  const region: IRegion | undefined = subjectRegion(
    subjects,
    sampleWidth,
    sampleHeight,
    factor,
  );
  if (region === undefined)
    return {
      status: "measured",
      passes: 0,
      samples: 0,
      pixels: { isolated: 0, visible: 0 },
    };
  if (region.width > maximum || region.height > maximum)
    return deferred("unsupported delivery framebuffer");

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
      return deferred("ambiguous target and blocker depth order");
    passes = 2;
  }
  const needed: number = region.width * region.height * passes;
  if (needed > maxSamples)
    return deferred(
      `delivery pixel audit budget: ${needed} native samples needed, ${maxSamples} remain in this frame`,
    );
  if (triangles * passes > maxTriangles)
    return deferred("delivery composite audit budget");

  return renderMasks({
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

/**
 * Bounds the native samples the subject's projected box can reach, widened by
 * the same two-sample guard as the blocker overlap test and aligned outward to
 * whole delivered pixels. Undefined when the box misses the raster.
 */
function subjectRegion(
  subjects: IRange,
  sampleWidth: number,
  sampleHeight: number,
  factor: 1 | 2,
): IRegion | undefined {
  const span = (
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
  const x = span(subjects.min.x, subjects.max.x, sampleWidth);
  const y = span(subjects.min.y, subjects.max.y, sampleHeight);
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
      material instanceof THREE.MeshBasicMaterial ||
      material instanceof THREE.MeshStandardMaterial ||
      material instanceof THREE.MeshLambertMaterial ||
      material instanceof THREE.MeshPhongMaterial
    ) ||
    ![
      THREE.MeshBasicMaterial,
      THREE.MeshStandardMaterial,
      THREE.MeshLambertMaterial,
      THREE.MeshPhongMaterial,
    ].some((type): boolean => material.constructor === type)
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
    (!("displacementMap" in material) || material.displacementMap === null)
  );
}

/** Projects the enclosing box only where the homogeneous divide is continuous. */
function projectRange(
  bounds: THREE.Box3,
  projection: THREE.Matrix4,
): IRange | undefined {
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
        if (!point.toArray().every(Number.isFinite)) return undefined;
        min.min(point);
        max.max(point);
      }
  return { min, max };
}

/**
 * Paints the admitted binary variant in a depth-matched scratch framebuffer the
 * size of the subject's region, viewing it through the full delivery viewport.
 */
function renderMasks(input: {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  sampleWidth: number;
  sampleHeight: number;
  region: IRegion;
  factor: 1 | 2;
  depthBits: number;
  drawables: readonly IDrawable[];
  passes: 1 | 2;
}): IResult {
  const {
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
  } = input;
  const context: WebGLRenderingContext | WebGL2RenderingContext =
    renderer.getContext();
  const restoreFramebuffer: () => void =
    captureAutoMovieFramebufferRestore(renderer);
  const background: THREE.Scene["background"] = scene.background;
  const renderTarget: THREE.WebGLRenderTarget = new THREE.WebGLRenderTarget(
    region.width,
    region.height,
    { samples: 0, depthBuffer: true, stencilBuffer: false },
  );
  // The delivered raster's viewport, shifted so the region's corner is the origin.
  renderTarget.viewport.set(-region.x, -region.y, sampleWidth, sampleHeight);
  let rendered: number = 0;
  const white: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    toneMapped: false,
    fog: false,
  });
  const black: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    toneMapped: false,
    fog: false,
  });
  const restore: (() => void)[] = [
    (): void => {
      for (const drawable of drawables) {
        drawable.mesh.layers.mask = drawable.layers;
        drawable.mesh.material = drawable.material;
      }
    },
    (): void => {
      scene.background = background;
    },
    restoreFramebuffer,
    (): void => renderTarget.dispose(),
    (): void => white.dispose(),
    (): void => black.dispose(),
  ];
  let result: IResult;
  try {
    result = draw();
  } catch (error: unknown) {
    return restoreAutoMovieRenderModeState(restore, { error });
  }
  restoreAutoMovieRenderModeState(restore);
  return result;

  /** Reads one indistinguishable-depth output raster without changing the camera. */
  function draw(): IResult {
    renderer.setRenderTarget(renderTarget);
    if (
      context.checkFramebufferStatus(context.FRAMEBUFFER) !==
        context.FRAMEBUFFER_COMPLETE ||
      context.getParameter(context.DEPTH_BITS) !== depthBits
    )
      return {
        status: "deferred",
        reason: "delivery scratch depth precision mismatch",
        samples: rendered,
      };
    const bytes: Uint8Array = new Uint8Array(region.width * region.height * 4);
    const read = (
      isolated?: Uint8Array,
    ): ReturnType<typeof countAutoMovieCameraOcclusionPixels> => {
      bytes.fill(127);
      renderer.render(scene, camera);
      rendered += region.width * region.height;
      renderer.readRenderTargetPixels(
        renderTarget,
        0,
        0,
        region.width,
        region.height,
        bytes,
      );
      return countAutoMovieCameraOcclusionPixels({
        bytes,
        sampleWidth: region.width,
        sampleHeight: region.height,
        factor,
        isolated,
      });
    };
    scene.background = new THREE.Color(0x000000);
    for (const drawable of drawables) {
      drawable.mesh.material = drawable.required ? white : black;
      if (!drawable.required) drawable.mesh.layers.mask = 0;
    }
    const isolated: ReturnType<typeof countAutoMovieCameraOcclusionPixels> =
      read();
    if (isolated === undefined)
      return {
        status: "deferred",
        reason: "invalid isolated delivery pixels",
        samples: rendered,
      };
    if (passes === 1 || isolated.count === 0)
      return {
        status: "measured",
        passes: 1,
        samples: rendered,
        pixels: { isolated: isolated.count, visible: isolated.count },
      };
    for (const drawable of drawables)
      drawable.mesh.layers.mask = drawable.layers;
    const composite: ReturnType<typeof countAutoMovieCameraOcclusionPixels> =
      read(isolated.occupancy);
    if (composite === undefined)
      return {
        status: "deferred",
        reason: "composite pixels fall outside the isolated subject",
        samples: rendered,
      };
    return {
      status: "measured",
      passes,
      samples: rendered,
      pixels: { isolated: isolated.count, visible: composite.count },
    };
  }
}
