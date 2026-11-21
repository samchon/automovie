import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanMounted,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanPerformance, HumanSignature } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../internal/assertTakeClean";
import { equineFordRider } from "../internal/equineFordRider";
import { equineLeadOut } from "../internal/equineLeadOut";
import { motionHumanBody } from "../internal/motionHumanBody";

/** The contact tolerance of the seated rider specs, metres. */
const TOLERANCE: number = 0.01;

/** How far a foot lifted out of its stirrup has left it: the ankle joint more than this from the stirrup's tread, metres, an authored bound beyond an ankle's height over a tread it stands on. */
const STIRRUP: number = 0.15;

/** The rider's head region kept over the water: the head bone's centre at least this far above it, metres, an authored margin for the jaw below the head joint. */
const HEAD: number = 0.12;

/**
 * A rider stays seated on a horse through a ford and a swimming crossing, then dismounts on the far bank and leads the horse out.
 *
 * Scenarios:
 * 1. While wading and climbing, the rider's seat socket stays within 10 mm of the saddle's seat, the left wrist holds the mane (within 0.7 hand lengths of it, slipping less than 10 mm, the vault spec's handle criterion) and the right palm stays within 10 mm of its rein's skin. While the horse swims, the seat and both holds stay, each ankle is more than 0.15 m from its stirrup's tread, and the head bone's centre is at least 0.12 m above the water. The figures change on the crossing's float and land seconds.
 * 2. At the halt on the dry top of the far bank the rider dismounts with the rise, walks to the horse's head and leads it out 6 m; through the lead's held interval the right palm stays within 10 mm of the lead rope's skin.
 * 3. The take passes the shipped take verdicts: no tangle, jump, turn, reversal, skate, floor or unloaded fault.
 * The far bank's unreachable shelf is refused by the crossing itself, pinned by test_archetype_equine_ford; the floating crossing belongs to test_archetype_equine_ford_float.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the scenarios and bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the mounted, rise, walk and lead laws on the public crossing and reads the displayed seat, palms, feet and head against the horse's moving saddle, mane, reins, lead, stirrups and the authored water; a rider left behind at a cut, a hand off its hold or a submerged head fails.
 * @evidence contracts/development/testing.md#independent-expectations The 10 mm tolerance is the seated rider specs'; contacts are the horse's own affordances on the posed horse; the water is the stage's authored height.
 * @evidence contracts/development/testing.md#distinguishing-cases Wading, swimming and climbing figures on one clock, the dismount and the lead-out; the horse's own crossing belongs to test_archetype_equine_ford.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name.
 */
