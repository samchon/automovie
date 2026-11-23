import * as THREE from "three";

/**
 * The scene's lights as the medium's march reads them, in world space, in scene
 * traversal order.
 *
 * Each visible directional, point, spot and rectangular area light becomes one
 * record carrying its colour times its intensity, so every channel is the
 * photometric quantity the beauty pass lights surfaces with: lux for a
 * directional light, candela for point and spot lights and nits for a panel. A
 * directional or spot light's direction of travel runs from the light toward
 * its target, as the renderer aims it; a panel emits toward its local −Z from
 * its local XY plane, with half extents along its world X and Y axes and its
 * scale ignored, as the renderer reads it.
 *
 * A light's shadow is read only while `shadows` is true and the light casts a
 * shadow whose map the renderer has drawn: a compare-mode depth map for
 * percentage-closer filtering, the moments map for variance shadows, a plain
 * depth map otherwise, and a cube compare map for a point light. A point light
 * whose map is not a compare cube casts no shadow in the medium.
 */
export function collectAutoMovieMediumLights(
  scene: THREE.Scene,
  shadows: boolean,
): collectAutoMovieMediumLights.ILight[] {
  scene.updateMatrixWorld();
  const lights: collectAutoMovieMediumLights.ILight[] = [];
  scene.traverseVisible((object: THREE.Object3D): void => {
    if (!(object instanceof THREE.Light)) return;
    const color: THREE.Vector3 = new THREE.Vector3(
      object.color.r,
      object.color.g,
      object.color.b,
    ).multiplyScalar(object.intensity);
    const position: THREE.Vector3 = new THREE.Vector3().setFromMatrixPosition(
      object.matrixWorld,
    );
    const base: Omit<collectAutoMovieMediumLights.ILight, "kind"> = {
      color,
      position,
      direction: new THREE.Vector3(0, 0, -1),
      range: 0,
      cone: -1,
      across: new THREE.Vector3(),
      up: new THREE.Vector3(),
      shadow: null,
    };
    if (
      object instanceof THREE.DirectionalLight ||
      object instanceof THREE.SpotLight
    ) {
      object.target.updateMatrixWorld();
      base.direction
        .setFromMatrixPosition(object.target.matrixWorld)
        .sub(position)
        .normalize();
      base.shadow = shadows ? flatShadow(object) : null;
      if (object instanceof THREE.DirectionalLight)
        lights.push({ ...base, kind: "directional" });
      else
        lights.push({
          ...base,
          kind: "spot",
          range: object.distance,
          cone: Math.cos(object.angle),
        });
    } else if (object instanceof THREE.PointLight)
      lights.push({
        ...base,
        kind: "point",
        range: object.distance,
        shadow: shadows ? cubeShadow(object) : null,
      });
    else if (object instanceof THREE.RectAreaLight) {
      const rotation: THREE.Matrix4 = new THREE.Matrix4().extractRotation(
        object.matrixWorld,
      );
      lights.push({
        ...base,
        kind: "area",
        direction: new THREE.Vector3(0, 0, -1).applyMatrix4(rotation),
        across: new THREE.Vector3(1, 0, 0)
          .applyMatrix4(rotation)
          .multiplyScalar(object.width / 2),
        up: new THREE.Vector3(0, 1, 0)
          .applyMatrix4(rotation)
          .multiplyScalar(object.height / 2),
      });
    }
  });
  return lights;
}

/** The records `collectAutoMovieMediumLights` returns. */
export namespace collectAutoMovieMediumLights {
  /** One light as the medium's march reads it, in world metres. */
  export interface ILight {
    /** The light's kind. */
    kind: "directional" | "point" | "spot" | "area";

    /** Linear colour times intensity, per channel. */
    color: THREE.Vector3;

    /** World position; a panel's centre. */
    position: THREE.Vector3;

    /** Unit direction of travel of a directional or spot light, a panel's front. */
    direction: THREE.Vector3;

    /** Point or spot cutoff distance in metres; zero is unbounded. */
    range: number;

    /** Cosine of a spot light's cone half-angle; −1 for other kinds. */
    cone: number;

    /** A panel's half extent along its width, world metres. */
    across: THREE.Vector3;

    /** A panel's half extent along its height, world metres. */
    up: THREE.Vector3;

    /** The shadow the march tests, or null. */
    shadow: IShadow | null;
  }

  /** A drawn shadow map and how to read it. */
  export interface IShadow {
    /**
     * `"pcf"`: a compare-mode depth map; `"vsm"`: a variance moments map;
     * `"basic"`: a plain depth map; `"point"`: a compare-mode depth cube.
     */
    kind: "pcf" | "vsm" | "basic" | "point";

    /** The texture to sample. */
    map: THREE.Texture;

    /** World to shadow-map texture coordinates, for the flat kinds. */
    matrix: THREE.Matrix4;

    /** The light's depth bias. */
    bias: number;

    /** The shadow camera's near clip, metres. */
    near: number;

    /** The shadow camera's far clip, metres. */
    far: number;
  }
}

/** The drawn flat shadow of a directional or spot light, or null. */
function flatShadow(
  light: THREE.DirectionalLight | THREE.SpotLight,
): collectAutoMovieMediumLights.IShadow | null {
  const map: THREE.RenderTarget | null = light.castShadow
    ? light.shadow.map
    : null;
  if (map === null) return null;
  const depth: THREE.DepthTexture | null = map.depthTexture;
  const kind: "pcf" | "vsm" | "basic" =
    map.texture.format === THREE.RGFormat
      ? "vsm"
      : depth !== null && depth.compareFunction !== null
        ? "pcf"
        : "basic";
  const texture: THREE.Texture | null = kind === "vsm" ? map.texture : depth;
  if (texture === null) return null;
  return {
    kind,
    map: texture,
    matrix: light.shadow.matrix.clone(),
    bias: light.shadow.bias,
    near: light.shadow.camera.near,
    far: light.shadow.camera.far,
  };
}

/** The drawn compare cube of a point light, or null. */
function cubeShadow(
  light: THREE.PointLight,
): collectAutoMovieMediumLights.IShadow | null {
  const map: THREE.RenderTarget | null = light.castShadow
    ? light.shadow.map
    : null;
  const depth: THREE.DepthTexture | null = map?.depthTexture ?? null;
  if (
    map === null ||
    depth === null ||
    !(map instanceof THREE.WebGLCubeRenderTarget) ||
    depth.compareFunction === null
  )
    return null;
  return {
    kind: "point",
    map: depth,
    matrix: new THREE.Matrix4(),
    bias: light.shadow.bias,
    near: light.shadow.camera.near,
    far: light.shadow.camera.far,
  };
}
