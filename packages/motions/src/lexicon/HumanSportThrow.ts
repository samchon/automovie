import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { jump } from "../actions/jump";
import { run } from "../actions/run";
import { kickBall } from "../ballStrike/kickBall";
import { HumanActionRow } from "../law/HumanActionRow";
import { HUMAN_BOWLING_DELIVERY } from "../next/presets/HUMAN_BOWLING_DELIVERY";
import { HUMAN_THROWCATCH_CRICKET_BOWL } from "../next/presets/HUMAN_THROWCATCH_CRICKET_BOWL";
import { HUMAN_THROWCATCH_GLOVE_CATCH } from "../next/presets/HUMAN_THROWCATCH_GLOVE_CATCH";
import { HUMAN_THROWCATCH_GRIDIRON_PASS } from "../next/presets/HUMAN_THROWCATCH_GRIDIRON_PASS";
import { HUMAN_THROWCATCH_GRIDIRON_SNAP } from "../next/presets/HUMAN_THROWCATCH_GRIDIRON_SNAP";
import { HUMAN_THROWCATCH_KICK_LEFT } from "../next/presets/HUMAN_THROWCATCH_KICK_LEFT";
import { HUMAN_THROWCATCH_KICK_RIGHT } from "../next/presets/HUMAN_THROWCATCH_KICK_RIGHT";
import { HUMAN_THROWCATCH_PITCH } from "../next/presets/HUMAN_THROWCATCH_PITCH";
import { HUMAN_THROWCATCH_PUSH_PASS } from "../next/presets/HUMAN_THROWCATCH_PUSH_PASS";
import { HUMAN_THROWCATCH_RUGBY_PASS } from "../next/presets/HUMAN_THROWCATCH_RUGBY_PASS";
import { HUMAN_THROWCATCH_SOFTBALL_WINDMILL } from "../next/presets/HUMAN_THROWCATCH_SOFTBALL_WINDMILL";
import { HUMAN_THROWCATCH_TWO_HAND_CATCH } from "../next/presets/HUMAN_THROWCATCH_TWO_HAND_CATCH";
import { HUMAN_THROWCATCH_UNDERARM_PITCH } from "../next/presets/HUMAN_THROWCATCH_UNDERARM_PITCH";
import { bowlingSlide as bowlingSlideLaw } from "../sport/bowlingSlide";
import { cartwheel } from "../sport/cartwheel";
import { salto } from "../sport/salto";
import { catchObject } from "../throwing/catchObject";
import { throwObject } from "../throwing/throwObject";

/**
 * Throws, catches, kicks, jumps and runs of sport under their names, each a row
 * of the shipped law that plans it. The composition gives what the law leaves
 * open: the ball the hand holds and what it is thrown at, the ball kicked and
 * where, the thrower caught from, the place jumped or run to.
 *
 * The laws own the physics a row inherits: a throw's kinetic chain and the
 * ball's ballistic flight from its release, a catch's interception, a kick's
 * ball flight, a jump's flight from its take-off speed. First pass: a row fixes
 * only the style its name means; an event's own technique (a pitcher's windup,
 * a jump shot's leap before the release, a hurdle's trail leg) is not planned,
 * and the row says so; a high jump's arch over the bar is
 * `HumanGymnastics.fosburyFlop`.
 */
export namespace HumanSportThrow {
  /**
   * A baseball pitch, a crow-hop throw or a javelin throw: overarm. The windup
   * is not planned. Overarm: release 20 degrees above the horizontal after a
   * 0.5 s windup. A farther target is a faster throw.
   */
  export const pitch: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["pitch"]
  > = HumanActionRow("pitch", throwObject, HUMAN_THROWCATCH_PITCH);

  /**
   * A softball pitch or a bowling delivery: underarm. The windmill is not
   * planned. Underarm: release 40 degrees after a 0.45 s windup. A farther
   * target is a faster throw.
   */
  export const underarmPitch: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["underarmPitch"]
  > = HumanActionRow(
    "underarmPitch",
    throwObject,
    HUMAN_THROWCATCH_UNDERARM_PITCH,
  );

  /**
   * A fastpitch softball delivery with an underhand windmill. Release 2 degrees
   * after a 0.64 s windup. A farther target is a faster throw.
   */
  export const softballWindmill: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["softballWindmill"]
  > = HumanActionRow(
    "softballWindmill",
    throwObject,
    HUMAN_THROWCATCH_SOFTBALL_WINDMILL,
  );

  /**
   * A high cricket release directed toward the authored pitch bounce. Release 4
   * degrees below the horizontal after a 0.42 s windup. A farther target is a
   * faster throw.
   */
  export const cricketBowl: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["cricketBowl"]
  > = HumanActionRow("cricketBowl", throwObject, HUMAN_THROWCATCH_CRICKET_BOWL);

  /** Slide on the supporting foot before a delivery. */
  export const bowlingSlide: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["bowlingSlide"]
  > = bowlingSlideLaw;

