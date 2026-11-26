import * as THREE from "three";

import { captureAutoMovieFramebufferRestore } from "./captureAutoMovieFramebufferRestore.js";
import { readAutoMovieDisplayDestinationEncoding } from "../readAutoMovieDisplayDestinationEncoding.js";
import { restoreAutoMovieRenderModeState } from "../restoreAutoMovieRenderModeState.js";

/**
 * GPU composition of the same display bytes a direct canvas capture reads.
 *
 * Each source callback draws to the default framebuffer, where Three applies
 * its scene-owned display transform and each material's toneMapped policy.
 * FramebufferTexture copies those resolved bytes without a CPU readback. The
 * raw quad then applies the delivered byte operator without another tone or
 * encoding transform. Source renders retain the renderer's own antialiasing. A
 * caller-owned destination receives this display product, not scene radiance;
 * its canvas backing is saved and restored while that destination is active.
 * Scalar interpolation uses highp Float32: opaque rounding thresholds can
 * differ by one byte from Float64 delivery. Endpoints and identical sources
 * retain identity. A premultiplied canvas is an associated display product,
 * whose low-alpha straight RGB extraction is not arbitrary straight delivery;
 * use a straight target for that product. Native sRGB destinations receive the
 * canonical inverse transfer before their automatic encoding, preserving the
 * display-byte domain rather than applying another view transform.
 *
 * The two sources mix as associated colour, colour times alpha, with alpha at
 * the same weight, and return to straight colour, as
 * `mixAutoMovieStraightAlpha` does on bytes: a transparent source's black then
 * darkens no half-covered edge, and two opaque sources mix exactly as straight
 * colour. A fade mixes toward opaque black, or with `transparent` toward a
 * fully transparent pixel, so only alpha falls.
 */
export class AutoMovieDisplayCompositor {
  private readonly sources: THREE.FramebufferTexture[];
  private readonly backing: THREE.FramebufferTexture;
  private readonly material: THREE.RawShaderMaterial;
  private readonly geometry: THREE.PlaneGeometry = new THREE.PlaneGeometry(
    2,
    2,
  );
  private readonly scene: THREE.Scene = new THREE.Scene();
  private readonly camera: THREE.OrthographicCamera =
    new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private disposed: boolean = false;
  private disposalFailure: { error: unknown } | undefined;
  /**
   * Disposal callbacks cannot allocate a replacement while old-copy retirement
   * runs.
   */
  private resizing: Error | undefined;

