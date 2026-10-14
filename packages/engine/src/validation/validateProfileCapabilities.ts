import { IAutoMovieProfile, IAutoMovieValidation } from "@automovie/interface";

import { ViolationCollector } from "./ViolationCollector";

/**
 * Admit profile id/name uniqueness and mountable/destructible trait fields: seats/payload, durability and impact-body coefficients.
 *
 * @evidence contracts/common.md#principled-implementation Admit profile id/name uniqueness and mountable/destructible trait fields: seats/payload, durability and impact-body coefficients.
 * @evidence contracts/common.md#clear-and-simple-design Trait-kind branches own capability scalar policy while existing gait admission remains separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Typed closed trait kinds are assumed; positive metadata does not certify a driver or response actually ran.
 * @evidence contracts/common.md#meaningful-documentation Seats1..1024, positive mass/durability and coefficient intervals use exact trait paths.
 * @evidence contracts/performance.md#efficient-algorithms P profiles and T traits require linear checks and local id/kind sets, plus text hashing.
 * @evidence contracts/performance.md#reuse-equivalent-work Scalar helpers share finite/range semantics while uniqueness is local to current inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only diagnostics return; no response driver, physics task or mount host is retained.
 */
export const validateProfileCapabilities: (props: { profiles: readonly IAutoMovieProfile[]; }) => IAutoMovieValidation = (props: {
  /** Profiles attached to one runtime model or model recipe. */
  profiles: readonly IAutoMovieProfile[];
}): IAutoMovieValidation => {
  const collector: ViolationCollector = new ViolationCollector();
  const profileIds: Set<string> = new Set<string>();
  for (const [profileIndex, profile] of props.profiles.entries()) {
    const path: string = `$input.profiles[${profileIndex}]`;
    nonBlank(profile.id, `${path}.id`, "profile id", collector);
    nonBlank(profile.name, `${path}.name`, "profile name", collector);
    unique(profileIds, profile.id, `${path}.id`, "profile id", collector);
    const traitKinds: Set<string> = new Set<string>();
    for (const [traitIndex, trait] of (profile.traits ?? []).entries()) {
      const traitPath: string = `${path}.traits[${traitIndex}]`;
      unique(
        traitKinds,
        trait.kind,
        `${traitPath}.kind`,
        "profile trait kind",
        collector,
      );
      if (trait.kind === "mountable") {
        integer(
          trait.seats,
          1,
          1_024,
          `${traitPath}.seats`,
          "mountable seats",
          collector,
        );
        positive(
          trait.payloadMass,
          `${traitPath}.payloadMass`,
          "mountable payload mass",
          collector,
        );
        continue;
      }
      positive(
        trait.durability,
        `${traitPath}.durability`,
        "destructible durability",
        collector,
      );
      positive(
        trait.impactBody.mass,
        `${traitPath}.impactBody.mass`,
        "impact body mass",
        collector,
      );
      bounded(
        trait.impactBody.restitution,
        0,
        1,
        `${traitPath}.impactBody.restitution`,
        "impact body restitution",
        collector,
      );
      unitPositive(
        trait.impactBody.hardness,
        `${traitPath}.impactBody.hardness`,
        "impact body hardness",
        collector,
      );
      unitPositive(
        trait.impactBody.penetrability,
        `${traitPath}.impactBody.penetrability`,
        "impact body penetrability",
        collector,
      );
    }
  }
  return collector.toValidation();
};

/**
 * Reject an empty trimmed profile/trait label.
 *
 * Capability metadata shares one nonblank identity/name predicate.
 *
 * The authored spelling is not trimmed or renamed.
 *
 * Faults preserve caller label/path and original string.
 *
 * S characters drive trim work and temporary text.
 *
 * Profile ids/names use the same check for current input.
 *
 * Only collector rows remain and no name registry is retained.
 */
