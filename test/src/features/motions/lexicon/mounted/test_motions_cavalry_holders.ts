import { AutoMovieArchetypeHorse } from "@automovie/archetypes";
import { AutoMovieComposition, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanMount,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../internal/assertTakeClean";
import { motionHumanBody } from "../../../internal/motionHumanBody";

/** The horse producer's model. */
type Horse = ReturnType<typeof AutoMovieArchetypeHorse.create>;

/**
 * Metres between the two held horses' heads, either side of the holder: an
 * authored staging choice.
 */
const PAIR: number = 1.1;

/** Seconds the holder stands holding. */
const HOLD: number = 8;

/**
 * In dismounted action a horse holder stands between two troopers' horses and
 * holds one lead in each hand while the others go forward on foot.
 *
 * Scenarios:
 *
 * 1. Each hand holds its horse's lead through the hold.
 * 2. The holder's take passes the shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the holder, the two horses and the two scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Composes a standing holder with one `leadHorse` overlay per hand on two real parked horses and reads the displayed hands and lead frames.
 * @evidence contracts/development/testing.md#independent-expectations A held lead lies in its hand within the lead law's 10 mm grip bound, which the law measures from the displayed hand against the parked horse's actual lead frame at every read.
 * @evidence contracts/development/testing.md#distinguishing-cases The left and the right hand on different horses. A led walk and its out-of-reach refusal are pinned by test_motions_mounted_reset.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU-only feature spec through the public performance path.
 */
export function test_motions_cavalry_holders(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const horse: Horse = AutoMovieArchetypeHorse.create({ withersHeight: 1.62, tempo: 0 }, 1029);
  const parked: (x: number) => IAutoMovieRigidTransform = (
    x: number,
  ): IAutoMovieRigidTransform => ({
    position: { x, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  });
  const lead: (x: number) => IAutoMovieVector3 = (
    x: number,
  ): IAutoMovieVector3 => {
    const frame: IAutoMovieTransform = horse.affordance("lead").frame;
    return Vector3.add(frame.translation, { x, y: 0, z: 0 });
  };
  const film: HumanPerformance = new HumanPerformance({
    seed: "holders",
    performers: [
      {
        subject: "holder",
        body,
        at: { x: lead(0).x, y: 0, z: lead(0).z - 0.35 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    laws: [AutoMovieMotionHumanMount.leadHorse],
    props: [
      HumanObject.prop("left", horse, parked(PAIR / 2)),
      HumanObject.prop("right", horse, parked(-PAIR / 2)),
    ],
    composition: AutoMovieComposition.parallel(
      HumanChain.subject("holder")
        .stand({ hold: HOLD })
        .over((holder) =>
          holder
            .registered("leadHorse", {
              on: "left",
              hand: "left",
              duration: HOLD - 1,
              transition: 0.5,
            })
            .registered("leadHorse", {
              on: "right",
              hand: "right",
              duration: HOLD - 1,
              transition: 0.5,
            }),
        ).node,
    ),
  });
  assertTakeClean("horse holder", film);
  const overlays: readonly IAutoMovieMotionHumanSegment[] =
    film.overlays("holder");
  let missed: string = "none";
  for (const overlay of overlays)
    for (
      let at: number = overlay.start + 0.6;
      at <= overlay.end && missed === "none";
      at += 0.25
    )
      try {
        film.bones("holder", at);
      } catch (error) {
        missed = `${at.toFixed(2)} s: ${error instanceof Error ? error.message : String(error)}`;
      }
  TestValidator.predicate(
    `each hand holds its horse's lead within the lead law's 10 mm grip through the hold: ${missed}`,
    overlays.length === 2 && missed === "none",
  );
}
