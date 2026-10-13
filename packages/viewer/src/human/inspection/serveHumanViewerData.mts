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
 *
 * @evidence contracts/common.md#principled-implementation Specific generation-view routes precede general basis routes and short-circuit at the actual resource owner.
 * @evidence contracts/common.md#clear-and-simple-design One ordered dispatcher composes catalogue, reference, basis, rescan and cache endpoints without duplicating their I/O rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Delegates original requests and published document identities without substituting a cached image for numerical data or patching route implementations.
 * @evidence contracts/common.md#meaningful-documentation States handled-request meaning, GPU separation and the reason for overlapping-path route order.
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
