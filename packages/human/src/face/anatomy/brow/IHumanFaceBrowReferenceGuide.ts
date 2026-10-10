/**
 * One shaft's derived finite guide on the shape-only source reference.
 * Stations are head-frame metres before native seating, not personal curve
 * inputs. The original population ordinal survives thinning and registration.
 *
 * @author Samchon
 */
export interface IHumanFaceBrowReferenceGuide {
  /** Original population ordinal, independent of surviving guide count. */
  index: number;

  /** Ordered reference 3D stations at the requested shaft resolution. */
  points: readonly (readonly number[])[];
}
