import { AutoMovieArchetypeDrawerUnit } from "../AutoMovieArchetypeDrawerUnit";
import { ArchetypeDraw, type AutoMovieArchetype } from "../../core/index";
import { StorageMechanisms } from "./StorageMechanisms";


/*
 * A chest or filing cabinet with individually sliding drawers.
 * Parameter params: The optional identifier, the admitted settings and any fixed
 * dimensions in the inherited units.
 * Parameter seed: Draws remaining dimensions and any model choice. Omit it for the
 * first model and band midpoints.
 * Returns: The generated model and its named local contacts.
 * For a setting this producer cannot admit.
 */
export function createDrawerUnit(
  params: AutoMovieArchetypeDrawerUnit.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeDrawerUnit.Affordance, AutoMovieArchetypeDrawerUnit.Dimension> {
  return StorageMechanisms.sliding(
    ArchetypeDraw.choice(
      "storage",
      "kind",
      params.kind,
      AutoMovieArchetypeDrawerUnit.KINDS,
    ),
    params,
    seed,
  );
}
