import {
  IAutoMovieMaterialSubstance,
  IAutoMovieValidation,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";

/**
 * Range-check one substance record.
 *
 * The engine ships no substances, so every value here is the production's own
 * and every one of them is optional. What the engine owns is the refusal: a
 * negative density, an absorption above one, or a vapour resistance below still
 * air are not measurements a later study can use, and a study that silently
 * consumes them reports a number nobody can trace back to a defect.
 */
export const validateAutoMovieMaterialSubstance = (props: {
  substance: IAutoMovieMaterialSubstance;
}): IAutoMovieValidation => {
  const { substance } = props;
  const collector = new ViolationCollector();
  const root = "$input";
  nonEmpty(substance.id, `${root}.id`, "substance id", collector);
  nonEmpty(
    substance.classification,
    `${root}.classification`,
    "substance classification",
    collector,
  );
  if (substance.name !== null)
    nonEmpty(substance.name, `${root}.name`, "substance name", collector);
  if (substance.surface !== null)
    nonEmpty(
      substance.surface,
      `${root}.surface`,
      "substance surface id",
      collector,
    );
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
  if (
    substance.soundAbsorption !== null &&
    (!Number.isFinite(substance.soundAbsorption) ||
      substance.soundAbsorption < 0 ||
      substance.soundAbsorption > 1)
  )
    collector.push(
      "range",
      `${root}.soundAbsorption`,
      `substance sound absorption must be a finite number within [0, 1], but was ${substance.soundAbsorption}`,
      substance.soundAbsorption,
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

const nonEmpty = (
  value: string,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  if (value.trim().length === 0)
    collector.push("type", path, `${label} must be non-empty`, value);
};

const above = (
  value: number | null,
  limit: number,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  if (value !== null && (!Number.isFinite(value) || value <= limit))
    collector.push(
      "range",
      path,
      `${label} must be a finite number > ${limit}, but was ${value}`,
      value,
    );
};

const atLeast = (
  value: number | null,
  limit: number,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  if (value !== null && (!Number.isFinite(value) || value < limit))
    collector.push(
      "range",
      path,
      `${label} must be a finite number >= ${limit}, but was ${value}`,
      value,
    );
};
