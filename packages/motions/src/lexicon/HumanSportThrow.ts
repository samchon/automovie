import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { jump } from "../actions/jump";
import { run } from "../actions/run";
import { kickBall } from "../ballStrike/kickBall";
import { HumanActionRow } from "../law/HumanActionRow";
import { cartwheel } from "../sport/cartwheel";
import { salto } from "../sport/salto";
import { catchObject } from "../throwing/catchObject";
import { throwObject } from "../throwing/throwObject";

/**
 * Throws, catches, kicks, jumps and runs of sport under their names, each a
 * row of the shipped law that plans it. The composition gives what the law
 * leaves open: the ball the hand holds and what it is thrown at, the ball
 * kicked and where, the thrower caught from, the place jumped or run to.
 *
 * The laws own the physics a row inherits: a throw's kinetic chain and the
 * ball's ballistic flight from its release, a catch's interception, a kick's
 * ball flight, a jump's flight from its take-off speed. First pass: a row
 * fixes only the style its name means; an event's own technique (a pitcher's
 * windup, a jump shot's leap before the release, a hurdle's trail leg) is
 * not planned, and the row says so; a high jump's arch over the bar is
 * `HumanGymnastics.fosburyFlop`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row is a row of, what the composition gives, whose physics a row inherits and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped action (`HumanActionRow`), so it is data over a law that already fits the body, refuses and is checked.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One row per sport act that is a throw, a catch, a kick, a jump or a run; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own or fixes a length in metres.
 */
export namespace HumanSportThrow {
  /** A baseball pitch, a crow-hop throw or a javelin throw: overarm. The windup is not planned. */
  export const pitch: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["pitch"]
  > = HumanActionRow.of("pitch", throwObject, {
    style: "overarm",
  });

  /** A softball pitch or a bowling delivery: underarm. The windmill is not planned. */
  export const underarmPitch: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["underarmPitch"]
  > = HumanActionRow.of("underarmPitch", throwObject, {
    style: "underarm",
  });

  /** A fastpitch softball delivery with an underhand windmill. */
  export const softballWindmill: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["softballWindmill"]
  > = HumanActionRow.of("softballWindmill", throwObject, { style: "windmill" });

  /** A high cricket release directed toward the authored pitch bounce. */
  export const cricketBowl: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["cricketBowl"]
  > = HumanActionRow.of("cricketBowl", throwObject, { style: "cricket" });

  /** The low delivery of a one-handed ten-pin bowling approach. */
  export const bowlingDelivery: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["bowlingDelivery"]
  > = HumanActionRow.of("bowlingDelivery", throwObject, { style: "bowling" });

  /** A chest or bounce pass, a free throw or a shot put: a push from before the chest. The leap of a jump shot and the glide of a shot put are not planned. */
  export const pushPass: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["pushPass"]
  > = HumanActionRow.of("pushPass", throwObject, {
    style: "toss",
  });

  /** Rugby pass with a two-hand release to the receiver's mark. */
  export const rugbyPass: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["rugbyPass"]
  > = HumanActionRow.of("rugbyPass", throwObject, { style: "rugby" });

  /** Overarm gridiron pass. */
  export const gridironPass: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["gridironPass"]
  > = HumanActionRow.of("gridironPass", throwObject, { style: "gridironPass" });

  /** Gridiron snap from a folded stance. */
  export const gridironSnap: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["gridironSnap"]
  > = HumanActionRow.of("gridironSnap", throwObject, { style: "gridironSnap" });

  /** A catch of a fly ball or a thrown ball in one hand. */
  export const gloveCatch: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["gloveCatch"]
  > = HumanActionRow.of("gloveCatch", catchObject, {
    hands: "one",
  });

  /** A goalkeeper's or a receiver's catch in both hands. */
  export const twoHandCatch: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["twoHandCatch"]
  > = HumanActionRow.of("twoHandCatch", catchObject, {
    hands: "two",
  });

  /** A football pass, shot, cross or punt with the right foot; the composition gives the ball and where it goes. */
  export const kickRight: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["kickRight"]
  > = HumanActionRow.of("kickRight", kickBall, {
    foot: "right",
  });

  /** The same with the left foot. */
  export const kickLeft: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["kickLeft"]
  > = HumanActionRow.of("kickLeft", kickBall, {
    foot: "left",
  });

  /** A rebound, a block, a long jump or a hurdle clearance: a jump to the place the composition gives. The run-up is a run before it; a hurdle's trail leg is not planned, and a high jump's arch over the bar is `HumanGymnastics.fosburyFlop`. */
  export const leap: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["leap"]
  > = HumanActionRow.of("leap", jump, {});

  /** A box jump: a jump onto a box, landing on its top. The composition gives `to` as the top's place with its height as `y`, `on` as the box's prop, and an `apex` above the climb. */
  export const boxJump: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["boxJump"]
  > = HumanActionRow.of("boxJump", jump, {});

  /** A forward salto to the place the composition gives: one turn in the flight, the body not tucked. */
  export const frontSalto: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["frontSalto"]
  > = HumanActionRow.of("frontSalto", salto, {
    way: "forward",
  });

  /** A backward salto to the place the composition gives. */
  export const backSalto: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["backSalto"]
  > = HumanActionRow.of("backSalto", salto, {
    way: "backward",
  });

  /** A cartwheel to the performer's left: one sideways turn over a foot, the two hands and the other foot. */
  export const cartwheelLeft: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["cartwheelLeft"]
  > = HumanActionRow.of("cartwheelLeft", cartwheel, {
    to: "left",
  });

  /** A cartwheel to the performer's right. */
  export const cartwheelRight: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["cartwheelRight"]
  > = HumanActionRow.of("cartwheelRight", cartwheel, {
    to: "right",
  });

  /** A sprint: the acceleration out of the start, a base run or a run-up, at sprint pace. */
  export const dash: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["dash"]
  > = HumanActionRow.of("dash", run, { pace: "sprint" });
}
