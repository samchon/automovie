import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieArcLengthJet } from "../../../geometry/IAutoMovieArcLengthJet";
import type { IAutoMovieHumanWeb } from "./IAutoMovieHumanWeb";

/**
 * The first stage of a web's build: every web the parent's ring parts at, and
 * the parent's own surface read at its end ring, which later stages read.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The first stage of a web's build: every web the parent's ring parts at, and the parent's own surface read at its end ring, which later stages read.
 * @evidence contracts/development/design.md#principled-representation `webs`: Every web, by the pair of its pinches. `webOf`: The web of a pair of pinch vertices. `position`: The mesh's point of a vertex, mm.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanWebCrest.of. Read by AutoMovieHumanWebColumns.of, AutoMovieHumanWebMesh.of. Also types AutoMovieHumanBodyWeb.crests.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `webs`, `webOf`, `position`, `outward`, `parentJet`; callers supply the complete record.
 */
export interface IAutoMovieHumanWebCrests {
  /** Every web, by the pair of its pinches. */
  webs: Map<string, IAutoMovieHumanWeb>;

  /** The web of a pair of pinch vertices. */
  webOf: (a: number, b: number) => IAutoMovieHumanWeb;

  /** The mesh's point of a vertex, mm. */
  position: (v: number) => AutoMovieVector3Tuple;

  /** The parent's outward unit direction at a phase of its end ring. */
  outward: (t: number) => AutoMovieVector3Tuple;

  /** The parent's station jet at a phase of its end ring, leaving it. */
  parentJet: (t: number) => IAutoMovieArcLengthJet;
}
