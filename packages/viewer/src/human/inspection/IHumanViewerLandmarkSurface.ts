/**
 * Borrowed SVG surface for the photograph landmark overlay. The shared layout owns capture-pixel positions; this port exposes only visibility, attributes and child publication.
 *
 * @evidence contracts/common.md#principled-implementation A narrow SVG mutation port preserves the DOM's child and attribute operations needed by the observed-landmark overlay.
 * @evidence contracts/common.md#clear-and-simple-design Only display visibility, clearing, attributes and append are exposed to the overlay owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The port uses existing SVG operations rather than replacing document globals or special-casing a photograph.
 * @evidence contracts/common.md#meaningful-documentation Visibility belongs to style.display, attributes establish the view box, and children contain observed marker elements.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach A narrow SVG mutation port preserves the DOM's child and attribute operations needed by the observed-landmark overlay.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach The port uses existing SVG operations rather than replacing document globals or special-casing a photograph.
 *
 * @author Samchon
 */
export interface IHumanViewerLandmarkSurface {
  /**
   * Visibility of the existing SVG overlay; display is none when no markers are shown.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Controls only the supplied SVG overlay's visibility, preserving numerical model and document state.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Controls only the supplied SVG overlay's visibility, preserving numerical model and document state.
   */
  style: { display: string };

  /**
   * Clear the previous overlay before publishing the current marker children.
   *
   * @evidence contracts/common.md#principled-implementation The SVG owner clears the previous overlay before applying current marker state.
   * @evidence contracts/common.md#clear-and-simple-design One standard child-list operation avoids retaining obsolete marker elements.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The call uses the supplied SVG surface rather than a replacement document global.
   * @evidence contracts/common.md#meaningful-documentation All existing overlay children are removed; subsequent append calls publish current markers.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach The SVG owner clears the previous overlay before applying current marker state.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach All existing overlay children are removed; subsequent append calls publish current markers.
   */
  replaceChildren(): void;

  /**
   * Set a standard SVG attribute on the supplied overlay element.
   *
   * @evidence contracts/common.md#principled-implementation The overlay sets standard SVG attributes such as its capture-pixel viewBox.
   * @evidence contracts/common.md#clear-and-simple-design Attribute mutation remains one supplied surface operation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The current layout supplies attribute values rather than photograph-specific constants.
   * @evidence contracts/common.md#meaningful-documentation The arguments are the SVG attribute name and its serialized value.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach The overlay sets standard SVG attributes such as its capture-pixel viewBox.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach The arguments are the SVG attribute name and its serialized value.
   */
  setAttribute(name: string, value: string): void;

  /**
   * Append one caller-created marker element to the overlay.
   *
   * @evidence contracts/common.md#principled-implementation The overlay appends each newly created observed marker in layout order.
   * @evidence contracts/common.md#clear-and-simple-design Child creation remains with the caller while this port owns insertion only.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The child comes from the supported SVG creation boundary without prototype mutation.
   * @evidence contracts/common.md#meaningful-documentation One supplied child is appended to the current overlay element.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach The overlay appends each newly created observed marker in layout order.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach One supplied child is appended to the current overlay element.
   */
  append(child: unknown): void;
}
