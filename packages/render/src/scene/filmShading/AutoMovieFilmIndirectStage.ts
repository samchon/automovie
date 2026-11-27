import type {
  IAutoMovieFilmShading,
  IAutoMovieIrradianceProbe,
  IAutoMovieIrradianceVolume,
} from "@automovie/interface";
import * as THREE from "three";

import { AutoMovieThreeKind } from "../AutoMovieThreeKind.js";
import { AUTOMOVIE_FILM_RESPONSE_SHADERS } from "../filmResponse/AUTOMOVIE_FILM_RESPONSE_SHADERS.js";
import { collectAutoMovieFilmOverlays } from "../filmResponse/internal/collectAutoMovieFilmOverlays.js";
import { AUTOMOVIE_FILM_OCCLUSION_SHADERS } from "./AUTOMOVIE_FILM_OCCLUSION_SHADERS.js";
import type { IAutoMovieFilmIndirectRenderer } from "./IAutoMovieFilmIndirectRenderer.js";
import { applyFilmIndirectPatch } from "./internal/applyFilmIndirectPatch.js";
import { AutoMovieRenderFilmShading } from "./AutoMovieRenderFilmShading.js";

/**
 * The indirect light of a directly rendered film's beauty pass: measures what a
 * film's `shading` asks for at one second and holds it in the uniforms every
 * lit material of the scene reads while the beauty pass draws.
 *
 * `draw` with a shading that has `probes` or `occlusion`:
 *
 * 1. Patches every lit material in the scene once with `applyFilmIndirectPatch`;
 * 2. With `probes`, bakes them with `AutoMovieRenderFilmShading.bakeProbes` unless the last bake
 *    had the same box, spacing, layer and revision, which by the contract's
 *    meaning of `revision` is exactly what a new bake would give, and stores
 *    the bake as a float texture of nine coefficient texels per probe;
 * 3. With `occlusion`, renders a depth and view-space normal prepass of the scene
 *    through the beauty camera at the beauty raster, background and display
 *    overlays (`toneMapped: false`, which the response stage draws last) off,
 *    every object drawn with one double-sided normal material;
 * 4. Runs the horizon search of `AUTOMOVIE_FILM_OCCLUSION_SHADERS` and its 4 × 4
 *    blur into a visibility target;
 * 5. Turns on the patch's terms that were asked for, calls `beauty`, which draws
 *    the beauty pass (the film response stage), and turns them off again.
 *
 * Without shading, or with a shading that asks for nothing, `draw` only calls
 * `beauty`. The renderer's target, clear policy, the scene's background and
 * override material are restored before it returns or throws, and the patch is
 * off outside `beauty`, so structural passes and other draws see the materials
 * as before. Every occlusion target is filled from this draw's scene and camera
 * alone, so no occlusion result is reused from an earlier frame. Targets are
 * made on the first draw that needs them, resized with the raster and released
 * by `dispose`; the stage keeps the last probe bake only.
 */
export class AutoMovieFilmIndirectStage {
  /**
   * The prepass, raw and blurred visibility targets at the last occlusion
   * raster; null until a draw asks for occlusion.
   */
  private targets_: ITargets | null = null;

  /** The last probe bake and its texture; null until a draw asks for probes. */
  private probes_: IBake | null = null;

  /** The visibility raster, shared by the patched materials' uniform. */
  private readonly filmResolution_: THREE.Vector2 = new THREE.Vector2(1, 1);

  /** The probe grid's minimum corner, shared by its uniform. */
  private readonly probeMin_: THREE.Vector3 = new THREE.Vector3();

  /** The probe grid's counts, shared by its uniform. */
  private readonly probeCounts_: THREE.Vector3 = new THREE.Vector3(1, 1, 1);

  /** The horizon search's projection, shared by its uniform. */
  private readonly projection_: THREE.Matrix4 = new THREE.Matrix4();

  /** The horizon search's inverse projection, shared by its uniform. */
  private readonly inverseProjection_: THREE.Matrix4 = new THREE.Matrix4();

  /** The horizon search's raster, shared by its uniform. */
  private readonly resolution_: THREE.Vector2 = new THREE.Vector2();

  /** The blur's inverse projection, shared by its uniform. */
  private readonly blurInverseProjection_: THREE.Matrix4 = new THREE.Matrix4();

