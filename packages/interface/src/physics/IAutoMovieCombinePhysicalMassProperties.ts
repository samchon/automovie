import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * SI mass, centre and principal inertia; no collision dimensions inferred.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Specifies SI mass, common-frame centre and principal inertia orientation.
 * @evidence contracts/development/design.md#principled-representation Kilograms, metre centres, kg m² moments and a principal-to-common quaternion describe each rigid mass contribution.
 * @evidence contracts/development/design.md#minimal-and-owned-surface combinePhysicalMassProperties reads these contributions to aggregate centre and inertia without inferring collision geometry.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The caller supplies compatible frames and admitted mass properties; vector and number types do not establish positive inertia or unit rotation.
 */
export namespace IAutoMovieCombinePhysicalMassProperties {
  /**
   * SI mass, centre and principal inertia; no collision dimensions inferred.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Specifies SI mass, common-frame centre and principal inertia orientation.
   * @evidence contracts/development/design.md#principled-representation Kilograms, metre centres, kg m² moments and a principal-to-common quaternion describe each rigid mass contribution.
   * @evidence contracts/development/design.md#minimal-and-owned-surface combinePhysicalMassProperties reads these contributions to aggregate centre and inertia without inferring collision geometry.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The caller supplies compatible frames and admitted mass properties; vector and number types do not establish positive inertia or unit rotation.
   */
  export interface IPart {
    /** Kilograms. */ mass: number;
    /** Metres in the common frame. */ centerOfMass: IAutoMovieVector3;
    /** Principal moments, kg m². */ inertia: IAutoMovieVector3;
    /** Principal axes in the common frame. */ inertiaRotation: IAutoMovieQuaternion;
  }
}
