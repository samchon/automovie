import type { IAutoMovieHumanConstructionClearanceReading } from "../structures/IAutoMovieHumanConstructionClearanceReading";
import type { IAutoMovieHumanConstructionPartReading } from "../structures/IAutoMovieHumanConstructionPartReading";

/** One unchanged admission condition deferred until its geometry is assembled.
 *
 * @author Samchon
 */
export interface IHumanConstructionCheck {
  /** Responsibility named in a construction's refusal report. */
  owner: string;

  /** Execute the original check over the same captured geometry. */
  assert: () => void;

  /** Every relation this owner measured on that geometry, refused or not. A measuring owner's assert refuses exactly the readings it reports as refused. */
  read?: () => IAutoMovieHumanConstructionClearanceReading[];

  /** Census of the constructed parts this owner answers for. */
  census?: () => IAutoMovieHumanConstructionPartReading[];
}
