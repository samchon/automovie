import * as archetypes from "@automovie/archetypes";
import { ARCHETYPE_FAMILIES } from "@automovie/archetypes";
import manifest from "@automovie/archetypes/package.json";
import { TestValidator } from "@nestia/e2e";

/**
 * The family table names every family the package exports as a subpath, and the families together hold every producer the root exports, each once.
 *
 * Scenarios:
 * 1. The table's keys are exactly the subpaths of the manifest's `exports` other than the root and the manifest itself.
 * 2. Every `create*` function the root exports is held by exactly one family, and every producer a family holds is the root's own export.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the published table, the package's root exports and its manifest, the three a consumer reads.
 * @evidence contracts/development/testing.md#independent-expectations The subpaths are read from the manifest and the producers from the root by their naming rule, not from the table under test.
 * @evidence contracts/development/testing.md#distinguishing-cases A family missing from the table fails the first scenario; a producer in no family or in two fails the second.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over module exports, discovered by its exported name; it builds no model and starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the two scenarios and what each pins.
 */
export function test_archetype_families(): void {
  const byName: (a: string, b: string) => number = (
    a: string,
    b: string,
  ): number => a.localeCompare(b);

  // 1. The families are the subpaths.
  TestValidator.equals(
    "the families are the manifest's subpaths",
    Object.keys(ARCHETYPE_FAMILIES).sort(byName),
    Object.keys(manifest.exports)
      .filter((key: string): boolean => key !== "." && key !== "./package.json")
      .map((key: string): string => key.slice(2))
      .sort(byName),
  );

  // 2. Every producer in exactly one family.
  const root: Readonly<Record<string, unknown>> = archetypes as Readonly<
    Record<string, unknown>
  >;
  const producers: (space: Readonly<Record<string, unknown>>) => string[] = (
    space: Readonly<Record<string, unknown>>,
  ): string[] =>
    Object.keys(space).filter(
      (name: string): boolean =>
        /^create[A-Z]/.test(name) && typeof space[name] === "function",
    );
  const held: string[] = Object.values(ARCHETYPE_FAMILIES).flatMap(
    (family: object): string[] =>
      producers(family as Readonly<Record<string, unknown>>),
  );
  TestValidator.equals(
    "every root producer is held by exactly one family",
    [...held].sort(byName),
    producers(root).sort(byName),
  );
  TestValidator.predicate(
    "a family holds the root's own producer",
    held.every((name: string): boolean => {
      const family: object | undefined = Object.values(ARCHETYPE_FAMILIES).find(
        (f: object): boolean => name in f,
      );
      return (family as Record<string, unknown>)[name] === root[name];
    }),
  );
}
