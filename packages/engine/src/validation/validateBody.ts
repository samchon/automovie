import { ViolationCollector } from "./ViolationCollector";
import { IAutoMovieBody } from "@automovie/interface";

/**
 * Validate an {@link IAutoMovieBody}'s rough scalars: mass must be finite and
 * strictly positive, `friction` and `restitution` sit in `[0, 1]`, and an
 * explicit `centerOfMass` must be finite on every axis.
 * @evidence requirements/external-inputs/validation-and-quarantine.md#external-validation-structure-semantics Checks positive mass, bounded contact coefficients and a finite optional centre of mass as model semantic admission.
 * @evidence specifications/interchange-and-adoption/validation-and-quarantine.md#interchange-layered-validation Checks positive mass, bounded contact coefficients and a finite optional centre of mass as model semantic admission.
 */
export const validateBody = (
  body: IAutoMovieBody,
  path: string,
  collector: ViolationCollector,
): void => {
  if (!Number.isFinite(body.mass) || body.mass <= 0)
    collector.push(
      "range",
      `${path}.mass`,
      `mass must be a finite number > 0, but was ${body.mass}`,
      body.mass,
    );
  collector.range(`${path}.friction`, body.friction, 0, 1, "friction");
  collector.range(`${path}.restitution`, body.restitution, 0, 1, "restitution");
  if (body.centerOfMass !== null) {
    const com = body.centerOfMass;
    for (const axis of ["x", "y", "z"] as const)
      if (!Number.isFinite(com[axis]))
        collector.push(
          "range",
          `${path}.centerOfMass.${axis}`,
          `centerOfMass.${axis} must be finite, but was ${com[axis]}`,
          com[axis],
        );
  }
};
