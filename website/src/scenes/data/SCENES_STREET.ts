import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, at, person, scene, to }: typeof SceneBuild = SceneBuild;

/** The street scenes composed from the lexicon's gaits and pursuits of #3392. */
export const SCENES_STREET: readonly IScene[] = [
  scene(
    {
      id: "street-corner",
      title: "Street corner",
      summary:
        "Eight passers-by, each walking their own way: a stroll, a hurry, a jog, a limp, a swagger, a proud and a sad walk, one reading and one on the phone.",
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
      person("a", "f1", -4, -2, 90, [act("stroll", { to: to(4, -2) })]),
      person("b", "m1", 4, -1, 270, [act("hurry", { to: to(-4, -1) })]),
      person("c", "m2", -4, 0, 90, [act("jog", { to: to(4, 0) })]),
      person("d", "f2", 4, 1, 270, [act("limp", { to: to(-1, 1) })]),
      person("e", "m1", -4, 2, 90, [act("swagger", { to: to(2, 2) })]),
      person("f", "f1", 3, 3, 270, [act("proud", { to: to(-3, 3) })]),
      person("g", "m2", -3, 4, 90, [act("sad", { to: to(1, 4) })]),
      person("h", "f2", 2, -3, 300, [
        act(
          "readingWalk",
          { to: to(-2, -3.5) },
          { over: [act("checkPhone", { seconds: 3 })] },
        ),
      ]),
    ],
  ),
  scene(
    {
      id: "pursuit",
      title: "Pursuit",
      summary:
        "One person flees, another chases, a third cuts across to intercept; a fourth follows at a distance and a fifth escorts a sixth away.",
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
      person("run", "m1", 0, 0, 0, [
        act("flee", { from: "cop", metres: 6, pace: "run" }),
      ]),
      person("cop", "m2", 0, -2, 0, [
        act("chase", { target: at("run", "upperBack") }),
      ]),
      person("cut", "f1", 3, 2, 270, [act("intercept", { target: "run" })]),
      person("tag", "f2", -2.5, -5, 0, [
        act("follow", { target: at("cop", "upperBack"), pace: "normal" }),
      ]),
      person("vip", "f1", -3, 1.6, 90, [act("stroll", { to: to(1, 1.6) })]),
      person("esc", "m1", -3, 1, 90, [
        act("escort", { target: at("vip", "upperArmLeft") }),
      ]),
    ],
  ),
  scene(
    {
      id: "sneaking-in",
      title: "Sneaking in",
      summary:
        "Two burglars: one prowls and tiptoes, the other sneaks, takes cover and hushes the first.",
      setting: "street",
      roles: { ike: "burglar", joy: "burglar" },
      needs: [],
      skill: "novice",
    },
    "sneak",
    [
      person("ike", "m1", -1, -2, 0, [
        act("prowl", { to: to(-1, 0) }),
        act("tiptoe", { to: to(-0.6, 1.5) }),
      ]),
      person("joy", "f2", 1, -2, 0, [
        act("sneak", { to: to(0.8, 0.5) }),
        act("takeCover"),
        act("hush"),
      ]),
    ],
  ),
  scene(
    {
      id: "parade",
      title: "Parade",
      summary:
        "Six soldiers in two ranks march, move to double time, stand at parade rest and salute, each in their own step.",
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
            act("march", { to: to((i % 3) - 1, 3 + Math.floor(i / 3) * -0.9) }),
            act("doubleTime", {
              to: to((i % 3) - 1, 5 + Math.floor(i / 3) * -0.9),
            }),
            act("paradeRest", { seconds: 1 }),
            act("salute"),
          ],
        ),
    ),
  ),
];
