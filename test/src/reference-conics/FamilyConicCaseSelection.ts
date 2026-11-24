import { FamilyConicCaseIdentity as Identity } from "./FamilyConicCaseIdentity";

/** Pure case admission shared by figure and deviation capture inputs. */
export namespace FamilyConicCaseSelection {
  /** A selector borrows the case data verbatim from its producer. */
  export interface ICaseRecord {
    /** The producer's stable case identifier. */
    id: string;
    /** Original field data passed to generation. */
    fields: object;
    /** Status supplied by the field producer. */
    resolution: { status: string };
  }

  /**
   * Serialized producer handoff; the production case type remains authoritative.
   *
   * @evidence contracts/development/design.md#principled-representation A schema, complete source fingerprint and immutable case list retain producer provenance without a second anatomy model.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The generic header permits small input-only tests; actual readers use the case producer record.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Fields and numerical resolution are never rebuilt or inferred by this transport declaration.
   * @evidence contracts/development/common.md#meaningful-documentation Names producer provenance and the authoritative production case type.
   */
  export interface IArtifact<
    T extends { id: string; resolution: { status: string } } = ICaseRecord,
  > {
    /** Exact serialized handoff version. */
    schema: string;
    /** Repository-relative forward-slash source paths and SHA-256 hex digests. */
    sourceHashes: Readonly<Record<string, string>>;
    /** Borrowed producer records; unresolved entries remain evidence. */
    cases: readonly T[];
    /** The round's bundle set as recorded at build: bundle file name to SHA-256 hex digest. A capture stage binds to it. */
    bundles?: Readonly<Record<string, string>>;
  }

  /**
   * One executed bundle: its file name and the digest of its bytes.
   *
   * @evidence contracts/development/design.md#principled-representation A stage's identity is the bytes it runs from, named as the round's record names them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Both members are compared by the bundle gate.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No path, time or source text stands in for the executed bytes.
   * @evidence contracts/development/common.md#meaningful-documentation Names the base file name and the lowercase or uppercase hex digest.
   */
  export interface IBundle {
    /** Base file name of the executed bundle, such as `FamilyConicBody.cjs`. */
    name: string;
    /** SHA-256 hex digest of the executed bundle's bytes. */
    sha256: string;
  }

  /**
   * Admit a stage only when it runs from the bundle its round recorded at build.
   *
   * Every stage of a round runs from an esbuild bundle, a frozen snapshot of the sources, so the identity that binds
   * the stages is the bundle set and not the working tree: a source saved after the build changes no stage, while a
   * stage from another build is another program. The source digests taken at build stay in the round's records for
   * traceability and are not read again here.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Compares the executed bundle's digest with the round's recorded digest under the same file name.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Record admission, then one named lookup and one comparison.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An absent or malformed record, an unrecorded stage and a differing digest each refuse by the stage's name; nothing falls back to the working tree.
   * @evidence contracts/development/common.md#meaningful-documentation States why the bundle and not the live sources is the stage's identity.
   * @evidence contracts/development/implementation.md#efficient-algorithms One pass over the bounded bundle record.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure comparison coordinates no prepared work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Inputs remain borrowed; nothing is retained.
   */
  export function bundle(
    recorded: Readonly<Record<string, string>> | undefined,
    running: IBundle,
  ): void {
    if (recorded === undefined || recorded === null || typeof recorded !== "object" || Array.isArray(recorded) ||
      Object.keys(recorded).length === 0)
      throw new Error("Round bundle record is absent; stage " + running.name + " cannot be bound to its round");
    for (const [name, digest] of Object.entries(recorded))
      if (name.includes("/") || name.includes("\\") || typeof digest !== "string" || !/^[a-f0-9]{64}$/i.test(digest))
        throw new Error("Invalid round bundle record: " + name);
    const expected: string | undefined = recorded[running.name];
    if (expected === undefined)
      throw new Error("Stage bundle is not of this round: " + running.name);
    if (!/^[a-f0-9]{64}$/i.test(running.sha256) || expected.toLowerCase() !== running.sha256.toLowerCase())
      throw new Error("Stage bundle differs from the one its round was built with: " + running.name);
  }

