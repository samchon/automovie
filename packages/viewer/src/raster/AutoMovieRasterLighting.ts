import * as THREE from "three";

/**
 * The scene's lights, read once per frame, and the diffuse irradiance they
 * give a surface point: what `rasterizeAutoMovieScene` multiplies by a
 * material's albedo.
 *
 * Ambient, hemisphere, directional, point, spot and rectangular-area lights
 * contribute with three.js's punctual-light conventions: colour times
 * intensity, Lambert cosine, the renderer's distance attenuation and the spot
 * cone falloff; an area light is treated as a point at its position. Shadows,
 * light probes and environment maps are not modelled. A scene with no light
 * gets a camera headlight and an ambient term so its shapes stay readable.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment lists every light kind read, the conventions applied, what is not modelled, and the fallback for an unlit scene.
 * @evidence contracts/development/design.md#principled-representation Lights are flattened once into world-space records, so each triangle's shading is a loop over plain numbers instead of a scene traversal.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A constructor and one shading query; light records stay private.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No light is recognised by name or production; the fallback depends only on the absence of lights.
 */
export class AutoMovieRasterLighting {
  /** World-space light records. */
  private readonly lights: ILight[];

  /**
   * Read the visible lights under `scene`.
   *
   * @param scene The drawn scene graph, with current world matrices.
   * @param camera The drawing camera, used for the fallback headlight.
   */
  public constructor(scene: THREE.Object3D, camera: THREE.Camera) {
    this.lights = [];
    scene.traverseVisible((object: THREE.Object3D): void => {
      if (!(object instanceof THREE.Light)) return;
      const color: [number, number, number] = [
        object.color.r * object.intensity,
        object.color.g * object.intensity,
        object.color.b * object.intensity,
      ];
      const position: THREE.Vector3 = new THREE.Vector3().setFromMatrixPosition(
        object.matrixWorld,
      );
      if (object instanceof THREE.AmbientLight)
        this.lights.push({ kind: "ambient", color });
      else if (object instanceof THREE.HemisphereLight)
        this.lights.push({
          kind: "hemisphere",
          color,
          ground: [
            object.groundColor.r * object.intensity,
            object.groundColor.g * object.intensity,
            object.groundColor.b * object.intensity,
          ],
          direction: position.clone().normalize(),
        });
      else if (object instanceof THREE.DirectionalLight)
        this.lights.push({
          kind: "directional",
          color,
          direction: position
            .clone()
            .sub(
              new THREE.Vector3().setFromMatrixPosition(
                object.target.matrixWorld,
              ),
            )
            .normalize(),
        });
      else if (object instanceof THREE.SpotLight)
        this.lights.push({
          kind: "point",
          color,
          position,
          distance: object.distance,
          decay: object.decay,
          cone: {
            axis: new THREE.Vector3()
              .setFromMatrixPosition(object.target.matrixWorld)
              .sub(position)
              .normalize(),
            outer: Math.cos(object.angle),
            inner: Math.cos(object.angle * (1 - object.penumbra)),
          },
        });
      else if (object instanceof THREE.PointLight)
        this.lights.push({
          kind: "point",
          color,
          position,
          distance: object.distance,
          decay: object.decay,
        });
      else if (object instanceof THREE.RectAreaLight)
        this.lights.push({
          kind: "point",
          color,
          position,
          distance: 0,
          decay: 2,
        });
    });

    // An unlit scene would draw black; a headlight and ambient term keep its
    // shapes readable, scaled by pi so Lambert albedo comes out at 0.3 + 0.8 cos.
    if (this.lights.length === 0) {
      camera.updateMatrixWorld();
      this.lights.push(
        {
          kind: "ambient",
          color: [0.3 * Math.PI, 0.3 * Math.PI, 0.3 * Math.PI],
        },
        {
          kind: "directional",
          color: [0.8 * Math.PI, 0.8 * Math.PI, 0.8 * Math.PI],
          direction: new THREE.Vector3(0.3, 0.5, 1)
            .normalize()
            .transformDirection(camera.matrixWorld),
        },
      );
    }
  }

  /**
   * Diffuse irradiance at a world point with a unit world normal, linear RGB.
   * Dividing by pi and multiplying by albedo gives the reflected colour, as
   * three.js's Lambert BRDF does.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs' spaces, the output's meaning and how a caller turns it into colour.
   * @evidence contracts/development/implementation.md#principled-implementation Each light kind uses three.js's own formula: cosine for directional, sky/ground mix for hemisphere, cutoff-windowed inverse power decay and smoothstep cone for punctual lights.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop with one branch per light kind.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Back-facing light contributes nothing instead of being mirrored; no light is boosted.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the number of lights.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Light records were flattened once in the constructor.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Allocates only the returned triple.
   */
  public irradiance(
    point: THREE.Vector3,
    normal: THREE.Vector3,
  ): [number, number, number] {
    let r: number = 0;
    let g: number = 0;
    let b: number = 0;
    for (const light of this.lights) {
      let weight: number = 0;
      if (light.kind === "ambient") weight = 1;
      else if (light.kind === "hemisphere") {
        const sky: number = 0.5 * normal.dot(light.direction) + 0.5;
        r += light.ground[0] + (light.color[0] - light.ground[0]) * sky;
        g += light.ground[1] + (light.color[1] - light.ground[1]) * sky;
        b += light.ground[2] + (light.color[2] - light.ground[2]) * sky;
        continue;
      } else if (light.kind === "directional")
        weight = Math.max(0, normal.dot(light.direction));
      else {
        const dx: number = light.position.x - point.x;
        const dy: number = light.position.y - point.y;
        const dz: number = light.position.z - point.z;
        const distance: number = Math.hypot(dx, dy, dz);
        if (distance === 0) continue;
        const cosine: number =
          (normal.x * dx + normal.y * dy + normal.z * dz) / distance;
        if (cosine <= 0) continue;
        weight = cosine * attenuation(distance, light.distance, light.decay);
        if (light.cone !== undefined) {
          const along: number =
            -(
              light.cone.axis.x * dx +
              light.cone.axis.y * dy +
              light.cone.axis.z * dz
            ) / distance;
          weight *= smoothstep(light.cone.outer, light.cone.inner, along);
        }
      }
      r += light.color[0] * weight;
      g += light.color[1] * weight;
      b += light.color[2] * weight;
    }
    return [r, g, b];
  }
}

/** One flattened world-space light. */
type ILight =
  | { kind: "ambient"; color: [number, number, number] }
  | {
      kind: "hemisphere";
      color: [number, number, number];
      ground: [number, number, number];
      direction: THREE.Vector3;
    }
  | {
      kind: "directional";
      color: [number, number, number];
      direction: THREE.Vector3;
    }
  | {
      kind: "point";
      color: [number, number, number];
      position: THREE.Vector3;
      distance: number;
      decay: number;
      cone?: { axis: THREE.Vector3; outer: number; inner: number };
    };

/** three.js's punctual-light distance attenuation. */
function attenuation(distance: number, cutoff: number, decay: number): number {
  let falloff: number = 1 / Math.max(Math.pow(distance, decay), 0.01);
  if (cutoff > 0) {
    const ratio: number = Math.min(
      1,
      Math.max(0, 1 - Math.pow(distance / cutoff, 4)),
    );
    falloff *= ratio * ratio;
  }
  return falloff;
}

/** Hermite step between two edges, as GLSL's `smoothstep`. */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t: number = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
