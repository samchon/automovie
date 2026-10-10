import { assertHumanFacePeriocularCage } from "../../basis/assertHumanFacePeriocularCage";
import type { AutoMovieHumanFacePeriocularStationRole } from "../../structures/AutoMovieHumanFacePeriocularStationRole";
import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceEyelids } from "../../structures/IAutoMovieHumanFaceEyelids";

/**
 * Author full coarse lid sections on the shared native skin, before posing.
 * One section's centre takes its exact supplied superior/anterior displacement;
 * a sine envelope along the registered row keeps both canthal joins unchanged.
 * The source's existing neighbouring faces form the continuous section between
 * rows. Outer attachment and wet margins retain their original source points.
 * These are independent rest identity controls, not wrinkle grades or measured
 * anatomy. Source pose residuals then carry blink, squint and gaze once, and
 * actual assembled space/contact admission judges the resulting geometry.
 */
export function applyHumanFaceLidSections(
  basis: IAutoMovieHumanFaceBasis,
  positions: ReadonlyMap<string, readonly number[]>,
  input: IAutoMovieHumanFaceEyelids | undefined,
): ReadonlyMap<string, readonly number[]> {
  if (input === undefined) return positions;
  const result = new Map(positions);
  for (const side of ["left", "right"] as const) {
    const profiles = input[side];
    if (profiles === undefined || Object.keys(profiles).length === 0) continue;
    const cage = basis.periocular?.[side].cage;
    if (cage === undefined)
      throw new Error("Lid section source cage unavailable: " + side);
    assertHumanFacePeriocularCage(basis, cage);
    const host = basis.surfaces.find((surface) => surface.id === cage.surface);
    const source = result.get(cage.surface);
    if (source === undefined || source.length !== host!.positions.length)
      throw new Error(
        "Lid section needs its complete actual host buffer: " + side,
      );
    const changed = [...source];
    const aliases = new Map<number, number[]>();
    host!.sourcePartition!.samples.forEach((sample, vertex) => {
      const group = aliases.get(sample) ?? [];
      group.push(vertex);
      aliases.set(sample, group);
    });
    for (const name of Object.keys(profiles) as (keyof typeof profiles)[]) {
      const profile = profiles[name];
      if (profile === undefined) continue;
      if (![profile.elevationMm, profile.projectionMm].every(Number.isFinite))
        throw new Error(
          "Lid section displacements need finite millimetres: " +
            side +
            ":" +
            name,
        );
      const role: AutoMovieHumanFacePeriocularStationRole = name.endsWith(
        "Pretarsal",
      )
        ? "pretarsal"
        : name.endsWith("Crease") || name.endsWith("Subtarsal")
          ? "crease"
          : name.endsWith("Hood")
            ? "hood"
            : "preseptal";
      const station = cage.stations.find((station) => station.role === role);
      const columns = name.startsWith("upper")
        ? cage.upperColumns
        : cage.lowerColumns;
      if (
        station === undefined ||
        columns.length < 3 ||
        columns[0] !== cage.medialColumn ||
        columns.at(-1) !== cage.lateralColumn
      )
        throw new Error(
          "Lid section requires its complete source row: " + side + ":" + name,
        );
      for (let index = 1; index + 1 < columns.length; index++) {
        const vertex = station.vertices[columns[index]];
        if (
          !Number.isSafeInteger(vertex) ||
          vertex < 0 ||
          3 * vertex + 2 >= changed.length
        )
          throw new Error("Lid section source column is outside its host.");
        const envelope =
          Math.sin((Math.PI * index) / (columns.length - 1)) /
          Math.sin(
            (Math.PI * Math.floor(columns.length / 2)) / (columns.length - 1),
          );
        for (const alias of aliases.get(
          host!.sourcePartition!.samples[vertex],
        )!) {
          changed[3 * alias + 1] += (profile.elevationMm * envelope) / 1000;
          changed[3 * alias + 2] += (profile.projectionMm * envelope) / 1000;
        }
      }
    }
    if (
      !changed.every(
        (value) =>
          Number.isFinite(value) && Number.isFinite(Math.fround(value)),
      )
    )
      throw new Error("Lid section exceeds finite Float32 source coordinates.");
    result.set(cage.surface, changed);
  }
  return result;
}
