import { createHash } from "node:crypto";
import fs from "node:fs";

import type { IHumanViewerFaceDocuments } from "./IHumanViewerFaceDocuments";
import type { IHumanViewerReferenceFaceDocument } from "./IHumanViewerReferenceFaceDocument";
import type { IHumanViewerSubjectDocument } from "./IHumanViewerSubjectDocument";
import type { IReadHumanViewerFaceDocumentsProps } from "./IReadHumanViewerFaceDocumentsProps";
import { humanViewerPublishedBasis } from "./humanViewerPublishedBasis";

/**
 * The catalogue's face documents: the CC0 connected reference face (authored
 * here with no shape and no expression) and every published subject, each on
 * the published face basis. A document's key hashes the document, the face
 * basis digest and the face source digest, and its basis token names the
 * face basis bytes. Subjects are published source documents and are not
 * admitted here.
 *
 * @evidence contracts/common.md#principled-implementation Keys and tokens bind each face to its exact basis and builder source.
 * @evidence contracts/common.md#clear-and-simple-design One reader owns the face group; other groups build on its reference.
 * @evidence contracts/common.md#meaningful-documentation States the reference, the key inputs and the admission boundary.
 */
export function readHumanViewerFaceDocuments(
  props: IReadHumanViewerFaceDocumentsProps,
): IHumanViewerFaceDocuments {
  const subjects = JSON.parse(
    fs.readFileSync(props.documentsFile, "utf8"),
  ) as IHumanViewerSubjectDocument[];
  const reference: IHumanViewerReferenceFaceDocument = {
    id: "connected-reference",
    name: "CC0 connected reference",
    basis: props.face.id,
    shape: {},
    expression: {},
  };
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
