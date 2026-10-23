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

/** Evaluation-time path aliases and protected boundaries; later reads are pure. */
export class ProductionPathCapture {
  /** Protected physical roots and nested link targets at capture time. */
  public readonly boundaries: readonly string[];

  /** Detects protected-file identity, topology and selector alias changes during evaluation. */
  public readonly signature: string;

  /** Longest logical prefixes win, preserving nested directory and file links. */
  private readonly aliases: readonly (readonly [string, string])[];

  /** Opaque native source IDs whose captured OS identity belongs to the protected tree. */
  private readonly protectedSources: ReadonlySet<string>;

  /** Takes filesystem metadata without reopening any captured document bytes. */
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
    const identify: (filename: string) => string = (filename: string): string => {
      const physical: string =
        aliases.get(canonicalProductionPath(filename)) ??
        resolveProductionPhysicalPath(filename);
      const cached: string | undefined = files.get(physical);
      if (cached !== undefined) return cached;
      const metadata: fs.BigIntStats = fs.statSync(physical, { bigint: true });
      if (!metadata.isFile())
        throw new Error("A captured source changed file type during evaluation.");
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
          [...tokens].some((token: string): boolean => protectedFiles.has(token)),
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

  /** Tests saved OS metadata ownership without reopening files or decoding native IDs. */
  public isProtectedSource(id: string): boolean {
    return this.protectedSources.has(id);
  }

  /**
   * Resolves captured physical aliases, or preserves descendants of a logical root.
   *
   * The latter reconciles production root aliases while keeping an authored
   * child's logical ownership when a nested link points outside that root.
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
