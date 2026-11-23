import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** SI mass, centre and principal inertia; no collision dimensions inferred. */
export namespace IAutoMovieCombinePhysicalMassProperties {
  /** SI mass, centre and principal inertia; no collision dimensions inferred. */
  export interface IPart {
    /** Kilograms. */ mass: number;
    /** Metres in the common frame. */ centerOfMass: IAutoMovieVector3;
    /** Principal moments, kg m². */ inertia: IAutoMovieVector3;
    /** Principal axes in the common frame. */ inertiaRotation: IAutoMovieQuaternion;
  }
}
