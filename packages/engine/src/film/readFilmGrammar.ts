import {
  AutoMovieGrammarStyleIntent,
  IAutoMovieCameraIntent,
} from "@automovie/interface";

import { roundToThousandths } from "../math/roundToThousandths";
import { IAutoMovieGrammarDiagnostic } from "./IAutoMovieGrammarDiagnostic";
import { IAutoMovieGrammarInput } from "./IAutoMovieGrammarInput";
import { IAutoMovieGrammarReading } from "./IAutoMovieGrammarReading";
import { IAutoMovieGrammarStyleClaim } from "./IAutoMovieGrammarStyleClaim";
import { IAutoMovieNormalizedGrammarShot } from "./IAutoMovieNormalizedGrammarShot";
import { assertGrammarPositive } from "./assertGrammarPositive";
import { GRAMMAR_STYLE_SUPPRESSION } from "./constants/GRAMMAR_STYLE_SUPPRESSION";
import { inspectGrammarCut } from "./inspectGrammarCut";
import { measureGrammarShotSize } from "./measureGrammarShotSize";
import { normalizeGrammarShot } from "./normalizeGrammarShot";

/** Default smallest camera-bearing change of a same-size cut, in degrees. */
const DEFAULT_MINIMUM_CUT_ANGLE_DEGREES: number = 30;

/** Default primary-subject displacement that demands a wide shot, in metres. */
const DEFAULT_REESTABLISH_DISTANCE: number = 10;

/** A shot's size at one boundary, as `measureGrammarShotSize` answers it. */
type Framing = IAutoMovieCameraIntent["framing"] | null;

/** Reads a shot's measured size at one boundary, measuring each pair once. */
type ShotSizeOf = Parameters<typeof inspectGrammarCut>[3];

/**
 * Reads an ordered edit mechanically and reports the film-grammar findings no declared exception excepted, together with the declarations that excepted nothing.
 *
 * Every shot is validated and canonicalized by `normalizeGrammarShot`, and the read throws on the first malformed observation, on a duplicate shot id, or on a threshold that is not finite and positive. It then files, in this order, a shot-size finding per shot whose measured size at either boundary differs from its declared size; for each cut, an axis-crossing, an eyeline, a jump-cut, a displacement re-establishing and a screen-direction finding, then an entrant re-establishing finding when the displacement one was not filed; and one advisory pacing finding for a non-empty edit. A finding is excepted when its shot declares the style intent `GRAMMAR_STYLE_SUPPRESSION` maps to its code, and pacing is excepted when any shot declares `rhythmic-pacing`.
 *
 * Shot order is editorial meaning and is kept. Subject order and action-axis endpoint order are canonicalized, so they cannot change the result, and the read uses no seed, clock, scene mutation or renderer.
 *
 * @param props The edited shots and the jump-cut and re-establish thresholds.
 * @returns The unexcepted findings in filing order and the unexercised claims.
 *
 * @evidence contracts/common.md#principled-implementation Findings are judged only on the observed boundary samples, adjacent shots in edit order form the cuts, and suppression is a lookup in the one-to-one `GRAMMAR_STYLE_SUPPRESSION` table applied in the same filter that records which claim excepted what, so the reported list and the unmatched claims are two views of one decision and cannot disagree; the pacing average is the arithmetic mean of the edited durations.
 * @evidence contracts/common.md#clear-and-simple-design This entry validates thresholds and shot ids, orders the checks, files shot-size and pacing findings and applies suppression; per-shot validation lives in `normalizeGrammarShot`, size measurement in `measureGrammarShotSize`, and the cut rules in `inspectGrammarCut`, so each rule has one owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No shot, subject, camera or intent is special-cased; the thresholds are the documented input defaults, and malformed input throws instead of being skipped or repaired.
 * @evidence contracts/common.md#meaningful-documentation States what throws, the filing order of every finding family, how suppression applies including the film-wide pacing rule, and which orders can and cannot affect the result.
 * @evidence contracts/performance.md#efficient-algorithms Visits every shot and normalizes its subjects, adding O(S + sum(n log(n+1))) structural work for S shots and per-shot subject counts n. Cut inspectors use the built indexes, with entrant searches linear in subject count; inspected and emitted text adds its length. Suppression uses one lookup per finding without rescanning the growing finding list.
 * @evidence contracts/performance.md#reuse-equivalent-work A shot's measured size at each boundary is computed once and memoized for the call, keyed by the normalized shot object and the boundary, because the shot-size check, the jump-cut comparison and both re-establishing checks read the same pair; the inputs are immutable for the call, so no invalidation is needed, and nothing is shared across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains, for one call, the normalized shots, a shot index, the size memo of at most two entries per shot, the finding list and the claim keys; all are released on return except the returned findings and claims, which the caller owns.
 */
