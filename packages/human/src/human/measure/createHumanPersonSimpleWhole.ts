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
 */
export function createHumanPersonSimpleWhole(
  compiled: IAutoMovieHumanPersonCompiledGeneration,
  person: IAutoMovieHumanPersonDocument,
): IAutoMovieHumanBodySimpleWhole {
  let lastKey: string | undefined;
  let last: IAutoMovieHumanPersonRestReading | undefined;
  const read = (
    shape: Readonly<Record<string, number>>,
  ): IAutoMovieHumanPersonRestReading => {
    const key = JSON.stringify(shape);
    if (key !== lastKey || last === undefined) {
      last = readHumanPersonRest(compiled, {
        ...person,
        body: { ...person.body, shape: { ...shape } },
      });
      lastKey = key;
    }
    return last;
  };
  return {
    stature: (shape) => read(shape).statureMetres,
    volume: (shape) => read(shape).volumeCubicMetres,
  };
}
