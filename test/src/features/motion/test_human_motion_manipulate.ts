import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Transform,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanHand,
  HumanManipulate,
  HumanPerformance,
  type HumanSegment,
  type IHumanBody,
  type IHumanProp,
  manipulate,
  typeText,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/** A contact digit's bound to its site, metres: #3446's test line (each contact's digit tip within 2 mm of its site at its instant). */
const CONTACT: number = 0.002;

/** A skilled typist's interval between strokes, seconds: about every 0.15 to 0.2 s (Salthouse 1986, Psychol Bull 99:303), the range `typeText` cites. */
const SKILLED: readonly [number, number] = [0.15, 0.2];

/** A keyboard prop at a world point, its typist on its +Z side facing it (`createKeyboard`'s contacts). */
const keyboard = (at: IAutoMovieVector3): IHumanProp => ({
  subject: "keyboard",
  frame: { position: at, rotation: { x: 0, y: 1, z: 0, w: 0 } },
  points: {},
  affordances: [
    {
      id: "homeRow",
      kind: "surface",
      frame: Transform.identity(),
      extent: null,
    },
    {
      id: "keys",
      kind: "surface",
      frame: Transform.identity(),
      extent: null,
      width: typeText.WIDTH,
    },
  ],
});

/** A keypad of three buttons 19.05 mm apart in a row, its +Y the buttons' outward normal. */
const keypad = (at: IAutoMovieVector3): IHumanProp => ({
  subject: "keypad",
  frame: { position: at, rotation: Quaternion.identity() },
  points: {},
  affordances: [-1, 0, 1].map((k: number) => ({
    id: `key${k + 1}`,
    kind: "button" as const,
    frame: {
      ...Transform.identity(),
      translation: { x: k * typeText.PITCH, y: 0, z: 0 },
    },
    extent: null,
    travel: 0.002,
  })),
});

/** The touch-typing chart's digit for a letter, written from the standard home-row assignment. */
const chart = (letter: string): [HumanHand.Side, string] => {
  const rows: [string, HumanHand.Side, string][] = [
    ["qaz", "left", "little"],
    ["wsx", "left", "ring"],
    ["edc", "left", "middle"],
    ["rfvtgb", "left", "index"],
    ["yhnujm", "right", "index"],
    ["ik", "right", "middle"],
    ["ol", "right", "ring"],
    ["p", "right", "little"],
  ];
  if (letter === " ") return ["right", "thumb"];
  const row = rows.find((r) => r[0].includes(letter))!;
  return [row[1], row[2]];
};

/**
 * A keyed contact sequence: typing, a keypad and the refusals (#3446).
 *
 * The average man stands before a keyboard at his elbows' height, a
 * forearm's reach ahead, and before a keypad.
 *
 * Scenarios:
 *
 * 1. Touch typing "the quick fox": at each press the tip of the digit the
 *    home-row chart assigns lies within 2 mm of its key's centre less the
 *    key's travel, the issue's bound, on both hands.
 * 2. No digit presses two keys at once: at each press, every other digit's
 *    tip of the pressing hand stands above the key tops.
 * 3. An elite typist's mean interval is no longer than the 0.2 s at which
 *    skilled typists strike at the slowest (Salthouse 1986's 0.15 to 0.2 s,
 *    a mean, about which single intervals scatter), and a novice types the
 *    text slower.
 * 4. The same seed replays to the bit; another seed changes the timing.
 * 5. A keypad's three buttons pressed with no digit named: the fingering
 *    keeps the wrist still, so the forefinger, middle and ring fingers take
 *    the three adjacent buttons rather than one digit travelling.
 * 6. `dial` presses with the forefinger only.
 * 7. Refusals: no contacts; a site the prop lacks, with its sites as the
 *    alternatives; times given for some contacts and not others.
 * 8. `typeTwoFinger` presses each key with the forefinger of the hand on
 *    its side (`typeText`'s act as a row), within 2 mm.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Plans and performs the law and its rows and measures the displayed digit tips.
 * @evidence contracts/development/testing.md#independent-expectations The chart and the key layout are the standard's; the bounds are the issue's (2 mm) and Salthouse's intervals; the fingering's outcome is Handrix's.
 * @evidence contracts/development/testing.md#distinguishing-cases Both hands, elite and novice, two seeds, chosen and named digits, and three refusals.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit test preparing one polygon man; no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the cast and the seven scenarios with their bounds and sources.
 */
