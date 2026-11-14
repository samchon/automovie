import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, at, object, person, scene }: typeof SceneBuild = SceneBuild;

/** The combat scenes composed from the lexicon's blade, stage-fight and firearm families of #3392. */
export const SCENES_FIGHT: readonly IScene[] = [
  scene(
    {
      id: "longsword-duel",
      title: "Longsword duel",
      summary:
        "Two fencers in the German school: guards in ox, plough and from the roof, an advance, a lunge parried, a bind and wind, a feint and a riposte.",
      setting: "combat",
      roles: { red: "fencer", blu: "fencer" },
      needs: [],
      view: "side",
      skill: "novice",
      featured: 7,
    },
    "duel",
    [
      person("red", "m1", 0, 0, 0, [
        act("enGarde"),
        act("vomTag"),
        act("advance", { length: 0.4 }),
        act("lunge", { target: at("blu", "chestLeft") }, { anchor: "lunge" }),
        act("bind"),
        act("wind"),
        act("retreat", { length: 0.4 }),
        act("ochs", { seconds: 1 }),
      ]),
      person("blu", "m2", 0, 1.4, 180, [
        act("enGarde"),
        act("pflug"),
        act("parry"),
        act("voidStep", { length: 0.3 }),
        act("feint", { target: at("red", "shoulderLeft") }),
        act("riposte", { target: at("red", "chestRight") }),
        act("alber"),
      ]),
    ],
  ),
  scene(
    {
      id: "bar-fight",
      title: "Bar fight",
      summary:
        "A stage fight in a bar: a shove and the stumble back, a slap, a grab and a headlock, a duck and a dodge, a club swung and a dive for cover.",
      setting: "combat",
      roles: { joe: "brawler", mac: "brawler", ned: "bystander" },
      needs: [3430],
    },
    "bar-fight",
    [
      person("joe", "m2", 0, 0, 0, [
        act("grab", { target: at("mac", "upperArmRight") }),
        act("headlock", { partner: "mac" }),
        act("shove", { target: at("mac", "sternum") }),
        act("slap", { target: at("mac", "jawLeft") }),
        act("clubSwing", { target: at("mac", "shoulderLeft") }),
      ]),
      person("mac", "m1", 0, 0.65, 180, [
        act("grabbed"),
        act("shoved"),
        act("slapped"),
        act("duck"),
        act("dodge", { length: 0.4 }),
      ]),
      person("ned", "f1", 2, 1, 270, [act("startle"), act("diveForCover")]),
    ],
    [
      object("bar", "createTable", "counter", -1.5, 1.5, 90),
      object("stool", "createSeat", "barStool", 1.2, 0.3),
      object("club", "createClub", "bat", 0.4, -0.2),
    ],
  ),
  scene(
    {
      id: "standoff",
      title: "Standoff",
      summary:
        "Two gunmen face each other: a hand to the holster, the draw, presenting at the ready, taking aim, a shot and its recoil; one surrenders.",
      setting: "combat",
      roles: { gun: "gunman", ace: "gunman" },
      needs: [3479, 3488, 3480],
      view: "side",
    },
    "standoff",
    [
      person("gun", "m1", 0, 0, 0, [
        act("reachHolster"),
        act("presentFirearm", { target: at("ace", "sternum") }),
        act("takeAim", { target: at("ace", "sternum") }),
        act("fireFirearm"),
        act("recoil"),
      ]),
      person("ace", "m2", 0, 6, 180, [
        act("highReady", { seconds: 1.5 }),
        act("surrender"),
      ]),
    ],
  ),
  scene(
    {
      id: "firing-range",
      title: "Firing range",
      summary:
        "Three shooters at a range: low and high ready, aim, recoil, and a reload.",
      setting: "combat",
      roles: { f1: "shooter", f2: "shooter", f3: "shooter" },
      needs: [3488],
      skill: "novice",
    },
    "range",
    [-1.2, 0, 1.2].map(
      (x: number, i: number): SceneBuild.Performer =>
        person(`f${i + 1}`, ["m1", "f1", "m2"][i]!, x, 0, 0, [
          act("lowReady"),
          act("aim", {
            target: {
              kind: "point",
              at: { x, y: 1.4, z: 10 },
              frame: "world",
            },
          }),
          act("recoil"),
          act("reloadFirearm", {
            target: { kind: "self", region: "palmRight" },
          }),
          act("highReady", { seconds: 1 }),
        ]),
    ),
  ),
];
