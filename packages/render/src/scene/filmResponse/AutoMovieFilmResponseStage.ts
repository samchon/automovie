import {
  admitAutoMovieFilmOptics,
  autoMovieFilmResponseMatrix,
} from "@automovie/engine";
import type { IAutoMovieFilmOptics } from "@automovie/interface";
import * as THREE from "three";

import { AUTOMOVIE_FILM_RESPONSE_SHADERS } from "./AUTOMOVIE_FILM_RESPONSE_SHADERS.js";
import { AutoMovieFilmSampleSum } from "./AutoMovieFilmSampleSum.js";
import type { IAutoMovieFilmResponseRenderer } from "./IAutoMovieFilmResponseRenderer.js";
import { collectAutoMovieFilmOverlays } from "./collectAutoMovieFilmOverlays.js";
import { freeAutoMovieFilmOverlayLayer } from "./freeAutoMovieFilmOverlayLayer.js";
import { planAutoMovieFilmGlare } from "./planAutoMovieFilmGlare.js";

/**
 * The beauty stage of a directly rendered film: draw a scene's linear light
 * into a half-float target and give it a camera's response in one final pass.
 *
 * `draw` with optics:
 *
 * 1. Renders the scene into a linear half-float target at the drawn raster with
 *    the renderer's own curve at none and its exposure at one, whatever the
 *    host set, so `IAutoMovieFilmOptics` alone decides the response; the
 *    scene's background, fog, image lighting and shadows draw as they would to
 *    the canvas;
 * 2. With a glare strength above zero, box-filters a pyramid of the frame as deep
 *    as the widest kernel needs and blurs each kernel at the level
 *    `planAutoMovieFilmGlare` gives it, rows then columns;
 * 3. Draws one full-frame quad into the target the host had set (the canvas for
 *    the draw host and the inspector) that applies the glare,
 *    `autoMovieFilmResponseMatrix`, the tone curve, the sRGB encoding and the
 *    grade, and writes the linear frame's depth;
 * 4. Draws the display overlays last over that picture, with the scene's depth
 *    occluding them: every drawn object whose materials all set `toneMapped:
 *    false`, the convention by which inspection colours, marks and witness
 *    boxes state display colours rather than scene light. They are left out of
 *    step 1, so under optics they cast no shadow.
 *
 * A sampled film's second replaces step 1 with `accumulate`, once per
 * sub-frame sample, and then `draw` with `accumulated: true`.
 *
 * Without optics `draw` is one `renderer.render` into the current target,
 * exactly what the host drew before the stage existed. The renderer's target,
 * curve, exposure, clear policy and shadow-map updates, the scene's background,
 * and every object and camera layer mask it changes are restored before it
 * returns or throws.
 *
 * GPU targets and programs are made on the first draw with optics, resized when
 * the raster changes, and released by `dispose`. Every fragment reads only its
 * own pixel's texels and the uniforms of this draw, so a frame depends on
 * nothing drawn before it. A pyramid level whose parent has an odd side is
 * rounded up, so that level's box is misaligned by under one of its pixels;
 * frame edges repeat their border texels into the blur.
 */
export class AutoMovieFilmResponseStage {
  /**
   * The targets of the current raster, or null before the first draw with
   * optics.
   */
  private targets_: ITargets | null = null;

  /**
   * The full-frame quad every pass of the stage draws, carrying the pass's
   * program.
   */
  private readonly quad_: THREE.Mesh<
    THREE.PlaneGeometry,
    THREE.RawShaderMaterial
  >;

  /** The scene holding only the quad. */
  private readonly frame_: THREE.Scene = new THREE.Scene();

  /** A camera the quad's clip-space vertices ignore; `render` needs one. */
  private readonly camera_: THREE.OrthographicCamera =
    new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  /** The pyramid step program. */
  private readonly downsample_: THREE.RawShaderMaterial;

  /** The separable Gaussian program. */
  private readonly blur_: THREE.RawShaderMaterial;

  /** The final response program. */
  private readonly final_: THREE.RawShaderMaterial;

  /** The running sum of a sampled second's sub-frame samples. */
  private readonly sum_: AutoMovieFilmSampleSum = new AutoMovieFilmSampleSum();

