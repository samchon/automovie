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
 * @evidence contracts/common.md#principled-implementation Room is the lid thickness minus what the request needs, computed at the stations the shell is built from, so the refusal quotes the constructing quantities.
 * @evidence contracts/common.md#clear-and-simple-design Three numbers per shell.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Insufficient room refuses without truncating the generated shell or changing the caller's dimensions.
 * @evidence contracts/common.md#meaningful-documentation States what room means, its sign and what happens to the emitted shell.
 * @evidence contracts/modeling.md#spatial-conventions Metres along the outward normal of the ocular exterior.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Describes an existing part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The tissue builder answers for the boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Numerical record.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The admission that reads it owns the refusal.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no input.
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
