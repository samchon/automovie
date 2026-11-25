import {
  type IAutoMovieViewerViewpoint,
  autoMovieViewerTurntableViewpoints,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `autoMovieViewerTurntableViewpoints` spaces viewpoints evenly round the
 * subject on each elevation ring.
 *
 * Scenarios:
 *
 * 1. Four azimuths on rings at 0 and -15 degrees give eight views, azimuths
 *    0, 90, 180 and 270 in order per ring, labelled by rounded degrees with an
 *    `n` for negative, and the default factor 1.25.
 * 2. A given factor is carried.
 * 3. No azimuth, no ring, a factor of zero and two rings that round to one
 *    label are refused.
 */
export function test_render_scene_turntable_viewpoints(): void {
  const views: IAutoMovieViewerViewpoint[] =
    autoMovieViewerTurntableViewpoints({
      azimuthCount: 4,
      elevationsDeg: [0, -15],
    });
  TestValidator.equals(
    "ids",
    views.map((view: IAutoMovieViewerViewpoint): string => view.id),
    [
      "az000-el000",
      "az090-el000",
      "az180-el000",
      "az270-el000",
      "az000-eln015",
      "az090-eln015",
      "az180-eln015",
      "az270-eln015",
    ],
  );
  TestValidator.equals(
    "angles",
    views.map((view: IAutoMovieViewerViewpoint): number[] => [
      view.azimuthDeg,
      view.elevationDeg,
      view.distanceFactor,
    ]),
    [0, 90, 180, 270, 0, 90, 180, 270].map(
      (azimuth: number, index: number): number[] => [
        azimuth,
        index < 4 ? 0 : -15,
        1.25,
      ],
    ),
  );
  TestValidator.equals(
    "factor",
    autoMovieViewerTurntableViewpoints({
      azimuthCount: 1,
      elevationsDeg: [0],
      distanceFactor: 2,
    })[0]!.distanceFactor,
    2,
  );
  for (const options of [
    { azimuthCount: 0, elevationsDeg: [0] },
    { azimuthCount: 4, elevationsDeg: [] },
    { azimuthCount: 4, elevationsDeg: [0], distanceFactor: 0 },
    { azimuthCount: 4, elevationsDeg: [0.2, 0.4] },
  ])
    TestValidator.error(JSON.stringify(options), (): void => {
      autoMovieViewerTurntableViewpoints(options);
    });
}