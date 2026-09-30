import type { IAutoMovieHumanBodySurfaceMeasurements } from "../surface/IAutoMovieHumanBodySurfaceMeasurements";
import type { IAutoMovieHumanBodyAge } from "./IAutoMovieHumanBodyAge";
import type { IAutoMovieHumanBodyAnatomicalMeasurements } from "./IAutoMovieHumanBodyAnatomicalMeasurements";
import type { IAutoMovieHumanBodyMass } from "./IAutoMovieHumanBodyMass";
import type { IAutoMovieHumanBodyStandingStature } from "./IAutoMovieHumanBodyStandingStature";

/**
 * A full-scale detailed request rather than an isolated anatomical observation.
 *
 * Age, standing stature and mass are required to locate a body in an observed
 * population. Every other exterior or internal quantity remains a named
 * optional condition. These three scalars still do not determine unique fat,
 * muscle, bone or skin geometry: a resolver must use a validated population
 * model or report its unavailable component instead of guessing vertices.
 * @author Samchon
 */
export type IAutoMovieHumanBodyCompleteAnatomicalMeasurements =
  IAutoMovieHumanBodyAnatomicalMeasurements & {
    readonly age: IAutoMovieHumanBodyAge;
    readonly surface: IAutoMovieHumanBodySurfaceMeasurements & {
      readonly stature: IAutoMovieHumanBodyStandingStature;
      readonly mass: IAutoMovieHumanBodyMass;
    };
  };
