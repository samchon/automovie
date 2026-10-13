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
 * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-scene-display-color Captures each already transformed display source once before byte-domain composition.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Keeps source display resolution separate from the raw display-byte operator.
 */
export class AutoMovieDisplayCompositor {
  private readonly sources: THREE.FramebufferTexture[];
  private readonly backing: THREE.FramebufferTexture;
  private readonly material: THREE.RawShaderMaterial;
  private readonly geometry = new THREE.PlaneGeometry(2, 2);
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

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
   * All copies receive the new extent and upload generation even when an
   * independent disposal listener fails, so same-size retries stay coherent.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-lifecycle Invalidates only the compositor's owned display storage when the renderer buffer changes.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Keeps resized GPU products local to this compositor.
   */
  public resize(width: number, height: number): void {
    this.admitSize(width, height);
    if (this.width === width && this.height === height) return;
    this.width = width; this.height = height;
    const failures: unknown[] = [];
    for (const texture of [...this.sources, this.backing]) {
      try { texture.dispose(); } catch (error) { failures.push(error); }
      texture.image = { width, height }; texture.needsUpdate = true;
    }
    if (failures.length === 1) throw failures[0];
    if (failures.length > 1) throw new AggregateError(failures, "Display-copy resize disposal failed.");
  }

  /**
   * Draw one fade or two complementary sources and restore host state even if
   * a source, copy, composite or restoration fails. All restoration operations
   * are attempted, and an aggregate retains the original failure first.
   * The previous canvas picture is retained before any source draw and restored
   * after a failed composition, so partial sources never replace a valid display.
   *
   * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-scene-display-color Weights directly resolved display bytes while preserving each callback's own view transform.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Bypasses an additional display transform on the raw byte quad.
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-state-isolation Restores target, clear, auto-clear and tone state on every exit.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Attempts every restoration and retains primary and restoration failures.
   */
  public render(renderer: THREE.WebGLRenderer, outgoing: () => void, incoming: (() => void) | null, alpha: number): void {
    const target = renderer.getRenderTarget();
    const restoreFramebuffer = captureAutoMovieFramebufferRestore(renderer);
    const destinationSRGB = target !== null && readAutoMovieDisplayDestinationEncoding(renderer) === "srgb";
    const autoClear = renderer.autoClear;
    const clearColor = renderer.getClearColor(new THREE.Color()).clone();
    const clearAlpha = renderer.getClearAlpha();
    const toneMapping = renderer.toneMapping;
    const exposure = renderer.toneMappingExposure;
    const premultiplied = renderer.getContextAttributes()?.premultipliedAlpha === true;
    let primary: {error:unknown} | undefined;
    let backingSaved = false;
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
      const uniforms = this.material.uniforms;
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
    const operations = [
      () => {
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
      () => { renderer.autoClear = autoClear; },
      () => { renderer.setClearColor(clearColor, clearAlpha); },
      restoreFramebuffer,
      () => { renderer.toneMapping = toneMapping; },
      () => { renderer.toneMappingExposure = exposure; },
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
   * Release only compositor-owned textures, geometry and material.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-lifecycle Releases every display copy and quad resource owned by the compositor.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Leaves the caller's renderer and scene lifecycles untouched.
   */
  public dispose(): void {
    const failures: unknown[] = [];
    for (const resource of [...this.sources, this.backing, this.geometry, this.material]) {
      try { resource.dispose(); } catch (error) { failures.push(error); }
    }
    if (failures.length === 1) throw failures[0];
    if (failures.length > 1) throw new AggregateError(failures, "Display compositor resource disposal failed.");
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
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Reports the texture storage this live compositor can retain without inferring encoded image bytes.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Supplies current GPU storage facts for host render-budget assessment.
   */
  public describeTextureResidency(): {width:number;height:number;copies:3} {
    return {width:this.width,height:this.height,copies:3};
  }
}
