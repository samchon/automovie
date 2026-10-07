import type { IAutoMovieHumanPersonDocument } from "@automovie/human";

/** Input and source identity of one actual person-evaluator invocation. */
export interface IUpperLimbObservationIdentity {
  /** Exact submitted document, including its pose and source-view identities. */
  document: IAutoMovieHumanPersonDocument;

  /** Published generation consumed by this invocation. */
  generation: string;

  /** SHA-256 of each actual input artifact. */
  inputDigests: Record<string, string>;

  /** Numerical source bytes and runtime fingerprint read before evaluation. */
  sourceDigest: string;

  /** Git navigation locator; sourceDigest also covers uncommitted source. */
  revision: string;

  /** The source producers' actual person coordinate convention. */
  frame: string;

  /** Published length readings use millimetres. */
  unit: "millimetres";

  /** Runtime that evaluated the source. */
  runtime: string;
}
