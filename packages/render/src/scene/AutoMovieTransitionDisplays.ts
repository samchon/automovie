import type {
  IAutoMovieFilmBeautyLayer,
  IAutoMovieFilmDisplayTextureResidency,
} from "@automovie/interface";
import * as THREE from "three";

import { AutoMovieDisplayCompositor } from "./internal/AutoMovieDisplayCompositor.js";
import { AUTOMOVIE_FILM_RESPONSE_SHADERS } from "./AUTOMOVIE_FILM_RESPONSE_SHADERS.js";
import { renderAutoMovieFilmFrame } from "./internal/renderAutoMovieFilmFrame.js";
import { mixAutoMovieStraightAlpha as mixStraightAlphaImplementation } from "./internal/mixAutoMovieStraightAlpha.js";

/**
 * The canvas pictures of a transition's layers, held one at a time and then
 * composited through `AutoMovieTransitionDisplays.composite`, so layers whose placement must
 * be awaited reach the synchronous transition compositor.
 *
 * `hold` copies the canvas, as the last draw left it, into a numbered slot.
 * `composite` hands each layer's slot to `AutoMovieTransitionDisplays.composite` as that
 * layer's source, which replays the held bytes onto the canvas with a raw copy
 * and mixes them in `AutoMovieDisplayCompositor`: two complementary layers
 * dissolve, one fractional layer fades toward opaque black, or with
 * `transparent` toward alpha 0. A replay writes the held bytes unchanged, so
 * the compositor sees exactly the display bytes each layer drew.
 *
 * `overlay` is an empty scene a host attaches a picture's display overlays to,
 * such as the witness cubes of its diagnostics, and `over` draws it onto the
 * canvas after the composite without clearing, so an overlay stands at full
 * strength over a dissolve or a fade instead of being mixed with a layer. An
 * overlay's materials state display colours and ignore depth, as the witness
 * cubes do, so it draws as the film response stage draws its overlays.
 *
 * Each slot's copy is made at the drawing buffer's size on its first hold and
 * remade when that size changes. The owner holds its own fade and dissolve
 * compositors, resized to the drawing buffer at each composite; `dispose`
 * releases the copies, the replay program and both compositors.
 */
export class AutoMovieTransitionDisplays {
  /**
   * The scene a picture's display overlays are attached to while `over` draws
   * them; it holds nothing else.
   */
  public readonly overlay: THREE.Scene = new THREE.Scene();

  /*
   * The held copies, by slot.
   */
  private readonly copies_: (THREE.FramebufferTexture | undefined)[] = [];

