import {
  AutoMovieInspectorPlayhead,
  handleAutoMovieInspectorKey,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

/** The element a key goes to, as the handler reads it. */
type Target = { closest(selectors: string): unknown } | null;

/**
 * The inspector's playback keys move the playhead as a video player's do, hand back the second a seek leaves it on, and leave a shortcut or a key a control answers to the page.
 *
 * Scenarios:
 *
 * 1. Space starts a stopped playhead and stops a playing one, and K and its capital do the same; none hands back a second.
 * 2. On a 4 s film at 0.5 s, L seeks to 1.5 s and J back to 0.5 s, and the capitals do the same; at 0.2 s J lands on 0, and at 3.6 s L lands on 4, each handing back that second.
 * 3. At 24 frames a second, full stop steps one frame forward and comma one back, pausing a playing playhead; with no frame rate known they step a twenty-fourth of a second.
 * 4. Home goes to 0 and End to 4; a letter the inspector does not use is not handled and moves nothing.
 * 5. Space, L and Home held with Ctrl, Meta or Alt are not handled and move nothing, while Shift with L still seeks.
 * 6. Space and L that go to a button, a summary, a link, a field or a `role=slider` widget, or to an element inside a button, are not handled and move nothing; on the canvas, an element outside every control, they are handled.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Drives the public key handler on a public playhead and reads the playhead's snapshot and the handler's result.
 * @evidence contracts/development/testing.md#independent-expectations Each expected second is the starting second plus or minus the step the key names, clamped to the film, worked out in the test; a target is a test element whose `closest` answers by its own tag and role and those of its ancestors, written here, not by the handler's selector list.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts playing against stopped, seeks inside against seeks past either end, a known frame rate against none, used against unused keys, each modifier against none and Shift, and every kind of control against the canvas and against a child of a control.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through `test_inspector_keys`; no React is rendered and no DOM event is made, a target being a plain object with `closest`.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 6 numbered scenarios it runs, each naming its input and the behaviour it pins.
 */
export function test_inspector_keys(): void {
  const playhead: AutoMovieInspectorPlayhead = new AutoMovieInspectorPlayhead();
  playhead.setDuration(4);

  // A test element: `closest` matches a simple selector of the list, its tag,
  // its tag with one of its attributes, or its role, against the element and
  // then its ancestors.
  const element: (
    tag: string,
    more?: { attribute?: string; role?: string; parent?: Target },
  ) => Target = (
    tag: string,
    more: { attribute?: string; role?: string; parent?: Target } = {},
  ): Target => ({
    closest: (selectors: string): unknown => {
      const listed: string[] = selectors
        .split(",")
        .map((selector: string): string => selector.trim());
      const own: string[] = [
        tag,
        ...(more.attribute === undefined ? [] : [`${tag}[${more.attribute}]`]),
        ...(more.role === undefined ? [] : [`[role=${more.role}]`]),
      ];
      return own.some((selector: string): boolean => listed.includes(selector))
        ? {}
        : (more.parent?.closest(selectors) ?? null);
    },
  });
  const canvas: Target = element("canvas");
  const press: (
    key: string,
    fps?: number | null,
    more?: { modifier?: "ctrlKey" | "metaKey" | "altKey"; target?: Target },
  ) => { handled: boolean; seconds: number | null } = (
    key: string,
    fps: number | null = 24,
    more: { modifier?: "ctrlKey" | "metaKey" | "altKey"; target?: Target } = {},
  ): { handled: boolean; seconds: number | null } =>
    handleAutoMovieInspectorKey(
      {
        key,
        ctrlKey: more.modifier === "ctrlKey",
        metaKey: more.modifier === "metaKey",
        altKey: more.modifier === "altKey",
        target: more.target === undefined ? canvas : more.target,
      },
      playhead,
      fps,
    );
  const near: (
    title: string,
    actual: number | null,
    expected: number,
  ) => void = (title: string, actual: number | null, expected: number): void =>
    TestValidator.predicate(
      `${title}: ${actual} is ${expected}`,
      actual !== null && Math.abs(actual - expected) < 1e-9,
    );

  // 1. Play and pause.
  for (const key of [" ", "k", "K"]) {
    TestValidator.equals(
      `${JSON.stringify(key)} starts and hands back no second`,
      press(key),
      { handled: true, seconds: null },
    );
    TestValidator.equals(
      `${JSON.stringify(key)} plays`,
      playhead.getSnapshot().playing,
      true,
    );
    press(key);
    TestValidator.equals(
      `${JSON.stringify(key)} stops`,
      playhead.getSnapshot().playing,
      false,
    );
  }

  // 2. A second back and forward, clamped to the film.
  playhead.seek(0.5);
  near("L from 0.5", press("l").seconds, 1.5);
  near("J from 1.5", press("j").seconds, 0.5);
  near("capital L from 0.5", press("L").seconds, 1.5);
  near("capital J from 1.5", press("J").seconds, 0.5);
  playhead.seek(0.2);
  near("J from 0.2", press("j").seconds, 0);
  playhead.seek(3.6);
  near("L from 3.6", press("l").seconds, 4);

  // 3. Frame steps pause and step one frame.
  playhead.seek(1);
  playhead.play();
  near("full stop from 1", press(".").seconds, 1 + 1 / 24);
  TestValidator.equals(
    "a frame step pauses",
    playhead.getSnapshot().playing,
    false,
  );
  near("comma back", press(",").seconds, 1);
  near("comma without a rate", press(",", null).seconds, 1 - 1 / 24);

  // 4. The ends, and an unused key.
  near("Home", press("Home").seconds, 0);
  near("End", press("End").seconds, 4);
  TestValidator.equals("an unused key is not handled", press("q"), {
    handled: false,
    seconds: null,
  });
  TestValidator.equals(
    "an unused key moves nothing",
    playhead.getSnapshot().seconds,
    4,
  );

  // 5. A modifier leaves the key to the page; Shift does not.
  playhead.seek(1);
  for (const modifier of ["ctrlKey", "metaKey", "altKey"] as const)
    for (const key of [" ", "l", "Home"]) {
      TestValidator.equals(
        `${modifier} with ${JSON.stringify(key)} is not handled`,
        press(key, 24, { modifier }),
        { handled: false, seconds: null },
      );
      TestValidator.equals(
        `${modifier} with ${JSON.stringify(key)} moves nothing`,
        [playhead.getSnapshot().seconds, playhead.getSnapshot().playing],
        [1, false],
      );
    }
  near("Shift with L still seeks", press("L").seconds, 2);

  // 6. A key a control answers stays with it.
  playhead.seek(1);
  const button: Target = element("button");
  const controls: Readonly<Record<string, Target>> = {
    button,
    summary: element("summary"),
    link: element("a", { attribute: "href" }),
    field: element("input"),
    slider: element("div", { role: "slider" }),
    "a child of a button": element("span", { parent: button }),
  };
  for (const [name, target] of Object.entries(controls))
    for (const key of [" ", "l"]) {
      TestValidator.equals(
        `${JSON.stringify(key)} on ${name} is not handled`,
        press(key, 24, { target }),
        { handled: false, seconds: null },
      );
      TestValidator.equals(
        `${JSON.stringify(key)} on ${name} moves nothing`,
        [playhead.getSnapshot().seconds, playhead.getSnapshot().playing],
        [1, false],
      );
    }
  near("L on the canvas seeks", press("l", 24, { target: canvas }).seconds, 2);
  TestValidator.equals(
    "a key with no element target is handled",
    press("Home", 24, { target: null }),
    { handled: true, seconds: 0 },
  );
}
