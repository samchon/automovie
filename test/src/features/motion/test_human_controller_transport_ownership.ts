import { AutoMovieHumanController } from "@automovie/human/control";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/**
 * Human motion definitions and diagnostic snapshots retain independent ownership.
 *
 * Scenarios:
 * 1. An empty catalogue remains static and rejects unknown selection.
 * 2. Caller definitions and returned nested records cannot change private data.
 * 3. Invalid duration, key timing, loop and pose structure fail admission.
 * 4. Disposal is idempotent, preserves diagnostics and rejects further controls.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls public definition admission, snapshot access and disposal, observing isolation and terminal refusal without a renderer or pose evaluator.
 * @evidence contracts/testing.md#independent-expectations Authored scalar definitions and public copy/disposal contracts supply expectations; deliberate caller/returned-record mutations test isolation without stored output snapshots.
 * @evidence contracts/testing.md#distinguishing-cases Covers empty/singleton/malformed timing, invalid loop/pose structure, nested input/output aliases and every disposed control. The transport unit owns clock arithmetic, selection, pause/resume, seek and reset transitions.
 * @evidence contracts/testing.md#execution-ownership This discoverable synchronous unit remains under the existing transport basename filter, using only pure control and shared assertion helpers with no generation, Three, browser, host, native artifact or timer.
 */
export function test_human_controller_transport_ownership(): void {
  const duration: number = 2.5;

  /** Authored scalar timing records contain no skeleton or coordinate fixture. */
  const definition: (
    seconds: number,
    loop: boolean,
  ) => AutoMovieHumanController.IDefinition = (
    seconds: number,
    loop: boolean,
  ): AutoMovieHumanController.IDefinition => ({
    duration: seconds,
    loop,
    keys: [
      { time: 0, pose: {} },
      { time: seconds, pose: {} },
    ],
  });

  /** Compare floating state through the shared finite-scalar predicate. */
  const state: (
    title: string,
    control: AutoMovieHumanController,
    expected: AutoMovieHumanController.IState,
  ) => void = (
    title: string,
    control: AutoMovieHumanController,
    expected: AutoMovieHumanController.IState,
  ): void => {
    const actual: AutoMovieHumanController.IState = control.state;
    TestValidator.equals(title + " motion", actual.motion, expected.motion);
    TestValidator.equals(title + " playing", actual.playing, expected.playing);
    TestValidator.equals(
      title + " disposed",
      actual.disposed,
      expected.disposed,
    );
    TestValidator.predicate(
      title + " time",
      nclose(actual.time, expected.time, 1e-10),
    );
    TestValidator.predicate(
      title + " duration",
      nclose(actual.duration, expected.duration, 1e-10),
    );
  };

  const empty: AutoMovieHumanController.IState = {
    motion: null,
    time: 0,
    playing: false,
    duration: 0,
    disposed: false,
  };

  const staticOnly: AutoMovieHumanController = new AutoMovieHumanController({});
  state("empty motion catalogue", staticOnly, empty);
  TestValidator.equals("empty catalogue names", staticOnly.names.length, 0);
  TestValidator.predicate(
    "empty catalogue rejects selection",
    throwsError((): void => staticOnly.select("missing")),
  );
  state("empty catalogue refusal", staticOnly, empty);
  staticOnly.dispose();

  // Caller input and returned records are data, not writable aliases of cached definitions.
  const input: Record<string, AutoMovieHumanController.IDefinition> = {
    owned: definition(duration, true),
  };
  const isolated: AutoMovieHumanController = new AutoMovieHumanController(
    input,
  );
  Reflect.set(input.owned!, "duration", duration * 9);
  Reflect.set(input.owned!.keys[0]!, "time", 1);
  Reflect.set(input.owned!.keys[0]!.pose, "arms", {});
  const exposed: AutoMovieHumanController.IDefinition =
    isolated.definition("owned");
  TestValidator.predicate(
    "input duration isolated",
    nclose(exposed.duration, duration),
  );
  TestValidator.predicate(
    "input key isolated",
    nclose(exposed.keys[0]!.time, 0),
  );
  TestValidator.equals(
    "nested input pose isolated",
    Object.hasOwn(exposed.keys[0]!.pose, "arms"),
    false,
  );
  Reflect.set(exposed, "duration", duration * 7);
  Reflect.set(exposed.keys[0]!, "time", 1);
  Reflect.set(exposed.keys[0]!.pose, "arms", {});
  Reflect.set(isolated.names, "0", "missing");
  isolated.play("owned");
  Reflect.set(isolated.state, "time", 900);
  state("output records isolated", isolated, {
    ...empty,
    motion: "owned",
    duration,
    playing: true,
  });
  TestValidator.predicate(
    "definition clone isolated",
    nclose(isolated.definition("owned").keys[0]!.time, 0),
  );
  TestValidator.equals(
    "nested definition clone isolated",
    Object.hasOwn(isolated.definition("owned").keys[0]!.pose, "arms"),
    false,
  );
  TestValidator.equals(
    "name array isolated",
    isolated.names.includes("owned"),
    true,
  );

  // Admission covers the empty/singleton/time-order boundaries, not clinical pose validation.
  for (const invalid of [0, -1, NaN, Infinity, -Infinity])
    TestValidator.predicate(
      "invalid duration " + invalid,
      throwsError((): void => {
        new AutoMovieHumanController({ invalid: definition(invalid, true) });
      }),
    );
  for (const times of [
    [],
    [0],
    [1, duration],
    [0, duration - 1],
    [0, 0, duration],
    [0, 2, 1, duration],
    [0, -1, duration],
    [0, duration + 1, duration],
    [0, NaN, duration],
    [0, Infinity, duration],
  ])
    TestValidator.predicate(
      "invalid authored key times",
      throwsError((): void => {
        new AutoMovieHumanController({
          invalid: {
            duration,
            loop: true,
            keys: times.map(
              (
                time: number,
              ): AutoMovieHumanController.IDefinition["keys"][number] => ({
                time,
                pose: {},
              }),
            ),
          },
        });
      }),
    );
  TestValidator.predicate(
    "invalid loop type",
    throwsError((): void => {
      const invalid: AutoMovieHumanController.IDefinition = definition(
        duration,
        true,
      );
      Reflect.set(invalid, "loop", "yes");
      new AutoMovieHumanController({ invalid });
    }),
  );
  TestValidator.predicate(
    "pose must be an object",
    throwsError((): void => {
      const invalid: AutoMovieHumanController.IDefinition = definition(
        duration,
        true,
      );
      Reflect.set(invalid.keys[0]!, "pose", null);
      new AutoMovieHumanController({ invalid });
    }),
  );

  // Disposal is terminal for controls while its final diagnostic snapshot remains readable.
  isolated.seek(duration / 2);
  isolated.dispose();
  isolated.dispose();
  state("disposed diagnostics", isolated, {
    ...empty,
    motion: "owned",
    duration,
    time: duration / 2,
    disposed: true,
  });
  for (const operation of [
    (): void => isolated.select("owned"),
    (): void => isolated.play("owned"),
    (): void => isolated.play(),
    (): void => isolated.pause(),
    (): void => isolated.seek(0),
    (): void => isolated.update(0),
    (): void => isolated.reset(),
    (): void => {
      isolated.definition("owned");
    },
    (): void => {
      void isolated.names;
    },
  ])
    TestValidator.predicate(
      "disposed operation refuses",
      throwsError(operation),
    );
  state("disposed refusals preserve diagnostics", isolated, {
    ...empty,
    motion: "owned",
    duration,
    time: duration / 2,
    disposed: true,
  });
}
