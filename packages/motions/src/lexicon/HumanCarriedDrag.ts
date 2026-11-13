import type { HumanCarried } from "./HumanCarried";

/**
 * The carries in which the carried body trails on the floor (#3349): the
 * armpit drag, the collar drag and the ankle drag. Each is a row of
 * `HumanCarried.CARRIES`, read by `borne` and `bearing` like any carry; the
 * dragger walks backward under `bearing`.
 *
 * Every angle and offset is provisional, set from the drags' common
 * descriptions in first-aid manuals (American Red Cross, First Aid/CPR/AED
 * Participant's Manual, emergency moves): armpit drag, the upper back
 * against the dragger's front, reclined; collar (clothes) drag, on the
 * back, the head between the dragger's forearms, pulled by the clothing
 * behind the neck; ankle drag, on the back, pulled feet first by both
 * ankles.
 *
 * First pass: the dragger does not stoop or lean against the load
 * (`bearing` claims the arms only), so the collar and the ankles are held
 * at the height straight arms reach standing, higher than a stooped
 * rescuer holds them; a carry rests one region on one region, so the collar
 * drag's neck lies before the dragger's left thigh and the ankle drag's
 * left calf before the right one, off the midline by half the hips; the
 * dragged body is rigid and its trailing part is not laid on the floor by a
 * contact solve.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three drags, the source of their descriptions and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation Rows of the carry table, so a drag is data over the two carry laws.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The drags' names and their rows.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No length in metres; offsets are in arm lengths.
 */
export namespace HumanCarriedDrag {
  /** A drag's name. */
  export type Name = "armpitDrag" | "collarDrag" | "ankleDrag";

  /** The drags. */
  export const CARRIES: Readonly<Record<Name, HumanCarried.IRow>> = {
    armpitDrag: {
      mine: "upperBack",
      theirs: "abdomen",
      turn: 0,
      pitch: -55,
      legs: [10, 5, 0],
      clings: [null, null],
      holds: [
        { region: "abdomen", offset: { out: 0.2, up: -0.1, forward: 0.2 } },
        { region: "abdomen", offset: { out: 0.2, up: -0.1, forward: 0.2 } },
      ],
    },
    collarDrag: {
      mine: "nape",
      theirs: "thighFrontLeft",
      turn: 0,
      pitch: -70,
      legs: [5, 5, 0],
      clings: [null, null],
      holds: [
        {
          region: "thighFrontLeft",
          offset: { out: -0.05, up: 0, forward: 0.15 },
        },
        {
          region: "thighFrontRight",
          offset: { out: -0.05, up: 0, forward: 0.15 },
        },
      ],
    },
    ankleDrag: {
      mine: "calfLeft",
      theirs: "thighFrontRight",
      turn: 180,
      pitch: -90,
      legs: [60, 0, 0],
      clings: [null, null],
      holds: [
        {
          region: "thighFrontLeft",
          offset: { out: 0, up: 0, forward: 0.2 },
        },
        {
          region: "thighFrontRight",
          offset: { out: 0, up: 0, forward: 0.2 },
        },
      ],
    },
  };
}
