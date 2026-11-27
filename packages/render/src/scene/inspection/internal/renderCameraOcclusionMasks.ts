import * as THREE from "three";

import { captureFramebufferRestore } from "../../internal/captureFramebufferRestore";
import { restoreRenderModeState } from "../../internal/restoreRenderModeState";
import { countCameraOcclusionPixels } from "./countCameraOcclusionPixels";
import type { measureCameraOcclusionPixels } from "./measureCameraOcclusionPixels";

/*
 * Paint the admitted binary variant of the scene in a depth-matched scratch
 * framebuffer the size of the subject's region, viewed through the full
 * delivery viewport, and count the subject's delivered pixels.
 *
 * The first pass draws the subject white alone; the second draws every
 * drawable, the subject white and the rest black, so a subject pixel stays
 * white only where nothing nearer covers it.
 * Parameter props: The admitted scene, drawables, region and pass count.
 * Returns: The measured isolated and visible pixel counts, or the reason the
 * scratch framebuffer could not reproduce the delivered raster.
 */
export function renderCameraOcclusionMasks(
  props: IProps,
): measureCameraOcclusionPixels.IResult {
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
    captureFramebufferRestore(renderer);
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
  let result: measureCameraOcclusionPixels.IResult;
  try {
    result = draw();
  } catch (error: unknown) {
    return restoreRenderModeState(restore, { error });
  }
  restoreRenderModeState(restore);
  return result;

  /*
   * Reads one indistinguishable-depth output raster without changing the
   * camera.
   */
  function draw(): measureCameraOcclusionPixels.IResult {
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
    ) => ReturnType<typeof countCameraOcclusionPixels> = (
      isolated?: Uint8Array,
    ): ReturnType<typeof countCameraOcclusionPixels> => {
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
      return countCameraOcclusionPixels({
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
    const isolated: ReturnType<typeof countCameraOcclusionPixels> =
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
    const composite: ReturnType<typeof countCameraOcclusionPixels> =
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

/*
 * Types shared between the pixel audit's admission and its mask rendering.
 */
export namespace renderCameraOcclusionMasks {
  /*
   * Native sample rectangle of the delivery raster, origin at the bottom left.
   */
  export interface IRegion {
    /*
     * Left edge in native samples.
     */
    x: number;

    /*
     * Bottom edge in native samples.
     */
    y: number;

    /*
     * Width in native samples.
     */
    width: number;

    /*
     * Height in native samples.
     */
    height: number;
  }

  /*
   * Conservative clip-space interval of a drawable's world envelope.
   */
  export interface IRange {
    /*
     * Left, bottom and near extents in divided clip coordinates.
     */
    min: THREE.Vector3;

    /*
     * Right, top and far extents in divided clip coordinates.
     */
    max: THREE.Vector3;
  }

  /*
   * Borrowed drawable state and its admitted semantic membership.
   */
  export interface IDrawable {
    /*
     * Original ordinary rigid mesh.
     */
    mesh: THREE.Mesh;

    /*
     * Original unswapped material.
     */
    material: THREE.Material;

    /*
     * Original layer mask, including all non-camera layers.
     */
    layers: number;

    /*
     * Membership in the exact source semantic identity.
     */
    required: boolean;

    /*
     * Projected interval of the enclosing world box.
     */
    range: IRange;
  }
}

/*
 * The admitted scene, its drawables and the subject's raster region.
 */
interface IProps {
  /*
   * Native Draw renderer, with the default framebuffer selected.
   */
  renderer: THREE.WebGLRenderer;

  /*
   * Original scene before inspection.
   */
  scene: THREE.Scene;

  /*
   * Original delivery camera with the delivery aspect and crop realized.
   */
  camera: THREE.PerspectiveCamera;

  /*
   * Delivered raster width in native samples.
   */
  sampleWidth: number;

  /*
   * Delivered raster height in native samples.
   */
  sampleHeight: number;

  /*
   * Native sample rectangle the subject can reach.
   */
  region: renderCameraOcclusionMasks.IRegion;

  /*
   * Native Draw samples along a side of each delivered pixel.
   */
  factor: 1 | 2;

  /*
   * Depth bits of the delivered canvas, which the scratch target must match.
   */
  depthBits: number;

  /*
   * Every admitted drawable of the delivery scene.
   */
  drawables: readonly renderCameraOcclusionMasks.IDrawable[];

  /*
   * One isolated pass, or a second composite pass when a blocker may cover the
   * subject.
   */
  passes: 1 | 2;
}
