import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieCompiledFormationLod } from "./IAutoMovieCompiledFormationLod";
import type { IAutoMovieModelLod } from "./IAutoMovieModelLod";

/**
 * Representation inputs and output shared by formation and instance-prototype
 * compilation.
 */
export namespace IAutoMovieCompiledPopulationRepresentation {
  /**
   * Borrowed model inventory, applicable tiers and radius estimates for
   * compiling one population prototype.
   *
   * A formation's anonymous members and each prototype of an instance set are
   * drawn the same way: through the tiers the population design declares, or
   * through one `near` tier of the base model group when it declares none, each
   * bound to its model group digest and runtime model id. The member radius is
   * the largest radius over those tiers, where a tier whose group has no known
   * radius borrows the base group's, and one with neither is half a metre; no
   * member is ever smaller than a centimetre for projection. The kernel does
   * not verify supplied estimates against geometry; the fallback is an estimate
   * for missing geometry, and any enclosure proof belongs to the host.
   *
   * Radii are supplied by the host, which measures its own model groups and
   * adopted proxies, so this reads a table and never inspects geometry.
   *
   * The caller chooses which declared tiers apply: a formation's anonymous
   * batch drops the `hero` tier, which is drawn by named nodes, while an
   * instance set has no heroes and keeps every tier. The helper reads these
   * borrowed tables for this call and retains no cache.
   */
  export type IProps = {
    /**
     * Base model-group ID used for the implicit near tier and as the second
     * radius lookup.
     */
    model: string;

    /**
     * Applicable tiers in declared order. Empty generates one near tier with
     * the base model and no maximum distance. Formation callers remove hero
     * tiers before passing this list.
     */
    tiers: readonly IAutoMovieModelLod[];

    /**
     * Borrowed model groups keyed by authored group ID. Missing or unencodable
     * models produce distinct marker digests; neither marker proves valid model
     * content.
     */
    models: ReadonlyMap<string, IAutoMovieModel>;

    /**
     * Borrowed root-centred model-space radius estimates in metres by group ID.
     * Missing tier values use the base value then 0.5 m; supplied NaN or
     * infinity is not rejected here.
     */
    projectionRadii: ReadonlyMap<string, number>;
  };

  /**
   * Fresh compiled tier records and the representative radius used for
   * population projection and framing.
   */
  export type IResult = {
    /**
     * Caller-owned array of fresh tier records in input order, or the single
     * implicit near tier. Each carries the referenced group's digest and
     * derived runtime model ID.
     */
    lod: IAutoMovieCompiledFormationLod[];

    /**
     * Maximum tier estimate after tier/base/0.5 m fallback, with a 0.01 m floor
     * for finite inputs. No measurement or enclosure verification occurs in
     * this operation.
     */
    projectionRadius: number;
  };
}
