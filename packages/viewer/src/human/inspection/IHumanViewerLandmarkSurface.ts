/**
 * Borrowed SVG surface for the photograph landmark overlay. The shared layout owns capture-pixel positions; this port exposes only visibility, attributes and child publication.
 *
 * @evidence contracts/common.md#principled-implementation Provides the existing SVG overlay's visibility, attributes and child publication for capture-pixel landmark drawing.
 * @evidence contracts/common.md#clear-and-simple-design Keeps DOM ownership with the page while drawHumanViewerLandmarks borrows a small structural surface.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The port does not create photographs, infer landmarks or admit arbitrary appended nodes as anatomical evidence.
 * @evidence contracts/common.md#meaningful-documentation Documents borrowed overlay ownership and clearing before current marker publication; pixel coordinate conversion stays with shared layout.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The surface interface performs no draw; its consumer makes one node per supplied marker with linear input cost.
 * @evidence contracts/performance.md#reuse-equivalent-work The current overlay is rebuilt from current markers rather than caching stale layout or child nodes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The page owns the SVG surface; replaced children are withdrawn and new node count follows markers without a separate cap.
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
   *
   * @evidence contracts/common.md#principled-implementation Withdraws prior overlay children before a changed or hidden landmark set is published.
   * @evidence contracts/common.md#clear-and-simple-design Keeps one clear operation at the start of drawHumanViewerLandmarks so old markers cannot coexist with current layout.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts DOM withdrawal is not numerical model disposal or evidence a requested reference decoded successfully.
   * @evidence contracts/common.md#meaningful-documentation The page-owned surface is borrowed, and clearing precedes both the empty-hide branch and nonempty marker rebuild.
   * @evidence contracts/performance.md#efficient-algorithms Native DOM removal cost follows existing child count; subsequent drawing adds one circle per new marker.
   * @evidence contracts/performance.md#reuse-equivalent-work No stale marker node cache is retained across calls; rebuilding preserves current reference-coordinate authority.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Prior nodes leave the surface and can collect when no other owner references them; the surface itself remains page-owned.
   */
  replaceChildren(): void;

  /**
   * Set a standard SVG attribute on the supplied overlay element.
   *
   * @evidence contracts/common.md#principled-implementation Writes the existing SVG overlay's standard viewBox using the current capture-pixel width and height.
   * @evidence contracts/common.md#clear-and-simple-design Keeps DOM attribute publication distinct from layout calculations and marker creation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The caller passes actual shared layout coordinates rather than fitting a second transform to the photograph.
   * @evidence contracts/common.md#meaningful-documentation name/value are standard SVG attribute text; this structural port supplies no general attribute schema admission.
   * @evidence contracts/performance.md#efficient-algorithms One viewBox update per nonempty draw adds fixed string/DOM work, independent of marker count.
   * @evidence contracts/performance.md#reuse-equivalent-work The same surface is reused while values refresh for changed frame/layout; equal old dimensions cannot justify stale markers.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Attribute text lives with the borrowed DOM surface until replacement; no image or renderer resource is acquired here.
   */
  setAttribute(name: string, value: string): void;

  /**
   * Append one caller-created marker element to the overlay.
   *
   * @evidence contracts/common.md#principled-implementation Publishes one caller-created SVG circle after its capture-pixel attributes and group metadata are set.
   * @evidence contracts/common.md#clear-and-simple-design Leaves element creation with the page callback and gives the drawing owner only child publication.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The unknown structural argument is expected to be a compatible actual DOM marker; this interface does not validate or manufacture a replacement node.
   * @evidence contracts/common.md#meaningful-documentation The surface borrows the supplied marker and its DOM lifetime follows child replacement; marker metadata contains group names only.
   * @evidence contracts/performance.md#efficient-algorithms One append per supplied point gives linear marker publication cost and input-sized DOM nodes.
   * @evidence contracts/performance.md#reuse-equivalent-work Markers are current-layout objects and are not shared across unrelated overlays or reference revisions by coordinate equality.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The page surface retains appended nodes until replaceChildren; no file path, image data or native graphics handle transfers in the marker.
   */
  append(child: unknown): void;
}
