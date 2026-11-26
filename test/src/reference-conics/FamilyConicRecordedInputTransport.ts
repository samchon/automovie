import fs from "node:fs/promises";
import path from "node:path";

import { FamilyConicCaptureFileIO as FileIO } from "./FamilyConicCaptureFileIO";
import type { FamilyConicCaptureInput as Input } from "./FamilyConicCaptureInput";
import { FamilyConicCaptureTransport as Transport } from "./FamilyConicCaptureTransport";
import type { FamilyConicCaptureTransportFiles as Files } from "./FamilyConicCaptureTransportFiles";
import { FamilyConicCaseIdentity as Identity } from "./FamilyConicCaseIdentity";
import { FamilyConicCaseSelection as Selection } from "./FamilyConicCaseSelection";

/** Existing historical recorded-input bridge validation and exclusive transport export. */
export namespace FamilyConicRecordedInputTransport {
  /** Borrow the shared exact-byte file reference declaration. */
  type IReference = FileIO.IReference;
  /** Share the unchanged containment implementation. */
  const inside: typeof FileIO.inside = FileIO.inside;
  /** Share the unchanged checked byte reader. */
  const checked: typeof FileIO.checked = FileIO.checked;
  /** Original and separately identified diagnostic generation provenance. */
  interface IProvenance {
    original: {
      catalog: IReference;
      round: IReference;
      sourceHashes: Record<string, string>;
    };
    diagnostic: {
      sourceHashes: Record<string, string>;
      changed: Transport.IBridge["changed"];
      observationDiff: IReference;
      producer: IReference;
      walker: IReference;
      bundle: IReference;
    };
  }
  /** Completed aggregate; its cases are an index, never a replacement per-case report. */
  interface IRound {
    schema: string;
    provenance: IProvenance;
    cases: {
      id: string;
      fieldsHash?: string;
      unchangedObservedOutcomes?: boolean;
    }[];
  }
  /** Actual observation receipt; point arrays are held for one case only. */
  interface ICase {
    schema: string;
    id: string;
    fields: unknown;
    fieldsHash: string;
    originalCase: IReference;
    provenance: IProvenance;
    unchangedObservedOutcomes: boolean;
    actualBands: unknown[];
    actualSeams: unknown[];
  }
  /** Explicit source-only packet preserves the actual old and observation byte links. */
  interface IPacket {
    rootRound: IReference;
    rootCase: IReference;
    originalCase: IReference;
    provenance: IProvenance;
  }
  /** Validate all retained producer and original links, without rerunning their code. */
  async function provenance(root: string, value: IProvenance): Promise<void> {
    Transport.bridge({
      before: value.original.sourceHashes,
      current: value.diagnostic.sourceHashes,
      changed: value.diagnostic.changed,
    });
    for (const reference of [
      value.original.catalog,
      value.original.round,
      value.diagnostic.observationDiff,
      value.diagnostic.producer,
      value.diagnostic.walker,
      value.diagnostic.bundle,
    ])
      await checked(root, reference);
  }
  /** Compare the complete diagnostic fingerprint to actual current repository bytes. */
  async function current(
    root: string,
    hashes: Readonly<Record<string, string>>,
  ): Promise<void> {
    for (const file of Selection.sourcePaths(hashes))
      await checked(root, { file, byteHash: hashes[file]! });
  }
  /** Reuse pure admission against the actual per-case receipt, not its aggregate index. */
  function admit<T extends { id: string; fields: unknown }>(
    selected: T,
    old: Transport.IClaim,
    actual: ICase,
    value: IProvenance,
    oldBytes: Buffer,
  ): void {
    if (
      actual.schema !== "f1-native-root-inputs/v1" ||
      !Transport.same(actual.provenance, value)
    )
      throw new Error("RootInputs per-case provenance differs");
    Transport.admit(
      selected,
      old,
      {
        id: actual.id,
        fields: actual.fields,
        fieldsHash: actual.fieldsHash,
        sourceHashes: actual.provenance.diagnostic.sourceHashes,
        originalCaseByteHash: actual.originalCase.byteHash,
        unchangedObservedOutcomes: actual.unchangedObservedOutcomes,
      },
      {
        before: value.original.sourceHashes,
        current: value.diagnostic.sourceHashes,
        changed: value.diagnostic.changed,
      },
      Identity.byteHash(oldBytes),
    );
  }

