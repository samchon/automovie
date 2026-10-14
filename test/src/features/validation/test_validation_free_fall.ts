import { detectFreeFall } from "@automovie/engine";
import { IAutoMovieBody, IAutoMovieTrack, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  namedFacts,
  nclose,
  validationHasNoWarnings,
  validationHasWarning,
  validationHasWarningCount,
} from "../internal/predicates";

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
 * An unsupported, unattached declared body receives advisory gravity feedback, a fall event and a proposed trajectory; support is judged from the supplied planar contacts.
 *
 * Scenarios:
 *
 * 1. Empty support produces a warning, one fall event and a proposed trajectory.
 * 2. A center outside the contact hull remains unsupported and an omitted node uses the fallback trajectory label.
 * 3. A center inside the footprint produces no warning, event or trajectory.
 * 4. The proposed translation's final height matches origin.y + 0.5 * g * t squared at the default one-second duration.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual free-fall detector for empty, outside and supported contact populations, reads warnings/events/trajectory and checks its final height, catching a lost fall or a false supported-body warning.
 * @evidence contracts/testing.md#independent-expectations The supplied square's XZ extent independently separates inside from outside; constant acceleration from rest gives 5-9.81/2 at one second. Only the selected final translation value is checked, not every sample or a simulated collision response.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts empty/nonempty unsupported and supported hulls, explicit/omitted node labels and trajectory/no-trajectory outcomes; suppression and invalid scalar settings are separate free-fall entries.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit owns local body/contact records and returned reports, invoking portable hull and trajectory code without a physics host, renderer or native artifact.
 */
export function test_validation_free_fall(): void {
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
    (t: IAutoMovieTrack): boolean => t.channel.kind === "node" && t.channel.path === "translation",
  )!;
  const lastY: number = track.values[track.values.length - 2]!;
  TestValidator.predicate(
    "free-fall height = origin.y + ½·g·t²",
    nclose(lastY, 5 + 0.5 * -9.81 * 1 * 1),
  );
}
