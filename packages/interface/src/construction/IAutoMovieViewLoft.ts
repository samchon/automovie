import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";
import type { IAutoMovieLoftContract } from "./IAutoMovieLoftContract";
import type { IAutoMovieLoftFrame } from "./IAutoMovieLoftFrame";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";
import type { IAutoMovieViewChain } from "./IAutoMovieViewChain";
import type { IAutoMovieViewSection } from "./IAutoMovieViewSection";

/**
 * Published geometry, admitted station sections and diagnostics from a view loft.
 *
 * @evidence contracts/development/design.md#principled-representation The result distinguishes a usable chain, separately qualified solid surface and local sections retained after partial admission failures.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieViewLoft.create publishes these records for construction and section inspection without requiring a renderer or diagnostic exception class.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Null final geometry does not erase admitted sections, and continuity labels do not certify a collapsed pole's physical station derivatives.
 * @evidence contracts/development/common.md#meaningful-documentation The records define station/world units, ownership, diagnostic/null meanings and phase/station continuity limits.
 */
export namespace IAutoMovieViewLoft {
  /**
     * View loft outcome, including admitted sections when final geometry fails.
     *
     * Input/preparation failures return null geometry and diagnostics; station-level failures can retain sections for inspection. A direct source with any skipped station is not published as a partial chain. Generic girth can still publish from at least two surviving stations. Foreign axis callbacks can throw rather than returning a result. Result arrays are mutable and call-owned; frames/source records can be shared with the chain, so preserve them while any surface or sampler retains that chain.
     *
     * @evidence contracts/development/design.md#principled-representation Separates the final loft chain/surface from admitted sections, source diagnostics and the declared phase/station continuity.
     * @evidence contracts/development/design.md#minimal-and-owned-surface Nullable final geometry and retained sections/diagnostics express partial and total admission failures.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts A missing chain remains null; surviving sections are not described as the complete original source curve.
     * @evidence contracts/development/common.md#meaningful-documentation Members state null cases, section identity and continuity.
     */
    export interface IResult {
      /** Loft chain including declared reliefs and ring phases, or null on failed final admission. A non-null chain can still have diagnostics or no qualified solid surface. */
      chain: IAutoMovieLoftChain | null;
  
      /** Regular surface for merge/diff, null for an absent chain, unavailable physical2 or failed anchor admission. */
      surface: IAutoMovieSolidSurface | null;
  
      /** Surviving four-quarter sections in increasing physical station order, including inserted cap rings and excluding collapsed pole stations. Empty on early failure; retained even if later chain construction fails. */
      sections: IAutoMovieViewLoft.IStation[];
  
      /** Surviving conic-chain sections in increasing physical station order for touch, split or piece-list sources; empty when none survive or the ordinary four-quarter representation applies. */
      chains: IAutoMovieViewLoft.IChainStation[];
  
      /** Collected numerical admission failures in encounter order; empty means no reported failure, not a proof of every geometric invariant. Callback exceptions can escape without becoming entries. */
      diagnostics: IAutoMovieLoftContract.IDiagnostic[];
  
      /** Declared continuity of the chosen construction, not a numeric certificate at every point or a geometric G2 claim at a pole. The default C2/C2 object is shared across results, including early failures; consumers must preserve it. */
      continuity: {
        /** C2 for ordinary four-quarter sections; a successfully published chain with conic-chain stations reports C1 because its joins can have sided second phase partials. Failure results retain the default C2 label even when partial chain stations survive. */
        phase: "C2" | "C1";

        /** C2 over regular physical stations for ordinary sections, conservatively C1 for a successfully published chain with moving conic-chain joins. Failure results retain the default C2 label; no label asserts finite station derivatives at a collapsed pole. */
        station: "C2" | "C1";
      };
    }

  /**
     * One emitted station.
     *
     * @evidence contracts/development/design.md#principled-representation Stores one admitted section with its station and actual input plane, before final coefficient/frame interpolation.
     * @evidence contracts/development/design.md#minimal-and-owned-surface Station, frame and section preserve the section owner's inputs and result.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts Does not claim an emitted section exists at a failed station or closing pole.
     * @evidence contracts/development/common.md#meaningful-documentation Members distinguish source station units, plane and admitted section.
     */
    export interface IStation {
      /** Physical station in millimetres; equal to world height only for a horizontal height-aligned axis. */
      station: number;
  
      /** Actual axis.at(station) frame retained without cloning: world-mm origin and dimensionless local u/v axes. Preserve it while the resulting chain/surface uses the same frame data. */
      frame: IAutoMovieLoftFrame.IFrame;
  
      /** Admitted four-quarter section in local millimetres, used to generate compatibility spline coefficients and retained for guide/curvature inspection. */
      section: IAutoMovieViewSection.ISection;
    }

  /**
     * One emitted chain station.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Members distinguish source station units, plane and the chain with its join curvatures.
     * @evidence contracts/development/design.md#principled-representation Stores one admitted conic chain with its physical station and exact input plane.
     * @evidence contracts/development/design.md#minimal-and-owned-surface The loft result exposes its split station to the compatibility layer and inspection alongside ordinary section stations.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts Only an admitted chain is stored and its individual arc geometry remains available.
     */
    export interface IChainStation {
      /** Physical station in millimetres, in the same coordinate as the source outlines and axis. */
      station: number;
  
      /** Actual axis.at(station) frame retained without cloning: world-mm origin and dimensionless local u/v axes. Its owner must preserve the value while published geometry retains it. */
      frame: IAutoMovieLoftFrame.IFrame;
  
      /** Admitted local conic chain, including guide contacts and declared splits; its arc joins may be only G1 even when individual arcs have second derivatives. */
      chain: IAutoMovieViewChain.ISection;
    }
}
