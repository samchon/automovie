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
import { serveHumanViewerReference } from "./serveHumanViewerReference.js";
import { serveHumanViewerRescan } from "./serveHumanViewerRescan.js";

/**
 * Return whether a data route answered this request, leaving GPU routes to the host. Specific person-view paths precede the general basis family so each existing resource owner retains its own response and admission.
 *
 * @evidence contracts/common.md#principled-implementation Uses short-circuit route dispatch with specific person-view paths before the general basis family, preserving each actual route's admission and response ownership.
 * @evidence contracts/common.md#clear-and-simple-design One ordered composition names the existing data endpoints without a second path registry or GPU scheduler.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A prior nonmatching route does not claim a response; overlapping person paths reach their specific owner instead of a guessed general basis result.
 * @evidence contracts/common.md#meaningful-documentation Documentation names endpoint order, path overlap and the separate host GPU dispatch boundary.
 * @evidence contracts/performance.md#efficient-algorithms At most six route probes run and the reference projection maps D document ids; actual file/caching/admission costs remain with the route that answers.
 * @evidence contracts/performance.md#reuse-equivalent-work The router borrows published inventory and invokes one response effect; it adds no completed endpoint cache or independent equivalence key.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The router retains no request after synchronous dispatch; asynchronous readers/listeners and file streams belong to the selected route's existing owner.
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
      documents: props.inventory.documents.map((entry: IServeHumanViewerDataProps["inventory"]["documents"][number]): string => entry.id),
      json: props.json,
    }) ||
    serveHumanViewerGenerationView(props) ||
    serveHumanViewerBasis(props) ||
    serveHumanViewerRescan(props) ||
    serveHumanViewerCache(props)
  );
}
