/**
 * Display model of the one-shot capture (`node:capture`): what a region's
 * capture provider hands the renderer for one part, already evaluated from
 * that region's actual specs and loft. Every point is in the part's world
 * placement, calibration millimetres, in the ISB segment convention (+X
 * anterior, +Y proximal or up, +Z to the subject's right). The model owns no
 * geometry: providers evaluate their own original curves and lofts, and the
 * renderer only projects these polylines and triangles.
 */
export namespace CaptureModel {
  /** Point or direction, calibration mm. */
  export type Vec3 = [number, number, number];

  /** Rigid placement: a local point `p` lies at `origin + axes[0] p0 + axes[1] p1 + axes[2] p2`. */
  export interface ITransform {
    /** Local origin in the world placement. */
    origin: Vec3;

    /** Local X, Y and Z axes in the world placement, orthonormal and right-handed. */
    axes: [Vec3, Vec3, Vec3];
  }

  /** A requested name the run could not draw, with the cause it could not. */
  export interface IUnavailable {
    /** Part, stage, curve or neighbour name. */
    name: string;

    /** Why it is unavailable, in the producer's own words where it gave any. */
    cause: string;
  }

  /** One drawn polyline. */
  export interface ILine {
    /** Producer identity of the polyline, such as `arm.lateral.humerus` or `aid:tangent biceps site`. */
    id: string;

    /** World points, calibration mm. */
    points: Vec3[];

    /** Whether the last point joins the first. */
    closed: boolean;

    /** Six hexadecimal colour digits. */
    colour: string;
  }

  /**
   * One original 2D view curve with its declared construction aids and
   * datums. `lines` are the evaluated curve over its physical domain (a
   * fullness is drawn as its shoulder lines); `aids` and `datums` come
   * unchanged from the spec, placed through the frame chain.
   */
  export interface ICurve {
    /** Spec name. */
    id: string;

    /** Owning part. */
    part: string;

    /** Frame the spec is written in. */
    frame: string;

    /** Representation kind and role, such as `outline lateral` or `fullness`. */
    kind: string;

    /** The evaluated curve. */
    lines: ILine[];

    /** Its construction aids. */
    aids: ILine[];

    /** Its datum points, world mm. */
    datums: Vec3[];
  }

  /** A joint or port of a part, framed by an oblique close-up. */
  export interface IPort {
    /** Port name, such as `elbow`. */
    name: string;

    /** World centre, calibration mm. */
    point: Vec3;

    /** Half size of the close-up box, calibration mm. */
    radius: number;
  }

  /** A segment frame with its composed world placement. */
  export interface IFrame {
    /** Frame name. */
    name: string;

    /** Parent frame name, null for the part's root. */
    parent: string | null;

    /** Composed placement in the part's world. */
    world: ITransform;
  }

  /** Indexed triangles, world mm. */
  export interface ITriangles {
    /** Flat XYZ positions. */
    positions: number[];

    /** Triangle vertex indices. */
    indices: number[];
  }

  /** The generated loft: its curves and its default clay, or why there is none. */
  export type ILoft =
    | {
        /** The engine returned a loft. */
        status: "available";

        /** Layer rings, guides and course. */
        lines: ILine[];

        /** Clay triangles sampled from the actual chain. */
        clay: ITriangles;

        /** The loft's own diagnostics, kept even when it succeeded. */
        diagnostics: string[];
      }
    | {
        /** The engine returned no loft. */
        status: "unavailable";

        /** Its refusal. */
        cause: string;
      };

  /** The reference region registered into this part's chain for comparison only, or why there is none. */
  export type IReference =
    | {
        /** Registered triangles exist. */
        status: "available";

        /** Registered reference triangles, world mm. */
        mesh: ITriangles;

        /** Registration measurements, calibration mm or radians. */
        measures: Record<string, number>;

        /** How the registration was made. */
        method: string;
      }
    | {
        /** No registered reference. */
        status: "unavailable";

        /** Why. */
        cause: string;
      };

  /** Neighbour relations of a part from its frame chain, spec consumers or the existing inventory. */
  export interface IRelations {
    /** Host part, null when the part is a root. */
    parent: string | null;

    /** Child parts. */
    children: string[];

    /** Parts sharing a port or a shared contour. */
    shares: string[];

    /** Where each relation came from. */
    basis: string;
  }

  /** One captured part. */
  export interface IPart {
    /** Part name, such as `arm.left`. */
    name: string;

    /** Root frame of the part's chain. */
    root: string;

    /** How the root is placed in the figure, or why it stands at identity. */
    placement: string;

    /** Segment frames in chain order. */
    frames: IFrame[];

    /** Original curves. */
    curves: ICurve[];

    /** Joints and ports. */
    ports: IPort[];

    /** The loft. */
    loft: ILoft;

    /** The registered reference. */
    reference: IReference;

    /** Neighbour relations. */
    relations: IRelations;

    /** Construction and registration timings, milliseconds, disjoint. */
    milliseconds: Record<string, number>;

    /** Provider diagnostics that did not prevent drawing. */
    diagnostics: string[];
  }

  /** A part the figure has but this run cannot draw, with its relations for neighbour expansion. */
  export interface IKnown {
    /** Part name. */
    name: string;

    /** Why there is no capture provider or no result. */
    cause: string;

    /** Its relations, from the existing inventory. */
    relations: IRelations;
  }
}
