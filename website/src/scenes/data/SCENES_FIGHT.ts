import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, at, object, person, scene } = SceneBuild;

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
      needs: [3392],
      view: "side",
      skill: "novice",
      featured: 2,
    },
    "duel",
    [
      person("red", "m1", 0, 0, 0, [
        act("enGarde", { blade: "swordR" }),
        act("vomTag", { blade: "swordR" }),
        act("advance", { length: 0.4 }),
        act("lunge", { blade: "swordR", target: at("blu", "chestLeft") }, { anchor: "lunge" }),
        act("bind", { blade: "swordR", against: "swordB" }),
        act("wind", { blade: "swordR" }),
        act("retreat", { length: 0.4 }),
        act("ochs", { blade: "swordR", seconds: 1 }),
      ]),
      person("blu", "m2", 0, 2.4, 180, [
        act("enGarde", { blade: "swordB" }),
        act("pflug", { blade: "swordB" }),
        act("parry", { blade: "swordB", against: "lunge" }),
        act("voidStep", { length: 0.3 }),
        act("feint", { blade: "swordB", target: at("red", "shoulderLeft") }),
        act("riposte", { blade: "swordB", target: at("red", "chestRight") }),
        act("alber", { blade: "swordB" }),
      ]),
    ],
    [
      object("swordR", "createSword", "longsword", 0.3, 0.3),
      object("swordB", "createSword", "longsword", -0.3, 2.1),
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
      needs: [3392, 3430],
    },
    "bar-fight",
    [
      person("joe", "m2", 0, 0, 0, [
        act("shove", { target: at("mac", "sternum") }),
        act("slap", { target: at("mac", "jawLeft") }),
        act("grab", { target: at("mac", "upperArmRight") }),
        act("headlock", { partner: "mac" }),
        act("clubSwing", { blade: "club", target: at("mac", "shoulderLeft") }),
      ]),
      person("mac", "m1", 0, 0.9, 180, [
        act("shoved", { from: at("joe", "palmRight") }),
        act("slapped", { from: at("joe", "palmRight") }),
        act("grabbed", { from: at("joe", "palmLeft") }),
        act("struggle", { target: at("joe", "forearmRight") }),
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
      needs: [3392, 3479, 3488, 3480],
      view: "side",
    },
    "standoff",
    [
      person("gun", "m1", 0, 0, 0, [
        act("reachHolster"),
        act("drawFirearm", { prop: "pistolG" }),
        act("presentFirearm", { gun: "pistolG", target: at("ace", "sternum") }),
        act("takeAim", { gun: "pistolG", target: at("ace", "sternum") }),
        act("fireFirearm", { gun: "pistolG" }),
        act("recoil", { gun: "pistolG" }),
      ]),
      person("ace", "m2", 0, 6, 180, [
        act("highReady", { seconds: 1.5 }),
        act("surrender"),
      ]),
    ],
    [
      object("pistolG", "createHandgun", "fullSize", 0.25, 0),
      object("holsterG", "createHolster", undefined, 0.25, 0),
    ],
  ),
  scene(
    {
      id: "firing-range",
      title: "Firing range",
      summary: "Three shooters at a range: low and high ready, aim, recoil, and a reload.",
      setting: "combat",
      roles: { f1: "shooter", f2: "shooter", f3: "shooter" },
      needs: [3392, 3488],
      skill: "novice",
    },
    "range",
    [-1.2, 0, 1.2].map((x: number, i: number): SceneBuild.Performer =>
      person(`f${i + 1}`, ["m1", "f1", "m2"][i]!, x, 0, 0, [
        act("lowReady"),
        act("aim"),
        act("recoil"),
        act("reload"),
        act("highReady", { seconds: 1 }),
      ]),
    ),
  ),
];
