import { AutoMovieArchetypeHingedCabinet } from "../AutoMovieArchetypeHingedCabinet";
import {
  type AutoMovieArchetype,
} from "../../core/index";
import {
  ArchetypeDraw,
} from "../../core/internal/ArchetypeDraw";
import { StorageMechanisms } from "./StorageMechanisms";


/*
 * A wardrobe with movable leaves or a locker with a resting hinge frame.
 * Parameter params: The optional identifier, the admitted settings and any fixed
 * dimensions in the inherited units.
 * Parameter seed: Draws remaining dimensions and any model choice. Omit it for the
 * first model and band midpoints.
 * Returns: The generated model and its named local contacts.
 * For a setting this producer cannot admit.
 */
export function createHingedCabinet(
  params: AutoMovieArchetypeHingedCabinet.IParams,
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeHingedCabinet.Affordance,
  AutoMovieArchetypeHingedCabinet.Dimension
> {
  return StorageMechanisms.hinged(
    ArchetypeDraw.choice(
      "storage",
      "kind",
      params.kind,
      AutoMovieArchetypeHingedCabinet.KINDS,
    ),
    params,
    seed,
  );
}
