import fs from "node:fs/promises";
import path from "node:path";

import { FamilyConicCaptureFileIO as FileIO } from "./FamilyConicCaptureFileIO";
import type { FamilyConicCaptureFraming as Framing } from "./FamilyConicCaptureFraming";
import type { FamilyConicCaptureInput as Input } from "./FamilyConicCaptureInput";
import type { FamilyConicCaptureTransport as Transport } from "./FamilyConicCaptureTransport";
import { FamilyConicCaseIdentity as Identity } from "./FamilyConicCaseIdentity";
import { FamilyConicCaseSelection as Selection } from "./FamilyConicCaseSelection";

/** Fixed historical F1 framing data, separate from current generation admission. */
export namespace FamilyConicCaptureBaseline {
  /** Share the unchanged containment implementation. */
  const inside: typeof FileIO.inside = FileIO.inside;
  /** Share the unchanged checked byte reader. */
  const checked: typeof FileIO.checked = FileIO.checked;
  /**
   * Load one explicit archived F1 framing reference without admitting it as
   * current generation evidence.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The known original-definition schema, exact f1 identity/field digest, full scope, world-mm axis convention, finite frame and archived producer bundle bind world-metre comparison samples.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One absolute CLI file is contained under human/.shots, checked as a fixed F1 original record, then reduced to comparison curves and provenance.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Historical source hashes are retained as provenance and never compared to or substituted for current admission; no reference recovery, alignment or geometry evaluation occurs.
   * @evidence contracts/development/implementation.md#efficient-algorithms One reference JSON parse and linear curve/point validation retain only the fixed samples and bounded provenance needed by the camera plan.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work All cases and passes read the same explicit file bytes and the existing Identity/Selection validators.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Awaited reads release handles; only one fixed comparison catalog and its identity escape, with no actual case collection or running task.
   * @evidence contracts/development/common.md#meaningful-documentation States absolute input, fixed F1 scope, world units, original provenance and the separate current-generation role.
   */
  export async function baseline(
    input: Input.IInput,
    args: readonly string[],
  ): Promise<Framing.IBaseline> {
    const found: string[] = args.filter(
      (arg: string): boolean =>
        arg === "--frame-baseline" || arg.startsWith("--frame-baseline="),
    );
    if (
      found.length !== 1 ||
      found[0] === "--frame-baseline" ||
      !path.isAbsolute(found[0]!.slice("--frame-baseline=".length))
    )
      throw new Error(
        "Source-only capture requires one absolute --frame-baseline original F1 JSON",
      );
    const file: string = await inside(
      path.join(input.root, "packages/human/.shots"),
      found[0]!.slice("--frame-baseline=".length),
    );
    const bytes: Buffer = await fs.readFile(file);
    const data: {
      evidence: {
        schema: string;
        generationEntry: string;
        case: Input.IInput["selected"];
        fieldsHash: string;
        sourceHashes: Record<string, string>;
        bare: string[];
        physicalOriginalCurves: Framing.IBaseline["originals"];
        recordedOperatorInputs: { submitted: Transport.ISubmitted };
        parts: { definition: { axis: { units: string } } }[];
        sharedOriginals: { frames: { pelvis: Framing.IBaseline["frame"] } };
      };
      producer: Input.IProducer;
    } = JSON.parse(bytes.toString("utf8"));
    const evidence: typeof data.evidence = data.evidence;
    if (
      evidence.schema !== "f1-original-definitions/v1" ||
      evidence.generationEntry !== "AutoMovieHumanF1.assembleNative(fields)" ||
      evidence.case.id !== "f1" ||
      evidence.bare.length !== 0 ||
      evidence.parts.length === 0 ||
      evidence.parts.some(
        (part: (typeof evidence.parts)[number]): boolean =>
          part.definition.axis.units !== "world mm; unit u/v",
      )
    )
      throw new Error(
        "Framing baseline is not a full fixed F1 original in the declared figure-world coordinate convention",
      );
    Selection.preflight(
      {
        id: evidence.case.id,
        fields: evidence.case.fields,
        fieldsHash: evidence.fieldsHash,
        sourceHashes: evidence.sourceHashes,
      },
      { id: "f1", fields: evidence.case.fields },
      evidence.sourceHashes,
    );
    const frame: Framing.IBaseline["frame"] =
      evidence.sharedOriginals.frames.pelvis;

    const originals: Framing.IBaseline["originals"] =
      evidence.physicalOriginalCurves;
    const submitted: Framing.IBaseline["submitted"] =
      evidence.recordedOperatorInputs.submitted.curves;
    if (originals.length === 0 || submitted.length === 0)
      throw new Error(
        "Fixed F1 original or submitted-input comparison layer is absent",
      );

    await checked(input.root, {
      file: data.producer.bundle.file,
      byteHash: data.producer.bundle.sha256,
    });
    return {
      file: { file, sha256: Identity.byteHash(bytes) },
      frame,
      originals,
      submitted,
      provenance: {
        role: "fixed-framing/comparison-only",
        case: evidence.case.id,
        fieldsHash: evidence.fieldsHash,
        originalScope: evidence.schema,
        coordinateConvention:
          "figure-world mm frame; unit axes; curve samples metres; +X forward/+Y up/+Z left",
        sourceHashes: evidence.sourceHashes,
        producer: data.producer,
        qualification:
          "Historical F1 original/recorded input bounds only; not current admission, current source identity, a current operator evaluation or shape acceptance.",
      },
    };
  }
}