  /** The blur's raster, shared by its uniform. */
  private readonly blurResolution_: THREE.Vector2 = new THREE.Vector2();

  /**
   * The uniforms the patched materials read: the visibility texture and its
   * raster, the probe texture with the grid's minimum corner, spacing and
   * counts, and the two switches, which are 1 only during `beauty`.
   */
  private readonly uniforms_: Record<string, THREE.IUniform> = {
    uFilmOcclusion: { value: null },
    uFilmOcclusionOn: { value: 0 },
    uFilmResolution: { value: this.filmResolution_ },
    uFilmProbes: { value: null },
    uFilmProbesOn: { value: 0 },
    uFilmProbeMin: { value: this.probeMin_ },
    uFilmProbeSpacing: { value: 1 },
    uFilmProbeCounts: { value: this.probeCounts_ },
  };

  /** The double-sided view-space normal material of the occlusion prepass. */
  private readonly normal_: THREE.MeshNormalMaterial =
    new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });

  /** The horizon search program. */
  private readonly occlusion_: THREE.RawShaderMaterial;

  /** The 4 × 4 blur program over the horizon search's visibility. */
  private readonly blur_: THREE.RawShaderMaterial;

  /** The full-frame quad each pass draws with its program. */
  private readonly quad_: THREE.Mesh<
    THREE.PlaneGeometry,
    THREE.RawShaderMaterial
  >;

  /** The scene holding only the quad. */
  private readonly frame_: THREE.Scene = new THREE.Scene();

  /** A camera the quad's clip-space vertices ignore; `render` needs one. */
  private readonly camera_: THREE.OrthographicCamera =
    new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  /**
   * Make the stage's programs; no GPU resource is allocated until a draw needs
   * one.
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
        depthTest: false,
        depthWrite: false,
      });
    this.occlusion_ = material(AUTOMOVIE_FILM_OCCLUSION_SHADERS.occlusion, {
      tDepth: { value: null },
      tNormal: { value: null },
      uProjection: { value: this.projection_ },
      uInverseProjection: { value: this.inverseProjection_ },
      uResolution: { value: this.resolution_ },
      uRadius: { value: 1 },
      uSample: { value: 0 },
    });
    this.blur_ = material(AUTOMOVIE_FILM_OCCLUSION_SHADERS.blur, {
      tVisibility: { value: null },
      tDepth: { value: null },
      uInverseProjection: { value: this.blurInverseProjection_ },
      uResolution: { value: this.blurResolution_ },
    });
    this.quad_ = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.occlusion_);
    this.quad_.frustumCulled = false;
    this.frame_.add(this.quad_);
  }

  /**
   * The uniforms every patched material shares; their values hold only during
   * `beauty`.
   */
  public get uniforms(): Readonly<Record<string, THREE.IUniform>> {
    return this.uniforms_;
  }

  /** Measure the shading of one second, then draw the beauty pass with it. */
  public draw(
    props: {
      /** The renderer; its current target receives the beauty pass. */
      renderer: IAutoMovieFilmIndirectRenderer;

      /** The scene drawn. */
      scene: THREE.Scene;

      /** The beauty camera. */
      camera: THREE.Camera;

      /** The film's shading at the second; absent draws plainly. */
      shading: IAutoMovieFilmShading | undefined;

      /** Whether the film supplies optics at the second. */
      optics: boolean;

      /** The drawn second, which a refusal names. */
      seconds: number;

      /** Beauty raster width in pixels. */
      width: number;

      /** Beauty raster height in pixels. */
      height: number;

      /**
       * Accumulation sample index of #4078's sub-frame loop; 0 for a single
       * sample.
       */
      sample: number;
    },
    beauty: () => void,
  ): void {
    const { shading }: typeof props = props;
    if (shading === undefined) {
      beauty();
      return;
    }
    if (shading.occlusion === undefined && shading.probes === undefined) {
      beauty();
      return;
    }
    props.scene.traverse((object: THREE.Object3D): void => {
      if (AutoMovieThreeKind.isDrawn(object))
        for (const entry of [object.material].flat())
          applyFilmIndirectPatch(entry, this.uniforms_);
    });
    const { renderer, scene, camera }: typeof props = props;
    const prior: {
      target: THREE.WebGLRenderTarget | null;
      autoClear: boolean;
      background: THREE.Scene["background"];
      override: THREE.Material | null;
    } = {
      target: renderer.getRenderTarget(),
      autoClear: renderer.autoClear,
      background: scene.background,
      override: scene.overrideMaterial,
    };
    try {
      // 3. The probes, baked again only when their lit state changed.
      if (shading.probes !== undefined)
        this.probe(renderer, scene, shading.probes);
      const occlusion: IAutoMovieFilmShading.IOcclusion | undefined =
        shading.occlusion;
      if (occlusion !== undefined)
        this.occlude(renderer, scene, camera, occlusion, props);

      // 6. The beauty pass with the measured terms on.
      renderer.setRenderTarget(prior.target);
      renderer.autoClear = prior.autoClear;
      this.uniforms_.uFilmProbesOn!.value =
        shading.probes === undefined ? 0 : 1;
      this.uniforms_.uFilmOcclusionOn!.value = occlusion === undefined ? 0 : 1;
      beauty();
    } finally {
      this.uniforms_.uFilmOcclusionOn!.value = 0;
      this.uniforms_.uFilmProbesOn!.value = 0;
      scene.overrideMaterial = prior.override;
      scene.background = prior.background;
      renderer.setRenderTarget(prior.target);
      renderer.autoClear = prior.autoClear;
    }
  }

  /** Release the targets, the probe bake, the programs and the quad. */
  public dispose(): void {
    this.release();
    this.probes_?.texture.dispose();
    this.probes_ = null;
    this.normal_.dispose();
    this.occlusion_.dispose();
    this.blur_.dispose();
    this.quad_.geometry.dispose();
  }

  /**
   * Bake the probes when their request differs from the last bake's (box,
   * spacing, layer or revision), and point the probe uniforms at the bake.
   */
  private probe(
    renderer: IAutoMovieFilmIndirectRenderer,
    scene: THREE.Scene,
    probes: IAutoMovieFilmShading.IProbes,
  ): void {
    const key: string = JSON.stringify([
      probes.min,
      probes.max,
      probes.spacing,
      probes.layer,
      probes.revision,
    ]);
    if (this.probes_?.key !== key) {
      const volume: IAutoMovieIrradianceVolume = AutoMovieRenderFilmShading.bakeProbes({
        renderer,
        scene,
        probes,
      });
      const data: Float32Array = new Float32Array(9 * volume.probes.length * 4);
      volume.probes.forEach(
        (probe: IAutoMovieIrradianceProbe, row: number): void => {
          for (let k: number = 0; k < 9; ++k)
            data.set(
              [
                probe.coefficients[3 * k]!,
                probe.coefficients[3 * k + 1]!,
                probe.coefficients[3 * k + 2]!,
                k === 0 && probe.valid ? 1 : 0,
              ],
              4 * (9 * row + k),
            );
        },
      );
      const texture: THREE.DataTexture = new THREE.DataTexture(
        data,
        9,
        volume.probes.length,
        THREE.RGBAFormat,
        THREE.FloatType,
      );
      texture.minFilter = THREE.NearestFilter;
      texture.magFilter = THREE.NearestFilter;
      texture.generateMipmaps = false;
      texture.needsUpdate = true;
      this.probes_?.texture.dispose();
      this.probes_ = { key, volume, texture };
    }
    const { volume, texture }: IBake = this.probes_!;
    this.uniforms_.uFilmProbes!.value = texture;
    this.probeMin_.set(volume.min.x, volume.min.y, volume.min.z);
    this.uniforms_.uFilmProbeSpacing!.value = volume.spacing;
    this.probeCounts_.set(volume.counts.x, volume.counts.y, volume.counts.z);
  }

  /** Measure the occlusion visibility of this draw into the visibility target. */
  private occlude(
    renderer: IAutoMovieFilmIndirectRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    occlusion: IAutoMovieFilmShading.IOcclusion,
    props: { width: number; height: number; sample: number },
  ): void {
    const targets: ITargets = this.prepare(props.width, props.height);
    const background: THREE.Scene["background"] = scene.background;
    const override: THREE.Material | null = scene.overrideMaterial;

    // Display overlays state no scene light and are drawn after the response,
    // so they occlude nothing.
    const overlays: Map<THREE.Object3D, number> =
      collectAutoMovieFilmOverlays(scene);
    try {
      // 4. Depth and view-space normals at the beauty raster.
      for (const object of overlays.keys()) object.layers.mask = 0;
      scene.background = null;
      scene.overrideMaterial = this.normal_;
      renderer.autoClear = true;
      renderer.setRenderTarget(targets.normal);
      renderer.render(scene, camera);
      scene.overrideMaterial = override;
      scene.background = background;
      for (const [object, mask] of overlays) object.layers.mask = mask;

      // 5. Horizon search, then the blur over the pattern's period.
      const projection: THREE.Matrix4 = camera.projectionMatrix;
      const inverse: THREE.Matrix4 = camera.projectionMatrixInverse;
      const o: Record<string, THREE.IUniform> = this.occlusion_.uniforms;
      o.tDepth!.value = targets.normal.depthTexture;
      o.tNormal!.value = targets.normal.texture;
      this.projection_.copy(projection);
      this.inverseProjection_.copy(inverse);
      this.resolution_.set(props.width, props.height);
      o.uRadius!.value = occlusion.radius;
      o.uSample!.value = props.sample;
      this.pass(renderer, this.occlusion_, targets.raw);
      const b: Record<string, THREE.IUniform> = this.blur_.uniforms;
      b.tVisibility!.value = targets.raw.texture;
      b.tDepth!.value = targets.normal.depthTexture;
      this.blurInverseProjection_.copy(inverse);
      this.blurResolution_.set(props.width, props.height);
      this.pass(renderer, this.blur_, targets.visibility);
      this.uniforms_.uFilmOcclusion!.value = targets.visibility.texture;
      this.filmResolution_.set(props.width, props.height);
    } finally {
      for (const [object, mask] of overlays) object.layers.mask = mask;
      scene.overrideMaterial = override;
      scene.background = background;
    }
  }

  /** Draw one full-frame pass into a target. */
  private pass(
    renderer: IAutoMovieFilmIndirectRenderer,
    material: THREE.RawShaderMaterial,
    target: THREE.WebGLRenderTarget,
  ): void {
    this.quad_.material = material;
    renderer.setRenderTarget(target);
    renderer.render(this.frame_, this.camera_);
  }

  /** Size the targets to the raster. */
  private prepare(width: number, height: number): ITargets {
    if (
      this.targets_ !== null &&
      this.targets_.width === width &&
      this.targets_.height === height
    )
      return this.targets_;
    this.release();
    const target: (depth: boolean) => THREE.WebGLRenderTarget = (
      depth: boolean,
    ): THREE.WebGLRenderTarget =>
      new THREE.WebGLRenderTarget(width, height, {
        type: THREE.HalfFloatType,
        format: THREE.RGBAFormat,
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        generateMipmaps: false,
        depthBuffer: depth,
        ...(depth
          ? { depthTexture: new THREE.DepthTexture(width, height) }
          : {}),
      });
    this.targets_ = {
      width,
      height,
      normal: target(true),
      raw: target(false),
      visibility: target(false),
    };
    return this.targets_;
  }

  /** Release the targets. */
  private release(): void {
    if (this.targets_ === null) return;
    this.targets_.normal.depthTexture?.dispose();
    this.targets_.normal.dispose();
    this.targets_.raw.dispose();
    this.targets_.visibility.dispose();
    this.targets_ = null;
  }
}

/** The targets of one raster. */
interface ITargets {
  /** Raster width in pixels. */
  width: number;

  /** Raster height in pixels. */
  height: number;

  /** View-space normals with the depth texture. */
  normal: THREE.WebGLRenderTarget;

  /** Visibility before the blur. */
  raw: THREE.WebGLRenderTarget;

  /** Blurred visibility, read by the patched materials. */
  visibility: THREE.WebGLRenderTarget;
}

/** The last probe bake and the request it answers. */
interface IBake {
  /** The serialized box, spacing, layer and revision. */
  key: string;

  /** The baked grid. */
  volume: IAutoMovieIrradianceVolume;

  /**
   * The grid as nine RGBA float texels per probe row, validity in the first
   * texel's alpha.
   */
  texture: THREE.DataTexture;
}