  /**
   * Load the existing historical packet branch after the facade has enforced source-only scope.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Exact round, original catalog/case, actual observation and provenance bytes bind both separately identified generations before extracting recorded points.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Provenance and current fingerprint identity precede original-case admission and the unique aggregate index check.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Historical records are never promoted to live evaluation or shape approval, and no law, solver or geometry import runs.
   * @evidence contracts/development/implementation.md#efficient-algorithms Sequential referenced-file reads and one case parse cost their byte counts plus sampled point extraction; no other actual case is retained.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The facade delegates its unchanged historical branch to shared checked reads and Transport admission/submitted extraction.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Awaited reads release file handles; only one sampled layer and retained packet provenance escape.
   * @evidence contracts/development/common.md#meaningful-documentation States prior scope enforcement and the historical observation boundary.
   */
  export async function load(
    input: Input.IInput,
    report: Record<string, unknown>,
  ): Promise<Files.ILayer> {
    const packet: IPacket = report.recordedInput as IPacket;
    const round: IRound = JSON.parse(
      (await checked(input.root, packet.rootRound)).toString("utf8"),
    );
    if (
      round.schema !== "f1-native-root-input-round/v1" ||
      !Transport.same(round.provenance, packet.provenance)
    )
      throw new Error("Recorded RootInputs round provenance differs");
    await provenance(input.root, packet.provenance);
    if (
      !Transport.same(
        input.sourceHashes,
        packet.provenance.diagnostic.sourceHashes,
      )
    )
      throw new Error(
        "Recorded diagnostic source scope differs from capture input",
      );
    const catalog: Selection.IArtifact = JSON.parse(
      (await checked(input.root, packet.provenance.original.catalog)).toString(
        "utf8",
      ),
    );
    const selected: Selection.IArtifact["cases"][number] = Selection.select(
      catalog,
      input.selected.id,
      packet.provenance.original.sourceHashes,
    );
    if (!Transport.same(selected, input.selected))
      throw new Error("Transport replaced original case data");
    const oldBytes: Buffer = await checked(input.root, packet.originalCase);
    const old: Transport.IClaim = JSON.parse(oldBytes.toString("utf8"));
    const actual: ICase = JSON.parse(
      (await checked(input.root, packet.rootCase)).toString("utf8"),
    );
    if (!Transport.same(actual.originalCase, packet.originalCase))
      throw new Error("Recorded original case byte link differs");
    admit(selected, old, actual, packet.provenance, oldBytes);
    const rows: IRound["cases"] = round.cases.filter(
      (row: IRound["cases"][number]): boolean => row.id === selected.id,
    );
    if (
      rows.length !== 1 ||
      rows[0]!.fieldsHash !== actual.fieldsHash ||
      rows[0]!.unchangedObservedOutcomes !== true
    )
      throw new Error("RootInputs index does not identify this actual case");
    return {
      submitted: Transport.submitted(actual.actualBands, actual.actualSeams),
      evidence: {
        scope: "actual-submitted-operator-input",
        packet,
        qualification:
          "Separate recorded observation-only generation; samples are actual submitted inputs, not continuous world loops, current live evaluation or realized skin. Ordinary f1 retains its public original-identity path; it is not forced-native.",
      },
    };
  }

