import { Quaternion, Vector3, srgbHexToLinearColor } from "@automovie/engine";
import type {
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieTrackCourse,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/** Each coarse rail is 0.1 m wide and 0.12 m high, with its top at course height. */
const PROFILE: readonly (readonly [number, number])[] = [
  [-0.05, -0.12],
  [0.05, -0.12],
  [0.05, 0],
  [-0.05, 0],
];

/**
 * Sweep two solid rail profiles through the same frames the carrier reads.
 *
 * @param id Scoped static rail model id.
 * @param course Admitted local course with ordered stations.
 * @param gauge Rail midpoint separation, in metres.
 * @returns One generated model with two indexed rail strips.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Places the same four profile corners on every station frame and connects corresponding edges. Ends have opposed outward caps for open rails; closed rails share seam indices without coincident copies.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Reuses one sampled frame array for both profiles, then emits each mesh and its one material.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts This is coarse scenic rail geometry. The fixed rectangular section is not an engineering rail section and the sampled strips do not certify track clearances, strength or walkability.
 * @evidence contracts/development/common.md#meaningful-documentation States the local coordinate and gauge rules, strip topology and the intended visual level of detail.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the number of emitted stations after course evaluation, with four vertices and two triangles per side edge on each station span.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Samples stations once and uses the same frame array for the two rails.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the output vertex/index buffers outlive construction; no cache or process is retained.
 */
export function createTrackedRails(
  id: string,
  course: IAutoMovieTrackCourse.IPrepared,
  gauge: number,
): IAutoMovieModel {
  const stations: readonly number[] = course.closed
    ? course.stations.slice(0, -1)
    : course.stations;
  const frames: IAutoMovieTransform[] = stations.map(
    (distance: number): IAutoMovieTransform => course.frame(distance),
  );
  const parts: IAutoMovieModelPart[] = [-gauge / 2, gauge / 2].map(
    (offset: number, rail: number): IAutoMovieModelPart => {
      const positions: number[] = [];
      const indices: number[] = [];
      for (const frame of frames)
        for (const [x, y] of PROFILE) {
          const point: IAutoMovieVector3 = Vector3.add(
            frame.translation,
            Quaternion.rotateVector(frame.rotation, { x: x + offset, y, z: 0 }),
          );
          positions.push(point.x, point.y, point.z);
        }

      const spans: number = course.closed ? frames.length : frames.length - 1;
      for (let station: number = 0; station < spans; ++station) {
        const a: number = 4 * station;
        const b: number = 4 * ((station + 1) % frames.length);
        for (let corner: number = 0; corner < 4; ++corner) {
          const next: number = (corner + 1) % 4;
          indices.push(
            a + corner,
            a + next,
            b + next,
            a + corner,
            b + next,
            b + corner,
          );
        }
      }
      if (!course.closed) {
        const tip: number = 4 * (frames.length - 1);
        indices.push(
          0,
          2,
          1,
          0,
          3,
          2,
          tip,
          tip + 1,
          tip + 2,
          tip,
          tip + 2,
          tip + 3,
        );
      }
      return {
        id: rail === 0 ? "right" : "left",
        name: null,
        attachedBone: null,
        transform: null,
        material: "steel",
        geometry: {
          type: "mesh",
          mesh: { positions, indices, normals: null, uvs: null, skin: null },
        },
      };
    },
  );
  return {
    id,
    name: "Tracked ride rails",
    origin: "generated",
    parts,
    skeleton: null,
    body: null,
    asset: null,
    materials: [
      {
        id: "steel",
        name: "Scenic rail steel",
        baseColor: srgbHexToLinearColor("#696f7d"),
        metallic: 0.55,
        roughness: 0.52,
        opacity: 1,
        emissive: null,
        baseColorTexture: null,
      },
    ],
  };
}
