import { BoutAnswer } from "../../../motion/choreography/BoutAnswer";
import { BoutChoreography } from "../../../motion/choreography/BoutChoreography";

const { combo, exchange, group, finale } = BoutChoreography;
const { cover, block, catch: catches, parry, check, slip, weave, lean, none } = BoutAnswer.intents;

/**
 * The screenplay's exchanges, composed in the same order and fifteen-second
 * groups as `docs/body/screenplay/kickboxing.md`. Each move names the
 * attacker's technique, the receiver's intent (answer family, start class and
 * any misread) and the outcome the screenplay requires. Performing derives
 * every contact second, draws the film's seeded variation and proves each
 * required outcome from the relations; a wrong composition is refused. Only
 * screenplay anchors are explicit: the touch ends at 1.55, each group keeps
 * its review bounds and the Brazilian kick lands at 150.000.
 */
export namespace BoutComposition {
  /** End of the opening glove touch, film seconds. */
  export const TOUCHED: number = 1.55;

  /** Knockout contact, film seconds. */
  export const KNOCKOUT: number = 150;

  /** The film's variation seed. */
  export const SEED: string = "kickboxing";

  /** The bout as composed intent, in screenplay order. */
  export const groups: readonly BoutChoreography.IGroup[] = Object.freeze([
    group(
      TOUCHED,
      15,
      exchange(
        "a-opening-feint",
        combo("a", ["feint-jab", parry("reactive"), "bit"]),
        combo("b", ["teep", block("late"), "clean"]),
      ),
      exchange(
        "a-first-three",
        combo("a", ["jab", parry(), "deflected"], ["cross", cover(), "blocked"], ["hook", weave(), "missed"]),
        combo("b", ["hook", weave(), "missed"], ["cross", lean(), "missed"]),
      ),
      exchange(
        "b-first-low-kick",
        combo("b", ["jab", cover(), "blocked"], ["low-kick", check(), "checked"]),
        combo("a", ["jab", parry(), "deflected"], ["cross", slip(), "missed"]),
      ),
      exchange(
        "b-feint-into-jab",
        combo("b", ["feint-jab", parry("reactive"), "bit"], ["jab", slip(), "missed"]),
        combo("a", ["body-cross", block(), "blocked"]),
      ),
    ),
    group(
      15,
      30,
      exchange(
        "a-slip-counter-jab",
        combo("b", ["jab", slip(), "missed"]),
        combo("a", ["jab", cover("reactive"), "clean"]),
      ),
      exchange(
        "a-dutch-low-kick",
        combo(
          "a",
          ["jab", parry(), "deflected"],
          ["cross", cover(), "blocked"],
          ["hook", cover(), "blocked"],
          ["low-kick", check("late"), "clean"],
        ),
      ),
      exchange(
        "a-liver-counter",
        combo("b", ["jab", parry(), "deflected"], ["cross", slip(), "missed"]),
        combo("a", ["body-hook", block("late"), "clean"]),
      ),
      exchange("b-teep-reset", combo("b", ["teep", parry(), "deflected"], ["jab", slip(), "missed"])),
      exchange("a-feint-to-body", combo("a", ["feint-jab", parry("reactive"), "bit"], ["body-cross", block(), "blocked"])),
    ),
    group(
      30,
      45,
      exchange(
        "b-low-kick-feint",
        combo("b", ["feint-low-kick", check("reactive"), "bit"], ["low-kick", check("late"), "clean"]),
      ),
      exchange(
        "b-four-to-the-check",
        combo(
          "b",
          ["jab", catches(), "blocked"],
          ["cross", cover(), "blocked"],
          ["hook", weave(), "missed"],
          ["low-kick", check(), "checked"],
        ),
        combo("a", ["cross", cover(), "blocked"]),
      ),
      exchange("a-double-jab", combo("a", ["jab", cover(), "blocked"], ["jab", cover("late"), "clean"])),
      exchange("b-feint-under", combo("b", ["feint-jab", parry("reactive"), "bit"], ["body-hook", block("late"), "clean"])),
      exchange(
        "a-checked-low-kick",
        combo("a", ["low-kick", check(), "checked"]),
        combo("b", ["cross", slip(), "missed"]),
      ),
    ),
    group(
      45,
      60,
      exchange("b-double-jab", combo("b", ["jab", cover(), "blocked"], ["jab", cover(), "blocked"])),
      exchange(
        "b-pressure-and-knee",
        combo("b", ["jab", parry(), "deflected"], ["cross", slip(), "missed"], ["hook", weave(), "missed"]),
        combo("a", ["uppercut", cover("late"), "clean"]),
        combo("b", ["knee", none(), "clean"]),
      ),
      exchange(
        "a-check-hook",
        combo("b", ["jab", slip(), "missed"], ["cross", catches(), "blocked"]),
        combo("a", ["hook", cover("late"), "clean"]),
      ),
      exchange(
        "a-hoost-low-kick",
        combo(
          "a",
          ["jab", cover(), "blocked"],
          ["cross", cover(), "blocked"],
          ["body-hook", block(), "blocked"],
          ["low-kick", check("late"), "clean"],
        ),
      ),
    ),
    group(
      60,
      75,
      exchange(
        "a-body-kick-lands",
        combo("a", ["jab", cover(), "blocked"], ["cross", cover(), "blocked"], ["body-kick", block("late"), "clean"]),
      ),
      exchange(
        "b-switch-kick",
        combo("b", ["switch-kick", block(), "blocked"], ["jab", slip(), "missed"], ["cross", parry(), "deflected"]),
        combo("a", ["hook", cover(), "blocked"]),
      ),
      exchange(
        "a-body-kick-blocked",
        combo("a", ["jab", cover(), "blocked"], ["cross", cover(), "blocked"], ["body-kick", block(), "blocked"]),
      ),
      exchange(
        "b-answers-to-the-body",
        combo("b", ["jab", cover(), "blocked"], ["body-cross", block(), "blocked"], ["hook", weave(), "missed"]),
        combo("a", ["cross", slip(), "missed"]),
      ),
    ),
    group(
      75,
      90,
      exchange(
        "a-double-feint",
        combo(
          "a",
          ["feint-jab", parry("reactive"), "bit"],
          ["feint-low-kick", check("reactive"), "bit"],
          ["cross", cover("reactive"), "clean"],
        ),
      ),
      exchange(
        "b-high-kick",
        combo(
          "b",
          ["jab", parry(), "deflected"],
          ["cross", slip(), "missed"],
          ["hook", weave(), "missed"],
          ["high-kick", block(), "blocked"],
        ),
      ),
      exchange(
        "a-teep-and-body",
        combo("a", ["teep", block("late"), "clean"]),
        combo("b", ["jab", slip(), "missed"]),
        combo("a", ["body-cross", block("late"), "clean"]),
      ),
      exchange(
        "a-counter-from-check",
        combo("b", ["low-kick", check(), "checked"]),
        combo("a", ["jab", cover("reactive"), "clean"], ["cross", cover(), "blocked"]),
      ),
    ),
    group(
      90,
      105,
      exchange(
        "b-longest-combination",
        combo(
          "b",
          ["jab", cover(), "blocked"],
          ["cross", parry(), "deflected"],
          ["body-hook", block(), "blocked"],
          ["low-kick", check(), "checked"],
        ),
        combo("a", ["jab", slip(), "missed"], ["cross", slip(), "missed"]),
        combo("b", ["hook", cover("late"), "clean"], ["cross", cover(), "blocked"], ["hook", cover(), "blocked"]),
      ),
      exchange("a-teep-stops-pressure", combo("a", ["teep", block("late"), "clean"])),
      exchange(
        "b-body-kick-blocked",
        combo("b", ["jab", cover(), "blocked"], ["cross", cover(), "blocked"], ["body-kick", block(), "blocked"]),
        combo("a", ["jab", parry(), "deflected"], ["cross", slip(), "missed"]),
      ),
    ),
    group(
      105,
      120,
      exchange(
        "a-punishes-the-beat",
        combo(
          "b",
          ["jab", parry(), "deflected"],
          ["cross", catches(), "blocked"],
          ["uppercut", cover(), "blocked"],
          ["body-hook", block(), "blocked"],
          ["low-kick", check(), "checked"],
        ),
        combo("a", ["body-hook", block("late"), "clean"], ["hook", cover(), "blocked"], ["cross", cover("late"), "clean"]),
      ),
      exchange("a-clinch-knee", combo("a", ["knee", none(), "clean"])),
      exchange(
        "b-regroups",
        combo("b", ["feint-jab", parry("reactive"), "bit"], ["body-cross", block(), "blocked"]),
        combo("a", ["jab", slip(), "missed"], ["cross", cover(), "blocked"]),
      ),
    ),
    group(
      120,
      135,
      exchange(
        "a-body-kick-feint",
        combo("a", ["jab", cover(), "blocked"], ["feint-body-kick", block("reactive"), "bit"], ["cross", cover("late"), "clean"]),
      ),
      exchange(
        "b-three-answered",
        combo("b", ["jab", parry(), "deflected"], ["cross", slip(), "missed"], ["hook", weave(), "missed"]),
        combo("a", ["cross", cover(), "blocked"]),
      ),
      exchange(
        "a-third-body-kick",
        combo("a", ["jab", cover(), "blocked"], ["cross", cover(), "blocked"], ["body-kick", block(), "blocked"]),
      ),
      exchange(
        "b-feint-into-cross",
        combo("b", ["feint-low-kick", check("reactive"), "bit"], ["cross", cover("reactive"), "clean"]),
        combo("a", ["jab", parry(), "deflected"], ["cross", slip(), "missed"]),
      ),
    ),
    finale(
      135,
      KNOCKOUT,
      exchange(
        "a-cross-from-check",
        combo("b", ["jab", parry(), "deflected"], ["cross", slip(), "missed"], ["hook", weave(), "missed"], ["low-kick", check(), "checked"]),
        combo("a", ["cross", cover("reactive"), "clean"]),
      ),
      exchange(
        "a-body-and-leg",
        combo("b", ["jab", slip(), "missed"]),
        combo("a", ["body-hook", block(), "blocked"], ["low-kick", check(), "checked"]),
      ),
      exchange(
        "b-arm-drops-early",
        combo("b", ["jab", parry(), "deflected"], ["cross", slip(), "missed"]),
        combo("a", ["body-kick", block("committed"), "blocked"]),
      ),
      exchange(
        "a-brazilian-kick",
        combo(
          "a",
          ["jab", cover(), "blocked"],
          ["cross", cover(), "blocked"],
          ["body-hook", block(), "blocked"],
          "settle",
          // B's habit: when A's right knee rises he reads the familiar body
          // kick and drops his left arm to his ribs; the kick lands because
          // that read is wrong.
          ["brazilian-kick", block("reactive", "body-kick"), "clean"],
        ),
      ),
    ),
  ]);
}
