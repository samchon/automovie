import type { HumanViewerCatalogue } from "@automovie/viewer/human/inspection/HumanViewerCatalogue";

import type { IHumanViewerIndexEntry } from "./IHumanViewerIndexEntry";

/**
 * List every catalogue document for a person browsing, grouped by what it is: the published faces, the standard body states by what they vary (the neutral body, sex, build, age, pose) and the hand-written `file:` inputs.
 *
 * A body state is placed by its own content: any pose or shoulder goal makes it a pose, else a state that moves only the age channel is an age, only the gender channel a sex, any other shape channel a build, and no channel the neutral body. The order of the catalogue is kept inside each section, so a new document appears without this owner learning its name. Pending selectable candidates are appended after admitted documents. Catalogue document identity has already passed the server's basic projection, but grouping hints remain navigation metadata and full schema admission stays with the selected domain owner.
 *
 * @evidence contracts/common.md#principled-implementation Catalogue domain and file identity classify face/person/local entries, while admitted application body-state content prioritizes authored pose before age-only, gender-only, general shape or neutral grouping.
 * @evidence contracts/common.md#clear-and-simple-design One navigation projection combines admitted and pending selectable descriptors without moving numerical schema admission into gallery grouping.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Grouping follows actual document fields rather than memorized example names, and a pending descriptor is not promoted to an admitted drawable by listing it.
 * @evidence contracts/common.md#meaningful-documentation The comment states grouping precedence, catalogue order, appended pending candidates and the basic-projection versus full-admission boundary.
 * @evidence contracts/performance.md#efficient-algorithms Combining n admitted and p pending records costs O(n+p) references; each body entry enumerates c shape keys for classification, with O(n+p+c) aggregate work and current output strings rather than mesh traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This current catalogue projection owns no cross-revision admission or numerical result cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned index records contain ordinary navigation strings without retaining numerical document data or acquiring live handles.
 */
export function describeHumanViewerDocuments(
  catalogue: Pick<HumanViewerCatalogue, "documents"> &
    Partial<Pick<HumanViewerCatalogue, "rejected">>,
): IHumanViewerIndexEntry[] {
  const candidates: NonNullable<
    HumanViewerCatalogue["rejected"][number]["candidate"]
  >[] = (catalogue.rejected ?? []).flatMap(
    (
      entry: HumanViewerCatalogue["rejected"][number],
    ): NonNullable<HumanViewerCatalogue["rejected"][number]["candidate"]>[] =>
      entry.pending && entry.candidate !== undefined ? [entry.candidate] : [],
  );
  return [...catalogue.documents, ...candidates].map(
    (
      entry:
        | HumanViewerCatalogue["documents"][number]
        | NonNullable<HumanViewerCatalogue["rejected"][number]["candidate"]>,
    ): IHumanViewerIndexEntry => {
      const document: HumanViewerDocumentIndexContent =
        entry.document as HumanViewerDocumentIndexContent;
      const label: string =
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
      const channels: string[] = Object.keys(document.shape ?? {});
      const posed: boolean =
        (document.pose?.length ?? 0) !== 0 ||
        (document.shoulders?.length ?? 0) !== 0;
      const section: string = posed
        ? "Body pose"
        : channels.length === 0
          ? "Body neutral"
          : channels.every((channel: string): boolean => channel === "macroAge")
            ? "Body age"
            : channels.every(
                  (channel: string): boolean => channel === "macroGender",
                )
              ? "Body sex"
              : "Body build";
      return { id: entry.id, label, domain: "body", section };
    },
  );
}

/**
 * Numerical label and grouping hints; the domain owner still admits the selected document.
 *
 * @author Samchon
 */
interface HumanViewerDocumentIndexContent {
  name?: unknown;
  shape?: Record<string, unknown>;
  pose?: unknown[];
  shoulders?: unknown[];
}