  /**
   * Admit the producer's nonempty source scope before reading any file.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Requires canonical relative path components and complete SHA-256 values, preventing aliases and absent provenance.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One path/digest pass returns the declared keys without changing the record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Empty, absolute, escaping and malformed fingerprints are refused rather than treated as a matching empty scope.
   * @evidence contracts/development/common.md#meaningful-documentation Keys are repository-relative forward-slash paths; returned keys describe the actual declared scope.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear path/digest work and one key array are proportional to the declared source scope.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Pure admission coordinates no prepared work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned key array belongs to the caller; no filesystem handle, input mutation or cache is retained.
   */
  export function sourcePaths(
    record: Readonly<Record<string, string>>,
  ): string[] {
    if (record === null || typeof record !== "object" || Array.isArray(record))
      throw new Error("Capture source fingerprint is absent");
    const keys: string[] = Object.keys(record);
    if (keys.length === 0)
      throw new Error("Capture source fingerprint is empty");
    for (const key of keys) {
      const pieces: string[] = key.split("/");
      const digest: unknown = record[key];
      if (
        key.includes("\\") ||
        key.includes(":") ||
        pieces.some(
          (piece: string): boolean =>
            piece === "" || piece === "." || piece === "..",
        ) ||
        typeof digest !== "string" ||
        !/^[a-f0-9]{64}$/i.test(digest)
      )
        throw new Error("Invalid capture source fingerprint: " + key);
    }
    return keys;
  }

  /** Compare both complete declared source scopes without retaining or normalizing them. */
  function sources(
    provided: Readonly<Record<string, string>>,
    current: Readonly<Record<string, string>>,
  ): void {
    const supplied: string[] = sourcePaths(provided);
    const actual: string[] = sourcePaths(current);
    if (
      supplied.length !== actual.length ||
      supplied.some(
        (key: string): boolean =>
          current[key] === undefined ||
          current[key]!.toLowerCase() !== provided[key]!.toLowerCase(),
      )
    )
      throw new Error("Capture source fingerprint mismatch");
  }

  /**
   * Match a selected case to its actual per-case preflight report before generation.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Case id, declared field digest, actual field content and complete source scope must all identify this same selected input.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Report shape and id admission precede shared field digest and source-scope checks.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A round aggregate or failure-only report cannot replace a per-case field/source identity; this function grants no shape approval.
   * @evidence contracts/development/common.md#meaningful-documentation The report is producer evidence, not a second approval token or a geometry law.
   * @evidence contracts/development/implementation.md#efficient-algorithms Bounded metadata serialization and linear source-scope comparison introduce no person or mesh work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Producer and consumer use the same canonical identity owner and source-scope admission.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Inputs remain borrowed and unmodified; local serialized data and indexes die on return.
   */
  export function preflight(
    report: {
      id: string;
      fields: unknown;
      fieldsHash: string;
      sourceHashes: Readonly<Record<string, string>>;
    },
    selected: { id: string; fields: unknown },
    currentHashes: Readonly<Record<string, string>>,
  ): void {
    if (
      report === null ||
      typeof report !== "object" ||
      report.id !== selected.id ||
      typeof report.fieldsHash !== "string" ||
      !/^[a-f0-9]{64}$/i.test(report.fieldsHash)
    )
      throw new Error("Capture needs the matching per-case preflight report");
    const expected: string = Identity.dataHash(selected.fields);
    if (
      report.fieldsHash.toLowerCase() !== expected ||
      Identity.dataHash(report.fields) !== expected
    )
      throw new Error("Capture preflight field identity mismatch");
    sources(report.sourceHashes, currentHashes);
  }
  /**
   * Return exactly one resolved case after matching the complete source scope.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Exact ids, resolved input status and equal complete source fingerprints admit the same producer object; fields are never solved or copied.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Schema and provenance admission precede one unique-id pass and the requested-status check.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Missing, duplicate and unresolved cases never fall back to another case; a partial fingerprint cannot certify the artifact.
   * @evidence contracts/development/common.md#meaningful-documentation Resolution concerns inputs, not source geometry or visual acceptance.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear work in case count and source-scope text uses one local id set and key arrays.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work One pure selection coordinates no solver, renderer or prepared resource.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a borrowed immutable case; local indexes die on return and no process or cache is retained.
   */
  export function select<
    T extends { id: string; resolution: { status: string } },
  >(
    artifact: IArtifact<T>,
    id: string,
    currentHashes: Readonly<Record<string, string>>,
  ): T {
    if (artifact.schema !== "human-native-cases/v1")
      throw new Error("Unsupported capture case schema");
    sources(artifact.sourceHashes, currentHashes);
    if (
      typeof id !== "string" ||
      id.length === 0 ||
      id.trim() !== id ||
      !Array.isArray(artifact.cases)
    )
      throw new Error("Capture needs an explicit case id and case list");
    const seen: Set<string> = new Set();
    let selected: T | undefined;
    for (const entry of artifact.cases) {
      if (
        entry === null ||
        typeof entry !== "object" ||
        typeof entry.id !== "string" ||
        entry.id.length === 0 ||
        seen.has(entry.id)
      )
        throw new Error("Invalid or duplicate capture case id");
      seen.add(entry.id);
      if (entry.id === id) selected = entry;
    }
    if (selected === undefined)
      throw new Error("Capture case is missing: " + id);
    if (
      selected.resolution === null ||
      typeof selected.resolution !== "object" ||
      selected.resolution.status !== "resolved"
    )
      throw new Error("Capture case is not resolved: " + id);
    return selected;
  }
}
