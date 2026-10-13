import type {
  IAutoMovieProductionRenderManifest,
  IAutoMovieProductionRenderReceipt,
} from "@automovie/interface";
import typia, { type IValidation } from "typia";

import { parseAutoMovieStructuredJson } from "./duplicateAwareJson";

/** The two persisted records that together prove one render publication. */
export type AutoMovieProductionRenderLedgerRecord =
  | "render-manifest"
  | "render-manifest-receipt";

/**
 * A render ledger record that materialized as JSON but is not its schema.
 *
 * The violations name schema paths and expected shapes only; the offending
 * values never travel into the diagnostic, so a hostile or credential-bearing
 * record cannot echo itself through a refusal.
 */
export class AutoMovieProductionRenderLedgerSchemaError extends Error {
  /** Stable machine-readable diagnostic code. */
  public readonly code = "automovie-render-ledger-schema-invalid" as const;

  public constructor(
    /** Ledger record being admitted. */
    public readonly record: AutoMovieProductionRenderLedgerRecord,
    /** Schema path and expected shape of every violation, in report order. */
    public readonly violations: readonly string[],
  ) {
    super(
      `AutoMovie render ledger record "${record}" does not satisfy its schema: ${violations.join("; ")}.`,
    );
    this.name = "AutoMovieProductionRenderLedgerSchemaError";
  }
}

/**
 * Admit an already materialized value as the aggregate render manifest.
 *
 * Generated-project scripts and the builder share this one admission so the
 * manifest schema is owned by the production package rather than re-derived
 * by every reader.
 */
export const assertProductionRenderManifestRecord = (
  value: unknown,
): IAutoMovieProductionRenderManifest =>
  admit(
    "render-manifest",
    typia.validateEquals<IAutoMovieProductionRenderManifest>(value),
  );

/** Admit an already materialized value as the renderer-owned receipt. */
export const assertProductionRenderReceiptRecord = (
  value: unknown,
): IAutoMovieProductionRenderReceipt =>
  admit(
    "render-manifest-receipt",
    typia.validateEquals<IAutoMovieProductionRenderReceipt>(value),
  );

/**
 * Admit persisted render manifest bytes through strict structured JSON
 * ingress and then the manifest schema.
 */
export const parseProductionRenderManifestBytes = (
  bytes: Uint8Array,
): IAutoMovieProductionRenderManifest =>
  assertProductionRenderManifestRecord(
    parseAutoMovieStructuredJson({ record: "render-manifest", bytes }),
  );

/**
 * Admit persisted renderer receipt bytes through strict structured JSON
 * ingress and then the receipt schema.
 */
export const parseProductionRenderReceiptBytes = (
  bytes: Uint8Array,
): IAutoMovieProductionRenderReceipt =>
  assertProductionRenderReceiptRecord(
    parseAutoMovieStructuredJson({ record: "render-manifest-receipt", bytes }),
  );

const admit = <T>(
  record: AutoMovieProductionRenderLedgerRecord,
  validation: IValidation<T>,
): T => {
  if (validation.success === false)
    throw new AutoMovieProductionRenderLedgerSchemaError(
      record,
      validation.errors.map(
        (error) => `${error.path} expects ${error.expected}`,
      ),
    );
  return validation.data;
};
