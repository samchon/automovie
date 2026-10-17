import type { IAutoMovieCurve64 as C } from "@automovie/engine";

import type { IAutoMovieFaceMeasurements as M } from "./IAutoMovieFaceMeasurements";

/** Auricular posterior/superior/outward chart dimensions and semantic cartilage courses; these inputs describe curves rather than a closed skin or cavity.
 *
 * @author Samchon
 */
export namespace IAutoMovieFaceEarMeasurements {
  /** Dimensionless posterior/height/outward coordinates. Cartilage features use helix breadth, helix height and protrusion; concha features use their own dimensions.
   *
   * @author Samchon
   */
  export interface EarRatio {
    /** Posterior chart coordinate divided by the feature's breadth scale. */
    posteriorRatio: number;

    /** Superior chart coordinate divided by the feature's height scale. */
    heightRatio: number;

    /** Outward chart coordinate divided by the feature's depth scale. */
    depthRatio: number;
  }

  /** One bowed cubic between named auricular supports; bow is the intended midpoint displacement from the endpoint chord.
   *
   * @author Samchon
   */
  export interface EarArc {
    /** Start support in the feature's normalized posterior/height/outward chart. */
    start: EarRatio;

    /** End support in the same chart; adjoining arcs share an endpoint after construction. */
    end: EarRatio;

    /** Midpoint displacement from the straight chord, in the same normalized chart. Cubic handles receive 4/3 of this displacement. */
    bow: EarRatio;
  }

  /** Inclined auricular course sampled into four Hermite cubics, with cubic depth interpolation across the entire signed phase interval.
   *
   * @author Samchon
   */
  export interface EarOval {
    /** Full posterior-chart ellipse breadth, mm. */
    breadthMm: number;

    /** Full superior-chart ellipse length, mm. */
    lengthMm: number;

    /** Course-center posterior coordinate divided by whole helix breadth. */
    centerPosteriorRatio: number;

    /** Course-center Y coordinate divided by whole helix height; lobule positioning may supply an overriding center. */
    centerHeightRatio: number;

    /** Degrees rotating ellipse posterior/Y coordinates within the auricular plane. */
    inclinationDeg: number;

    /** Start angle in radians; signed end-start determines traversal direction. */
    startPhase: number;

    /** End angle in radians; equal endpoints are degenerate and are not repaired by the emitter. */
    endPhase: number;

    /** Four normalized outward depths at interval fractions 0, 1/3, 2/3 and 1, named superior/posterior/inferior/anterior. */
    depthRatios: Record<
      "superior" | "posterior" | "inferior" | "anterior",
      number
    >;

    /** Optional mm depth scale; omission uses the enclosing ear protrusion. Concha cartilage feature arcs require an explicit depth scale. */
    depthMm?: number;
  }

  /** Semantic open cartilage/support courses emitted separately from the helix, concha rim, lobule and conventional insertion. */
  export type EarFeature =
    | "antihelix.stem"
    | "antihelix.superiorCrus"
    | "antihelix.inferiorCrus"
    | "concha.floorCourse"
    | "concha.divider"
    | "tragus.visibleFold"
    | "notch.visibleValley"
    | "antitragus.crest"
    | "attachment.visiblePosteriorBlend";

  /** Dimensioned auricle in a posterior/superior/outward chart. Rotation maps it to subject coordinates; insertion remains a separate conventional closed course.
   *
   * @author Samchon
   */
  export interface Ear {
    /** Auricular origin in native mm before parentFrame translation, normally the actual tragion proxy. */
    originLocalMm: C.Vector;

    /** Yaw in degrees mapping posterior and outward axes into native X/Z, mirrored by anatomical side. */
    rotationDeg: number;

    /** Superior scale of the sinusoidal helix, mm; distinct from the final ear length including lobule. */
    helixHeightMm: number;

    /** Full posterior scale of the helix, mm; not automatically the clinical otobasion-to-margin breadth. */
    breadthMm: number;

    /** Scale of outward helix depths, mm; not a measured helix-to-scalp clearance. */
    protrusionMm: number;

    /** Dimensionless modulation of helix breadth by sin(theta). */
    inferiorTaperRatio: number;

    /** Dimensionless posterior lean multiplied by helix breadth and sin(theta). */
    crownLeanRatio: number;

    /** Helix initial phase in radians, followed by fixed family support phases. */
    helixStartPhase: number;

    /** Helix final phase in radians; the existing family includes intermediate phases pi/2, 0.15 and -0.85. */
    helixTailPhase: number;

    /** Four normalized outward depths interpolated over the complete helix phase interval, not per span. */
    helixDepthRatios: Record<
      "anterior" | "superior" | "posterior" | "tail",
      number
    >;

    /** Named bowed cartilage courses; branch and valley endpoints are reanchored after local construction. */
    features: Record<
      EarFeature,
      {
        /** Ordered feature arcs. Adjacent handle offsets are averaged to share the same local cubic derivative. */
        arcs: readonly EarArc[];
      }
    >;

    /** Open inclined conchal rim course with its own breadth, length and depth scale. */
    concha: EarOval;

    /** Free-edge dimensions. The complete course is constructed between the actual helix tail and lower attachment through a common inferior support, rather than moving endpoints of an unrelated ellipse. */
    lobule: {
      /** Full posterior/anterior support breadth, mm, centered between the two actual attachment endpoints. */
      breadthMm: number;

      /** Superior/inferior lobular scale, mm; one quarter locates the two rounded lower shoulders above the inferior datum. This allocation is conventional. */
      lengthMm: number;

      /** Inferior and shoulder outward depth divided by the ear protrusion scale. */
      depthRatio: number;
    };

    /** Vertical distance from helix reference h/2 to the inferior lobule support, mm. This authored datum is distinct from a validated clinical ear-length measurement. */
    earLengthMm: number;

    /** Full vertical extent of the separate conventional insertion ellipse, mm. */
    insertionLengthMm: number;

    /** Full Z extent of the conventional insertion ellipse, mm; it is not the observed open posterior blend. */
    insertionBreadthMm: number;

    /** Native mm center of the insertion before parentFrame translation; insertion controls do not use auricle yaw. */
    insertionCenterLocalMm: C.Vector;
  }

  /** Bilateral auricular curves sharing one additional native translation.
   *
   * @author Samchon
   */
  export interface Ears {
    /** Translation inherited from head-child longitudinal registration; it adds to each ear origin. */
    parentFrame: {
      /** Additional native mm translation applied to auricle and insertion controls. */
      originMm: C.Vector;
    };

    /** Independent anatomical-side dimensions and cartilage courses. */
    ears: Record<M.Side, Ear>;
  }
}
