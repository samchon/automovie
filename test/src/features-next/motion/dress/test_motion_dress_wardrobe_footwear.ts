import {
  type AutoMovieArchetype,
  createSeat,
  createStageFootwear,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanObject, HumanPerformance } from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { wardrobeFilm } from "../../../features/internal/wardrobeFilm";

/** One labelled case of the specification. */
type WardrobeCase = readonly [
  string,
  (checks: motionComplaints.IGatherer) => void,
];

/** A shoe and a sock on two casts and opposite feet. */
const CASES: readonly WardrobeCase[] = [
  [
    "shoe, m-average",
    (checks: motionComplaints.IGatherer): void =>
      footwear(checks, "m-average", "right", "shoe"),
  ],
  [
    "sock, f-small",
    (checks: motionComplaints.IGatherer): void =>
      footwear(checks, "f-small", "left", "sock"),
  ],
];

/**
 * Seated footwear moves one prop identity between hand, foot and set.
 *
 * Scenarios:
 *
 * 1. A seated performer gets footwear onto the raised foot with the opposite hand,
 *    stands with it, and puts it down after a reverse pass; the heel and toe
 *    pass into the opening and back out, and the take is clean.
 * 2. Two different actors and opposite feet exercise the chair support and fit,
 *    and the footwear keeps its pose across each custody change.
 *
 * Each case and each of its checks gathers its own result, so a failing check
 * hides no later one. The pickUp's grasp is `test_motion_action_pick_up`'s.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the shoe and sock and their actual custody frames.
 * @evidence contracts/development/testing.md#behavioral-verification Runs installed HumanPerformance, registered motion and concrete archetype producers for the complete exchange.
 * @evidence contracts/development/testing.md#independent-expectations Converts the displayed foot geometry through the posed model, independently of a stored target pose.
 * @evidence contracts/development/testing.md#distinguishing-cases Two casts, opposite feet, the worn and released frames; the jacket and the refusal are test_motion_dress_wardrobe_custody's.
 * @evidence contracts/development/testing.md#execution-ownership The focused public-entry feature test owns its performers, models and in-memory scene.
 */
export function test_motion_dress_wardrobe_footwear(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const [label, run] of CASES) {
    try {
      run(checks);
    } catch (error: unknown) {
      checks.check(
        label + ": " + (error instanceof Error ? error.message : String(error)),
        false,
      );
    }
  }
  checks.assert("footwear geometry and custody paths");
}
/**
 * Change independently sized footwear while preserving the chair and opposite
 * foot.
 */
