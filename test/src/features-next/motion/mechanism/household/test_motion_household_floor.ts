import { type AutoMovieArchetype, createLongTool } from "@automovie/archetypes";
import { Quaternion, Vector3, physicalShapeSpan } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanObject } from "@automovie/motions";
import { HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { householdFilm } from "../../../../features/internal/householdFilm";
import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { motionHumanLaw } from "../../../../features/internal/motionHumanLaw";

/** Bound for a rigid grasp or a resting object's anchored position, metres. */
const GRIP: number = 0.001;

/** Working surface and fit allowance, metres. */
const CONTACT: number = 0.01;

/** The world frame's vertical unit vector. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/**
 * A mop keeps its own scene identity while one performer pushes it across
 * the floor with both hands on its shaft and parks it.
 *
 * Scenarios, on the canonical average man and small woman:
 * 1. The mop travels forward more than 20 cm during the push.
 * 2. At five instants of the gripped stroke, its face stays at the floor,
 *    its head never enters the floor and each hand keeps its own shaft mark.
 * 3. Seeking out of order across the shared release leaves the mop's
 *    position and attitude unchanged, resting on its face.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the workflow, the sampled instants, the release seeks and the bodies.
 * @evidence contracts/development/testing.md#behavioral-verification Resolves the public chain and measures the displayed mop frame, head shape and both hand grip frames; a mop that stays put, lifts off or sinks, hands that merge or leave their marks, or a parked mop that moves fails.
 * @evidence contracts/development/testing.md#independent-expectations The level floor, the modeled face, head and shaft marks and the 10 mm working and 1 mm rigid bounds give the expectations.
 * @evidence contracts/development/testing.md#distinguishing-cases The working stroke, the release instant from both sides and the parked rest on two body sizes; the kitchen and laundry workflows own their own specifications.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory performance on canonical bodies through the public chain, without a capture host.
 */
export function test_motion_household_floor(): void {
  const failures: string[] = [];
  for (const fit of ["m-average", "f-small"] as const) {
    try {
      mopFloor(motionHumanBody(fit), failures);
    } catch (error: unknown) {
      failures.push(
        `${fit} floor: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  TestValidator.equals("complete floor workflow", failures, []);
}

/** Push a real floor-contact head forward and release both hands at the park. */
function mopFloor(body: IAutoMovieMotionHumanBody, failures: string[]): void {
  const mop: AutoMovieArchetype<
    createLongTool.Affordance,
    createLongTool.Dimension
  > = createLongTool({ kind: "mop" });
  const start: IAutoMovieVector3 = { x: 0, y: 0, z: 0.41 };
  const film: motionHumanLaw.IFilm = householdFilm.stage(
    body,
    HumanChain.subject("a")
      .pushPull({
        prop: "mop",
        way: "push",
        left: "upperGrip",
        right: "lowerGrip",
        load: "light",
        to: { x: 0, y: 0, z: 0.38 },
      })
      .stand({ hold: 0.35 }),
    [HumanObject.prop("mop", mop, { at: start, yaw: 0 })],
  );
  const work: IAutoMovieMotionHumanSegment = film.performance.segments("a")[0]!;
  const gripped: number = householdFilm.events(film, "pushPull").gripped!;
  const parked: IAutoMovieRigidTransform = film.performance.prop(
    "mop",
    film.duration,
  );
  const head: IAutoMoviePhysicalShape = mop
    .shapes()
    .find((item: IAutoMoviePhysicalShape): boolean => item.id === "head")!;
  if (!(parked.position.z > start.z + 0.2))
    failures.push("the floor tool travels forward in the pass");
  for (const u of [0.2, 0.4, 0.6, 0.8, 1]) {
    const t: number = gripped + (work.end - 1e-5 - gripped) * u;
    const pose: IAutoMovieRigidTransform = film.performance.prop("mop", t);
    const tip: IAutoMovieVector3 = householdFilm.point(
      pose,
      mop.site("face").translation,
    );
    householdFilm.near(
      failures,
      "mop face at floor during the pass",
      Math.abs(tip.y),
      CONTACT,
    );
    householdFilm.near(
      failures,
      "mop head does not enter the floor",
      -physicalShapeSpan(pose, head, UP)[0],
      CONTACT,
    );
    const hands: motionHumanLaw.Bones = film.bones("a", t);
    const left: IAutoMovieVector3 = HumanHand.frame(
      body,
      hands,
      "left",
      "grip",
    ).point;
    const right: IAutoMovieVector3 = HumanHand.frame(
      body,
      hands,
      "right",
      "grip",
    ).point;
    if (!(Vector3.distance(left, right) > body.measure.hand / 2))
      failures.push("the two hands keep distinct sites on the same mop shaft");
    householdFilm.near(
      failures,
      "mop left hand at upper shaft mark",
      Vector3.distance(
        left,
        householdFilm.point(pose, mop.site("upperGrip").translation),
      ),
      CONTACT,
    );
    householdFilm.near(
      failures,
      "mop right hand at lower shaft mark",
      Vector3.distance(
        right,
        householdFilm.point(pose, mop.site("lowerGrip").translation),
      ),
      CONTACT,
    );
  }

  // Seek out of order around both grip windows' shared endpoint.
  for (const t of [work.end + 1e-5, work.end, work.end - 1e-5]) {
    const released: IAutoMovieRigidTransform = film.performance.prop("mop", t);
    householdFilm.near(
      failures,
      "the mop stays where the two grips release",
      Vector3.distance(parked.position, released.position),
      GRIP,
    );
    if (!(Quaternion.angle(parked.rotation, released.rotation) <= 1e-4))
      failures.push(
        "the mop does not change its attitude as the two grips release",
      );
  }
  householdFilm.near(
    failures,
    "the parked mop rests on its face",
    Math.abs(householdFilm.point(parked, mop.site("face").translation).y),
    CONTACT,
  );
}
