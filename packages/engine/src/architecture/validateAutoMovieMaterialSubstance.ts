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
 *
 * A null property is unmeasured and passes. A present one must be finite and
 * in range: density, specific heat and service life above 0, thermal
 * conductivity at least 0, sound absorption within [0, 1], and vapour
 * resistance at least 1. The id and classification must be non-blank, and a
 * present name or surface id too. Every finding is returned with a `$input`
 * path; nothing throws, and the surface id is not resolved against any
 * material.
 *
 * @evidence contracts/common.md#principled-implementation Applies each property's physical lower bound or closed range, with vapour resistance bounded by still air (µ = 1) and absorption by a fraction; non-finite values fail every bound because each test checks `Number.isFinite` first.
 * @evidence contracts/common.md#clear-and-simple-design One flat sequence of field checks through private `above`, `atLeast` and `nonEmpty` helpers; the collector's own `range` method covers closed ranges only, which is why the half-open bounds have local helpers, and `nonEmpty` repeats the copy in every sibling validator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ships no substance values and checks no classification against a catalogue, because both are production content; null is the contract's unmeasured state, not a default.
 * @evidence contracts/common.md#meaningful-documentation States who owns the values, every bound and whether it is strict, the null meaning, that findings are returned rather than thrown, and that the surface id is not resolved.
 * @evidence contracts/performance.md#cost-and-resources A fixed set of ten field checks on one record writing into one collector whose violations are returned; nothing is cached and nothing else is held.
 */
export const validateAutoMovieMaterialSubstance = (props: {
  /** Substance record to range-check. */
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
