/**
 * The performed tongue's passage through the selected oral plane, measured
 * on its corrected surface. Omission retains the legacy incisal measurement;
 * generated oral mode selects the actual lower-lip port.
 * Extent and slab thickness remain metres in the contact frame; the report
 * does not reconstruct muscular anatomy or certify visual acceptance.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceTonguePassageSummary {
  /** Omission retains legacy incisal-plane measurement; generated oral mode reads the actual lip port. */
  plane?: "lip-port";

  /** Anterior extent past the selected incisal plane or lip port, metres. */
  protrudingMetres: number;

  /** Thickness over the selected incisal or lip-port section slab, metres. */
  thicknessMetres: number;
}
