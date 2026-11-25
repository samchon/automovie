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
export function createFilmResponseRendererDouble(props: {
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
        background: backgroundOf(object),
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
  // three's literal class flags tell the stage's quad and its raw program.
  const only: THREE.Mesh | undefined =
    object.children.length === 1
      ? (object.children[0] as THREE.Mesh)
      : undefined;
  if (only?.isMesh !== true) return null;
  const material: THREE.RawShaderMaterial =
    only.material as THREE.RawShaderMaterial;
  if (material.isRawShaderMaterial !== true) return null;
  return Object.fromEntries(
    Object.entries(material.uniforms).map(
      ([name, uniform]: [string, THREE.IUniform]): [string, unknown] => {
        const value:
          | THREE.Vector2
          | THREE.Vector3
          | THREE.Matrix3
          | THREE.Matrix4
          | number
          | null = uniform.value;
        if (value === null) return [name, null];
        if (value === +value) return [name, value];
        // Vectors and matrices each copy out through their own toArray.
        const arrayable: THREE.Vector2 = value as THREE.Vector2;
        if (arrayable.toArray !== undefined) return [name, arrayable.toArray()];
        return [name, null];
      },
    ),
  );
}

/** The drawn scene's background, read by three's scene flag. */
function backgroundOf(
  object: THREE.Object3D,
): THREE.Scene["background"] | undefined {
  const scene: THREE.Scene = object as THREE.Scene;
  return scene.isScene === true ? scene.background : undefined;
}
