import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieConstructionPortLoop } from "../../../construction/IAutoMovieConstructionPortLoop";
import type { IAutoMovieHumanConicLoft } from "../conic/IAutoMovieHumanConicLoft";
import type { IAutoMovieHumanSegmentFrame } from "../frame/IAutoMovieHumanSegmentFrame";

/**
 * The anatomical sites that native F1 calibration reads and carries.
 */
export namespace IAutoMovieHumanF1NativeSites {
  /**
   * The reference run that carries a measurement site.
   */
  export interface IRun {
    /** The run's first end: a course centre or segment origin by name. */
    from: string;

    /** The run's last end. */
    to: string;

    /** The run's index among the course's runs. */
    index: number;

    /** `(s - start) / (end - start)` on the reference course. */
    tau: number;
  }

  /**
   * A measurement on a family's physical course.
   */
  export interface ISite {
    /** The family whose course holds the site. */
    family: "trunk" | "arm" | "hand" | "leg";

    /** The site's course station, mm, arclength from the course's first centre. */
    station: number;

    /** The written definition the station is read by, with its standard. */
    definition: string;

    /** `definition`: read by its definition on the reference; `provisional`: f1's authored station of an unreadable definition. */
    basis: "definition" | "provisional";

    /** The run that carries the site to another person. */
    run: IRun;

    /** The bind segment whose length or frame carries the run (`SEGMENTS`), by its chain name. */
    segment: string;
  }

  /**
   * A representative digit's material station and landmark definition.
   */
  export interface IDigitSite {
    /** The digit family whose course holds the site, by its name. */
    family: string;

    /** The site's station on that course, mm, arclength from its first centre (the digit's first joint). */
    station: number;

    /** The written definition the station is read by. */
    definition: string;
  }

  /**
   * The organized native caliper sites and their course runs.
   */
  export interface ISites {
    /** The trunk's wall sites, the trunk course's stations. */
    wall: Record<"hip" | "omphalion" | "underbust" | "bust" | "neck" | "head", ISite>;

    /** The arm's sites on its course; the wrist lies on the hand family's domain of the same course. */
    arm: Record<"upperArm" | "elbow" | "forearm" | "wrist", ISite>;

    /** The leg's sites on its course. */
    leg: Record<"thigh" | "knee" | "calf" | "ankle", ISite>;

    /** The hand's metacarpal site on the hand family and the foot's ball site on the leg family. */
    extremities: Record<"hand" | "foot", ISite>;

    /**
     * The representative finger's and toe's caliper sites, each a station of that digit's own course, mm. A digit's girth has no field of
     * its own yet (one finger and one toe stand for theirs), so the site is the representative digit's; the station is a material
     * station of the digit's course and is carried to a person by that course's own map.
     */
    digits: Record<"finger" | "toe", IDigitSite>;

    /** The run ends of each course, mm: trunk by segment origins, limbs by course centres. */
    runs: Record<"trunk" | "arm" | "hand" | "leg", number[]>;

    /** The blend window's half length at each interior run end of each course, mm (`windows`); absent, every window is zero. */
    windows?: Record<"trunk" | "arm" | "hand" | "leg", number[]>;
  }

  /**
   * The assembly fields that define the native measurement sites.
   */
  export interface IInput {
    /** Every segment's frame at the pose, in the figure's frame. */
    frames: ReadonlyMap<string, IAutoMovieHumanSegmentFrame>;

    /** A stored datum in the figure's frame, mm. */
    point: (name: string) => AutoMovieVector3Tuple;

    /** The families whose courses hold sites. */
    body: Record<"trunk" | "arm" | "hand" | "leg" | "breast", IAutoMovieHumanConicLoft.IFamily>;

    /** The breast's port loops on the trunk's chart (`AutoMovieHumanF1RootControls.breast`); the first is the stored side's. */
    roots: { breast: readonly IAutoMovieConstructionPortLoop[] };

    /** The representative finger's and toe's families, the digits whose calipers stand for their hand's and foot's digits. */
    digits: Record<"finger" | "toe", IAutoMovieHumanConicLoft.IFamily>;
  }
}
