import type { IAutoMovieMedium } from "@automovie/interface";
import * as THREE from "three";

import { AutoMovieThreeKind } from "../AutoMovieThreeKind.js";
import { AUTOMOVIE_FILM_RESPONSE_SHADERS } from "../filmResponse/AUTOMOVIE_FILM_RESPONSE_SHADERS.js";
import type { AutoMovieFilmAlpha } from "../filmResponse/AutoMovieFilmAlpha.js";
import type { IAutoMovieFilmResponseRenderer } from "../filmResponse/IAutoMovieFilmResponseRenderer.js";
import { buildAutoMovieMediumShader } from "./buildAutoMovieMediumShader.js";
import { collectAutoMovieMediumLights } from "./collectAutoMovieMediumLights.js";
import { readAutoMovieSceneMedium } from "./readAutoMovieSceneMedium.js";

/** The golden ratio's conjugate, the step of the dither shift per sample. */
const GOLDEN: number = (Math.sqrt(5) - 1) / 2;

/**
 * The film response stage's participating-medium pass: march the scene's
 * physical haze over the linear beauty target, in place, right after the
 * scene's linear light is drawn.
 *
 * `apply` does nothing for a scene without a medium. Otherwise it collects the
 * scene's lights and their drawn shadow maps, compiles or reuses the march
 * program for that light signature (`buildAutoMovieMediumShader`), marches into
 * its own half-float target reading the linear colour and depth, and copies the
 * result back over the linear colour and alpha, leaving the depth. The dither
 * shift of sample `index` is `index × 0.618…` modulo one, an additive
 * recurrence that spreads the accumulated samples' first steps evenly; a single
 * draw uses index 0. Nothing is reused from an earlier frame but compiled
 * programs and the target.
 *
 * The renderer's shadow maps are read only when its `shadowMap.enabled` is
 * true, because a disabled renderer leaves stale maps behind.
 */
export class AutoMovieFilmMediumPass {
  /** The march output, or null before the first medium draw. */
  private target_: THREE.WebGLRenderTarget | null = null;

  /** March programs by light signature. */
  private readonly programs_: Map<string, THREE.RawShaderMaterial> = new Map();

  /** The copy program writing the march back over the linear colour. */
  private readonly copy_: THREE.RawShaderMaterial = new THREE.RawShaderMaterial(
    {
      glslVersion: THREE.GLSL3,
      vertexShader: AUTOMOVIE_FILM_RESPONSE_SHADERS.vertex,
      fragmentShader: AUTOMOVIE_FILM_RESPONSE_SHADERS.downsample,
      uniforms: { tSource: { value: null } },
      depthTest: false,
      depthWrite: false,
    },
  );

