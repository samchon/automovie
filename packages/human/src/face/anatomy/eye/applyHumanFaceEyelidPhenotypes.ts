import { assertHumanFacePeriocularCage } from "../../basis/assertHumanFacePeriocularCage";
import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisSurface } from "../../structures/IAutoMovieHumanFaceBasisSurface";
import type { IAutoMovieHumanFaceEyelidPhenotype } from "../../structures/IAutoMovieHumanFaceEyelidPhenotype";
import type { IAutoMovieHumanFaceEyelidPhenotypes } from "../../structures/IAutoMovieHumanFaceEyelidPhenotypes";
import type { IAutoMovieHumanFaceOpticalSupport } from "../../structures/IAutoMovieHumanFaceOpticalSupport";
import type { IAutoMovieHumanFaceOpticalSupportAnterior } from "../../structures/IAutoMovieHumanFaceOpticalSupportAnterior";
import type { IAutoMovieHumanFacePeriocularCage } from "../../structures/IAutoMovieHumanFacePeriocularCage";
import type { IAutoMovieHumanFacePeriocularStation } from "../../structures/IAutoMovieHumanFacePeriocularStation";

/**
 * Convert resting visible crease and hood traits on the actual source skin.
 *
 * The source chart's vertical intersects the posterior margin, crease and
 * preseptal rows. A requested crease height changes the crease row's superior
 * location with canthal sine fade. Single creasing replaces the source groove
 * by the pretarsal-to-hood section at the same longitudinal station, keeping
 * its superior spacing. Inset creasing carries the source hood to its stated
 * overlap below the crease; its anterior position remains source-owned.
 * Every seam alias receives the same displacement. No optical dimension,
 * tissue thickness, source row population or caller value is changed.
 *
 * This is authored prototype morphology on a coarse source cage. Geometry
 * sampling and actual assembled admission limit supported combinations; these
 * rules do not establish clinical fold anatomy or a personal reconstruction.
 *
 * @evidence contracts/common.md#principled-implementation Named crease/hood controls deform the actual source-registered lid station rows with canthal fade while preserving seam aliases.
 * @evidence contracts/common.md#clear-and-simple-design Omission returns the existing position map; supplied sides clone only affected buffers and use the canonical cage/optical frame owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Conflicting single-crease/height/overlap requests and unrepresentable outputs refuse; authored phenotype controls are not clinical inference.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes millimetre profile fields, omitted controls, source aliases and authored rest-identity meaning.
 * @evidence contracts/performance.md#efficient-algorithms Affected station columns and source aliases drive work; cage admission and optical chart resolution are included rather than counted as free.
 * @evidence contracts/performance.md#reuse-equivalent-work One side's resolved frame and source-alias mapping serve its affected rows; unchanged surfaces remain shared without mutation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owned changed buffers escape in the returned map; temporary charts/alias tables expire, and no prior pose or external resource is retained.
 */
