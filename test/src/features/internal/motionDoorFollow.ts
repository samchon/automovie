import { createCar, createDoor } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  type HumanSegment,
  HumanSignature,
  HumanTravelLeaf,
  HumanVerdicts,
  type IHumanBody,
  type IHumanProp,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "./motionHumanBody";

/**
 * A person pulls a door open past the arm's reach and steps with it, on
 * one body and one door, which the
 * `test_human_motion_travel_door_follow_{house,car}_*` specs read one body
 * and one door each (#3520).
 *
 * Two doors, each swung by the scene on a minimum-jerk profile from half a
 * second after the start, the person holding the handle from the start:
 * - a mid-band right-hinged door with a pull bar, swung to 90 degrees over
 *   6 s, the person on its pull side a quarter of a metre beside the bar's
 *   line toward the latch and 0.45 m from the door, facing it, holding for
 *   7 s;
 * - a mid-band sedan's driver door, swung to its stop (the archetype's own
 *   travel) over 4 s, the person facing the car with the right shoulder
 *   before the handle, out along its outward normal as far as puts the
 *   shoulder at 0.8 of the arm's reach from it, holding for 5 s.
 *
 * Scenarios, for each door:
 * 1. The opening plans, and the person walks with the leaf (the plan's
 *    feet leave the floor at least once), since the swing carries the
 *    handle past what the arm holds from where the person stood.
 * 2. From when the hand has arrived, read eight times a second, the wrist
 *    keeps its place in the handle's own frame within 5 mm of where it
 *    took it (the campaign's bound): the hand goes with the handle.
 * 3. The shipped verdicts read no foot sliding, lifting or sinking while
 *    planted (the campaign's 5 mm bounds): every step's foot is planted.
 * And, for the house door only:
 * 4. The same swing in 0.5 s, faster than steps can follow, is refused as
 *    a `reach` refusal on `handle` whose feasible range names a largest
 *    swing followed between 0 and 90 degrees.
 *
 * @param name The body.
 * @param which The door: `house` or `car`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two doors, the stage and the 4 scenarios with their bounds.
 * @evidence contracts/development/implementation.md#principled-implementation Real door and car archetypes whose leaves the scene swings by their own articulation; the readings are the displayed wrist and soles against the handle's own frame and the plan's declared plants.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One stage per door, one reading per scenario, gathered as complaints and asserted once.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A door that does not plan is a complaint with the refusal's words.
 * @evidence contracts/development/implementation.md#efficient-algorithms One opening, and for the house door one refusal, read eight times a second.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by each body's and door's spec, so the readings exist once.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing past the call.
 */
