import * as THREE from "three";

import { planAutoMovieFilmGlareImplementation } from "./planAutoMovieFilmGlareImplementation.js";
import type { IAutoMovieRenderFilmGlareKernel } from "../../IAutoMovieRenderFilmGlareKernel.js";

/*
 * Make the film response stage's targets of a raster: the linear half-float
 * frame with its depth texture, the glare pyramid as deep as the deepest kernel
 * `AutoMovieRenderFilmResponseStage.planGlare` plans, and a pair of blur targets per kernel at its
 * level. The caller owns and disposes them.
 */
export function allocateAutoMovieFilmTargets(
  width: number,
  height: number,
): allocateAutoMovieFilmTargets.ITargets {
  const target: (
    w: number,
    h: number,
    depth: boolean,
  ) => THREE.WebGLRenderTarget = (
    w: number,
    h: number,
    depth: boolean,
  ): THREE.WebGLRenderTarget =>
    new THREE.WebGLRenderTarget(w, h, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      generateMipmaps: false,
      depthBuffer: depth,
      ...(depth ? { depthTexture: new THREE.DepthTexture(w, h) } : {}),
    });
  const size: (level: number) => [number, number] = (
    level: number,
  ): [number, number] => [
    Math.max(1, Math.ceil(width / 2 ** level)),
    Math.max(1, Math.ceil(height / 2 ** level)),
  ];
  const plans: IAutoMovieRenderFilmGlareKernel[] =
    planAutoMovieFilmGlareImplementation(height);
  const deepest: number = Math.max(
    ...plans.map((plan: IAutoMovieRenderFilmGlareKernel): number => plan.level),
  );
  return {
    width,
    height,
    linear: target(width, height, true),
    pyramid: Array.from({ length: deepest }, (_: unknown, index: number) => {
      const [w, h]: [number, number] = size(index + 1);
      return target(w, h, false);
    }),
    kernels: plans.map(
      (
        plan: IAutoMovieRenderFilmGlareKernel,
      ): allocateAutoMovieFilmTargets.IKernelTargets => {
        const [w, h]: [number, number] = size(plan.level);
        return {
          plan,
          across: target(w, h, false),
          output: target(w, h, false),
        };
      },
    ),
  };
}

/*
 * The target records `allocateAutoMovieFilmTargets` makes.
 */
export namespace allocateAutoMovieFilmTargets {
  /** The targets of one raster. */
  export interface ITargets {
    /** Raster width in pixels. */
    width: number;

    /** Raster height in pixels. */
    height: number;

    /** The linear frame with its depth. */
    linear: THREE.WebGLRenderTarget;

    /**
     * Pyramid levels 1 and deeper, each half the one above, as deep as the
     * deepest kernel.
     */
    pyramid: THREE.WebGLRenderTarget[];

    /** One pair of blur targets per glare kernel, in the kernels' order. */
    kernels: IKernelTargets[];
  }

  /** The blur targets of one glare kernel at its level. */
  export interface IKernelTargets {
    /** The kernel's plan. */
    plan: IAutoMovieRenderFilmGlareKernel;

    /** The frame blurred along rows. */
    across: THREE.WebGLRenderTarget;

    /** The frame blurred along rows and columns. */
    output: THREE.WebGLRenderTarget;
  }
}
