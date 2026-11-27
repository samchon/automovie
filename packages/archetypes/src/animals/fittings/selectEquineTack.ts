import type { AutoMovieArchetypeEquine } from "../AutoMovieArchetypeEquine";
import type { EquineTack } from "../equine/EquineTack";

/**
 * Attach the drawn croup clearance only when the selected tack uses it. A pack
 * with no value means its producer did not supply the required draw.
 */
export function selectEquineTack(
  tack: AutoMovieArchetypeEquine.Tack,
  clearance: number | undefined,
  archetype: string,
): EquineTack.Selection {
  if (tack !== "pack") return { kind: tack };
  if (clearance === undefined)
    throw new Error(`${archetype}: no band or figure gives croupClearance`);
  return { kind: tack, croupClearance: clearance };
}
