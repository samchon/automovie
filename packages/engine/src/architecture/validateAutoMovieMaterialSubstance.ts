import {
  IAutoMovieMaterialSubstance,
  type IAutoMovieValidateMaterialSubstance,
  IAutoMovieValidation,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";

/**
 * Range-check one substance record.
 *
 * The engine ships no substances, so every value here is the production's own
 * and every measured property is optional. What the engine owns is the refusal:
 * a negative density, an absorption above one, or a vapour resistance below
 * still air are not measurements a later study can use, and a study that
 * silently consumes them reports a number nobody can trace back to a defect.
 *
 * A null property is unmeasured and passes. A present one must be finite and in
 * range: density, specific heat and service life above 0, thermal conductivity
 * at least 0, sound absorption within [0, 1], and vapour resistance at least 1,
 * the factor of still air. The classification must be non-blank, and a present
 * name too. Every finding is returned with a `$input` path; nothing throws, and
 * the surface id is not resolved against any material.
 *
 * @param props.substance Substance record to range-check.
 * @returns Success, or every violation found.
 */
export const validateAutoMovieMaterialSubstance: (
  props: IAutoMovieValidateMaterialSubstance.IProps,
) => IAutoMovieValidation = (
  props: IAutoMovieValidateMaterialSubstance.IProps,
): IAutoMovieValidation => {
  const substance: IAutoMovieMaterialSubstance = props.substance;
  const collector: IAutoMovieViolationCollector = new ViolationCollector();
  const root: string = "$input";
  collector.nonEmpty(
    `${root}.classification`,
    substance.classification,
    "substance classification",
  );
  if (substance.name !== null)
    collector.nonEmpty(`${root}.name`, substance.name, "substance name");
  above(
    substance.density,
    0,
    `${root}.density`,
    "substance density",
    collector,
  );
  atLeast(
    substance.thermalConductivity,
    0,
    `${root}.thermalConductivity`,
    "substance thermal conductivity",
    collector,
  );
  above(
    substance.specificHeat,
    0,
    `${root}.specificHeat`,
    "substance specific heat",
    collector,
  );
  if (substance.soundAbsorption !== null)
    collector.range(
      `${root}.soundAbsorption`,
      substance.soundAbsorption,
      0,
      1,
      "substance sound absorption",
    );
  atLeast(
    substance.vapourResistance,
    1,
    `${root}.vapourResistance`,
    "substance vapour resistance",
    collector,
  );
  above(
    substance.serviceLife,
    0,
    `${root}.serviceLife`,
    "substance service life",
    collector,
  );
  return collector.toValidation();
};

/** A present value must be finite and strictly above `limit`. */
const above: (
  value: number | null,
  limit: number,
  path: string,
  label: string,
  collector: IAutoMovieViolationCollector,
) => void = (
  value: number | null,
  limit: number,
  path: string,
  label: string,
  collector: IAutoMovieViolationCollector,
): void => {
  if (value !== null && value <= limit)
    collector.push(
      "range",
      path,
      `${label} must be a finite number > ${limit}, but was ${value}`,
      value,
    );
};

/** A present value must be finite and at least `limit`. */
const atLeast: (
  value: number | null,
  limit: number,
  path: string,
  label: string,
  collector: IAutoMovieViolationCollector,
) => void = (
  value: number | null,
  limit: number,
  path: string,
  label: string,
  collector: IAutoMovieViolationCollector,
): void => {
  if (value !== null && value < limit)
    collector.push(
      "range",
      path,
      `${label} must be a finite number >= ${limit}, but was ${value}`,
      value,
    );
};
