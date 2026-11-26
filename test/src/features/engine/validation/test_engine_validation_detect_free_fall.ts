import { AutoMovieGravity, AutoMovieEngineValidation } from "@automovie/engine";
import type {
  IAutoMovieBody,
  IAutoMovieTrack,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  hasViolation,
  nclose,
  validationHasNoWarnings,
  validationHasWarning,
  validationHasWarningCount,
} from "../../internal/predicates";

type Input = Parameters<typeof AutoMovieEngineValidation.detectFreeFall>[0];
type Result = ReturnType<typeof AutoMovieEngineValidation.detectFreeFall>;

/**
 * `detectFreeFall` warns about an unsupported, unattached declared body, emits
 * a fall event and proposes the free-fall arc y = y0 - g t^2 / 2.
 *
 * Fixture: a 1 kg body with its centre of mass at (0, 5, 0) and the square
 * footprint [-1, 1]^2 on the floor.
 *
 * Scenarios:
 *
 * 1. No support: a physics warning at `.gravity`, one `fall` event and an arc
 *    whose last height after the default 1 s is 5 - g / 2.
 * 2. A centre at (5, 5, 5) outside the footprint warns once, and the unnamed
 *    node's arc id carries "object"; inside the footprint: nothing.
 * 3. A null body, an attached body and an already falling body never warn; the
 *    `defies-gravity` intent keeps the event and drops the warning and arc.
 * 4. Margin -1 and fall duration 0 are range findings at `.margin` and
 *    `.fallDuration`.
 */
export function test_engine_validation_detect_free_fall(): void {
  const body: IAutoMovieBody = {
    mass: 1,
    centerOfMass: null,
    friction: 0.5,
    restitution: 0.5,
  };
  const footprint: IAutoMovieVector3[] = [
    { x: -1, y: 0, z: -1 },
    { x: 1, y: 0, z: -1 },
    { x: 1, y: 0, z: 1 },
    { x: -1, y: 0, z: 1 },
  ];
  const fall = (over: Partial<Input>): Result =>
    AutoMovieEngineValidation.detectFreeFall({
      node: "crate",
      body,
      centerOfMass: { x: 0, y: 5, z: 0 },
      support: [],
      attached: false,
      falling: false,
      ...over,
    });

  // 1.
  const unheld: Result = fall({});
  TestValidator.predicate(
    "gravity warning",
    validationHasWarning("unheld", unheld.validation, "physics", ".gravity"),
  );
  TestValidator.equals(
    "one fall event",
    unheld.events.map((e) => e.kind),
    ["fall"],
  );
  const track: IAutoMovieTrack | undefined = unheld.trajectory?.tracks.find(
    (t: IAutoMovieTrack): boolean =>
      t.channel.kind === "node" && t.channel.path === "translation",
  );
  TestValidator.predicate(
    "arc height",
    track !== undefined &&
      nclose(
        track.values[track.values.length - 2]!,
        5 - 0.5 * AutoMovieGravity.STANDARD,
      ),
  );

  // 2.
  const outside: Result = AutoMovieEngineValidation.detectFreeFall({
    body,
    centerOfMass: { x: 5, y: 5, z: 5 },
    support: footprint,
    attached: false,
    falling: false,
  });
  TestValidator.predicate(
    "outside warns once",
    validationHasWarningCount("outside", outside.validation, 1) &&
      outside.trajectory !== null &&
      outside.trajectory.id.includes("object"),
  );
  const supported: Result = fall({ support: footprint });
  TestValidator.predicate(
    "supported quiet",
    validationHasNoWarnings("supported", supported.validation) &&
      supported.events.length === 0 &&
      supported.trajectory === null,
  );

  // 3.
  for (const [label, over] of [
    ["null body", { body: null }],
    ["attached", { attached: true }],
    ["falling", { falling: true }],
  ] satisfies [string, Partial<Input>][]) {
    const quiet: Result = fall(over);
    TestValidator.predicate(
      label,
      validationHasNoWarnings(label, quiet.validation) &&
        quiet.trajectory === null,
    );
  }
  TestValidator.equals(
    "null body has no event",
    fall({ body: null }).events.length,
    0,
  );
  const levitating: Result = fall({ physicsIntent: "defies-gravity" });
  TestValidator.predicate(
    "intent",
    validationHasNoWarnings("intent", levitating.validation) &&
      levitating.events.length === 1 &&
      levitating.trajectory === null,
  );

  // 4.
  for (const [over, path] of [
    [{ margin: -1 }, ".margin"],
    [{ fallDuration: 0 }, ".fallDuration"],
  ] satisfies [Partial<Input>, string][]) {
    const refused: Result = fall(over);
    TestValidator.predicate(
      path,
      refused.validation.success === false &&
        hasViolation(refused.validation, "range", path),
    );
  }
}
