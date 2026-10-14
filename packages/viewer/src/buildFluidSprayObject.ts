import type { IAutoMovieFluidSpraySample } from "@automovie/interface";
import * as THREE from "three";
import type { IAutoMovieFluidSprayObject } from "./IAutoMovieFluidSprayObject.js";

/**
 * Project one bounded spray sample into a `three.js` point cloud.
 *
 * The engine has already applied the emitter's hard cap and its distance
 * thinning, so the viewer uploads exactly the particles the reference sample
 * declared and never invents a particle of its own. Spray is a `THREE.Points`,
 * which the structural guide passes hide by design: mist is decoration and must
 * not colour a segmentation mask or read as geometry in a depth pass.
 *
 * The default PointsMaterial uses normal blending, one fixed point size and
 * opacity. Uploaded `aSize` and `aAge` require a supplied shader to affect beauty.
 *
 * @evidence contracts/common.md#principled-implementation The engine's admitted capped sample supplies each particle's position, size and age ratio. The builder copies those values to Float32 attributes, computes bounds from positions and hides empty samples; it does not enforce the cap or domain itself.
 * @evidence contracts/common.md#clear-and-simple-design A single Points node projects the sample; particle generation and thinning remain in the engine, while structural passes decide whether points contribute to their documented quantity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No minimum particle population is fabricated. The fixed color, opacity and 0.05 size are authored default display choices; default normal blending and unused custom attributes do not implement additive or per-particle appearance. Constructor and partial-upload rollback are not provided.
 * @evidence contracts/common.md#meaningful-documentation The comment states engine population authority, structural-pass role and the stock material's limitations. Material props identify conditional ownership; count reports the upload length rather than observed visible particles.
 * @evidence contracts/performance.md#efficient-algorithms Upload builds three arrays and Float32 attributes and scans bounds, all linear in particle count. These complete copies match a complete replacement sample rather than a sparse-update protocol.
 * @evidence contracts/performance.md#reuse-equivalent-work Points, geometry identity and material persist across updates; each supplied sample rebuilds buffers and bounds. Matching step metadata is not used as a cache key for particle equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller detaches the node and disposes its owned geometry and optional default material; a supplied material stays borrowed. Disposal is sequential and not memoized, and does not refuse later updates. Engine sampling bounds population, but this viewer type imposes no byte cap; current callers are tests rather than a production spray scene host.
 *
 * @author Samchon
 */
export const buildFluidSprayObject: (props: { sample: IAutoMovieFluidSpraySample; material?: THREE.PointsMaterial; }) => IAutoMovieFluidSprayObject = (props: {
  sample: IAutoMovieFluidSpraySample;
  /** Borrowed spray material; a normal-blending default is owned when absent. */
  material?: THREE.PointsMaterial;
}): IAutoMovieFluidSprayObject => {
  const geometry: THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap> = new THREE.BufferGeometry();
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
  const points: THREE.Points<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.PointsMaterial, THREE.Object3DEventMap> = new THREE.Points(geometry, material);
  points.name = "water-spray";
  let count: number = 0;
  const upload: (sample: IAutoMovieFluidSpraySample) => void = (sample: IAutoMovieFluidSpraySample): void => {
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
      geometry.dispose();
      if (owned) material.dispose();
    },
    count: (): number => count,
  };
};
