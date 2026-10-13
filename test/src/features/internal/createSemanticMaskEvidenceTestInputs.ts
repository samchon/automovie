import {
  digestAutoMovieSemanticMask,
} from "@automovie/engine";
import {
  AutoMovieContentDigest,
  IAutoMovieSemanticMask,
} from "@automovie/interface";
import {
  IAutoMovieProductionSemanticMaskEvidence,
  IAutoMovieProductionSemanticMaskReceipt,
  createAutoMovieProductionSemanticMaskReceipt,
} from "@automovie/production";

/**
 * Construct fresh typed palette, coverage and receipt inputs for semantic
 * evidence units. Valid palettes are sealed through the public digest owner;
 * malformed records are explicit refusal inputs and never media-probe stand-ins.
 * UTF-8 conversion retains the exact authored resident sidecar bytes.
 */
export const createSemanticMaskEvidenceTestInputs = () => {
  /** One valid current palette and zero-gap runtime observation. */
  const validEvidence = (): IAutoMovieProductionSemanticMaskEvidence => ({
    version: 1,
    shot: "opening",
    mask: seal({
      version: 2,
      protocol: "automovie.semantic-mask.v2",
      background: "#000000",
      entries: [
        {
          id: "node:hero",
          kind: "node",
          label: null,
          color: "#123456",
          owner: null,
          nodes: ["hero"],
          slot: null,
        },
      ],
      unaddressed: [],
    }),
    coverage: { unresolved: [], unaddressed: 0 },
  });

  /** Copy evidence with an exact replacement runtime-coverage observation. */
  const withCoverage = (
    evidence: IAutoMovieProductionSemanticMaskEvidence,
    coverage: IAutoMovieProductionSemanticMaskEvidence["coverage"],
  ): IAutoMovieProductionSemanticMaskEvidence => ({ ...evidence, coverage });

  /** Create one receipt with concise defaults for refusal cases. */
  const createReceipt = (props: {
    evidence: IAutoMovieProductionSemanticMaskEvidence;
    sidecarBytes: Uint8Array;
    expectedShot?: string;
    frame?: number;
    path?: string;
  }): IAutoMovieProductionSemanticMaskReceipt =>
    createAutoMovieProductionSemanticMaskReceipt({
      frame: props.frame ?? 0,
      expectedShot: props.expectedShot ?? "opening",
      evidence: props.evidence,
      sidecar: {
        path: props.path ?? "semantic/opening.mask.json",
        bytes: props.sidecarBytes,
      },
    });

  /** Seal one semantic payload with the engine's public canonical digest. */
  const seal = (
    value: Omit<IAutoMovieSemanticMask, "digest">,
  ): IAutoMovieSemanticMask => ({
    ...value,
    digest: digestAutoMovieSemanticMask(value),
  });

  /** Extract a mask payload without its self-declared digest. */
  const payload = (
    mask: IAutoMovieSemanticMask,
  ): Omit<IAutoMovieSemanticMask, "digest"> => ({
    version: mask.version,
    protocol: mask.protocol,
    background: mask.background,
    entries: mask.entries,
    unaddressed: mask.unaddressed,
  });

  /** Rename one key without changing key count, for exact-record refusal. */
  const renameKey = <T extends object>(
    value: T,
    removed: string,
    added: string,
  ): T => {
    const record = { ...value } as Record<string, unknown>;
    record[added] = record[removed];
    delete record[removed];
    return record as T;
  };

  /** Exact UTF-8 bytes used by production sidecar files. */
  const bytes = (value: string): Uint8Array => Buffer.from(value, "utf8");

  const digest = (fill: string): AutoMovieContentDigest =>
    `sha256:${fill.repeat(64).slice(0, 64)}`;

  return { validEvidence, withCoverage, createReceipt, seal, payload, renameKey, bytes, digest };
};
