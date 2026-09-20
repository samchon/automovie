import { IAutoMovieProductionRenditionDeliveryDeterministicLane } from "./IAutoMovieProductionRenditionDeliveryDeterministicLane";
import { IAutoMovieProductionRenditionDeliveryOccurrence } from "./IAutoMovieProductionRenditionDeliveryOccurrence";
import { IAutoMovieProductionRenditionDeliveryRepaintedLane } from "./IAutoMovieProductionRenditionDeliveryRepaintedLane";

/**
 * One exact delivered occurrence and its lane-specific source identity.
 *
 * @evidence requirements/repaint/sequence-continuity-and-publication.md#repaint-mixed-delivery Preserves one explicit occurrence lane and its source provenance.
 * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-failure-publication Types the exact final-conform occurrence join.
 */
export type IAutoMovieProductionRenditionDeliveryShot =
  IAutoMovieProductionRenditionDeliveryOccurrence &
    (
      | IAutoMovieProductionRenditionDeliveryDeterministicLane
      | IAutoMovieProductionRenditionDeliveryRepaintedLane
    );