export function readFilmGrammar(
  props: IAutoMovieGrammarInput,
): IAutoMovieGrammarReading {
  const minimumCutAngleDegrees: number =
    props.minimumCutAngleDegrees ?? DEFAULT_MINIMUM_CUT_ANGLE_DEGREES;
  const reestablishDistance: number =
    props.reestablishDistance ?? DEFAULT_REESTABLISH_DISTANCE;
  assertGrammarPositive(minimumCutAngleDegrees, "minimumCutAngleDegrees");
  assertGrammarPositive(reestablishDistance, "reestablishDistance");
  const shots: IAutoMovieNormalizedGrammarShot[] = props.shots.map(
    (
      shot: IAutoMovieGrammarInput["shots"][number],
    ): IAutoMovieNormalizedGrammarShot => normalizeGrammarShot(shot),
  );
  const shotById: Map<string, IAutoMovieNormalizedGrammarShot> = new Map();
  for (const shot of shots) {
    if (shotById.has(shot.id))
      throw new Error(`Film grammar shot id "${shot.id}" is duplicated.`);
    shotById.set(shot.id, shot);
  }
  const sizeOf: ShotSizeOf = memoizedShotSize();

  const diagnostics: IAutoMovieGrammarDiagnostic[] = [];
  for (const shot of shots) inspectShotSize(diagnostics, shot, sizeOf);
  for (let i: number = 1; i < shots.length; ++i)
    inspectGrammarCut(diagnostics, shots[i - 1]!, shots[i]!, sizeOf, {
      minimumCutAngleDegrees,
      reestablishDistance,
    });
  if (shots.length !== 0) {
    const sum: number = shots.reduce(
      (sum: number, shot: IAutoMovieNormalizedGrammarShot): number =>
        sum + shot.duration,
      0,
    );
    const average: number = Number.isFinite(sum)
      ? sum / shots.length
      : shots.reduce(
          (
            mean: number,
            shot: IAutoMovieNormalizedGrammarShot,
            index: number,
          ): number => mean + (shot.duration - mean) / (index + 1),
          0,
        );
    diagnostics.push({
      code: "grammar-pacing",
      severity: "advisory",
      shot: shots[shots.length - 1]!.id,
      previousShot: null,
      fact: `edited durations are [${shots
        .map(
          (shot: IAutoMovieNormalizedGrammarShot): string =>
            `${roundToThousandths(shot.duration)}s`,
        )
        .join(", ")}], average shot length ${roundToThousandths(average)}s`,
      impact:
        "the duration series is the measurable basis for judging whether the cut rhythm serves the beat",
      recovery:
        "compare the duration series with the intended dramatic cadence, then trim, extend, or explicitly mark rhythmic-pacing",
    });
  }
  // Which declaration excepted which finding is decided exactly once, here,
  // while the decision is being made. Recomputing it downstream from the same
  // table is how a suppression and a report of that suppression come to
  // disagree about the same edit.
  const exercised: Set<string> = new Set();
  const reported: IAutoMovieGrammarDiagnostic[] = diagnostics.filter(
    (diagnostic: IAutoMovieGrammarDiagnostic): boolean => {
      if (diagnostic.code === "grammar-pacing") {
        // Pacing is the one film-wide finding, so any participating shot's
        // marker excepts it and every such marker is exercised by it.
        const marked: IAutoMovieNormalizedGrammarShot[] = shots.filter(
          (shot: IAutoMovieNormalizedGrammarShot): boolean =>
            shot.styleIntent.includes("rhythmic-pacing"),
        );
        for (const shot of marked)
          exercised.add(claimKey(shot.id, "rhythmic-pacing"));
        return marked.length === 0;
      }
      const shot: IAutoMovieNormalizedGrammarShot = shotById.get(
        diagnostic.shot,
      )!;
      const intent: AutoMovieGrammarStyleIntent | undefined =
        shot.styleIntent.find(
          (candidate: AutoMovieGrammarStyleIntent): boolean =>
            GRAMMAR_STYLE_SUPPRESSION[candidate] === diagnostic.code,
        );
      if (intent === undefined) return true;
      exercised.add(claimKey(shot.id, intent));
      return false;
    },
  );
  const claims: IAutoMovieGrammarStyleClaim[] = shots.flatMap(
    (shot: IAutoMovieNormalizedGrammarShot): IAutoMovieGrammarStyleClaim[] =>
      shot.styleIntent.map(
        (intent: AutoMovieGrammarStyleIntent): IAutoMovieGrammarStyleClaim => ({
          shot: shot.id,
          intent,
        }),
      ),
  );
  return {
    reported,
    unmatched: claims.filter(
      (claim: IAutoMovieGrammarStyleClaim): boolean =>
        exercised.has(claimKey(claim.shot, claim.intent)) === false,
    ),
  };
}

