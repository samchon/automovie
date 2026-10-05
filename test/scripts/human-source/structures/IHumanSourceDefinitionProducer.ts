/**
 * The parameters of the musculature definition producer.
 *
 * @author Samchon
 */
export interface IHumanSourceDefinitionProducer {
  /** Field revision name the regenerated rows carry. */
  revision: string;

  /** Shape of the source's lean muscular body. */
  muscular: Record<string, number>;

  /** Shape of the source's lean average-muscle body. */
  lean: Record<string, number>;

  /** Smoothing sweeps of the fine field. */
  highSweeps: number;

  /** Smoothing sweeps of the broad field subtracted from it. */
  lowSweeps: number;

  /** Factor on the band-passed field. */
  gain: number;

  /** Fade length near the excluded points and regions, metres. */
  fadeMetres: number;

  /** Skin landmark of the left nipple-areola centre; the right is its mirror twin. */
  nipple: string;

  /** Midline point of the crotch cut, metres (r6 receipt exclusion centre). */
  crotch: number[];

  /** Relief endpoints the field steps aside from. */
  relief: string[];

  /** Endpoint whose normalized length weights the breast split. */
  breast: string;

  /** Endpoint the musculature share is written to. */
  musculature: string;

  /** Endpoint the chest share is written to. */
  chest: string;

  /** Storage step of the written rows, metres. */
  storageMetres: number;
}
