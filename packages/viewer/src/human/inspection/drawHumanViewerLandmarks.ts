import type { IHumanViewerLandmarkSurface } from "./IHumanViewerLandmarkSurface.js";


/**
 * Draw the observed landmarks of the photograph on the page's SVG overlay,
 * in the same capture pixels that `layoutHumanViewerReference` and the PNG
 * capture use, so the screen and a saved frame mark identical positions.
 * The overlay is shown only when the address asked for landmarks and a
 * photograph is displayed; otherwise it is emptied and hidden. Markers carry
 * their group name and no path or image data.
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
    const circle = create();
    circle.setAttribute("cx", String(marker.x));
    circle.setAttribute("cy", String(marker.y));
    circle.setAttribute("r", String(shown.radius));
    circle.setAttribute("fill", "#00ffff");
    circle.setAttribute("data-group", marker.group);
    svg.append(circle);
  }
  svg.style.display = "block";
}
