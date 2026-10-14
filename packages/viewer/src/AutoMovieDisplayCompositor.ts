import * as THREE from "three";

import {captureAutoMovieFramebufferRestore} from "./captureAutoMovieFramebufferRestore.js";
import {readAutoMovieDisplayDestinationEncoding} from "./readAutoMovieDisplayDestinationEncoding.js";
import {restoreAutoMovieRenderModeState} from "./restoreAutoMovieRenderModeState.js";

/**
 * GPU composition of the same display bytes a direct canvas capture reads.
 *
 * Each source callback draws to the default framebuffer, where Three applies
 * its scene-owned display transform and each material's toneMapped policy.
 * FramebufferTexture copies those resolved bytes without a CPU readback. The
 * raw quad then applies the delivered byte operator without another tone or
 * encoding transform. Source renders retain the renderer's own antialiasing.
 * A caller-owned destination receives this display product, not scene radiance;
 * its canvas backing is saved and restored while that destination is active.
 * Scalar interpolation uses highp Float32: opaque rounding thresholds can
 * differ by one byte from Float64 delivery. Endpoints and identical sources
 * retain identity. A premultiplied canvas is an associated display product,
 * whose low-alpha straight RGB extraction is not arbitrary straight delivery;
 * use a straight target for that product. Native sRGB destinations receive the
 * canonical inverse transfer before their automatic encoding, preserving the
 * display-byte domain rather than applying another view transform.
 *
 * @evidence contracts/common.md#principled-implementation Resolved RGBA8 framebuffer copies preserve each source's display transform; the shader interpolates rounded display bytes and reverses native sRGB encoding only when the destination will encode again. Float32 thresholds can differ from CPU Float64 by one byte.
 * @evidence contracts/common.md#clear-and-simple-design One compositor owns the three display copies and one full-screen quad; source callbacks keep scene rendering with their existing owners and framebuffer restoration stays in the shared capture helper.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses public renderer reset and framebuffer-copy APIs to synchronize context state; no native bindings or renderer internals are replaced, and the same byte operator serves all scenes.
 * @evidence contracts/common.md#meaningful-documentation Describes display-byte rather than radiance composition, alpha association, destination encoding, precision limits, and caller ownership of the destination.
 * @evidence contracts/performance.md#efficient-algorithms Each render copies and shades a constant number of width-times-height images on the GPU, without CPU pixel readback; one-source fades omit the incoming scene draw.
 * @evidence contracts/performance.md#reuse-equivalent-work Textures, quad, material, scene and camera survive successive frames; unchanged resize dimensions preserve allocations while source pixels are refreshed because callbacks may draw different frames.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The instance owns three RGBA8 display copies and one quad geometry/material. Resize changes extents only after successful old-copy retirement; failed resize/disposal retains the closed owner, prior potential copy extent and original cause after independently attempting every remaining resource.
 */
export class AutoMovieDisplayCompositor {
  private readonly sources: THREE.FramebufferTexture[];
  private readonly backing: THREE.FramebufferTexture;
  private readonly material: THREE.RawShaderMaterial;
  private readonly geometry: THREE.PlaneGeometry = new THREE.PlaneGeometry(2, 2);
  private readonly scene: THREE.Scene = new THREE.Scene();
  private readonly camera: THREE.OrthographicCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private disposed: boolean = false;
  private disposalFailure: { error: unknown } | undefined;
  /** Disposal callbacks cannot allocate a replacement while old-copy retirement runs. */
  private resizing: Error | undefined;