/**
 * Shot and intent as one lookup key.
 *
 * Separated by a character no declared intent carries, so two distinct claims cannot collide however a shot happens to be named.
 */
function claimKey(shot: string, intent: AutoMovieGrammarStyleIntent): string {
  return `${shot}|${intent}`;
}

/**
 * A size reader that measures each shot boundary at most once per read; the shot-size check, the jump-cut comparison and both re-establishing checks ask for the same boundaries.
 */
function memoizedShotSize(): ShotSizeOf {
  const sizes: Map<
    IAutoMovieNormalizedGrammarShot,
    Partial<Record<"start" | "end", Framing>>
  > = new Map();
  return (
    shot: IAutoMovieNormalizedGrammarShot,
    boundary: "start" | "end",
  ): Framing => {
    let known: Partial<Record<"start" | "end", Framing>> | undefined =
      sizes.get(shot);
    if (known === undefined) {
      known = {};
      sizes.set(shot, known);
    }
    const cached: Framing | undefined = known[boundary];
    if (cached !== undefined) return cached;
    const measured: Framing = measureGrammarShotSize(shot, boundary);
    known[boundary] = measured;
    return measured;
  };
}

/** Files a shot-size finding when either boundary misses the declared size. */
function inspectShotSize(
  diagnostics: IAutoMovieGrammarDiagnostic[],
  shot: IAutoMovieNormalizedGrammarShot,
  sizeOf: ShotSizeOf,
): void {
  if (shot.primarySubject === null || shot.declaredShotSize === null) return;
  const start: Framing = sizeOf(shot, "start");
  const end: Framing = sizeOf(shot, "end");
  const measured: IAutoMovieCameraIntent["framing"][] = [start, end].filter(
    (value: Framing): value is IAutoMovieCameraIntent["framing"] =>
      value !== null,
  );
  if (
    measured.length === 0 ||
    measured.every(
      (value: IAutoMovieCameraIntent["framing"]): boolean =>
        value === shot.declaredShotSize,
    )
  )
    return;
  diagnostics.push({
    code: "grammar-shot-size",
    severity: "warning",
    shot: shot.id,
    previousShot: null,
    fact: `shot "${shot.id}" declares ${shot.declaredShotSize} framing but projects "${shot.primarySubject}" as ${start ?? "unmeasurable"} -> ${end ?? "unmeasurable"}`,
    impact:
      "the rendered subject scale does not deliver the authored shot-size hierarchy",
    recovery: `move camera "${shot.id}" to measure as ${shot.declaredShotSize}, change its lens, or correct the declared framing`,
  });
}
