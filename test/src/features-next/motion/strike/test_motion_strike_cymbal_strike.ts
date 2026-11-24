import { createCymbal, createDrumstick } from "@automovie/archetypes/music";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
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
import { nclose } from "../../../features/internal/nclose";
import { vclose } from "../../../features/internal/vclose";

/**
 * A picked-up drumstick hits the mounted cymbal's near edge and rebounds.
 *
 * Scenarios:
 * 1. The named edge lies on the plate's top rim and the bell rises above it.
 * 2. The displayed bead's bottom reaches the edge at the authored cue,
 *    within one bead radius.
 * 3. The same bead clears the edge on the approach and rebound.
 * 4. An articulation reader with no rigidity declaration is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the staged geometry, held prop, cue, contact bound and expected rebound.
 * @evidence contracts/development/testing.md#behavioral-verification Stages the public archetypes, registers the strike, syncs a public chain and reads the displayed prop frames.
 * @evidence contracts/development/testing.md#independent-expectations Derives contact geometry from the visible plate and bead, and samples at an authored cue and offsets measured in video frames.
 * @evidence contracts/development/testing.md#distinguishing-cases Compares a raised central bell, a rim impact and clearance on both sides of the cue, and refusal when a pose reader leaves rigidity undeclared.
 * @evidence contracts/development/testing.md#execution-ownership Uses one polygon performer and an in-memory performance with three display samples.
 */
export function test_motion_strike_cymbal_strike(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const stick: ReturnType<typeof createDrumstick> = createDrumstick();
  const cymbal: ReturnType<typeof createCymbal> = createCymbal();
  const edge: IAutoMovieVector3 = cymbal.affordance("edge").frame.translation;
  const bell: IAutoMovieVector3 = cymbal.affordance("bell").frame.translation;
  const plate: IAutoMovieModelPart | undefined = cymbal.parts.find(
    (part: IAutoMovieModelPart): boolean => part.id === "plate",
  );
  const bead: IAutoMovieModelPart | undefined = stick.parts.find(
    (part: IAutoMovieModelPart): boolean => part.id === "bead",
  );
  if (
    plate?.geometry.type !== "primitive" ||
    plate.geometry.shape.type !== "cylinder" ||
    plate.transform === null ||
    bead?.geometry.type !== "primitive" ||
    bead.geometry.shape.type !== "sphere" ||
    bead.transform === null
  )
    throw new Error("The stage needs the visible plate and spherical bead");

  const rim: IAutoMovieVector3 = Vector3.add(plate.transform.translation, {
    x: 0,
    y: plate.geometry.shape.height / 2,
    z: -plate.geometry.shape.radius,
  });
  TestValidator.predicate(
    "the named edge is on the visible rim",
    vclose(edge, rim),
  );
  TestValidator.predicate(
    "the named bell rises above the center of the plate",
    nclose(bell.x, plate.transform.translation.x) &&
      nclose(bell.z, plate.transform.translation.z) &&
      bell.y > edge.y,
  );

  const beat: number = 4;
  const film: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "cymbal strike",
    laws: [AutoMovieMotionHumanInstrument.cymbalStrike],
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
      HumanObject.prop("cymbal", cymbal, {
        at: { x: -0.2, y: 0, z: 0.61 - edge.z },
        yaw: 0,
        fixed: true,
      }),
    ],
    composition: HumanChain.subject("a")
      .stand({ hold: 0.3 })
      .pickUp({
        prop: "stick",
        hand: "right",
        handle: "grip",
        use: { tip: "face", line: "square" },
      })
      .registered(AutoMovieMotionHumanInstrument.cymbalStrike.name, {
        hand: "right",
        stick: "stick",
        cymbal: "cymbal",
      })
      .sync({ of: "score", event: "beat", align: "contact1" }).node,
  });

  const stroke: IAutoMovieMotionHumanSegment | undefined = film
    .segments("a")
    .find(
      (segment: IAutoMovieMotionHumanSegment): boolean =>
        segment.name === AutoMovieMotionHumanInstrument.cymbalStrike.name,
    );
  TestValidator.predicate(
    "the decisive instant falls on the authored beat",
    stroke !== undefined &&
      nclose(stroke.start + (stroke.plan.contact ?? NaN), beat),
  );

  if (stroke === undefined) throw new Error("The staged strike was not placed");
  let refused: boolean = false;
  try {
    AutoMovieMotionHumanInstrument.cymbalStrike.plan({
      ...stroke.context,
      params: { hand: "right", stick: "stick", cymbal: "cymbal" },
      prop: (subject) => {
        const read = stroke.context.prop(subject);
        return subject === "cymbal"
          ? {
              ...read,
              prop: {
                ...read.prop,
                hasArticulations: undefined,
                articulate: () => ({ affordances: cymbal.affordances }),
              },
            }
          : read;
      },
    });
  } catch (error) {
    if (!(error instanceof HumanRefusal)) throw error;
    refused = error.kind === "affordance" && error.axis === "cymbal";
  }
  TestValidator.predicate(
    "a cymbal with a pose reader needs an explicit rigid declaration",
    refused,
  );

  const beadRadius: number = bead.geometry.shape.radius;
  const beadCenter: IAutoMovieVector3 = bead.transform.translation;
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

  const on: IAutoMovieVector3 = world("cymbal", rim, beat);
  const error: number = Vector3.length(Vector3.subtract(bottom(beat), on));
  TestValidator.predicate(
    `the bead meets the visible rim within one bead radius (${(error * 1000).toFixed(1)} mm)`,
    error <= beadRadius,
  );

  // Four frames at the RITMO recording's 30 fps give distinct views on
  // either side of the cue. The spacing is a sampling choice.
  const sampleOffset: number = 4 / 30;
  for (const sample of [beat - sampleOffset, beat + sampleOffset]) {
    const clearance: number = bottom(sample).y - world("cymbal", rim, sample).y;
    TestValidator.predicate(
      `the bead clears the rim at ${sample} s (${(clearance * 1000).toFixed(1)} mm)`,
      clearance > beadRadius,
    );
  }
}
