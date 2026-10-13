/**
 * One linear thermal bridge along an assembly.
 *
 * Adds `linearTransmittance * length` W/K to the envelope's heat transfer and
 * to the bridge share. `assembly` must name an assembly of the same request,
 * but the bridge is not attributed to that assembly's own metrics or sample.
 *
 * @author Samchon
 */
export interface IAutoMovieEnvelopeBridge {
  /** Stable bridge identity, unique within the request. */
  id: string;

  /** Assembly the bridge runs along; must be declared by the same request. */
  assembly: string;

  /** Linear thermal transmittance in W/(m*K); finite, at or above zero. */
  linearTransmittance: number;

  /** Length in metres; finite and strictly positive. */
  length: number;
}
