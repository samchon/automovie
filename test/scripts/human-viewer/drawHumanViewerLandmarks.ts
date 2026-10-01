/** The part of an SVG element this module writes, so a test can stand in for the DOM. */
export interface IHumanViewerLandmarkSurface {
  style: { display: string };
  replaceChildren(): void;
  setAttribute(name: string, value: string): void;
  append(child: unknown): void;
}

/**
 * Draw the observed landmarks of the photograph on the page's SVG overlay,
 * in the same capture pixels that `layoutHumanViewerReference` and the PNG
 * capture use, so the screen and a saved frame mark identical positions.
 * The overlay is shown only when the address asked for landmarks and a
 * photograph is displayed; otherwise it is emptied and hidden. Markers carry
 * their group name and no path or image data.
 *
 * @evidence contracts/common.md#principled-implementation The view box equals the capture extent, so marker coordinates are capture pixels.
 * @evidence contracts/common.md#clear-and-simple-design One function owns the overlay; positions come from the shared layout.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject, photograph or landmark is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the coordinate frame and visibility rule.
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
