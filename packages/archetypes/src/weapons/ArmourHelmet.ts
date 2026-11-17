import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ArchetypeConvexCell } from "../core";
import { ArmourCell } from "./ArmourCell";
import type { ArmourProfile } from "./ArmourProfile";

/**
 * A real faceted bowl, its declared face/neck openings and an actual brim.
 *
 * Latitude/face domains and the unfitted cabasset crown's three-quarter brim
 * fraction are explicit coarse authoring choices, not museum measurements.
 * The armet record23232 keeps its missing visor; record26508 retains face
 * coverage with a viewing opening. Sallet25388 retains its present associated
 * visor (https://www.metmuseum.org/art/collection/search/25388), while the armet
 * lacks its original visor (https://www.metmuseum.org/art/collection/search/23232).
 * No missing collar lames are reconstructed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States +Z front/+Y up, actual outer record extrema, fitted nominal radius and exact inner padding boundary, declared coarse domains and partial-specimen limits.
 * @evidence contracts/development/implementation.md#principled-implementation Formula-generated ellipsoid/sphere faces become closed convex wall cells. Fitted inner planes are tangent to head radius plus padding and outer planes retain the exact sourced normal plate gauge; polygon corners are not mistaken for a curved primitive's radius. Omitted domains form face/neck openings and an annulus supplies the brim.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare one bounded angular lattice, emit bowl faces with the selected surviving face domain and add the brim from the same angular boundary.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No sphere or hidden box fills the cavity, missing visor/collar is not restored, exact historical opening proportions are not claimed, and a wall unable to preserve padding refuses rather than stretching its envelope.
 * @evidence contracts/development/implementation.md#efficient-algorithms A fixed sixteen-sector coarse lattice emits at most96 bowl cells and16 brim cells. One admitted canonical cell per row serves circular sectors; an unfitted ellipse shares only its exact half-turn symmetry. There is no thin-wall resolution loop or repeated hull per equivalent sector.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One profile/course defines all boundaries. Prepared actual cells share the same hull, mesh and local mass across proper Y rotations; anisotropic ellipse sectors share only exact half turns, never an arbitrary rotation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh scalar cells/corners and retains no caller state, previously completed mesh, rendering resource or global cache.
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
  const rows: number = Math.round((Math.PI / 2 - lower) / step);
  const rx: number =
    (profile.outer.x / 2) * (brimmed && !profile.fitted ? 3 / 4 : 1);
  const rz: number =
    (profile.outer.z / 2) * (brimmed && !profile.fitted ? 3 / 4 : 1);
  const bottom: number =
    brimmed && !profile.fitted
      ? -profile.record.y / 2 + profile.wall
      : -profile.record.y / 2;
  const ry: number = profile.fitted
    ? profile.outer.y / 2
    : (profile.record.y / 2 - bottom) / (1 - Math.sin(lower));
  const cy: number = profile.fitted ? 0 : profile.record.y / 2 - ry;
  const centre: IAutoMovieVector3 = { x: 0, y: cy, z: 0 };
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
      const a: IAutoMovieVector3 = point(latitude, sourceAngle);
      const b: IAutoMovieVector3 = point(latitude, sourceAngle + step);
      if (row === rows - 1)
        face(
          `bowl-${row}-${index}`,
          `bowl-${row}-${canonical}`,
          [a, b, { x: 0, y: cy + ry, z: 0 }],
          rotation,
        );
      else {
        const c: IAutoMovieVector3 = point(latitude + step, sourceAngle + step);
        const d: IAutoMovieVector3 = point(latitude + step, sourceAngle);
        face(
          `bowl-${row}-${index}`,
          `bowl-${row}-${canonical}`,
          [a, b, c, d],
          rotation,
        );
      }
    }
  }
  if (brimmed) {
    const outerX: number = profile.fitted
      ? profile.record.z / 2
      : profile.record.x / 2;
    const outerZ: number = profile.record.z / 2;
    const low: number = profile.fitted ? -profile.wall : -profile.record.y / 2;
    const high: number = low + profile.wall;
    for (let index: number = 0; index < count; index++) {
      const canonical: number = profile.fitted ? 0 : index % (count / 2);
      const a: number = canonical * step;
      const b: number = (canonical + 1) * step;
      const rotation: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
        { x: 0, y: 1, z: 0 },
        ((index - canonical) * step * 180) / Math.PI,
      );
      const key: string = `brim-${canonical}`;
      const outer: IAutoMovieVector3[] = [
        brim(a, low),
        brim(a, high),
        brim(b, high),
        brim(b, low),
      ];
      if (profile.fitted)
        place(
          `brim-${index}`,
          key,
          ArmourCell.radial(
            key,
            outer,
            { x: 0, y: 0, z: 0 },
            profile.wall,
            cavity,
            "annulus",
          ),
          rotation,
        );
      else {
        const factor: number = 3 / 4 - profile.wall / Math.min(outerX, outerZ);
        if (!(factor > 0 && factor < 1))
          throw new RangeError("Armour brim cannot contain its crown opening");
        place(
          `brim-${index}`,
          key,
          {
            id: key,
            points: [
              ...outer,
              ...outer.map(
                (p: IAutoMovieVector3): IAutoMovieVector3 => ({
                  x: p.x * factor,
                  y: p.y,
                  z: p.z * factor,
                }),
              ),
            ],
          },
          rotation,
        );
      }

      /** The source brim's independent width/depth own its actual extrema. */
      function brim(angle: number, y: number): IAutoMovieVector3 {
        return { x: outerX * Math.sin(angle), y, z: outerZ * Math.cos(angle) };
      }
    }
  }
  return cells;

  /** One named analytic bowl point; no emitted mesh is sampled to place it. */
  function point(latitude: number, angle: number): IAutoMovieVector3 {
    return {
      x: rx * Math.cos(latitude) * Math.sin(angle),
      y: cy + ry * Math.sin(latitude),
      z: rz * Math.cos(latitude) * Math.cos(angle),
    };
  }

  /** Each actual planar face has one admitted inward wall boundary. */
  function face(
    id: string,
    key: string,
    outer: readonly IAutoMovieVector3[],
    rotation: IAutoMovieQuaternion,
  ): void {
    if (!prepared.has(key))
      place(
        id,
        key,
        ArmourCell.radial(key, outer, centre, profile.wall, cavity),
        rotation,
      );
    else cells.push({ ...prepared.get(key)!, id, rotation });
  }

  /** Only an exact rigid-equivalent local wall shares its admitted hull and mass. */
  function place(
    id: string,
    key: string,
    cell: ArmourProfile.ICell,
    rotation: IAutoMovieQuaternion,
  ): void {
    if (!prepared.has(key))
      prepared.set(key, {
        ...cell,
        prepared: ArchetypeConvexCell.of(cell.points),
      });
    cells.push({ ...prepared.get(key)!, id, rotation });
  }
}
