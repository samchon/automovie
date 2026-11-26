import {
  IAutoMovieCompiledFormation,
  IAutoMovieFormationDesign,
  type IAutoMovieMaterializeCompiledFormationInventory,
} from "@automovie/interface";

import { AutoMovieEngineText } from "../../text/AutoMovieEngineText";
import { materializeCompiledFormation } from "../materializeCompiledFormation";

/**
 * Compile every formation of a production into its compact runtime record.
 *
 * Records are keyed by formation id and inserted in code-unit order of that id,
 * so the inventory and every artifact that serializes it are the same whatever
 * order the designs were read in. Each formation is compiled against the same
 * model groups, radii and terrain, which is what makes a unit compiled here the
 * unit a shot compiled from the same inputs would hold.
 */
export function materializeCompiledFormationInventory(
  props: IAutoMovieMaterializeCompiledFormationInventory.IProps,
): Readonly<Record<string, IAutoMovieCompiledFormation>> {
  return Object.fromEntries(
    [...props.formations]
      .sort(
        (
          [left]: [string, IAutoMovieFormationDesign],
          [right]: [string, IAutoMovieFormationDesign],
        ): number => AutoMovieEngineText.compareCodeUnits(left, right),
      )
      .map(
        ([id, formation]: [string, IAutoMovieFormationDesign]): [
          string,
          IAutoMovieCompiledFormation,
        ] => [
          id,
          materializeCompiledFormation({
            formation,
            models: props.models,
            projectionRadii: props.projectionRadii,
            surfaces: props.surfaces,
          }),
        ],
      ),
  );
}
