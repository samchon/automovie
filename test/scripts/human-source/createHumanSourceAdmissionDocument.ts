import type { IAutoMovieHumanPersonDocument } from "@automovie/human/human/structures/IAutoMovieHumanPersonDocument";

import type { IHumanSourceAdmissionDocumentInput } from "./structures/IHumanSourceAdmissionDocumentInput.ts";

/** One admission person document over the named face and body revisions. */
export function createHumanSourceAdmissionDocument(
  input: IHumanSourceAdmissionDocumentInput,
): IAutoMovieHumanPersonDocument {
  return {
    id: "source-generation-admission",
    name: "Source generation admission",
    face: {
      id: "face",
      name: "face",
      basis: input.face,
      shape: input.faceShape,
      expression: {},
    },
    body: {
      id: "body",
      name: "body",
      basis: input.body,
      shape: input.bodyShape,
    },
    ...(input.population === undefined ? {} : { population: input.population }),
  };
}
