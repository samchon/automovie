import { IAutoMovieVector3 } from "@automovie/interface";

/**
 *
 * One steady noise source inside the room, such as a fan or a diffuser.
 *
 * Contributes `10^(Lw / 10) * (Q / (4 * pi * r^2) + 4 / R)` to the energy at
 * every receiver. A source whose power underflows to zero energy leaves the
 * receivers with no level, which the run reports as a gap.
 *
 * @evidence contracts/common.md#principled-implementation Sound power level and directivity factor are the source terms of the direct field `Q / (4 pi r^2)` and the diffuse field `4/R`, so the level needs no spectrum or orientation.
 * @evidence contracts/common.md#clear-and-simple-design Directivity is one scalar applied in every direction, so the source has no aim vector and a directional fitting enters only through its declared factor.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Validation refuses a blank or repeated id, a non-finite power or position and a non-positive directivity; no kind of source is treated specially.
 * @evidence contracts/common.md#meaningful-documentation States the energy contribution, the dB reference of the power level, the meaning of a directivity of one, and the underflow-to-gap behavior.
 * @evidenceExclude contracts/performance.md#cost-and-resources An input record; each source is visited once per receiver while solving and once more in the coincidence check. Read by one study and digested into its settings; its per-receiver distances are not carried from the validation pass into the solve pass. Two numbers, an id and a position owned by the request for one study.
 * @author Samchon
 */
export interface IAutoMovieAcousticSource {
  /** Stable source identity, unique among the request's sources. */
  id: string;

  /** World position in metres; every axis finite. */
  position: IAutoMovieVector3;

  /** Sound power level in dB re 1 pW; finite. */
  soundPower: number;

  /** Directivity factor; finite and strictly positive, `1` being omnidirectional. */
  directivity: number;
}
