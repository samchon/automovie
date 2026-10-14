import type { IHumanViewerPersonBases } from "./IHumanViewerPersonBases.js";
import type { IHumanViewerPersonParts } from "./IHumanViewerPersonParts.js";

/**
 * Read the two basis names a person document declares: `face.basis` and `body.basis`, each a nonempty string. This helper checks only those two names; other catalogue owners check ids, categories and selected generation/sidecar structure, while the full schema is admitted by the Person owner when the document is built, and that refusal reaches the render. A missing or malformed name refuses here with the reason, so it is listed among the rejected inputs.
 *
 * @evidence contracts/common.md#principled-implementation Reads the face and body object's nonempty basis strings; the Person constructor, rather than this catalogue projection, admits the complete document.
 * @evidence contracts/common.md#clear-and-simple-design One local basis reader serves the two required sides and leaves all numerical construction with the Person owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing or malformed references refuse without supplying a default basis or altering the caller's document.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies the two required references and the limited catalogue judgment before full owner admission.
 * @evidence contracts/performance.md#efficient-algorithms Two property lookups and string checks require fixed work and one two-string result, independent of the document's mesh dimensions.
 * @evidence contracts/performance.md#reuse-equivalent-work This pure projection has no memo; each supplied document is checked at the call boundary and no previous reference substitutes for it.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Input objects are borrowed and only the two reference strings escape; no worker, file or resident resource is acquired.
 */
export function readHumanViewerPersonBases(
  document: object,
): IHumanViewerPersonBases {
  const basisOf: (side: "face" | "body") => string = (side: "face" | "body"): string => {
    const part: unknown = (document as IHumanViewerPersonParts)[side];
    if (
      part === null ||
      typeof part !== "object" ||
      !("basis" in part) ||
      typeof part.basis !== "string" ||
      part.basis === ""
    )
      throw new Error(
        `A person document needs a ${side} document that names its basis`,
      );
    return part.basis;
  };
  return { face: basisOf("face"), body: basisOf("body") };
}