  /**
   * Export exact completed case records against the separately recorded current observation fingerprint.
   * Reads one actual case at a time; it never reapplies a law, creates geometry or publishes a forced alias.
   * The final catalog is written last, so a partial export cannot supply an admitted case catalog.
   *
   *
   * @evidence contracts/development/implementation.md#principled-implementation Completed original records are admitted against the separately recorded current fingerprint and exact observation receipts, preserving every original field.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Provenance/current checks precede sequential case reports; producer/bundle and receipt finish before final catalog publication.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No fields, resolution, geometry or solver are recomputed; unresolved entries remain unresolved and noncatalog forced ids are excluded.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two complete current fingerprint reads bracket sequential per-case byte work; retained indexes scale with catalog size rather than receipt totals.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Existing canonical identity and pure admission are reused; the producer references exact prior observations instead of rerunning them.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One actual case receipt is scoped to each loop iteration; only catalog and file identities persist, all writes are awaited with no overwrite.
   * @evidence contracts/development/common.md#meaningful-documentation The comment states historical versus current scope, one-case retention and final publication behavior.
   */
  export async function run(
    root: string,
    roundFile: string,
    output: string,
  ): Promise<void> {
    const roundPath: string = await inside(root, roundFile);
    const roundBytes: Buffer = await fs.readFile(roundPath);
    const round: IRound = JSON.parse(roundBytes.toString("utf8"));
    if (round.schema !== "f1-native-root-input-round/v1")
      throw new Error("Expected a completed RootInputs round");
    const value: IProvenance = round.provenance;
    await provenance(root, value);
    await current(root, value.diagnostic.sourceHashes);
    const catalog: Selection.IArtifact = JSON.parse(
      (await checked(root, value.original.catalog)).toString("utf8"),
    );
    const originalRound: { sourceHashes: Record<string, string> } = JSON.parse(
      (await checked(root, value.original.round)).toString("utf8"),
    );
    if (
      !Transport.same(
        originalRound.sourceHashes,
        value.original.sourceHashes,
      ) ||
      !Transport.same(catalog.sourceHashes, value.original.sourceHashes)
    )
      throw new Error("Original catalog/round fingerprints differ");
    const base: string = await fs.realpath(
      path.join(root, "packages/human/.shots"),
    );
    const out: string = path.resolve(output);
    const parent: string = await fs.realpath(path.dirname(out));
    const relative: string = path.relative(base, parent);
    if (
      !path.isAbsolute(output) ||
      relative === ".." ||
      relative.startsWith(".." + path.sep) ||
      path.isAbsolute(relative)
    )
      throw new Error(
        "A new absolute human/.shots output directory is required",
      );
    await fs.mkdir(out);
    const files: {
      id: string;
      file: string;
      sha256: string;
      rootCase: IReference;
    }[] = [];
    const ids: Set<string> = new Set();
    for (const selected of catalog.cases) {
      if (ids.has(selected.id))
        throw new Error("Duplicate original catalog id: " + selected.id);
      ids.add(selected.id);
      if (selected.resolution.status !== "resolved") continue;
      Selection.select(catalog, selected.id, value.original.sourceHashes);
      const caseFile: string = path.join(
        path.dirname(roundPath),
        selected.id + ".json",
      );
      const caseBytes: Buffer = await fs.readFile(await inside(root, caseFile));
      const actual: ICase = JSON.parse(caseBytes.toString("utf8"));
      const oldBytes: Buffer = await checked(root, actual.originalCase);
      const old: Transport.IClaim = JSON.parse(oldBytes.toString("utf8"));
      admit(selected, old, actual, value, oldBytes);
      const index: IRound["cases"] = round.cases.filter(
        (row: IRound["cases"][number]): boolean => row.id === selected.id,
      );
      if (
        index.length !== 1 ||
        index[0]!.fieldsHash !== actual.fieldsHash ||
        index[0]!.unchangedObservedOutcomes !== true
      )
        throw new Error(
          "RootInputs aggregate does not match actual case: " + selected.id,
        );
      const packet: IPacket = {
        rootRound: { file: roundPath, byteHash: Identity.byteHash(roundBytes) },
        rootCase: { file: caseFile, byteHash: Identity.byteHash(caseBytes) },
        originalCase: actual.originalCase,
        provenance: value,
      };
      const report: unknown = {
        id: selected.id,
        fields: selected.fields,
        fieldsHash: Identity.dataHash(selected.fields),
        sourceHashes: value.diagnostic.sourceHashes,
        evidenceScope: "recorded-input-source-only",
        recordedInput: packet,
        qualification:
          "Original case records and constraint resolution are historical; current fingerprint identifies a separate recorded observation generation, not a full-source or shape approval.",
      };
      const file: string = path.join(
        out,
        encodeURIComponent(selected.id) + ".preflight.json",
      );
      const bytes: string = JSON.stringify(report, null, 2);
      await fs.writeFile(file, bytes, { flag: "wx" });
      files.push({
        id: selected.id,
        file,
        sha256: Identity.byteHash(bytes),
        rootCase: packet.rootCase,
      });
    }
    await current(root, value.diagnostic.sourceHashes);
    const file: string = path.join(out, "capture-cases.json");
    const bytes: string = JSON.stringify(
      {
        schema: catalog.schema,
        sourceHashes: value.diagnostic.sourceHashes,
        cases: catalog.cases,
        evidenceScope: "recorded-input-source-only",
        originalCatalog: value.original.catalog,
        rootRound: { file: roundPath, byteHash: Identity.byteHash(roundBytes) },
      },
      null,
      2,
    );
    const producerFile: string =
      "test/src/reference-conics/FamilyConicCaptureTransportFiles.ts";
    const commandFile: string =
      "test/src/reference-conics/FamilyConicCaptureTransportCommand.ts";
    const entry: string | undefined = process.argv[1];
    if (entry === undefined)
      throw new Error("Transport has no executed bundle path");
    const producerFiles: Record<string, string> = {};
    for (const name of [
      producerFile,
      commandFile,
      "test/src/reference-conics/FamilyConicCaptureTransport.ts",
      "test/src/reference-conics/FamilyConicCaseIdentity.ts",
      "test/src/reference-conics/FamilyConicCaseSelection.ts",
      "test/src/reference-conics/FamilyConicSourcePreparation.ts",
      "test/src/reference-conics/FamilyConicSourceEvidence.ts",
      "test/src/reference-conics/FamilyConicSourceDrawing.ts",
      "test/src/reference-conics/FamilyConicCaptureFileIO.ts",
      "test/src/reference-conics/FamilyConicCaptureBaseline.ts",
      "test/src/reference-conics/FamilyConicRecordedInputTransport.ts",
    ])
      producerFiles[name] = Identity.byteHash(
        await fs.readFile(path.join(root, name)),
      );
    const producer: unknown = {
      sourceHashes: producerFiles,
      bundle: {
        file: path.resolve(entry),
        byteHash: Identity.byteHash(await fs.readFile(entry)),
      },
    };
    await fs.writeFile(
      path.join(out, "receipt.json"),
      JSON.stringify(
        {
          schema: "f1-capture-recorded-input-transport/v1",
          catalog: { file, sha256: Identity.byteHash(bytes) },
          files,
          unchangedCases: catalog.cases.length,
          resolvedPreflights: files.length,
          excludedObservationOnlyIds: round.cases
            .filter((row: IRound["cases"][number]): boolean => !ids.has(row.id))
            .map((row: IRound["cases"][number]): string => row.id),
          producer,
          provenance: value,
          qualification:
            "Read-only transport; no geometry, solver, source evaluation, reference recovery or renderer executed. Unresolved cases remain unresolved. Source-only capture is the only permitted consumer.",
        },
        null,
        2,
      ),
      { flag: "wx" },
    );
    await fs.writeFile(file, bytes, { flag: "wx" });
    process.stdout.write(
      JSON.stringify({
        out,
        catalog: file,
        preflights: files.length,
        geometryExecuted: false,
      }) + "\n",
    );
  }
}
