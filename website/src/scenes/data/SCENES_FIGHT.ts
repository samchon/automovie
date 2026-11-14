import type { IPlaygroundComposition } from "../../playground/structures/IPlaygroundComposition";
import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, at, counter, object, person, scene, sheathed }: typeof SceneBuild =
  SceneBuild;

/** The combat scenes of the lexicon's blade, stage-fight and firearm families. */
export const SCENES_FIGHT: readonly IScene[] = [
  scene(
    {
      id: "longsword-duel",
      title: "Longsword duel",
      summary:
        "Two fencers draw their longswords from the hip and fight in the German school: guards in ox, plough and from the roof, an advance and a lunge met by a parry at its instant, a bind and wind, a feint and a riposte.",
      setting: "combat",
      roles: { red: "fencer", blu: "fencer" },
      needs: [],
      view: "side",
      skill: "novice",
      featured: 7,
      refusedUntil: 3528,
    },
    "duel",
    [
      person("red", "m1", 0, 0, 0, [
        act("pickUp", { prop: "swordR", handle: "grip" }),
        act("enGarde", { blade: "swordR" }),
        act("vomTag", { blade: "swordR" }),
        act("advance", { length: 0.39 }),
        act(
          "lunge",
          { blade: "swordR", target: at("blu", "chestLeft") },
          { anchor: "lunge" },
        ),
        act("bind", { blade: "swordR" }),
        act("wind", { blade: "swordR" }),
        act("retreat", { length: 0.39 }),
        act("ochs", { blade: "swordR", seconds: 1 }),
      ]),
      person("blu", "m2", 0, 1.25, 180, [
        act("pickUp", { prop: "swordB", handle: "grip" }),
        act("enGarde", { blade: "swordB" }),
        act("pflug", { blade: "swordB" }),
        act(
          "parry",
          { blade: "swordB", against: "lunge" },
          { sync: { of: "lunge" } },
        ),
        act("voidStep", { length: 0.3 }),
        act("feint", { blade: "swordB", target: at("red", "shoulderLeft") }),
        act("riposte", { blade: "swordB", target: at("red", "chestRight") }),
        act("alber", { blade: "swordB" }),
      ]),
    ],
    [
      sheathed("swordR", "longsword", "red", "left"),
      sheathed("swordB", "longsword", "blu", "left"),
    ],
  ),
  scene(
    {
      id: "bar-fight",
      title: "Bar fight",
      summary:
        "A stage fight in a bar: a grab and a headlock, a shove and the stumble back, a slap and the head turned by it, each reaction at the blow's stroke, a mimed bat swing ducked and dodged, and a bystander who startles and dives for cover.",
      setting: "combat",
      roles: { joe: "brawler", mac: "brawler", ned: "bystander" },
      needs: [],
    },
    "bar-fight",
    [
      person("joe", "m2", 0, 0, 0, [
        act("grab", { target: at("mac", "upperArmRight") }, { anchor: "grab" }),
        act("headlock", { partner: "mac" }),
        act("shove", { target: at("mac", "sternum") }, { anchor: "shove" }),
        act("slap", { target: at("mac", "jawLeft") }, { anchor: "slap" }),
        act("clubSwing", { target: at("mac", "shoulderLeft") }),
      ]),
      person("mac", "m1", 0, 0.52, 180, [
        act(
          "grabbed",
          { from: at("joe", "palmRight") },
          { sync: { of: "grab", event: "stroke" } },
        ),
        act(
          "shoved",
          { from: at("joe", "palmRight") },
          { sync: { of: "shove", event: "stroke" } },
        ),
        act(
          "slapped",
          { from: at("joe", "palmRight") },
          { sync: { of: "slap", event: "stroke" } },
        ),
        act("duck"),
        act("dodge", { length: 0.3 }),
      ]),
      person("ned", "f1", 2, 1, 270, [act("startle"), act("diveForCover")]),
    ],
    [
      object("bar", "createTable", "counter", -1.5, 1.5, 90),
      object("stool", "createSeat", "barStool", 1.2, 0.3),
    ],
  ),
  scene(
    {
      id: "standoff",
      title: "Standoff",
      summary:
        "Two gunmen face each other: one takes a handgun off the bar, brings it to high ready, takes aim and fires one shot; the other holds at high ready and surrenders.",
      setting: "combat",
      roles: { gun: "gunman", ace: "gunman" },
      needs: [],
      view: "side",
      refusedUntil: 3528,
    },
    "standoff",
    [
      person("gun", "m1", 0, 0, 0, [
        act("drawFirearm", { prop: "pistol" }),
        act("presentFirearm", {
          gun: "pistol",
          carriage: "highReady",
          target: at("ace", "sternum"),
        }),
        act("takeAim", { gun: "pistol", target: at("ace", "sternum") }),
        act("recoil", { gun: "pistol" }),
      ]),
      person("ace", "m2", 0, 6, 180, [
        act("highReady", { seconds: 1.5 }),
        act("surrender"),
      ]),
    ],
    counter("bar", "pistol", "createHandgun", "fullSize", 0, 0),
  ),
  scene(
    {
      id: "firing-range",
      title: "Firing range",
      summary:
        "Three shooters each take a handgun off their bench: low ready, an aim, a shot, a fresh magazine pressed home, and high ready.",
      setting: "combat",
      roles: { f1: "shooter", f2: "shooter", f3: "shooter" },
      needs: [],
      skill: "novice",
      refusedUntil: 3528,
    },
    "range",
    [-1.6, 0, 1.6].map(
      (x: number, i: number): SceneBuild.Performer =>
        person(`f${i + 1}`, ["m1", "f1", "m2"][i]!, x, 0, 0, [
          act("drawFirearm", { prop: `gun${i + 1}` }),
          act("lowReady", { gun: `gun${i + 1}` }),
          act("takeAim", {
            gun: `gun${i + 1}`,
            target: { kind: "point", at: { x, y: 1.4, z: 10 }, frame: "world" },
          }),
          act("recoil", { gun: `gun${i + 1}` }),
          act("reloadFirearm", {
            target: { kind: "prop", subject: `gun${i + 1}`, point: "magazine" },
          }),
          act("highReady", { gun: `gun${i + 1}`, seconds: 1 }),
        ]),
    ),
    [-1.6, 0, 1.6].flatMap(
      (x: number, i: number): IPlaygroundComposition.IObject[] =>
        counter(
          `bench${i + 1}`,
          `gun${i + 1}`,
          "createHandgun",
          "compact",
          x,
          0,
        ),
    ),
  ),
];
