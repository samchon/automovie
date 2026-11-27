import * as THREE from "three";

import { AUTOMOVIE_FILM_RESPONSE_SHADERS } from "./AUTOMOVIE_FILM_RESPONSE_SHADERS.js";
import type { IAutoMovieFilmResponseRenderer } from "./IAutoMovieFilmResponseRenderer.js";
import { collectAutoMovieFilmOverlays } from "./internal/collectAutoMovieFilmOverlays.js";

/**
 * The running sum of one second's sub-frame samples, which the film response
 * stage averages for a shutter's motion blur and a lens's depth of field.
 *
 * Each `add` renders the scene's linear light into the stage's linear target,
 * exactly as the stage's single draw does, and adds its associated colour and
 * alpha to a sum held in two 32-bit float targets that ping-pong, so a moving
 * edge over a transparent clear averages to partial coverage. Samples sum at
 * unit weight and the last `add` writes the sum times `1 / count` over the
 * linear target's colour, so `count` equal samples average to exactly their
 * value and the linear target keeps the last sample's depth. Sample 0 starts a
 * new sum, so nothing of an earlier second survives.
 *
 * The float targets are made on the first `add` at a raster, remade when the
 * raster changes and released by `dispose`; a film without samples never
 * allocates them.
 */
export class AutoMovieFilmSampleSum {
  /** The two sum targets, or null before the first `add` at this raster. */
  private sums_: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget] | null =
    null;

  /** The accumulation program. */
  private readonly material_: THREE.RawShaderMaterial =
    new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: AUTOMOVIE_FILM_RESPONSE_SHADERS.vertex,
      fragmentShader: AUTOMOVIE_FILM_RESPONSE_SHADERS.accumulate,
      uniforms: {
        tSum: { value: null },
        tSample: { value: null },
        uFirst: { value: 1 },
        uScale: { value: 1 },
      },
      depthTest: false,
      depthWrite: false,
    });

  /** The full-frame quad the program draws. */
  private readonly quad_: THREE.Mesh<
    THREE.PlaneGeometry,
    THREE.RawShaderMaterial
  > = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material_);

  /** The scene holding only the quad. */
  private readonly frame_: THREE.Scene = new THREE.Scene();

  /** A camera the quad's clip-space vertices ignore; `render` needs one. */
  private readonly camera_: THREE.OrthographicCamera =
    new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  /** Put the quad in its scene; no GPU resource is allocated yet. */
  public constructor() {
    this.quad_.frustumCulled = false;
    this.frame_.add(this.quad_);
  }

  /**
   * Render sample `index` of `count` into `linear` and add it to the sum; after
   * the last sample, write the average over `linear`'s colour.
   *
   * The caller places the scene and the camera at the sample first, in sample
   * order. Display overlays are hidden while the scene renders, the renderer's
   * curve is none and its exposure one, and its target, curve, exposure and
   * clear policy and every overlay's layer mask are restored before returning
   * or throwing.
   */
  public add(props: {
    /** The renderer. */
    renderer: IAutoMovieFilmResponseRenderer;

    /** The scene, placed at this sample's second. */
    scene: THREE.Scene;

    /** The camera of this sample. */
    camera: THREE.Camera;

    /** The stage's linear half-float target with its depth. */
    linear: THREE.WebGLRenderTarget;

    /** This sample's index, from 0. */
    index: number;

    /** The number of samples of the second, at least 2. */
    count: number;

    /**
     * Work on the sample's linear light before it is added, such as the
     * medium's march; absent adds the scene's light as drawn.
     */
    march?: () => void;
  }): void {
    const { renderer, linear }: typeof props = props;
    const sums: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget] =
      this.prepare(linear.width, linear.height);
    const prior: {
      target: THREE.WebGLRenderTarget | null;
      toneMapping: THREE.ToneMapping;
      exposure: number;
      autoClear: boolean;
    } = {
      target: renderer.getRenderTarget(),
      toneMapping: renderer.toneMapping,
      exposure: renderer.toneMappingExposure,
      autoClear: renderer.autoClear,
    };
    const overlays: Map<THREE.Object3D, number> = collectAutoMovieFilmOverlays(
      props.scene,
    );
    const uniforms: Record<string, THREE.IUniform> = this.material_.uniforms;
    try {
      for (const object of overlays.keys()) object.layers.mask = 0;
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.toneMappingExposure = 1;
      renderer.autoClear = true;
      renderer.setRenderTarget(linear);
      renderer.render(props.scene, props.camera);
      props.march?.();

      // Sample k reads sum target k mod 2 and writes the other.
      const write: THREE.WebGLRenderTarget = sums[(props.index + 1) % 2];
      uniforms.tSum!.value = sums[props.index % 2].texture;
      uniforms.tSample!.value = linear.texture;
      uniforms.uFirst!.value = props.index === 0 ? 1 : 0;
      uniforms.uScale!.value = 1;
      renderer.setRenderTarget(write);
      renderer.render(this.frame_, this.camera_);

      if (props.index === props.count - 1) {
        uniforms.tSample!.value = write.texture;
        uniforms.uFirst!.value = 1;
        uniforms.uScale!.value = 1 / props.count;
        renderer.setRenderTarget(linear);
        renderer.autoClear = false;
        renderer.render(this.frame_, this.camera_);
      }
    } finally {
      for (const [object, mask] of overlays) object.layers.mask = mask;
      renderer.setRenderTarget(prior.target);
      renderer.toneMapping = prior.toneMapping;
      renderer.toneMappingExposure = prior.exposure;
      renderer.autoClear = prior.autoClear;
    }
  }

  /** Release the sum targets, the program and the quad. */
  public dispose(): void {
    this.release();
    this.material_.dispose();
    this.quad_.geometry.dispose();
  }

  /** The sum targets at a raster, made or remade as needed. */
  private prepare(
    width: number,
    height: number,
  ): [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget] {
    if (
      this.sums_ !== null &&
      this.sums_[0].width === width &&
      this.sums_[0].height === height
    )
      return this.sums_;
    this.release();
    const target: () => THREE.WebGLRenderTarget = (): THREE.WebGLRenderTarget =>
      new THREE.WebGLRenderTarget(width, height, {
        type: THREE.FloatType,
        format: THREE.RGBAFormat,
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        wrapS: THREE.ClampToEdgeWrapping,
        wrapT: THREE.ClampToEdgeWrapping,
        generateMipmaps: false,
        depthBuffer: false,
      });
    this.sums_ = [target(), target()];
    return this.sums_;
  }

  /** Release the sum targets. */
  private release(): void {
    if (this.sums_ === null) return;
    for (const target of this.sums_) target.dispose();
    this.sums_ = null;
  }
}
