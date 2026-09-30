import type {
  IAutoMovieHumanBodyBasisDocument,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanPersonDocument,
} from "@automovie/human";

/**
 * Public, photograph-free inventory returned by the loopback server. Content
 * digests change cache authority when a document, basis or builder changes.
 * Bodies are standard review probes, not named people. `basis` names a
 * candidate basis dropped beside a hand-written document, which the numerical
 * worker uses in place of the published basis.
 *
 * @evidence contracts/common.md#principled-implementation A discriminated domain keeps each document paired with its own numerical runtime.
 * @evidence contracts/common.md#clear-and-simple-design Catalogue data carries identities and cache keys without filesystem paths.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every published document travels through the same inventory mapping.
 * @evidence contracts/common.md#meaningful-documentation States cache authority and the distinction between published subjects and body probes.
 * @author Samchon
 */
export interface HumanViewerCatalogue {
  /** Digest of source bytes that the page evaluates. */
  revision: string;

  /** Display inputs and their document/basis/source digests. */
  documents: ({ id: string; key: string; basis?: string } & (
    | { domain: "face"; document: IAutoMovieHumanFaceBasisDocument }
    | { domain: "body"; document: IAutoMovieHumanBodyBasisDocument }
    | { domain: "person"; document: IAutoMovieHumanPersonDocument }
  ))[];

  /** Input files that were refused, with the reason, so one bad file hides no other. */
  rejected: { file: string; reason: string }[];
}
