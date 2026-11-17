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

  /**
   * Read the retained web for an unordered pair of pinch vertex indices; callers must supply a pair present in webs.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Read the retained web for an unordered pair of pinch vertex indices; callers must supply a pair present in webs.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; the Human producer or supplied callback used by AutoMovieHumanWebCrest owns the numerical method described above.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanWebCrests.webOf declares the invocation boundary only; AutoMovieHumanWebCrest and its callback provider own the implementation decomposition.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or substitutions execute in this signature; the Human implementation supplying IAutoMovieHumanWebCrests.webOf must justify them.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; the implementation supplying IAutoMovieHumanWebCrests.webOf owns its time and space costs.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no work coordination; AutoMovieHumanWebCrest and the callback's provider own sharing under the stated input and result contract.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources; the AutoMovieHumanWebCrest producer or caller supplying the callback owns captured state and its lifetime.
   */
  webOf: (a: number, b: number) => IAutoMovieHumanWeb;

  /**
   * The mesh's point of a vertex, mm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The mesh's point of a vertex, mm.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; the Human producer or supplied callback used by AutoMovieHumanWebCrest owns the numerical method described above.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanWebCrests.position declares the invocation boundary only; AutoMovieHumanWebCrest and its callback provider own the implementation decomposition.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or substitutions execute in this signature; the Human implementation supplying IAutoMovieHumanWebCrests.position must justify them.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; the implementation supplying IAutoMovieHumanWebCrests.position owns its time and space costs.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no work coordination; AutoMovieHumanWebCrest and the callback's provider own sharing under the stated input and result contract.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources; the AutoMovieHumanWebCrest producer or caller supplying the callback owns captured state and its lifetime.
   */
  position: (v: number) => AutoMovieVector3Tuple;

  /**
   * Outward unit direction estimated between the end ring and its inward station sample at phase t in radians.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Outward unit direction estimated between the end ring and its inward station sample at phase t in radians.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; the Human producer or supplied callback used by AutoMovieHumanWebCrest owns the numerical method described above.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanWebCrests.outward declares the invocation boundary only; AutoMovieHumanWebCrest and its callback provider own the implementation decomposition.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or substitutions execute in this signature; the Human implementation supplying IAutoMovieHumanWebCrests.outward must justify them.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; the implementation supplying IAutoMovieHumanWebCrests.outward owns its time and space costs.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no work coordination; AutoMovieHumanWebCrest and the callback's provider own sharing under the stated input and result contract.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources; the AutoMovieHumanWebCrest producer or caller supplying the callback owns captured state and its lifetime.
   */
  outward: (t: number) => AutoMovieVector3Tuple;

  /**
   * Parent's outward station jet at end-ring phase t in radians, estimated by the producer's one-sided three-point samples; it is not an exact source derivative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Parent's outward station jet at end-ring phase t in radians, estimated by the producer's one-sided three-point samples; it is not an exact source derivative.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; the Human producer or supplied callback used by AutoMovieHumanWebCrest owns the numerical method described above.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanWebCrests.parentJet declares the invocation boundary only; AutoMovieHumanWebCrest and its callback provider own the implementation decomposition.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or substitutions execute in this signature; the Human implementation supplying IAutoMovieHumanWebCrests.parentJet must justify them.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; the implementation supplying IAutoMovieHumanWebCrests.parentJet owns its time and space costs.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no work coordination; AutoMovieHumanWebCrest and the callback's provider own sharing under the stated input and result contract.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources; the AutoMovieHumanWebCrest producer or caller supplying the callback owns captured state and its lifetime.
   */
  parentJet: (t: number) => IAutoMovieArcLengthJet;
}
