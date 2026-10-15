
export interface RoofRules {
  /** Top-face height (m) of the courtyard-side support line (portico eave datum) and of the east gable support line. */
  courtEave: number;
  /** Lean-to roof slope (rad). */
  leanSlope: number;
  /** Gable slope (rad). */
  gableSlope: number;
  /** Slope (rad) of the east gable only. Lower than the sanctuary and porch so the ridge at the south end sits under the coping. */
  eastGableSlope: number;
  /** Normal thickness (m) of the roof mass. */
  normalThickness: number;
  /** Horizontal projection (m) of an open eave end. */
  overhang: number;
  /** Top-face height (m) of the east gable's support line at the centre of the east outer wall. */
  eastWallSupport: number;
  /** Top-face height (m) of the sanctuary gable support line. */
  sanctuarySupport: number;
  /** Top-face height (m) of the porch gable support line. */
  porchSupport: number;
}