  public constructor(private width: number, private height: number) {
    this.admitSize(width, height);
    this.sources = [new THREE.FramebufferTexture(width, height), new THREE.FramebufferTexture(width, height)];
    this.backing = new THREE.FramebufferTexture(width, height);
    this.material = new THREE.RawShaderMaterial({
      uniforms: {
        outgoing: { value: this.sources[0] }, incoming: { value: this.sources[1] },
        alpha: { value: 0 }, fade: { value: false }, copyBacking: { value: false },
        sourcePremultiplied: { value: false }, outputPremultiplied: { value: false },
        outputSRGB: {value:false},
      },
      vertexShader: `precision highp float;
        uniform mat4 projectionMatrix; uniform mat4 modelViewMatrix;
        attribute vec3 position; attribute vec2 uv; varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `precision highp float;
        uniform highp sampler2D outgoing; uniform highp sampler2D incoming;
        uniform float alpha; uniform bool fade; uniform bool copyBacking;
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
          vec4 second = fade ? vec4(0.0, 0.0, 0.0, 255.0) : straight(texture2D(incoming, vUv));
          vec4 result = floor(clamp(mix(first, second, alpha), 0.0, 255.0) + 0.5) / 255.0;
          if (outputPremultiplied) result.rgb *= result.a;
          if (outputSRGB) result = sRGBTransferEOTF(result);
          gl_FragColor = result;
        }`,
      depthTest: false, depthWrite: false, toneMapped: false, blending: THREE.NoBlending,
    });
    this.scene.add(new THREE.Mesh(this.geometry, this.material));
  }

  /**
   * Resize owned copies only; drawing-buffer pixels remain the source unit.
   * New extents publish only after every old-copy retirement succeeds. A failed
   * retirement closes this owner, retains its old potential extent and cause,
   * and independently retires the remaining quad resources without retries.
   *
   * @evidence contracts/common.md#principled-implementation Admits positive safe-integer drawing-buffer extents and attempts all three old-copy retirements before publishing new images/upload generations. Failure independently retires the quad and retains the closed owner, old potential extent and original causes; reentrant mutations refuse during retirement.
   * @evidence contracts/common.md#clear-and-simple-design One retirement boundary controls the three equal copy extents, with the same terminal failure state used by final disposal rather than an untracked resize recovery allocation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Equal extents reuse an open owner, while a failed old allocation cannot be hidden by new dimensions, retry or another draw. Native public release failure is not treated as physical retirement.
   * @evidence contracts/common.md#meaningful-documentation States drawing-buffer units, success-only extent publication and failed closed-owner retention/refusal, distinguishing invalid-dimension preflight from failed native release.
   * @evidence contracts/performance.md#efficient-algorithms Visits exactly three texture wrappers and, on failure, two quad resources with a fixed-size failure list. Supported success reallocates on subsequent upload; failed owners allocate no new images or native draws.
   * @evidence contracts/performance.md#reuse-equivalent-work Equal dimensions retain open copy allocations without disposal/upload changes. Failed resize shares its stored failure with later resize, draw and disposal instead of repeating any native attempt.
   * @evidence contracts/performance.md#bound-retention-and-release-resources All old-copy releases are attempted before changing extents. A failure retains the previous copy bounds/references and attempts remaining geometry/material release once; physical uncertainty follows the failed owner until its renderer/context lifetime ends.
   */
  public resize(width: number, height: number): void {
    this.assertOpen();
    this.admitSize(width, height);
    if (this.width === width && this.height === height) return;
    this.resizing = new Error("Display-copy retirement is still running.");
    try {
      const failures: unknown[] = [];
      for (const texture of [...this.sources, this.backing]) {
        try { texture.dispose(); } catch (error) { failures.push(error); }
      }
      if (failures.length !== 0) {
        this.disposed = true;
        for (const resource of [this.geometry, this.material]) {
          try { resource.dispose(); } catch (error) { failures.push(error); }
        }
        const error: unknown = failures.length === 1 ? failures[0] : new AggregateError(failures, "Display-copy resize disposal failed.");
        this.disposalFailure = { error };
        throw error;
      }
      this.width = width; this.height = height;
      for (const texture of [...this.sources, this.backing]) {
        texture.image = { width, height }; texture.needsUpdate = true;
      }
    } finally {
      this.resizing = undefined;
    }
  }

  /**
   * Draw one fade or two complementary sources, independently attempting host-state restoration after source, copy or composite failure. An aggregate retains the original failure first. The previous canvas picture is saved before source drawing and its restoration is attempted after failed composition; a failed restoration cannot guarantee the previous display survives.
   *
   * Caller callbacks keep this owner and borrowed renderer alive through the call; a previously closed owner refuses before native observation.
   *
   * @evidence contracts/common.md#principled-implementation Saves canvas bytes before drawing callbacks, composes quantized straight display channels with alpha association and destination sRGB correction, then independently restores framebuffer and renderer state; Float32 rounding is the documented precision limit.
   * @evidence contracts/common.md#clear-and-simple-design Source rendering stays in callbacks, copy synchronization stays in copyDisplay and shared restoration aggregation preserves the primary error before cleanup causes.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Source callbacks must return on the default framebuffer; the renderer's public reset boundary synchronizes native texture units without patching foreign methods or private cache entries.
   * @evidence contracts/common.md#meaningful-documentation Describes fade versus two-source draws, independent restoration attempts and the saved-canvas recovery attempt without guaranteeing that recovery succeeds when its native draw fails.
   * @evidence contracts/performance.md#efficient-algorithms Performs one backing copy, one or two source renders and one full-screen blend over width times height pixels, avoiding CPU readback; restoration can add one backing draw.
   * @evidence contracts/performance.md#reuse-equivalent-work Uses the instance's persistent copies and shader for every frame; each callback is invoked because its effects and newly sampled pixels cannot be shared merely by matching alpha.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows renderer and destination without disposing them and retains the instance's three copies. Independently attempts target, viewport, scissor, clear and tone restoration after success or failure; a restoration failure remains visible and may leave partial host state.
   */
  public render(renderer: THREE.WebGLRenderer, outgoing: () => void, incoming: (() => void) | null, alpha: number): void {
    this.assertOpen();
    const target: ReturnType<THREE.WebGLRenderer["getRenderTarget"]> = renderer.getRenderTarget();
    const restoreFramebuffer: () => void = captureAutoMovieFramebufferRestore(renderer);
    const destinationSRGB: boolean = target !== null && readAutoMovieDisplayDestinationEncoding(renderer) === "srgb";
    const autoClear: boolean = renderer.autoClear;
    const clearColor: THREE.Color = renderer.getClearColor(new THREE.Color()).clone();
    const clearAlpha: number = renderer.getClearAlpha();
    const toneMapping: THREE.ToneMapping = renderer.toneMapping;
    const exposure: number = renderer.toneMappingExposure;
    const premultiplied: boolean = renderer.getContextAttributes()?.premultipliedAlpha === true;
    let primary: {error:unknown} | undefined;
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
      const uniforms: THREE.RawShaderMaterial["uniforms"] = this.material.uniforms;
      uniforms.outgoing!.value = this.sources[0];
      uniforms.incoming!.value = this.sources[1];
      uniforms.alpha!.value = alpha;
      uniforms.fade!.value = incoming === null;
      uniforms.copyBacking!.value = false;
      uniforms.sourcePremultiplied!.value = premultiplied;
      uniforms.outputPremultiplied!.value = target === null && premultiplied;
      uniforms.outputSRGB!.value = destinationSRGB;
      renderer.render(this.scene, this.camera);
    } catch (error) { primary = {error}; }
    const operations: (() => void)[] = [
      (): void => {
        if (!backingSaved || (target === null && primary === undefined)) return;
        renderer.setRenderTarget(null);
        // Restore the complete saved canvas, even when the source or destination
        // used only a scissored viewport. Public setters use logical pixel units.
        renderer.setViewport(new THREE.Vector4(0, 0, this.width, this.height).divideScalar(renderer.getPixelRatio()));
        renderer.setScissorTest(false);
        renderer.autoClear = false;
        renderer.toneMapping = THREE.NoToneMapping;
        renderer.toneMappingExposure = 1;
        this.material.uniforms.outgoing!.value = this.backing;
        this.material.uniforms.copyBacking!.value = true;
        renderer.render(this.scene, this.camera);
      },
      (): void => { renderer.autoClear = autoClear; },
      (): void => { renderer.setClearColor(clearColor, clearAlpha); },
      restoreFramebuffer,
      (): void => { renderer.toneMapping = toneMapping; },
      (): void => { renderer.toneMappingExposure = exposure; },
    ];
    if (primary === undefined) restoreAutoMovieRenderModeState(operations);
    else restoreAutoMovieRenderModeState(operations, primary);
  }

  private capture(renderer: THREE.WebGLRenderer, texture: THREE.FramebufferTexture): void {
    if (renderer.getRenderTarget() !== null) throw new Error("A display source callback must leave the default framebuffer selected.");
    this.copyDisplay(renderer, texture);
  }

  private copyDisplay(renderer: THREE.WebGLRenderer, texture: THREE.FramebufferTexture): void {
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
   * Release only compositor-owned textures, geometry and material once.
   * Closed instances refuse resize/render; repeated disposal preserves its
   * original success or failure and never retries physical resource release.
   *
   * @evidence contracts/common.md#principled-implementation Closes before independently disposing the three copies, quad geometry and shader material; a single failure keeps its identity, multiple causes retain attempt order and repeated callers receive the same stored completion.
   * @evidence contracts/common.md#clear-and-simple-design The disposal list mirrors the compositor's owned allocations and excludes the borrowed renderer, scene callbacks and destination target.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No cleanup failure is swallowed or converted into a successful physical-retirement claim.
   * @evidence contracts/common.md#meaningful-documentation States exact owned resources, terminal render/resize refusal and one-attempt repeated completion rather than asserting native physical release after a listener failure.
   * @evidence contracts/performance.md#efficient-algorithms Attempts a fixed five resources with a failure list bounded by those five calls, independent of rendered frame count.
   * @evidence contracts/performance.md#reuse-equivalent-work Exactly one physical disposal attempt serves all calls to this owner; successful repeats return and failed repeats throw the original stored cause, preventing native retries and false success.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Attempts all owned public release operations and closes future use; resource references remain with the owner on failed/indeterminate retirement, with physical release unverified until its supported renderer/context boundary.
   */
  public dispose(): void {
    if (this.resizing !== undefined) throw this.resizing;
    if (this.disposed) {
      if (this.disposalFailure !== undefined) throw this.disposalFailure.error;
      return;
    }
    this.disposed = true;
    const failures: unknown[] = [];
    for (const resource of [...this.sources, this.backing, this.geometry, this.material]) {
      try { resource.dispose(); } catch (error) { failures.push(error); }
    }
    if (failures.length !== 0) {
      const error: unknown = failures.length === 1 ? failures[0] : new AggregateError(failures, "Display compositor resource disposal failed.");
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
    if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width <= 0 || height <= 0)
      throw new Error("Display composition requires positive integer drawing-buffer dimensions.");
  }

  /**
   * The current owned RGBA8/no-mipmap display-copy extent. Both source sampler
   * uniforms and the saved display can upload, even for a one-layer fade, so
   * their conservative resident closure contains three copies.
   *
   * @evidence contracts/common.md#principled-implementation Reports current drawing-buffer width and height with exactly three RGBA8 no-mipmap copies, including the saved backing that remains part of a fade's resident closure.
   * @evidence contracts/common.md#clear-and-simple-design Returns allocation facts for the budget observer instead of duplicating GPU byte estimation inside the compositor.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The copy count comes from the two source textures and one backing allocation, without substituting a measured or fixture-specific budget.
   * @evidence contracts/common.md#meaningful-documentation Explains format, mip policy, dimensions and why one-source fades still account for all three copies.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Reading two fields and returning one fixed-size record selects no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work These mutable extent facts are read directly and no repeated computation is coordinated.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The returned residency record owns no handles and retains no source textures.
   */
  public describeTextureResidency(): {width:number;height:number;copies:3} {
    return {width:this.width,height:this.height,copies:3};
  }
}
