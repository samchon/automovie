import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, counter, object, person, scene, to }: typeof SceneBuild =
  SceneBuild;

/** The lower end of the call button's travel band, in metres. */
const BUTTON_TRAVEL: number = 0.001;

/** Mount the wall controls at the lower end of the switch mounting band. */
const CONTROL_HEIGHT: number = 1.065;

/**
 * A control's own travel, metres: the upper end of the call button's band. The
 * button stays where a press leaves it, so a control pressed twice by
 * `BUTTON_TRAVEL` needs room for both presses.
 */
const CONTROL_TRAVEL: number = 0.003;

/**
 * A world point, as a look's or a touch's target.
 *
 * @param x To the left of a person facing +Z.
 * @param y Height.
 * @param z Forward.
 * @returns The target.
 */
const point = (x: number, y: number, z: number): SceneBuild.PointTarget => ({
  kind: "point",
  at: { x, y, z },
  frame: "world",
});

/** Everyday handling with reachable supports, controls, grips and receptacles. */
export const SCENES_HANDLING: readonly IScene[] = [
  scene(
    {
      id: "low-table-scramble",
      title: "Low table scramble",
      summary:
        "An athlete scrambles onto a low table, pumps a fist and jumps down the far side.",
      setting: "gym",
      roles: { ath: "athlete" },
      needs: [],
      view: "side",
    },
    "low-table-scramble",
    [
      person("ath", "m1", 0, -3, 0, [
        act("selfShoulderRoll", { count: 1 }),
        act("run", { to: to(0, 0.04), pace: "jog", face: 0 }),
        act("scramble", {
          on: { kind: "prop", subject: "table", point: "front" },
        }),
        act("selfFistPump", { count: 2 }),
        act("jump", { to: to(0, 1.7), apex: 0.25 }),
        act("selfVictory"),
      ]),
    ],
    [object("table", "createTable", "coffee", 0, 0.65, 180)],
  ),
  scene(
    {
      id: "typing-at-the-counter",
      title: "Typing at the counter",
      summary:
        "A receptionist types a guest's check-in, looking up to nod between entries.",
      setting: "work",
      roles: { rec: "receptionist" },
      needs: [],
    },
    "typing-at-the-counter",
    [
      person("rec", "f1", 0, 0, 0, [
        act("type", { prop: "keyboard", text: "good morning" }),
        act("look", { target: point(0.3, 1.6, 1.6), cue: "seen", duration: 1 }),
        act("gestureNod", { count: 1 }),
        act("type", { prop: "keyboard", text: "checking in mr lee" }),
        act("look", { target: point(0.3, 1.6, 1.6), duration: 0.8 }),
        act("gestureNod", { count: 1 }),
        act("type", { prop: "keyboard", text: "room twelve" }),
        act("okSign"),
      ]),
    ],
    [
      object("counter", "createTable", "counter", 0, 0.53, 180),

      // The keyboard's front faces local +Z; turning it toward the
      // receptionist makes its home-row layout face the approaching hands.
      object(
        "keyboard",
        "createDesktopKeyboard",
        undefined,
        0,
        0.36,
        180,
        SceneBuild.COUNTER_TOP,
      ),
    ],
  ),
  scene(
    {
      id: "changing-a-mug-grip",
      title: "Changing a mug's grip",
      summary:
        "A guest shifts her mug from handle to body, looks out a window and shifts it back.",
      setting: "everyday",
      roles: { gst: "guest" },
      needs: [],
    },
    "changing-a-mug-grip",
    [
      person("gst", "f1", 0, 0, 0, [
        act("pickUp", { prop: "mug", handle: "handle", hand: "right" }),

        // Both grips belong to the real mug. The regrasp row reads the
        // body's round grip after pickUp has established the handle hold.
        act("regrip", {
          prop: "mug",
          hand: "right",
          to: "body",
        }),
        act("look", { target: point(-0.18, 1.05, 0.3), duration: 1 }),
        act("walk", { to: to(1.2, -0.6), face: 90 }),
        act("look", {
          target: point(2.6, 1.6, -0.6),
          cue: "seen",
          duration: 1.1,
        }),
        act("handOnHip", { hand: "left" }),
        act("gestureNod", { count: 1 }),
        act("walk", { to: to(0, 0), face: 0 }),
        act("regrip", {
          prop: "mug",
          hand: "right",
          to: "handle",
        }),
        act("gestureWave", { hand: "left", count: 1 }),
      ]),
    ],
    counter("counter", "mug", "createDrinkware", "mug", 0, 0),
  ),
  scene(
    {
      id: "entry-gate",
      title: "At the entry gate",
      summary:
        "An attendant lets two visitors through a turnstile, halting the second before beckoning.",
      setting: "everyday",
      roles: { attendant: "attendant" },
      needs: [],
    },
    "entry-gate",
    [
      person("attendant", "f1", 0, 0, 0, [
        act("look", { target: point(1.4, 1.6, 2.5), cue: "seen", duration: 1 }),
        act("gestureBeckon", { hand: "left" }),
        act("openGate", {
          kind: {
            kind: "button",
            at: { kind: "prop", subject: "control", point: "press" },
            travel: BUTTON_TRAVEL,
          },
        }),
        act("pointAt", {
          target: { ...point(1, 1, 0.35), normal: { x: -1, y: 0, z: 0 } },
          hand: "left",
        }),
        act("gestureNod", { count: 1 }),
        act("gestureStopPalm", { hand: "left", hold: 0.4 }),
        act("gestureBeckon", { hand: "left" }),
        act("openGate", {
          kind: {
            kind: "button",
            at: { kind: "prop", subject: "control", point: "press" },
            travel: BUTTON_TRAVEL,
          },
        }),
        act("gestureWave", { hand: "left", count: 1 }),
      ]),
    ],
    [
      object("control", "createSwitch", "button", 0, 0.35, 180, 0, {
        height: CONTROL_HEIGHT,
        travel: CONTROL_TRAVEL,
      }),
      object("turnstile", "createGate", "turnstile", 1, 0.35),
    ],
  ),
  scene(
    {
      id: "drop-test",
      title: "Photographing a drop test",
      summary:
        "One student counts down and drops a remote; the other fires the shutter as it falls.",
      setting: "everyday",
      roles: { photographer: "photographer", partner: "partner" },
      needs: [],
    },
    "drop-test",
    [
      // The partner leads: the shutter press is synced onto her hand
      // opening, so the remote is falling as the shutter fires. It is
      // dropped late in the take, since a fallen prop is swept against the
      // cast until the film ends.
      person("partner", "f1", 0, 2, 0, [
        act("look", { target: point(0, 1.5, 0), cue: "signal", duration: 1 }),
        act("gestureNod", { count: 1 }),
        act("seize", { prop: "sample" }),
        act("look", { target: point(-0.18, 1.05, 2.3), duration: 1 }),
        act("gestureWave", { hand: "left", count: 1 }),
        act("thumbsUp", { hand: "left" }),
        act("countOne", { hand: "left" }),
        act("countTwo", { hand: "left" }),
        act("countThree", { hand: "left" }),
        act(
          "stand",
          { hold: 0.8 },
          {
            over: [
              act(
                "loose",
                { prop: "sample", hand: "right" },
                { anchor: "dt-drop" },
              ),
            ],
          },
        ),
        act("look", { target: point(-0.18, 0.91, 2.3), duration: 1 }),
        act("gestureNod", { count: 1 }),
      ]),
      person("photographer", "m1", 0, 0, 0, [
        act("look", { target: point(0, 1.1, 2.3), duration: 1.2 }),
        act("thumbsUp"),

        // A test exposure before the drop.
        act("pressRelease", {
          kind: {
            kind: "button",
            at: { kind: "prop", subject: "shutter", point: "press" },
            travel: BUTTON_TRAVEL,
          },
        }),
        act("look", { target: point(-0.18, 1, 0.3), duration: 1 }),
        act("okSign"),
        act("gestureNod", { count: 1 }),
        act("look", { target: point(0, 1.1, 2.3), duration: 1 }),

        // The wait ends about as the synced press begins: the chain goes on
        // from the wait's own end, so a longer wait would leave him idle.
        act("stand", { hold: 1.8 }),
        act(
          "pressRelease",
          {
            kind: {
              kind: "button",
              at: { kind: "prop", subject: "shutter", point: "press" },
              travel: BUTTON_TRAVEL,
            },
          },
          {
            sync: {
              of: "dt-drop",
              event: "open",
              offset: 0.08,
              align: "stroke",
            },
          },
        ),
        act("victorySign"),
      ]),
    ],
    [
      ...counter("camera-counter", "camera", "createCamera", undefined, 0, 0),
      object("shutter", "createSwitch", "button", 0, 0.35, 180, 0, {
        height: CONTROL_HEIGHT,
        travel: CONTROL_TRAVEL,
      }),
      ...counter("sample-counter", "sample", "createRemote", undefined, 0, 2),
    ],
  ),
  scene(
    {
      id: "sorting-recycling",
      title: "Sorting recycling",
      summary:
        "A volunteer tosses two bottles from a counter into a basket, one with each hand.",
      setting: "everyday",
      roles: { volunteer: "volunteer" },
      needs: [],
    },
    "sorting-recycling",
    [
      person("volunteer", "f1", 0, 0, 0, [
        act("pickUp", { prop: "bottle", handle: "body" }),
        act("hurlBottle", {
          prop: "bottle",
          target: { kind: "prop", subject: "basket", point: "inside" },
        }),
        act("pickUp", { prop: "bottle2", handle: "body", hand: "left" }),
        act("hurlBottle", {
          prop: "bottle2",
          hand: "left",
          target: { kind: "prop", subject: "basket", point: "inside" },
        }),
        act("selfFistPump", { count: 1 }),
      ]),
    ],
    [
      ...counter("counter", "bottle", "createDrinkware", "waterBottle", 0, 0),
      object(
        "bottle2",
        "createDrinkware",
        "waterBottle",
        0.18,
        0.3,
        0,
        SceneBuild.COUNTER_TOP,
      ),
      object("basket", "createCarryBasket", undefined, 0, 1),
    ],
  ),
];
