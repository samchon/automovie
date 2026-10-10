import type { IHumanSourceAttachmentCoverage } from "./IHumanSourceAttachmentCoverage.ts";
import type { IHumanSourceFacialHairDomainRegistration } from "./IHumanSourceFacialHairDomainRegistration.ts";

/**
 * Actual native support observations emitted with the registered face.
 * Geometry identity excludes material charts and owned terminal territories.
 * Original scalp metadata remains protected. Coverage belongs
 * to the explicit numerical context, while runtime retains its own checks.
 *
 * @author Samchon
 */
export interface IHumanSourceAttachmentRegistration {
  /** Counts from the actual shared native and finite-support producers. */
  counts: Record<string, number>;

  /** Every registered upper/lower extent on each present source side. */
  coverage: Record<string, IHumanSourceAttachmentCoverage[]>;

  /** Unchanged physical fields and original scalp domains, with owned registrations omitted. */
  preservedSourceGeometrySha256: string;

  /** Canonical numerical fields used for this support observation. */
  numericalContextSha256: string;

  /** Source-authored terminal territories, separate from clinical populations. */
  facialHair: IHumanSourceFacialHairDomainRegistration[];
}
