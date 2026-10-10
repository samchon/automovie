import type { IHumanSourceAttachmentRegistration } from "./IHumanSourceAttachmentRegistration.ts";
import type { IHumanSourceEditReceipt } from "./IHumanSourceEditReceipt.ts";
import type { IHumanSourceFieldRegeneration } from "./IHumanSourceFieldRegeneration.ts";
import type { IHumanSourceGeneration } from "./IHumanSourceGeneration.ts";
import type { IHumanSourceHeadLandmarks } from "./IHumanSourceHeadLandmarks.ts";
import type { IHumanSourceHeadRegions } from "./IHumanSourceHeadRegions.ts";
import type { IHumanSourceHeadSampleSelections } from "./IHumanSourceHeadSampleSelections.ts";
import type { IHumanSourceOpticalRegistration } from "./IHumanSourceOpticalRegistration.ts";
import type { IHumanSourceP1 } from "./IHumanSourceP1.ts";
import type { IHumanSourcePeriocularRegistration } from "./IHumanSourcePeriocularRegistration.ts";
import type { IHumanSourcePersonViews } from "./IHumanSourcePersonViews.ts";
import type { IHumanSourcePreparedGeneration } from "./IHumanSourcePreparedGeneration.ts";
import type { IHumanSourceReproductionReport } from "./IHumanSourceReproductionReport.ts";

/**
 * Complete current-source assembly ready for one atomic publication.
 * Numerical support observations remain separate from physical acceptance.
 *
 * @author Samchon
 */
export interface IHumanSourceCompiledGeneration extends IHumanSourcePreparedGeneration {
  /** Portable sampled-content identities and tool versions. */
  sampleRecord: Record<string, string | number>;

  /** One-skin identity and registered shared source derivatives. */
  generation: IHumanSourceGeneration;

  /** Actual body field production and its original receipts. */
  fields: IHumanSourceFieldRegeneration;

  /** Same-source two-basis representation and boundary owners. */
  p1: IHumanSourceP1;

  /** Final product partition views with complete attachments. */
  views: IHumanSourcePersonViews;

  /** Actual head landmark readings. */
  head: IHumanSourceHeadLandmarks;

  /** Source region correspondence and its provenance. */
  regions: IHumanSourceHeadRegions;

  /** Actual source sample selections, separate from filled regions. */
  sampleSelections: IHumanSourceHeadSampleSelections;

  /** Original station, extent and canthal registration. */
  periocular: IHumanSourcePeriocularRegistration;

  /** Final consumer-frame optical source support. */
  optical: IHumanSourceOpticalRegistration;

  /** Actual final head endpoint row edits. */
  rowEdits: IHumanSourceEditReceipt["endpoints"];

  /** Original pose qualification, never neutral motion acceptance. */
  poseReceipt: Record<string, unknown>;

  /** All original per-row findings, losses and stage checks. */
  reproduction: IHumanSourceReproductionReport;

  /** Actual native support on the final consumer-frame face. */
  attachment: IHumanSourceAttachmentRegistration;
}
