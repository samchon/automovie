/**
 * How one requested lid tissue shell fits the lid it was built in.
 *
 * A lid has a thickness at each cage station: the height of its skin above
 * the ocular exterior. A shell's requested dimensions need a certain share of
 * that thickness. `minimumMarginMetres` is the smallest remaining room over
 * the shell's stations, negative where the request exceeds the lid. The
 * generated shell retains the requested offset and thickness;
 * readHumanFacePeriocularTissueSpace uses this record to refuse insufficient
 * room rather than truncating the shell to fit.
 *
 * @author Samchon
 */
export interface IHumanFacePeriocularTissueFit {
  /** Cage stations the shell is built from. */
  stations: number;

  /** Stations where the request needs more room than the lid has. */
  shortStations: number;

  /** Smallest remaining room over the stations; negative where the lid is too thin. */
  minimumMarginMetres: number;
}
