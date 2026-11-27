import { AutoMovieArchetypeKeyboard } from "../AutoMovieArchetypeKeyboard";
import { ArchetypeDraw, type AutoMovieArchetype } from "../../core/index";
import "../KeyboardHardware";
import { AutoMovieArchetypeDesktopKeyboard } from "../AutoMovieArchetypeDesktopKeyboard";
import { AutoMovieArchetypeLaptop } from "../AutoMovieArchetypeLaptop";

/**
 * Reads a saved desktop keyboard or laptop recipe.
 *
 * @param params The saved kind, model and optional identifier.
 * @param seed The seed used by the selected producer.
 * @returns An input device with its original contact frames.
 * @throws {AutoMovieArchetypeRefusal} For an unsupported kind or model, or any
 *   dimension override.
 */
export function createKeyboard(
  params: AutoMovieArchetypeKeyboard.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeKeyboard.Affordance, AutoMovieArchetypeKeyboard.Dimension> {
  const kind: AutoMovieArchetypeKeyboard.Kind = ArchetypeDraw.choice(
    "keyboard",
    "kind",
    params.kind,
    AutoMovieArchetypeKeyboard.KINDS,
  );

  // The saved model union is wider than each producer's model table.
  // The saved input spans every variant, so each variant narrows its own kind
  // and model against the lists it makes before it draws.
  const variants: Readonly<
    Record<
      AutoMovieArchetypeKeyboard.Kind,
      (
        params: AutoMovieArchetypeKeyboard.IParams,
        seed?: number,
      ) => AutoMovieArchetype<AutoMovieArchetypeKeyboard.Affordance, AutoMovieArchetypeKeyboard.Dimension>
    >
  > = {
    keyboard: (p, s) => AutoMovieArchetypeDesktopKeyboard.create({ ...p, model: ArchetypeDraw.admit("keyboard", "model", p.model, ["numericKeypad", "touchId"] as const) }, s),
    laptop: (p, s) => AutoMovieArchetypeLaptop.create({ ...p, model: ArchetypeDraw.admit("keyboard", "model", p.model, ["air13", "air15"] as const) }, s),
  };
  return variants[kind](params, seed);
}
