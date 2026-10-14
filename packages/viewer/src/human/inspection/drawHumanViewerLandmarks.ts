import type { IHumanViewerLandmarkSurface } from "./IHumanViewerLandmarkSurface.js";

/**
 * Draw the observed landmarks of the photograph on the page's SVG overlay, in the same capture pixels that `layoutHumanViewerReference` and the PNG capture use, so the screen and a saved frame mark identical positions. The overlay is shown only when the address asked for landmarks and a photograph is displayed; otherwise it is emptied and hidden. Markers carry their group name and no path or image data.
 *
 * @evidence contracts/common.md#principled-implementation Supplied capture-pixel coordinates and radius become SVG circles, with the same width/height viewBox used by the reference layout and saved observation.
 * @evidence contracts/common.md#clear-and-simple-design The adapter clears prior children, hides an absent marker set and otherwise creates one simple circle per observed marker.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Group names alone enter marker metadata and no source path, photograph bytes or inferred anatomical landmarks are added.
 * @evidence contracts/common.md#meaningful-documentation Documentation states shared capture coordinates, photograph/address visibility and the limited marker metadata.
 * @evidence contracts/performance.md#efficient-algorithms Drawing takes linear work and one SVG node per supplied marker, with no image pixel scanning or repeated layout measurement.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A changed overlay rebuilds its supplied current markers; the function retains no stale reference-coordinate or node cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources replaceChildren withdraws prior SVG nodes and the new marker count follows the input array without a separate cap; ownership of the SVG surface remains with the page.
 */
export function drawHumanViewerLandmarks(
  svg: IHumanViewerLandmarkSurface,
  create: () => { setAttribute(name: string, value: string): void },
  shown: {
    width: number;
    height: number;
    radius: number;
    markers: { x: number; y: number; group: string }[];
  } | null,
): void {
  svg.replaceChildren();
  if (shown === null || shown.markers.length === 0) {
    svg.style.display = "none";
    return;
  }
  svg.setAttribute("viewBox", `0 0 ${shown.width} ${shown.height}`);
  for (const marker of shown.markers) {
    const circle: ReturnType<typeof create> = create();
    circle.setAttribute("cx", String(marker.x));
    circle.setAttribute("cy", String(marker.y));
    circle.setAttribute("r", String(shown.radius));
    circle.setAttribute("fill", "#00ffff");
    circle.setAttribute("data-group", marker.group);
    svg.append(circle);
  }
  svg.style.display = "block";
}
