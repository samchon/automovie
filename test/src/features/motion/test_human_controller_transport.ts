import { AutoMovieHumanController } from "@automovie/human/control";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/**
 * Human playback owns semantic clocks and control transitions without a visual sink.
 *
 * Scenarios:
 * 1. Selection, first-clock anchoring, looping and nonloop completion.
 * 2. Equal elapsed intervals give the same time across update partitions.
 * 3. Pause/resume, seek and reset rebase clocks without consuming paused time.
 * 4. Invalid clocks, seeks and names refuse without changing subsequent progress.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the public pure controller and observes selection, semantic time, playback and refusal state; no renderer or pose evaluator participates.
 * @evidence contracts/testing.md#independent-expectations Caller-authored positive durations, modulo/clamp arithmetic and public control transitions define expectations. Partition equivalence supplements that independent arithmetic rather than comparing outputs alone.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts looping and one-shot clips, first/equal/increasing/decreasing clocks, finite overflow, paused and playing seeks and exact/overshot endpoints. The transport_ownership unit owns definition admission, snapshot isolation and terminal disposal.
 * @evidence contracts/testing.md#execution-ownership This discoverable synchronous unit and transport_ownership share the existing transport basename filter and import only pure control and assertion helpers; neither starts generation, Three, a browser, host, native artifact or timer.
 */
