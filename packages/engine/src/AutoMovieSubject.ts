import type { IAutoMovieShotBuildContext } from "@automovie/interface";
import { IAutoMovieSubjectContribution } from "./IAutoMovieSubjectContribution";

/**
 * One thing in a production: a performer, a prop, a place, or a population.
 *
 * A subject owns four obligations that were previously scattered. Its
 * constraints are checked where it is built rather than asserted in a comment;
 * its motions are methods rather than strings in a `capabilities` array; its
 * utilities answer questions about it rather than living as free functions the
 * caller has to locate; and its `render` states what it puts into a shot.
 *
 * `design` is the wire. A class is an authoring surface and never reaches the
 * compile sandbox, so everything the builder stores and validates leaves
 * through this one method as the plain record it already understands. Two
 * constructions with the same inputs must produce byte-identical records, which
 * is what keeps the same design compiling to the same frames.
 *
 * Utilities delegate to the engine functions that already compute their
 * answers. Reimplementing that arithmetic here would produce a second answer
 * that can disagree with the first, which is the failure mode the whole
 * one-owner rule exists to prevent.
 *
 * @evidence requirements/product/capability-and-content.md#product-project-owned-content Gives a project-authored performer, prop, place, or population one identity, portable design record, and shot contribution contract.
 * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Separates the source class used for authoring from the plain design and contribution outputs consumed by compilation.
 */
export abstract class AutoMovieSubject<TDesign> {
  /**
   * Stable identity this subject is cited by.
   *
   * @evidence requirements/product/capability-and-content.md#product-project-owned-content Requires every project-authored subject to expose the stable identity by which story, design, and shot records cite it.
   * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Takes subject identity from the authoring source instead of deriving it from class names or construction order.
   */
  public abstract readonly id: string;

  /**
   * The tracked record the builder reads, derived rather than transcribed.
   *
   * @evidence requirements/product/capability-and-content.md#product-project-owned-content Converts the project's subject construction into the plain tracked record that preserves its authored choices.
   * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Defines the portable design output that crosses from authoring classes into validation and compilation.
   */
  public abstract design(): TDesign;

  /**
   * What this subject puts into a shot.
   *
   * The context carries the builder-owned runtime facts a source cannot infer,
   * so a subject reads its model, skeleton, or formation runtime from there
   * rather than restating them.
   *
   * @evidence requirements/product/capability-and-content.md#product-project-owned-content Returns only the project-owned artifacts this subject adds to a shot, using builder context for runtime facts it cannot author.
   * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Defines the explicit contribution output through which source-authored content enters shot assembly.
   */
  public abstract render(
    context: IAutoMovieShotBuildContext,
  ): IAutoMovieSubjectContribution;
}