export function motionDoorFollow(
  name: motionHumanBody.Name,
  which: "house" | "car",
): void {
  const body: IHumanBody = motionHumanBody(name);
  const complaints: string[] = [];
  const OPEN: number = 0.5;
  const placement: IAutoMovieTransform = {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
  const swung =
    (degrees: number, over: number): ((seconds: number) => number) =>
    (seconds: number): number => {
      const u: number = Math.min(1, Math.max(0, (seconds - OPEN) / over));
      return degrees * (10 * u ** 3 - 15 * u ** 4 + 6 * u ** 5);
    };
  const span = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Vector3.length(Vector3.subtract(a, b));

  /** One door: the prop, where its handle is at a second, and where the person stands. */
  interface IStage {
    label: string;
    prop: IHumanProp;
    handle: string;
    at: (seconds: number) => IAutoMovieTransform;
    stand: { at: IAutoMovieVector3; yaw: number };
    seconds: number;
  }
  const perform = (stage: IStage): HumanPerformance =>
    new HumanPerformance({
      seed: "door",
      laws: [HumanTravelLeaf.openDoor],
      props: [stage.prop],
      performers: [
        {
          subject: "a",
          body,
          at: stage.stand.at,
          yaw: stage.stand.yaw,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a").registered("openDoor", {
        door: "door",
        handle: stage.handle,
        seconds: stage.seconds,
      }).node,
    });

  // The house door, pulled to 90 degrees.
  const door: ReturnType<typeof createDoor> = createDoor({
    hinge: "right",
    hardware: "plate",
  });
  const bar: IAutoMovieVector3 = door.placed("pull", placement).translation;
  const house = (over: number): IStage => ({
    label: "the house door",
    prop: HumanObject.prop(
      "door",
      door,
      { at: { x: 0, y: 0, z: 0 }, yaw: 0 },
      undefined,
      (id: string, seconds: number): IAutoMovieTransform =>
        door
          .articulate({ hinge: swung(90, over)(seconds) })
          .placed(id as Parameters<typeof door.placed>[0], placement),
    ),
    handle: "pull",
    at: (seconds: number): IAutoMovieTransform =>
      door
        .articulate({ hinge: swung(90, over)(seconds) })
        .placed("pull", placement),
    stand: {
      at: { x: bar.x + (bar.x > 0 ? 0.25 : -0.25), y: 0, z: 0.45 },
      yaw: 180,
    },
    seconds: over + 1,
  });

  // The car's driver door, pulled to its stop.
  const sedan = (): IStage => {
    const car: ReturnType<typeof createCar> = createCar({ kind: "sedan" });
    const stop: number = car.affordance("driverDoor").travel!;
    const rest: IAutoMovieTransform = car.placed("driverDoorHandle", placement);
    // An affordance's +Y points out of the contact.
    const out: IAutoMovieVector3 = Quaternion.rotateVector(rest.rotation, {
      x: 0,
      y: 1,
      z: 0,
    });
    const level: IAutoMovieVector3 = Vector3.normalize({
      x: out.x,
      y: 0,
      z: out.z,
    });
    // Facing the car, the right shoulder before the handle, as far out as
    // puts the shoulder at 0.8 of the arm's reach from it.
    const facing: number = (Math.atan2(-level.x, -level.z) * 180) / Math.PI;
    const right: IAutoMovieVector3 = Vector3.scale(
      {
        x: -Math.cos((facing * Math.PI) / 180),
        y: 0,
        z: Math.sin((facing * Math.PI) / 180),
      },
      body.measure.shoulderHalfWidth,
    );
    const reach: number =
      0.8 *
      HumanTravelLeaf.REACH *
      (body.measure.upperArm + body.measure.forearm);
    const rise: number = body.measure.shoulderHeight - rest.translation.y;
    const away: number = Math.sqrt(Math.max(0.0025, reach ** 2 - rise ** 2));
    return {
      label: "the car's driver door",
      prop: HumanObject.prop(
        "door",
        car,
        { at: { x: 0, y: 0, z: 0 }, yaw: 0 },
        undefined,
        (id: string, seconds: number): IAutoMovieTransform =>
          car
            .articulate({ driverDoor: swung(stop, 4)(seconds) })
            .placed(id as Parameters<typeof car.placed>[0], placement),
      ),
      handle: "driverDoorHandle",
      at: (seconds: number): IAutoMovieTransform =>
        car
          .articulate({ driverDoor: swung(stop, 4)(seconds) })
          .placed("driverDoorHandle", placement),
      stand: {
        at: {
          x: rest.translation.x + away * level.x - right.x,
          y: 0,
          z: rest.translation.z + away * level.z - right.z,
        },
        yaw: facing,
      },
      seconds: 5,
    };
  };

  const stage: IStage = which === "house" ? house(6) : sedan();
  let performance: HumanPerformance | null = null;
  try {
    performance = perform(stage);
  } catch (error) {
    complaints.push(
      `${name}: ${stage.label}: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (performance !== null) {
    const reader: HumanSignature.IReader = HumanSignature.of(
      performance,
      "a",
      body,
      stage.stand.yaw,
    );
    const hold: HumanSegment.ISegment = performance.segments("a")[0]!;

    // 1. It steps.
    const plants = hold.plan.contacts.filter(
      (c): boolean =>
        c.kind === "plant" && (c.part === "leftFoot" || c.part === "rightFoot"),
    );
    if (plants.length <= 2)
      complaints.push(
        `${name}: ${stage.label}: the person never steps (${plants.length} foot plants)`,
      );

    // 2. The wrist keeps its place on the handle.
    const local = (t: number): IAutoMovieVector3 => {
      const frame: IAutoMovieTransform = stage.at(t);
      const turn: IAutoMovieQuaternion = Quaternion.inverse(frame.rotation);
      return Quaternion.rotateVector(
        turn,
        Vector3.subtract(
          HumanSignature.bones(reader, t).get("rightHand")!.worldPosition,
          frame.translation,
        ),
      );
    };
    const taken: number = hold.entryTime + HumanTravelLeaf.TAKE + 0.01;
    const first: IAutoMovieVector3 = local(taken);
    let drift: number = 0;
    let worst: number = taken;
    for (const t of HumanSignature.times(taken, hold.end - 0.01, 8)) {
      const off: number = span(local(t), first);
      if (off > drift) {
        drift = off;
        worst = t;
      }
    }
    if (drift > 0.005)
      complaints.push(
        `${name}: ${stage.label}: the wrist moves ${(drift * 1000).toFixed(1)} mm in the handle's frame by ${worst.toFixed(2)} s, within 5 mm expected`,
      );

    // 3. The feet keep the floor: the shipped verdicts read no foot slide,
    // lift or sink.
    for (const finding of HumanVerdicts.of(performance).findings.filter(
      (f: HumanVerdicts.IFinding): boolean =>
        (f.check === "slip" || f.check === "lift" || f.check === "floor") &&
        /Foot|Toes/.test(f.where),
    ))
      complaints.push(
        `${name}: ${stage.label}: ${finding.check} ${(finding.value * 1000).toFixed(1)} mm at ${finding.seconds.toFixed(2)} s (${finding.where}), within ${(finding.limit * 1000).toFixed(0)} mm expected`,
      );
  }

  // 4. A swing too fast to follow, for the house door.
  if (which === "house") {
    let thrown: unknown = null;
    try {
      perform(house(0.5));
    } catch (error) {
      thrown = error;
    }
    const followed: number | null =
      thrown instanceof HumanRefusal &&
      thrown.feasible !== null &&
      thrown.feasible !== undefined &&
      thrown.feasible.kind === "range"
        ? (thrown.feasible.maximum ?? null)
        : null;
    if (
      !(
        thrown instanceof HumanRefusal &&
        thrown.kind === "reach" &&
        thrown.axis === "handle" &&
        followed !== null &&
        followed > 0 &&
        followed < 90
      )
    )
      complaints.push(
        `${name}: a door swung 90 degrees in 0.5 s: expected a reach refusal on handle naming the largest swing followed, got ${thrown instanceof Error ? thrown.message : String(thrown)}`,
      );
  }

  TestValidator.equals(
    `a pulled ${which} door is followed by stepping (${name})`,
    complaints,
    [],
  );
}
