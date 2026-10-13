/** One linear thermal bridge along an assembly. */
export interface IAutoMovieEnvelopeBridge {
  /** Stable bridge identity within the request. */
  id: string;
  /** Assembly the bridge runs along. */
  assembly: string;
  /** Linear thermal transmittance in W/(m*K); at or above zero. */
  linearTransmittance: number;
  /** Length in metres; strictly positive. */
  length: number;
}
