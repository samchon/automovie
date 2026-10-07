import type { IAutoMovieHumanBodySimpleShape } from "@automovie/human";

/**
 * Expand numerical identity and tape values on the exact current person.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-simple-shape Carries the requested simple values with the whole-person document they are expanded over.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-simple-shape Keeps face, body and saved anatomical authority together during off-thread inversion.
 */
export interface IConnectedPersonSimpleExpandMessage {
  /** Transport request identity. */
  id: number;

  /** Expansion operation. */
  kind: "expandPersonSimple";

  /** Current whole-person document text, admitted by the same parser as preview. */
  document: string;

  /** Owner-defined measurements and legacy appearance coordinates. */
  simple: IAutoMovieHumanBodySimpleShape;
}
