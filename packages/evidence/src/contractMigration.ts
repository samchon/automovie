import { createHash } from "node:crypto";
import path from "node:path";

import {
  type AutoMovieProductionLanguage,
  isAutoMovieProductionLanguage,
} from "./AutoMovieProductionLanguage";
import { parseAutoMovieEvidenceMarkdownHeadings } from "./parseAutoMovieEvidenceMarkdown";

/**
 * One immutable shared-contract file identity recorded by a generated project.
 */
export interface IAutoMovieContractBaselineFile {
  /** Stable H2 identities present in the recorded bytes. */
  anchors: readonly string[];
  /** Project-relative scaffold contract path. */
  path: string;
  /** SHA-256 identity of the recorded UTF-8 bytes. */
  sha256: string;
}

/** The scaffold contract generation an existing project last adopted. */
export interface IAutoMovieContractBaseline {
  /** Exact shared-contract inventory in code-unit path order. */
  files: readonly IAutoMovieContractBaselineFile[];
  /** Creation-selected production contract language. */
  language: AutoMovieProductionLanguage;
  /** Portable record protocol. */
  protocol: "automovie.contract-baseline.v1";
  /** Installed scaffold contract generation. */
  version: string;
}

/** One exact byte mutation admitted by a migration plan. */
export type AutoMovieContractMigrationAction =
  | { action: "add"; after: string; path: string }
  | {
      action: "rename";
      beforeSha256: string;
      from: string;
      path: string;
    }
  | {
      action: "write";
      after: string;
      beforeSha256: string;
      path: string;
    };

/** One migration condition that requires explicit author adjudication. */
export interface IAutoMovieContractMigrationConflict {
  /** Closed conflict class used by an explicit adjudication flow. */
  kind:
    | "local-modification"
    | "missing-source"
    | "removed-anchor"
    | "removed-contract"
    | "rename-ambiguity"
    | "target-collision";
  /** Project-relative contract path at which the conflict was observed. */
  path: string;
  /** Human-readable reason that names the unresolved state. */
  reason: string;
}

/** SHA-256 identities of the three populations one plan was decided from. */
export interface IAutoMovieContractMigrationPlanInputs {
  /** Identity of the sorted path-to-digest population the planner inspected. */
  current: string;
  /** Identity of the canonical predecessor baseline. */
  from: string;
  /** Identity of the canonical successor baseline. */
  to: string;
}

/** One closed migration decision reused by dry-run and apply. */
export interface IAutoMovieContractMigrationPlan {
  /** Exact ordered mutations admitted by the planner. */
  actions: readonly AutoMovieContractMigrationAction[];
  /** Exact ordered conditions that prevent automatic apply. */
  conflicts: readonly IAutoMovieContractMigrationConflict[];
  /** Recorded scaffold contract generation being migrated. */
  fromVersion: string;
  /**
   * Identities of the predecessor, successor, and current populations judged.
   */
  inputs: IAutoMovieContractMigrationPlanInputs;
  /** Portable migration-plan protocol. */
  protocol: "automovie.contract-migration-plan.v1";
  /** Installed scaffold contract generation selected as the target. */
  toVersion: string;
}

const compare = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

const digest = (source: string): string =>
  `sha256:${createHash("sha256").update(source, "utf8").digest("hex")}`;

const anchors = (source: string): string[] =>
  parseAutoMovieEvidenceMarkdownHeadings(source)
    .filter((heading) => heading.depth === 2 && heading.anchor !== undefined)
    .map((heading) => heading.anchor!);

const CONTRACT_PATH_PREFIXES = [
  "docs/discovery/",
  "docs/language/",
  "docs/naturalness/",
  "docs/obligations/",
  "docs/principles/",
  "docs/upstream/",
] as const;

const PORTABLE_RESERVED_NAME =
  /^(?:con|prn|aux|nul|com(?:[1-9\u00b9\u00b2\u00b3])|lpt(?:[1-9\u00b9\u00b2\u00b3]))(?:\.|$)/iu;
