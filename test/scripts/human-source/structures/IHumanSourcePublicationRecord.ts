import type { IHumanSourceSampleFile } from "./IHumanSourceSampleFile.ts";

/** Run-local publication authority, separate from portable generation identity.
 * Output digests cover the actual candidate, including its portable and run-local
 * receipts. Completion establishes file integrity, never clinical acceptance.
 * @author Samchon
 */
export interface IHumanSourcePublicationRecord {
  /** Closed version of this run-local authority protocol. */
  schema: "automovie-source-publication/1";
  /** Only complete state permits its explicitly qualified read route. */
  state: "pending" | "refused" | "complete";
  /** Content identity of the completed generation or component; pending has null. */
  generation: string | null;
  /** Full source-stage completion, distinct from clinical/model admission. */
  completeGeneration: boolean;
  /** Explicit completed inspection artifact set retaining full-stage refusal. */
  inspectionOnly: boolean;
  /** Actual child-file bytes and SHA-256, including every output receipt. */
  outputs: Record<string, IHumanSourceSampleFile>;
  /** Original failure message; null for a completed artifact set. */
  refusal: string | null;
}
