import type { AutoMovieMeshExtract as M } from "@automovie/engine";
import type { ConicPaperInput as C } from "./ConicPaperInput";

/** World-registered input and coefficient evidence for the two guided section-family experiments. */
export namespace PartConicTypes {
  /** Cartesian millimetres or a dimensionless direction, as documented by its containing field. */
  export type V = [number, number, number];
  /** A planar point in the original section chart, in millimetres. */
  export type P = [number, number];
  /** One exact native cut, including original observations withheld from family fitting. */
  export interface Row {
    /** Distance from the registered native proximal bone centre, in millimetres. */
    s: number;
    /** Original native intersection polygon around that bone axis, oriented in increasing chart phase. */
    points: P[];
    /** Midplanes are independent validation observations, never field-fitting sites. */
    heldout: boolean;
    /** Original saved family cubic at a training station, absent for a newly cut held-out midplane. */
    saved?: C.Curve;
    /** Saved observation quality, or the explicit native held-out classification. */
    quality: string;
    /** Number of exact closed components winding around the supplied bone point. */
    surroundingLoops: number;
    /** Native cut flags retained without attributing unrelated component failures to this selected loop. */
    flags: string[];
  }
  /** One finite, straight central bone interval; this is not an anatomical re-basing operation. */
  export interface Part {
    /** Study identity; positive-Z is a registration statement, not independently verified anatomical laterality. */
    name: string;
    /** Exactly one original family selected by name, without alternative-version aggregation. */
    family: string;
    /** Original native joint names used as the fixed source guide. */
    jointNames: [string, string];
    /** Original proximal centre in absolute world millimetres. */
    origin: V;
    /** Original in-plane forward-like direction. */
    u: V;
    /** Original in-plane companion direction; v cross u equals n. */
    v: V;
    /** Distal unit bone direction in the registered world chart. */
    n: V;
    /** Original native bone length, in millimetres. */
    lengthMm: number;
    /** Retained physical station interval, in millimetres from origin. */
    domain: [number, number];
    /** Training cuts and independent midpoint cuts, all with unmodified source coordinates. */
    rows: Row[];
    /** Maximum off-axis residual of selected saved plane origins, in millimetres. */
    registrationAxisResidualMm: number;
    /** Maximum angle between the selected original plane normal and registered bone direction, in radians. */
    registrationNormalAngle: number;
    /** Exact alias welding changes indices only; the adopted source positions are unchanged. */
    exactAliasCount: number;
  }
  /** Input authority and source geometry, retained only for observation and separately labelled comparison. */
  export interface Input {
    /** Both independent representative parts in their original absolute pose. */
    parts: Part[];
    /** Registered body triangles in millimetres with exact positional aliases identified. */
    mesh: M.IMesh;
    /** Actual source identities consumed by this run. */
    identities: { path: string; bytes: number; sha256: string }[];
    /** Loading, registration, alias indexing and native-cut work, in milliseconds. */
    milliseconds: number;
  }
}
