import { IAutoMovieBuiltEnvironment, IAutoMoviePropBox } from "@automovie/interface";
import { IAutoMoviePassageBlockage } from "./IAutoMoviePassageBlockage";
import { propBoundsOverlap } from "./propBoundsOverlap";

/**
 * Every opening and connector a world volume intrudes on.
 *
 * An opening is only measurable through the element that fills it, so an open
 * cut (`fill: null`) and a fill whose model lives outside the record are
 * reported by neither this predicate nor the validator: a passage nothing
 * describes cannot be proven blocked, and guessing where the hole is would be
 * worse than saying nothing. A connector is swept from its own route: each
 * segment widens by half the usable width horizontally and rises by the clear
 * height, which is the volume a body traversing it needs. A connector that
 * declares no section at all is skipped for the same reason as an open cut.
 *
 * @evidence requirements/interior/furniture-fixtures-and-equipment.md#interior-object-use-clearance propBlockedPassages names the exact openings and connectors whose circulation volume a staged prop obstructs.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-furniture-fixture-equipment-placement propBlockedPassages realizes furnishing placement clearance: Every opening and connector a world volume intrudes on. An opening is only measurable through the element that fills it, so an open cut (`fill: null`) and a fill whose model lives outside the record are reported by neither this predicate nor the validator: a passage nothing describes cannot be proven blocked, and guessing where the hole is would be worse than saying nothing. A connector is swept from its own route: each segment widens by half the usable width horizontally and rises by the clear height, which is the volume a body traversing it needs. A connector that declares no section at all is skipped for the same reason as an open cut.
 */
export const propBlockedPassages = (props: {
  environment: IAutoMovieBuiltEnvironment;
  bounds: IAutoMoviePropBox;
}): IAutoMoviePassageBlockage[] => {
  const blocked: IAutoMoviePassageBlockage[] = [];
  for (const opening of props.environment.openings) {
    const reveal = openingRevealBounds(props.environment, opening.id);
    if (reveal !== null && propBoundsOverlap(props.bounds, reveal))
      blocked.push({ kind: "opening", id: opening.id });
  }
  for (const connector of props.environment.connectors)
    if (
      connectorCorridors(connector).some((corridor) =>
        propBoundsOverlap(props.bounds, corridor),
      )
    )
      blocked.push({ kind: "connector", id: connector.id });
  return blocked;
};
