import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, counter, object, person, scene }: typeof SceneBuild = SceneBuild;

/** The lower end of the call button's travel band, in metres. */
const BUTTON_TRAVEL: number = 0.001;

/** Mount the wall controls at the lower end of the switch mounting band. */
const CONTROL_HEIGHT: number = 1.065;

/** Everyday handling with reachable supports, controls, grips and receptacles. */
export const SCENES_HANDLING: readonly IScene[] = [
  scene(
    {
      id: "low-table-scramble",
      title: "Onto a low table",
      summary:
        "With both palms braced on a low table, an athlete brings one knee onto its edge, steps the other foot onto the top and stands on both feet.",
      setting: "gym",
      roles: { ath: "athlete" },
      needs: [],
      view: "side",
    },
    "low-table-scramble",
    [
      person("ath", "m1", 0, 0, 0, [
        act("scramble", {
          on: { kind: "prop", subject: "table", point: "front" },
        }),
      ]),
    ],
    [object("table", "createTable", "coffee", 0, 0.65, 180)],
  ),
  scene(
    {
      id: "typing-at-the-counter",
      title: "Typing at the counter",
      summary:
        "A standing receptionist types hello with both hands on a keyboard placed on the counter, each letter assigned to its touch-typing finger.",
      setting: "work",
      roles: { rec: "receptionist" },
      needs: [],
    },
    "typing-at-the-counter",
    [
      person("rec", "f1", 0, 0, 0, [
        act("type", { prop: "keyboard", text: "hello" }),
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
        "A guest takes an empty mug by its handle, shifts it in the same hand to hold its body instead, then holds it still.",
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
          side: "right",
          to: "body",
        }),
        act("stand", { seconds: 1 }),
      ]),
    ],
    counter("counter", "mug", "createDrinkware", "mug", 0, 0),
  ),
  scene(
    {
      id: "entry-gate",
      title: "At the entry gate",
      summary: "An attendant presses the entry control beside a turnstile.",
      setting: "everyday",
      roles: { attendant: "attendant" },
      needs: [],
    },
    "entry-gate",
    [
      person("attendant", "f1", 0, 0, 0, [
        act("openGate", {
          mechanism: {
            kind: "button",
            at: { kind: "prop", subject: "control", point: "press" },
            travel: BUTTON_TRAVEL,
          },
        }),
      ]),
    ],
    [
      object("control", "createSwitch", "button", 0, 0.35, 180, 0, {
        height: CONTROL_HEIGHT,
      }),
      object("turnstile", "createGate", "turnstile", 1, 0.35),
    ],
  ),
  scene(
    {
      id: "drop-test",
      title: "Photographing a drop test",
      summary:
        "One student presses the camera release while a partner picks up a remote control and lets it fall back onto the counter.",
      setting: "everyday",
      roles: { photographer: "photographer", partner: "partner" },
      needs: [],
    },
    "drop-test",
    [
      person("photographer", "m1", 0, 0, 0, [
        act("pressRelease", {
          mechanism: {
            kind: "button",
            at: { kind: "prop", subject: "shutter", point: "press" },
            travel: BUTTON_TRAVEL,
          },
        }),
      ]),
      person("partner", "f1", 0, 2, 0, [
        act("seize", { prop: "sample" }),
        act(
          "stand",
          {},
          {
            over: [act("loose", { prop: "sample", hand: "right" })],
          },
        ),
      ]),
    ],
    [
      ...counter("camera-counter", "camera", "createCamera", undefined, 0, 0),
      object("shutter", "createSwitch", "button", 0, 0.35, 180, 0, {
        height: CONTROL_HEIGHT,
      }),
      ...counter("sample-counter", "sample", "createRemote", undefined, 0, 2),
    ],
  ),
  scene(
    {
      id: "sorting-recycling",
      title: "Sorting recycling",
      summary:
        "A volunteer picks up an empty water bottle from the sorting counter and tosses it into the collection basket.",
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
          at: { kind: "prop", subject: "basket", point: "inside" },
        }),
      ]),
    ],
    [
      ...counter("counter", "bottle", "createDrinkware", "waterBottle", 0, 0),
      object("basket", "createCarryBasket", undefined, 0, 1),
    ],
  ),
];
