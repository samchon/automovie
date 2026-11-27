import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { bend } from "../../everyday/internal/bend";
import { crouch } from "../../everyday/internal/crouch";
import { kneel } from "../../everyday/internal/kneel";
import { dance } from "../../exercise/internal/dance";
import { exercise } from "../../exercise/internal/exercise";
import { stretch } from "../../exercise/internal/stretch";
import { lieDown } from "../../floor/internal/lieDown";
import { AutoMovieMotionHumanActionRow } from "../../law/AutoMovieMotionHumanActionRow";
import { athletics } from "../../sport/internal/athletics";
import { ballSport } from "../../sport/internal/ballSport";
import { AutoMovieMotionHumanBaseball as baseball } from "../../sport/internal/AutoMovieMotionHumanBaseball";
import { gymnastics } from "../../sport/internal/gymnastics";
import { martialArt } from "../../sport/internal/martialArt";
import { AutoMovieMotionHumanRacket as racket } from "../../sport/internal/AutoMovieMotionHumanRacket";
import { swim } from "../../sport/internal/swim";
import { step } from "../../striking/internal/step";

/**
 * Sport, exercise, stretching and dance under the names a screenplay uses, each
 * a row of the shipped law that plans it with its kind fixed. A row leaves open
 * what its law leaves open (a side, a count, a hold, a manner). Register the
 * ones a film uses.
 *
 * `HumanDrill` already names `squats`, `jumpingJacks` and `sway`; they are not
 * repeated here.
 */
export namespace HumanSport {
  /**
   * Walking-free lunges in place. Default 3 repetitions of 3.3 s at the default
   * tempo ({@link IAutoMovieMotionHumanExercise.IParams.tempo}).
   */
  export const lunges: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["lunges"]
  > = AutoMovieMotionHumanActionRow.of("lunges", exercise, {
    kind: "lunge",
  });

  /**
   * High knees, running in place. Default 3 repetitions, one knee each,
   * alternating, of 3.3 s at the default tempo; the repetition clock reads
   * `tempo` ({@link IAutoMovieMotionHumanExercise.IParams.tempo}) as every
   * exercise does, so running knees need a short `tempo` (the 0.3 s at the top
   * stays).
   */
  export const highKnees: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["highKnees"]
  > = AutoMovieMotionHumanActionRow.of("highKnees", exercise, {
    kind: "highKnees",
  });

  /**
   * A neck stretch to the side. A moderate-intensity stretch: 1.5 s to enter,
   * 30 s held, 1.5 s to release ({@link stretch.HOLD}); `seconds` sets the
   * hold.
   */
  export const neckStretch: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["neckStretch"]
  > = AutoMovieMotionHumanActionRow.of("neckStretch", stretch, {
    kind: "neckSide",
  });

  /**
   * A shoulder stretch, the arm drawn across the chest. A moderate-intensity
   * stretch: 1.5 s to enter, 30 s held, 1.5 s to release ({@link stretch.HOLD});
   * `seconds` sets the hold.
   */
  export const shoulderStretch: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["shoulderStretch"]
  > = AutoMovieMotionHumanActionRow.of("shoulderStretch", stretch, {
    kind: "crossBody",
  });

  /**
   * A side stretch, the arm overhead. A moderate-intensity stretch: 1.5 s to
   * enter, 30 s held, 1.5 s to release ({@link stretch.HOLD}); `seconds` sets
   * the hold.
   */
  export const sideStretch: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["sideStretch"]
  > = AutoMovieMotionHumanActionRow.of("sideStretch", stretch, {
    kind: "overheadSide",
  });

  /**
   * A standing quadriceps stretch, the heel drawn to the seat. A
   * moderate-intensity stretch: 1.5 s to enter, 30 s held, 1.5 s to release
   * ({@link stretch.HOLD}); `seconds` sets the hold.
   */
  export const quadStretch: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["quadStretch"]
  > = AutoMovieMotionHumanActionRow.of("quadStretch", stretch, {
    kind: "quadriceps",
  });

  /**
   * The tree pose of yoga. A moderate-intensity stretch: 1.5 s to enter, 30 s
   * held, 1.5 s to release ({@link stretch.HOLD}); `seconds` sets the hold.
   */
  export const treePose: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["treePose"]
  > = AutoMovieMotionHumanActionRow.of("treePose", stretch, {
    kind: "tree",
  });

  /**
   * A bounce to the beat. Default 8 beats at 120 beats a minute, 0.5 s a beat:
   * 4 s plus one beat ({@link IAutoMovieMotionHumanDance.IParams.beats}).
   */
  export const bounce: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["bounce"]
  > = AutoMovieMotionHumanActionRow.of("bounce", dance, { kind: "bounce" });

