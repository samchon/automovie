import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEngineMath } from "@automovie/engine";
import type {
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieTrackCourse,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * Sweep two solid rail profiles through the same frames the carrier reads.
 * Parameter id: Scoped static rail model id.
 * Parameter course: Admitted local course with ordered stations.
 * Parameter gauge: Rail midpoint separation, in metres.
 * Returns: One generated model with two indexed rail strips.
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
          const point: IAutoMovieVector3 = AutoMovieEngineVector3.add(
            frame.translation,
            AutoMovieEngineQuaternion.rotateVector(frame.rotation, { x: x + offset, y, z: 0 }),
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
        baseColor: AutoMovieEngineMath.srgbHexToLinearColor("#696f7d"),
        metallic: 0.55,
        roughness: 0.52,
        opacity: 1,
        emissive: null,
        baseColorTexture: null,
      },
    ],
  };
}

/*
 * Each coarse rail is 0.1 m wide and 0.12 m high, with its top at course
 * height.
 */
const PROFILE: readonly (readonly [number, number])[] = [
  [-0.05, -0.12],
  [0.05, -0.12],
  [0.05, 0],
  [-0.05, 0],
];
