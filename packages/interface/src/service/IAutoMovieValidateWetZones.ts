import type { IAutoMovieBuiltEnvironment } from "../architecture/IAutoMovieBuiltEnvironment";
import type { IAutoMovieServiceNetwork } from "./IAutoMovieServiceNetwork";

/** Typed wet-zone declarations checked against building boundaries and service drain nodes. */
export namespace IAutoMovieValidateWetZones {
  /**
   * Typed wet-zone declarations checked against building boundaries and service drain nodes.
   *
   * This is the half of building services a frame is worst at showing. A tiled
   * room with a gully in it renders identically whether the membrane reaches the
   * walls or stops at the screed, whether the floor falls toward the gully or
   * away from it, and whether the sleeve carrying a pipe through the tanking was
   * made good. Those are the facts a leak is found in, so they are stated and
   * checked here rather than inferred from a look.
   *
   * The zone owns no geometry of its own on purpose. Its extent is the
   * architecture's logical space, its membrane is that space's own boundaries,
   * and its drains are the service network's nodes, so a zone can disagree with
   * neither. What it adds is the obligations those three cannot state alone: that
   * a wet region is covered everywhere water can reach, that every handover to a
   * drier region is declared, that the floor actually falls, and that it falls to
   * a drain that really discharges waste.
   * Slope and membrane upturn are declared scalars; this gate does not measure
   * an actual floor gradient or infer waterproof construction from mesh geometry.
   *
   * @evidence contracts/development/design.md#principled-representation Declared upturn is nonnegative metres and floor slope is a nonnegative ratio; validateWetZones checks identities, grades, coverage, thresholds and drainage references.
   * @evidence contracts/development/design.md#minimal-and-owned-surface lowerServiceNetwork invokes this separate zone gate beside network admission; both read the same network and served built environment.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The gate reads declarations rather than measuring floor gradients or membrane construction; an empty zone array succeeds and typed graph structure remains a premise.
   * @evidence contracts/development/common.md#meaningful-documentation Typed wet-zone declarations checked against building boundaries and service drain nodes. Declared upturn is nonnegative metres and floor slope is a nonnegative ratio; validateWetZones checks identities, grades, coverage, thresholds and drainage references.
   */
  export type IProps = {
    /** Borrowed graph containing wet zones, drain nodes and systems; no zones produces a successful empty validation. */
    network: IAutoMovieServiceNetwork;

    /** Borrowed building whose logical spaces and bounding boundaries define zone coverage; no geometry is inferred from meshes. */
    environment: IAutoMovieBuiltEnvironment;
  };
}
