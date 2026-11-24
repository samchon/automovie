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
import { type HumanPerformance, HumanSignature } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { equineFordRider } from "../../../features/internal/equineFordRider";
import { equineLeadOut } from "../../../features/internal/equineLeadOut";
import { equineRiderContacts } from "../../../features/internal/equineRiderContacts";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** Metres led on foot: the handler take's lead-in. */
const LEAD: number = 3;

/** The contact tolerance of the seated rider specs, metres. */
const TOLERANCE: number = 0.01;

/**
 * A rider climbs a far bank's exit mounted, dismounts on the dry top and leads the horse out.
 *
 * Scenarios:
 * 1. Up the exit and on the dry top, the rider's seat socket stays within 10 mm of the saddle's seat, the left wrist holds the mane (within 0.7 hand lengths of it, slipping less than 10 mm, the vault spec's handle criterion) and the right palm stays within 10 mm of its rein's skin.
 * 2. At the halt the rider dismounts with the rise, walks to the horse's head and leads it out 3 m; through the lead's held interval the right palm stays within 10 mm of the lead rope's skin.
 * 3. The take passes the shipped take verdicts: no tangle, jump, turn, reversal, skate, floor or unloaded fault.
 * The crossing that reaches the exit belongs to test_archetype_equine_ford_rider; dismounting and leading on level ground to test_motion_equestrian_lifecycle.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the scenarios and bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the mounted, rise, walk and lead laws over the public horse ride up the authored exit and reads the displayed seat and palms against the horse's moving saddle, mane, rein and lead; a rider left behind on the climb or a hand off its hold fails.
 * @evidence contracts/development/testing.md#independent-expectations The 10 mm tolerance is the seated rider specs'; contacts are the horse's own affordances on the posed horse.
 * @evidence contracts/development/testing.md#distinguishing-cases The mounted climb, the dismount on the top and the lead-out on one clock.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name.
 */
export function test_motion_mount_equine_ford_leadout(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-tall");
  const rehearsed: equineFordRider.IMount = equineLeadOut.stage();
  const { halt } = rehearsed;
  const figures: IAutoMovieMotionHumanMounted.IFigure[] = [
    {
      seat: "entered",
      transfer: 0.4,
      hold: halt - equineFordRider.settled(rehearsed, body) - 0.4,
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
  const chain = (staged: equineFordRider.IMount): IAutoMovieMotionHumanChain =>
    equineFordRider
      .mount(staged, figures)
      .rise({})
      .walk({ to: approach, face: 0 })
      .walk({ to: { ...approach, z: approach.z + LEAD } });
  const rehearsal: HumanPerformance = equineFordRider.perform(
    rehearsed,
    body,
    chain(rehearsed),
  );
  const walking: IAutoMovieMotionHumanSegment = rehearsal
    .segments("rider")
    .at(-1)!;
  const span: number = walking.end - walking.start;
  const staged: equineFordRider.IMount = equineLeadOut.stage(
    equineLeadOut.led(rehearsed, rehearsal, walking),
  );
  const film: HumanPerformance = equineFordRider.perform(
    staged,
    body,
    chain(staged).over(
      (hand: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
        hand.registered("leadHorse", {
          on: "horse",
          hand: "right",
          duration: 0.79 * span,
          transition: 0.1 * span,
        }),
    ),
  );
  const issues: string[] = [];

  // 1. Seated up the exit and on the top.
  const reader: ReturnType<typeof HumanSignature.of> = HumanSignature.of(
    film,
    "rider",
    body,
    0,
  );
  let grasped: IAutoMovieVector3 | undefined;
  for (const at of [
    equineFordRider.WAIT + 2,
    equineFordRider.WAIT + 4,
    halt - 0.5,
  ]) {
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
        `climb ${at.toFixed(2)}: seat ${(seat * 1000).toFixed(1)} mm from the saddle`,
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
      issues.push(`climb ${at.toFixed(2)}: left hand ${slip} m off the mane`);
    const held: number = equineRiderContacts.rein(
      body,
      bones,
      "right",
      staged.part("rightRein", at),
      equineFordRider.affordance(staged, "rightRein"),
    );
    if (!(held <= TOLERANCE))
      issues.push(
        `climb ${at.toFixed(2)}: right palm ${(held * 1000).toFixed(1)} mm from rightRein`,
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
    const miss: number = equineRiderContacts.rein(
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
    "the rider climbs out mounted, dismounts and leads the horse out",
    issues,
    [],
  );

  // 3. The take's verdicts.
  assertTakeClean("the far-bank lead-out", film);
}
