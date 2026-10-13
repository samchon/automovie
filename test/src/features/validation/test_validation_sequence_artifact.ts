import type { IAutoMovieSequence, IAutoMovieShot } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { validateSequenceArtifact } from "@automovie/production/validation/validateSequenceArtifact";

/**
 * Portable cut-list admission collects structural errors and preserves the
 * two-layer editorial boundary in played seconds, including trimmed spans.
 *
 * Scenarios:
 *
 * 1. A supported registry and nonempty cut-list accept null optional spans,
 *    trims ending exactly at the source end, and adjacent transitions whose
 *    sum equals the middle entry's duration.
 * 2. Missing, malformed and duplicate registry/entry identities are refused
 *    at their original paths; invalid spans do not invent durations.
 * 3. The first incoming transition, an overlap longer than either neighbor,
 *    and three simultaneous layers are independently refused.
 * 4. A malformed preceding entry or unresolved current shot cannot authorize
 *    temporal arithmetic, and nonfinite transition duration remains a range
 *    error rather than a fabricated overlap diagnosis.
 */
export const test_validation_sequence_artifact = (): void => {
  const shot: IAutoMovieShot = {
    id: "beat", name: null, scene: "stage", camera: "camera",
    cameraMotion: null, performances: [], objectMotions: [], duration: 5,
  };
  const whole = { shot: "beat", trim: null, transition: null };
  const dissolve = (duration: number) => ({
    ...whole, transition: { kind: "crossDissolve", duration },
  });
  const paths = (entries: unknown, registry: unknown = [shot], patch: Record<string, unknown> = {}): string[] => {
    const sequence = { id: "film", name: null, fps: 24, shots: entries, ...patch } as unknown as IAutoMovieSequence;
    const result = validateSequenceArtifact(sequence, registry as IAutoMovieShot[]);
    return result.success ? [] : result.violations.map((item) => item.path);
  };
  const malformed = validateSequenceArtifact(null as unknown as IAutoMovieSequence, [shot]);
  TestValidator.predicate("sequence object", !malformed.success && malformed.violations.some((item) => item.path === "$input"));
  TestValidator.equals("supported cut", paths([whole]), []);
  TestValidator.equals("trim at shot end", paths([{ ...whole, trim: { start: 1, duration: 4 } }]), []);
  TestValidator.equals("adjacent exact limit", paths([whole, dissolve(2), dissolve(3)]), []);
  TestValidator.predicate("empty film", paths([]).includes("$input.shots"));
  TestValidator.predicate("entries array", paths(null).includes("$input.shots"));
  TestValidator.predicate("sequence identity", paths([whole], [shot], { id: "" }).includes("$input.id"));
  TestValidator.predicate("fps", paths([whole], [shot], { fps: 0 }).includes("$input.fps"));
  TestValidator.predicate("registry array", paths([whole], null).includes("$shots"));
  TestValidator.predicate("registry object", paths([whole], [null, shot]).includes("$shots[0]"));
  TestValidator.predicate("registry identity", paths([whole], [{ ...shot, id: 1 }, shot]).includes("$shots[0].id"));
  TestValidator.predicate("duplicate shot", paths([whole], [shot, shot]).includes("$shots[1].id"));
  for (const duration of [0, -1, NaN, Infinity, "5"])
    TestValidator.predicate("registry duration", paths([whole], [{ ...shot, duration }]).includes("$shots[0].duration"));
  TestValidator.predicate("entry object", paths([null]).includes("$input.shots[0]"));
  TestValidator.predicate("entry identity", paths([{ ...whole, shot: 1 }]).includes("$input.shots[0].shot"));
  TestValidator.predicate("unresolved shot", paths([{ ...whole, shot: "absent" }]).includes("$input.shots[0].shot"));
  TestValidator.predicate("explicit trim", paths([{ ...whole, trim: undefined }]).includes("$input.shots[0].trim"));
  TestValidator.predicate("trim overflow", paths([{ ...whole, trim: { start: 1, duration: 5 } }]).includes("$input.shots[0].trim"));
  TestValidator.predicate("explicit transition", paths([{ ...whole, transition: undefined }]).includes("$input.shots[0].transition"));
  TestValidator.predicate("first transition", paths([dissolve(1)]).includes("$input.shots[0].transition"));
  TestValidator.predicate("neighbor span", paths([whole, dissolve(6)]).includes("$input.shots[1].transition.duration"));
  TestValidator.predicate("three layers", paths([whole, dissolve(3), dissolve(3)]).includes("$input.shots[2].transition.duration"));
  TestValidator.predicate("trimmed neighbor", paths([{ ...whole, trim: { start: 0, duration: 1 } }, dissolve(2)]).includes("$input.shots[1].transition.duration"));
  for (const preceding of [null, { ...whole, shot: 1 }, { ...whole, shot: "absent" }]) {
    const result = paths([preceding, dissolve(6)]);
    TestValidator.predicate("preceding refused", result.length > 0);
    TestValidator.predicate("no invented preceding span", !result.includes("$input.shots[1].transition.duration"));
  }
  TestValidator.predicate("no invented current span", !paths([whole, { ...dissolve(6), shot: "absent" }]).includes("$input.shots[1].transition.duration"));
  for (const transition of [null, 1, { duration: NaN }, { duration: "1" }, {}]) {
    const result = paths([whole, { ...whole, transition }]);
    TestValidator.equals("null transition support", transition === null ? result : [], []);
    TestValidator.predicate("invalid transition collected", transition === null || result.length > 0);
  }
};