  /**
   * The low delivery of a one-handed ten-pin bowling approach. Release 1 degree
   * below the horizontal after a 0.58 s windup, along the lane. A farther
   * target is a faster throw.
   */
  export const bowlingDelivery: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["bowlingDelivery"]
  > = HumanActionRow("bowlingDelivery", throwObject, HUMAN_BOWLING_DELIVERY);

  /**
   * A one-hand push pass, a free throw or a shot put (the two-hand chest and
   * bounce passes are `ballSport` kinds `chestPass` and `bouncePass`): a push
   * from before the chest. The leap of a jump shot and the glide of a shot put
   * are not planned. Toss: release 50 degrees after a 0.35 s windup. A farther
   * target is a faster throw.
   */
  export const pushPass: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["pushPass"]
  > = HumanActionRow("pushPass", throwObject, HUMAN_THROWCATCH_PUSH_PASS);

  /**
   * Rugby pass with a two-hand release to the receiver's mark. Release 18
   * degrees after a 0.3 s windup. A farther target is a faster throw.
   */
  export const rugbyPass: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["rugbyPass"]
  > = HumanActionRow("rugbyPass", throwObject, HUMAN_THROWCATCH_RUGBY_PASS);

  /**
   * Overarm gridiron pass. Release 17 degrees after a 0.45 s windup. A farther
   * target is a faster throw.
   */
  export const gridironPass: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["gridironPass"]
  > = HumanActionRow(
    "gridironPass",
    throwObject,
    HUMAN_THROWCATCH_GRIDIRON_PASS,
  );

  /**
   * Gridiron snap from a folded stance. Release 22 degrees after a 0.24 s
   * windup. A farther target is a faster throw.
   */
  export const gridironSnap: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["gridironSnap"]
  > = HumanActionRow(
    "gridironSnap",
    throwObject,
    HUMAN_THROWCATCH_GRIDIRON_SNAP,
  );

  /** A catch of a fly ball or a thrown ball in one hand. */
  export const gloveCatch: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["gloveCatch"]
  > = HumanActionRow("gloveCatch", catchObject, HUMAN_THROWCATCH_GLOVE_CATCH);

  /** A goalkeeper's or a receiver's catch in both hands. */
  export const twoHandCatch: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["twoHandCatch"]
  > = HumanActionRow(
    "twoHandCatch",
    catchObject,
    HUMAN_THROWCATCH_TWO_HAND_CATCH,
  );

  /**
   * A football pass, shot, cross or punt with the right foot; the composition
   * gives the ball and where it goes.
   */
  export const kickRight: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["kickRight"]
  > = HumanActionRow("kickRight", kickBall, HUMAN_THROWCATCH_KICK_RIGHT);

  /** The same with the left foot. */
  export const kickLeft: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["kickLeft"]
  > = HumanActionRow("kickLeft", kickBall, HUMAN_THROWCATCH_KICK_LEFT);

  /**
   * A rebound, a block, a long jump or a hurdle clearance: a jump to the place
   * the composition gives. The run-up is a run before it; a hurdle's trail leg
   * is not planned, and a high jump's arch over the bar is
   * `HumanGymnastics.fosburyFlop`.
   */
  export const leap: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["leap"]
  > = HumanActionRow("leap", jump, {});

  /**
   * A box jump: a jump onto a box, landing on its top. The composition gives
   * `to` as the top's place with its height as `y`, `on` as the box's prop, and
   * an `apex` above the climb.
   */
  export const boxJump: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["boxJump"]
  > = HumanActionRow("boxJump", jump, {});

  /**
   * A forward salto to the place the composition gives: one turn in the flight,
   * the body not tucked.
   */
  export const frontSalto: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["frontSalto"]
  > = HumanActionRow("frontSalto", salto, {
    way: "forward",
  });

  /** A backward salto to the place the composition gives. */
  export const backSalto: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["backSalto"]
  > = HumanActionRow("backSalto", salto, {
    way: "backward",
  });

  /**
   * A cartwheel to the performer's left: one sideways turn over a foot, the two
   * hands and the other foot. Takes 1.6 s by default (`cartwheel.SECONDS`,
   * provisional).
   */
  export const cartwheelLeft: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["cartwheelLeft"]
  > = HumanActionRow("cartwheelLeft", cartwheel, {
    to: "left",
  });

  /**
   * Capoeira's aú: a cartwheel to the left through both hands. Takes 1.6 s by
   * default (`cartwheel.SECONDS`, provisional).
   */
  export const au: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["au"]
  > = HumanActionRow("au", cartwheel, {
    to: "left",
  });

  /**
   * A cartwheel to the performer's right. Takes 1.6 s by default
   * (`cartwheel.SECONDS`, provisional).
   */
  export const cartwheelRight: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["cartwheelRight"]
  > = HumanActionRow("cartwheelRight", cartwheel, {
    to: "right",
  });

  /**
   * A sprint: the acceleration out of the start, a base run or a run-up, at
   * sprint pace. The `sprint` run: about 6.8 m/s at the reference hip
   * ({@link IAutoMovieMotionHumanRun.IParams.pace}); a start, a charge or a
   * finish.
   */
  export const dash: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportThrow"]["dash"]
  > = HumanActionRow("dash", run, { pace: "sprint" });
}
