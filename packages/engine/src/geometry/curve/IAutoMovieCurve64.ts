/**
 * Binary64 curve coefficients, rigid frames and boundary publication records. Spatial positions are millimetres; display sampling and anatomical semantics belong to consumers.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each representation documents its chart, units and separate runtime admission.
 * @evidence contracts/development/design.md#principled-representation Represents Binary64 curve coefficients, rigid frames and boundary publication records: companion namespace of 13 members (`Vector`, `Matrix`, `Span`, `Cubic`, `Oval`, `PieceMetadata`, ...); units and frames named in its text: frame, local, world, degree, second. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IAutoMovieCurve64` in packages/engine/src/geometry/curve/IAutoMovieCurve64.ts; its surface is the 13 members listed and the text shows 120 other files naming it, mostly packages/recovery (75), packages/engine (25), test (17), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace IAutoMovieCurve64 {
  /**
   * Three ordered binary64 components; enclosing positions use millimetres, while axes and physical derivative fields state their own units.
   *
   * @evidence contracts/development/design.md#principled-representation A fixed tuple preserves component order without converting its enclosing coordinate chart.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One shared coordinate tuple also serves direction and derivative records with explicitly documented units.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The type does not normalize, clamp or certify finite values; runtime admission owns those checks.
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes enclosing physical units from dimensionless axis components.
   */
  export type Vector = readonly [number, number, number];

  /**
   * Three rotation rows between the charts stated by the enclosing record; proper rigid admission belongs to the parent context.
   *
   * @evidence contracts/development/design.md#principled-representation Row vectors match the context direction dot products and column-major matrix conversion.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A three-row tuple exposes rotation storage; Frame states the input local-to-parent convention and context snapshots state resolved world meaning.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts This structural type alone accepts nonorthogonal numbers; context construction checks the rigid premise.
   * @evidence contracts/development/common.md#meaningful-documentation States row storage, enclosing chart authority and the separate admission owner.
   */
  export type Matrix = readonly [Vector, Vector, Vector];

  /**
   * Four cubic Bernstein coefficients in P0, P1, P2, P3 order, in the enclosing field units; P1 and P2 are handles rather than interpolated samples.
   *
   * @evidence contracts/development/design.md#principled-representation Four ordered controls are the complete degree-three Bernstein coefficient field.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The same tuple shape represents position controls and their longitudinal first variation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The alias neither fits sampled points nor claims a regular or nonintersecting cubic.
   * @evidence contracts/development/common.md#meaningful-documentation Names the coefficient order, handle meaning and enclosing field units.
   */
  export type Span = readonly [Vector, Vector, Vector, Vector];

  /**
   * Piecewise cubic position coefficients in millimetres, with positive piece widths in one declared phase chart. Closure is declared metadata; continuity and regularity need separate checks.
   *
   * @evidence contracts/development/design.md#principled-representation Spans and phase widths retain the original generating coefficients and derivative scale.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Position, topology and phase partition travel together so an evaluator need not infer a chart.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No sampled display network or implicit equal-width partition substitutes for the supplied spans.
   * @evidence contracts/development/common.md#meaningful-documentation Properties distinguish millimetre positions, phase units and closure claims.
   */
  export interface Cubic {
    /** Closed representation tag selecting the actual coefficient evaluator and its units. */
    type: "cubicBezier";

    /** Stable semantic course identifier carried into actual inspection and source attribution. */
    name: string;

    /** Declared closure topology; this flag alone is not a periodicity, regularity or nonintersection proof. */
    closed: boolean;

    /** Explicit spatial unit of the generated primitive; exact coordinates remain millimetres until display conversion. */
    unit: "mm";

    /** Unit of the independent curve parameter; interval widths and reported derivatives use this same chart. */
    phaseUnit: "turn" | "mm" | "normalized";

    /** Ordered positive widths of every actual piece; cumulative values retain the parameter chart for derivatives and joins. */
    phaseIntervals: readonly number[];

    /** Ordered cubic Bernstein P0 through P3 coefficients; handles are not through-points or Catmull-Rom waypoints. */
    spans: readonly Span[];
  }

  /**
   * An analytic ellipse center in millimetres, two orthonormal direction axes and positive millimetre semiaxes; one turn is the complete parameter domain.
   *
   * @evidence contracts/development/design.md#principled-representation The center-plus-two-axis representation directly supports the analytic trigonometric evaluator.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The turn-only discriminant separates analytic ellipses from piecewise Bernstein records.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Axes are supplied coefficients, not fitted display samples; runtime admission checks orthonormality.
   * @evidence contracts/development/common.md#meaningful-documentation Documents the physical semiaxes, direction axes and one-turn parameter chart.
   */
  export interface Oval {
    /** Closed representation tag selecting the actual coefficient evaluator and its units. */
    type: "analyticOval";

    /** Stable semantic course identifier carried into actual inspection and source attribution. */
    name: string;

    /** Declared closure topology; this flag alone is not a periodicity, regularity or nonintersection proof. */
    closed: true;

    /** Explicit spatial unit of the generated primitive; exact coordinates remain millimetres until display conversion. */
    unit: "mm";

    /** Unit of the independent curve parameter; interval widths and reported derivatives use this same chart. */
    phaseUnit: "turn";

    /** Centre in the owning spatial chart; exact primitives use millimetres. */
    center: Vector;

    /** First declared unit axis of the owning transverse chart. */
    u: Vector;

    /** Second declared unit axis of the owning transverse chart. */
    v: Vector;

    /** Positive ellipse semiaxis length along u, millimetres. */
    radiusU: number;

    /** Positive ellipse semiaxis length along v, millimetres. */
    radiusV: number;
  }

  /**
   * Optional provenance for a Bernstein piece: parameterDomain, when present, is [0,1]; qInterval is descriptive source extent and does not rescale local-t derivatives.
   *
   * @evidence contracts/development/design.md#principled-representation Separate source intervals preserve provenance without changing the normalized evaluator chart.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Both optional fields are shared by every Bernstein branch.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An omitted interval does not create an inferred physical phase width.
   * @evidence contracts/development/common.md#meaningful-documentation Explains optional presence and the difference between local domain and source extent.
   */
  export interface PieceMetadata {
    /** Optional descriptive source interval; evaluation still returns derivatives per normalized local t. */
    parameterDomain?: readonly [number, number];

    /** Optional source q interval; it records provenance and does not silently rescale local-t derivatives. */
    qInterval?: readonly [number, number];
  }

  /**
   * Polynomial, positive-weight rational, or rational-XZ/polynomial-Y coefficients over local t in [0,1]. Rational numerators and weights are authoritative; an optional Euclidean control cache is checked against their quotient.
   *
   * @evidence contracts/development/design.md#principled-representation The discriminated branches preserve separate numerator, denominator and hybrid longitudinal degrees.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A single union exposes the exact coefficient representation used by the evaluator.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Derived controls do not replace rational authority, and hybrid Y does not inherit the rational denominator.
   * @evidence contracts/development/common.md#meaningful-documentation Documents branch selection, optional cache status and independent hybrid Y degree.
   */
  export type Piece = PieceMetadata &
    (
      | {
          /** Selects a polynomial position field. */
          primitive: "polynomialBezier";

          /** Polynomial degree; controls has exactly degree plus one entries. */
          degree: number;

          /** Position coefficients in millimetres and Bernstein order. */
          controls: readonly Vector[];
        }
      | {
          /** Selects a rational position field for every coordinate. */
          primitive: "rationalBezier";

          /** Common numerator and denominator degree. */
          degree: number;

          /** Weighted position coefficients, millimetres times the dimensionless weight. */
          homogeneousNumerator: readonly Vector[];

          /** Strictly positive dimensionless denominator coefficients. */
          weights: readonly number[];

          /** Optional Euclidean quotient cache in millimetres, checked against numerator divided by weight. */
          controls?: readonly Vector[];
        }
      | {
          /** Selects rational transverse X/Z and independent polynomial longitudinal Y. */
          primitive: "rationalXZPolynomialYBezier";

          /** Numerator/denominator degree; it does not set polynomialYControls degree. */
          degree: number;

          /** Weighted XYZ coefficients; rational Y is evaluated but replaced by the independent polynomial Y result. */
          homogeneousNumerator: readonly Vector[];

          /** Positive dimensionless weights shared by the rational coordinates. */
          weights: readonly number[];

          /** Longitudinal millimetre coefficients; their count minus one is this polynomial's independent degree. */
          polynomialYControls: readonly number[];

          /** Optional quotient cache for the homogeneous field before hybrid Y replacement. */
          controls?: readonly Vector[];
        }
    );

  /**
   * Piecewise Bernstein positions in millimetres, preserving each piece degree and the enclosing positive-width phase partition.
   *
   * @evidence contracts/development/design.md#principled-representation Each piece keeps its own polynomial or homogeneous coefficient field and local parameterization.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The enclosing partition supplies derivative scaling while pieces supply their actual degree.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No cubic conversion, degree reduction or sampled curve is implied.
   * @evidence contracts/development/common.md#meaningful-documentation Separates local piece derivatives from enclosing phase-unit derivatives.
   */
  export interface Bernstein {
    /** Closed representation tag selecting the actual coefficient evaluator and its units. */
    type: "bernstein";

    /** Stable semantic course identifier carried into actual inspection and source attribution. */
    name: string;

    /** Declared closure topology; this flag alone is not a periodicity, regularity or nonintersection proof. */
    closed: boolean;

    /** Explicit spatial unit of the generated primitive; exact coordinates remain millimetres until display conversion. */
    unit: "mm";

    /** Unit of the independent curve parameter; interval widths and reported derivatives use this same chart. */
    phaseUnit: "turn" | "mm" | "normalized";

    /** Ordered positive widths of every actual piece; cumulative values retain the parameter chart for derivatives and joins. */
    phaseIntervals: readonly number[];

    /** Actual pieces retain their independent degree and denominator authority. */
    pieces: readonly Piece[];
  }

  /**
   * Closed discriminated union of the three supported position representations; an unsupported tag must be rejected by runtime admission.
   *
   * @evidence contracts/development/design.md#principled-representation The type tag selects cubic, analytic ellipse or general Bernstein semantics.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One union is the shared input of primitive admission and evaluation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No unknown representation is accepted through a generic coefficient fallback.
   * @evidence contracts/development/common.md#meaningful-documentation Names exactly which representations the public evaluator consumes.
   */
  export type Primitive = Cubic | Oval | Bernstein;

  /**
   * A named local-to-parent rigid frame: rotation rows and millimetre translation. Parents must precede children when constructing the context; null identifies a root.
   *
   * @evidence contracts/development/design.md#principled-representation Explicit local transforms permit world composition before any dependent controls are generated.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A node key, parent key and one rigid transform define each hierarchy entry.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The record adds no scale, reflection repair or anatomy-specific bone semantics.
   * @evidence contracts/development/common.md#meaningful-documentation States local-to-parent direction, translation units and input ordering.
   */
  export interface Frame {
    /** Actual owning node key, resolved by the shared context before controls are generated. */
    bone: string;

    /** Single parent node key, or null for the hierarchy root. */
    parent: string | null;

    /** Dimensionless local-to-parent rotation rows; context admission requires a proper orthonormal basis. */
    rotation: Matrix;

    /** Parent-relative translation in millimetres before resolving the hierarchy. */
    translationMm: Vector;
  }

  /**
   * One named boundary publication from an owner region/node to a consumer region/node. All keys are caller-defined; the engine gives them no anatomical interpretation.
   *
   * @evidence contracts/development/design.md#principled-representation The complete owner and consumer pair defines the binding authorization checked by the context.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One edge record keeps routing identity beside its boundary key.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No region or bone name is special-cased as an approved anatomical connection.
   * @evidence contracts/development/common.md#meaningful-documentation Documents the caller-owned meaning of keys and both authorization endpoints.
   */
  export interface Edge {
    /** Stable declared boundary or node identity, not a selector for a body catalogue. */
    id: string;

    /** Caller-defined owner key; only this factory may publish the declared boundary. */
    ownerRegion: string;

    /** Caller-defined owner node key in the proper parent hierarchy; anatomy is defined by Human rather than engine. */
    ownerBone: string;

    /** Caller-defined dependent key; its construction receives the actual published value. */
    consumerRegion: string;

    /** Caller-defined receiving node key whose binding is authenticated by this edge. */
    consumerBone: string;
  }

  /**
   * A named closed cubic transverse section over one turn and its complete control-wise first variation per longitudinal millimetre. The supplied longitudinal axis declares the world measurement direction.
   *
   * @evidence contracts/development/design.md#principled-representation Section positions and fullJ together preserve the complete boundary field needed by dependent construction.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The matching span/control layout makes each longitudinal derivative correspond to one section coefficient.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts FullJ is not a tangent hint; admission checks finite layout and units, not regularity or axis normalization.
   * @evidence contracts/development/common.md#meaningful-documentation States position units, physical derivative denominator and the limits of boundary admission.
   */
  export interface Boundary {
    /** Stable declared boundary or node identity, not a selector for a body catalogue. */
    id: string;

    /** Transverse section in its owning chart, consumed with its complete longitudinal first variation. */
    section: Cubic;

    /** Entire Bernstein control derivative field, not a direction hint. */
    fullJ: readonly Span[];

    /** Physical denominator of fullJ; this boundary uses longitudinal millimetres. */
    longitudinalUnit: "mm";

    /** Caller-supplied world unit axis of longitudinal measurement; boundary admission checks finite components, not unit length. */
    longitudinalAxis: Vector;
  }

  /**
   * A context-issued publication token carrying its frozen edge and boundary. Binding authenticates this exact object in addition to the serialized revision.
   *
   * @evidence contracts/development/design.md#principled-representation Instance identity ties the boundary to the context that actually published it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One token carries routing, revision and the immutable published field.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Copying equal data or a revision string does not forge a valid binding.
   * @evidence contracts/development/common.md#meaningful-documentation Explains why both serialized identity and exact object identity matter.
   */
  export interface Operator {
    /** Frozen routing record of the edge that authorized this publication. */
    edge: Edge;

    /** Resolved graph identity recorded at publication; equal data alone does not authenticate a copied operator. */
    contextRevision: string;

    /** Actual generated boundary data; successful publication freezes its complete coefficient field. */
    value: Boundary;
  }
}
