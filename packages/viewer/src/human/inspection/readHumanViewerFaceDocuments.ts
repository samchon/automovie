import { createHash } from "node:crypto";
import fs from "node:fs";

import type { IHumanViewerFaceDocuments } from "./IHumanViewerFaceDocuments.js";
import type { IHumanViewerSubjectDocument } from "./IHumanViewerSubjectDocument.js";
import type { IReadHumanViewerFaceDocumentsProps } from "./IReadHumanViewerFaceDocumentsProps.js";
import { humanViewerPublishedBasis } from "./humanViewerPublishedBasis.js";

/**
 * The catalogue's face documents: the application's supplied reference example and every published subject, each on the published face basis. A document's key hashes the document, the face basis digest and the face source digest, and its basis token names the face basis bytes. Subjects are published source documents and are not admitted here.
 *
 * @evidence contracts/common.md#principled-implementation Application reference and published subject JSON become face entries keyed by document text, actual basis digest and face-source digest.
 * @evidence contracts/common.md#clear-and-simple-design One source-file parse and map return the existing face document representation and canonical published basis token.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No face geometry is invented and this catalogue projection does not certify full subject schema before the domain owner's build.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies application reference ownership, published subjects and basis/source numerical identity.
 * @evidence contracts/performance.md#efficient-algorithms Parsing and per-document JSON hashing scale with source/document bytes, while one entries map preserves declared order.
 * @evidence contracts/performance.md#reuse-equivalent-work The source caller memoizes this projection under its document stamp, basis/source and reference identity; the adapter itself retains no independent result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned entries borrow parsed document objects for the catalogue, and no texture, renderer or numerical runtime is acquired.
 */
export function readHumanViewerFaceDocuments(
  props: IReadHumanViewerFaceDocumentsProps,
): IHumanViewerFaceDocuments {
  const subjects: IHumanViewerSubjectDocument[] = JSON.parse(
    fs.readFileSync(props.documentsFile, "utf8"),
  ) as IHumanViewerSubjectDocument[];
  const reference: IReadHumanViewerFaceDocumentsProps["reference"] =
    props.reference;
  return {
    reference,
    subjects,
    entries: [reference, ...subjects].map(
      (
        document: IHumanViewerSubjectDocument,
      ): IHumanViewerFaceDocuments["entries"][number] => ({
        id: document.id,
        domain: "face" as const,
        document,
        basis: humanViewerPublishedBasis(props.face.digest),
        key: createHash("sha256")
          .update(
            JSON.stringify(document) + props.face.digest + props.sources.face,
          )
          .digest("hex"),
      }),
    ),
  };
}
