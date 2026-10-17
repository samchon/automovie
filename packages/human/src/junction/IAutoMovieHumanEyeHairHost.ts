import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanMeasurements } from "../measure/IAutoMovieHumanMeasurements";
import { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import { frameAutoMovieHumanHead } from "./frameAutoMovieHumanHead";

/**
 * The selected head's actual anterior lid owner, borrowed for one appearance emission.
 *
 * The head supplies its live course and frame, not a sampled aperture or a
 * substitute default. Context references guard which immutable person owns it;
 * they are not a geometry or contact certificate. The default head mirrors the
 * left local course in this frame for the right side.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanEyeHairHost {
  /** Borrowed input pair of this provider call; never serialized into the model. */
  context: {
    measurements: IAutoMovieHumanMeasurements;
    skeleton: IAutoMovieHumanSkeleton;
  };
  /** Head-local axes placed in model-rest millimetres. */
  frame: frameAutoMovieHumanHead.IAxes;
  /** Eye centre's depth in that local frame, millimetres. */
  eyeDepthMm: number;
  /** Independent transverse palpebral fissure length, millimetres. */
  lengthMm: number;
  /** Independent palpebral fissure height, millimetres. */
  heightMm: number;
  /** Existing anterior margin thickness used for bounded skin projection, millimetres. */
  marginThicknessMm: number;
  /** Actual left anterior margin in local millimetres, s from medial0 to lateral1. */
  lidLocal: (s: number, upper: boolean) => IAutoMovieVector3;
}
