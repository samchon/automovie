import { AutoMovieHuman } from "../../../human/src/AutoMovieHuman";
import type { IAutoMovieHumanGenerated } from "../../../human/src/structures/IAutoMovieHumanGenerated";
import type { IAutoMovieHumanParameters } from "../../../human/src/structures/IAutoMovieHumanParameters";
import { admitHumanParameters } from "./admitHumanParameters";
import { readHumanModulePreview } from "./readHumanModulePreview";

/**
 * Produce the Human page's next model: admit the input, then run the public generator, or loft a module-fit preview's calibration for it, and time the generation.
 *
 * An alias or a JSON candidate is admitted by `admitHumanParameters`; typed
 * parameters from code pass straight through with no alias. Without a preview
 * name the model is `AutoMovieHuman.generate`'s; with one, the named preview is
 * read and merged by `readHumanModulePreview` and `AutoMovieHuman.generateBody`
 * lofts its calibration at the input's height, the generator's default
 * calibration untouched.
 *
 * @param input `{ alias }`, `{ candidate }` or `{ parameters }`.
 * @param modules Module-fit preview name, or null for the full generation.
 * @returns The generated result, its alias and preview, and the generator's wall-clock milliseconds.
 *
 * @evidence contracts/common.md#principled-implementation Admission, preview reading and generation are the existing owners' functions called in order; only the generator call is timed.
 * @evidence contracts/common.md#clear-and-simple-design One producer serves the page's alias, JSON and typed loads, so the three cannot diverge.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown aliases, unadmitted JSON and unknown previews throw before any generation; no other calibration stands in.
 * @evidence contracts/common.md#meaningful-documentation States the three inputs, both generation paths and what is timed.
 * @evidence contracts/performance.md#efficient-algorithms One admission, at most one preview import and merge, and one generation.
 * @evidence contracts/performance.md#reuse-equivalent-work Returns the module-shared typed literal's result; Vite caches the preview module.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing; the result belongs to the page's load.
 */
export async function generateHumanPageModel(
  input:
    | { alias: string }
    | { candidate: unknown }
    | { parameters: IAutoMovieHumanParameters },
  modules: string | null,
): Promise<generateHumanPageModel.IProduced> {
  const preview: readHumanModulePreview.IPreview | null =
    modules === null ? null : await readHumanModulePreview(modules);
  const admitted: {
    alias: string | null;
    parameters: IAutoMovieHumanParameters;
  } =
    "parameters" in input
      ? { alias: null, parameters: input.parameters }
      : admitHumanParameters(input);
  const start: number = performance.now();
  const result: IAutoMovieHumanGenerated =
    preview === null
      ? AutoMovieHuman.generate(admitted.parameters)
      : AutoMovieHuman.generateBody(
          admitted.parameters,
          preview.calibration,
          preview.lips,
        );
  return {
    result,
    alias: admitted.alias,
    modules,
    milliseconds: performance.now() - start,
  };
}

/**
 * Types of a produced page model.
 *
 * @evidence contracts/common.md#principled-implementation Mirrors what generateHumanPageModel returns and the page displays.
 * @evidence contracts/common.md#clear-and-simple-design One record shared by the producer and the page's load path.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null marks an absent alias, preview or time instead of a placeholder.
 * @evidence contracts/common.md#meaningful-documentation Each member states its meaning.
 * @evidence contracts/performance.md#efficient-algorithms Types only; no runtime cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Types only.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Types only.
 */
export namespace generateHumanPageModel {
  /** What a load produces before display. */
  export interface IProduced {
    /** Generator output. */
    result: IAutoMovieHumanGenerated;

    /** Registered alias, or null for typed code input and a displayed result. */
    alias: string | null;

    /** Module-fit preview lofted, or null for the full generation. */
    modules: string | null;

    /** Generator wall-clock milliseconds, or null for an externally generated result. */
    milliseconds: number | null;
  }
}
