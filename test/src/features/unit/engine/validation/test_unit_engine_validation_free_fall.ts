import { AutoMovieGravity, detectFreeFall } from "@automovie/engine";
import {
  IAutoMovieBody,
  IAutoMovieTrack,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  namedFacts,
  nclose,
  validationHasNoWarnings,
  validationHasWarning,
  validationHasWarningCount,
} from "../../../internal/predicates";

const BODY: IAutoMovieBody = {
  mass: 1,
  centerOfMass: null,
  friction: 0.5,
  restitution: 0.5,
};
const FOOTPRINT: IAutoMovieVector3[] = [
  { x: -1, y: 0, z: -1 },
  { x: 1, y: 0, z: -1 },
  { x: 1, y: 0, z: 1 },
  { x: -1, y: 0, z: 1 },
];

/**
 * An unsupported, unattached declared body receives advisory gravity feedback,
 * a fall event and a proposed trajectory; support is judged from the supplied
 * planar contacts.
 *
 * Scenarios:
 *
 * 1. Empty support produces a warning, one fall event and a proposed trajectory.
 * 2. A center outside the contact hull remains unsupported and an omitted node
 *    uses the fallback trajectory label.
 * 3. A center inside the footprint produces no warning, event or trajectory.
 * 4. The proposed translation's final height matches origin.y + 0.5 * g * t
 *    squared at the default one-second duration.
 */
export function test_unit_engine_validation_free_fall(): void {
  const unheld: ReturnType<typeof detectFreeFall> = detectFreeFall({
    node: "crate",
    body: BODY,
    centerOfMass: { x: 0, y: 5, z: 0 },
    support: [],
    attached: false,
    falling: false,
  });
  TestValidator.predicate(
    "gravity warning on the right path",
    validationHasWarning(
      "unsupported free fall",
      unheld.validation,
      "physics",
      ".gravity",
    ),
  );
  TestValidator.equals("one fall event", unheld.events.length, 1);
  TestValidator.equals("fall event kind", unheld.events[0]!.kind, "fall");
  TestValidator.predicate("suggested arc present", unheld.trajectory !== null);

  const outside: ReturnType<typeof detectFreeFall> = detectFreeFall({
    body: BODY,
    centerOfMass: { x: 5, y: 5, z: 5 },
    support: FOOTPRINT,
    attached: false,
    falling: false,
  });
  TestValidator.predicate(
    "COM outside footprint warns",
    validationHasWarningCount(
      "outside support footprint",
      outside.validation,
      1,
    ),
  );
  TestValidator.equals(
    "no-node arc uses the default node",
    namedFacts([
      ["outsideTrajectory", (): boolean => outside.trajectory !== null],
      [
        "outsideTrajectoryId",
        (): boolean =>
          outside.trajectory !== null &&
          outside.trajectory.id.includes("object"),
      ],
    ]),
    { outsideTrajectory: true, outsideTrajectoryId: true },
  );

  const supported: ReturnType<typeof detectFreeFall> = detectFreeFall({
    node: "crate",
    body: BODY,
    centerOfMass: { x: 0, y: 5, z: 0 },
    support: FOOTPRINT,
    attached: false,
    falling: false,
  });
  TestValidator.predicate(
    "supported has no warning",
    validationHasNoWarnings("supported free fall", supported.validation),
  );
  TestValidator.equals("supported has no event", supported.events.length, 0);
  TestValidator.equals("supported has no arc", supported.trajectory, null);

  const track: IAutoMovieTrack = unheld.trajectory!.tracks.find(
    (t: IAutoMovieTrack): boolean =>
      t.channel.kind === "node" && t.channel.path === "translation",
  )!;
  const lastY: number = track.values[track.values.length - 2]!;
  TestValidator.predicate(
    "free-fall height = origin.y + ½·g·t²",
    nclose(lastY, 5 - 0.5 * AutoMovieGravity.STANDARD * 1 * 1),
  );
}
