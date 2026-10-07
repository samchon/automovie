/** One named reading on the final consumer, or its explicit unavailable cause. */
export interface IUpperLimbObservationMeasurement {
  /** Named anatomical or rig quantity; rig distances are not bone lengths. */
  quantity: string;

  /** The exact source points or rig joints the instrument reads. */
  references: readonly string[];

  /** Metres are converted to millimetres only at report publication. */
  millimetres: number | null;

  /** Missing correspondence or an unregistered quantity stays named. */
  unavailable: string | null;
}
