/**
 * Borrowed SVG surface for the photograph landmark overlay. The shared layout owns capture-pixel positions; this port exposes only visibility, attributes and child publication.
 *
 * @author Samchon
 */
export interface IHumanViewerLandmarkSurface {
  /**
   * Visibility of the existing SVG overlay; display is none when no markers are shown.
   */
  style: { display: string };

  /**
   * Clear the previous overlay before publishing the current marker children.
   */
  replaceChildren(): void;

  /** Set a standard SVG attribute on the supplied overlay element. */
  setAttribute(name: string, value: string): void;

  /** Append one caller-created marker element to the overlay. */
  append(child: unknown): void;
}
