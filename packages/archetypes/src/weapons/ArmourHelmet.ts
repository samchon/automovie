import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeConvexCell } from "../core";
import { ArmourCell } from "./ArmourCell";
import type { ArmourProfile } from "./ArmourProfile";

/**
 * A real faceted bowl, its declared face/neck openings and a brim.
 *
 * Latitude/face domains and the unfitted cabasset crown's three-quarter brim
 * fraction are explicit coarse authoring choices, not museum measurements. The
 * armet record23232 keeps its missing visor; record26508 retains face coverage
 * with a viewing opening. Sallet25388 retains its present associated visor
 * (https://www.metmuseum.org/art/collection/search/25388), while the armet
 * lacks its original visor
 * (https://www.metmuseum.org/art/collection/search/23232). No missing collar
 * lames are reconstructed. Unfitted ellipses keep their original outer envelope
 * and one shared inner scale. Their plate value is the minimum authored normal
 * gauge across the bowl, not a uniform measured thickness of the original
 * specimen.
 */
export function ArmourHelmet(
  profile: ArmourProfile.IProfile,
): readonly ArmourProfile.ICell[] {
  const cells: ArmourProfile.ICell[] = [];
  const prepared: Map<string, ArmourProfile.ICell> = new Map();
  const brimmed: boolean = profile.kind === "brimmedHelmet";
  const cavity: number | undefined = profile.fitted
    ? profile.inner.x / 2
    : undefined;
  const count: number = 16;
  const lower: number = brimmed ? 0 : -Math.PI / 4;
  const step: number = (2 * Math.PI) / count;
  const cosine: number = Math.cos(step / 2);
  const rows: number = Math.round((Math.PI / 2 - lower) / step);
  const rx: number =
    (profile.outer.x / 2) *
    (profile.fitted ? 1 / (cosine * cosine) : brimmed ? 3 / 4 : 1);
  const rz: number =
    (profile.outer.z / 2) *
    (profile.fitted ? 1 / (cosine * cosine) : brimmed ? 3 / 4 : 1);
  const bottom: number =
    brimmed && !profile.fitted
      ? -profile.record.y / 2 + profile.wall
      : -profile.record.y / 2;
  const ry: number = profile.fitted
    ? profile.outer.y / 2 / cosine
    : (profile.record.y / 2 - bottom) / (1 - Math.sin(lower));
  const cy: number = profile.fitted ? 0 : profile.record.y / 2 - ry;
  const centre: IAutoMovieVector3 = { x: 0, y: cy, z: 0 };
  const lattice: Map<string, readonly IAutoMovieVector3[]> = new Map();
  for (let row: number = 0; row < rows; row++)
    for (
      let canonical: number = 0;
      canonical < (profile.fitted ? 1 : count / 2);
      canonical++
    ) {
      const angle: number = canonical * step;
      lattice.set(`bowl-${row}-${canonical}`, [
        point(row, angle),
        point(row, angle + step),
        ...(row === rows - 1
          ? [{ x: 0, y: cy + ry, z: 0 }]
          : [point(row + 1, angle + step), point(row + 1, angle)]),
      ]);
    }
  const minimum: number | undefined = profile.fitted
    ? undefined
    : ArmourCell.minimumDistance(lattice.values(), centre);
  for (let row: number = 0; row < rows; row++) {
    const latitude: number = lower + row * step;
    for (let index: number = 0; index < count; index++) {
      const angle: number = index * step;
      const canonical: number = profile.fitted ? 0 : index % (count / 2);
      const sourceAngle: number = canonical * step;
      const rotation: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
        { x: 0, y: 1, z: 0 },
        ((angle - sourceAngle) * 180) / Math.PI,
      );
      const front: number = Math.cos(angle + step / 2);
      const midpoint: number = latitude + step / 2;
      if (!brimmed && midpoint < 0) {
        if (
          profile.kind === "openHelmet" &&
          profile.model !== "met25388" &&
          front > 0
        )
          continue;
        if (
          profile.kind === "closedHelmet" &&
          profile.model === "met23232" &&
          front > Math.SQRT1_2
        )
          continue;
        if (
          (profile.model === "met26508" || profile.model === "met25388") &&
          midpoint >= -Math.PI / 8 &&
          front > Math.SQRT1_2
        )
          continue;
      }
      face(`bowl-${row}-${index}`, `bowl-${row}-${canonical}`, rotation);
    }
  }
  if (brimmed) {
    const outerX: number = profile.fitted
      ? profile.record.z / 2
      : profile.record.x / 2;
    const outerZ: number = profile.record.z / 2;
    for (let index: number = 0; index < count; index++) {
      const canonical: number = profile.fitted ? 0 : index % (count / 2);
      const a: number = canonical * step;
      const b: number = (canonical + 1) * step;
      const rotation: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
        { x: 0, y: 1, z: 0 },
        ((index - canonical) * step * 180) / Math.PI,
      );
      const key: string = `brim-${canonical}`;
      const base: ArmourProfile.ICell = prepared.get(`bowl-0-${canonical}`)!;
      const innerA: IAutoMovieVector3 = base.points[4]!;
      const innerB: IAutoMovieVector3 = base.points[5]!;
      const high: number = innerA.y;
      const low: number = high - profile.wall;
      const radiusA: number = Math.hypot(innerA.x / outerX, innerA.z / outerZ);
      const radiusB: number = Math.hypot(innerB.x / outerX, innerB.z / outerZ);
      if (!(radiusA > 0 && radiusA < 1 && radiusB > 0 && radiusB < 1))
        throw new RangeError(
          "The selected brim rim cannot contain the actual padded bowl base with a positive shared wall joint",
        );
      const outer: IAutoMovieVector3[] = [
        brim(a, low),
        brim(a, high),
        brim(b, high),
        brim(b, low),
      ];
      place(
        `brim-${index}`,
        key,
        {
          id: key,
          points: [
            ...outer,
            { ...innerA, y: low },
            { ...innerA, y: high },
            { ...innerB, y: high },
            { ...innerB, y: low },
          ],
        },
        rotation,
      );

      /** The source brim's independent width/depth own its extrema. */
      function brim(angle: number, y: number): IAutoMovieVector3 {
        return { x: outerX * Math.sin(angle), y, z: outerZ * Math.cos(angle) };
      }
    }
  }
  return cells;

  /** One named analytic bowl point; no emitted mesh is sampled to place it. */
  function point(row: number, angle: number): IAutoMovieVector3 {
    const latitude: number = lower + row * step;
    return {
      x: rx * Math.cos(latitude) * Math.sin(angle),
      y: cy + ry * Math.sin(latitude),
      z: rz * Math.cos(latitude) * Math.cos(angle),
    };
  }

  /** Each planar face has one admitted inward wall boundary. */
  function face(id: string, key: string, rotation: IAutoMovieQuaternion): void {
    if (!prepared.has(key))
      place(
        id,
        key,
        ArmourCell.radial(
          key,
          lattice.get(key)!,
          centre,
          profile.wall,
          cavity,
          profile.fitted ? "lattice" : "radial",
          minimum,
        ),
        rotation,
      );
    else cells.push({ ...prepared.get(key)!, id, rotation });
  }

  /**
   * Only an exact rigid-equivalent local wall shares its admitted hull and
   * mass.
   */
  function place(
    id: string,
    key: string,
    cell: ArmourProfile.ICell,
    rotation: IAutoMovieQuaternion,
  ): void {
    if (!prepared.has(key))
      prepared.set(key, {
        ...cell,
        prepared: AutoMovieArchetypeConvexCell.of(cell.points),
      });
    cells.push({ ...prepared.get(key)!, id, rotation });
  }
}