function footwear(
  checks: motionComplaints.IGatherer,
  cast: motionHumanBody.Name,
  side: AutoMovieHumanSide,
  kind: createStageFootwear.Kind,
): void {
  // The opposite hand pulls the footwear on: in the seated lean the raised
  // thigh lies under the same-side shoulder, so that arm would pass through it.
  const hand: AutoMovieHumanSide = side === "right" ? "left" : "right";
  const sign: number = hand === "left" ? 1 : -1;
  const body: IAutoMovieMotionHumanBody = motionHumanBody(cast);
  const model: AutoMovieArchetype<
    createStageFootwear.Affordance,
    createStageFootwear.Dimension
  > = createStageFootwear({
    id: "footwear",
    kind,
    length: 0.34,
    width: 0.15,
    height: 0.045,
  });
  const chair: AutoMovieArchetype<createSeat.Affordance, createSeat.Dimension> =
    createSeat({
      kind: "office",
      seatHeight: cast === "f-small" ? 0.39 : 0.43,
    });
  const chairAt: IAutoMovieRigidTransform = wardrobeFilm.placement(0, 0, -0.25);
  const touch: IAutoMovieRigidTransform = wardrobeFilm.placement(
    sign * 0.34,
    0.73,
    0.25,
  );
  const performance: HumanPerformance = wardrobeFilm.stage(
    body,
    [
      HumanObject.prop("footwear", model, touch),
      HumanObject.prop("chair", chair, chairAt),
    ],
    HumanChain.subject("actor")
      .pickUp({ prop: "footwear", handle: "hold", hand, lift: 0.04 })
      .sit({ seat: HumanObject.seat(chair, chairAt), hold: 0.8 })
      .registered("wardrobe", {
        kind: "footwearOn",
        prop: "footwear",
        side,
        hand,
      })
      .rise({})
      .stand({ hold: 0.35 })
      .sit({ seat: HumanObject.seat(chair, chairAt), hold: 0.8 })
      .registered("wardrobe", {
        kind: "footwearOff",
        prop: "footwear",
        side,
        hand,
      })
      .rise({})
      // The table top lies below the standing arm of the smaller cast (her
      // shoulder stands higher above it than her arm is long): bend to it.
      .bend({
        target: { kind: "point", at: touch.position, frame: "world" },
        hand: hand,
      })
      .until({ event: "deepest" })
      .putDown({ prop: "footwear", to: touch.position, hand }).node,
  );
  const label: string = `${kind}, ${cast}`;
  gather(checks, label, (): void => assertTakeClean(label, performance));
  const segments: readonly IAutoMovieMotionHumanSegment[] =
    performance.segments("actor");
  const forward: IAutoMovieMotionHumanSegment = wardrobeFilm.withEvent(
    segments,
    "footwearWorn",
  );
  const reverse: IAutoMovieMotionHumanSegment = wardrobeFilm.withEvent(
    segments,
    "footwearClear",
  );
  const opening: IAutoMovieAffordance = model.affordance("opening");
  const footInOpening: (time: number) => IAutoMovieVector3[] = (
    time: number,
  ): IAutoMovieVector3[] => {
    const sockets: IAutoMovieMotionHumanFoot.ISocket[] = HumanFoot.sockets(
      body,
      performance.bones("actor", time),
      side,
    );
    return [sockets[0]!, sockets[2]!].map(
      ({ point }: IAutoMovieMotionHumanFoot.ISocket): IAutoMovieVector3 =>
        wardrobeFilm.localSite(
          performance.prop("footwear", time),
          opening,
          point,
        ),
    );
  };
  const before: number = wardrobeFilm.mark(forward, "footwearReady");
  const on: number = wardrobeFilm.mark(forward, "footwearWorn");
  const done: number = wardrobeFilm.mark(reverse, "footwearClear");
  const handover: number = wardrobeFilm.mark(reverse, "footwearReady");
  for (const boundary of [on, handover]) {
    const before: IAutoMovieRigidTransform = performance.prop(
      "footwear",
      boundary - 0.001,
    );
    const after: IAutoMovieRigidTransform = performance.prop(
      "footwear",
      boundary + 0.001,
    );
    checks.check(
      `${label}: footwear keeps its pose across custody at ${boundary.toFixed(3)} s`,
      Vector3.distance(before.position, after.position) < 0.002 &&
        Quaternion.angle(before.rotation, after.rotation) < 0.005,
    );
  }
  const entering: IAutoMovieVector3[] = footInOpening(before);
  const fitted: IAutoMovieVector3[] = footInOpening(on);
  const leaving: IAutoMovieVector3[] = footInOpening(done);
  const mouth: IAutoMovieVector3[] = footInOpening(
    wardrobeFilm.mark(forward, "footwearOpening"),
  );
  checks.check(
    `${label}: the real heel and toe pass into the opening and back out ` +
      JSON.stringify({ entering, fitted, leaving, mouth }),
    entering.every((p: IAutoMovieVector3): boolean => p.z > 0.01) &&
      fitted.every((p: IAutoMovieVector3): boolean => p.z < -0.015) &&
      leaving.every((p: IAutoMovieVector3): boolean => p.z > 0.01) &&
      mouth.every(
        (p: IAutoMovieVector3): boolean =>
          Math.abs(p.z) < 0.015 &&
          Math.abs(p.x) < opening.width! / 2 &&
          p.y > 0 &&
          p.y < opening.height!,
      ),
  );
  const foot: AutoMovieHumanoidBone =
    side === "left" ? "leftFoot" : "rightFoot";
  const worn: IAutoMovieRigidTransform = wardrobeFilm.relative(
    performance,
    "footwear",
    foot,
    on + 0.003,
  );
  const raised: IAutoMovieRigidTransform = wardrobeFilm.relative(
    performance,
    "footwear",
    foot,
    reverse.start - 0.05,
  );
  checks.check(
    `${label}: the same footwear follows the foot through stand and seat`,
    Vector3.distance(worn.position, raised.position) < 0.001 &&
      Quaternion.angle(worn.rotation, raised.rotation) < 1e-4,
  );
  gather(checks, label, (): void =>
    wardrobeFilm.setDown(performance, "footwear", touch.position),
  );
}

/** Run a throwing check, gathering its failure under the case's label. */
function gather(
  checks: motionComplaints.IGatherer,
  label: string,
  run: () => void,
): void {
  try {
    run();
  } catch (error: unknown) {
    checks.check(
      `${label}: ${error instanceof Error ? error.message : String(error)}`,
      false,
    );
  }
}
