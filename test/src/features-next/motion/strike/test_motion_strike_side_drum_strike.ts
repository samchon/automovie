import { createDrumstick, createInstrument } from "@automovie/archetypes/music";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanInstrument,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * A solo side-drum stroke lands on the authored beat and rebounds.
 *
 * Scenarios:
 * 1. After picking up the stick with the right hand, align the stroke to a
 *    cue at 4 s. At that film second the displayed bead's lowest point and
 *    the displayed face each meet the drumhead center within 15 mm.
 * 2. The displayed bead clears the head by 30 mm 120 ms before and after
 *    impact, and both readings resolve against the same fixed drum.
 * 3. The same stage refuses a stroke called for the empty left hand.
 * 4. Both a time-dependent head point and an articulation reader with no
 *    rigidity declaration are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the stage, cue, geometry bounds and the wrong-hand case.
 * @evidence contracts/development/testing.md#behavioral-verification A staged pick-up and registered stroke go through the public chain, cue scheduler and displayed prop frames.
 * @evidence contracts/development/testing.md#independent-expectations Uses the authored cue time, the model's head and face and the visible bead's sphere support point, rather than planner offsets or event-derived sample times.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks impact clearance, ownership of the stick, and refusal of time-dependent or undeclared-rigidity head geometry.
 * @evidence contracts/development/testing.md#execution-ownership Uses one ordinary polygon body and in-memory scenes through the test runner.
 */
export function test_motion_strike_side_drum_strike(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const stick: ReturnType<typeof createDrumstick> = createDrumstick();
  const drum: ReturnType<typeof createInstrument> = createInstrument({
    kind: "sideDrum",
  });
  const head: IAutoMovieVector3 = drum.affordance("head").frame.translation;
  const face: IAutoMovieVector3 = stick.affordance("face").frame.translation;
  const bead: IAutoMovieModelPart | undefined = stick.parts.find(
    (part: IAutoMovieModelPart): boolean => part.id === "bead",
  );
  if (
    bead?.geometry.type !== "primitive" ||
    bead.geometry.shape.type !== "sphere" ||
    bead.transform === null
  )
    throw new Error("The scenic stick needs its visible spherical bead");
  const beadCenter: IAutoMovieVector3 = bead.transform.translation;
  const beadRadius: number = bead.geometry.shape.radius;
  const beat: number = 4;
  const stage = (
    hand: "left" | "right",
    point?: IAutoMovieMotionHumanProp["point"],
  ): IAutoMovieMotionHumanPerformance =>
    new HumanPerformance({
      seed: "side drum",
      laws: [AutoMovieMotionHumanInstrument.sideDrumStrike],
      cues: { score: [{ name: "beat", seconds: beat }] },
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      props: [
        HumanObject.prop("stick", stick, {
          position: {
            x: -0.2,
            y: body.measure.shoulderHeight - body.measure.upperArm - 0.15,
            z: 0.3,
          },
          rotation: Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
        }),
        {
          ...HumanObject.prop("drum", drum, {
            at: { x: -0.2, y: 0.85 - head.y, z: 0.61 },
            yaw: 0,
            fixed: true,
          }),
          ...(point === undefined ? {} : { point }),
        },
      ],
      composition: HumanChain.subject("a")
        .stand({ hold: 0.3 })
        .pickUp({
          prop: "stick",
          hand: "right",
          handle: "grip",
          use: { tip: "face", line: "square" },
        })
        .registered(AutoMovieMotionHumanInstrument.sideDrumStrike.name, {
          hand,
          stick: "stick",
          drum: "drum",
        })
        .sync({ of: "score", event: "beat", align: "contact1" }).node,
    });
  const film: IAutoMovieMotionHumanPerformance = stage("right");
  const stroke: IAutoMovieMotionHumanSegment = film
    .segments("a")
    .find(
      (s: IAutoMovieMotionHumanSegment): boolean =>
        s.name === AutoMovieMotionHumanInstrument.sideDrumStrike.name,
    )!;
  TestValidator.predicate(
    "the decisive instant falls on the authored beat",
    Math.abs(stroke.start + (stroke.plan.contact ?? NaN) - beat) <= 1e-8,
  );
  const world = (
    subject: string,
    point: IAutoMovieVector3,
    seconds: number,
  ): IAutoMovieVector3 => {
    const frame: IAutoMovieRigidTransform = film.prop(subject, seconds);
    return Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, point),
    );
  };
  const bottom = (seconds: number): IAutoMovieVector3 =>
    Vector3.subtract(world("stick", beadCenter, seconds), {
      x: 0,
      y: beadRadius,
      z: 0,
    });
  const on: IAutoMovieVector3 = world("drum", head, beat);
  for (const at of [bottom(beat), world("stick", face, beat)]) {
    const error: number = Vector3.length(Vector3.subtract(at, on));
    TestValidator.predicate(
      `the displayed stick meets the head within 15 mm (${(error * 1000).toFixed(1)} mm)`,
      error <= 0.015,
    );
  }
  for (const t of [beat - 0.12, beat + 0.12]) {
    const clearance: number = bottom(t).y - world("drum", head, t).y;
    TestValidator.predicate(
      `the bead is clear at ${t} s (${(clearance * 1000).toFixed(1)} mm)`,
      clearance >= 0.03,
    );
  }
  let refused: boolean = false;
  try {
    stage("left");
  } catch (error) {
    if (!(error instanceof HumanRefusal)) throw error;
    refused = error.kind === "affordance" && error.axis === "prop";
  }
  TestValidator.predicate(
    "the called hand must already hold the stick",
    refused,
  );

  refused = false;
  try {
    stage("right", (id, seconds) =>
      id === "head" && seconds >= beat
        ? {
            point: Vector3.add(head, { x: 0, y: 0.03, z: 0 }),
            normal: { x: 0, y: 1, z: 0 },
          }
        : undefined,
    );
  } catch (error) {
    if (!(error instanceof HumanRefusal)) throw error;
    refused = error.kind === "affordance" && error.axis === "drum";
  }
  TestValidator.predicate("the head must remain fixed through impact", refused);

  refused = false;
  try {
    AutoMovieMotionHumanInstrument.sideDrumStrike.plan({
      ...stroke.context,
      params: { hand: "right", stick: "stick", drum: "drum" },
      prop: (subject) => {
        const read = stroke.context.prop(subject);
        return subject === "drum"
          ? {
              ...read,
              prop: {
                ...read.prop,
                hasArticulations: undefined,
                articulate: () => ({ affordances: drum.affordances }),
              },
            }
          : read;
      },
    });
  } catch (error) {
    if (!(error instanceof HumanRefusal)) throw error;
    refused = error.kind === "affordance" && error.axis === "drum";
  }
  TestValidator.predicate(
    "a drum with a pose reader needs an explicit rigid declaration",
    refused,
  );
}
