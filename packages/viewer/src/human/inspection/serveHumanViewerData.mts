/**
 * Published data endpoints for the resident viewer, independent of GPU work,
 * tried in order: the catalogue (`/docs`), reference photographs, the person
 * generation views, the face, body and candidate bases, rescans and the
 * numerical cache. Each route owns its answer; this function only names their
 * order, which matters where paths overlap (`/basis/person/head` before the
 * general `/basis/*` route).
 */
import type { IServeHumanViewerDataProps } from "./IServeHumanViewerDataProps.js";
import { serveHumanViewerBasis } from "./serveHumanViewerBasis.js";
import { serveHumanViewerCache } from "./serveHumanViewerCache.js";
import { serveHumanViewerDocs } from "./serveHumanViewerDocs.js";
import { serveHumanViewerGenerationView } from "./serveHumanViewerGenerationView.js";
import { serveHumanViewerReference } from "./serveHumanViewerReference.mjs";
import { serveHumanViewerRescan } from "./serveHumanViewerRescan.js";

/**
 * Return whether a data route answered this request, leaving GPU routes to
 * the host. Specific person-view paths precede the general basis family so
 * each existing resource owner retains its own response and admission.
 */
export function serveHumanViewerData(
  props: IServeHumanViewerDataProps,
): boolean {
  return (
    serveHumanViewerDocs(props) ||
    serveHumanViewerReference({
      url: props.url,
      response: props.response,
      cameraPosesFile: props.cameraPosesFile,
      referenceDirectory: props.referenceDirectory,
      documents: props.inventory.documents.map((entry) => entry.id),
      json: props.json,
    }) ||
    serveHumanViewerGenerationView(props) ||
    serveHumanViewerBasis(props) ||
    serveHumanViewerRescan(props) ||
    serveHumanViewerCache(props)
  );
}
