import { bend } from "../everyday/bend";
import { crouch } from "../everyday/crouch";
import { kneel } from "../everyday/kneel";
import { dance } from "../exercise/dance";
import { exercise } from "../exercise/exercise";
import { stretch } from "../exercise/stretch";
import { lieDown } from "../floor/lieDown";
import { HumanActionRow } from "../law/HumanActionRow";
import { athletics } from "../sport/athletics";
import { ballSport } from "../sport/ballSport";
import { baseball } from "../sport/baseball";
import { gymnastics } from "../sport/gymnastics";
import { martialArt } from "../sport/martialArt";
import { racket } from "../sport/racket";
import { swim } from "../sport/swim";
import { step } from "../striking/step";

/**
 * Sport, exercise, stretching and dance under the names a screenplay uses,
 * each a row of the shipped law that plans it with its kind fixed. A row
 * leaves open what its law leaves open (a side, a count, a hold, a manner).
 * Register the ones a film uses.
 *
 * `HumanDrill` already names `squats`, `jumpingJacks` and `sway`; they are
 * not repeated here.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row is, what it leaves open and which rows another family names.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped action (`HumanActionRow`), so it is data over a law that already fits the body, refuses and is checked.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One row per shipped kind that has a common name; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own or fixes a value beyond the kind.
 */
export namespace HumanSport {
  /** Walking-free lunges in place. */
  export const lunges = HumanActionRow.of("lunges", exercise, {
    kind: "lunge",
  });

  /** High knees, running in place. */
  export const highKnees = HumanActionRow.of("highKnees", exercise, {
    kind: "highKnees",
  });

  /** A neck stretch to the side. */
  export const neckStretch = HumanActionRow.of("neckStretch", stretch, {
    kind: "neckSide",
  });

  /** A shoulder stretch, the arm drawn across the chest. */
  export const shoulderStretch = HumanActionRow.of("shoulderStretch", stretch, {
    kind: "crossBody",
  });

  /** A side stretch, the arm overhead. */
  export const sideStretch = HumanActionRow.of("sideStretch", stretch, {
    kind: "overheadSide",
  });

  /** A standing quadriceps stretch, the heel drawn to the seat. */
  export const quadStretch = HumanActionRow.of("quadStretch", stretch, {
    kind: "quadriceps",
  });

  /** The tree pose of yoga. */
  export const treePose = HumanActionRow.of("treePose", stretch, {
    kind: "tree",
  });

  /** A bounce to the beat. */
  export const bounce = HumanActionRow.of("bounce", dance, { kind: "bounce" });

  /** A step-touch to the beat. */
  export const stepTouch = HumanActionRow.of("stepTouch", dance, {
    kind: "stepTouch",
  });

  /** The set position of a sprint start. */
  export const sprintStart = HumanActionRow.of("sprintStart", athletics, {});

  /** A handstand. */
  export const handstand = HumanActionRow.of("handstand", gymnastics, {});

  /** The horse stance of karate and kung fu. */
  export const horseStance = HumanActionRow.of("horseStance", martialArt, {
    kind: "horseStance",
  });

  /** Straight punches from the horse stance (choku-zuki). */
  export const karatePunches = HumanActionRow.of("karatePunches", martialArt, {
    kind: "chokuZuki",
  });

  /** The push of tai chi. */
  export const taiChiPush = HumanActionRow.of("taiChiPush", martialArt, {
    kind: "taiChiPush",
  });

  /** Dribbling a basketball. */
  export const dribble = HumanActionRow.of("dribble", ballSport, {
    kind: "dribble",
  });

  /** A volleyball dig on the forearms. */
  export const volleyDig = HumanActionRow.of("volleyDig", ballSport, {
    kind: "dig",
  });

  /** A volleyball set overhead. */
  export const volleySet = HumanActionRow.of("volleySet", ballSport, {
    kind: "set",
  });

  /** A football throw-in. */
  export const throwIn = HumanActionRow.of("throwIn", ballSport, {
    kind: "throwIn",
  });

  /** A catcher's crouch behind the plate. */
  export const catcherCrouch = HumanActionRow.of("catcherCrouch", baseball, {
    kind: "catcherCrouch",
  });

  /** Fielding a ground ball. */
  export const fieldGrounder = HumanActionRow.of("fieldGrounder", baseball, {
    kind: "groundBall",
  });

  /** A batter's stance. */
  export const battingStance = HumanActionRow.of("battingStance", baseball, {
    kind: "battingStance",
  });

  /** The ready position of tennis and badminton. */
  export const readyPosition = HumanActionRow.of("readyPosition", racket, {
    kind: "readyPosition",
  });

  /** The split step before a return. */
  export const splitStep = HumanActionRow.of("splitStep", racket, {
    kind: "splitStep",
  });

  /** Addressing the ball in golf. */
  export const golfAddress = HumanActionRow.of("golfAddress", racket, {
    kind: "golfAddress",
  });

  /** A basketball defensive slide: two steps to the left, the stance kept. */
  export const defensiveSlide = HumanActionRow.of("defensiveSlide", step, {
    direction: "left",
    steps: 2,
  });

  /** The chair pose of yoga: a partial squat held five seconds (provisional). */
  export const chairPose = HumanActionRow.of("chairPose", crouch, {
    depth: "partial",
    hold: 5,
  });

  /** The child's pose of yoga: kneeling, sat back on the heels, ten seconds (provisional). */
  export const childsPose = HumanActionRow.of("childsPose", kneel, {
    kind: "sitBack",
    hold: 10,
  });

  /** A hip flexor stretch in the half kneel, twenty seconds (provisional). */
  export const hipFlexorStretch = HumanActionRow.of("hipFlexorStretch", kneel, {
    kind: "one",
    hold: 20,
  });

  /** The corpse pose of yoga: lying on the back, ten seconds (provisional). */
  export const corpsePose = HumanActionRow.of("corpsePose", lieDown, {
    position: "supine",
    hold: 10,
  });

  /** A standing hamstring stretch: a bend down to the right foot, held twenty seconds (provisional). */
  export const toeTouch = HumanActionRow.of("toeTouch", bend, {
    toward: { kind: "self", region: "footTopRight" },
    hold: 20,
  });

  /** Treading water. */
  export const treadWater = HumanActionRow.of("treadWater", swim, {
    kind: "treadWater",
  });

  /** Swimming the front crawl. */
  export const frontCrawl = HumanActionRow.of("frontCrawl", swim, {
    kind: "frontCrawl",
  });
}