const PORTABLE_RESERVED_CHARACTER = /[<>:"|?*\u0000-\u001f]/u;

/**
 * Whether one project-relative path belongs to the portable shared-contract
 * inventory a generated project's baseline may authorize.
 */
export const isAutoMovieContractTargetPath = (value: string): boolean => {
  if (
    value.length === 0 ||
    value !== value.normalize("NFC") ||
    value.includes("\\") ||
    path.posix.isAbsolute(value) ||
    path.posix.normalize(value) !== value ||
    !value.endsWith(".md") ||
    !CONTRACT_PATH_PREFIXES.some((prefix) => value.startsWith(prefix))
  )
    return false;
  return value
    .split("/")
    .every(
      (segment) =>
        segment.length !== 0 &&
        segment !== "." &&
        segment !== ".." &&
        !segment.endsWith(".") &&
        !segment.endsWith(" ") &&
        !PORTABLE_RESERVED_CHARACTER.test(segment) &&
        !PORTABLE_RESERVED_NAME.test(segment),
    );
};

const assertContractPath = (value: unknown): string => {
  if (typeof value !== "string" || !isAutoMovieContractTargetPath(value))
    throw new Error(
      `Invalid AutoMovie contract baseline path: ${JSON.stringify(value)}.`,
    );
  return value;
};

const canonicalContractPath = (value: string): string => value.toLowerCase();

/**
 * One exact semantic version: the only spelling of a template generation that
 * is neither a range (`^1.0.0`, `1.x`, `>=1`), an alias (`latest`,
 * `workspace:*`), nor a locator (`file:`, `npm:`), and therefore the only one
 * that names exactly one published contract inventory.
 */
const EXACT_GENERATION =
  /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/u;

const assertExactGeneration = (value: unknown): string => {
  if (typeof value !== "string" || !EXACT_GENERATION.test(value))
    throw new Error(
      "AutoMovie contract baseline requires an exact generation.",
    );
  return value;
};

/**
 * Refuse a JSON text that spells one member name twice inside one object.
 * `JSON.parse` keeps the last spelling silently, so a duplicate must be found
 * on the text before the parsed value can be trusted. Names are compared after
 * escape decoding within their own object scope. The text must already have
 * passed `JSON.parse`, which is what lets every string here terminate.
 */
const assertUniqueJsonMembers = (source: string, owner: string): void => {
  const scopes: (Set<string> | null)[] = [];
  let expectName = false;
  for (let cursor = 0; cursor < source.length; cursor += 1) {
    const character = source[cursor]!;
    if (character === '"') {
      let end = cursor + 1;
      while (source[end] !== '"') end += source[end] === "\\" ? 2 : 1;
      const members = scopes[scopes.length - 1];
      if (expectName && members) {
        const name = JSON.parse(source.slice(cursor, end + 1)) as string;
        if (members.has(name))
          throw new Error(
            `${owner} repeats member ${JSON.stringify(name)} in one object.`,
          );
        members.add(name);
        expectName = false;
      }
      cursor = end;
    } else if (character === "{") {
      scopes.push(new Set());
      expectName = true;
    } else if (character === "[") {
      scopes.push(null);
      expectName = false;
    } else if (character === "}" || character === "]") {
      scopes.pop();
      expectName = false;
    } else if (character === ",")
      expectName = scopes[scopes.length - 1] !== null;
  }
};

const assertExactKeys = (
  value: Readonly<Record<string, unknown>>,
  keys: readonly string[],
  owner: string,
): void => {
  const actual = Object.keys(value).sort(compare);
  const expected = [...keys].sort(compare);
  if (
    actual.length !== expected.length ||
    actual.some((key, index) => key !== expected[index])
  )
    throw new Error(`${owner} has an unsupported field set.`);
};

const freeze = <T>(value: T): T => {
  if (value !== null && typeof value === "object") {
    for (const member of Object.values(value as Record<string, unknown>))
      freeze(member);
    Object.freeze(value);
  }
  return value;
};

const baselineMap = (
  baseline: IAutoMovieContractBaseline,
): Map<string, IAutoMovieContractBaselineFile> => {
  validateContractBaseline(baseline);
  return new Map(baseline.files.map((file) => [file.path, file]));
};

const canonicalBaseline = (
  baseline: IAutoMovieContractBaseline,
): IAutoMovieContractBaseline => {
  validateContractBaseline(baseline);
  return {
    files: baseline.files.map((file) => ({
      anchors: [...file.anchors],
      path: file.path,
      sha256: file.sha256,
    })),
    language: baseline.language,
    protocol: baseline.protocol,
    version: baseline.version,
  };
};

const baselineIdentity = (baseline: IAutoMovieContractBaseline): string =>
  digest(JSON.stringify(canonicalBaseline(baseline)));

/**
 * Identity of one path-to-bytes population, refused at the input stage when a
 * path escapes the contract inventory or two lexical spellings would occupy
 * one portable target.
 */
const populationIdentity = (
  population: Readonly<Record<string, string>>,
): string => {
  const canonical = new Set<string>();
  return digest(
    JSON.stringify(
      Object.keys(population)
        .sort(compare)
        .map((relative) => {
          assertContractPath(relative);
          const key = canonicalContractPath(relative);
          if (canonical.has(key))
            throw new Error(
              `Contract population repeats portable path ${JSON.stringify(relative)}.`,
            );
          canonical.add(key);
          return { path: relative, sha256: digest(population[relative]!) };
        }),
    ),
  );
};

const validateContractBaseline = (
  baseline: IAutoMovieContractBaseline,
): void => {
  if (baseline === null || typeof baseline !== "object")
    throw new Error("AutoMovie contract baseline must be an object.");
  assertExactKeys(
    baseline as unknown as Record<string, unknown>,
    ["files", "language", "protocol", "version"],
    "AutoMovie contract baseline",
  );
  if (baseline.protocol !== "automovie.contract-baseline.v1")
    throw new Error("Unsupported AutoMovie contract baseline protocol.");
  if (!isAutoMovieProductionLanguage(baseline.language))
    throw new Error("AutoMovie contract baseline has an invalid language.");
  assertExactGeneration(baseline.version);
  if (!Array.isArray(baseline.files))
    throw new Error("AutoMovie contract baseline files must be an array.");
  const canonical = new Set<string>();
  let previousPath: string | undefined;
  for (const candidate of baseline.files as readonly unknown[]) {
    if (candidate === null || typeof candidate !== "object")
      throw new Error("AutoMovie contract baseline file must be an object.");
    const file = candidate as Record<string, unknown>;
    assertExactKeys(
      file,
      ["anchors", "path", "sha256"],
      "Contract baseline file",
    );
    const relative = assertContractPath(file.path);
    if (previousPath !== undefined && compare(previousPath, relative) >= 0)
      throw new Error(
        "Contract baseline files are not in canonical path order.",
      );
    previousPath = relative;
    const key = canonicalContractPath(relative);
    if (canonical.has(key))
      throw new Error(
        `Contract baseline repeats portable path ${JSON.stringify(relative)}.`,
      );
    canonical.add(key);
    if (
      typeof file.sha256 !== "string" ||
      !/^sha256:[0-9a-f]{64}$/u.test(file.sha256)
    )
      throw new Error(
        `Contract baseline has an invalid digest for ${relative}.`,
      );
    if (
      !Array.isArray(file.anchors) ||
      file.anchors.some(
        (anchor) =>
          typeof anchor !== "string" ||
          anchor.length === 0 ||
          /[{}\s]/u.test(anchor),
      ) ||
      new Set(file.anchors).size !== file.anchors.length
    )
      throw new Error(`Contract baseline has invalid anchors for ${relative}.`);
  }
};

/**
 * Parse and validate one persisted contract baseline before any path in it is
 * used for project I/O.
 */
export const parseAutoMovieContractBaseline = (
  source: string,
): IAutoMovieContractBaseline => {
  const baseline = JSON.parse(source) as IAutoMovieContractBaseline;
  assertUniqueJsonMembers(source, "AutoMovie contract baseline");
  validateContractBaseline(baseline);
  return freeze({
    files: baseline.files.map((file) => ({
      anchors: [...file.anchors],
      path: file.path,
      sha256: file.sha256,
    })),
    language: baseline.language,
    protocol: baseline.protocol,
    version: baseline.version,
  });
};

/** Build the portable baseline receipt from exact target bytes. */
export const createAutoMovieContractBaseline = (props: {
  files: Readonly<Record<string, string>>;
  language: IAutoMovieContractBaseline["language"];
  version: string;
}): IAutoMovieContractBaseline => {
  assertExactGeneration(props.version);
  if (!isAutoMovieProductionLanguage(props.language))
    throw new Error("AutoMovie contract baseline has an invalid language.");
  const files = Object.keys(props.files);
  for (const relative of files) assertContractPath(relative);
  const canonical = new Set(files.map(canonicalContractPath));
  if (canonical.size !== files.length)
    throw new Error(
      "Contract baseline source paths contain a portable collision.",
    );
  const baseline: IAutoMovieContractBaseline = {
    files: files.sort(compare).map((relative) => ({
      anchors: anchors(props.files[relative]!),
      path: relative,
      sha256: digest(props.files[relative]!),
    })),
    language: props.language,
    protocol: "automovie.contract-baseline.v1" as const,
    version: props.version,
  };
  validateContractBaseline(baseline);
  return freeze(baseline);
};

/**
 * Compare immutable from/to inventories with current project bytes.
 *
 * Exact baseline bytes may be replaced. Authored divergence, anchor removal,
 * ambiguous rename identity, and occupied targets remain explicit conflicts.
 */
export const planAutoMovieContractMigration = (props: {
  current: Readonly<Record<string, string>>;
  from: IAutoMovieContractBaseline;
  targetSources: Readonly<Record<string, string>>;
  to: IAutoMovieContractBaseline;
}): IAutoMovieContractMigrationPlan => {
  const from = baselineMap(props.from);
  const to = baselineMap(props.to);
  if (props.from.language !== props.to.language)
    throw new Error("Contract migration cannot change production language.");
  const inputs: IAutoMovieContractMigrationPlanInputs = {
    current: populationIdentity(props.current),
    from: baselineIdentity(props.from),
    to: baselineIdentity(props.to),
  };
  if (props.from.version === props.to.version && inputs.from !== inputs.to)
    throw new Error(
      "One contract generation cannot identify different baseline inventories.",
    );
  const targetPaths = Object.keys(props.targetSources);
  for (const relative of targetPaths) assertContractPath(relative);
  if (
    targetPaths.length !== to.size ||
    targetPaths.some((relative) => !to.has(relative))
  )
    throw new Error("Target source inventory does not match its baseline.");
  for (const target of to.values()) {
    const targetSource = props.targetSources[target.path]!;
    if (
      digest(targetSource) !== target.sha256 ||
      JSON.stringify(anchors(targetSource)) !== JSON.stringify(target.anchors)
    )
      throw new Error(
        `Target source does not match baseline for ${target.path}.`,
      );
  }

  const actions: AutoMovieContractMigrationAction[] = [];
  const conflicts: IAutoMovieContractMigrationConflict[] = [];
  const removed = [...from.values()].filter((file) => !to.has(file.path));
  const added = [...to.values()].filter((file) => !from.has(file.path));
  const renamedFrom = new Set<string>();
  const renamedTo = new Set<string>();
  for (const source of removed) {
    const candidates = added.filter(
      (target) => target.sha256 === source.sha256,
    );
    const reverse = candidates[0]
      ? removed.filter(
          (candidate) => candidate.sha256 === candidates[0]!.sha256,
        )
      : [];
    if (candidates.length > 1 || reverse.length > 1) {
      conflicts.push({
        kind: "rename-ambiguity",
        path: source.path,
        reason: `Contract ${source.path} has ${candidates.length} target paths with the same identity.`,
      });
      renamedFrom.add(source.path);
      for (const target of candidates) renamedTo.add(target.path);
      continue;
    }
    const target = candidates[0];
    if (target === undefined) continue;
    renamedFrom.add(source.path);
    renamedTo.add(target.path);
    const current = props.current[source.path];
    const occupied = props.current[target.path];
    if (current === undefined) {
      if (occupied === undefined || digest(occupied) !== target.sha256)
        conflicts.push({
          kind: "missing-source",
          path: source.path,
          reason: `Rename source ${source.path} is missing.`,
        });
    } else if (digest(current) !== source.sha256)
      conflicts.push({
        kind: "local-modification",
        path: source.path,
        reason: `Rename source ${source.path} differs from its recorded baseline.`,
      });
    else if (occupied === undefined || digest(occupied) === target.sha256)
      actions.push({
        action: "rename",
        beforeSha256: source.sha256,
        from: source.path,
        path: target.path,
      });
    else
      conflicts.push({
        kind: "target-collision",
        path: target.path,
        reason: `Rename target ${target.path} already exists.`,
      });
  }

  for (const path of [...new Set([...from.keys(), ...to.keys()])].sort(
    compare,
  )) {
    if (renamedFrom.has(path) || renamedTo.has(path)) continue;
    const source = from.get(path);
    const current = props.current[path];
    if (source === undefined) {
      const target = to.get(path)!;
      if (current === undefined)
        actions.push({
          action: "add",
          after: props.targetSources[path]!,
          path,
        });
      else if (digest(current) !== target.sha256)
        conflicts.push({
          kind: "target-collision",
          path,
          reason: `New contract target ${path} is already occupied by different bytes.`,
        });
      continue;
    }
    const target = to.get(path);
    if (target === undefined) {
      if (current === undefined) continue;
      if (digest(current) !== source.sha256)
        conflicts.push({
          kind: "local-modification",
          path,
          reason: `Removed contract ${path} contains authored changes.`,
        });
      else
        conflicts.push({
          kind: "removed-contract",
          path,
          reason: `Contract ${path} was removed and requires explicit adjudication.`,
        });
      continue;
    }
    if (current === undefined) {
      conflicts.push({
        kind: "missing-source",
        path,
        reason: `Tracked contract ${path} is missing.`,
      });
      continue;
    }
    const currentDigest = digest(current);
    if (currentDigest === target.sha256) continue;
    if (currentDigest !== source.sha256) {
      conflicts.push({
        kind: "local-modification",
        path,
        reason: `Contract ${path} differs from its recorded baseline.`,
      });
      continue;
    }
    const missingAnchors = source.anchors.filter(
      (anchor) => !target.anchors.includes(anchor),
    );
    if (missingAnchors.length !== 0)
      conflicts.push({
        kind: "removed-anchor",
        path,
        reason: `Contract ${path} removes anchors: ${missingAnchors.join(", ")}.`,
      });
    else
      actions.push({
        action: "write",
        after: props.targetSources[path]!,
        beforeSha256: source.sha256,
        path,
      });
  }
  return freeze({
    actions: actions.sort((left, right) => compare(left.path, right.path)),
    conflicts: conflicts.sort((left, right) => compare(left.path, right.path)),
    fromVersion: props.from.version,
    inputs,
    protocol: "automovie.contract-migration-plan.v1" as const,
    toVersion: props.to.version,
  });
};

const assertPlannedPopulation = (
  plan: IAutoMovieContractMigrationPlan,
  population: Readonly<Record<string, string>>,
): void => {
  if (populationIdentity(population) !== plan.inputs.current)
    throw new Error(
      "Contract migration input population changed after planning.",
    );
};

/**
 * Apply one already-decided plan to the exact current byte map.
 *
 * The plan's recorded input identity binds its actions to the population the
 * planner judged, so once the byte map proves current the frozen actions are
 * consistent with it by construction and are executed without re-judgement.
 */
export const applyAutoMovieContractMigrationPlan = (
  plan: IAutoMovieContractMigrationPlan,
  current: Readonly<Record<string, string>>,
): Record<string, string> => {
  if (plan.conflicts.length !== 0)
    throw new Error(
      "A contract migration plan with conflicts cannot be applied.",
    );
  assertPlannedPopulation(plan, current);
  const output = { ...current };
  for (const action of plan.actions) {
    if (action.action === "rename") {
      output[action.path] = output[action.from]!;
      delete output[action.from];
    } else output[action.path] = action.after;
  }
  return output;
};

/** One source path retired only after its target bytes are published. */
export interface IAutoMovieContractMigrationRemoval {
  /** Exact bytes that must occupy the published rename target. */
  after: string;
  /** Exact bytes that must still occupy the source path before retirement. */
  before: string;
  /** Validated project-relative source path. */
  path: string;
  /** Validated project-relative target path. */
  target: string;
}

/** Closed file mutations derived from a still-current migration plan. */
export interface IAutoMovieContractMigrationPublication {
  /** New target slots that must retain exclusive no-overwrite semantics. */
  creations: Readonly<Record<string, string>>;
  /** Rename sources retired after every target write completes. */
  removals: readonly IAutoMovieContractMigrationRemoval[];
  /** Existing exact source slots explicitly admitted for replacement. */
  replacements: Readonly<Record<string, string>>;
}

/**
 * Revalidate a migration plan against a new observation and close its complete
 * target candidate before a caller performs filesystem mutation.
 */
export const planAutoMovieContractMigrationPublication = (props: {
  current: Readonly<Record<string, string>>;
  observed: Readonly<Record<string, string>>;
  plan: IAutoMovieContractMigrationPlan;
}): IAutoMovieContractMigrationPublication => {
  assertPlannedPopulation(props.plan, props.current);
  const migrated = applyAutoMovieContractMigrationPlan(
    props.plan,
    props.observed,
  );
  const creations = Object.create(null) as Record<string, string>;
  const replacements = Object.create(null) as Record<string, string>;
  const removals: IAutoMovieContractMigrationRemoval[] = [];
  for (const action of props.plan.actions) {
    const source = migrated[action.path]!;
    if (props.observed[action.path] !== source)
      (action.action === "write" ? replacements : creations)[action.path] =
        source;
    if (action.action === "rename")
      removals.push(
        Object.freeze({
          after: source,
          before: props.observed[action.from]!,
          path: action.from,
          target: action.path,
        }),
      );
  }
  return Object.freeze({
    creations: Object.freeze(creations),
    removals: Object.freeze(removals),
    replacements: Object.freeze(replacements),
  });
};

/**
 * One successor-target observation admitted into a durable migration receipt.
 */
export interface IAutoMovieContractMigrationActionOutcome {
  /** Planned action kind. */
  action: AutoMovieContractMigrationAction["action"];
  /** Target byte identity the plan requires at the published path. */
  afterSha256: string;
  /** Previous source byte identity, or null for a new target. */
  beforeSha256: string | null;
  /** Rename source path, or null for add and write. */
  from: string | null;
  /** Published target path. */
  path: string;
  /**
   * `published` when the observed target carries the required identity,
   * `incomplete` when no target was observed, and `failed` when different
   * bytes occupy the target.
   */
  status: "published" | "incomplete" | "failed";
}

/** One immutable project-relative migration record ready for publication. */
export interface IAutoMovieContractMigrationArtifact {
  /** Append-only project-relative publication path. */
  path: string;
  /** Canonical UTF-8 JSON source ending in one LF. */
  source: string;
}

/**
 * Durable predecessor and receipt candidate published before baseline update.
 */
export interface IAutoMovieContractMigrationReceiptArtifacts {
  /** Exact predecessor baseline preserved independently of its mutable pointer. */
  predecessor: IAutoMovieContractMigrationArtifact;
  /** Canonical target-publication receipt. */
  receipt: IAutoMovieContractMigrationArtifact;
}

const canonicalAction = (
  action: AutoMovieContractMigrationAction,
): Record<string, unknown> =>
  action.action === "add"
    ? { action: action.action, after: action.after, path: action.path }
    : action.action === "rename"
      ? {
          action: action.action,
          beforeSha256: action.beforeSha256,
          from: action.from,
          path: action.path,
        }
      : {
          action: action.action,
          after: action.after,
          beforeSha256: action.beforeSha256,
          path: action.path,
        };

/** Digest of one conflict-free plan; the receipt asserts that precondition. */
const planDigest = (plan: IAutoMovieContractMigrationPlan): string =>
  digest(
    JSON.stringify({
      actions: plan.actions.map(canonicalAction),
      fromVersion: plan.fromVersion,
      inputs: {
        current: plan.inputs.current,
        from: plan.inputs.from,
        to: plan.inputs.to,
      },
      protocol: plan.protocol,
      toVersion: plan.toVersion,
    }),
  );

const actionIdentity = (
  action: AutoMovieContractMigrationAction,
): Omit<IAutoMovieContractMigrationActionOutcome, "status"> => ({
  action: action.action,
  afterSha256:
    action.action === "rename" ? action.beforeSha256 : digest(action.after),
  beforeSha256: action.action === "add" ? null : action.beforeSha256,
  from: action.action === "rename" ? action.from : null,
  path: action.path,
});

/**
 * Classify every planned successor target from the bytes observed at its
 * path after publication.
 */
export const observeAutoMovieContractMigrationOutcomes = (props: {
  plan: IAutoMovieContractMigrationPlan;
  published: Readonly<Record<string, string>>;
}): readonly IAutoMovieContractMigrationActionOutcome[] =>
  freeze(
    props.plan.actions.map((action) => {
      const identity = actionIdentity(action);
      const published = props.published[action.path];
      return {
        ...identity,
        status:
          published === undefined
            ? ("incomplete" as const)
            : digest(published) === identity.afterSha256
              ? ("published" as const)
              : ("failed" as const),
      };
    }),
  );

/**
 * Render the append-only receipt and predecessor baseline artifacts for one
 * completely validated successor-target publication.
 *
 * The publication generation is the canonical plan digest, so an identical
 * plan reproduces the same record paths and bytes while any changed input,
 * action, or generation lands in a distinct namespace.
 */
export const createAutoMovieContractMigrationReceiptArtifacts = (props: {
  from: IAutoMovieContractBaseline;
  observed: Readonly<Record<string, string>>;
  outcomes: readonly IAutoMovieContractMigrationActionOutcome[];
  plan: IAutoMovieContractMigrationPlan;
  to: IAutoMovieContractBaseline;
}): IAutoMovieContractMigrationReceiptArtifacts => {
  baselineMap(props.from);
  baselineMap(props.to);
  if (
    props.plan.protocol !== "automovie.contract-migration-plan.v1" ||
    props.plan.conflicts.length !== 0 ||
    props.plan.fromVersion !== props.from.version ||
    props.plan.toVersion !== props.to.version ||
    props.from.language !== props.to.language
  )
    throw new Error(
      "Contract migration receipt requires one compatible conflict-free plan.",
    );
  if (
    props.plan.inputs.from !== baselineIdentity(props.from) ||
    props.plan.inputs.to !== baselineIdentity(props.to)
  )
    throw new Error(
      "Contract migration receipt baselines do not match the plan.",
    );
  assertPlannedPopulation(props.plan, props.observed);
  const outcomes = props.outcomes.map((outcome) => ({
    action: outcome.action,
    afterSha256: outcome.afterSha256,
    beforeSha256: outcome.beforeSha256,
    from: outcome.from,
    path: outcome.path,
    status: outcome.status,
  }));
  const expected = props.plan.actions.map((action) => ({
    ...actionIdentity(action),
    status: "published" as const,
  }));
  if (JSON.stringify(outcomes) !== JSON.stringify(expected))
    throw new Error(
      "Contract migration receipt outcomes do not match the completed plan.",
    );
  const generation = planDigest(props.plan).slice("sha256:".length);
  const predecessorSource = `${JSON.stringify(canonicalBaseline(props.from), null, 2)}\n`;
  const receiptSource = `${JSON.stringify(
    {
      actions: outcomes,
      from: { identity: props.plan.inputs.from, version: props.from.version },
      language: props.from.language,
      observedInputDigest: props.plan.inputs.current,
      planDigest: `sha256:${generation}`,
      protocol: "automovie.contract-migration-receipt.v1",
      publicationGeneration: generation,
      to: { identity: props.plan.inputs.to, version: props.to.version },
      validation: {
        status: "completed",
        targetBaselineIdentity: props.plan.inputs.to,
      },
      version: 1,
    },
    null,
    2,
  )}\n`;
  const root = `automovie/contract-migrations/${generation}`;
  return freeze({
    predecessor: {
      path: `${root}/${props.plan.inputs.from.slice("sha256:".length)}.baseline.json`,
      source: predecessorSource,
    },
    receipt: {
      path: `${root}/${digest(receiptSource).slice("sha256:".length)}.receipt.json`,
      source: receiptSource,
    },
  });
};
