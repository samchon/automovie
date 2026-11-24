import { createNecklace } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanObject, HumanPerformance } from "@automovie/motions";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionActionUnit } from "../../internal/motionActionUnit";
import { placeOverHeadScene } from "../../internal/placeOverHeadScene";

/**
 * Instants the ride is read at over the film, the original's two shares and
 * more between them.
 */
const SAMPLES: number = 24;

/**
 * A loop worn on the upper chest rides it rigidly as its wearer sits and rises,
 * on its own: check 3 of `test_motion_get_dressed_place_over_head` ("the worn
 * loop keeps its offset on the partner's upper chest as the partner rises"),
 * for the small woman and the average man as partners, entered with the loop
 * worn on the sternum region's bone from the film's start
 * (`IAutoMovieMotionHumanProp.worn`) instead of the placing before it, so the
 * custody through the rise is read whatever the placing does.
 *
 * Scenarios:
 *
 * 1. Through the partner's sit and rise the loop's place in the sternum bone's
 *    displayed frame changes by at most 1 mm.
 * 2. The rise keeps the shipped bounds over its own span.
 *
 * The original reads the ride only after a placing; that placing is
 * `test_motion_get_dressed_place_over_head_front`'s and `_behind`'s.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original's check it decomposes, the entry by a worn prop, the bodies and the bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed loop in the partner's displayed sternum bone at 25 instants of the sit and the rise and the verdict report over the rise's span; a loop sliding on the chest, left behind or a finding in the rise fails.
 * @evidence contracts/development/testing.md#independent-expectations A worn prop is rigid on its bone within 1 mm, the dressing specifications' bound, as the original.
 * @evidence contracts/development/testing.md#distinguishing-cases Two partners of opposite stature; the custody begun by the placing is the integration copy's.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain, entered through `test_motion_get_dressed_place_over_head_worn_rise`.
 */
export function test_motion_get_dressed_place_over_head_worn_rise(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const partner of ["f-small", "m-average"] as const)
    try {
      ride(checks, partner, motionHumanBody(partner));
    } catch (error: unknown) {
      checks.check(
        `${partner}: ${error instanceof Error ? error.message : String(error)}`,
        false,
      );
    }
  checks.assert("a worn loop rides its wearer through a sit and a rise");
}

/** One partner's sit and rise wearing the loop, and its checks. */
function ride(
  checks: motionComplaints.IGatherer,
  label: string,
  b: IAutoMovieMotionHumanBody,
): void {
  const bone: AutoMovieHumanoidBone = b.surfaces.regions.sternum.bone;
  const film: HumanPerformance = new HumanPerformance({
    seed: "place-over-head",
    performers: [
      {
        subject: "b",
        body: b,
        at: { x: 0, y: 0, z: placeOverHeadScene.place(b, "front") },
        yaw: 180,
        proficiency: { level: "trained" },
      },
    ],
    props: [
      {
        ...HumanObject.prop(
          "loop",
          createNecklace({ id: "loop", kind: "ribbon" }),
          placeOverHeadScene.stand("front"),
        ),
        worn: {
          subject: "b",
          bone,
          offset: {
            position: { x: 0, y: 0, z: 0 },
            rotation: Quaternion.identity(),
          },
        },
      },
    ],
    composition: HumanChain.subject("b")
      .sit({ seat: placeOverHeadScene.seat(b, "front"), hold: 2 })
      .rise({}).node,
  });
  const first: IAutoMovieVector3 = placeOverHeadScene.local(
    film.prop("loop", 0),
    film.bones("b", 0).get(bone)!,
  );
  let drift: number = 0;
  for (let i: number = 1; i <= SAMPLES; ++i) {
    const t: number = (film.duration * i) / SAMPLES;
    drift = Math.max(
      drift,
      Vector3.distance(
        placeOverHeadScene.local(
          film.prop("loop", t),
          film.bones("b", t).get(bone)!,
        ),
        first,
      ),
    );
  }
  checks.check(
    `${label}: the worn loop rides the partner through the sit and the rise (${(drift * 1000).toFixed(2)} mm)`,
    drift <= placeOverHeadScene.RIGID,
  );
  const rise: IAutoMovieMotionHumanSegment = motionActionUnit.segment(
    film,
    "b",
    "rise",
  );
  motionActionUnit.bounds(checks, label, film, "b", rise);
}
