import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, at, person, scene, to }: typeof SceneBuild = SceneBuild;

/**
 * A point at eye height on the street, as a shop window a passer-by looks at.
 *
 * @param x World metres.
 * @param z World metres.
 * @returns The target.
 */
const shop = (x: number, z: number): Record<string, unknown> => ({
  kind: "point",
  frame: "world",
  at: { x, y: 1.6, z },
});

/** The street scenes composed from the lexicon's gaits and pursuits of #3392. */
export const SCENES_STREET: readonly IScene[] = [
  scene(
    {
      id: "street-corner",
      title: "Street corner",
      summary:
        "Eight passers-by cross a corner, each with their own gait and business.",
      setting: "street",
      roles: {
        a: "stroller",
        b: "in a hurry",
        c: "jogger",
        d: "limping",
        e: "swaggering",
        f: "proud",
        g: "sad",
        h: "reading",
      },
      needs: [],
      view: "top",
      featured: 6,
    },
    "street",
    [
      person("a", "f1", -4, -2, 90, [
        act("stroll", { to: to(-1, -2) }),
        act("look", {
          with: "trunk",
          cue: "seen",
          target: shop(-0.5, -3.5),
          seconds: 1.5,
        }),
        act("checkWatch"),
        act("stroll", { to: to(4, -2) }),
      ]),
      person("b", "m1", 4, -1, 270, [
        act("hurry", { to: to(1.5, -1) }),
        act("checkWatch"),
        act("hurry", { to: to(-3, -1) }),
        act("gesture", { kind: "raiseHand", hold: 1.5 }),
        act("hurry", { to: to(-5, -1) }),
      ]),
      person("c", "m2", -4, 0, 90, [
        act("jog", { to: to(3, 0) }),
        act("checkWatch"),
        act("neckRoll"),
        act("jog", { to: to(-4, 0) }),
      ]),
      person("d", "f2", 4, 1, 270, [
        act("limp", { to: to(1.5, 1) }),
        act("wince"),
        act("handsOnHips", { seconds: 1.5 }),
        act("limp", { to: to(-2, 1) }),
        act("kneelBriefly"),
        act("wince"),
      ]),
      person("e", "m1", -4, 2, 90, [
        act("swagger", { to: to(-0.5, 2) }),
        act("gesture", { kind: "chinLift" }),
        act("handsInPockets", { seconds: 1.5 }),
        act("swagger", { to: to(4, 2) }),
        act("look", {
          with: "trunk",
          cue: "seen",
          target: at("f", "face"),
        }),
        act("gesture", { kind: "wave", count: 3 }),
      ]),
      person("f", "f1", 3, 3, 270, [
        act("proud", { to: to(0.5, 3) }),
        act("gesture", { kind: "squareShoulders" }),
        act("gesture", { kind: "nod" }),
        act("proud", { to: to(-3.5, 3) }),
        act("look", {
          with: "trunk",
          cue: "seen",
          target: at("e", "face"),
        }),
        act("gesture", { kind: "wave", count: 2 }),
        act("handsOnHips", { seconds: 1.5 }),
      ]),
      person("g", "m2", -3, 4, 90, [
        act("sad", { to: to(-0.5, 4) }),
        act("rubEyes"),
        act("trudge", { to: to(2.5, 4) }),
        act("facepalm"),
        act("gesture", { kind: "shakeHead" }),
      ]),
      person("h", "f2", 2, -3, 300, [
        act(
          "readingWalk",
          { to: to(-0.5, -3.3) },
          { over: [act("checkPhone", { seconds: 2 })] },
        ),
        act("handToFace", { task: "phone", seconds: 2 }),
        act(
          "walk",
          { to: to(-4.5, -3.6) },
          { over: [act("handToFace", { task: "phone", seconds: 1.5 })] },
        ),
        act("checkPhone", { seconds: 1.5 }),
      ]),
    ],
  ),
  scene(
    {
      id: "pursuit",
      title: "Pursuit",
      summary:
        "A man bolts from an officer; a second officer heads him off and he drops to his knees.",
      setting: "street",
      roles: {
        run: "fleeing",
        cop: "chasing",
        cut: "intercepting",
        tag: "following",
        vip: "escorted",
        esc: "escort",
      },
      needs: [],
      view: "top",
    },
    "pursuit",
    [
      person("run", "m1", 0, -1, 0, [
        act(
          "readingWalk",
          { to: to(0, 0.5) },
          { over: [act("checkPhone", { seconds: 1.5 })] },
        ),
        act(
          "look",
          { with: "trunk", cue: "seen", target: at("cop", "face") },
          { anchor: "spotted" },
        ),
        act(
          "flee",
          { from: "cop", metres: 7, pace: "run" },
          { anchor: "bolt" },
        ),
        act("startle"),
        act("handsUp", { hold: 1 }),
        act("kneel", { kind: "both", hold: 1, rise: false }),
      ]),
      person("cop", "m2", 0, -4, 0, [
        act("walk", { to: to(0, -2) }),
        act("gesture", { kind: "point", target: at("run", "upperBack") }),
        act("halt", { hold: 0.5 }, { sync: { of: "spotted", event: "end" } }),
        act("sprint", { to: to(0.3, 6.8) }),
        act("grab", { target: at("run", "upperArmRight") }),
        act("gesture", { kind: "point", target: at("run", "upperBack") }),
        act("gesture", { kind: "nod" }),
      ]),
      person("cut", "f1", 3.5, 3, 270, [
        act("checkWatch"),
        act("look", {
          with: "trunk",
          cue: "seen",
          target: at("run", "face"),
        }),
        act("startle", {}, { sync: { of: "bolt" } }),
        act("intercept", { target: "run" }),
        act("halt", { hold: 2 }),
        act("gesture", { kind: "point", target: at("run", "face") }),
        act("handsOnHips", { seconds: 1.5 }),
      ]),
      person("tag", "f2", -2.5, -6, 0, [
        act("stroll", { to: to(-2.5, -3.5) }),
        act("startle", {}, { sync: { of: "bolt" } }),
        act("hurry", { to: to(-1.5, 3) }),
        act("handToFace", { task: "phone", seconds: 3 }),
      ]),
      person("vip", "f1", -3, 1.6, 90, [
        act("stroll", { to: to(-1, 1.6) }),
        act("startle", {}, { sync: { of: "bolt" } }),
        act("coverMouth"),
        act("hurry", { to: to(-5, 4.5) }),
        act("look", {
          with: "trunk",
          cue: "seen",
          target: at("run", "face"),
        }),
      ]),
      person("esc", "m1", -3, 1, 90, [
        act("stroll", { to: to(-2, 1) }),
        act("look", {
          with: "trunk",
          cue: "seen",
          target: at("run", "face"),
        }),
        act("escort", { target: at("vip", "upperArmLeft") }),
        act("look", {
          with: "trunk",
          cue: "seen",
          target: at("cop", "face"),
        }),
      ]),
    ],
  ),
  scene(
    {
      id: "sneaking-in",
      title: "Sneaking in",
      summary:
        "Two burglars creep up and take cover; one tiptoes ahead and the other hushes him.",
      setting: "street",
      roles: { ike: "burglar", joy: "burglar" },
      needs: [],
      skill: "novice",
    },
    "sneak",
    [
      person("ike", "m1", -1, -2.5, 0, [
        act("prowl", { to: to(-1, -0.5) }),
        act("takeCover"),
        act("look", {
          with: "trunk",
          cue: "seen",
          target: shop(-3, 0.5),
          seconds: 1,
        }),
        act("tiptoe", { to: to(-0.6, 1.2) }, { anchor: "ike-in" }),
        act("look", {
          with: "trunk",
          cue: "seen",
          target: at("joy", "face"),
        }),
      ]),
      person("joy", "f2", 1, -2.5, 0, [
        act("sneak", { to: to(0.8, -0.6) }),
        act("takeCover"),
        act("look", {
          with: "trunk",
          cue: "seen",
          target: shop(3, 1),
          seconds: 1,
        }),
        act("hush", {}, { sync: { of: "ike-in", offset: 0.5 } }),
        act("comeHere", { side: "left" }),
      ]),
    ],
  ),
  scene(
    {
      id: "parade",
      title: "Parade",
      summary:
        "Six soldiers march, double-time, halt, stand at parade rest and salute.",
      setting: "troops",
      roles: {
        s1: "soldier",
        s2: "soldier",
        s3: "soldier",
        s4: "soldier",
        s5: "soldier",
        s6: "soldier",
      },
      needs: [],
      view: "side",
    },
    "parade",
    [0, 1, 2, 3, 4, 5].map(
      (i: number): SceneBuild.Performer =>
        person(
          `s${i + 1}`,
          ["m1", "m2", "f1", "f2"][i % 4]!,
          (i % 3) - 1,
          Math.floor(i / 3) * -0.9,
          0,
          [
            act("march", {
              to: to((i % 3) - 1, 5 + Math.floor(i / 3) * -0.9),
            }),
            act("doubleTime", {
              to: to((i % 3) - 1, 7.5 + Math.floor(i / 3) * -0.9),
            }),
            act("march", {
              to: to((i % 3) - 1, 10 + Math.floor(i / 3) * -0.9),
            }),
            act("stand", { seconds: 0.8, sway: 0 }),
            act("paradeRest", { seconds: 1.5 }),
            act("stand", { seconds: 0.6, sway: 0 }),
            act("salute"),
          ],
        ),
    ),
  ),
];
