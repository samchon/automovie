import type { IHumanViewerPersonBases } from "./IHumanViewerPersonBases.js";
import type { IHumanViewerPersonParts } from "./IHumanViewerPersonParts.js";

/**
 * Read the two basis names a person document declares: `face.basis` and
 * `body.basis`, each a nonempty string. This is all the catalogue checks of a
 * person; the full schema is admitted by the Person owner when the document is
 * built, and that refusal reaches the render. A missing or malformed name
 * refuses here with the reason, so it is listed among the rejected inputs.
 */
export function readHumanViewerPersonBases(
  document: object,
): IHumanViewerPersonBases {
  const basisOf = (side: "face" | "body"): string => {
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
