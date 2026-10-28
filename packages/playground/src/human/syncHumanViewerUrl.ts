import type { IHumanViewerPage } from "./IHumanViewerPage";
import { normalizeHumanCurves } from "./normalizeHumanCurves";

/**
 * Mirror the Human page's current display conditions into its existing URL.
 * Development inspection queries travel with the same canonical view text as camera overrides, so copied page and PNG URLs select the same conditions.
 *
 * @param alias Loaded registered alias, or null.
 * @param pass Current display pass.
 * @param camera Current named camera.
 * @param curves Canonical curve-selection text.
 * @param view Canonical free-view text from normalizeHumanView.
 * @param modules Module-fit preview of the page's loads, or null.
 *
 * @evidence contracts/common.md#principled-implementation Removes the prior known display variables, appends the current alias/preview/pass/camera plus canonical curves and view, and replaces only the current browser history entry.
 * @evidence contracts/common.md#clear-and-simple-design Owns URL mirroring only; parsing, rendering and link DOM remain with their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not create a new page, endpoint or history entry; unrelated URL variables and the fragment are preserved.
 * @evidence contracts/common.md#meaningful-documentation States canonical-input premises, the shared inspection query and the history replacement effect.
 * @evidence contracts/performance.md#efficient-algorithms Work is linear in the short URL and canonical query strings with one URL and one history update.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses the parser's canonical view and existing curve serializer rather than reimplementing normalization.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains no state, listeners or model resources; temporary URL and string values become collectible after the call.
 */
export function syncHumanViewerUrl(
  alias: string | null,
  pass: IHumanViewerPage.Pass,
  camera: string,
  curves: string,
  view: string,
  modules: string | null,
): void {
  const url: URL = new URL(location.href);
  for (const name of [
    "document",
    "alias",
    "modules",
    "pass",
    "camera",
    "curves",
    "az",
    "el",
    "view",
    "target",
    "dist",
    "ortho",
    "isolate",
    "fit",
    "garment",
    "hair",
    "material",
    "light",
  ])
    url.searchParams.delete(name);
  for (const [name, value] of [
    ["alias", alias ?? ""],
    ["modules", modules ?? ""],
    ["pass", pass],
    ["camera", camera],
  ] as const)
    if (value !== "") url.searchParams.set(name, value);
  const search: string = [
    url.searchParams.toString(),
    normalizeHumanCurves.query(curves),
    view,
  ]
    .filter((part: string): boolean => part !== "")
    .join("&");
  history.replaceState(
    null,
    "",
    url.pathname + (search === "" ? "" : "?" + search) + url.hash,
  );
}
