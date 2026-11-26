import { FamilyConicCaptureInput as Input } from "./FamilyConicCaptureInput";
import type {
  FamilyConicOriginalCatalog as Original,
} from "./FamilyConicOriginalCatalog";
import type { FamilyConicSourceCapture as Source } from "./FamilyConicSourceCapture";
import type { IAutoMovieHumanConicLoft } from "@automovie/interface";
import fs from "node:fs/promises";
import path from "node:path";

/** Original-definition serialization and exclusive evidence writing before downstream rendering. */
export namespace FamilyConicSourceEvidence {
  /** Borrow the unchanged public capture-state declaration. */
  type IState = Source.IState;

  /** Plain source evidence; runtime axis callbacks are identified by their existing owner and actual value observations. */
  function metadata(state: IState): unknown {
    return {
      schema: "f1-original-definitions/v1",
      case: state.input.selected,
      artifact: state.input.artifact,
      fieldsHash: state.input.fieldsHash,
      sourceHashes: state.input.sourceHashes,
      preflight: state.input.preflight,
      bare: state.input.bare,
      generationEntry: "AutoMovieHumanF1.assembleNative(fields)",
      actualNativeFamilies: state.assembly.families.filter(
        (family: IAutoMovieHumanConicLoft.IFamily): boolean => family.native !== undefined,
      ).length,
      reads: state.reads,
      assemblyMs: state.assemblyMs,
      originalMs: state.originalMs,
      memorySnapshots: state.memory,
      declaredOriginals: state.declaredOriginals,
      familyDeclarationScope:
        "Raw assembly declarations, including complete original caps; actual production body wall/closure scope and native source domain are recorded separately",
      sourceScopes: state.sourceScopes.map(
        (scope: IState["sourceScopes"][number]): unknown => {
          const part: Original.IPart | undefined = state.originals.parts.find(
            (item: Original.IPart): boolean => item.id === scope.id,
          );
          return {
            ...scope,
            capInclusiveNativeDomain:
              part === undefined
                ? null
                : [
                    part.definition.stations[0],
                    part.definition.stations.at(-1),
                  ],
          };
        },
      ),
      fixedFraming:
        state.frameBaseline === null
          ? null
          : {
              file: state.frameBaseline.file,
              provenance: state.frameBaseline.provenance,
            },
      fixedCounterparts: state.originals.counterparts.map(
        (part: Original.IResult["counterparts"][number]): unknown => ({
          id: part.id,
          role: "fixed-authored-family-comparison; not an actual production sampling grid",
          definition: {
            ...part.definition,
            axis: {
              reader: "fixed authored IAxis.at",
              units: "world mm; unit u/v",
            },
          },
        }),
      ),
      recordedOperatorInputs: state.recorded,
      families: state.originals.families,
      scalars: state.originals.scalars,
      nets: state.originals.nets,
      parts: state.originals.parts.map((part: Original.IPart): unknown => ({
        id: part.id,
        role: part.role,
        definition: {
          ...part.definition,
          axis: {
            reader: "actual IAxis.at",
            units: "world mm; unit u/v",
            originalHandles: "unavailable",
          },
        },
        authoredCounterpart:
          part.reference === null
            ? null
            : {
                ...part.reference,
                axis: {
                  reader: "fixed authored IAxis.at",
                  units: "world mm; unit u/v",
                },
              },
      })),
      physicalOriginalCurves: state.originals.curves,
      unavailable: state.originals.unavailable,
      sharedOriginals: {
        parentLoops: state.assembly.roots,
        parentLoopUnits: {
          centre: ["m", "rad"],
          semi: ["m", "rad"],
          shape: "dimensionless",
          sense: "orientation sign",
        },
        crotchProfile: state.assembly.crotchProfile,
        crotchProfileUnits: "chord-plane m",
        frames: Object.fromEntries(state.assembly.frames),
        worldLoops: {
          status: "unavailable",
          cause:
            "Port world-loop reader is currently owned inside the actual operator; no duplicate shape/ellipse evaluator is introduced",
        },
      },
      scope:
        "Original scalar/axis/guide/control observations; interpolation knots and net controls are not off-curve/native axis handles or surface samples. No raw-loft, physical2, reference-curve correspondence or realized-skin approval.",
    };
  }

  /**
   * Keep invalid diagnostic numbers explicit instead of JSON's silent nonfinite-to-null replacement.
   *
   * @evidence contracts/development/implementation.md#principled-implementation JSON.stringify's replacer identifies nonfinite numbers before serialization and records their original string representation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One existing replacer supplies both original and receipt serialization.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nonfinite observations remain explicit unavailable objects rather than invented numeric values.
   * @evidence contracts/development/implementation.md#efficient-algorithms Serialization traverses the supplied value and retains the resulting JSON string.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Evidence saving and the coordinator's success/failure receipts share the unchanged recipe.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources No handle or task is acquired; only the returned string is retained by its caller.
   * @evidence contracts/development/common.md#meaningful-documentation States the diagnostic representation of nonfinite numbers.
   */
  export function json(value: unknown): string {
    return JSON.stringify(
      value,
      (_: string, item: unknown): unknown =>
        typeof item === "number" && !Number.isFinite(item)
          ? { unavailable: "nonfinite original number", actual: String(item) }
          : item,
      2,
    );
  }

  /**
   * Save original evidence before full construction/realization, so downstream failure cannot erase it.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Exact input/producer identities and complete original definitions are serialized before downstream realization; invalid diagnostic numbers remain explicit.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One new case directory and exclusive original JSON write return its byte digest.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No original metadata is filtered by PNG selection and no unavailable world loop is fabricated.
   * @evidence contracts/development/implementation.md#efficient-algorithms Serialization and hashing cost the complete one-case original metadata.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Source-only and full capture save the same original evidence format and shared hash recipe.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The awaited write releases its handle and only file identity escapes.
   * @evidence contracts/development/common.md#meaningful-documentation The comment names preservation before downstream failure.
   */
  export async function save(
    state: IState,
    producer: Input.IProducer,
  ): Promise<Input.IFile> {
    const out: string = path.join(
      state.input.root,
      "packages/human/.shots/family-conic-originals",
      state.round,
      "case-" + encodeURIComponent(state.input.selected.id),
    );
    await fs.mkdir(out, { recursive: true });
    const file: string = path.join(out, "originals.json");
    const bytes: string = json({ evidence: metadata(state), producer });
    await fs.writeFile(file, bytes, { flag: "wx" });
    return { file, sha256: Input.hash(bytes) };
  }
}
