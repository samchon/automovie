import type { ISourceStatusEntry } from "./ISourceStatusEntry";

/**
 * One acquired logical source-status boundary with sorted document observations and current generated-output identities.
 *
 * @author Samchon
 */
export interface ISourceStatusSnapshot {
  /** Current logical project revision used by the retained answer. */
revision: number;
  /** Logical source identity used by this supplied capability. */
inputFingerprint: string;
  /** Optional resident authoring guard; this fixture acquires no native store. */
resident: string | null;
  /** Digest of the observed screenplay-index text, or null for absence. */
screenplay: string | null;
  /** Requested document observations, deduplicated and sorted by path during acquisition. */
documents: ISourceStatusEntry[];
  /** Current logical builder-owned output observations. */
generated: {
    /** Logical source identity used by this supplied capability. */
inputFingerprint: string | null;
    /** Optional manifest text digest observed during acquisition. */
manifest: string | null;
    /** Ordered generated member observations. */
files: ISourceStatusEntry[];
  };
}