  /** The full-frame quad. */
  private readonly quad_: THREE.Mesh<THREE.PlaneGeometry, THREE.Material> =
    new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.copy_);

  /** The scene holding only the quad. */
  private readonly frame_: THREE.Scene = new THREE.Scene();

  /** A camera the quad's clip-space vertices ignore. */
  private readonly camera_: THREE.OrthographicCamera =
    new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  /** Put the quad in its scene; nothing is allocated on the GPU yet. */
  public constructor() {
    this.quad_.frustumCulled = false;
    this.frame_.add(this.quad_);
  }

  /**
   * March the scene's medium over `linear`, in place, when the scene carries
   * one; the renderer's target is restored before returning or throwing.
   */
  public apply(props: {
    /** The renderer, whose shadow maps the scene's render just drew. */
    renderer: IAutoMovieFilmResponseRenderer;

    /** The scene, carrying its medium. */
    scene: THREE.Scene;

    /** The camera the linear target was drawn through. */
    camera: THREE.Camera;

    /** The linear target with its depth texture. */
    linear: THREE.WebGLRenderTarget;

    /** The accumulation sample index, 0 for a single draw. */
    index: number;

    /**
     * How the picture's alpha is kept; absent marches an opaque picture, as
     * `buildAutoMovieMediumShader` states for each.
     */
    alpha?: AutoMovieFilmAlpha;
  }): void {
    const medium: IAutoMovieMedium | null = readAutoMovieSceneMedium(
      props.scene,
    );
    if (medium === null) return;
    const { renderer, linear, camera }: typeof props = props;
    const lights: collectAutoMovieMediumLights.ILight[] =
      collectAutoMovieMediumLights(
        props.scene,
        renderer.shadowMap.enabled === true,
      );
    const signature: string = lights
      .map(
        (light: collectAutoMovieMediumLights.ILight): string =>
          `${light.kind}:${light.shadow?.kind ?? "none"}`,
      )
      .join(",");

    // Uniforms of this draw: the camera, the medium and every light.
    camera.updateMatrixWorld();
    const uniforms: Record<string, THREE.IUniform> = {
      tColor: { value: linear.texture },
      tDepth: { value: linear.depthTexture },
      uProjectionInverse: { value: camera.projectionMatrixInverse.clone() },
      uCameraWorld: { value: camera.matrixWorld.clone() },
      uEye: {
        value: new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld),
      },
      uOrthographic: {
        value: AutoMovieThreeKind.isOrthographicCamera(camera) ? 1 : 0,
      },
      uScattering: { value: medium.scattering },
      uExtinction: { value: medium.scattering + medium.absorption },
      uAnisotropy: { value: medium.anisotropy },
      uShift: { value: (props.index * GOLDEN) % 1 },
      uMatte: { value: props.alpha === "coverage" ? 1 : 0 },
    };
    lights.forEach(
      (light: collectAutoMovieMediumLights.ILight, i: number): void => {
        uniforms[`uColor${i}`] = { value: light.color };
        uniforms[`uPosition${i}`] = { value: light.position };
        uniforms[`uDirection${i}`] = { value: light.direction };
        uniforms[`uRange${i}`] = { value: light.range };
        uniforms[`uCone${i}`] = { value: light.cone };
        uniforms[`uAcross${i}`] = { value: light.across };
        uniforms[`uUp${i}`] = { value: light.up };
        if (light.shadow !== null) {
          uniforms[`uShadow${i}`] = { value: light.shadow.map };
          uniforms[`uShadowMatrix${i}`] = { value: light.shadow.matrix };
          uniforms[`uBias${i}`] = { value: light.shadow.bias };
          uniforms[`uNearFar${i}`] = {
            value: new THREE.Vector2(light.shadow.near, light.shadow.far),
          };
        }
      },
    );

    // The renderer keeps the uniform record a program was compiled with, so a
    // reused program's values are written into that record.
    let program: THREE.RawShaderMaterial | undefined =
      this.programs_.get(signature);
    if (program === undefined) {
      program = new THREE.RawShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: AUTOMOVIE_FILM_RESPONSE_SHADERS.vertex,
        fragmentShader: buildAutoMovieMediumShader(lights),
        uniforms,
        depthTest: false,
        depthWrite: false,
      });
      this.programs_.set(signature, program);
    } else
      for (const [name, uniform] of Object.entries(uniforms))
        program.uniforms[name]!.value = uniform.value;

    const target: THREE.WebGLRenderTarget = this.prepare(
      linear.width,
      linear.height,
    );
    const prior: THREE.WebGLRenderTarget | null = renderer.getRenderTarget();
    const autoClear: boolean = renderer.autoClear;
    try {
      this.quad_.material = program;
      renderer.autoClear = true;
      renderer.setRenderTarget(target);
      renderer.render(this.frame_, this.camera_);
      this.copy_.uniforms.tSource!.value = target.texture;
      this.quad_.material = this.copy_;
      renderer.autoClear = false;
      renderer.setRenderTarget(linear);
      renderer.render(this.frame_, this.camera_);
    } finally {
      renderer.setRenderTarget(prior);
      renderer.autoClear = autoClear;
    }
  }

  /** Release the target, the programs and the quad. */
  public dispose(): void {
    this.target_?.dispose();
    this.target_ = null;
    for (const program of this.programs_.values()) program.dispose();
    this.programs_.clear();
    this.copy_.dispose();
    this.quad_.geometry.dispose();
  }

  /** The march target at a raster, made or remade as needed. */
  private prepare(width: number, height: number): THREE.WebGLRenderTarget {
    if (
      this.target_ !== null &&
      this.target_.width === width &&
      this.target_.height === height
    )
      return this.target_;
    this.target_?.dispose();
    this.target_ = new THREE.WebGLRenderTarget(width, height, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      generateMipmaps: false,
      depthBuffer: false,
    });
    return this.target_;
  }
}
