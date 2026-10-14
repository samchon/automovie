import { asArray, isRecord, pushViolation, toValidation, validateArrayArtifact, validateNonEmptyId, validateObjectArtifact, validateRange, validateUniqueIds } from "@automovie/engine";
import type { IAutoMovieConstraintViolation, IAutoMovieSequence, IAutoMovieShot, IAutoMovieValidation } from "@automovie/interface";
import { validateTrim } from "./validateTrim";
import { validateTransition } from "./validateTransition";
import { entryDuration } from "./entryDuration";

/**
 * Validate a cut list and the supplied shot registry in seconds. Structural errors accumulate before adjacent transition spans are compared, so an unresolved or visited malformed entry supplies no invented adjacent span. Ordinary parsed JSON supplies dense arrays; direct sparse host arrays receive no density admission and can skip entry checks. Unguarded conversion of malformed ids or durations in diagnostic text can throw before the report returns.
 *
 * @evidence contracts/common.md#principled-implementation Registry ids resolve through a map, trims define played durations, and an incoming-span accumulator limits adjacent transitions to the intervening played shot. The first entry cannot have an incoming transition and the list must be non-empty; span sums and comparisons use JavaScript numbers without tolerance for rounded boundaries.
 * @evidence contracts/common.md#clear-and-simple-design Sequence admission owns ordered adjacency and registry resolution; entry projection and the separate trim and transition gates own their individual fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing shots remain refusals, visited malformed entries reset their span instead of inventing coverage, and no duration is clipped to pass overlap checks. Sparse host-array slots are skipped and direct diagnostic conversion can throw on malformed JSON objects with unusable conversion members; those limits remain unresolved.
 * @evidence contracts/common.md#meaningful-documentation States seconds, registry input and collective refusal behavior, including the three-layer overlap the accumulator excludes.
 * @evidence contracts/performance.md#efficient-algorithms For S registry shots and E entries the uniqueness scans, map build and ordered validation use O(S+E) expected index work and proportional row storage, plus inspected id/path/error text and findings. Adjacent durations are projected without rescanning the registry.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The shot index is built once and reused for every entry in this validation; fresh calls judge their own supplied registry and keep no cached verdict.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The shot index and entry view are call-local; only the returned validation and original offending values transfer to the caller. No handle or task is acquired.
 */
export function validateSequenceArtifact(sequence: IAutoMovieSequence, shots: IAutoMovieShot[]): IAutoMovieValidation {
  const violations: IAutoMovieConstraintViolation[] = [];
  if (!validateObjectArtifact(sequence, "$input", "sequence", violations))
    return toValidation(violations);
  validateNonEmptyId(sequence.id, "$input.id", "sequence id", violations);
  validateRange(
    sequence.fps,
    "$input.fps",
    0,
    Infinity,
    "sequence fps",
    violations,
    false,
  );
  validateUniqueIds(shots, "$shots", "shot id", violations);
  asArray(shots).forEach((shot: unknown, i: number): void => {
    const path: string = `$shots[${i}]`;
    if (!validateObjectArtifact(shot, path, "shot", violations)) return;
    validateNonEmptyId(shot.id, `${path}.id`, "shot id", violations);
    // cutSequence's played-span gate (#1008): a non-positive registry shot
    // duration would flow into runtime sums (captions, render targets) as a
    // silently nonsensical negative frame count.
    if (
      typeof shot.duration !== "number" ||
      !Number.isFinite(shot.duration) ||
      shot.duration <= 0
    )
      pushViolation(
        violations,
        "range",
        `${path}.duration`,
        `referenced shot "${String(shot.id)}" duration must be a finite number > 0 seconds, but was ${String(shot.duration)}`,
        shot.duration,
      );
  });
  const shotsById: ReadonlyMap<string, IAutoMovieShot> = new Map(
    asArray(shots)
      .filter(isRecord)
      .filter((shot: Record<string, unknown>): boolean => typeof shot.id === "string")
      .map((shot: Record<string, unknown>): [string, IAutoMovieShot] => [shot.id as string, shot as unknown as IAutoMovieShot]),
  );

  // cutSequence's minimum-entries gate: an empty cut-list is not a film, and
  // this validator also guards the resident film.json slice on load, looser
  // here meant an empty film validated clean, then the engine's cut refused
  // it (#1097). The validator/engine no-drift promise binds both directions.
  if (
    validateArrayArtifact(
      sequence.shots,
      "$input.shots",
      "sequence shots",
      violations,
    ) &&
    sequence.shots.length === 0
  )
    pushViolation(
      violations,
      "type",
      "$input.shots",
      "a film must contain at least one shot",
      sequence.shots,
    );
  const entries: unknown[] = asArray(sequence.shots);
  // cutSequence's adjacent-transition accumulator (#988): a valid incoming
  // transition on the previous entry narrows how much of its played span the
  // NEXT transition may consume, or three entries overlap at one instant.
  let previousIncoming: number = 0;
  entries.forEach((entry: unknown, i: number): void => {
    const path: string = `$input.shots[${i}]`;
    let incoming: number = 0;
    if (!validateObjectArtifact(entry, path, "sequence entry", violations)) {
      previousIncoming = incoming;
      return;
    }
    validateNonEmptyId(entry.shot, `${path}.shot`, "sequence shot", violations);
    const shot: IAutoMovieShot | undefined =
      typeof entry.shot === "string" ? shotsById.get(entry.shot) : undefined;
    if (shot === undefined)
      pushViolation(
        violations,
        "type",
        `${path}.shot`,
        `sequence shot "${entry.shot}" must reference an available shot`,
        entry.shot,
      );
    if (entry.trim === undefined)
      pushViolation(
        violations,
        "type",
        `${path}.trim`,
        "sequence trim must be null or an object",
        entry.trim,
      );
    else if (entry.trim !== null)
      validateTrim(
        entry.trim,
        shot?.duration ?? Infinity,
        `${path}.trim`,
        violations,
      );
    if (entry.transition === undefined) {
      pushViolation(
        violations,
        "type",
        `${path}.transition`,
        "sequence transition must be null or an object",
        entry.transition,
      );
    } else if (entry.transition !== null) {
      if (i === 0)
        pushViolation(
          violations,
          "temporal",
          `${path}.transition`,
          "the first sequence entry cannot have an incoming transition",
          entry.transition,
        );
      validateTransition(entry.transition, `${path}.transition`, violations);
      const current: number | null = entryDuration(entry, shot);
      const previousEntry: unknown = entries[i - 1];
      const previous: number | null =
        !isRecord(previousEntry) || typeof previousEntry.shot !== "string"
          ? null
          : entryDuration(previousEntry, shotsById.get(previousEntry.shot));
      const transitionDuration: number =
        isRecord(entry.transition) &&
        typeof entry.transition.duration === "number"
          ? entry.transition.duration
          : NaN;
      if (
        previous !== null &&
        current !== null &&
        Number.isFinite(transitionDuration)
      ) {
        if (transitionDuration > Math.min(previous, current))
          pushViolation(
            violations,
            "temporal",
            `${path}.transition.duration`,
            `transition duration must fit adjacent entries, but was ${transitionDuration}`,
            transitionDuration,
          );
        else if (previousIncoming + transitionDuration > previous)
          pushViolation(
            violations,
            "temporal",
            `${path}.transition.duration`,
            `adjacent transitions (${previousIncoming}s + ${transitionDuration}s) must not overlap inside the previous entry's played span (${previous}s)`,
            transitionDuration,
          );
        else incoming = transitionDuration;
      }
    }
    previousIncoming = incoming;
  });

  return toValidation(violations);
}
