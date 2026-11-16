import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, counter, object, person, scene }: typeof SceneBuild = SceneBuild;

/** Public lexicon rows applied to their actual supports and props: a low-table scramble, keyed typing and an already held mug moved from its handle grip to its body grip. */
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
      refusedUntil: 3573,
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
        "createKeyboard",
        "keyboard",
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
];
