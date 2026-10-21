import type { HumanCurve } from "../internal/HumanCurve";
import type { IAutoMovieHumanBodyParameters } from "../structures/body/IAutoMovieHumanBodyParameters";
import { HumanTrunkLaw } from "./HumanTrunkLaw";

/** Generate five native size curves from the same joint law as the trunk skin.
 * Native girths scale the corresponding radial field linearly. Their fitted
 * geometric arclengths differ from those controls, as the original recovered
 * transverse surface and native measurement courses do. No exact equality or
 * clinical measurement conversion is imposed. The optional assembly mapper
 * transports centres while retaining these source-gauge shape coefficients.
 * Native measurement planes establish these control addresses, not all anatomy:
 * generated silhouette or volume extrema can occur between them.
 */
export function generateHumanTrunkSections(
  parameters: IAutoMovieHumanBodyParameters,
  mapOrigin?: (originMm: HumanCurve.Vector, id: string) => HumanCurve.Vector,
): HumanCurve.Section[] {
  return HumanTrunkLaw.build(parameters).sections.filter((section: HumanCurve.Section): boolean => !section.id.startsWith("trunk.area.")).map((section: HumanCurve.Section): HumanCurve.Section => {
    const origin: HumanCurve.Vector = mapOrigin ? mapOrigin(section.originMm, section.id.slice("trunk.".length)) : section.originMm;
    return { ...section, originMm: origin, stationMm: origin[1] };
  });
}
