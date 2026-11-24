import * as archetypes from "@automovie/archetypes";
import { ARCHETYPE_FAMILIES } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";
import fs from "node:fs";
import path from "node:path";

import { repositoryRoot } from "../internal/repositoryRoot";

/** What the test reads of the archetypes package's manifest. */
interface IManifest {
  /** The source export map, by subpath. */
  exports: Record<string, unknown>;

  /** The published configuration. */
  publishConfig: {
    /** The published export map, by subpath. */
    exports: Record<string, unknown>;
  };
}

/**
 * The package exports its model families and a separate environment authoring
 * entry.
 *
 * Scenarios:
 *
 * 1. The families, root, manifest and environment authoring entry account for
 *    every source and published export path.
 * 2. Every `create*` function the root exports is held by exactly one family, and
 *    every producer a family holds is the root's own export.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the family table, the root module and the manifest's source and published export maps.
 * @evidence contracts/development/testing.md#independent-expectations The manifest declares the paths independently of the table, and the root's naming rule identifies all of its model producers.
 * @evidence contracts/development/testing.md#distinguishing-cases A missing family, a duplicate role for the environment path, or a different release export list fails the first scenario. A producer in no family or in two fails the second.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over module exports, discovered by its exported name; it builds no model and starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the two scenarios and what each pins.
 */
export async function test_archetype_families(): Promise<void> {
  // The package's manifest, read from its file rather than imported.
  const manifest: IManifest = JSON.parse(
    await fs.promises.readFile(
      path.join(repositoryRoot(), "packages/archetypes/package.json"),
      "utf8",
    ),
  );
  const byName: (a: string, b: string) => number = (
    a: string,
    b: string,
  ): number => a.localeCompare(b);

  // 1. The model families and the explicitly separate entry points cover the manifest.
  const paths: string[] = [
    ".",
    "./package.json",
    "./environments",
    ...Object.keys(ARCHETYPE_FAMILIES).map(
      (family: string): string => `./${family}`,
    ),
  ].sort(byName);
  TestValidator.equals(
    "the model families and authoring entry match the source exports",
    Object.keys(manifest.exports).sort(byName),
    paths,
  );
  TestValidator.equals(
    "the model families and authoring entry match the published exports",
    Object.keys(manifest.publishConfig.exports).sort(byName),
    paths,
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
