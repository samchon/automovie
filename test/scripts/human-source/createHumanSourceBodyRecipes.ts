import type { IHumanSourceBodyField } from "./structures/IHumanSourceBodyField.ts";
import type { IHumanSourceBodyRecipe } from "./structures/IHumanSourceBodyRecipe.ts";
import type { IHumanSourceDeltaReader } from "./structures/IHumanSourceDeltaReader.ts";

/**
 * Resolve a published body endpoint name to its upstream recipe, or null when
 * the name is not a sampled body state (a field authored after extraction).
 * Macro node deltas are cached because every pair residual reuses two.
 */
export function createHumanSourceBodyRecipes(
  reader: IHumanSourceDeltaReader,
  field: IHumanSourceBodyField,
): (name: string) => IHumanSourceBodyRecipe | null {
  const cache = new Map<string, IHumanSourceBodyRecipe>();
  const own = (name: string): IHumanSourceBodyRecipe => {
    let found = cache.get(name);
    if (found === undefined) {
      found = {
        state: name,
        skin: field.delta(name),
        landmarks: field.landmarks(name),
      };
      if (reader.state(name).kind === "body-macro") cache.set(name, found);
    }
    return found;
  };
  return (name) => {
    if (!reader.has(name)) return null;
    const state = reader.state(name);
    if (state.kind === "body-target" || state.kind === "body-macro")
      return own(name);
    if (state.kind !== "body-macro-pair") return null;
    const [a, b] = state.recipe.endpoints as [string, string];
    const pair = own(name);
    const first = own(a);
    const second = own(b);
    return {
      state: name,
      skin: pair.skin.map((value, i) => value - first.skin[i] - second.skin[i]),
      landmarks: pair.landmarks.map(
        (value, i) => value - first.landmarks[i] - second.landmarks[i],
      ),
    };
  };
}
