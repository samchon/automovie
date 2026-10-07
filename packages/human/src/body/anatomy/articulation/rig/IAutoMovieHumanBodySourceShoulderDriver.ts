import type { IAutoMovieHumanBodyShoulderPose } from "../../../structures/IAutoMovieHumanBodyShoulderPose";

/** A source profile driven by an existing thorax-relative shoulder coordinate. */
export interface IAutoMovieHumanBodySourceShoulderDriver {
  /** Existing thorax-relative total TT goal drives a declared source coupling. */
  kind: "public-shoulder";

  /** Left or right upper-arm TT goal identity; the source anatomical node retains its separate bone ID. */
  bone: IAutoMovieHumanBodyShoulderPose["bone"];

  /** TT source coordinate; total humerothoracic elevation is not a local GH angle. */
  axis: "plane" | "elevation" | "axialRotation";

  /** Public source rest used for omission, after the shape owner updates registration. */
  neutral: number;

  /** Plane, total elevation and axial rotation use the existing TT degree convention. */
  unit: "degrees";
}
