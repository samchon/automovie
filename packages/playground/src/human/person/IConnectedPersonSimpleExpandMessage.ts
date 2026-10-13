import type { IAutoMovieHumanBodySimpleShape } from "@automovie/human";

/** Expand numerical identity and tape values on the exact current person. */
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
