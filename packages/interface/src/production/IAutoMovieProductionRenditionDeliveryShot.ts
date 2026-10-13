import { IAutoMovieProductionRenditionDeliveryDeterministicLane } from "./IAutoMovieProductionRenditionDeliveryDeterministicLane";
import { IAutoMovieProductionRenditionDeliveryOccurrence } from "./IAutoMovieProductionRenditionDeliveryOccurrence";
import { IAutoMovieProductionRenditionDeliveryRepaintedLane } from "./IAutoMovieProductionRenditionDeliveryRepaintedLane";

/** One exact delivered occurrence and its lane-specific source identity. */
export type IAutoMovieProductionRenditionDeliveryShot =
  IAutoMovieProductionRenditionDeliveryOccurrence &
    (
      | IAutoMovieProductionRenditionDeliveryDeterministicLane
      | IAutoMovieProductionRenditionDeliveryRepaintedLane
    );