  /*
   * The raw copy program a replay draws.
   */
  private readonly material_: THREE.RawShaderMaterial =
    new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: AUTOMOVIE_FILM_RESPONSE_SHADERS.vertex,
      fragmentShader: AUTOMOVIE_FILM_RESPONSE_SHADERS.downsample,
      uniforms: { tSource: { value: null } },
      depthTest: false,
      depthWrite: false,
      blending: THREE.NoBlending,
    });

  /*
   * The full-frame quad the replay draws.
   */
  private readonly quad_: THREE.Mesh<
    THREE.PlaneGeometry,
    THREE.RawShaderMaterial
  > = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material_);

  /*
   * The scene holding only the quad.
   */
  private readonly frame_: THREE.Scene = new THREE.Scene();

  /*
   * A camera the quad's clip-space vertices ignore; `render` needs one.
   */
  private readonly camera_: THREE.OrthographicCamera =
    new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  /*
   * The fade compositor; its copies are sized at the first composite.
   */
  private readonly fade_: AutoMovieDisplayCompositor =
    new AutoMovieDisplayCompositor(1, 1);

  /*
   * The dissolve compositor; its copies are sized at the first composite.
   */
  private readonly dissolve_: AutoMovieDisplayCompositor =
    new AutoMovieDisplayCompositor(1, 1);

  /**
   * Mix two straight-alpha RGBA byte pixels at a weight, as
   * `AutoMovieDisplayCompositor` mixes a dissolve or a fade, and return the
   * straight-alpha result in bytes.
   *
   * Each pixel's colour is first associated with its alpha (colour times alpha
   * over 255), the associated colours and the alphas are mixed with the same
   * weight, `(1 - weight) * outgoing + weight * incoming`, and the colour is
   * divided by the mixed alpha back into straight colour, 0 where the mixed alpha
   * is 0, each rounded to the nearest byte. Mixing straight colour instead lets a
   * transparent pixel's black pull down every half-covered edge, a dark fringe
   * when the layer is composited (Porter and Duff, "Compositing Digital Images",
   * 1984). Two opaque pixels mix exactly as straight colour does.
   *
   * With `incoming` null the mix is a fade toward a fully transparent pixel:
   * associated colour and alpha fall together, so the straight colour stays the
   * outgoing pixel's own and only its alpha falls.
   *
   * It throws for a weight outside `[0, 1]`.
   */
  public static mixStraightAlpha(
    outgoing: readonly [number, number, number, number],
    incoming: readonly [number, number, number, number] | null,
    weight: number,
  ): [number, number, number, number] {
    return mixStraightAlphaImplementation(outgoing, incoming, weight);
  }
  /** Put the quad in its scene; nothing is allocated on the GPU yet. */
  public constructor() {
    this.quad_.frustumCulled = false;
    this.frame_.add(this.quad_);
  }

  /** Copy the canvas picture the last draw left into `slot`. */
  public hold(renderer: THREE.WebGLRenderer, slot: number): void {
    const size: THREE.Vector2 = renderer.getDrawingBufferSize(
      new THREE.Vector2(),
    );
    let copy: THREE.FramebufferTexture | undefined = this.copies_[slot];
    if (
      copy === undefined ||
      copy.image.width !== size.x ||
      copy.image.height !== size.y
    ) {
      copy?.dispose();
      copy = new THREE.FramebufferTexture(size.x, size.y);
      this.copies_[slot] = copy;
    }

    // As `AutoMovieDisplayCompositor` copies: the copy acts on the active
    // texture unit, which a reset of the renderer's state cache selects again.
    renderer.resetState();
    renderer.setRenderTarget(null);
    renderer.copyFramebufferToTexture(copy);
  }

  /**
   * Composite the held layers onto the canvas: each layer names the slot its
   * picture was held in and carries its weight, outgoing first.
   */
  public composite(
    renderer: THREE.WebGLRenderer,
    layers: readonly (IAutoMovieFilmBeautyLayer & { slot: number })[],
    transparent: boolean,
  ): void {
    renderAutoMovieFilmFrame(
      renderer,
      { fade: this.fade_, dissolve: this.dissolve_ },
      layers,
      "beauty",
      (layer: { slot: number; weight: number }): void =>
        this.replay(renderer, layer.slot),
      undefined,
      transparent,
    );
  }

  /**
   * Draw `overlay` onto the canvas through `camera` over what the canvas holds,
   * without clearing it; the renderer's clear policy and target are restored.
   * An empty overlay draws nothing.
   */
  public over(renderer: THREE.WebGLRenderer, camera: THREE.Camera): void {
    if (this.overlay.children.length === 0) return;
    const target: THREE.WebGLRenderTarget | null = renderer.getRenderTarget();
    const autoClear: boolean = renderer.autoClear;
    renderer.setRenderTarget(null);
    renderer.autoClear = false;
    try {
      renderer.render(this.overlay, camera);
    } finally {
      renderer.autoClear = autoClear;
      renderer.setRenderTarget(target);
    }
  }

  /** Release the copies, the replay program and the compositor states. */
  public dispose(): void {
    for (const copy of this.copies_) copy?.dispose();
    this.copies_.length = 0;
    this.material_.dispose();
    this.quad_.geometry.dispose();
    this.fade_.dispose();
    this.dissolve_.dispose();
  }

  /**
   * The compositor storage this owner holds for render-budget hosts: each
   * compositor's three RGBA8 display copies at their current extent.
   */
  public residency(): IAutoMovieFilmDisplayTextureResidency[] {
    return [
      { owner: "film-fade", ...this.fade_.describeTextureResidency() },
      { owner: "film-dissolve", ...this.dissolve_.describeTextureResidency() },
    ];
  }

  /*
   * Draw slot `slot`'s held bytes onto the canvas unchanged.
   */
  private replay(renderer: THREE.WebGLRenderer, slot: number): void {
    const copy: THREE.FramebufferTexture | undefined = this.copies_[slot];
    if (copy === undefined)
      throw new Error(`No transition layer is held in slot ${slot}`);
    this.material_.uniforms.tSource!.value = copy;
    renderer.render(this.frame_, this.camera_);
  }
}