  public constructor(
    private width: number,
    private height: number,
  ) {
    this.admitSize(width, height);
    this.sources = [
      new THREE.FramebufferTexture(width, height),
      new THREE.FramebufferTexture(width, height),
    ];
    this.backing = new THREE.FramebufferTexture(width, height);
    this.material = new THREE.RawShaderMaterial({
      uniforms: {
        outgoing: { value: this.sources[0] },
        incoming: { value: this.sources[1] },
        alpha: { value: 0 },
        fade: { value: false },
        fadeTransparent: { value: false },
        copyBacking: { value: false },
        sourcePremultiplied: { value: false },
        outputPremultiplied: { value: false },
        outputSRGB: { value: false },
      },
      vertexShader: `precision highp float;
        uniform mat4 projectionMatrix; uniform mat4 modelViewMatrix;
        attribute vec3 position; attribute vec2 uv; varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `precision highp float;
        uniform highp sampler2D outgoing; uniform highp sampler2D incoming;
        uniform float alpha; uniform bool fade; uniform bool fadeTransparent;
        uniform bool copyBacking;
        uniform bool sourcePremultiplied; uniform bool outputPremultiplied;
        uniform bool outputSRGB;
        varying vec2 vUv;
        #include <colorspace_pars_fragment>
        vec4 straight(vec4 value) {
          if (sourcePremultiplied) value.rgb = value.a > 0.0 ? value.rgb / value.a : vec3(0.0);
          return floor(clamp(value, 0.0, 1.0) * 255.0 + 0.5);
        }
        void main() {
          vec4 first = texture2D(outgoing, vUv);
          if (copyBacking) { gl_FragColor = first; return; }
          first = straight(first);
          vec4 second = fade ? vec4(0.0, 0.0, 0.0, fadeTransparent ? 0.0 : 255.0) : straight(texture2D(incoming, vUv));
          // Mix associated colour and alpha at one weight, then return to
          // straight colour; for two opaque bytes this is the straight mix.
          vec4 mixed = mix(vec4(first.rgb * first.a / 255.0, first.a), vec4(second.rgb * second.a / 255.0, second.a), alpha);
          vec4 unassociated = mixed.a > 0.0 ? vec4(mixed.rgb * 255.0 / mixed.a, mixed.a) : vec4(0.0);
          vec4 result = floor(clamp(unassociated, 0.0, 255.0) + 0.5) / 255.0;
          if (outputPremultiplied) result.rgb *= result.a;
          if (outputSRGB) result = sRGBTransferEOTF(result);
          gl_FragColor = result;
        }`,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      blending: THREE.NoBlending,
    });
    this.scene.add(new THREE.Mesh(this.geometry, this.material));
  }

  /**
   * Resize owned copies only; drawing-buffer pixels remain the source unit. New
   * extents publish only after every old-copy retirement succeeds. A failed
   * retirement closes this owner, retains its old potential extent and cause,
   * and independently retires the remaining quad resources without retries.
   */
  public resize(width: number, height: number): void {
    this.assertOpen();
    this.admitSize(width, height);
    if (this.width === width && this.height === height) return;
    this.resizing = new Error("Display-copy retirement is still running.");
    try {
      const failures: unknown[] = [];
      for (const texture of [...this.sources, this.backing]) {
        try {
          texture.dispose();
        } catch (error) {
          failures.push(error);
        }
      }
      if (failures.length !== 0) {
        this.disposed = true;
        for (const resource of [this.geometry, this.material]) {
          try {
            resource.dispose();
          } catch (error) {
            failures.push(error);
          }
        }
        const error: unknown =
          failures.length === 1
            ? failures[0]
            : new AggregateError(
                failures,
                "Display-copy resize disposal failed.",
              );
        this.disposalFailure = { error };
        throw error;
      }
      this.width = width;
      this.height = height;
      for (const texture of [...this.sources, this.backing]) {
        texture.image = { width, height };
        texture.needsUpdate = true;
      }
    } finally {
      this.resizing = undefined;
    }
  }

  /**
   * Draw one fade or two complementary sources, independently attempting
   * host-state restoration after source, copy or composite failure. An
   * aggregate retains the original failure first. The previous canvas picture
   * is saved before source drawing and its restoration is attempted after
   * failed composition; a failed restoration cannot guarantee the previous
   * display survives.
   *
   * Caller callbacks keep this owner and borrowed renderer alive through the
   * call; a previously closed owner refuses before native observation.
   */
  public render(
    renderer: THREE.WebGLRenderer,
    outgoing: () => void,
    incoming: (() => void) | null,
    alpha: number,
    transparent: boolean = false,
  ): void {
    this.assertOpen();
    const target: ReturnType<THREE.WebGLRenderer["getRenderTarget"]> =
      renderer.getRenderTarget();
    const restoreFramebuffer: () => void =
      captureAutoMovieFramebufferRestore(renderer);
    const destinationSRGB: boolean =
      target !== null &&
      readAutoMovieDisplayDestinationEncoding(renderer) === "srgb";
    const autoClear: boolean = renderer.autoClear;
    const clearColor: THREE.Color = renderer
      .getClearColor(new THREE.Color())
      .clone();
    const clearAlpha: number = renderer.getClearAlpha();
    const toneMapping: THREE.ToneMapping = renderer.toneMapping;
    const exposure: number = renderer.toneMappingExposure;
    const premultiplied: boolean =
      renderer.getContextAttributes()?.premultipliedAlpha === true;
    let primary: { error: unknown } | undefined;
    let backingSaved: boolean = false;
    try {
      renderer.setRenderTarget(null);
      this.copyDisplay(renderer, this.backing);
      backingSaved = true;
      renderer.setClearColor(clearColor, clearAlpha);
      renderer.clear(true, true, true);
      outgoing();
      this.capture(renderer, this.sources[0]!);
      if (incoming !== null) {
        restoreFramebuffer();
        renderer.setRenderTarget(null);
        renderer.setClearColor(clearColor, clearAlpha);
        renderer.clear(true, true, true);
        incoming();
        this.capture(renderer, this.sources[1]!);
      }
      restoreFramebuffer();
      renderer.autoClear = false;
      // The display source already resolved its view, including float-output hosts.
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.toneMappingExposure = 1;
      const uniforms: THREE.RawShaderMaterial["uniforms"] =
        this.material.uniforms;
      uniforms.outgoing!.value = this.sources[0];
      uniforms.incoming!.value = this.sources[1];
      uniforms.alpha!.value = alpha;
      uniforms.fade!.value = incoming === null;
      uniforms.fadeTransparent!.value = transparent;
      uniforms.copyBacking!.value = false;
      uniforms.sourcePremultiplied!.value = premultiplied;
      uniforms.outputPremultiplied!.value = target === null && premultiplied;
      uniforms.outputSRGB!.value = destinationSRGB;
      renderer.render(this.scene, this.camera);
    } catch (error) {
      primary = { error };
    }
    const operations: (() => void)[] = [
      (): void => {
        if (!backingSaved || (target === null && primary === undefined)) return;
        renderer.setRenderTarget(null);
        // Restore the complete saved canvas, even when the source or destination
        // used only a scissored viewport. Public setters use logical pixel units.
        renderer.setViewport(
          new THREE.Vector4(0, 0, this.width, this.height).divideScalar(
            renderer.getPixelRatio(),
          ),
        );
        renderer.setScissorTest(false);
        renderer.autoClear = false;
        renderer.toneMapping = THREE.NoToneMapping;
        renderer.toneMappingExposure = 1;
        this.material.uniforms.outgoing!.value = this.backing;
        this.material.uniforms.copyBacking!.value = true;
        renderer.render(this.scene, this.camera);
      },
      (): void => {
        renderer.autoClear = autoClear;
      },
      (): void => {
        renderer.setClearColor(clearColor, clearAlpha);
      },
      restoreFramebuffer,
      (): void => {
        renderer.toneMapping = toneMapping;
      },
      (): void => {
        renderer.toneMappingExposure = exposure;
      },
    ];
    if (primary === undefined) restoreAutoMovieRenderModeState(operations);
    else restoreAutoMovieRenderModeState(operations, primary);
  }

  private capture(
    renderer: THREE.WebGLRenderer,
    texture: THREE.FramebufferTexture,
  ): void {
    if (renderer.getRenderTarget() !== null)
      throw new Error(
        "A display source callback must leave the default framebuffer selected.",
      );
    this.copyDisplay(renderer, texture);
  }

  private copyDisplay(
    renderer: THREE.WebGLRenderer,
    texture: THREE.FramebufferTexture,
  ): void {
    // The copy API operates on the active native texture unit. In Three r186,
    // a cached unit-zero binding can leave a different unit active after target
    // allocation. Reset through the public context-sharing boundary before the
    // copy; selecting the canvas again reapplies its declared viewport/scissor.
    // No SDK methods, private cache entries or native bindings are replaced.
    renderer.resetState();
    renderer.setRenderTarget(null);
    renderer.copyFramebufferToTexture(texture);
  }

  /**
   * Release only compositor-owned textures, geometry and material once. Closed
   * instances refuse resize/render; repeated disposal preserves its original
   * success or failure and never retries physical resource release.
   */
  public dispose(): void {
    if (this.resizing !== undefined) throw this.resizing;
    if (this.disposed) {
      if (this.disposalFailure !== undefined) throw this.disposalFailure.error;
      return;
    }
    this.disposed = true;
    const failures: unknown[] = [];
    for (const resource of [
      ...this.sources,
      this.backing,
      this.geometry,
      this.material,
    ]) {
      try {
        resource.dispose();
      } catch (error) {
        failures.push(error);
      }
    }
    if (failures.length !== 0) {
      const error: unknown =
        failures.length === 1
          ? failures[0]
          : new AggregateError(
              failures,
              "Display compositor resource disposal failed.",
            );
      this.disposalFailure = { error };
      throw error;
    }
  }

  /** Closed owners cannot recreate allocations under a completed retirement. */
  private assertOpen(): void {
    if (this.resizing !== undefined) throw this.resizing;
    if (!this.disposed) return;
    if (this.disposalFailure !== undefined) throw this.disposalFailure.error;
    throw new Error("This display compositor is disposed.");
  }

  private admitSize(width: number, height: number): void {
    if (width <= 0 || height <= 0)
      throw new Error(
        "Display composition requires positive integer drawing-buffer dimensions.",
      );
  }

  /**
   * The current owned RGBA8/no-mipmap display-copy extent. Both source sampler
   * uniforms and the saved display can upload, even for a one-layer fade, so
   * their conservative resident closure contains three copies.
   */
  public describeTextureResidency(): {
    width: number;
    height: number;
    copies: 3;
  } {
    return { width: this.width, height: this.height, copies: 3 };
  }
}
