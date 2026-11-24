import { FamilyConicCaseIdentity as Identity } from "./FamilyConicCaseIdentity";
import { FamilyConicCaseSelection as Selection } from "./FamilyConicCaseSelection";
import fs from "node:fs/promises";
import path from "node:path";

/** Read the immutable production case handoff without a converter or geometry solve. */
export namespace FamilyConicCaptureInput {
  /**
   * An exact read-only file identity.
   *
   * @evidence contracts/development/design.md#principled-representation An absolute path and exact SHA-256 identify one read-only artifact; readers validate actual bytes.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Capture inputs, producers and receipts share this single file identity.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No field/source identity or acceptance is inferred from a filename.
   * @evidence contracts/development/common.md#meaningful-documentation Members document absolute path and exact byte digest.
   */
  export interface IFile {
    /** Absolute file path. */
    file: string;
    /** SHA-256 of its exact bytes. */
    sha256: string;
  }
  /**
   * Exact capture-code/bundle provenance, separate from the generation artifact's source scope.
   *
   * @evidence contracts/development/design.md#principled-representation Actual capture source files and the executed bundle have separate exact byte identities.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Source-only and full capture share this producer record; generation fingerprints remain owned by the case producer.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Source text is not relabeled as executed bundle provenance.
   * @evidence contracts/development/common.md#meaningful-documentation Members distinguish tracked source identities from executed bytes.
   */
  export interface IProducer {
    /** Actual tracked capture/runtime helper file bytes checked on disk. */
    files: IFile[];

    /** Actual executed Node artifact bytes; source text and bundle identity remain separate. */
    bundle: IFile;
  }

  /**
   * Read the caller's source producers and the actual executed artifact once.
   *
   * @evidence contracts/development/implementation.md#principled-implementation SHA-256 identities are read for actual capture/runtime source files and process.argv bundle bytes.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Sequential source reads precede executed artifact hashing.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Generation identity is kept separate and no hypothetical bundle or geometry result is substituted.
   * @evidence contracts/development/implementation.md#efficient-algorithms Byte-linear hashing over the bounded helper list and bundle retains only digests.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both source-only and full capture use this same producer boundary.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Awaited readFile closes handles; byte buffers leave scope and no cache remains.
   * @evidence contracts/development/common.md#meaningful-documentation The comment names actual runtime producer files and executed bundle identity.
   */
  export async function producer(sourceFiles: readonly string[]): Promise<IProducer> {
    const files: IFile[] = [];
    for (const source of sourceFiles) {
      const file: string = path.resolve(source);
      files.push({ file, sha256: hash(await fs.readFile(file)) });
    }
    const entry: string | undefined = process.argv[1];
    if (entry === undefined)
      throw new Error("Capture has no actual executed bundle path");
    const file: string = path.resolve(entry);
    return { files, bundle: { file, sha256: hash(await fs.readFile(file)) } };
  }
  /**
   * One admitted production case and the source scope actually checked on disk.
   *
   * @evidence contracts/development/design.md#principled-representation One imported production IResolvedCase accompanies actual source, artifact and preflight identities and diagnostic bare names.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Both capture consumers borrow this admitted record; Human owns the field and resolution types.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Runtime readers enforce completeness and resolved status; this declaration grants no shape approval.
   * @evidence contracts/development/common.md#meaningful-documentation Members state checked provenance, field digest, source scope and explicit diagnostic relief selection.
   */
  export interface IInput {
    /** Absolute repository root. */
    root: string;
    /** Exact producer record; resolution is not shape acceptance. */
    selected: Selection.ICaseRecord;
    /** Artifact bytes and canonical selected-field identity. */
    artifact: IFile;
    /** Exact canonical field JSON hash, without rounding numbers. */
    fieldsHash: string;
    /** Actual current digests over the producer's declared complete source scope. */
    sourceHashes: Readonly<Record<string, string>>;
    /** Evidence identity only; this is not a second approval framework. */
    preflight: IFile;
    /** Explicit diagnostic factory scope, independent of full-source acceptance. */
    bare: readonly string[];
  }

  /**
   * Exact file-byte identity, delegated to the same recipe as the producer.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The alias delegates exact UTF-8 or Buffer SHA-256 to Identity.byteHash.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One imported callable owns the recipe.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No byte normalization or rounding is added.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is byte-linear in the delegated input.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work MainRound and capture share Identity rather than maintaining another hash.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the digest escapes; the alias retains no input.
   * @evidence contracts/development/common.md#meaningful-documentation The comment names exact-byte delegation.
   */
  export const hash: typeof Identity.byteHash = Identity.byteHash;

