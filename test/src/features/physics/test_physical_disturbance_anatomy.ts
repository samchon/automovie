import type { IAutoMoviePhysicalProfile } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalBalanceReplay } from "../internal/PhysicalBalanceReplay";

/**
 * The balance controller has no anatomy branch: renaming every bone and the
 * body leaves its behaviour unchanged. At every recorded key frame of the
 * replay fixtures, `advancePhysicalBalance` and `trackPhysicalRoot`, given the
 * recorded inputs with every name replaced, return and write exactly the
 * renamed outputs of the same call on the original names.
 *
 * The renaming is order-preserving. Each bone becomes `n` and its rank among
 * the bones' names in code-unit order, so a sort or a tie broken by name
 * keeps its order. The body and its profile become `subject`. A name is
 * replaced wherever it appears as a value or as a part of a `+`-joined list
 * of limbs, and as a key of a dictionary keyed by names. A schema's field
 * keeps its key even where it shares a bone's name, as the primitive's root
 * `body` does.
 *
 * Scenarios:
 *
 * 1. Each fixture's subject, the canonical Human and the four-support
 *    primitive, renamed.
 * 2. Each `advance` record's result, state and actuation equal the original's,
 *    renamed, as JSON with keys in any order.
 * 3. Each `root` record's task, integral, wrenches and actuation equal the
 *    original's, renamed, the same way.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the renaming, why it preserves order and what equality means.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `advancePhysicalBalance` and `trackPhysicalRoot` through the replay on original and renamed records and compares their results and writes.
 * @evidence contracts/development/testing.md#independent-expectations The expectation is the same call on the original names, renamed: names carry no physics, so a body-agnostic controller is invariant under renaming; nothing is computed by a model of the controller.
 * @evidence contracts/development/testing.md#distinguishing-cases A branch on a bone's name, its side read from a `left` or `right` prefix, or the profile's id, say `profile.id === "human"`, changes an output at some recorded frame; order-dependent ties are kept equal by the order-preserving names, so only a name's meaning can part the runs. The recorded outputs themselves are `test_physical_balance_replay`'s.
 * @evidence contracts/development/testing.md#execution-ownership Pure computation over the replay fixtures in the repository; no native world, viewer or simulation run.
 */
export function test_physical_disturbance_anatomy(): void {
  const failures: string[] = [];
  const profiles: Partial<Record<string, IAutoMoviePhysicalProfile>> = {};
  for (const file of PhysicalBalanceReplay.list()) {
    const fixture: PhysicalBalanceReplay.IFixture =
      PhysicalBalanceReplay.load(file);
    const built: IAutoMoviePhysicalProfile = (profiles[fixture.subject] ??=
      PhysicalBalanceReplay.profile(fixture.subject));
    const names: Map<string, string> = new Map(
      [...built.segments.map((segment) => segment.bone)]
        .sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0))
        .map((bone: string, rank: number): [string, string] => [
          bone,
          `n${String(rank).padStart(3, "0")}`,
        ]),
    );
    names.set(fixture.body.id, "subject");
    if (built.id !== fixture.body.id) names.set(built.id, "subject-profile");
    const word = (text: string): string => {
      const direct: string | undefined = names.get(text);
      if (direct !== undefined) return direct;
      const parts: string[] = text.split("+");
      return parts.length > 1 && parts.every((part) => names.has(part))
        ? parts.map((part: string): string => names.get(part)!).join("+")
        : text;
    };
    // Keys are renamed only in a dictionary keyed by names, an object every
    // key of which is one: a schema's field may share a bone's name, as the
    // primitive's root `body` does the fixture's `body`.
    const named = (key: string): boolean => word(key) !== key;
    const rename = (value: unknown): any => {
      if (typeof value === "string") return word(value);
      if (Array.isArray(value)) return value.map(rename);
      if (value === null || typeof value !== "object") return value;
      const entries: [string, unknown][] = Object.entries(value);
      const dictionary: boolean =
        entries.length !== 0 && entries.every(([key]) => named(key));
      return Object.fromEntries(
        entries.map(([key, inner]) => [
          dictionary ? word(key) : key,
          rename(inner),
        ]),
      );
    };
    const renamed: PhysicalBalanceReplay.IFixture = rename(fixture);
    const profile: IAutoMoviePhysicalProfile = rename(built);
    fixture.records.forEach(
      (record: PhysicalBalanceReplay.IRecord, index: number): void => {
        const twin: PhysicalBalanceReplay.IRecord = renamed.records[index]!;
        const original: Record<string, unknown> = rename(
          record.kind === "advance"
            ? PhysicalBalanceReplay.advance(fixture, record, built)
            : PhysicalBalanceReplay.root(fixture, record, built),
        );
        const mirrored: Record<string, unknown> =
          record.kind === "advance"
            ? PhysicalBalanceReplay.advance(renamed, twin, profile)
            : PhysicalBalanceReplay.root(renamed, twin, profile);
        for (const key of Object.keys({ ...original, ...mirrored }))
          if (canonical(original[key]) !== canonical(mirrored[key]))
            failures.push(
              `${fixture.case} ${record.kind}@${record.seconds}${record.reason ? ` (${record.reason})` : ""}: ${key} differs once renamed`,
            );
      },
    );
  }
  TestValidator.equals("anatomy-free balance", failures, []);
}

/** JSON with every object's keys sorted. */
function canonical(value: unknown): string | undefined {
  return JSON.stringify(value, (_key: string, v: unknown): unknown =>
    v !== null && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
        )
      : v,
  );
}
