import type { IAutoMovieLoftViewRead } from "../../../construction/IAutoMovieLoftViewRead";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanDigitWalk } from "../limb/IAutoMovieHumanDigitWalk";
import type { IAutoMovieHumanHandParent } from "./IAutoMovieHumanHandParent";

/**
 * Original parent section contacts, local material transfer and independently qualified source jets. Runtime construction and admission remain with AutoMovieHumanHandAttachment in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes original parent section contacts, local material transfer and independently qualified source jets; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Original parent section contacts, local material transfer and independently qualified source jets. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanHandAttachment; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing HandAttachment contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
export namespace IAutoMovieHumanHandAttachment {
  /** One canonical geometric attachment and its explicit material-chart map.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One canonical geometric attachment and its explicit material-chart map.
   * @evidence contracts/development/design.md#principled-representation `name`: Actual digit source name, shared with the construction tree and observer. `parent`: Whole final parent source, shared rather than reconstructed from a mesh. `joint`: Unchanged anatomical MCP/CMC; this is not the skin closure datum.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanBodyLane.handAttachments, AutoMovieHumanHandAttachment.dorsalChord.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `name`, `parent`, `joint`, `jointSection`, `root`, `section`, `chordV`, `dorsalChord`, `childFrame`, `quarterRays`, `phases`, `quarters`, `parameterMap`, `proximal`, `measuredShaft`; callers supply the complete record.
   */
  export interface IConnection {
    /** Actual digit source name, shared with the construction tree and observer. */
    name: string;
    /** Whole final parent source, shared rather than reconstructed from a mesh. */
    parent: IAutoMovieHumanHandParent.IOutput;
    /** Unchanged anatomical MCP/CMC; this is not the skin closure datum. */
    joint: AutoMovieVector3Tuple;
    /** Original joint's qualified normal coordinate; null is unavailable, not an outside verdict. */
    jointSection: ISection | null;
    /** Skin closure inside the actual parent, on the same first-bone line. */
    root: AutoMovieVector3Tuple;
    /** Qualified actual parent normal section at that root. */
    section: ISection;
    /** Lower/upper palmar-depth chord at fixed parent radial +u, mm. */
    chordV: [number, number];
    /** Actual parent intersections along the child's dorsal line, with explicit geometric brackets. */
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
      /** Unit direction of the child's first bone, from its proximal joint toward its distal joint. */
      tangent: AutoMovieVector3Tuple;
    };
    /** Actual parent-boundary rays in the four child-quarter bisector directions. */
    quarterRays: [IEdge, IEdge, IEdge, IEdge];
    /** Parent phase at each actual ray exit, including the root's local offset, radians. */
    phases: Quarters;
    /** Parent quarter selected at each of those actual boundary points. */
    quarters: [number, number, number, number];
    /** The root law holds its source readings; their pullback station derivatives are zero. */
    parameterMap: {
      /** Parent's physical station at the attachment centre, millimetres. */
      parentStation: number;
      /** Parent physical stations of the lower and upper dorsal chord endpoints, millimetres. */
      depthStations: [number, number];
      /** Parent physical station at each of the child's four quarter rays, millimetres. */
      quarterStations: Quarters;
      /** Zero first derivative at the stationary native shoulder boundary. */
      first: 0;
      /** Zero second derivative at the stationary native shoulder boundary. */
      second: 0;
    };
    /** Parent-derived positive base law, followed by the unchanged measured shaft and joints. */
    proximal: IAutoMovieHumanDigitWalk.ISiteLaw & {
      /** Four effective source-quarter owners, in the child's engine chart. */
      shoulders: Quarters;
      /** Authored pullback jets only when all original physical/frame jets are available. */
      shoulderJets?: IAutoMovieViewPart.IQuarters<
        IAutoMovieViewPart.IKnot["jet"]
      >;
    };
    /** Original measured first-shaft law before the parent contact is attached. */
    measuredShaft: IAutoMovieHumanDigitWalk.ISiteLaw;
  }

  /** A qualified local original section and the point in its chart.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A qualified local original section and the point in its chart.
   * @evidence contracts/development/design.md#principled-representation `kind`: A declared zero pole is a known point, not a positive native section. `station`: Physical parent station, mm. `frame`: Actual parent plane and original scalar inputs at that station.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHandAttachment.locate. Read by chord, edge.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `kind`, `station`, `frame`, `local`, `values`, `jets`, `axisJet`, `margin`; callers supply the complete record.
   */
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

  /** The actual original section plane, before any loft or mesh.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The actual original section plane, before any loft or mesh.
   * @evidence contracts/development/design.md#principled-representation The actual original section plane, before any loft or mesh. ReturnType<IAutoMovieViewPart["axis"]["at"]> retains the referenced owner's constraints and mutability.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanHandAttachment.Frame is the canonical exchange used by IAutoMovieHumanHandAttachment.ISection.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by IAutoMovieHumanHandAttachment.ISection for the actual original section plane, before any loft or mesh.
   */
  export type Frame = ReturnType<IAutoMovieViewPart["axis"]["at"]>;

  /** A source-field boundary bracket; no absent parent coordinate becomes a numeric value.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A source-field boundary bracket; no absent parent coordinate becomes a numeric value.
   * @evidence contracts/development/design.md#principled-representation `direction`: World direction in which the signed ordinate and bracket are expressed. `ordinate`: Signed distance along that direction, mm. `bracket`: The actual inside and outside ray distances bracketing that boundary, mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by edge.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `direction`, `ordinate`, `bracket`, `inside`, `outside`; callers supply the complete record.
   */
  export interface IEdge {
    /** World direction in which the signed ordinate and bracket are expressed. */
    direction: AutoMovieVector3Tuple;
    /** Signed distance along that direction, mm. */
    ordinate: number;
    /** The actual inside and outside ray distances bracketing that boundary, mm. */
    bracket: [number, number];
    /** Last actual inside parent section, including its own frame and available jets. */
    inside: ISection;
    /** Qualified non-interior original reading, including a declared zero pole. */
    outside: ISection;
  }

  /** Four effective conic quarters in their declared material order.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Four effective conic quarters in their declared material order.
   * @evidence contracts/development/design.md#principled-representation Four effective conic quarters in their declared material order. Ordered tuple slots are 0, 1, 2, 3; fixed arity preserves their correspondence.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanHandAttachment.phases, AutoMovieHumanHandAttachment.shoulders.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanHandAttachment.phases, AutoMovieHumanHandAttachment.shoulders, AutoMovieHumanHandAttachment.attachment for four effective conic quarters in their declared material order.
   */
  export type Quarters = [number, number, number, number];

  /** A digit input retaining the same canonical connection consumed by its law.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A digit input retaining the same canonical connection consumed by its law.
   * @evidence contracts/development/design.md#principled-representation `attachment`: Original parent, location, material map, fullness and jets.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHandAttachment.attach.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `attachment`; callers supply the complete record.
   */
  export interface IAttached extends IAutoMovieHumanDigitWalk.IInput {
    /** Original parent, location, material map, fullness and jets. */
    attachment: IConnection;
  }
}
