import type { IPlaygroundComposition } from "../../playground/structures/IPlaygroundComposition";
import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, at, counter, object, person, scene, sheathed }: typeof SceneBuild =
  SceneBuild;

/** A fencing step's length, metres: within what an advance and a retreat accept for every site body (the smallest takes up to 0.366). */
const STEP: number = 0.35;

/** The combat scenes of the lexicon's blade, stage-fight and firearm families. */
export const SCENES_FIGHT: readonly IScene[] = [
  scene(
    {
      id: "longsword-duel",
      title: "Longsword duel",
      summary:
        "Two fencers draw their longswords from the hip and fight in the German school: guards from the roof and in plough, an advance and a lunge met by a parry at its instant, a wind met in a bind, a feint and a riposte, the guard in ox and a retreat, a void step back and the fool.",
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
        act("pickUp", {
          prop: "swordR",
          handle: "grip",
          use: SceneBuild.BLADE_USE,
        }),
        act("enGarde", { blade: "swordR" }),
        act("vomTag", { blade: "swordR" }),
        act("advance", { length: STEP }),
        act(
          "lunge",
          {
            blade: "swordR",
            target: at("blu", "chestLeft"),
            outcome: "parried",
          },
          { anchor: "lunge" },
        ),
        act(
          "wind",
          {
            blade: "swordR",
            target: at("blu", "chestRight"),
            outcome: "parried",
          },
          { anchor: "wind" },
        ),
        act("ochs", { blade: "swordR", seconds: 1 }),
        act("retreat", { length: STEP }),
      ]),
      person("blu", "m2", 0, 2.2, 180, [
        act("pickUp", {
          prop: "swordB",
          handle: "grip",
          use: SceneBuild.BLADE_USE,
        }),
        act("enGarde", { blade: "swordB" }),
        act("pflug", { blade: "swordB" }),
        act(
          "parry",
          { blade: "swordB", against: "lunge" },
          { sync: { of: "lunge", align: "stroke" } },
        ),
        act(
          "bind",
          { blade: "swordB", against: "wind" },
          { sync: { of: "wind", align: "stroke" } },
        ),
        act("feint", {
          blade: "swordB",
          target: at("red", "shoulderLeft"),
          advance: "lunge",
        }),
        act("riposte", {
          blade: "swordB",
          target: at("red", "chestRight"),
          advance: "lunge",
        }),
        act("voidStep", { length: 0.3 }),
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
        "A stage fight between two brawlers: a grab and a headlock, a shove and the stumble back, a slap and the head turned by it, each reaction at its blow's contact, a mimed bat swing ducked and dodged at its instant, and a bystander who startles and dives for cover.",
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
        act(
          "clubSwing",
          { target: at("mac", "shoulderLeft") },
          { anchor: "swing" },
        ),
      ]),
      person("mac", "m1", 0, 0.52, 180, [
        act(
          "grabbed",
          { from: at("joe", "palmRight") },
          { sync: { of: "grab" } },
        ),
        act(
          "shoved",
          { from: at("joe", "palmRight") },
          { sync: { of: "shove" } },
        ),
        act(
          "slapped",
          { from: at("joe", "palmRight") },
          { sync: { of: "slap" } },
        ),
        act("duck", {}, { sync: { of: "swing", offset: -0.2 } }),
        act("dodge", { length: 0.3 }),
      ]),
      person("ned", "f1", 2, 1, 270, [act("startle"), act("diveForCover")]),
    ],
  ),
  scene(
    {
      id: "standoff",
      title: "Standoff",
      summary:
        "Two gunmen face each other across a saloon: one takes a handgun off the bar, brings it to high ready, takes aim and fires one shot; the other takes his own off the far bar, holds at high ready, lays it down and surrenders.",
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
        act("drawFirearm", { prop: "pistolB" }),
        act("highReady", { gun: "pistolB", seconds: 1.5 }),
        act("holsterFirearm", {
          prop: "pistolB",
          at: { x: 0.18, y: SceneBuild.COUNTER_TOP, z: 5.7 },
        }),
        act("surrender"),
      ]),
    ],
    [
      ...counter("bar", "pistol", "createHandgun", "fullSize", 0, 0),
      object("farBar", "createTable", "counter", 0, 5.47),
      object(
        "pistolB",
        "createHandgun",
        "fullSize",
        0.18,
        5.7,
        180,
        SceneBuild.COUNTER_TOP,
      ),
    ],
  ),
  scene(
    {
      id: "firing-range",
      title: "Firing range",
      summary:
        "Three shooters each take a handgun off their bench: low ready, an aim, a shot, the support palm pressed once to the magazine well, and high ready.",
      setting: "combat",
      roles: { f1: "shooter", f2: "shooter", f3: "shooter" },
      needs: [],
      skill: "novice",
      refusedUntil: 3528,
    },
    "range",
    [-2.2, 0, 2.2].map(
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
    [-2.2, 0, 2.2].flatMap(
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
