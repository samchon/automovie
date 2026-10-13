import {
  IAutoMovieMaterialSubstance,
  IAutoMovieValidation,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";

/**
 * Range-check one substance record.
 *
 * The engine ships no substances, so every value here is the production's own
 * and every measured property is optional. What the engine owns is the
 * refusal: a negative density, an absorption above one, or a vapour resistance
 * below still air are not measurements a later study can use, and a study that
 * silently consumes them reports a number nobody can trace back to a defect.
 *
 * A null property is unmeasured and passes. A present one must be finite and
 * in range: density, specific heat and service life above 0, thermal
 * conductivity at least 0, sound absorption within [0, 1], and vapour
 * resistance at least 1, the factor of still air. The id and classification
 * must be non-blank, and a present name or surface id too. Every finding is
 * returned with a `$input` path; nothing throws, and the surface id is not
 * resolved against any material.
 *
 * @param props.substance Substance record to range-check.
 * @returns Success, or every violation found.
 *
 * @evidence contracts/common.md#principled-implementation Each bound is the physical domain of its quantity: mass density, specific heat and service life are strictly positive, conductivity cannot be negative, an absorption coefficient is a fraction of incident energy, and a vapour diffusion resistance factor is relative to still air and so at least 1.
 * @evidence contracts/common.md#clear-and-simple-design One function owns the substance record's ranges; blank strings and the closed absorption range use the collector's shared rules, and only the open and half-open numeric bounds keep two small local checks because their messages name the bound kind.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No substance, classification or value is special-cased, and no default is substituted for an unmeasured property, which stays null.
 * @evidence contracts/common.md#meaningful-documentation The documentation states why the engine refuses rather than ships values, what null means, every range with its bound kind, the string rules, the path root, that nothing throws, and that the surface id is not resolved.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A fixed number of field checks per record, with no algorithm, structure or traversal to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A check of one record per call that coordinates no shared work across requests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Builds only the returned validation from a local collector, at most one finding per field; nothing else outlives the call.
 */
export const validateAutoMovieMaterialSubstance = (props: {
  /** Substance record to range-check. */
  substance: IAutoMovieMaterialSubstance;
}): IAutoMovieValidation => {
  const { substance } = props;
  const collector: ViolationCollector = new ViolationCollector();
  const root: string = "$input";
  collector.nonEmpty(`${root}.id`, substance.id, "substance id");
  collector.nonEmpty(
    `${root}.classification`,
    substance.classification,
    "substance classification",
  );
  if (substance.name !== null)
    collector.nonEmpty(`${root}.name`, substance.name, "substance name");
  if (substance.surface !== null)
    collector.nonEmpty(
      `${root}.surface`,
      substance.surface,
      "substance surface id",
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

/** A present value must be finite and at least `limit`. */
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
