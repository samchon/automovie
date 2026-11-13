import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { HumanHand } from "./HumanHand";

/**
 * The finger joints of a named hand shape: the angles `HumanHand.Shape`
 * stands for on every finger and thumb segment of one hand.
 *
 * The angles themselves are stated with their sources in `HumanHand`'s own
 * document; this module holds only their table.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the module gives and where the angles are sourced.
 * @evidence contracts/development/design.md#principled-representation One function from a closed shape name to clinical flexion per finger segment.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The table alone; `HumanHand` owns the shape names and calls it as its `shape`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No hand is special: the side only prefixes the bone names.
 */
export namespace HumanHandShape {
  /**
   * The finger joints of a hand shape, clinical degrees.
   *
   * @param side The hand.
   * @param form The shape.
   * @returns Angles for every finger and thumb segment of that hand.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the unit and what the result covers.
   * @evidence contracts/development/implementation.md#principled-implementation A fist and the curled fingers of a point flex each segment near its range; a flat hand is straight; a relaxed finger takes the position of rest, since the body's rest pose carries no curl of its own. The values are `HumanHand`'s documented ones.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Four fingers by three segments, then the thumb.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every segment is written for every shape, so no joint keeps an angle of the shape before.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Fifteen assignments with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function of(
    side: HumanHand.Side,
    form: HumanHand.Shape,
  ): Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>> {
    const out: Partial<
      Record<AutoMovieHumanoidBone, readonly [number, number, number]>
    > = {};
    const set = (bone: string, flexion: number): void => {
      out[`${side}${bone}` as AutoMovieHumanoidBone] = [flexion, 0, 0];
    };
    for (const digit of ["Index", "Middle", "Ring", "Little"]) {
      const curled: boolean =
        form === "fist" || (form === "point" && digit !== "Index");
      for (const segment of ["Proximal", "Intermediate", "Distal"]) {
        if (curled) set(`${digit}${segment}`, segment === "Proximal" ? 85 : 95);
        else if (form !== "relaxed") set(`${digit}${segment}`, 0);
        // The position of rest on a finger whose zero is straight: the
        // body's rest pose no longer carries a curl of its own.
        else
          set(
            `${digit}${segment}`,
            segment === "Proximal" ? 35 : segment === "Intermediate" ? 30 : 20,
          );
      }
    }
    const folded: boolean = form === "fist" || form === "point";
    set("ThumbMetacarpal", 0);
    set("ThumbProximal", folded ? 40 : form === "relaxed" ? 25 : 0);
    set("ThumbDistal", folded ? 50 : form === "relaxed" ? 25 : 0);
    return out;
  }

  /**
   * A hand shape that carries a meaning of its own: the shapes of the
   * emblems the gesture lexicon adds (#3345), beside the four working shapes
   * of `HumanHand.Shape`.
   *
   * - `thumbUp`: the fist with the thumb straight.
   * - `ok`: the forefinger and the thumb bent into a ring, the others open.
   * - `victory`: the forefinger and the middle finger straight and spread,
   *   the others folded.
   * - `crossed`: the forefinger and the middle finger straight and laid
   *   toward each other, the others folded.
   * - `count1` to `count5`: that many digits straight from the forefinger
   *   on, the thumb last (one convention of several; cultures differ).
   * - `snap`: the middle finger's tip on the thumb's, as before a snap.
   * - `quotes`: the forefinger and the middle finger hooked, the others
   *   folded.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each shape by what the fingers do and states the counting convention.
   * @evidence contracts/development/design.md#principled-representation A closed union of emblem shapes, each a set of finger joint angles in `emblem`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The shapes the emblem rows read; the working shapes stay `HumanHand.Shape`'s.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A separate union, so no caller of the working shapes changes.
   */
  export type Emblem =
    | "thumbUp"
    | "ok"
    | "victory"
    | "crossed"
    | "count1"
    | "count2"
    | "count3"
    | "count4"
    | "count5"
    | "snap"
    | "quotes";

  /**
   * The finger joints of an emblem shape, clinical degrees (every angle
   * provisional: set from the shape's description, no measured source read).
   *
   * @param side The hand.
   * @param form The shape.
   * @returns Angles for every finger and thumb segment of that hand.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit, what is returned and that the angles are provisional.
   * @evidence contracts/development/implementation.md#principled-implementation Each digit is straight, folded as in the fist, or bent to the angles its shape names; a spread or a crossing is the proximal joint's abduction.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One table of digit states per shape and one loop that writes them.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The fold is the fist's own (85 and 95 degrees), so an emblem's folded fingers match the working shape.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function emblem(
    side: HumanHand.Side,
    form: Emblem,
  ): Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>> {
    const out: Partial<
      Record<AutoMovieHumanoidBone, readonly [number, number, number]>
    > = {};
    const digits: readonly string[] = ["Index", "Middle", "Ring", "Little"];

    // How many fingers stand straight, from the forefinger on.
    const straight: number =
      form === "thumbUp" || form === "snap"
        ? 0
        : form === "ok"
          ? 4
          : form === "victory" || form === "crossed" || form === "quotes"
            ? 2
            : form === "count5"
              ? 4
              : Number(form.slice(5));
    digits.forEach((digit: string, index: number): void => {
      const open: boolean = index < straight;
      for (const segment of ["Proximal", "Intermediate", "Distal"]) {
        const bone: AutoMovieHumanoidBone =
          `${side}${digit}${segment}` as AutoMovieHumanoidBone;

        // A spread or a crossing turns the two straight fingers' knuckles.
        const lean: number =
          segment !== "Proximal" || index > 1
            ? 0
            : (form === "victory" ? 10 : form === "crossed" ? -8 : 0) *
              (index === 0 ? -1 : 1);
        const hooked: number =
          form === "quotes" && open
            ? segment === "Proximal"
              ? 10
              : segment === "Intermediate"
                ? 70
                : 40
            : form === "ok" && index === 0
              ? segment === "Proximal"
                ? 60
                : segment === "Intermediate"
                  ? 70
                  : 30
              : form === "snap" && index === 1
                ? segment === "Distal"
                  ? 20
                  : 60
                : open
                  ? 0
                  : segment === "Proximal"
                    ? 85
                    : 95;
        out[bone] = [hooked, lean, 0];
      }
    });

    // The thumb: straight for a thumbs up and a five, bent to the ring or the
    // middle finger's tip, folded over the fingers otherwise.
    const thumb: readonly [number, number] =
      form === "thumbUp" || form === "count5"
        ? [0, 0]
        : form === "ok" || form === "snap"
          ? [30, 25]
          : [40, 50];
    out[`${side}ThumbMetacarpal` as AutoMovieHumanoidBone] = [0, 0, 0];
    out[`${side}ThumbProximal` as AutoMovieHumanoidBone] = [thumb[0], 0, 0];
    out[`${side}ThumbDistal` as AutoMovieHumanoidBone] = [thumb[1], 0, 0];
    return out;
  }
}
