import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, at, mutual, person, scene, sheathed }: typeof SceneBuild =
  SceneBuild;

/** A fencing step's length, metres: within what an advance and a retreat accept for every site body (the smallest takes up to 0.366). */
const STEP: number = 0.35;

/**
 * The long combat bouts: two performers trading strikes, defences and
 * footwork in one exchange after another.
 *
 * An answer names only an action composed before it, and the first
 * performer's chain is composed before the second's. So the first performer
 * leads: the second's defences answer the leader's strikes by their anchors,
 * and the second's counters are synced onto the leader's own reactions (a
 * held guard, a lean back, a step away, a fall), so each blow arrives as the
 * leader blocks or sells it. The wrestlers' exchange is the grappling
 * mutual's, whose two roles share one clock.
 */
export const SCENES_BOUTS: readonly IScene[] = [
  scene(
    {
      id: "kickboxing-round",
      title: "Kickboxing round",
      summary:
        "Two kickboxers trade combinations and counters until a head kick knocks one down.",
      setting: "combat",
      roles: { red: "kickboxer", blu: "kickboxer" },
      needs: [],
      view: "side",
    },
    "kickboxing-round",
    [
      // Both elite, opening at kicking range: Ren presses behind a feint and
      // a Dutch combination that ends in a low kick; Kai defends it with a
      // parry, a slip, a roll and a check and counters off the check; Ren
      // answers, then feints, digs the liver and ends it with a head kick.
      person(
        "red",
        "m1",
        0,
        0,
        0,
        [
          act("guard", {
            seconds: 0.5,
            style: "kickboxing",
            facing: at("blu", "face"),
          }),
          act("step", { direction: "right", steps: 2 }),
          act(
            "leanBack",
            { from: at("blu", "handBackLeft") },
            { anchor: "kr-lean" },
          ),
          act("step", { direction: "forward", steps: 1 }),
          act(
            "jab",
            { at: at("blu", "face"), feint: 0.4 },
            { anchor: "kr-feint" },
          ),
          act("step", { direction: "forward", steps: 1 }),
          act("jab", { at: at("blu", "face") }, { anchor: "kr-jab" }),
          act("cross", { at: at("blu", "chin") }, { anchor: "kr-cross" }),
          act("leadHook", { at: at("blu", "jawRight") }, { anchor: "kr-hook" }),
          act(
            "roundKick",
            { at: at("blu", "thighOuterLeft") },
            { anchor: "kr-low" },
          ),
          // Kai's counters land on Ren's guard and braced elbow: Ren is
          // composed first, so Kai's strikes are timed to these instants.
          act(
            "guard",
            { seconds: 0.5, style: "kickboxing" },
            { anchor: "kr-shell" },
          ),
          act("braceImpact", {}, { anchor: "kr-brace" }),
          act("guard", { seconds: 0.4, style: "kickboxing" }),
          act(
            "rearHook",
            { at: at("blu", "jawLeft") },
            { anchor: "kr-counter" },
          ),
          act("guard", { seconds: 0.8, style: "kickboxing" }),
          act(
            "pushed",
            { from: at("blu", "soleRight") },
            { anchor: "kr-teeped" },
          ),
          act("step", { direction: "forward", steps: 1 }),
          act(
            "jab",
            { at: at("blu", "face"), feint: 0.5 },
            { anchor: "kr-feint2" },
          ),
          act("leadHook", { at: at("blu", "liver") }, { anchor: "kr-body" }),
          act(
            "roundKick",
            { at: at("blu", "templeLeft") },
            { anchor: "kr-ko" },
          ),
          act("victory"),
        ],
        "elite",
      ),
      person(
        "blu",
        "m2",
        0,
        2.5,
        180,
        [
          act("guard", {
            seconds: 0.5,
            style: "kickboxing",
            facing: at("red", "face"),
          }),
          act("step", { direction: "left", steps: 2 }),
          act(
            "jab",
            { at: at("red", "face"), accuracy: "miss" },
            { sync: { of: "kr-lean", event: "stroke", align: "impact" } },
          ),
          act("swayBack", { against: "kr-feint" }),
          act("handParry", { against: "kr-jab" }),
          act("cover", { against: "kr-cross" }),
          act("checkKick", { against: "kr-low" }),
          act(
            "cross",
            { at: at("red", "chin") },
            { sync: { of: "kr-shell", event: "set", align: "impact" } },
          ),
          act(
            "switchKick",
            { at: at("red", "ribsRight") },
            {
              sync: {
                of: "kr-brace",
                event: "start",
                offset: 1.3,
                align: "impact",
              },
            },
          ),
          act("rollUnder", { against: "kr-counter" }),
          act(
            "teep",
            { at: at("red", "abdomen") },
            { sync: { of: "kr-teeped", event: "start", align: "impact" } },
          ),
          act("highBlock", { against: "kr-feint2" }),
          act(
            "flinch",
            { from: at("red", "handBackLeft"), intensity: 0.8 },
            { sync: { of: "kr-body", event: "impact" } },
          ),
          act(
            "knockdown",
            { from: at("red", "footTopRight"), seconds: 2 },
            { sync: { of: "kr-ko", event: "impact" } },
          ),
        ],
        "elite",
      ),
    ],
  ),
  scene(
    {
      id: "boxing-counters",
      title: "Boxing counters",
      summary:
        "Two boxers trade combinations; most are slipped, blocked or rolled, and one cross lands.",
      setting: "combat",
      roles: { ana: "boxer", bea: "boxer" },
      needs: [],
      view: "side",
    },
    "boxing-counters",
    [
      person("ana", "f1", 0, 0, 0, [
        act("guard", {
          seconds: 1,
          style: "boxing",
          facing: at("bea", "face"),
        }),
        act("step", { direction: "forward", steps: 1, guard: "boxing" }),
        act("jab", { at: at("bea", "face") }, { anchor: "ba-jab1" }),
        act("jab", { at: at("bea", "face") }, { anchor: "ba-jab2" }),
        act("cross", { at: at("bea", "chin") }, { anchor: "ba-cross" }),
        act("leadHook", { at: at("bea", "liver") }, { anchor: "ba-body" }),
        act("leadHook", { at: at("bea", "jawRight") }, { anchor: "ba-hook" }),
        act("guard", { seconds: 1.2, style: "boxing" }, { anchor: "ba-shell" }),
        act(
          "leanBack",
          { from: at("bea", "handBackRight") },
          { anchor: "ba-lean" },
        ),
        act("cross", { at: at("bea", "chin") }, { anchor: "ba-counter" }),
        act("step", { direction: "left", steps: 1, guard: "boxing" }),
        act("jab", { at: at("bea", "abdomen") }, { anchor: "ba-jab3" }),
        act("leadUppercut", { at: at("bea", "chin") }, { anchor: "ba-up" }),
        act("rearHook", { at: at("bea", "jawLeft") }, { anchor: "ba-rhook" }),
        act(
          "guard",
          { seconds: 1.4, style: "boxing" },
          { anchor: "ba-shell2" },
        ),
        act(
          "leanBack",
          { from: at("bea", "handBackLeft") },
          { anchor: "ba-lean2" },
        ),
        act("cross", { at: at("bea", "chin") }, { anchor: "ba-fin1" }),
        act("leadHook", { at: at("bea", "jawRight") }, { anchor: "ba-fin2" }),
        act("step", { direction: "back", steps: 1, guard: "boxing" }),
        act("guard", { seconds: 1.5, style: "boxing" }),
      ]),
      person("bea", "f2", 0, 1.55, 180, [
        act("guard", {
          seconds: 1.4,
          style: "boxing",
          facing: at("ana", "face"),
        }),
        act("handParry", { against: "ba-jab1" }),
        act("slip", { against: "ba-jab2" }),
        act("swayBack", { against: "ba-cross" }),
        act("elbowBlock", { against: "ba-body" }),
        act("rollUnder", { against: "ba-hook" }),
        act(
          "jab",
          { at: at("ana", "face") },
          {
            sync: {
              of: "ba-shell",
              event: "set",
              offset: 0.2,
              align: "impact",
            },
          },
        ),
        act(
          "rearHook",
          { at: at("ana", "jawLeft"), accuracy: "miss" },
          { sync: { of: "ba-lean", event: "stroke", align: "impact" } },
        ),
        act(
          "flinch",
          { from: at("ana", "handBackRight"), intensity: 0.6 },
          { sync: { of: "ba-counter" } },
        ),
        act("elbowBlock", { against: "ba-jab3" }),
        act("cover", { against: "ba-up" }),
        act("rollUnder", { against: "ba-rhook" }),
        act(
          "jab",
          { at: at("ana", "face") },
          {
            sync: {
              of: "ba-shell2",
              event: "set",
              offset: 0.1,
              align: "impact",
            },
          },
        ),
        act(
          "cross",
          { at: at("ana", "chin") },
          {
            sync: {
              of: "ba-shell2",
              event: "set",
              offset: 0.55,
              align: "impact",
            },
          },
        ),
        act(
          "leadHook",
          { at: at("ana", "jawRight"), accuracy: "miss" },
          { sync: { of: "ba-lean2", event: "stroke", align: "impact" } },
        ),
        act("cover", { against: "ba-fin1" }),
        act("cover", { against: "ba-fin2" }),
        act("step", { direction: "back", steps: 1, guard: "boxing" }),
        act("guard", { seconds: 1.5, style: "boxing" }),
      ]),
    ],
  ),
  scene(
    {
      id: "wrestling-scramble",
      title: "Wrestling scramble",
      summary:
        "Two wrestlers circle and fake shots; one single leg is stopped, the next takes him down.",
      setting: "combat",
      roles: { red: "wrestler", blue: "wrestler" },
      needs: [],
      skill: "novice",

      // The alternate cast cannot reach the staged grips at these marks.
      bodySwap: false,
    },
    "wrestling-scramble",
    [
      person("red", "m1", 0, -0.21, 0, [
        act("stand", { seconds: 0.4, sway: 0 }),
        act("step", { direction: "left", steps: 1, length: 0.25 }),
        act("step", { direction: "right", steps: 1, length: 0.25 }),
        act("crouch", { depth: "partial", hold: 0.8 }),
        act("step", { direction: "forward", steps: 1, length: 0.2 }),
        act("step", { direction: "back", steps: 1, length: 0.2 }),
        act("step", { direction: "right", steps: 1, length: 0.25 }),
        act("step", { direction: "left", steps: 1, length: 0.25 }),
        act("step", { direction: "forward", steps: 1, length: 0.2 }),
        act("step", { direction: "back", steps: 1, length: 0.2 }),
        act("step", { direction: "left", steps: 1, length: 0.25 }),
        act("step", { direction: "right", steps: 1, length: 0.25 }),
        act("stand", { seconds: 0.3, sway: 0 }),
      ]),
      person("blue", "m2", -0.46, 0.9, 165, [
        act("stand", { seconds: 0.4, sway: 0 }),
        act("step", { direction: "right", steps: 1, length: 0.25 }),
        act("step", { direction: "left", steps: 1, length: 0.25 }),
        act("crouch", { depth: "partial", hold: 0.8 }),
        act("step", { direction: "back", steps: 1, length: 0.2 }),
        act("step", { direction: "forward", steps: 1, length: 0.2 }),
        act("step", { direction: "left", steps: 1, length: 0.25 }),
        act("step", { direction: "right", steps: 1, length: 0.25 }),
        act("step", { direction: "back", steps: 1, length: 0.2 }),
        act("step", { direction: "forward", steps: 1, length: 0.2 }),
        act("step", { direction: "right", steps: 1, length: 0.25 }),
        act("step", { direction: "left", steps: 1, length: 0.25 }),
        act("stand", { seconds: 0.3, sway: 0 }),
      ]),
    ],
    [],
    [
      mutual(
        "grappling",
        { initiator: "red", receiver: "blue" },
        { kind: "singleLeg", outcome: "denied" },
      ),
      mutual(
        "grappling",
        { initiator: "red", receiver: "blue" },
        { kind: "singleLeg", outcome: "complete" },
      ),
    ],
  ),
  scene(
    {
      id: "sabre-bout",
      title: "Sabre bout",
      summary:
        "Two fencers draw sabres; one lands a counter-riposte, then void-steps away from a riposte.",
      setting: "combat",
      roles: { red: "fencer", blu: "fencer" },
      needs: [],
      view: "side",

      // The alternate cast cannot hold the flank parry at these marks.
      bodySwap: false,
    },
    "sabre-bout",
    [
      person("red", "m1", 0, 0, 0, [
        act("pickUp", {
          prop: "sabreR",
          handle: "grip",
          use: SceneBuild.BLADE_USE,
        }),
        act("enGarde", { blade: "sabreR", seconds: 0.8 }),
        act("advance", { length: STEP }),
        act(
          "cut",
          {
            blade: "sabreR",
            target: at("blu", "crown"),
            outcome: "parried",
            advance: "step",
          },
          { anchor: "sb-head" },
        ),
        act(
          "slash",
          {
            blade: "sabreR",
            target: at("blu", "ribsLeft"),
            outcome: "parried",
            advance: "step",
          },
          { anchor: "sb-flank" },
        ),
        act("enGarde", { blade: "sabreR", seconds: 0.6 }),
        act(
          "parry",
          { blade: "sabreR", line: "highOutside" },
          { anchor: "sb-close" },
        ),
        act(
          "riposte",
          { blade: "sabreR", target: at("blu", "chestRight") },
          { anchor: "sb-touch" },
        ),
        act("retreat", { length: STEP }),
        act("ochs", { blade: "sabreR", seconds: 1 }),
        act("advance", { length: STEP }),
        act("feint", { blade: "sabreR", target: at("blu", "shoulderLeft") }),
        act(
          "lunge",
          {
            blade: "sabreR",
            target: at("blu", "chestLeft"),
            outcome: "parried",
          },
          { anchor: "sb-lunge" },
        ),
        act("enGarde", { blade: "sabreR", seconds: 2.4 }),
        act("voidStep", { length: 0.3 }, { anchor: "sb-hit" }),
        act("alber", { blade: "sabreR", seconds: 1.6 }),
      ]),
      person("blu", "m2", 0, 1.55, 180, [
        act("pickUp", {
          prop: "sabreB",
          handle: "grip",
          use: SceneBuild.BLADE_USE,
        }),
        act("enGarde", { blade: "sabreB", seconds: 0.8 }),
        act(
          "parry",
          { blade: "sabreB", against: "sb-head" },
          { sync: { of: "sb-head", align: "stroke" } },
        ),
        act(
          "parry",
          { blade: "sabreB", against: "sb-flank" },
          { sync: { of: "sb-flank", align: "stroke" } },
        ),
        act(
          "riposte",
          {
            blade: "sabreB",
            target: at("red", "chestRight"),
            outcome: "parried",
          },
          { sync: { of: "sb-close", event: "stroke", align: "stroke" } },
        ),
        act(
          "flinch",
          { from: at("red", "palmRight"), intensity: 0.5 },
          { sync: { of: "sb-touch" } },
        ),
        act("vomTag", { blade: "sabreB", seconds: 1 }),
        act("pflug", { blade: "sabreB", seconds: 1.2 }),
        act(
          "beat",
          { blade: "sabreB", against: "sb-lunge" },
          { sync: { of: "sb-lunge", align: "stroke" } },
        ),
        act(
          "riposte",
          {
            blade: "sabreB",
            target: at("red", "chestLeft"),
            advance: "step",
          },
          { sync: { of: "sb-hit", event: "start", align: "stroke" } },
        ),
        act("retreat", { length: STEP }),
        act("enGarde", { blade: "sabreB", seconds: 1.4 }),
      ]),
    ],
    [
      sheathed("sabreR", "sabre", "red", "left"),
      sheathed("sabreB", "sabre", "blu", "left"),
    ],
  ),
  scene(
    {
      id: "stage-brawl",
      title: "Stage brawl",
      summary:
        "Two brawlers trade a grab, slaps, a shove and a push kick until a hook drops one.",
      setting: "combat",
      roles: { rex: "brawler", ned: "brawler" },
      needs: [],
      view: "side",
    },
    "stage-brawl",
    [
      person("rex", "m2", 0, 0, 0, [
        act(
          "grab",
          { target: at("ned", "upperArmRight") },
          { anchor: "br-grab" },
        ),
        act(
          "stageSlap",
          { target: at("ned", "cheekLeft") },
          { anchor: "br-slap" },
        ),
        act("stand", { seconds: 0.7 }),
        act(
          "slapped",
          { from: at("ned", "handBackRight") },
          { anchor: "br-sold" },
        ),
        act(
          "shove",
          { target: at("ned", "chestLeft") },
          { anchor: "br-shove" },
        ),
        act("stand", { seconds: 0.1 }),
        act(
          "rearHook",
          { at: at("ned", "jawLeft"), accuracy: "miss" },
          { anchor: "br-swing" },
        ),
        act("step", { direction: "back", steps: 1, length: 0.3 }),
        act("guard", { seconds: 1, facing: at("ned", "face") }),
        act(
          "pushed",
          { from: at("ned", "soleRight") },
          { anchor: "br-pushed" },
        ),
        act("step", { direction: "back", steps: 1, length: 0.3 }),
        act("step", { direction: "forward", steps: 1, length: 0.3 }),
        act(
          "knockdown",
          { from: at("ned", "handBackRight") },
          { anchor: "br-drop" },
        ),
      ]),
      person("ned", "m1", 0, 0.6, 180, [
        act(
          "grabbed",
          { from: at("rex", "palmRight") },
          { sync: { of: "br-grab", event: "stroke" } },
        ),
        act("leanBack", { from: at("rex", "palmRight") }),
        act(
          "slapped",
          { from: at("rex", "palmRight") },
          { sync: { of: "br-slap", event: "stroke" } },
        ),
        act(
          "backhand",
          { target: at("rex", "cheekRight") },
          { sync: { of: "br-sold", event: "start", align: "stroke" } },
        ),
        act(
          "pushed",
          { from: at("rex", "palmRight") },
          { sync: { of: "br-shove", event: "stroke" } },
        ),
        act(
          "duck",
          {},
          { sync: { of: "br-swing", align: "lowest", offset: -0.1 } },
        ),
        act(
          "teep",
          { at: at("rex", "abdomen") },
          { sync: { of: "br-pushed", event: "start", align: "impact" } },
        ),
        act(
          "rearHook",
          { at: at("rex", "jawLeft") },
          { sync: { of: "br-drop", event: "start", align: "impact" } },
        ),
        act("step", { direction: "back", steps: 1, length: 0.3 }),
        act("guard", { seconds: 1, facing: at("rex", "face") }),
      ]),
    ],
  ),
];
