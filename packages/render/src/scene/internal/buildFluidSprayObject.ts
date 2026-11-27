import type { IAutoMovieFluidSpraySample } from "@automovie/interface";
import * as THREE from "three";

import type { IAutoMovieFluidSprayObject } from "../IAutoMovieFluidSprayObject.js";
import { reportAutoMovieResourceRetirement } from "./reportAutoMovieResourceRetirement.js";

/*
 * Project one bounded spray sample into a `three.js` point cloud.
 *
 * The Engine's admitted sample supplies the capped and distance-thinned
 * particle population. Structural guide passes hide this Points node because
 * decorative mist does not represent solid mask/depth geometry.
 *
 * The default PointsMaterial uses normal blending, one fixed point size and
 * opacity. Uploaded `aSize` and `aAge` require a supplied shader to affect
 * beauty.
 */
export const buildFluidSprayObject: (props: {
  sample: IAutoMovieFluidSpraySample;
  material?: THREE.PointsMaterial;
}) => IAutoMovieFluidSprayObject = (props: {
  sample: IAutoMovieFluidSpraySample;
  /*
   * Borrowed spray material; a normal-blending default is owned when absent.
   */
  material?: THREE.PointsMaterial;
}): IAutoMovieFluidSprayObject => {
  const geometry: THREE.BufferGeometry<
    THREE.NormalBufferAttributes,
    THREE.BufferGeometryEventMap
  > = new THREE.BufferGeometry();
  const owned: boolean = props.material === undefined;
  const material: THREE.PointsMaterial =
    props.material ??
    new THREE.PointsMaterial({
      color: 0xdff2ff,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
      size: 0.05,
    });
  const points: THREE.Points<
    THREE.BufferGeometry<
      THREE.NormalBufferAttributes,
      THREE.BufferGeometryEventMap
    >,
    THREE.PointsMaterial,
    THREE.Object3DEventMap
  > = new THREE.Points(geometry, material);
  points.name = "water-spray";
  let count: number = 0;
  const upload: (sample: IAutoMovieFluidSpraySample) => void = (
    sample: IAutoMovieFluidSpraySample,
  ): void => {
    const positions: number[] = [];
    const sizes: number[] = [];
    const ages: number[] = [];
    for (const particle of sample.particles) {
      positions.push(
        particle.position.x,
        particle.position.y,
        particle.position.z,
      );
      sizes.push(particle.size);
      ages.push(particle.ageRatio);
    }
    count = sample.particles.length;
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute("aSize", new THREE.Float32BufferAttribute(sizes, 1));
    geometry.setAttribute("aAge", new THREE.Float32BufferAttribute(ages, 1));
    geometry.computeBoundingSphere();
    points.userData.step = sample.step;
    points.visible = count > 0;
  };
  upload(props.sample);
  return {
    object: points,
    update: upload,
    dispose: (): void => {
      reportAutoMovieResourceRetirement([
        (): void => {
          geometry.dispose();
        },
        (): void => {
          if (owned) material.dispose();
        },
      ]);
    },
    count: (): number => count,
  };
};