export function applyHumanFaceEyelidPhenotypes(
  basis: IAutoMovieHumanFaceBasis,
  positions: ReadonlyMap<string, readonly number[]>,
  input: IAutoMovieHumanFaceEyelidPhenotypes | undefined,
): ReadonlyMap<string, readonly number[]> {
  if (input === undefined) return positions;
  const result: Map<string, readonly number[]> = new Map(positions);
  for (const side of ["left", "right"] as const) {
    const profile: IAutoMovieHumanFaceEyelidPhenotype | undefined = input[side];
    if (profile === undefined) continue;
    if (
      profile.crease === undefined &&
      profile.creaseHeightMm === undefined &&
      profile.hoodOverlapMm === undefined
    )
      continue;
    if (
      profile.crease === "single" &&
      (profile.creaseHeightMm !== undefined ||
        profile.hoodOverlapMm !== undefined)
    )
      throw new Error(
        "Single crease morphology has no visible crease height or hood-over-crease measurement.",
      );
    if (profile.crease === "inset" && profile.hoodOverlapMm === undefined)
      throw new Error("Inset creasing needs its explicit hood overlap.");
    const cage: IAutoMovieHumanFacePeriocularCage | undefined =
      basis.periocular?.[side].cage;
    const support: IAutoMovieHumanFaceOpticalSupport | undefined =
      basis.opticalSupport?.find(
        (entry: IAutoMovieHumanFaceOpticalSupport): boolean =>
          entry.owner === (side === "left" ? "leftEye" : "rightEye"),
      );
    const skin: readonly number[] | undefined =
      cage === undefined ? undefined : result.get(cage.surface);
    const optical: readonly number[] | undefined =
      support === undefined ? undefined : result.get(support.surface);
    const host: IAutoMovieHumanFaceBasisSurface | undefined =
      cage === undefined
        ? undefined
        : basis.surfaces.find(
            (surface: IAutoMovieHumanFaceBasisSurface): boolean =>
              surface.id === cage.surface,
          );
    if (
      cage === undefined ||
      support === undefined ||
      skin === undefined ||
      optical === undefined ||
      host?.sourcePartition === undefined
    )
      throw new Error(
        "Lid morphology needs its actual skin cage and optical-support chart: " +
          side,
      );
    assertHumanFacePeriocularCage(basis, cage);
    const row: (role: string) => readonly number[] = (
      role: string,
    ): readonly number[] => {
      const value: IAutoMovieHumanFacePeriocularStation | undefined =
        cage.stations.find(
          (station: IAutoMovieHumanFacePeriocularStation): boolean =>
            station.role === role,
        );
      if (value === undefined)
        throw new Error("Lid morphology needs its source row: " + role);
      return value.vertices;
    };
    const chart: IAutoMovieHumanFaceOpticalSupportAnterior = support.anterior;
    const x: number = chart.triangle.reduce(
      (sum: number, vertex: number, at: number): number =>
        sum +
        optical[3 * vertex] * [1 - chart.u - chart.v, chart.u, chart.v][at],
      0,
    );
    const height: (vertices: readonly number[]) => number = (
      vertices: readonly number[],
    ): number => {
      const chain: number[] = cage.upperColumns.map(
        (column: number): number => vertices[column],
      );
      for (let at: number = 1; at < chain.length; at++) {
        const a: number = chain[at - 1],
          b: number = chain[at];
        const xa: number = skin[3 * a],
          xb: number = skin[3 * b];
        if ((xa - x) * (xb - x) > 0 || xa === xb) continue;
        return (
          skin[3 * a + 1] +
          ((skin[3 * b + 1] - skin[3 * a + 1]) * (x - xa)) / (xb - xa)
        );
      }
      throw new Error(
        "Lid morphology chart misses its source row vertical: " + side,
      );
    };
    const crease: readonly number[] = row("crease"),
      hood: readonly number[] = row("hood"),
      pretarsal: readonly number[] = row("pretarsal");
    const marginHeight: number = height(row("posteriorMargin"));
    const currentHeight: number = height(crease) - marginHeight;
    let chartFade: number = 0,
      hoodChartFade: number = 0;
    const fadeAt: (vertices: readonly number[]) => number = (
      vertices: readonly number[],
    ): number => {
      const columns: number[] = cage.upperColumns;
      for (let at: number = 1; at < columns.length; at++) {
        const xa: number = skin[3 * vertices[columns[at - 1]]],
          xb: number = skin[3 * vertices[columns[at]]];
        if ((xa - x) * (xb - x) > 0 || xa === xb) continue;
        const t: number = (x - xa) / (xb - xa);
        return (
          Math.sin((Math.PI * (at - 1)) / (columns.length - 1)) * (1 - t) +
          Math.sin((Math.PI * at) / (columns.length - 1)) * t
        );
      }
      throw new Error(
        "Lid morphology chart misses its canthal envelope: " + side,
      );
    };
    chartFade = fadeAt(crease);
    hoodChartFade = fadeAt(hood);
    if (!(chartFade > 0) || !(hoodChartFade > 0))
      throw new Error(
        "Lid morphology source chart lies on a fixed canthal join.",
      );
    const maximumHeight: number = height(row("preseptal")) - marginHeight;
    const requestedHeight: number =
      profile.creaseHeightMm === undefined
        ? currentHeight
        : profile.creaseHeightMm / 1000;
    const overlap: number = (profile.hoodOverlapMm ?? 0) / 1000;
    if (
      !(requestedHeight > 0) ||
      !Number.isFinite(requestedHeight) ||
      !(requestedHeight < maximumHeight) ||
      !Number.isFinite(overlap) ||
      overlap < 0 ||
      overlap >= requestedHeight
    )
      throw new Error(
        "Lid morphology exceeds its actual source row spacing: " + side,
      );
    const aliases: Map<number, number[]> = new Map<number, number[]>();
    host.sourcePartition.samples.forEach(
      (sample: number, vertex: number): void => {
        const group: number[] = aliases.get(sample) ?? [];
        group.push(vertex);
        aliases.set(sample, group);
      },
    );
    const changed: number[] = [...skin];
    const hoodShift: number =
      marginHeight + requestedHeight - overlap - height(hood);
    for (let at: number = 1; at + 1 < cage.upperColumns.length; at++) {
      const column: number = cage.upperColumns[at];
      const fade: number = Math.sin(
        (Math.PI * at) / (cage.upperColumns.length - 1),
      );
      const vertex: number = crease[column];
      let anteriorShift: number = 0;
      if (profile.crease === "single") {
        const lower: number = pretarsal[column],
          upper: number = hood[column];
        const span: number = skin[3 * upper + 1] - skin[3 * lower + 1];
        if (!(span > 0))
          throw new Error(
            "Single crease morphology needs ordered pretarsal and hood source heights.",
          );
        const fraction: number =
          (skin[3 * vertex + 1] - skin[3 * lower + 1]) / span;
        anteriorShift =
          skin[3 * lower + 2] +
          fraction * (skin[3 * upper + 2] - skin[3 * lower + 2]) -
          skin[3 * vertex + 2];
      }
      for (const alias of aliases.get(host.sourcePartition.samples[vertex])!) {
        changed[3 * alias + 1] +=
          ((requestedHeight - currentHeight) * fade) / chartFade;
        changed[3 * alias + 2] += anteriorShift * fade;
      }
      if (profile.hoodOverlapMm !== undefined)
        for (const alias of aliases.get(
          host.sourcePartition.samples[hood[column]],
        )!)
          changed[3 * alias + 1] += (hoodShift * fade) / hoodChartFade;
    }
    if (
      !changed.every((value: number): boolean =>
        Number.isFinite(Math.fround(value)),
      )
    )
      throw new Error(
        "Lid morphology exceeds finite Float32 source coordinates.",
      );
    result.set(cage.surface, changed);
  }
  return result;
}