  /**
   * A step-touch to the beat. Default 8 beats at 120 beats a minute, 0.5 s a
   * beat: 4 s plus one beat ({@link IAutoMovieMotionHumanDance.IParams.beats}).
   */
  export const stepTouch: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["stepTouch"]
  > = AutoMovieMotionHumanActionRow.of("stepTouch", dance, {
    kind: "stepTouch",
  });

  /**
   * A box step to the beat: forward, side, close, back, side, close. Default 8
   * beats at 120 beats a minute, 0.5 s a beat: 4 s plus one beat
   * ({@link IAutoMovieMotionHumanDance.IParams.beats}).
   */
  export const boxStep: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["boxStep"]
  > = AutoMovieMotionHumanActionRow.of("boxStep", dance, {
    kind: "boxStep",
  });

  /**
   * The set position of a sprint start. Crouches over 1.5 s
   * ({@link athletics.CROUCH}), then holds the set 1.5 s by default (`seconds`);
   * provisional.
   */
  export const sprintStart: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["sprintStart"]
  > = AutoMovieMotionHumanActionRow.of("sprintStart", athletics, {});

  /**
   * A handstand. Enters over 1.5 s ({@link gymnastics.ENTER}) and holds 2 s by
   * default (`seconds`).
   */
  export const handstand: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["handstand"]
  > = AutoMovieMotionHumanActionRow.of("handstand", gymnastics, {});

  /** The horse stance of karate and kung fu. */
  export const horseStance: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["horseStance"]
  > = AutoMovieMotionHumanActionRow.of("horseStance", martialArt, {
    kind: "horseStance",
  });

  /**
   * Straight punches from the horse stance (choku-zuki). Four punches by
   * default, each extending in 0.2 s and staying 0.2 s, the 400 ms of a
   * choku-zuki (VencesBrito et al. 2011, {@link martialArt.PUNCH}).
   */
  export const karatePunches: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["karatePunches"]
  > = AutoMovieMotionHumanActionRow.of("karatePunches", martialArt, {
    kind: "chokuZuki",
  });

  /**
   * The push of tai chi. Four phases of 3 s each (step in, push, weight back,
   * foot back): 12 s, the slow form ({@link martialArt.PUSH}, provisional; Wu
   * and Hitt 2005).
   */
  export const taiChiPush: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["taiChiPush"]
  > = AutoMovieMotionHumanActionRow.of("taiChiPush", martialArt, {
    kind: "taiChiPush",
  });

  /**
   * Dribbling a basketball. Four bounces by default at 2 a second, a 2 s
   * dribble ({@link ballSport.BOUNCES}, provisional).
   */
  export const dribble: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["dribble"]
  > = AutoMovieMotionHumanActionRow.of("dribble", ballSport, {
    kind: "dribble",
  });

  /** A volleyball dig on the forearms. */
  export const volleyDig: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["volleyDig"]
  > = AutoMovieMotionHumanActionRow.of("volleyDig", ballSport, {
    kind: "dig",
  });

  /** A volleyball set overhead. */
  export const volleySet: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["volleySet"]
  > = AutoMovieMotionHumanActionRow.of("volleySet", ballSport, {
    kind: "set",
  });

  /** A football throw-in. */
  export const throwIn: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["throwIn"]
  > = AutoMovieMotionHumanActionRow.of("throwIn", ballSport, {
    kind: "throwIn",
  });

  /**
   * A catcher's crouch behind the plate. Into the position in 0.8 s, held 1 s
   * by default (`seconds`) and back in 0.8 s; provisional
   * ({@link IAutoMovieMotionHumanBaseball}).
   */
  export const catcherCrouch: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["catcherCrouch"]
  > = AutoMovieMotionHumanActionRow.of("catcherCrouch", baseball, {
    kind: "catcherCrouch",
  });

  /**
   * Fielding a ground ball. Into the position in 0.8 s, held 1 s by default
   * (`seconds`) and back in 0.8 s; provisional
   * ({@link IAutoMovieMotionHumanBaseball}).
   */
  export const fieldGrounder: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["fieldGrounder"]
  > = AutoMovieMotionHumanActionRow.of("fieldGrounder", baseball, {
    kind: "groundBall",
  });

  /**
   * A batter's stance. Into the position in 0.8 s, held 1 s by default
   * (`seconds`) and back in 0.8 s; provisional
   * ({@link IAutoMovieMotionHumanBaseball}).
   */
  export const battingStance: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["battingStance"]
  > = AutoMovieMotionHumanActionRow.of("battingStance", baseball, {
    kind: "battingStance",
  });

