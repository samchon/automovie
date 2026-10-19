import type {
  IAutoMovieBicubicAtlasGeometry,
  AutoMovieHumanoidBone,
} from "@automovie/interface";
import type { IAutoMovieCurve64 as C } from "@automovie/engine";

import type { AutoMovieHumanPart } from "../junction/AutoMovieHumanPart";
import type { AutoMovieHumanSide } from "../junction/AutoMovieHumanSide";
import type { IAutoMovieHumanSkinDomain } from "../junction/IAutoMovieHumanSkinDomain";

/**
 * One person's generated rest field and its actual downstream ownership.
 * Exact coefficients use the one admitted skeleton and physical measurements;
 * the public atlas alone converts them to metres. Construction, UV packing,
 * rig candidates and attachment charts refer to these same patch identities.
 * Observation meshes and per-person recovered controls are not inputs.
 *
 * Polynomial patches carry explicit approximation and continuity qualifications.
 * A canonical position edge is not by itself a C1 or embedding certificate.
 * This definition owns no tessellated mesh, GPU object or appearance asset.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanSurfaceDefinition {
  /** Formula/topology revision, independent of the identity and tessellation. */
  revision: string;

  /** Complete generated coefficients in the public core's metre convention. */
  atlas: IAutoMovieBicubicAtlasGeometry;

  /** Exact patch ownership; every atlas patch has exactly one record. */
  patches: ReadonlyMap<string, IAutoMovieHumanSurfaceDefinition.Patch>;

  /** Generating restrictions evaluated from the same polynomial field. */
  courses: readonly IAutoMovieHumanSurfaceDefinition.Course[];

  /** Physical owner cuts, including missing incident charts of a partial layout. */
  boundaries: readonly IAutoMovieHumanSurfaceDefinition.Boundary[];

  /** Scoped measurement, numerical and unsupported-region qualifications. */
  qualifications: readonly string[];
}

/** Semantic owners refer to generated charts, never packed UV rectangles. */
export namespace IAutoMovieHumanSurfaceDefinition {
  /**
   * One named cut with the actual positional and transverse derivative owner.
   * Missing incident regions remain openings; matching coordinates do not supply
   * an undeclared neighbor. Full jets use the stated longitudinal millimetres.
   *
   * @author Samchon
   */
  export interface Boundary {
    /** Stable anatomical cut name. */
    id: string;

    /** Same generated cubic section consumed by the incident surface patches. */
    curve: C.Cubic;

    /** Complete world-vector dP/ds controls, with s in millimetres. */
    fullJ: readonly C.Span[];

    /** Physical direction of increasing s in the shared model frame. */
    longitudinalAxis: C.Vector;

    /** Actual incident chart names and explicitly unimplemented neighbors. */
    incidents: readonly { chart: string; status: "generated" | "missing" }[];
  }

  /** One exterior patch's anatomical and rendering consumers.
   *
   * @author Samchon
   */
  export interface Patch {
    /** Anatomical region of the one common rest field. */
    part: AutoMovieHumanPart;

    /** Subject side; null for a median region. */
    side: AutoMovieHumanSide | null;

    /** Stable branch identity, such as a named digit; null on a main chart. */
    branch: string | null;

    /** Actual source tissue role transported to each emitted triangle. */
    skinRole: IAutoMovieHumanSkinDomain.Role;

    /** Skeletal support candidates for the shared physical weight field. */
    bones: readonly AutoMovieHumanoidBone[];

    /** Fixed profile packing rectangle [u0,v0,u1,v1], independent of geometry. */
    textureRectangle: readonly [number, number, number, number];

    /** Semantic [v-seam,u] head addresses at patch corners [(0,0),(1,0),(1,1),(0,1)], or null outside the head; separate from packed UV0. */
    headChart: readonly [
      readonly [number, number],
      readonly [number, number],
      readonly [number, number],
      readonly [number, number],
    ] | null;
  }

  /** A field restriction with its actual surface consumer and physical chart.
   *
   * @author Samchon
   */
  export interface Course {
    /** Semantic construction identity. */
    name: string;

    /** Exact generated millimetre curve; phase widths travel with it. */
    curve: C.Cubic;

    /** Named incident exterior patches; empty only for an explicit internal support. */
    patches: readonly string[];

    /** Role distinguishes exterior restrictions from internal skeletal support. */
    role: "section" | "boundary" | "guide" | "feature" | "internal-support";

    /** Region identity used to group inspection without creating a second model. */
    part: AutoMovieHumanPart;

    /** Subject side, or null for a median course. */
    side: AutoMovieHumanSide | null;
  }
}
