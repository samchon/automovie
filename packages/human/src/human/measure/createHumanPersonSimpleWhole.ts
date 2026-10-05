import type { IAutoMovieHumanBodySimpleWhole } from "../../body/structures/IAutoMovieHumanBodySimpleWhole";
import type { IAutoMovieHumanPersonCompiledGeneration } from "../structures/IAutoMovieHumanPersonCompiledGeneration";
import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";
import type { IAutoMovieHumanPersonRestReading } from "../structures/IAutoMovieHumanPersonRestReading";
import { readHumanPersonRest } from "./readHumanPersonRest";

/**
 * The simple tier's whole-person readings for one person: stature and closed
 * volume at rest (`readHumanPersonRest`) of the person with its own face
 * subtree and the given body shape.
 *
 * The body editor's simple tier solves body channels; the person's face
 * stays as the caller's document states it, and aliased macros follow the
 * body shape through the generation's drivers. The last shape read is
 * cached, since the simple tier asks stature and volume of one trial body.
 *
 * @evidence contracts/common.md#principled-implementation The simple tier reads stature and volume on the actual person, with the face held as the document states it.
 * @evidence contracts/common.md#clear-and-simple-design One rest reading per trial shape, shared by both readings.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No allowance replaces the head; the reading is the closed person.
 * @evidence contracts/common.md#meaningful-documentation States what is held, what follows the shape and the cache.
 * @evidence contracts/modeling.md#spatial-conventions Metres and cubic metres of the person frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The body shape's channels belong to the body view.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The rest reader closes the skin.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The person stature rule cites the definition.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
 */
export function createHumanPersonSimpleWhole(
  compiled: IAutoMovieHumanPersonCompiledGeneration,
  person: IAutoMovieHumanPersonDocument,
): IAutoMovieHumanBodySimpleWhole {
  let lastKey: string | undefined;
  let last: IAutoMovieHumanPersonRestReading | undefined;
  const read = (shape: Readonly<Record<string, number>>): IAutoMovieHumanPersonRestReading => {
    const key = JSON.stringify(shape);
    if (key !== lastKey || last === undefined) {
      last = readHumanPersonRest(compiled, { ...person, body: { ...person.body, shape: { ...shape } } });
      lastKey = key;
    }
    return last;
  };
  return {
    stature: (shape) => read(shape).statureMetres,
    volume: (shape) => read(shape).volumeCubicMetres,
  };
}