  /**
   * The ready position of tennis and badminton. Into the position in 0.6 s, the
   * hop or waggle, held 0.6 s by default (`seconds`) and back in 0.6 s
   * ({@link IAutoMovieMotionHumanRacket}).
   */
  export const readyPosition: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["readyPosition"]
  > = AutoMovieMotionHumanActionRow.of("readyPosition", racket, {
    kind: "readyPosition",
  });

  /**
   * The split step before a return. Into the position in 0.6 s, the hop or
   * waggle, held 0.6 s by default (`seconds`) and back in 0.6 s
   * ({@link IAutoMovieMotionHumanRacket}).
   */
  export const splitStep: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["splitStep"]
  > = AutoMovieMotionHumanActionRow.of("splitStep", racket, {
    kind: "splitStep",
  });

  /**
   * Addressing the ball in golf. Into the position in 0.6 s, the hop or waggle,
   * held 0.6 s by default (`seconds`) and back in 0.6 s
   * ({@link IAutoMovieMotionHumanRacket}).
   */
  export const golfAddress: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["golfAddress"]
  > = AutoMovieMotionHumanActionRow.of("golfAddress", racket, {
    kind: "golfAddress",
  });

  /**
   * A two-step shuffle to the left in the fighting stance: the `step` law
   * carrying a boxing or kickboxing guard, a boxer's footwork and not a low
   * basketball stance. It is a row of the lexicon (`HUMAN_LEXICON.sport`) and
   * belongs to no family namespace. Two steps of 0.35 s each, about three a
   * second, each half a stance long ({@link IAutoMovieMotionHumanStep}).
   */
  export const defensiveSlide: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["defensiveSlide"]
  > = AutoMovieMotionHumanActionRow.of("defensiveSlide", step, {
    direction: "left",
    steps: 2,
  });

  /** The chair pose of yoga: a partial squat held five seconds (provisional). */
  export const chairPose: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["chairPose"]
  > = AutoMovieMotionHumanActionRow.of("chairPose", crouch, {
    depth: "partial",
    hold: 5,
  });

  /**
   * The child's pose of yoga: kneeling, sat back on the heels, ten seconds
   * (provisional).
   */
  export const childsPose: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["childsPose"]
  > = AutoMovieMotionHumanActionRow.of("childsPose", kneel, {
    kind: "sitBack",
    hold: 10,
  });

  /** A hip flexor stretch in the half kneel, twenty seconds (provisional). */
  export const hipFlexorStretch: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["hipFlexorStretch"]
  > = AutoMovieMotionHumanActionRow.of("hipFlexorStretch", kneel, {
    kind: "one",
    hold: 20,
  });

  /** The corpse pose of yoga: lying on the back, ten seconds (provisional). */
  export const corpsePose: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["corpsePose"]
  > = AutoMovieMotionHumanActionRow.of("corpsePose", lieDown, {
    kind: "supine",
    hold: 10,
  });

  /**
   * A standing hamstring stretch: a bend down to the right foot, held twenty
   * seconds (provisional).
   */
  export const toeTouch: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["toeTouch"]
  > = AutoMovieMotionHumanActionRow.of("toeTouch", bend, {
    target: { kind: "self", region: "footTopRight" },
    hold: 20,
  });

  /**
   * Treading water. Cycles of 1 s, 3 by default: 3 s, in place
   * ({@link swim.CYCLE}).
   */
  export const treadWater: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["treadWater"]
  > = AutoMovieMotionHumanActionRow.of("treadWater", swim, {
    kind: "treadWater",
  });

  /**
   * Swimming the front crawl. Cycles of 1.4 s, 3 by default: 4.2 s, gliding at
   * 1 m/s ({@link swim.CYCLE}).
   */
  export const frontCrawl: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["frontCrawl"]
  > = AutoMovieMotionHumanActionRow.of("frontCrawl", swim, {
    kind: "frontCrawl",
  });

  /**
   * Swimming the breaststroke. Glides at 0.9 m/s, 3 cycles by default
   * ({@link SwimStroke.strokes}, provisional).
   */
  export const breaststroke: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["breaststroke"]
  > = AutoMovieMotionHumanActionRow.of("breaststroke", swim, {
    kind: "breaststroke",
  });

  /**
   * Swimming the backstroke, head first the way the back faced. Cycles of 1.4
   * s, 3 by default: 4.2 s, travelling at 1 m/s head first
   * ({@link SwimStroke.strokes}, provisional).
   */
  export const backstroke: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["backstroke"]
  > = AutoMovieMotionHumanActionRow.of("backstroke", swim, {
    kind: "backstroke",
  });

  /**
   * Floating on the back. Held on the back at rest with no travel
   * ({@link SwimStroke.strokes}).
   */
  export const floating: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["floating"]
  > = AutoMovieMotionHumanActionRow.of("floating", swim, {
    kind: "float",
  });
}
