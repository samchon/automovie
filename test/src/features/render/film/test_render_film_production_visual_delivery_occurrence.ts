import type { IAutoMovieFilmTimelineSegment } from "@automovie/interface";
import { productionVisualDeliveryOccurrence } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `productionVisualDeliveryOccurrence` names a timeline segment by its index,
 * frame range and shot.
 *
 * Scenarios:
 *
 * 1. Segment 2 of shot "s1" over frames 10–20 is "occurrence:2:10-20:s1".
 */
export function test_render_film_production_visual_delivery_occurrence(): void {
  const segment: IAutoMovieFilmTimelineSegment = {
    shot: "s1",
    sourceInFrame: 0,
    sourceOutFrame: 10,
    startFrame: 10,
    endFrame: 20,
    headHandleFrames: 0,
    tailHandleFrames: 0,
    transitionIn: { kind: "cut" },
    transitionOut: { kind: "cut" },
  };
  TestValidator.equals(
    "the name",
    productionVisualDeliveryOccurrence(segment, 2),
    "occurrence:2:10-20:s1",
  );
}
