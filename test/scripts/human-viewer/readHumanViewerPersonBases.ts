import type { IHumanViewerPersonBases } from "./IHumanViewerPersonBases";

/**
 * Read the two basis names a person document declares: `face.basis` and
 * `body.basis`, each a nonempty string. This is all the catalogue checks of a
 * person; the full schema is admitted by the Person owner when the document is
 * built, and that refusal reaches the render. A missing or malformed name
 * refuses here with the reason, so it is listed among the rejected inputs.
 *
 * @evidence contracts/common.md#principled-implementation Reads only the identities the catalogue compares, leaving schema admission to its owner.
 * @evidence contracts/common.md#clear-and-simple-design One reader owns the two fields the server depends on.
 * @evidence contracts/common.md#meaningful-documentation States what is read, what refuses and who admits the rest.
 */
export function readHumanViewerPersonBases(document: object): IHumanViewerPersonBases {
  const basisOf = (side: "face" | "body"): string => {
    const part: unknown = (document as Partial<Record<"face" | "body", unknown>>)[side];
    if (part === null || typeof part !== "object" || !("basis" in part) ||
        typeof part.basis !== "string" || part.basis === "")
      throw new Error(`A person document needs a ${side} document that names its basis`);
    return part.basis;
  };
  return { face: basisOf("face"), body: basisOf("body") };
}
