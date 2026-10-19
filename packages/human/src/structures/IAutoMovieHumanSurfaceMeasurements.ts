/**
 * Physical targets of the generated neutral T-rest surface, in millimetres.
 * These optional observations override the common model's explicitly qualified
 * dimensional rules. Omitted observations use the admitted detailed identity
 * and common skeleton; they do not require manually placed station coordinates.
 * An automatic rest convention is not a measured conversion of clinical posture.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanSurfaceMeasurements {
  /** Current physical-document version. */
  version: 1;

  /** Measured T-rest observations or an explicitly authored engineering probe. */
  qualification: "measured-neutral-T" | "authored-convention";

  /** Optional horizontal rest observations; omitted stations are derived together. */
  trunk?: {
    /** Chest-apex plane in the shared standing-surface datum. */
    chest: IAutoMovieHumanSurfaceMeasurements.Section;

    /** Natural-waist plane, distinct from a navel section. */
    waist: IAutoMovieHumanSurfaceMeasurements.Section;

    /** Maximum-buttock plane; its height is independently supplied. */
    buttock: IAutoMovieHumanSurfaceMeasurements.Section;
  };

  /** Optional mid-tube dimensions, perpendicular to the common neck axis. */
  neck?: IAutoMovieHumanSurfaceMeasurements.Envelope;

  /** Optional independent section dimensions in the generated limb charts. */
  arms?: Partial<Record<"left" | "right", {
    /** Mid upper-arm cut, between the actual shoulder and elbow centres. */
    upperArm?: IAutoMovieHumanSurfaceMeasurements.Envelope;
    /** Elbow-centre section in the transported limb chart. */
    elbow?: IAutoMovieHumanSurfaceMeasurements.Envelope;
    /** Forearm support at one quarter of the elbow-to-wrist chord. */
    forearm?: IAutoMovieHumanSurfaceMeasurements.Envelope;
    /** Wrist cut at the actual hand joint. */
    wrist?: IAutoMovieHumanSurfaceMeasurements.Envelope;
  }>>;

  /** Optional independent section dimensions in the generated limb charts. */
  legs?: Partial<Record<"left" | "right", {
    /** Mid-thigh cut between the actual hip and knee centres. */
    thigh?: IAutoMovieHumanSurfaceMeasurements.Envelope;
    /** Knee-centre section. */
    knee?: IAutoMovieHumanSurfaceMeasurements.Envelope;
    /** Calf support at one quarter of the knee-to-ankle chord. */
    calf?: IAutoMovieHumanSurfaceMeasurements.Envelope;
    /** Ankle cut at the actual foot joint. */
    ankle?: IAutoMovieHumanSurfaceMeasurements.Envelope;
  }>>;
}

/** Named observations of one common physical surface definition. */
export namespace IAutoMovieHumanSurfaceMeasurements {
  /**
   * A convex enclosing section in a horizontal plane of the neutral T-rest.
   * Breadth, depth and convex-tape perimeter are independent targets. The
   * symmetric family currently has no independently located paired masses,
   * recesses or left/right envelope asymmetry.
   *
   * @author Samchon
   */
  export interface Section extends Envelope {
    /** Height above the shared standing surface, in millimetres. */
    heightMm: number;

    /** Fraction of depth anterior to the shared skeletal support axis, in (0,1). */
    anteriorFraction: number;
  }

  /**
   * Independent dimensions in one declared rest section plane. A supplied
   * breadth/depth/girth triple is retained together; no other measured dimension
   * is changed to make the selected section family fit.
   *
   * @author Samchon
   */
  export interface Envelope {
    /** Full relaxed skin-envelope breadth along the chart's breadth axis, mm. */
    breadthMm: number;
    /** Full anterior/posterior extent along the chart's anterior axis, mm. */
    depthMm: number;
    /** Convex-tape perimeter of this enclosing section, mm. */
    perimeterMm: number;
  }
}
