import type { IAutoMovieFilmResponseRenderer } from "@automovie/render";
import * as THREE from "three";

/**
 * A renderer that records, for every `render` call, what was drawn and the
 * state it was drawn under, without a GPU: the drawn object, the target, the
 * renderer's own curve and exposure, the clear policy, shadow-map updates, the
 * camera's layer mask, the scene's background, which of the watched objects the
 * camera could see and, for a stage's full-frame pass, its program's uniform
 * values.
 *
 * A film response stage drives only this structural surface, so its ordering
 * and restoration are observed through its seam.
 */
export function test_unit_render_draw_createFilmResponseRendererDouble(props: {
  /** The renderer's own curve before the stage runs. */
  toneMapping: THREE.ToneMapping;

  /** The renderer's own exposure before the stage runs. */
  exposure: number;

  /** Objects whose visibility to the camera each render records. */
  watched?: readonly THREE.Object3D[];
}): createFilmResponseRendererDouble.IDouble {
  const renders: createFilmResponseRendererDouble.IRender[] = [];
  let target: THREE.WebGLRenderTarget | null = null;
  const renderer: IAutoMovieFilmResponseRenderer = {
    toneMapping: props.toneMapping,
    toneMappingExposure: props.exposure,
    autoClear: true,
    shadowMap: { autoUpdate: true },
    getRenderTarget: (): THREE.WebGLRenderTarget | null => target,
    setRenderTarget: (next: THREE.WebGLRenderTarget | null): void => {
      target = next;
    },
    render: (object: THREE.Object3D, camera: THREE.Camera): void => {
      renders.push({
        object,
        target,
        toneMapping: renderer.toneMapping,
        exposure: renderer.toneMappingExposure,
        autoClear: renderer.autoClear,
        shadowUpdate: renderer.shadowMap.autoUpdate,
        cameraMask: camera.layers.mask,
        background:
          object instanceof THREE.Scene ? object.background : undefined,
        seen: (props.watched ?? []).map((watched: THREE.Object3D): boolean =>
          watched.layers.test(camera.layers),
        ),
        program: programOf(object),
      });
    },
  };
  return { renderer, renders };
}
/** Types of the recording renderer double. */
export namespace createFilmResponseRendererDouble {
  /** The double and its log. */
  export interface IDouble {
    /** The renderer to hand to the stage. */
    renderer: IAutoMovieFilmResponseRenderer;

    /** Every render call, in order. */
    renders: IRender[];
  }

  /** One render call and the state it ran under. */
  export interface IRender {
    /** The drawn object: the scene, or the stage's own full-frame scene. */
    object: THREE.Object3D;

    /** The target drawn into; null is the canvas. */
    target: THREE.WebGLRenderTarget | null;

    /** The renderer's own curve during the call. */
    toneMapping: THREE.ToneMapping;

    /** The renderer's own exposure during the call. */
    exposure: number;

    /** Whether the call cleared its target. */
    autoClear: boolean;

    /** Whether the call redrew shadow maps. */
    shadowUpdate: boolean;

    /** The camera's layer mask during the call. */
    cameraMask: number;

    /** The drawn scene's background, or undefined for a non-scene object. */
    background: THREE.Scene["background"] | undefined;

    /** For each watched object, whether the camera could see it. */
    seen: boolean[];

    /**
     * For a stage's full-frame pass, a scene whose only child is a mesh with a
     * raw shader program: each uniform's value at the call, a number as is and
     * a vector or matrix as its array, any other value as null. Null for every
     * other draw.
     */
    program: Record<string, unknown> | null;
  }
}

/**
 * The uniform values of the raw shader program a stage's full-frame scene
 * draws, copied at the call, since the stage reuses one quad and its uniform
 * objects across its passes and draws.
 */
function programOf(object: THREE.Object3D): Record<string, unknown> | null {
  const only: THREE.Object3D | undefined =
    object.children.length === 1 ? object.children[0] : undefined;
  const material: unknown =
    only instanceof THREE.Mesh ? (only.material as unknown) : undefined;
  if (!(material instanceof THREE.RawShaderMaterial)) return null;
  return Object.fromEntries(
    Object.entries(material.uniforms).map(
      ([name, uniform]: [string, THREE.IUniform]): [string, unknown] => {
        const value: unknown = uniform.value;
        if (typeof value === "number") return [name, value];
        if (value instanceof THREE.Vector2) return [name, value.toArray()];
        if (value instanceof THREE.Vector3) return [name, value.toArray()];
        if (value instanceof THREE.Matrix3) return [name, value.toArray()];
        if (value instanceof THREE.Matrix4) return [name, value.toArray()];
        return [name, null];
      },
    ),
  );
}
