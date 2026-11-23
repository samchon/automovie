import type { IAutoMovieLoftViewRead } from "../../../construction/IAutoMovieLoftViewRead";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanDigitWalk } from "../limb/IAutoMovieHumanDigitWalk";
import type { IAutoMovieHumanHandParent } from "./IAutoMovieHumanHandParent";

/**
 * Original parent section contacts, local material transfer and independently
 * qualified source jets. Runtime construction and admission remain with
 * AutoMovieHumanHandAttachment in Human.
 */
export namespace IAutoMovieHumanHandAttachment {
  /** One canonical geometric attachment and its explicit material-chart map. */
  export interface IConnection {
    /** Actual digit source name, shared with the construction tree and observer. */
    name: string;
    /** Whole final parent source, shared rather than reconstructed from a mesh. */
    parent: IAutoMovieHumanHandParent.IOutput;
    /** Unchanged anatomical MCP/CMC; this is not the skin closure datum. */
    joint: AutoMovieVector3Tuple;
    /**
     * Original joint's qualified normal coordinate; null is unavailable, not an
     * outside verdict.
     */
    jointSection: ISection | null;
    /** Skin closure inside the actual parent, on the same first-bone line. */
    root: AutoMovieVector3Tuple;
    /** Qualified actual parent normal section at that root. */
    section: ISection;
    /** Lower/upper palmar-depth chord at fixed parent radial +u, mm. */
    chordV: [number, number];
    /**
     * Actual parent intersections along the child's dorsal line, with explicit
     * geometric brackets.
     */
    dorsalChord: {
      /** Parent-surface boundary intersected by the negative dorsal ray. */
      lower: IEdge;
      /** Parent-surface boundary intersected by the positive dorsal ray. */
      upper: IEdge;
    };
    /** The child's own dorsal and breadth directions at its first straight bone. */
    childFrame: {
      /** Unit dorsal axis of the child's section chart in the registered frame. */
      u: AutoMovieVector3Tuple;
      /** Unit cross axis obtained from the dorsal axis and centre-line tangent. */
      v: AutoMovieVector3Tuple;
      /**
       * Unit direction of the child's first bone, from its proximal joint
       * toward its distal joint.
       */
      tangent: AutoMovieVector3Tuple;
    };
    /**
     * Actual parent-boundary rays in the four child-quarter bisector
     * directions.
     */
    quarterRays: [IEdge, IEdge, IEdge, IEdge];
    /**
     * Parent phase at each actual ray exit, including the root's local offset,
     * radians.
     */
    phases: Quarters;
    /** Parent quarter selected at each of those actual boundary points. */
    quarters: [number, number, number, number];
    /**
     * The root law holds its source readings; their pullback station
     * derivatives are zero.
     */
    parameterMap: {
      /** Parent's physical station at the attachment centre, millimetres. */
      parentStation: number;
      /**
       * Parent physical stations of the lower and upper dorsal chord endpoints,
       * millimetres.
       */
      depthStations: [number, number];
      /**
       * Parent physical station at each of the child's four quarter rays,
       * millimetres.
       */
      quarterStations: Quarters;
      /** Zero first derivative at the stationary native shoulder boundary. */
      first: 0;
      /** Zero second derivative at the stationary native shoulder boundary. */
      second: 0;
    };
    /**
     * Parent-derived positive base law, followed by the unchanged measured
     * shaft and joints.
     */
    proximal: IAutoMovieHumanDigitWalk.ISiteLaw & {
      /** Four effective source-quarter owners, in the child's engine chart. */
      shoulders: Quarters;
      /**
       * Authored pullback jets only when all original physical/frame jets are
       * available.
       */
      shoulderJets?: IAutoMovieViewPart.IQuarters<
        IAutoMovieViewPart.IKnot["jet"]
      >;
    };
    /** Original measured first-shaft law before the parent contact is attached. */
    measuredShaft: IAutoMovieHumanDigitWalk.ISiteLaw;
  }

  /** A qualified local original section and the point in its chart. */
  export interface ISection {
    /** A declared zero pole is a known point, not a positive native section. */
    kind: "regular" | "pole";
    /** Physical parent station, mm. */
    station: number;
    /** Actual parent plane and original scalar inputs at that station. */
    frame: Frame;
    /** Signed location in the parent +u(radial),+v(depth) chart, mm. */
    local: [number, number];
    /** Whole original four extents and effective quarter fullness. */
    values: IAutoMovieLoftViewRead.IValues;
    /** Available physical source2, or its actual named absence. */
    jets: IAutoMovieLoftViewRead.IJets | string;
    /** Actual axis jets; absence remains absence. */
    axisJet: ReturnType<NonNullable<IAutoMovieViewPart["axis"]["jet"]>> | null;
    /** Positive means the point lies inside the actual parent section, mm. */
    margin: number;
  }

  /** The actual original section plane, before any loft or mesh. */
  export type Frame = ReturnType<IAutoMovieViewPart["axis"]["at"]>;

  /**
   * A source-field boundary bracket; no absent parent coordinate becomes a
   * numeric value.
   */
  export interface IEdge {
    /** World direction in which the signed ordinate and bracket are expressed. */
    direction: AutoMovieVector3Tuple;
    /** Signed distance along that direction, mm. */
    ordinate: number;
    /** The actual inside and outside ray distances bracketing that boundary, mm. */
    bracket: [number, number];
    /**
     * Last actual inside parent section, including its own frame and available
     * jets.
     */
    inside: ISection;
    /** Qualified non-interior original reading, including a declared zero pole. */
    outside: ISection;
  }

  /** Four effective conic quarters in their declared material order. */
  export type Quarters = [number, number, number, number];

  /** A digit input retaining the same canonical connection consumed by its law. */
  export interface IAttached extends IAutoMovieHumanDigitWalk.IInput {
    /** Original parent, location, material map, fullness and jets. */
    attachment: IConnection;
  }
}
