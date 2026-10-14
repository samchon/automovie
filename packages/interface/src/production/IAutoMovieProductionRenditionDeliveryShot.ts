import { IAutoMovieProductionRenditionDeliveryDeterministicLane } from "./IAutoMovieProductionRenditionDeliveryDeterministicLane";
import { IAutoMovieProductionRenditionDeliveryOccurrence } from "./IAutoMovieProductionRenditionDeliveryOccurrence";
import { IAutoMovieProductionRenditionDeliveryRepaintedLane } from "./IAutoMovieProductionRenditionDeliveryRepaintedLane";

/**
 * One exact delivered occurrence paired with its lane-specific source identity.
 *
 * @evidence contracts/common.md#principled-implementation Intersects common timeline and file identity with a lane-discriminated union, so deterministic delivery requires null repaint lineage and repainted delivery requires selected candidate, receipt and attempt identity.
 * @evidence contracts/common.md#clear-and-simple-design Reuses shared occurrence and two lane declarations instead of flattening incompatible optional provenance fields into one broad interface.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A typed occurrence chooses one lane discriminant; timeline membership, current source equality and aggregate observation validity remain unverified because this retained DTO has no maintained runtime lane-planning consumer.
 * @evidence contracts/common.md#meaningful-documentation Names the delivered occurrence/lane pairing and delegates exact path, digest and selection semantics to its constituent documented contracts.
 * @author Samchon
 */
export type IAutoMovieProductionRenditionDeliveryShot =
  IAutoMovieProductionRenditionDeliveryOccurrence &
    (
      | IAutoMovieProductionRenditionDeliveryDeterministicLane
      | IAutoMovieProductionRenditionDeliveryRepaintedLane
    );
