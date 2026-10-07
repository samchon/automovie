import { assertHumanFacePeriocularCage } from "../../basis/assertHumanFacePeriocularCage";
import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceEyelidPhenotypes } from "../../structures/IAutoMovieHumanFaceEyelidPhenotypes";

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
 * @evidence contracts/common.md#principled-implementation The source rows and chart define named vertical measurements, while row-local canthal fade preserves shared joins and original alias transport.
 * @evidence contracts/common.md#clear-and-simple-design One visible-lid conversion precedes the established source pose/contact owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported rows, verticals and combinations refuse instead of substituting a mean or clamping the request.
 * @evidence contracts/common.md#meaningful-documentation States each conversion, source approximation, preserved geometry and independent downstream admission.
 * @evidence contracts/modeling.md#parameter-channels Height and hood overlap preserve absolute units; single creasing retains row height but removes its source groove.
 * @evidence contracts/modeling.md#spatial-conventions Source head-frame metres, converted from supplied millimetres once.
 * @evidence contracts/modeling.md#shared-boundaries Canthi remain source-owned; all aliases move together before pose and contact.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Changes the existing upper lid.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Source topology and population remain unchanged.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembled lid owner observes generated morphology.
 * @evidence contracts/anatomy.md#anatomical-source Visible lengths use the source optical-support approximation and source-authoring cage roles; acquisition of the clinical crease and hood remains unknown.
 * @evidence contracts/anatomy.md#permitted-range Positive crease heights remain below actual preseptal clearance; hood overlap cannot reach the margin. Final tissue/contact admission judges the full combination.
 * @evidence contracts/anatomy.md#parametric-authority Consumes closed morphology choices and visible length measurements without caller-supplied geometry.
 */
export function applyHumanFaceEyelidPhenotypes(
  basis: IAutoMovieHumanFaceBasis,
  positions: ReadonlyMap<string, readonly number[]>,
  input: IAutoMovieHumanFaceEyelidPhenotypes | undefined,
): ReadonlyMap<string, readonly number[]> {
  if (input === undefined) return positions;
  const result = new Map(positions);
  for (const side of ["left", "right"] as const) {
    const profile = input[side];
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
    const cage = basis.periocular?.[side].cage;
    const support = basis.opticalSupport?.find(
      (entry) => entry.owner === (side === "left" ? "leftEye" : "rightEye"),
    );
    const skin = cage === undefined ? undefined : result.get(cage.surface);
    const optical =
      support === undefined ? undefined : result.get(support.surface);
    const host =
      cage === undefined
        ? undefined
        : basis.surfaces.find((surface) => surface.id === cage.surface);
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
    const row = (role: string): readonly number[] => {
      const value = cage.stations.find((station) => station.role === role);
      if (value === undefined)
        throw new Error("Lid morphology needs its source row: " + role);
      return value.vertices;
    };
    const chart = support.anterior;
    const x = chart.triangle.reduce(
      (sum, vertex, at) =>
        sum +
        optical[3 * vertex] * [1 - chart.u - chart.v, chart.u, chart.v][at],
      0,
    );
    const height = (vertices: readonly number[]): number => {
      const chain = cage.upperColumns.map((column) => vertices[column]);
      for (let at = 1; at < chain.length; at++) {
        const a = chain[at - 1],
          b = chain[at];
        const xa = skin[3 * a],
          xb = skin[3 * b];
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
    const crease = row("crease"),
      hood = row("hood"),
      pretarsal = row("pretarsal");
    const marginHeight = height(row("posteriorMargin"));
    const currentHeight = height(crease) - marginHeight;
    let chartFade = 0,
      hoodChartFade = 0;
    const fadeAt = (vertices: readonly number[]): number => {
      const columns = cage.upperColumns;
      for (let at = 1; at < columns.length; at++) {
        const xa = skin[3 * vertices[columns[at - 1]]],
          xb = skin[3 * vertices[columns[at]]];
        if ((xa - x) * (xb - x) > 0 || xa === xb) continue;
        const t = (x - xa) / (xb - xa);
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
    const maximumHeight = height(row("preseptal")) - marginHeight;
    const requestedHeight =
      profile.creaseHeightMm === undefined
        ? currentHeight
        : profile.creaseHeightMm / 1000;
    const overlap = (profile.hoodOverlapMm ?? 0) / 1000;
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
    const aliases = new Map<number, number[]>();
    host.sourcePartition.samples.forEach((sample, vertex) => {
      const group = aliases.get(sample) ?? [];
      group.push(vertex);
      aliases.set(sample, group);
    });
    const changed = [...skin];
    const hoodShift = marginHeight + requestedHeight - overlap - height(hood);
    for (let at = 1; at + 1 < cage.upperColumns.length; at++) {
      const column = cage.upperColumns[at];
      const fade = Math.sin((Math.PI * at) / (cage.upperColumns.length - 1));
      const vertex = crease[column];
      let anteriorShift = 0;
      if (profile.crease === "single") {
        const lower = pretarsal[column],
          upper = hood[column];
        const span = skin[3 * upper + 1] - skin[3 * lower + 1];
        if (!(span > 0))
          throw new Error(
            "Single crease morphology needs ordered pretarsal and hood source heights.",
          );
        const fraction = (skin[3 * vertex + 1] - skin[3 * lower + 1]) / span;
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
    if (!changed.every((value) => Number.isFinite(Math.fround(value))))
      throw new Error(
        "Lid morphology exceeds finite Float32 source coordinates.",
      );
    result.set(cage.surface, changed);
  }
  return result;
}
