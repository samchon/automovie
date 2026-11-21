import * as THREE from "three";

import { captureAutoMovieFramebufferRestore } from "../captureAutoMovieFramebufferRestore.js";
import { restoreAutoMovieRenderModeState } from "../restoreAutoMovieRenderModeState.js";
import { countAutoMovieCameraOcclusionPixels } from "./countAutoMovieCameraOcclusionPixels.js";
import type { measureAutoMovieCameraOcclusionPixels } from "./measureAutoMovieCameraOcclusionPixels.js";

/** The admitted scene, its drawables and the subject's raster region. */
interface IProps {
  /** Native Draw renderer, with the default framebuffer selected. */
  renderer: THREE.WebGLRenderer;

  /** Original scene before inspection. */
  scene: THREE.Scene;

  /** Original delivery camera with the delivery aspect and crop realized. */
  camera: THREE.PerspectiveCamera;

  /** Delivered raster width in native samples. */
  sampleWidth: number;

  /** Delivered raster height in native samples. */
  sampleHeight: number;

  /** Native sample rectangle the subject can reach. */
  region: renderAutoMovieCameraOcclusionMasks.IRegion;

  /** Native Draw samples along a side of each delivered pixel. */
  factor: 1 | 2;

  /** Depth bits of the delivered canvas, which the scratch target must match. */
  depthBits: number;

  /** Every admitted drawable of the delivery scene. */
  drawables: readonly renderAutoMovieCameraOcclusionMasks.IDrawable[];

  /** One isolated pass, or a second composite pass when a blocker may cover the subject. */
  passes: 1 | 2;
}

/**
 * Paint the admitted binary variant of the scene in a depth-matched scratch
 * framebuffer the size of the subject's region, viewed through the full
 * delivery viewport, and count the subject's delivered pixels.
 *
 * The first pass draws the subject white alone; the second draws every
 * drawable, the subject white and the rest black, so a subject pixel stays
 * white only where nothing nearer covers it.
 *
 * @param props The admitted scene, drawables, region and pass count.
 * @returns The measured isolated and visible pixel counts, or the reason the
 * scratch framebuffer could not reproduce the delivered raster.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two passes, the region-sized framebuffer behind a full-raster viewport, and both outcomes.
 * @evidence contracts/development/implementation.md#principled-implementation A viewport the size of the delivered raster, offset by the region's corner, rasterizes every scratch sample where the delivered frame does, and a scratch depth buffer of the canvas's precision reproduces its depth tests; a mismatch refuses.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission and the region stay with measureAutoMovieCameraOcclusionPixels; this function only renders and counts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The original canvas is never scratch storage, and a composite pixel outside the isolated subject refuses rather than counting.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most two renders of the scene into a region-sized target, one reused RGBA buffer, and a single pass when the subject is empty or nothing can cover it.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each audit renders the current placement; no earlier raster is valid for it.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Borrowed materials, layers, background and framebuffer are restored, and the owned target and mask materials disposed, on success and on error.
 */
export function renderAutoMovieCameraOcclusionMasks(
  props: IProps,
): measureAutoMovieCameraOcclusionPixels.IResult {
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
  } = props;
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
  let result: measureAutoMovieCameraOcclusionPixels.IResult;
  try {
    result = draw();
  } catch (error: unknown) {
    return restoreAutoMovieRenderModeState(restore, { error });
  }
  restoreAutoMovieRenderModeState(restore);
  return result;

  /** Reads one indistinguishable-depth output raster without changing the camera. */
  function draw(): measureAutoMovieCameraOcclusionPixels.IResult {
    renderer.setRenderTarget(renderTarget);
    if (
      context.checkFramebufferStatus(context.FRAMEBUFFER) !==
        context.FRAMEBUFFER_COMPLETE ||
      context.getParameter(context.DEPTH_BITS) !== depthBits
    )
      return {
        status: "unsupported",
        reason: "delivery scratch depth precision mismatch",
      };
    const bytes: Uint8Array = new Uint8Array(region.width * region.height * 4);
    const read: (
      isolated?: Uint8Array,
    ) => ReturnType<typeof countAutoMovieCameraOcclusionPixels> = (
      isolated?: Uint8Array,
    ): ReturnType<typeof countAutoMovieCameraOcclusionPixels> => {
      bytes.fill(127);
      renderer.render(scene, camera);
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
        status: "unsupported",
        reason: "invalid isolated delivery pixels",
      };
    if (passes === 1 || isolated.count === 0)
      return {
        status: "measured",
        passes: 1,
        pixels: { isolated: isolated.count, visible: isolated.count },
      };
    for (const drawable of drawables)
      drawable.mesh.layers.mask = drawable.layers;
    const composite: ReturnType<typeof countAutoMovieCameraOcclusionPixels> =
      read(isolated.occupancy);
    if (composite === undefined)
      return {
        status: "unsupported",
        reason: "composite pixels fall outside the isolated subject",
      };
    return {
      status: "measured",
      passes,
      pixels: { isolated: isolated.count, visible: composite.count },
    };
  }
}

/** Types shared between the pixel audit's admission and its mask rendering. */
export namespace renderAutoMovieCameraOcclusionMasks {
  /**
   * Native sample rectangle of the delivery raster, origin at the bottom left.
   *
   * @evidence contracts/development/design.md#principled-representation Integer native-sample origin and size, the same frame glViewport and readPixels use.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four numbers locate the scratch target inside the delivered raster.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Aligned outward to whole delivered pixels by its producer, never clipped inside the subject.
   * @evidence contracts/development/common.md#meaningful-documentation States the units and origin.
   */
  export interface IRegion {
    /** Left edge in native samples. */
    x: number;

    /** Bottom edge in native samples. */
    y: number;

    /** Width in native samples. */
    width: number;

    /** Height in native samples. */
    height: number;
  }

  /**
   * Conservative clip-space interval of a drawable's world envelope.
   *
   * @evidence contracts/development/design.md#principled-representation The divided clip coordinates of an enclosing box's corners bound the drawable's projection where the divide is continuous.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two corners suffice for overlap and depth-order tests.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Produced only when every corner lies in front of the camera.
   * @evidence contracts/development/common.md#meaningful-documentation States the coordinate frame of both corners.
   */
  export interface IRange {
    /** Left, bottom and near extents in divided clip coordinates. */
    min: THREE.Vector3;

    /** Right, top and far extents in divided clip coordinates. */
    max: THREE.Vector3;
  }

  /**
   * Borrowed drawable state and its admitted semantic membership.
   *
   * @evidence contracts/development/design.md#principled-representation The original material and layer mask are what the masks swap and restore; membership comes from the source semantic root.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Carries exactly the state the passes change and the range the admission tests.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Only ordinary rigid meshes with stock opaque materials are admitted.
   * @evidence contracts/development/common.md#meaningful-documentation Names each member's ownership and frame.
   */
  export interface IDrawable {
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
}
