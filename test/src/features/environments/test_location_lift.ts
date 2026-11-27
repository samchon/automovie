import type { AutoMovieEnvironment } from "@automovie/archetypes/environments";
import { AutoMovieEngineFilm, Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanSegment,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanFoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { nclose } from "../internal/nclose";
import { vclose } from "../internal/vclose";
import { environmentLiftActor } from "./environmentLiftActor";
import { environmentLiftFixture } from "./environmentLiftFixture";

/**
 * The same geometry and clip frames locate the lift, both doors and the rider.
 *
 * Scenarios:
 *
 * 1. Call a fixed landing station, cross into the docked cab, turn about in the
 *    cab, ride its vertical track, and land on the upper floor.
 * 2. Inspect both doors during travel, and inspect a different authored rise and
 *    the unchanging call stations and unsupported crossing times.
 *
 * The scene's timing is staging: the cab leaves after its rider has walked in
 * and turned about, a walk whose honest length (its step turns taken a footfall
 * at a time) sets the schedule, and every check samples the travel at the same
 * share of it (the ride at 70 % of the travel, the doors at its half and half a
 * second after the upper doors open).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the authored choreography, the movement consumers and the negative schedule cases.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public environment and transfer producer, native HumanPerformance plans and actual poses, and the engine's baked object motion frames.
 * @evidence contracts/development/testing.md#independent-expectations Expected sill heights and midpoint travel come from explicit fixture dimensions. The choreography's ownership comes from its independently named stage props, and the expected resting contact is the upper sill plane.
 * @evidence contracts/development/testing.md#distinguishing-cases Closed dock versus absent cab, different floor spacing, separated landing and moving panels, and both entered and exited sole ownership distinguish geometry, state and moving support.
 * @evidence contracts/development/testing.md#execution-ownership One named synchronous test exercises reused product motion and clip seams. The issued production capture owns image verification.
 */
export function test_location_lift(): void {
  const fixture: ReturnType<typeof environmentLiftFixture> =
    environmentLiftFixture();
  const { film, actor }: ReturnType<typeof environmentLiftActor> =
    environmentLiftActor(fixture);
  const cab: string = `${fixture.id}/cab`;
  const at = (node: string, time: number): IAutoMovieTransform =>
    AutoMovieEngineFilm.bakedTransformFromClipsAt(
      fixture.environment.runtime.objectMotions,
      node,
      time,
    )!;
  const calls: IAutoMovieMotionHumanSegment[] = film
    .overlays(actor.node)
    .filter(
      (segment: IAutoMovieMotionHumanSegment): boolean =>
        segment.law.name === "touch",
    );
  const steps: IAutoMovieMotionHumanSegment[] = film
    .segments(actor.node)
    .filter(
      (segment: IAutoMovieMotionHumanSegment): boolean =>
        segment.law.name === "liftDockTransfer",
    );
  TestValidator.predicate(
    "one call and two transfers occur",
    calls.length === 1 && steps.length === 2,
  );
  TestValidator.predicate(
    "both entry feet finish on the cab and both exit feet on the upper landing",
    steps.every(
      (segment: IAutoMovieMotionHumanSegment, index: number): boolean => {
        const end: typeof segment.plan.contacts = segment.plan.contacts.filter(
          (window): boolean => window.to === 1,
        );
        return (
          end.length === 2 &&
          end.every(
            (window): boolean =>
              window.support.kind === "prop" &&
              window.support.subject ===
                (index === 0 ? cab : `${fixture.id}/stops/upper/landing`),
          )
        );
      },
    ),
  );
  const body: ReturnType<typeof motionHumanBody> = motionHumanBody("m-average");
  const soles = (time: number): IAutoMovieVector3[] => {
    const bones: ReturnType<typeof film.bones> = film.bones(actor.node, time);
    return (["left", "right"] as const).flatMap((side: "left" | "right") =>
      HumanFoot.sockets(body, bones, side).map(
        (socket): IAutoMovieVector3 => socket.point,
      ),
    );
  };
  // The cab leaves the ground at the schedule's first closed key there,
  // arrives at its first upper key and opens at its first open one; the
  // rider steps out over the exit's 2 s crossing from that opening.
  const schedule: readonly AutoMovieEnvironment.IAutoMovieEnvironmentLiftKey[] =
    fixture.schedule;
  const leaves: number = schedule.find(
    (key: AutoMovieEnvironment.IAutoMovieEnvironmentLiftKey): boolean =>
      key.stop === "ground" && key.doors === "closed" && key.seconds > 0,
  )!.seconds;
  const arrives: number = schedule.find(
    (key: AutoMovieEnvironment.IAutoMovieEnvironmentLiftKey): boolean =>
      key.stop === "upper",
  )!.seconds;
  const opens: number = schedule.find(
    (key: AutoMovieEnvironment.IAutoMovieEnvironmentLiftKey): boolean =>
      key.stop === "upper" && key.doors === "open",
  )!.seconds;
  const rideTime: number = leaves + 0.7 * (arrives - leaves);
  const halfway: number = leaves + 0.5 * (arrives - leaves);
  const opened: number = opens + 0.5;
  const rising: IAutoMovieVector3[] = soles(rideTime);
  const landed: IAutoMovieVector3[] = soles(opens + 2 + 0.2);
  TestValidator.predicate(
    "the rider rises with the closed cab and stands on the named destination",
    nclose(at(cab, rideTime).translation.y, 2.38) &&
      rising.every(
        (point): boolean => nclose(point.y, 2.38, 0.007) && point.z < 0,
      ) &&
      nclose(Math.min(...landed.map((point): number => point.y)), 3.4, 0.007) &&
      landed.every((point): boolean => point.z > 0.055),
  );
  TestValidator.predicate(
    "the moving leaf is closed during travel and the left landing leaf stays on its own floor",
    vclose(at(`${cab}/leftDoor`, halfway).translation, {
      x: 0,
      y: 1.7,
      z: 0,
    }) &&
      vclose(
        at(`${fixture.id}/stops/upper/doors/leftDoor`, halfway).translation,
        {
          x: 0,
          y: 3.4,
          z: 0.055,
        },
      ) &&
      at(`${fixture.id}/stops/upper/doors/leftDoor`, opened).translation.x >
        0.5,
  );
  const callId: string = `${fixture.id}/stops/ground/call`;
  const plate: ReturnType<typeof film.prop> = film.prop(callId, halfway);
  const button = fixture.environment.runtime.props.find(
    (prop): boolean => prop.node === callId,
  )!.model.affordances![0]!;
  TestValidator.predicate(
    "the call anchor stays on its fixed plate while the cab moves",
    vclose(
      Vector3.add(
        plate.position,
        Quaternion.rotateVector(plate.rotation, button.frame.translation),
      ),
      fixture.environment.anchors["lift/ground/call"]!.translation,
    ),
  );
  const taller: ReturnType<typeof environmentLiftFixture> =
    environmentLiftFixture(4.1);
  TestValidator.predicate(
    "another authored rise changes the sill, with the travelling cab at unit scale",
    nclose(taller.environment.anchors["lift/upper"]!.translation.y, 4.1) &&
      vclose(
        AutoMovieEngineFilm.bakedTransformFromClipsAt(
          taller.environment.runtime.objectMotions,
          cab,
          halfway,
        )!.scale,
        { x: 1, y: 1, z: 1 },
      ),
  );
  // Leaving while the cab travels, or docked with its doors still opening.
  for (const start of [halfway, (arrives + opens) / 2]) {
    let diagnosed: boolean = false;
    try {
      fixture.lift.transfer({
        id: fixture.id,
        stop: "upper",
        direction: "exit",
        start,
        seconds: 1.3,
        lead: "left",
      });
    } catch (error) {
      diagnosed =
        error instanceof Error &&
        error.message.includes("upper") &&
        error.message.includes("docked");
    }
    TestValidator.predicate(`stop is refused at ${start}s`, diagnosed);
  }
  let overlapping: boolean = false;
  try {
    environmentLiftFixture(1.5);
  } catch (error) {
    overlapping =
      error instanceof Error && error.message.includes("between sills");
  }
  TestValidator.predicate(
    "two landing openings cannot overlap vertically",
    overlapping,
  );
}
