import { AutoMovieGrammarStyleIntent } from "@automovie/interface";
import { positive } from "../geometry/positive";
import { GRAMMAR_STYLE_SUPPRESSION } from "./GRAMMAR_STYLE_SUPPRESSION";
import { IAutoMovieGrammarDiagnostic } from "./IAutoMovieGrammarDiagnostic";
import { IAutoMovieGrammarInput } from "./IAutoMovieGrammarInput";
import { IAutoMovieGrammarReading } from "./IAutoMovieGrammarReading";
import { IAutoMovieGrammarStyleClaim } from "./IAutoMovieGrammarStyleClaim";

/**
 * Read an ordered edit, and report which declared exceptions it exercised.
 *
 * Shot order is editorial meaning and remains untouched. Subject collections
 * and action-axis endpoints are normalized by id, so collection order and
 * random generation order cannot alter the result. The analyzer has no seed,
 * clock, scene mutation, or renderer dependency.
 *
 * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-spatial-grammar readFilmGrammar matches declared style exceptions to their exact diagnoses while leaving unmatched findings visible.
 * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar readFilmGrammar realizes deterministic continuity-grammar analysis: Read an ordered edit, and report which declared exceptions it exercised. Shot order is editorial meaning and remains untouched. Subject collections and action-axis endpoints are normalized by id, so collection order and random generation order cannot alter the result. The analyzer has no seed, clock, scene mutation, or renderer dependency.
 */
export const readFilmGrammar = (
  props: IAutoMovieGrammarInput,
): IAutoMovieGrammarReading => {
  const minimumCutAngleDegrees =
    props.minimumCutAngleDegrees ?? DEFAULT_MINIMUM_CUT_ANGLE_DEGREES;
  const reestablishDistance =
    props.reestablishDistance ?? DEFAULT_REESTABLISH_DISTANCE;
  positive(minimumCutAngleDegrees, "minimumCutAngleDegrees");
  positive(reestablishDistance, "reestablishDistance");
  const shots = props.shots.map(normalizeShot);
  const ids = new Set<string>();
  for (const shot of shots) {
    if (ids.has(shot.id))
      throw new Error(`Film grammar shot id "${shot.id}" is duplicated.`);
    ids.add(shot.id);
  }

  const diagnostics: IAutoMovieGrammarDiagnostic[] = [];
  for (const shot of shots) inspectShotSize(diagnostics, shot);
  for (let i = 1; i < shots.length; ++i)
    inspectCut(
      diagnostics,
      shots[i - 1]!,
      shots[i]!,
      minimumCutAngleDegrees,
      reestablishDistance,
    );
  if (shots.length !== 0) {
    const average =
      shots.reduce((sum, shot) => sum + shot.duration, 0) / shots.length;
    const incoming = shots[shots.length - 1]!;
    diagnostics.push({
      code: "grammar-pacing",
      severity: "advisory",
      shot: incoming.id,
      previousShot: null,
      fact: `edited durations are [${shots
        .map((shot) => `${round(shot.duration)}s`)
        .join(", ")}], average shot length ${round(average)}s`,
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
  const exercised = new Set<string>();
  const reported = diagnostics.filter((diagnostic) => {
    if (diagnostic.code === "grammar-pacing") {
      // Pacing is the one film-wide finding, so any participating shot's
      // marker excepts it and every such marker is exercised by it.
      const marked = shots.filter((shot) =>
        shot.styleIntent.includes("rhythmic-pacing"),
      );
      for (const shot of marked)
        exercised.add(claimKey(shot.id, "rhythmic-pacing"));
      return marked.length === 0;
    }
    const shot = shots.find((candidate) => candidate.id === diagnostic.shot)!;
    const intent = shot.styleIntent.find(
      (candidate) => GRAMMAR_STYLE_SUPPRESSION[candidate] === diagnostic.code,
    );
    if (intent === undefined) return true;
    exercised.add(claimKey(shot.id, intent));
    return false;
  });
  const claims: IAutoMovieGrammarStyleClaim[] = shots.flatMap((shot) =>
    shot.styleIntent.map((intent) => ({ shot: shot.id, intent })),
  );
  return {
    reported,
    unmatched: claims.filter(
      (claim) => exercised.has(claimKey(claim.shot, claim.intent)) === false,
    ),
  };
};

/**
 * Shot and intent as one lookup key.
 *
 * Separated by a character no declared intent carries, so two distinct claims
 * cannot collide however a shot happens to be named.
 */
const claimKey = (shot: string, intent: AutoMovieGrammarStyleIntent): string =>
  `${shot}|${intent}`;

/**
 * Shot and intent as one lookup key.
 *
 * Separated by a character no declared intent carries, so two distinct claims
 * cannot collide however a shot happens to be named.
 */
const claimKey = (shot: string, intent: AutoMovieGrammarStyleIntent): string =>
  `${shot}|${intent}`;