  /**
   * Make the stage's programs; no GPU resource is allocated until the first
   * draw with optics.
   */
  public constructor() {
    const material: (
      fragment: string,
      uniforms: Record<string, THREE.IUniform>,
    ) => THREE.RawShaderMaterial = (
      fragment: string,
      uniforms: Record<string, THREE.IUniform>,
    ): THREE.RawShaderMaterial =>
      new THREE.RawShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: AUTOMOVIE_FILM_RESPONSE_SHADERS.vertex,
        fragmentShader: fragment,
        uniforms,
        // The final pass writes the linear frame's depth for the overlays; a disabled depth test would also disable that write, so it tests against nothing instead.
        depthTest: fragment === AUTOMOVIE_FILM_RESPONSE_SHADERS.final,
        depthFunc: THREE.AlwaysDepth,
        depthWrite: fragment === AUTOMOVIE_FILM_RESPONSE_SHADERS.final,
      });
    this.downsample_ = material(AUTOMOVIE_FILM_RESPONSE_SHADERS.downsample, {
      tSource: { value: null },
    });
    this.blur_ = material(AUTOMOVIE_FILM_RESPONSE_SHADERS.blur, {
      tSource: { value: null },
      uStep: { value: new THREE.Vector2() },
      uWeights: { value: new Array<number>(32).fill(0) },
      uRadius: { value: 0 },
    });
    this.final_ = material(AUTOMOVIE_FILM_RESPONSE_SHADERS.final, {
      tLinear: { value: null },
      tDepth: { value: null },
      tGlare0: { value: null },
      tGlare1: { value: null },
      tGlare2: { value: null },
      uGlareWeights: { value: new THREE.Vector3() },
      uGlareStrength: { value: 0 },
      uResponse: { value: new THREE.Matrix3() },
      uCurve: { value: 0 },
      uGrade: { value: 0 },
      uSlope: { value: new THREE.Vector3(1, 1, 1) },
      uOffset: { value: new THREE.Vector3() },
      uPower: { value: new THREE.Vector3(1, 1, 1) },
      uSaturation: { value: 1 },
    });
    this.quad_ = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.final_);
    this.quad_.frustumCulled = false;
    this.frame_.add(this.quad_);
  }

  /**
   * The final pass's program, whose uniforms carry the response of the last
   * draw with optics.
   */
  public get final(): THREE.RawShaderMaterial {
    return this.final_;
  }

  /**
   * Draw `scene` through `camera` into the renderer's current target at `width`
   * by `height` pixels, with the response of `optics`, or plainly when it is
   * absent.
   *
   * `optics` is admitted by `admitAutoMovieFilmOptics` before anything is
   * drawn, so an out-of-range value throws an error naming `seconds` and the
   * field, and leaves the renderer and scene untouched.
   */
  public draw(props: {
    /** The renderer, whose current target receives the picture. */
    renderer: IAutoMovieFilmResponseRenderer;

    /** The scene drawn. */
    scene: THREE.Scene;

    /** The camera drawn through. */
    camera: THREE.Camera;

    /** The film's response at the drawn second; absent draws plainly. */
    optics: IAutoMovieFilmOptics | undefined;

    /** The drawn second, which a refusal of `optics` names. */
    seconds: number;

    /** Drawn raster width in pixels. */
    width: number;

    /** Drawn raster height in pixels. */
    height: number;

    /**
     * True when `accumulate` has just averaged this second's sub-frame samples
     * into the linear target: step 1 is skipped and the response is given to
     * that average, whose depth is the last sample's. Absent or false renders
     * the scene once.
     */
    accumulated?: boolean;
  }): void {
    const { renderer, scene, camera, optics } = props;
    if (optics === undefined) {
      renderer.render(scene, camera);
      return;
    }
    admitAutoMovieFilmOptics(optics, props.seconds);
    const targets: ITargets = this.prepare(props.width, props.height, optics);
    const prior: {
      target: THREE.WebGLRenderTarget | null;
      toneMapping: THREE.ToneMapping;
      exposure: number;
      autoClear: boolean;
      shadowUpdate: boolean;
      background: THREE.Scene["background"];
      cameraMask: number;
    } = {
      target: renderer.getRenderTarget(),
      toneMapping: renderer.toneMapping,
      exposure: renderer.toneMappingExposure,
      autoClear: renderer.autoClear,
      shadowUpdate: renderer.shadowMap.autoUpdate,
      background: scene.background,
      cameraMask: camera.layers.mask,
    };
    const overlays: Map<THREE.Object3D, number> =
      collectAutoMovieFilmOverlays(scene);
    try {
      // 1. The scene's linear light, without the display overlays.
      for (const object of overlays.keys()) object.layers.mask = 0;
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.toneMappingExposure = 1;
      renderer.autoClear = true;
      if (props.accumulated !== true) {
        renderer.setRenderTarget(targets.linear);
        renderer.render(scene, camera);
      }

      // 2. The glare kernels, each at its pyramid level.
      if (optics.glare !== undefined && optics.glare.strength > 0)
        this.glare(renderer, targets);

      // 3. The response, into the host's target.
      this.quad_.material = this.final_;
      renderer.setRenderTarget(prior.target);
      renderer.render(this.frame_, this.camera_);

      // 4. Display overlays over the picture, occluded by the scene's depth.
      if (overlays.size !== 0) {
        const bit: number = freeAutoMovieFilmOverlayLayer(
          scene,
          prior.cameraMask,
        );
        for (const object of overlays.keys()) object.layers.mask = bit;
        camera.layers.mask = bit;
        scene.background = null;
        renderer.autoClear = false;
        renderer.shadowMap.autoUpdate = false;
        renderer.render(scene, camera);
      }
    } finally {
      for (const [object, mask] of overlays) object.layers.mask = mask;
      camera.layers.mask = prior.cameraMask;
      scene.background = prior.background;
      renderer.setRenderTarget(prior.target);
      renderer.toneMapping = prior.toneMapping;
      renderer.toneMappingExposure = prior.exposure;
      renderer.autoClear = prior.autoClear;
      renderer.shadowMap.autoUpdate = prior.shadowUpdate;
    }
  }

  /**
   * Render sample `index` of `count` sub-frame samples of one second, placed by
   * the caller in sample order, and add it to the running average that `draw`
   * with `accumulated: true` then responds to. Sample 0 admits `optics`; the
   * sum itself is `AutoMovieFilmSampleSum`'s.
   */
  public accumulate(
    props: Omit<
      Parameters<AutoMovieFilmResponseStage["draw"]>[0],
      "optics" | "accumulated"
    > & {
      /** The film's response at the frame's second. */
      optics: IAutoMovieFilmOptics;

      /** This sample's index, from 0. */
      index: number;

      /** The number of samples of the second, at least 2. */
      count: number;
    },
  ): void {
    if (props.index === 0)
      admitAutoMovieFilmOptics(props.optics, props.seconds);
    this.sum_.add({
      ...props,
      linear: this.prepare(props.width, props.height, props.optics).linear,
    });
  }
  /** Release the stage's targets, programs and quad. */
  public dispose(): void {
    this.release();
    this.sum_.dispose();
    this.downsample_.dispose();
    this.blur_.dispose();
    this.final_.dispose();
    this.quad_.geometry.dispose();
  }

  /**
   * Size the targets to the raster and set the final pass's uniforms from the
   * optics.
   */
  private prepare(
    width: number,
    height: number,
    optics: IAutoMovieFilmOptics,
  ): ITargets {
    if (
      this.targets_ === null ||
      this.targets_.width !== width ||
      this.targets_.height !== height
    ) {
      this.release();
      this.targets_ = allocate(width, height);
    }
    const targets: ITargets = this.targets_;
    const uniforms: Record<string, THREE.IUniform> = this.final_.uniforms;
    const m: number[] = autoMovieFilmResponseMatrix(optics);
    uniforms.tLinear!.value = targets.linear.texture;
    uniforms.tDepth!.value = targets.linear.depthTexture;
    (uniforms.uResponse!.value as THREE.Matrix3).set(
      m[0]!,
      m[1]!,
      m[2]!,
      m[3]!,
      m[4]!,
      m[5]!,
      m[6]!,
      m[7]!,
      m[8]!,
    );
    uniforms.uCurve!.value = optics.toneMapping === "acesFilmic" ? 1 : 0;
    uniforms.uGlareStrength!.value = optics.glare?.strength ?? 0;
    targets.kernels.forEach((kernel: IKernelTargets, index: number): void => {
      uniforms[`tGlare${index}`]!.value = kernel.output.texture;
    });
    (uniforms.uGlareWeights!.value as THREE.Vector3).set(
      targets.kernels[0]!.plan.weight,
      targets.kernels[1]!.plan.weight,
      targets.kernels[2]!.plan.weight,
    );
    const grade: IAutoMovieFilmOptics.IGrade | undefined = optics.grade;
    uniforms.uGrade!.value = grade === undefined ? 0 : 1;
    if (grade !== undefined) {
      (uniforms.uSlope!.value as THREE.Vector3).fromArray(grade.slope);
      (uniforms.uOffset!.value as THREE.Vector3).fromArray(grade.offset);
      (uniforms.uPower!.value as THREE.Vector3).fromArray(grade.power);
      uniforms.uSaturation!.value = grade.saturation;
    }
    return targets;
  }

  /**
   * Blur the linear frame by every kernel at its level, building the pyramid as
   * deep as the deepest kernel.
   */
  private glare(
    renderer: IAutoMovieFilmResponseRenderer,
    targets: ITargets,
  ): void {
    const pass: (
      material: THREE.RawShaderMaterial,
      output: THREE.WebGLRenderTarget,
    ) => void = (
      material: THREE.RawShaderMaterial,
      output: THREE.WebGLRenderTarget,
    ): void => {
      this.quad_.material = material;
      renderer.setRenderTarget(output);
      renderer.render(this.frame_, this.camera_);
    };
    const levels: THREE.WebGLRenderTarget[] = [
      targets.linear,
      ...targets.pyramid,
    ];
    for (let level: number = 1; level < levels.length; ++level) {
      this.downsample_.uniforms.tSource!.value = levels[level - 1]!.texture;
      pass(this.downsample_, levels[level]!);
    }
    const uniforms: Record<string, THREE.IUniform> = this.blur_.uniforms;
    for (const kernel of targets.kernels) {
      const source: THREE.WebGLRenderTarget = levels[kernel.plan.level]!;
      const weights: number[] = uniforms.uWeights!.value as number[];
      weights.fill(0);
      kernel.plan.weights.forEach((value: number, offset: number): void => {
        weights[offset] = value;
      });
      uniforms.uRadius!.value = kernel.plan.weights.length - 1;
      uniforms.tSource!.value = source.texture;
      (uniforms.uStep!.value as THREE.Vector2).set(1 / source.width, 0);
      pass(this.blur_, kernel.across);
      uniforms.tSource!.value = kernel.across.texture;
      (uniforms.uStep!.value as THREE.Vector2).set(0, 1 / source.height);
      pass(this.blur_, kernel.output);
    }
  }

  /** Release the targets, keeping the programs. */
  private release(): void {
    if (this.targets_ === null) return;
    this.targets_.linear.depthTexture?.dispose();
    this.targets_.linear.dispose();
    for (const target of this.targets_.pyramid) target.dispose();
    for (const kernel of this.targets_.kernels) {
      kernel.across.dispose();
      kernel.output.dispose();
    }
    this.targets_ = null;
  }
}

/** The targets of one raster. */
interface ITargets {
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
interface IKernelTargets {
  /** The kernel's plan. */
  plan: planAutoMovieFilmGlare.IKernel;

  /** The frame blurred along rows. */
  across: THREE.WebGLRenderTarget;

  /** The frame blurred along rows and columns. */
  output: THREE.WebGLRenderTarget;
}

/** Make the linear target, the pyramid and the blur targets of a raster. */
function allocate(width: number, height: number): ITargets {
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
  const plans: planAutoMovieFilmGlare.IKernel[] =
    planAutoMovieFilmGlare(height);
  const deepest: number = Math.max(
    ...plans.map((plan: planAutoMovieFilmGlare.IKernel): number => plan.level),
  );
  return {
    width,
    height,
    linear: target(width, height, true),
    pyramid: Array.from({ length: deepest }, (_: unknown, index: number) => {
      const [w, h] = size(index + 1);
      return target(w, h, false);
    }),
    kernels: plans.map(
      (plan: planAutoMovieFilmGlare.IKernel): IKernelTargets => {
        const [w, h] = size(plan.level);
        return {
          plan,
          across: target(w, h, false),
          output: target(w, h, false),
        };
      },
    ),
  };
}
