import type { IAutoMovieHumanBodySimpleWhole } from "../../body/structures/IAutoMovieHumanBodySimpleWhole";
import type { IAutoMovieHumanPersonCompiledGeneration } from "../structures/IAutoMovieHumanPersonCompiledGeneration";
import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";
import type { IAutoMovieHumanPersonRestReading } from "../structures/IAutoMovieHumanPersonRestReading";
import { humanPersonBodyReach } from "./humanPersonBodyReach";
import { readHumanPersonRest } from "./readHumanPersonRest";

/**
 * Supply paired-person stature and signed closed-surface volume readings for the body simple tier. Each trial substitutes body shape; the source-rest evaluator clears explicit body pose/shoulders/anatomicalMotion/toes/thighGoals and face expression while preserving shape-dependent shoulder rest and omitting later contact/closure production. The last JSON-stringified shape shares one reading across stature/volume requests. Borrowed person and compiled context must stay unchanged for this shape-only key to remain valid.
 *
 * Independent solve reach is derived on first access and cached; held-shape forward projection can therefore work before an unsupported coupled reach is requested. This is the source endpoint envelope, not a clinical admissibility or global inverse-solvability certificate.
 *
 * @evidence contracts/common.md#principled-implementation Trial body shape is evaluated with this person's actual face/drivers and the existing rest geometry reader, while paired endpoint support constrains the solver separately.
 * @evidence contracts/common.md#clear-and-simple-design Two scalar accessors share one read closure and the lazy reach accessor delegates its envelope to the paired source owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No body-only volume substitutes for paired geometry; cached readings require unchanged borrowed context and do not establish neutral anatomy, clinical accuracy or rendered appearance.
 * @evidence contracts/common.md#meaningful-documentation Prose identifies retained controls, key-order-sensitive JSON caching, lazy reach refusal and source-only solve qualification.
 * @evidence contracts/performance.md#efficient-algorithms Each shape key costs its serialized entry count, a miss pays paired evaluation and surface measurement, and lazy reach scans actual source channels/drivers once.
 * @evidence contracts/performance.md#reuse-equivalent-work Stature and volume of the last identical JSON shape share one paired read; repeated reach access shares the successful derived basis.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One last key/reading and one optional reach basis are retained beside borrowed context; replacement drops the previous reading and no asset fetch or worker is owned.
 */
export function createHumanPersonSimpleWhole(
  compiled: IAutoMovieHumanPersonCompiledGeneration,
  person: IAutoMovieHumanPersonDocument,
): IAutoMovieHumanBodySimpleWhole {
  let lastKey: string | undefined;
  let last: IAutoMovieHumanPersonRestReading | undefined;
  let bodyReach: IAutoMovieHumanBodySimpleWhole["bodyReach"];
  const read: (
    shape: Readonly<Record<string, number>>,
  ) => IAutoMovieHumanPersonRestReading = (
    shape: Readonly<Record<string, number>>,
  ): IAutoMovieHumanPersonRestReading => {
    const key: string = JSON.stringify(shape);
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
    get bodyReach(): IAutoMovieHumanBodySimpleWhole["bodyReach"] {
      return (bodyReach ??= humanPersonBodyReach(compiled.generation).basis);
    },
    stature: (shape: Readonly<Record<string, number>>): number =>
      read(shape).statureMetres,
    volume: (shape: Readonly<Record<string, number>>): number =>
      read(shape).volumeCubicMetres,
  };
}
