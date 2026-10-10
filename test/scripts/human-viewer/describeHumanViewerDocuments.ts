import type { HumanViewerCatalogue } from "./HumanViewerCatalogue";
import type { IHumanViewerIndexEntry } from "./IHumanViewerIndexEntry";

/**
 * List every catalogue document for a person browsing, grouped by what it is:
 * the published faces, the standard body states by what they vary (the
 * neutral body, sex, build, age, pose) and the hand-written `file:` inputs.
 *
 * A body state is placed by its own content: any pose or shoulder goal makes
 * it a pose, else a state that moves only the age channel is an age, only the
 * gender channel a sex, any other shape channel a build, and no channel the
 * neutral body. The order of the catalogue is kept inside each section, so a
 * new document appears without this owner learning its name.
 */
export function describeHumanViewerDocuments(
  catalogue: Pick<HumanViewerCatalogue, "documents"> & Partial<Pick<HumanViewerCatalogue, "rejected">>,
): IHumanViewerIndexEntry[] {
  const candidates = (catalogue.rejected ?? []).flatMap((entry) =>
    entry.pending && entry.candidate !== undefined ? [entry.candidate] : [],
  );
  return [...catalogue.documents, ...candidates].map((entry) => {
    const document = entry.document as HumanViewerDocumentIndexContent;
    const label =
      typeof document.name === "string" && document.name !== ""
        ? document.name
        : entry.id;
    if (entry.id.startsWith("file:"))
      return {
        id: entry.id,
        label: entry.id.slice(5),
        domain: entry.domain,
        section: "Local input",
      };
    if (entry.domain === "face")
      return { id: entry.id, label, domain: "face", section: "Face" };
    if (entry.domain === "person")
      return { id: entry.id, label, domain: "person", section: "Person" };
    const channels = Object.keys(document.shape ?? {});
    const posed =
      (document.pose?.length ?? 0) !== 0 ||
      (document.shoulders?.length ?? 0) !== 0;
    const section = posed
      ? "Body pose"
      : channels.length === 0
        ? "Body neutral"
        : channels.every((channel) => channel === "macroAge")
          ? "Body age"
          : channels.every((channel) => channel === "macroGender")
            ? "Body sex"
            : "Body build";
    return { id: entry.id, label, domain: "body", section };
  });
}

/** Numerical label and grouping hints; the domain owner still admits the selected document. */
interface HumanViewerDocumentIndexContent {
  name?: unknown;
  shape?: Record<string, unknown>;
  pose?: unknown[];
  shoulders?: unknown[];
}
