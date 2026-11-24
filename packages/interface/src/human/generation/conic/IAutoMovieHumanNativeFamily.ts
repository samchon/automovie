import type { AutoMovieVector2Tuple } from "../../../geometry/AutoMovieVector2Tuple";
import type { IAutoMovieLoftRelief } from "../../../construction/IAutoMovieLoftRelief";
import type { IAutoMovieViewAxis } from "../../../construction/IAutoMovieViewAxis";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { IAutoMovieHumanConicLoft } from "./IAutoMovieHumanConicLoft";
import type { IAutoMovieHumanNativeControlLaw } from "./IAutoMovieHumanNativeControlLaw";
import type { IAutoMovieHumanNativeScaleProfile } from "./IAutoMovieHumanNativeScaleProfile";
import type { IAutoMovieHumanNativeSourceAuthority } from "./IAutoMovieHumanNativeSourceAuthority";

/**
 * An invocation's native conic family inputs.
 */
export namespace IAutoMovieHumanNativeFamily {
  /**
   * One invocation's original controls, axis, material addresses and directional tissue law.
   */
  export interface ISpec {
    /** Accepted normalized family controls, before the new skeleton placement. */
    original: IAutoMovieHumanConicLoft.IFamily;
    /** The same family's skeleton-placed local inputs, before native skin-root generation. */
    bone: IAutoMovieHumanConicLoft.IFamily;
    /** Actual original native controls for this invocation, with both reflected clocks. */
    originals: ReadonlyMap<string, IAutoMovieViewPart>;
    /** Explicit complete source/cap binding; absence retains the existing family producer. */
    authority?: IAutoMovieHumanNativeSourceAuthority.ISpec;
    /** New original course and complete section planes. */
    axis: IAutoMovieViewAxis.IAxis;
    /**
     * Positive directional chart scales in original material station, +u/-u and +v/-v. A scale from AutoMovieHumanNativeScaleProfile
     * carries its station 2-jet and is applied to the source function, a(s)·f(s); a plain function scales the family's knot controls only.
     */
    scale: (station: number) => AutoMovieVector2Tuple;
    /**
     * The line the scale holds still, in each section's chart: every coordinate becomes c(s) + a(s)·(f(s) - c(s)). Absent, the scale
     * acts about the course point. The consumer chooses the line; it needs a jet-carrying scale and stands on the course at a closing
     * pole whose ratio is not 1.
     */
    centre?: IAutoMovieHumanNativeScaleProfile.ICentre;
    /** Address/knot map in physical mm, not asserted a C2 surface pullback. */
    station: (station: number) => number;
    /** Once-resolved complete native feature definitions, shared with the root target. */
    features: IAutoMovieLoftRelief[];
    /** Complete native root/head targets under their distinct exact source contracts; null declares none. */
    protection: readonly {
      sources: ReadonlyMap<string, IAutoMovieViewPart>;
      requirement: IAutoMovieHumanNativeControlLaw.IProtection;
    }[];
  }
}
