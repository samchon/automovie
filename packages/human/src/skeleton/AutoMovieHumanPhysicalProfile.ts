import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import { AutoMovieHumanPhysicalSource } from "./AutoMovieHumanPhysicalSource";
import { AutoMovieHumanSkeleton as Skeleton } from "./AutoMovieHumanSkeleton";
import { mapAutoMovieHumanPhysicalProfile } from "./mapAutoMovieHumanPhysicalProfile";

/**
 * Human physical provider. It reads one fixed person's explicit physical
 * source from the prepared skeleton ({@link AutoMovieHumanPhysicalSource}) and
 * maps it purely ({@link mapAutoMovieHumanPhysicalProfile}) to an articulated
 * profile with de Leva (1996) mass fractions, girths from the same skeleton as
 * Human limb capsules, and canonical clinical joint domains.
 */
export namespace AutoMovieHumanPhysicalProfile {
  /** Equipment adds explicit mass, inertia and local collision geometry. */
  export interface IEquipment {
    /** Canonical segment owning the equipment. */ bone: string;
    /** Added kilograms. */ mass: number;
    /** Equipment's bone-local centre, metres. */ centerOfMass: IAutoMovieVector3;
    /** Principal inertia, kg m², aligned with the bone. */ inertia: IAutoMovieVector3;
    /** One retained collider; own id must be unique on the segment. */ shape: P.IShape;
  }
  /** Provider parameters retain the caller's mass and actuator assumptions. */
  export interface IOptions {
    /** Bare body mass, kg, not an inferred BMI. */ mass: number;
    /** Joint PD natural frequency, radians/second. */ frequency: number;
    /** Critical-damping ratio; nonnegative. */ dampingRatio: number;
    /** Maximum actuator torque per kg of downstream segment, N m/kg. */ torquePerKg: number;
    /** Passive angular decay rate, 1/s; zero by default, retained after tracking withdrawal. */ passiveRate?: number;
    /** Explicit gloves, shoes or other rigid equipment. */ equipment: IEquipment[];
    /** Contact materials, including skin and equipment ids. */ materials: P.IMaterial[];
    /** Material id for bare surfaces. */ skin: string;
  }
  /** Build from the actual numerical FK, with canonical ROM rather than copied bounds. */
  export function create(
    parameters: IAutoMovieHumanParameters,
    options: IOptions,
  ): P {
    return prepare(parameters, options).profile;
  }
  /** Share the same fixed person's numerical evaluator; a borrowed evaluator must have been prepared from these exact parameters. */
  export function prepare(
    parameters: IAutoMovieHumanParameters,
    options: IOptions,
    preparedEvaluator?: Skeleton.PoseEvaluator,
  ): { profile: P; evaluate: Skeleton.PoseEvaluator } {
    const evaluate: Skeleton.PoseEvaluator =
      preparedEvaluator ?? Skeleton.prepare(parameters);
    return {
      profile: mapAutoMovieHumanPhysicalProfile(
        AutoMovieHumanPhysicalSource(parameters, evaluate),
        options,
      ),
      evaluate,
    };
  }
}
