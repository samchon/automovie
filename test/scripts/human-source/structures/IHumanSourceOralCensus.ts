import type { IHumanSourceOralCrownReading } from "./IHumanSourceOralCrownReading.ts";
import type { IHumanSourceOralPairReading } from "./IHumanSourceOralPairReading.ts";

/**
 * The source neutral's own oral interpenetration, before any channel acts.
 *
 * @author Samchon
 */
export interface IHumanSourceOralCensus {
  /** Source surface holding the tongue. */
  tongueSurface: string;

  /** Source surface holding every crown. */
  dentalSurface: string;

  /** The tongue against each registered crown, in registration order. */
  crowns: IHumanSourceOralCrownReading[];

  /** Maxillary-mandibular crown pairs that were tested. */
  antagonistPairsTested: number;

  /** Those pairs with a vertex inside or a crossing triangle; a clear pair is absent. */
  antagonistPairs: IHumanSourceOralPairReading[];

  /** Actual registered margin gaps at source neutral; null means the necessary ports/frame are absent. */
  lipMarginGapsMetres: number[] | null;

  /** Original source contact tolerance; null means contact registration is absent. */
  lipContactToleranceMetres: number | null;
}