  /**
   * Canonical metadata identity, delegated to the same recipe as the producer.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The alias delegates finite canonical JSON with ordinal keys to Identity.dataHash.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One imported callable owns the metadata recipe.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No field conversion, tolerance or alternative canonicalization is added.
   * @evidence contracts/development/implementation.md#efficient-algorithms The delegated serialization cost is proportional to data with per-object key sorting.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work MainRound and capture share the same canonical identity.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the digest escapes; the alias retains no metadata.
   * @evidence contracts/development/common.md#meaningful-documentation The comment names shared canonical identity.
   */
  export const dataHash: typeof Identity.dataHash = Identity.dataHash;
  /** Read one unambiguous explicit CLI value; no incomplete native flag falls back. */
  function option(args: readonly string[], key: string): string | undefined {
    const found: string[] = args.filter(
      (arg: string): boolean => arg === key || arg.startsWith(key + "="),
    );
    if (found.length === 0) return undefined;
    if (
      found.length !== 1 ||
      found[0] === key ||
      found[0]!.slice(key.length + 1).length === 0
    )
      throw new Error(key + " requires one explicit value");
    return found[0]!.slice(key.length + 1);
  }

  /** Resolve the actual file without leaving its declared root, including junctions. */
  async function inside(root: string, filename: string): Promise<string> {
    const [base, file]: [string, string] = await Promise.all([
      fs.realpath(root),
      fs.realpath(filename),
    ]);
    const relative: string = path.relative(base, file);
    if (
      relative === ".." ||
      relative.startsWith(".." + path.sep) ||
      path.isAbsolute(relative)
    )
      throw new Error("Capture input leaves its declared root: " + filename);
    return file;
  }

  /**
   * Admit a production artifact and explicit case before any geometry is generated.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Reads exact artifact/source bytes and selects the unchanged production case against the full verified fingerprint before its consumer runs.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Explicit native options precede artifact, source-scope and resolved-case admission; absent native options alone retain legacy mode.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No converter, ratio application, private reference, fallback case or numerical geometry enters this reader; missing files and unresolved cases fail.
   * @evidence contracts/development/common.md#meaningful-documentation Absolute identities, diagnostic bare scope and resolved-input versus shape-acceptance roles remain separate.
   * @evidence contracts/development/implementation.md#efficient-algorithms One read per declared source and artifact uses byte-linear hashing; case admission retains its bounded linear indexes.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both capture consumers borrow the same returned case, fields and provenance rather than parsing or solving again.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources ReadFile closes its handles; returned data owns only the selected record and bounded identity/scope metadata, with no process or cache.
   */
  export async function read(
    root: string,
    args: readonly string[],
  ): Promise<IInput | null> {
    const artifactArgument: string | undefined = option(args, "--cases");
    const id: string | undefined = option(args, "--case");
    const preflightArgument: string | undefined = option(args, "--preflight");
    if (
      artifactArgument === undefined &&
      id === undefined &&
      preflightArgument === undefined
    )
      return null;
    if (
      artifactArgument === undefined ||
      id === undefined ||
      preflightArgument === undefined
    )
      throw new Error(
        "Native capture requires --cases, --case and --preflight",
      );
    const repository: string = path.resolve(root);
    const evidence: string = path.join(repository, "packages/human/.shots");
    const artifactFile: string = await inside(
      evidence,
      path.resolve(repository, artifactArgument),
    );
    const bytes: Buffer = await fs.readFile(artifactFile);
    const artifact: Selection.IArtifact = JSON.parse(bytes.toString("utf8"));

    // This stage runs from a bundle, a frozen snapshot of the sources, so it is bound to its round by that
    // bundle's digest against the set the round recorded at build. The working tree is not read: a source saved
    // after the build changes no stage. The source digests recorded at build travel on into the receipt.
    const executed: string | undefined = process.argv[1];
    if (executed === undefined)
      throw new Error("Capture has no actual executed bundle path");
    Selection.bundle(artifact.bundles, {
      name: path.basename(executed),
      sha256: hash(await fs.readFile(executed)),
    });
    Selection.sourcePaths(artifact.sourceHashes);
    const current: Record<string, string> = { ...artifact.sourceHashes };
    const selected: Selection.ICaseRecord =
      Selection.select(artifact, id, current);
    if (
      selected.fields === null ||
      typeof selected.fields !== "object" ||
      Array.isArray(selected.fields)
    )
      throw new Error("Capture case has no production fields: " + id);
    const preflightFile: string = await inside(
      evidence,
      path.resolve(repository, preflightArgument),
    );
    const preflightBytes: Buffer = await fs.readFile(preflightFile);
    const report: Parameters<typeof Selection.preflight>[0] = JSON.parse(
      preflightBytes.toString("utf8"),
    );
    Selection.preflight(report, selected, current);
    const bareArgument: string | undefined = option(args, "--bare");
    const bare: string[] = [
      ...new Set(
        (bareArgument ?? "")
          .split(",")
          .filter((name: string): boolean => name.length > 0),
      ),
    ];
    return {
      root: repository,
      selected,
      artifact: { file: artifactFile, sha256: hash(bytes) },
      fieldsHash: dataHash(selected.fields),
      sourceHashes: current,
      preflight: { file: preflightFile, sha256: hash(preflightBytes) },
      bare,
    };
  }
}