export function test_human_controller_transport(): void {
  const duration: number = 2.5;
  const onceDuration: number = 1.75;

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

  /** Each scenario receives independent definitions and playback ownership. */
  const create: () => AutoMovieHumanController = (): AutoMovieHumanController =>
    new AutoMovieHumanController({
      cycle: definition(duration, true),
      once: definition(onceDuration, false),
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

  const control: AutoMovieHumanController = create();
  const empty: AutoMovieHumanController.IState = {
    motion: null,
    time: 0,
    playing: false,
    duration: 0,
    disposed: false,
  };
  state("initial", control, empty);
  TestValidator.predicate(
    "resume needs a selected motion",
    throwsError((): void => control.play()),
  );
  TestValidator.predicate(
    "seek needs a selected motion",
    throwsError((): void => control.seek(0)),
  );
  state("unselected refusals", control, empty);

  // Selection is distinct from playback, and the first absolute sample is only an anchor.
  control.select("cycle");
  state("selection", control, { ...empty, motion: "cycle", duration });
  control.play();
  control.update(10);
  state("first update", control, {
    ...empty,
    motion: "cycle",
    duration,
    playing: true,
  });
  control.update(10);
  control.update(10 + duration);
  state("exact loop", control, {
    ...empty,
    motion: "cycle",
    duration,
    playing: true,
  });
  control.update(10 + 3 * duration + duration / 3);
  state("multiple loops", control, {
    ...empty,
    motion: "cycle",
    duration,
    playing: true,
    time: duration / 3,
  });

  // Selecting another known motion replaces an active transport rather than resuming it.
  const switching: AutoMovieHumanController = create();
  switching.play("cycle");
  switching.update(10);
  switching.update(10 + duration / 3);
  switching.select("once");
  state("selection stops an active motion", switching, {
    ...empty,
    motion: "once",
    duration: onceDuration,
  });
  switching.dispose();

  // A different count of accepted frame boundaries cannot change total elapsed time.
  for (const seconds of [0.25, 1.3, 5.5]) {
    const total: number = 7 * seconds + seconds / 3;
    for (const divisions of [1, 2, 7, 31]) {
      const partitioned: AutoMovieHumanController =
        new AutoMovieHumanController({
          cycle: definition(seconds, true),
        });
      partitioned.play("cycle");
      partitioned.update(0);
      for (let index: number = 1; index <= divisions; index++)
        partitioned.update((total * index) / divisions);
      state("partition " + seconds + "/" + divisions, partitioned, {
        ...empty,
        motion: "cycle",
        duration: seconds,
        playing: true,
        time: total % seconds,
      });
      partitioned.dispose();
    }
  }

  // One full finite period preserves phase even when naive phase-plus-delta would overflow.
  const largeDuration: number = Number.MAX_VALUE;
  const large: AutoMovieHumanController = new AutoMovieHumanController({
    cycle: definition(largeDuration, true),
    once: definition(largeDuration, false),
  });
  large.play("cycle");
  large.seek(largeDuration / 2);
  large.update(0);
  large.update(largeDuration);
  state("finite full-period advance", large, {
    ...empty,
    motion: "cycle",
    duration: largeDuration,
    time: largeDuration / 2,
    playing: true,
  });
  large.play("once");
  large.seek(largeDuration / 2);
  large.update(0);
  large.update(largeDuration);
  state("finite one-shot saturation", large, {
    ...empty,
    motion: "once",
    duration: largeDuration,
    time: largeDuration,
  });
  large.dispose();

  // Rejected clocks must not rebase the anchor and count an accepted interval twice.
  control.play("cycle");
  control.update(10);
  control.update(11);
  for (const invalid of [-1, NaN, Infinity, -Infinity, 10]) {
    TestValidator.predicate(
      "invalid clock " + invalid,
      throwsError((): void => control.update(invalid)),
    );
    state("clock refusal preserves transport", control, {
      ...empty,
      motion: "cycle",
      duration,
      playing: true,
      time: 1,
    });
  }
  control.update(12);
  state("accepted interval after refusal", control, {
    ...empty,
    motion: "cycle",
    duration,
    playing: true,
    time: 2,
  });

  // Paused wall time does not leak into resume, and pause still admits monotonic clocks.
  control.pause();
  control.update(100);
  TestValidator.predicate(
    "backward paused clock",
    throwsError((): void => control.update(99)),
  );
  control.update(101);
  state("paused time", control, {
    ...empty,
    motion: "cycle",
    duration,
    time: 2,
  });
  control.play();
  control.update(1);
  state("resume rebase", control, {
    ...empty,
    motion: "cycle",
    duration,
    time: 2,
    playing: true,
  });
  control.update(1.25);
  state("resume interval", control, {
    ...empty,
    motion: "cycle",
    duration,
    time: 2.25,
    playing: true,
  });

  // Seek owns local clip time, preserves pause, and starts a new absolute-clock origin.
  control.seek(4 * duration + duration / 4);
  control.update(50);
  state("playing loop seek", control, {
    ...empty,
    motion: "cycle",
    duration,
    time: duration / 4,
    playing: true,
  });
  control.pause();
  control.seek(duration / 2);
  control.update(0);
  state("paused seek", control, {
    ...empty,
    motion: "cycle",
    duration,
    time: duration / 2,
  });
  for (const invalid of [-1, NaN, Infinity, -Infinity]) {
    TestValidator.predicate(
      "invalid seek " + invalid,
      throwsError((): void => control.seek(invalid)),
    );
    state("seek refusal", control, {
      ...empty,
      motion: "cycle",
      duration,
      time: duration / 2,
    });
  }
  for (const operation of [
    (): void => control.select("missing"),
    (): void => control.play("missing"),
    (): void => {
      control.definition("missing");
    },
  ]) {
    TestValidator.predicate("unknown motion refuses", throwsError(operation));
    state("name refusal", control, {
      ...empty,
      motion: "cycle",
      duration,
      time: duration / 2,
    });
  }

  // Once clips stop exactly at duration, and reaching that endpoint by seek also stops.
  control.play("once");
  control.update(20);
  control.update(20 + onceDuration / 2);
  state("one-shot interior", control, {
    ...empty,
    motion: "once",
    duration: onceDuration,
    time: onceDuration / 2,
    playing: true,
  });
  control.update(20 + 10 * onceDuration);
  state("one-shot clamp", control, {
    ...empty,
    motion: "once",
    duration: onceDuration,
    time: onceDuration,
  });
  control.play();
  state("finished resume restarts", control, {
    ...empty,
    motion: "once",
    duration: onceDuration,
    playing: true,
  });
  control.seek(onceDuration);
  state("seek end stops", control, {
    ...empty,
    motion: "once",
    duration: onceDuration,
    time: onceDuration,
  });
  control.seek(onceDuration * 10);
  state("seek beyond end stays clamped", control, {
    ...empty,
    motion: "once",
    duration: onceDuration,
    time: onceDuration,
  });
  control.seek(onceDuration / 3);
  state("seek backward retains stop", control, {
    ...empty,
    motion: "once",
    duration: onceDuration,
    time: onceDuration / 3,
  });
  control.play();
  control.update(0);
  state("resume sought time", control, {
    ...empty,
    motion: "once",
    duration: onceDuration,
    time: onceDuration / 3,
    playing: true,
  });
  control.reset();
  state("reset deselects", control, empty);
  TestValidator.predicate(
    "reset requires selection again",
    throwsError((): void => control.play()),
  );

  control.dispose();
}