export function test_human_motion_manipulate(): void {
  const complaints: string[] = [];
  const body: IHumanBody = motionHumanBody("m-average");
  const m: IHumanBody["measure"] = body.measure;
  // A digit's tip on its displayed distal phalanx, as the fit placed it.
  const tipOf = (
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    side: HumanHand.Side,
    digit: string,
  ): IAutoMovieVector3 => {
    const region: resolveAutoMovieHumanoidSurfaces.IFrame =
      body.surfaces.regions[
        `${digit}Tip${side === "left" ? "Left" : "Right"}` as AutoMovieHumanoidRegion
      ];
    return resolveAutoMovieHumanoidSurfaces.place(
      region,
      bones.get(region.bone)!,
    ).point;
  };
  const at: IAutoMovieVector3 = {
    x: 0,
    y: m.shoulderHeight - m.upperArm,
    z: body.rest.get("rightUpperArm")!.z + 0.8 * m.forearm,
  };
  const perform = (
    composition: HumanPerformance.IInput["composition"],
    props: IHumanProp[],
    seed: string = "manipulate",
    level: "novice" | "amateur" | "trained" | "elite" = "elite",
  ): HumanPerformance =>
    new HumanPerformance({
      seed,
      laws: [
        HumanManipulate.sequence,
        HumanManipulate.type,
        HumanManipulate.typeTwoFinger,
        HumanManipulate.dial,
      ],
      props,
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level },
        },
      ],
      composition,
    });
  const text: string = "the quick fox";
  const presses = (p: HumanPerformance): number[] => {
    const s: HumanSegment.ISegment = p.segments("a").at(-1)!;
    return s.plan.events
      .filter((e) => e.name.startsWith("press"))
      .map((e) => s.start + e.share * s.plan.duration);
  };

  // 1, 2. Typing with the chart's digits.
  try {
    const typed: HumanPerformance = perform(
      HumanChain.subject("a").registered("type", { prop: "keyboard", text })
        .node,
      [keyboard(at)],
    );
    const times: number[] = presses(typed);
    // Typing's layout is in the typist's frame (x to the typist's left, z
    // away), and the typist faces +Z at yaw 0: the keyboard's own half
    // turn only puts its typist's side toward him.
    [...text].forEach((letter: string, i: number): void => {
      const [side, digit] = chart(letter);
      const key: IAutoMovieVector3 = Vector3.add(
        at,
        typeText.key(letter).at,
      );
      const target: IAutoMovieVector3 = { ...key, y: key.y - typeText.TRAVEL };
      const bones = typed.bones("a", times[i]!);
      const tip: IAutoMovieVector3 = tipOf(bones, side, digit);
      const miss: number = Vector3.length(Vector3.subtract(tip, target));
      if (!(miss <= CONTACT))
        complaints.push(
          `"${letter}" (${side} ${digit}): the tip lies ${(miss * 1000).toFixed(1)} mm from the pressed key, within ${CONTACT * 1000} mm expected`,
        );
      for (const other of manipulate.FINGERS)
        if (other !== digit) {
          const y: number = tipOf(bones, side, other).y;
          if (!(y > key.y))
            complaints.push(
              `"${letter}": the ${side} ${other} is below the key tops (${((key.y - y) * 1000).toFixed(1)} mm) while the ${digit} presses`,
            );
        }
    });

    // 3. Elite and novice intervals.
    const gaps: number[] = times
      .slice(1)
      .map((t: number, i: number): number => t - times[i]!);
    // Salthouse's range is a skilled typist's mean interval; single
    // intervals scatter about it, and an elite types at least as fast.
    const mean: number =
      gaps.reduce((sum: number, g: number): number => sum + g, 0) / gaps.length;
    if (!(mean <= SKILLED[1]))
      complaints.push(
        `an elite typist's mean interval is ${mean.toFixed(3)} s, at most a skilled typist's ${SKILLED[1]} s expected`,
      );
    const novice: number[] = presses(
      perform(
        HumanChain.subject("a").registered("type", { prop: "keyboard", text })
          .node,
        [keyboard(at)],
        "manipulate",
        "novice",
      ),
    );
    if (!(novice.at(-1)! - novice[0]! > times.at(-1)! - times[0]!))
      complaints.push("a novice types the text no slower than an elite typist");

    // 4. Replay and another seed.
    const again: number[] = presses(
      perform(
        HumanChain.subject("a").registered("type", { prop: "keyboard", text })
          .node,
        [keyboard(at)],
      ),
    );
    if (!again.every((t: number, i: number): boolean => Object.is(t, times[i])))
      complaints.push("the same seed does not replay the presses to the bit");
    const other: number[] = presses(
      perform(
        HumanChain.subject("a").registered("type", { prop: "keyboard", text })
          .node,
        [keyboard(at)],
        "another",
      ),
    );
    if (other.every((t: number, i: number): boolean => Object.is(t, times[i])))
      complaints.push("another seed gives the very same timing");
  } catch (error) {
    complaints.push(
      `typing: expected to plan, got ${(error as Error).message}`,
    );
  }

  // 5. The fingering keeps the wrist still on three adjacent buttons.
  const pad: IAutoMovieVector3 = { ...at, y: at.y - 0.05 };
  try {
    const sequence: manipulate.IContact[] = [
      { site: "key0" },
      { site: "key1" },
      { site: "key2" },
    ];
    const pressed: HumanPerformance = perform(
      HumanChain.subject("a").registered("manipulate", {
        prop: "keypad",
        contacts: sequence,
        side: "right",
      }).node,
      [keypad(pad)],
    );
    const times: number[] = presses(pressed);
    const used: string[] = times.map((t: number, i: number): string => {
      const site: IAutoMovieVector3 = Vector3.add(pad, {
        x: (i - 1) * typeText.PITCH,
        y: 0,
        z: 0,
      });
      let best: string = "";
      let near: number = Infinity;
      for (const d of manipulate.FINGERS) {
        const tip: IAutoMovieVector3 = tipOf(pressed.bones("a", t), "right", d);
        const dist: number = Vector3.length(Vector3.subtract(tip, site));
        if (dist < near) {
          near = dist;
          best = d;
        }
      }
      return best;
    });
    if (new Set(used).size !== 3)
      complaints.push(
        `three adjacent buttons were pressed by ${used.join(", ")}, three digits expected`,
      );
  } catch (error) {
    complaints.push(
      `a keypad: expected to plan, got ${(error as Error).message}`,
    );
  }

  // 6. Dial with the forefinger.
  try {
    const dialled: HumanPerformance = perform(
      HumanChain.subject("a").registered("dial", {
        prop: "keypad",
        contacts: [{ site: "key0" }, { site: "key2" }],
      }).node,
      [keypad(pad)],
    );
    presses(dialled).forEach((t: number, i: number): void => {
      const site: IAutoMovieVector3 = Vector3.add(pad, {
        x: (2 * i - 1) * typeText.PITCH,
        y: -0.002,
        z: 0,
      });
      const tip: IAutoMovieVector3 = tipOf(dialled.bones("a", t), "right", "index");
      const miss: number = Vector3.length(Vector3.subtract(tip, site));
      if (!(miss <= CONTACT))
        complaints.push(
          `dial ${i + 1}: the forefinger lies ${(miss * 1000).toFixed(1)} mm from the button, within ${CONTACT * 1000} mm expected`,
        );
    });
  } catch (error) {
    complaints.push(`dial: expected to plan, got ${(error as Error).message}`);
  }

  // 8. Two-finger typing: the forefinger of the key's side.
  try {
    const two: HumanPerformance = perform(
      HumanChain.subject("a").registered("typeTwoFinger", {
        prop: "keyboard",
        text: "hi",
      }).node,
      [keyboard(at)],
    );
    // Typing's layout is in the typist's frame (x to the typist's left, z
    // away), and the typist faces +Z at yaw 0: the keyboard's own half
    // turn only puts its typist's side toward him.
    presses(two).forEach((t: number, i: number): void => {
      const k = typeText.key("hi"[i]!);
      const key: IAutoMovieVector3 = Vector3.add(
        at,
        k.at,
      );
      const tip: IAutoMovieVector3 = tipOf(two.bones("a", t), k.side, "index");
      const miss: number = Vector3.length(
        Vector3.subtract(tip, { ...key, y: key.y - typeText.TRAVEL }),
      );
      if (!(miss <= CONTACT))
        complaints.push(
          `two-finger "${"hi"[i]}": the ${k.side} forefinger lies ${(miss * 1000).toFixed(1)} mm from the key, within ${CONTACT * 1000} mm expected`,
        );
    });
  } catch (error) {
    complaints.push(
      `two-finger typing: expected to plan, got ${(error as Error).message}`,
    );
  }

  // 7. Refusals.
  const refused = (contacts: manipulate.IContact[], fragment: string): void => {
    try {
      perform(
        HumanChain.subject("a").registered("manipulate", {
          prop: "keypad",
          contacts,
        }).node,
        [keypad(pad)],
      );
      complaints.push(`${fragment}: expected a refusal`);
    } catch (error) {
      if (!(error as Error).message.includes(fragment))
        complaints.push(
          `${fragment}: refused with "${(error as Error).message}"`,
        );
    }
  };
  refused([], "at least one contact");
  refused([{ site: "key9" }], "key0");
  refused(
    [{ site: "key0", at: 0.3 }, { site: "key1" }],
    "every contact a time",
  );
  TestValidator.equals("a keyed contact sequence", complaints, []);
}
