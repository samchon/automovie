import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, at, mutual, person, scene, sheathed, to }: typeof SceneBuild =
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
        "Two kickboxers trade a round: a jab parried, a cross slipped and a low kick checked; the counter jab is taken on the gloves and the rear hook leaned away from; a lead hook and an uppercut are covered, a clinch and a knee land, a teep pushes the first fighter back a step, and both circle off into guard.",
      setting: "combat",
      roles: { red: "kickboxer", blu: "kickboxer" },
      needs: [],
      view: "side",
    },
    "kickboxing-round",
    [
      person("red", "m1", 0, 0, 0, [
        act("guard", {
          seconds: 1,
          style: "kickboxing",
          facing: at("blu", "face"),
        }),
        act("step", { direction: "forward", steps: 1 }),
        act("jab", { at: at("blu", "face") }, { anchor: "kr-jab" }),
        act("cross", { at: at("blu", "chin") }, { anchor: "kr-cross" }),
        act(
          "roundKick",
          { at: at("blu", "thighOuterLeft") },
          { anchor: "kr-low" },
        ),
        act(
          "guard",
          { seconds: 1.2, style: "kickboxing" },
          { anchor: "kr-shell" },
        ),
        act(
          "leanBack",
          { from: at("blu", "handBackRight") },
          { anchor: "kr-lean" },
        ),
        act("leadHook", { at: at("blu", "jawRight") }, { anchor: "kr-hook" }),
        act("rearUppercut", { at: at("blu", "chin") }, { anchor: "kr-upper" }),
        act("clinch", { partner: "blu" }),
        act("rearKnee", { at: at("blu", "abdomen") }, { anchor: "kr-knee" }),
        act("guard", { seconds: 0.8, style: "kickboxing" }),
        act(
          "pushed",
          { from: at("blu", "soleRight") },
          { anchor: "kr-teeped" },
        ),
        act("step", { direction: "back", steps: 1 }),
        act("step", { direction: "left", steps: 2 }),
        act("guard", { seconds: 1, style: "kickboxing" }),
      ]),
      person("blu", "m2", 0, 1.65, 180, [
        act("guard", {
          seconds: 1.4,
          style: "kickboxing",
          facing: at("red", "face"),
        }),
        act("handParry", { against: "kr-jab" }),
        act("slip", { against: "kr-cross" }),
        act("checkKick", { against: "kr-low" }),
        act(
          "jab",
          { at: at("red", "face") },
          {
            sync: {
              of: "kr-shell",
              event: "set",
              offset: 0.2,
              align: "impact",
            },
          },
        ),
        act(
          "rearHook",
          { at: at("red", "jawLeft"), accuracy: "miss" },
          { sync: { of: "kr-lean", event: "stroke", align: "impact" } },
        ),
        act("step", { direction: "back", steps: 1 }),
        act("cover", { against: "kr-hook" }),
        act("cover", { against: "kr-upper" }),
        act(
          "flinch",
          { from: at("red", "kneeRight"), intensity: 0.7 },
          { sync: { of: "kr-knee" } },
        ),
        act(
          "teep",
          { at: at("red", "abdomen") },
          { sync: { of: "kr-teeped", event: "start", align: "impact" } },
        ),
        act("step", { direction: "right", steps: 2 }),
        act("guard", { seconds: 1, style: "kickboxing" }),
      ]),
    ],
  ),
  scene(
    {
      id: "boxing-counters",
      title: "Boxing counters",
      summary:
        "Two boxers in a tight guard: a double jab parried and slipped, a cross swayed off, a hook to the body taken on the elbow and a hook upstairs rolled under; the counter jab is taken on the gloves and the rear hook leaned away from, and the leader's cross lands; after a step off the line, a jab to the body, an uppercut and a rear hook are blocked, covered and rolled, the counter jab and cross hit the gloves, the lead hook is leaned away from, and a closing cross and hook are covered before both step back.",
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
        "Two wrestlers circle a step each way and square off: a single-leg shot is sprawled on and denied, both come back to their feet, and the second single leg is finished, taking the defender down to the mat.",
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
        act("stand", { seconds: 0.3, sway: 0 }),
      ]),
      person("blue", "m2", -0.46, 0.9, 165, [
        act("stand", { seconds: 0.4, sway: 0 }),
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
        "Two sabreurs draw from the hip and fence two phrases: an advance, a head cut and a flank cut both parried, the riposte closed off and the counter-riposte landing; then from the ox and the roof a feint and a lunge beaten aside, the riposte landing, and a void step back into the fool's guard.",
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
        act("alber", { blade: "sabreR", seconds: 1 }),
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
        act("enGarde", { blade: "sabreB", seconds: 1 }),
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
        "A choreographed brawl, every reaction on its blow: a grab, a slap and the backhand answer, a wild hook ducked and a push kick that sends the first brawler staggering back, and as the first brawler comes back in, the hook that drops him.",
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
        act("stand", { seconds: 1.8 }),
        act(
          "rearHook",
          { at: at("ned", "jawLeft"), accuracy: "miss" },
          { anchor: "br-swing" },
        ),
        act("step", { direction: "back", steps: 1, length: 0.3 }),
        act("stand", { seconds: 2.3 }),
        act(
          "shoved",
          { from: at("ned", "soleRight") },
          { anchor: "br-pushed" },
        ),
        act("walk", { to: to(0, -0.1), face: 0 }),
        act("stand", { seconds: 0.5 }),
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
          "duck",
          {},
          { sync: { of: "br-swing", align: "lowest", offset: -0.1 } },
        ),
        act("stand", { seconds: 0.4 }),
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
      ]),
    ],
  ),
];