const nonBlank: (value: string, path: string, label: string, collector: ViolationCollector) => void = (
  value: string,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  if (value.trim().length === 0)
    collector.push("type", path, `${label} must be non-blank`, value);
};

/**
 * Report an already-seen string, then record it in the supplied set.
 *
 * The caller chooses profile-wide or per-profile trait scope.
 *
 * Duplicates are diagnosed without deleting or reordering traits.
 *
 * The supplied set is mutated and later duplicate paths are reported.
 *
 * Expected set lookup/insert costs depend on string hashing.
 *
 * One caller-owned set shares first-seen identity within its declared scope.
 *
 * The caller owns/releases the set and diagnostics; no global registry is created.
 */
const unique: (seen: Set<string>, value: string, path: string, label: string, collector: ViolationCollector) => void = (
  seen: Set<string>,
  value: string,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  if (seen.has(value))
    collector.push("type", path, `${label} must be unique`, value);
  seen.add(value);
};

/**
 * Require finite positive capability mass/durability values.
 *
 * One scalar owner serves payload and destruction metadata.
 *
 * Explicit zero/negative/nonfinite values are refused rather than replaced.
 *
 * Strict positivity and field-relative diagnostics are stated.
 *
 * Constant scalar comparisons plus failure text are required.
 *
 * Capability variants share this predicate for their positive fields.
 *
 * Only collector rows remain with no simulated response state.
 */
const positive: (value: number, path: string, label: string, collector: ViolationCollector) => void = (
  value: number,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  if (Number.isFinite(value) === false || value <= 0)
    collector.push(
      "range",
      path,
      `${label} must be finite and positive`,
      value,
    );
};

/**
 * Require finite coefficients in(0,1] as resolveImpact admits.
 *
 * The trait gate aligns its hardness/penetrability domain with the response owner.
 *
 * Zero is excluded by the response contract, not a fixture adjustment.
 *
 * Open lower and inclusive upper endpoints are explicit.
 *
 * Fixed scalar comparisons cost constant work.
 *
 * Both impact coefficients reuse the same admission rule.
 *
 * Only diagnostics remain; no impact simulation or native body is acquired.
 */
const unitPositive: (value: number, path: string, label: string, collector: ViolationCollector) => void = (
  value: number,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  if (Number.isFinite(value) === false || value <= 0 || value > 1)
    collector.push(
      "range",
      path,
      `${label} must be finite and within (0, 1]`,
      value,
    );
};

/**
 * Delegate a finite inclusive scalar interval to collector.range.
 *
 * The field owner supplies restitution's interval and this wrapper preserves diagnostics.
 *
 * No clamping or default changes invalid authored values.
 *
 * Supplied endpoints/path/label and append-only effect are stated.
 *
 * Constant scalar work plus failure text follows collector.range.
 *
 * Capability checks reuse the canonical collector interval semantics.
 *
 * Only caller-owned diagnostics remain and no resource is retained.
 */
const bounded: (value: number, min: number, max: number, path: string, label: string, collector: ViolationCollector) => void = (
  value: number,
  min: number,
  max: number,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => collector.range(path, value, min, max, label);

/**
 * Require an integer within inclusive supplied seat-count bounds.
 *
 * Mountable metadata owns1..1024 while the predicate owns integer admission.
 *
 * Fractional/nonfinite values are refused, not rounded into capacity.
 *
 * Inclusive boundaries and original actual value are explicit.
 *
 * Fixed integer/range checks take constant work.
 *
 * Seat metadata uses the same scalar rule for current inputs.
 *
 * Only collector faults remain; no seating allocation or mount host starts.
 */
const integer: (value: number, min: number, max: number, path: string, label: string, collector: ViolationCollector) => void = (
  value: number,
  min: number,
  max: number,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  if (Number.isInteger(value) === false || value < min || value > max)
    collector.push(
      "range",
      path,
      `${label} must be an integer within [${min}, ${max}]`,
      value,
    );
};
