import path from "node:path";
import { compareCodeUnits } from "./contentIdentity";
import { isAutoMovieProductionArtifactEntry } from "./isAutoMovieProductionArtifactEntry";

/**
 * Select resident legacy entries for an ordered move into namespaced storage.
 *
 * Fixed v0 design/state candidates keep their publication order. Output roots are expanded by entry, filtering the supported regular renders/README.md exception and sorting code units; a linked root or artifact named exactly like the destination namespace refuses. Empty plans let the project adopt the layout version without staging absent output.
 *
 * @evidence contracts/common.md#principled-implementation Caller-supplied residency and output observations decide moves, and node:path resolves platform paths. The project migration supplies physical ancestry/entry fences and rechecks before rename; planning alone cannot establish continued residency or atomic migration.
 * @evidence contracts/common.md#clear-and-simple-design A flat ordered move list preserves the existing migration phases while keeping physical staging, version publication and reverse recovery with productionProjectMigrateLegacyProductionLayout.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The shared artifact predicate excludes only the regular renders README; names alone cannot hide directories or links. Linked roots and namespace-name conflicts refuse instead of inventing a nested authoritative copy.
 * @evidence contracts/common.md#meaningful-documentation Documents fixed versus enumerated candidates, deterministic order, empty-plan meaning, documentation exception and admission refusals, including the caller's later identity checks.
 * @evidence contracts/performance.md#efficient-algorithms Fixed candidate construction is bounded; for E entries per output root, filtering costs O(E) and sorting O(E log E) comparisons plus name lengths and callback filesystem work. The owning migration also stages/renames M moves, reacquires fences and can use O(M squared) published-membership comparisons during recovery.
 * @evidence contracts/performance.md#reuse-equivalent-work The plan reuses the shared artifact classification with namespace initialization, but resident observations are fresh per open and each planned move must be revalidated before effect.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Candidate and move arrays retain path strings until the caller finishes; no handle or task is acquired here. The migration owns temporary directories and recovery data, which can remain after failure; neither output population nor retained bytes is capped by this planner.
 */
export function planAutoMovieProductionLayoutMigration(
  props: {
  /** Reserved state root of the project being opened. */
  automovieRoot: string;

  /** Design root the project-shared recipes belong at. */
  sharedDesignRoot: string;

  /** Design root the active production's own records belong at. */
  productionDesignRoot: string;

  /** State root the active production's own records belong at. */
  productionStateRoot: string;

  /** Directory segment naming the active production's namespace. */
  productionSegment: string;

  /** Output roots the namespaced layout partitions, in publication order. */
  outputRoots: readonly {
    /** Which output root this is, which decides the entry judgment. */
    directory: "generated" | "renders";

    /** Absolute owned path of that root. */
    root: string;
  }[];

  /** What resides at one output root, reporting a non-directory as absent. */
  outputState: (root: string) =>
    | { kind: "absent" }
    | { kind: "linked" }
    | {
        kind: "entries";
        entries: readonly { name: string; isFile: boolean }[];
      };

  /** Whether one fixed legacy candidate resides in this project. */
  resident: (source: string) => boolean;
}
): {
  /** Absolute resident path the migration stages. */
  source: string;

  /** Absolute path under the namespaced layout it is published at. */
  destination: string;
}[] {
  const designRoot: string = path.join(props.automovieRoot, "design");
  const candidates: { source: string; destination: string }[] = [];
  for (const directory of ["models", "formations"])
    candidates.push({
      source: path.join(designRoot, directory),
      destination: path.join(props.sharedDesignRoot, directory),
    });
  candidates.push({
    source: path.join(designRoot, "world.json"),
    destination: path.join(props.sharedDesignRoot, "world.json"),
  });
  candidates.push({
    source: path.join(designRoot, "production.json"),
    destination: path.join(props.productionDesignRoot, "production.json"),
  });
  for (const directory of ["shots", "acceptance", "screenplay"])
    candidates.push({
      source: path.join(designRoot, directory),
      destination: path.join(props.productionDesignRoot, directory),
    });
  for (const entry of [
    "revision.json",
    "generated-manifest.json",
    "render-manifest.json",
    "render-manifest-receipt.json",
    "render-receipts",
    "audit",
  ])
    candidates.push({
      source: path.join(props.automovieRoot, entry),
      destination: path.join(props.productionStateRoot, entry),
    });
  const moves: ReturnType<typeof planAutoMovieProductionLayoutMigration> = candidates.filter((move: ReturnType<typeof planAutoMovieProductionLayoutMigration>[number]): boolean => props.resident(move.source));
  for (const output of props.outputRoots) {
    const state: ReturnType<Parameters<typeof planAutoMovieProductionLayoutMigration>[0]["outputState"]> = props.outputState(output.root);
    if (state.kind === "linked")
      throw new Error(
        `Legacy production path "${output.root}" is a symlink or junction. Replace it with project-owned files before migration.`,
      );
    if (state.kind === "absent") continue;
    const namespace: string = path.join(output.root, props.productionSegment);
    const legacy: { name: string; isFile: boolean }[] = state.entries
      .filter((entry: { name: string; isFile: boolean }): boolean =>
        isAutoMovieProductionArtifactEntry({
          directory: output.directory,
          name: entry.name,
          isFile: entry.isFile,
        }),
      )
      .sort((left: { name: string; isFile: boolean }, right: { name: string; isFile: boolean }): number => compareCodeUnits(left.name, right.name));
    if (legacy.length === 0) continue;
    if (legacy.some((entry: { name: string; isFile: boolean }): boolean => entry.name === props.productionSegment))
      throw new Error(
        `Legacy production path "${output.root}" conflicts with namespaced destination "${namespace}". Keep one authoritative copy before reopening the project.`,
      );
    for (const entry of legacy)
      moves.push({
        source: path.join(output.root, entry.name),
        destination: path.join(namespace, entry.name),
      });
  }
  return moves;
}
