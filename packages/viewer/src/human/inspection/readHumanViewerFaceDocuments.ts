import { createHash } from "node:crypto";
import fs from "node:fs";

import type { IHumanViewerFaceDocuments } from "./IHumanViewerFaceDocuments.js";
import type { IHumanViewerSubjectDocument } from "./IHumanViewerSubjectDocument.js";
import type { IReadHumanViewerFaceDocumentsProps } from "./IReadHumanViewerFaceDocumentsProps.js";
import { humanViewerPublishedBasis } from "./humanViewerPublishedBasis.js";

/**
 * The catalogue's face documents: the application's supplied reference example
 * and every published subject, each on
 * the published face basis. A document's key hashes the document, the face
 * basis digest and the face source digest, and its basis token names the
 * face basis bytes. Subjects are published source documents and are not
 * admitted here.
 */
export function readHumanViewerFaceDocuments(
  props: IReadHumanViewerFaceDocumentsProps,
): IHumanViewerFaceDocuments {
  const subjects = JSON.parse(
    fs.readFileSync(props.documentsFile, "utf8"),
  ) as IHumanViewerSubjectDocument[];
  const reference = props.reference;
  return {
    reference,
    subjects,
    entries: [reference, ...subjects].map((document) => ({
      id: document.id,
      domain: "face" as const,
      document,
      basis: humanViewerPublishedBasis(props.face.digest),
      key: createHash("sha256")
        .update(
          JSON.stringify(document) + props.face.digest + props.sources.face,
        )
        .digest("hex"),
    })),
  };
}
