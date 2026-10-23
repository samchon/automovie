import type {
  IEvidenceCheckAnalysis,
  IEvidenceConfigPlan,
  IEvidenceInventory,
  IEvidenceSourceAddress,
} from "@wrtnlabs/evidence";
import fs from "node:fs";
import path from "node:path";

import { canonicalProductionPath } from "../canonicalProductionPath";
import { collectProductionAuthoredBoundaries } from "./collectProductionAuthoredBoundaries";
import { productionFileIdentity } from "./productionFileIdentity";
import { resolveProductionPhysicalPath } from "./resolveProductionPhysicalPath";

/**
 * Evaluation-time path aliases and protected boundaries; later reads are pure.
 *
 * @evidence contracts/common.md#principled-implementation Construction captures physical prefixes, protected boundaries and OS source identity; later methods resolve by longest saved prefix and set membership, so mutable filesystem topology cannot reinterpret an evaluated snapshot.
 * @evidence contracts/common.md#clear-and-simple-design The class separates filesystem metadata acquisition from pure subsequent ownership checks; opaque Evidence IDs are associated with OS identity only during capture.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts File-type/identity changes and unverifiable multi-link inode fallback fail closed; saved logical-root ownership is preserved even when nested links lead elsewhere.
 * @evidence contracts/common.md#meaningful-documentation The class/field/method comments identify saved alias precedence, protected metadata, signature purpose and snapshot-only reads.
 * @evidence contracts/performance.md#efficient-algorithms Construction scans protected entries and plan/inventory selectors, resolves path prefixes and sorts alias/version collections; cost grows with filesystem entries, path depths, aliases and captured source/address counts. Resolution later scans at most all saved prefixes, and protected-source lookup uses a set.
 * @evidence contracts/performance.md#reuse-equivalent-work One saved alias table and protected-ID set serve every later consumer of this analysis; capture uses path/identity maps to reuse file metadata and visited physical directories within the snapshot.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The instance owns saved boundary strings, signature text, alias pairs and protected source IDs, proportional to captured inputs without a fixed cap; weak analysis binding controls its registry lifetime, and synchronous metadata capture leaves no owned handles/tasks.
 */
export class ProductionPathCapture {
  /** Protected physical roots and nested link targets at capture time. */
  public readonly boundaries: readonly string[];

  /** Detects protected-file identity, topology and selector alias changes during evaluation. */
  public readonly signature: string;

  /** Longest logical prefixes win, preserving nested directory and file links. */
  private readonly aliases: readonly (readonly [string, string])[];

  /** Opaque native source IDs whose captured OS identity belongs to the protected tree. */
  private readonly protectedSources: ReadonlySet<string>;