export function test_archetype_equine_ford_rider(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-tall");
  const rehearsed: equineFordRider.IStage = equineFordRider.stage();
  const { float, land, halt } = rehearsed;
  const figures: IAutoMovieMotionHumanMounted.IFigure[] = [
    equineFordRider.wading(rehearsed),
    {
      seat: "entered",
      transfer: 0.6,
      seconds: land - float - 0.6,
      supports: equineFordRider.SWIMMING,
    },
    {
      seat: "entered",
      transfer: 0.6,
      seconds: halt - land - 0.6,
      supports: equineFordRider.WADING,
    },
  ];
  const rope: IAutoMovieVector3 = rehearsed.part("lead", halt).translation;
  const stand: equineLeadOut.IStanding = equineLeadOut.standing(body, rope.y);
  const approach: IAutoMovieVector3 = {
    x: rope.x + stand.lateral,
    y: 0,
    z: rope.z + stand.forward,
  };
  const chain = (staged: equineFordRider.IStage): IAutoMovieMotionHumanChain =>
    equineFordRider
      .mount(staged, figures)
      .rise({})
      .walk({ to: approach, face: 0 })
      .walk({ to: { ...approach, z: approach.z + equineLeadOut.LENGTH } });
  const rehearsal: HumanPerformance = equineFordRider.perform(
    rehearsed,
    body,
    chain(rehearsed),
  );
  const walking: IAutoMovieMotionHumanSegment = rehearsal
    .segments("rider")
    .at(-1)!;
  const span: number = walking.end - walking.start;
  const staged: equineFordRider.IStage = equineFordRider.stage(
    equineLeadOut.led(rehearsed, rehearsal, walking),
  );
  const film: HumanPerformance = equineFordRider.perform(
    staged,
    body,
    chain(staged).over(
      (hand: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
        hand.registered("leadHorse", {
          on: "horse",
          side: "right",
          seconds: 0.79 * span,
          transition: 0.1 * span,
        }),
    ),
  );
  const issues: string[] = [];

  // 1. Seated through the crossing.
  const reader: ReturnType<typeof HumanSignature.of> = HumanSignature.of(
    film,
    "rider",
    body,
    0,
  );
  let grasped: IAutoMovieVector3 | undefined;
  const instants: readonly [number, string][] = [
    [float - 1.5, "wading"],
    [(float + land) / 2, "swimming"],
    [land - 1, "swimming"],
    [land + 1.5, "climbing"],
    [halt - 1, "climbing"],
  ];
  for (const [at, phase] of instants) {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      film.bones("rider", at);
    const saddle: IAutoMovieTransform = staged.part("seat", at);
    const seat: number = Math.abs(
      Quaternion.rotateVector(
        Quaternion.inverse(saddle.rotation),
        Vector3.subtract(
          HumanSignature.region(reader, "seat", at),
          saddle.translation,
        ),
      ).y,
    );
    if (!(seat <= TOLERANCE))
      issues.push(
        `${phase} ${at.toFixed(2)}: seat ${(seat * 1000).toFixed(1)} mm from the saddle`,
      );
    // The mane is held as the vault spec holds a handle: the wrist within 0.7 hand lengths of it, not slipping.
    const mane: IAutoMovieTransform = staged.part("mane", at);
    const wrist: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(mane.rotation),
      Vector3.subtract(bones.get("leftHand")!.worldPosition, mane.translation),
    );
    grasped ??= wrist;
    const slip: number =
      Vector3.length(wrist) > 0.7 * body.measure.hand
        ? Infinity
        : Vector3.distance(wrist, grasped);
    if (!(slip <= TOLERANCE))
      issues.push(`${phase} ${at.toFixed(2)}: left hand ${slip} m off the mane`);
    const held: number = equineFordRider.rein(
      body,
      bones,
      "right",
      staged.part("rightRein", at),
      equineFordRider.affordance(staged, "rightRein"),
    );
    if (!(held <= TOLERANCE))
      issues.push(
        `${phase} ${at.toFixed(2)}: right palm ${(held * 1000).toFixed(1)} mm from rightRein`,
      );
    if (phase !== "swimming") continue;
    for (const side of ["left", "right"] as const) {
      const foot: number = Vector3.distance(
        bones.get(`${side}Foot`)!.worldPosition,
        staged.part(`${side}Stirrup`, at).translation,
      );
      if (!(foot > STIRRUP))
        issues.push(
          `${phase} ${at.toFixed(2)}: the ${side} foot stays ${foot} m from its stirrup`,
        );
    }
    const head: number =
      bones.get("head")!.worldPosition.y - equineFordRider.WATER;
    if (!(head >= HEAD))
      issues.push(
        `${phase} ${at.toFixed(2)}: head only ${head} m above the water`,
      );
  }

  // 2. The lead held through its interval.
  const lead: IAutoMovieMotionHumanSegment = film.overlays("rider")[0]!;
  const window: IAutoMovieMotionHumanContactWindow = lead.plan.contacts.find(
    (contact: IAutoMovieMotionHumanContactWindow): boolean =>
      contact.part === "rightHand",
  )!;
  const duration: number = lead.end - lead.start;
  for (let i: number = 0; i <= 12; i++) {
    const at: number =
      lead.start +
      duration * (window.from + ((window.to - window.from) * i) / 12);
    const miss: number = equineFordRider.rein(
      body,
      film.bones("rider", at),
      "right",
      staged.part("lead", at),
      equineFordRider.affordance(staged, "lead"),
    );
    if (!(miss <= TOLERANCE))
      issues.push(
        `lead ${at.toFixed(2)}: right palm ${(miss * 1000).toFixed(1)} mm from the lead`,
      );
  }
  TestValidator.equals(
    "the rider crosses seated with the head out of the water and leads the horse out",
    issues,
    [],
  );

  // 3. The take's verdicts.
  assertTakeClean("the seated crossing and lead-out", film);
}