  /**
   * Takes filesystem metadata without reopening any captured document bytes.
   *
   * Principled implementation: Protected tree traversal records aliases and optional bigint file identities, plan selectors add resolvable prefixes, and native inventories attach opaque source IDs to captured OS identities before the longest-prefix table is frozen.
   * Clear and simple design: This constructor owns all live metadata reads; immutable arrays and private sets make subsequent ownership/path queries independent of current files.
   * Prohibited implementation shortcuts: Multiple OS identities for one captured native source, a changed source type and unsupported hard-link identity throw; native source IDs are never decoded or replaced by content hashes.
   * Meaningful documentation: The comment states metadata-only capture without reopening document bytes; fields distinguish topology signature, physical prefixes and protected source membership.
   * Efficient algorithms: Protected traversal and selector/inventory scans scale with entries and addresses; alias/version sorting is O(a log a) comparisons plus path-string cost, and resolving missing ancestor paths may require repeated realpath attempts. Maps/sets store unique paths/identities and temporary metadata alongside the final saved tables.
   * Reuse equivalent work: Physical-path identities are cached within this capture and visited physical directories are enumerated once; no result is reused across captures because topology and OS identities can change.
   * Bound retention and release resources: Instance fields retain saved strings and IDs, while construction maps/metadata expire on completion or throw; state scales with selected paths without a fixed count bound, and synchronous filesystem operations retain no descriptor/task.
   */
  public constructor(
    location: string,
    plan: IEvidenceConfigPlan,
    protectSupport: boolean,
    analysis?: IEvidenceCheckAnalysis,
  ) {
    const aliases: Map<string, string> = new Map();
    const files: Map<string, string> = new Map();
    const protectedFiles: Set<string> = new Set();
    const protectedVersions: Map<string, string> = new Map();
    const remember: (physical: string, metadata: fs.BigIntStats) => string = (
      physical: string,
      metadata: fs.BigIntStats,
    ): string => {
      const normalized: string = canonicalProductionPath(physical);
      const identity: string = productionFileIdentity(normalized, metadata);
      files.set(normalized, identity);
      return identity;
    };
    const protect: (
      logical: string,
      physical: string,
      metadata: fs.BigIntStats,
    ) => void = (
      logical: string,
      physical: string,
      metadata: fs.BigIntStats,
    ): void => {
      const identity: string = remember(physical, metadata);
      protectedFiles.add(identity);
      protectedVersions.set(
        canonicalProductionPath(logical),
        JSON.stringify([identity, String(metadata.nlink)]),
      );
    };
    const record: (logical: string, physical: string) => void = (
      logical: string,
      physical: string,
    ): void => {
      aliases.set(
        canonicalProductionPath(logical),
        canonicalProductionPath(physical),
      );
    };
    const capture: (filename: string) => void = (filename: string): void => {
      if (!aliases.has(canonicalProductionPath(filename)))
        record(filename, resolveProductionPhysicalPath(filename));
    };
    capture(location);
    capture(path.dirname(plan.configFile));
    this.boundaries = Object.freeze(
      (protectSupport
        ? collectProductionAuthoredBoundaries(location, record, protect)
        : []
      ).sort((left: string, right: string): number =>
        left < right ? -1 : left > right ? 1 : 0,
      ),
    );
    const select: (root: string | undefined, files: string[]) => void = (
      root: string | undefined,
      files: string[],
    ): void => {
      const base: string = path.resolve(
        path.dirname(plan.configFile),
        root ?? ".",
      );
      capture(base);
      for (const file of files) {
        if (file.startsWith("!") || /^[a-z][a-z\d+.-]*:\/\//iu.test(file))
          continue;
        const portable: string = file.replaceAll("\\", "/");
        const end: number = portable.search(/[*?[{(]/u);
        capture(
          path.resolve(base, end < 0 ? portable : portable.slice(0, end)),
        );
      }
    };
    for (const claim of plan.claims) {
      select(claim.population.root, claim.population.files);
      if (claim.population.evidenceFiles !== undefined)
        select(undefined, claim.population.evidenceFiles);
      for (const reference of claim.references) {
        const population: typeof reference.population = reference.population;
        select(
          population.root,
          "files" in population
            ? population.files
            : "file" in population
              ? [population.file]
              : [],
        );
      }
    }
    this.signature = JSON.stringify([
      this.boundaries,
      [...aliases].sort(
        ([left]: [string, string], [right]: [string, string]): number =>
          left.localeCompare(right),
      ),
      [...protectedVersions].sort(
        ([left]: [string, string], [right]: [string, string]): number =>
          left.localeCompare(right),
      ),
    ]);

    // Native identities remain native; realpath does not merge distinct hard-link addresses.
    const identities: Map<string, Set<string>> = new Map();
    const identify: (filename: string) => string = (
      filename: string,
    ): string => {
      const physical: string =
        aliases.get(canonicalProductionPath(filename)) ??
        resolveProductionPhysicalPath(filename);
      const cached: string | undefined = files.get(physical);
      if (cached !== undefined) return cached;
      const metadata: fs.BigIntStats = fs.statSync(physical, { bigint: true });
      if (!metadata.isFile())
        throw new Error(
          "A captured source changed file type during evaluation.",
        );
      return remember(physical, metadata);
    };
    const inventory: (input: IEvidenceInventory) => void = (
      input: IEvidenceInventory,
    ): void => {
      for (const source of input.sources) {
        capture(source.physicalPath);
        for (const address of source.addresses) capture(address.absolute);
        if (!protectSupport) continue;
        const tokens: Set<string> = identities.get(source.id) ?? new Set();
        for (const filename of [
          source.physicalPath,
          ...source.addresses.map(
            (address: IEvidenceSourceAddress): string => address.absolute,
          ),
        ]) {
          if (/^[a-z][a-z\d+.-]*:\/\//iu.test(filename)) continue;
          tokens.add(identify(filename));
        }
        if (tokens.size > 1)
          throw new Error(
            "A captured source changed filesystem identity between aliases.",
          );
        identities.set(source.id, tokens);
      }
      for (const dependency of input.dependencies) capture(dependency.path);
    };
    for (const claim of analysis?.graphInput.claims ?? []) {
      inventory(claim.inventory);
      for (const reference of claim.references) inventory(reference.inventory);
    }
    this.protectedSources = new Set(
      [...identities]
        .filter(([, tokens]: [string, Set<string>]): boolean =>
          [...tokens].some((token: string): boolean =>
            protectedFiles.has(token),
          ),
        )
        .map(([id]: [string, Set<string>]): string => id),
    );
    this.aliases = Object.freeze(
      [...aliases]
        .sort(
          ([left]: [string, string], [right]: [string, string]): number =>
            right.length - left.length,
        )
        .map((entry: [string, string]): readonly [string, string] =>
          Object.freeze(entry),
        ),
    );
  }

  /**
   * Tests saved OS metadata ownership without reopening files or decoding native IDs.
   *
   * @evidence contracts/common.md#principled-implementation Opaque native source IDs are tested against the set associated with protected OS identities during construction, avoiding any inference from their spelling.
   * @evidence contracts/common.md#clear-and-simple-design The method exposes only membership, keeping protected file metadata private to its capture owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No current filesystem state, native-ID decoding or content equality changes membership after capture.
   * @evidence contracts/common.md#meaningful-documentation The comment states saved OS metadata ownership and snapshot-only behavior.
   * @evidence contracts/performance.md#efficient-algorithms One set membership lookup takes expected constant time and allocates no input-sized collection.
   * @evidence contracts/performance.md#reuse-equivalent-work The same captured set is reused for every support inventory check of this analysis, with a new instance required for a fresh evaluation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The method acquires no handle/task and retains no new state; its instance owns the saved set for the capture lifetime.
   */
  public isProtectedSource(id: string): boolean {
    return this.protectedSources.has(id);
  }

  /**
   * Resolves captured physical aliases, or preserves descendants of a logical root.
   *
   * The latter reconciles production root aliases while keeping an authored
   * child's logical ownership when a nested link points outside that root.
   *
   * @evidence contracts/common.md#principled-implementation Lexically normalized paths use the first longest matching saved logical prefix; an explicit logical root first preserves descendant ownership under that root while resolving its own saved alias.
   * @evidence contracts/common.md#clear-and-simple-design The pure query implements path equivalence from captured data without reopening or reinterpreting the filesystem.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Uncaptured paths keep their lexical identity; nested links do not erase declared logical authoring ownership when a caller supplies its root.
   * @evidence contracts/common.md#meaningful-documentation The prose explains longest-prefix aliases and the logical-root exception needed for external nested link targets.
   * @evidence contracts/performance.md#efficient-algorithms At most a saved prefixes are scanned with path-length prefix checks; logical-root resolution recurses once without that optional argument, so time is O(a*p) path-character work and returned normalization/concatenation space is O(p).
   * @evidence contracts/performance.md#reuse-equivalent-work The frozen alias table is reused for all path queries of its capture; no live result cache or effectful filesystem work is created.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only local normalized/output strings are owned by the query; it retains no additional capture state and acquires no handle or task.
   */
  public resolve(filename: string, logicalRoot?: string): string {
    const logical: string = canonicalProductionPath(filename);
    if (logicalRoot !== undefined) {
      const root: string = canonicalProductionPath(logicalRoot);
      return logical === root ||
        logical.startsWith(root.endsWith("/") ? root : `${root}/`)
        ? `${this.resolve(logicalRoot)}${logical.slice(root.length)}`
        : logical;
    }
    for (const [prefix, physical] of this.aliases)
      if (
        logical === prefix ||
        logical.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`)
      )
        return `${physical}${logical.slice(prefix.length)}`;
    return logical;
  }
}
