import { createCar } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSignature,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  HumanRide,
  HumanSignature,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "./archetypeExtent";
import { motionHumanBody } from "./motionHumanBody";
import { nclose } from "./nclose";

/** The produced sedan and its measured driver cushion. */
type Sedan = ReturnType<typeof createCar>;

/**
 * Run the sedan support case on the specified model seeds.
 *
 * @param first First model seed.
 * @param last Exclusive end of the model seed interval.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the model, seed interval, support and expected seat refusal.
 * @evidence contracts/development/implementation.md#principled-implementation Measures the real cushion, compares the displayed contact and heading, and verifies predicted refusals.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Construct one model and film for each seed, then record the worst admitted gap and rejected seeds.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The cushion boundary is read from the collider and the cutoff follows the actor measurements and the seated admission rule.
 * @evidence contracts/development/implementation.md#efficient-algorithms Reads the requested seed interval once and retains a bounded observation per case.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Both seed intervals share the same case and contact measurements.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A film remains local to its seed iteration.
 */
export function archetypeCatalogueRideContact(
  first: number,
  last: number,
): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  // Knee height minus thigh radius is the contact plane of the thigh.
  const minimumSeat: number =
    0.8 *
    (body.measure.ankleHeight + body.measure.shank - body.measure.thighRadius);
  const failures: Map<string, string> = new Map();
  const refused: number[] = [];
  let admitted: number = 0;
  let minimum: number = Infinity;
  let maximum: number = -Infinity;
  let worst: number = -Infinity;
  let worstSeed: number = -1;
  let worstTime: number = 0;
  for (let seed: number = first; seed < last; ++seed) {
    try {
      const model: Sedan = createCar({ kind: "sedan" }, seed);
      const shapes: ReturnType<typeof model.shapes> = model.shapes();
      const cushion: readonly string[] = ["cushion-driver"];
      const x: ReturnType<typeof archetypeExtent> = archetypeExtent(
        shapes,
        "x",
        cushion,
      );
      const y: ReturnType<typeof archetypeExtent> = archetypeExtent(
        shapes,
        "y",
        cushion,
      );
      const z: ReturnType<typeof archetypeExtent> = archetypeExtent(
        shapes,
        "z",
        cushion,
      );
      minimum = Math.min(y.high, minimum);
      maximum = Math.max(y.high, maximum);
      const seatHeight: number = model.dimensions.seatHeight!;
      const band = model.provenance.bands.seatHeight;
      if (
        !(
          Number.isFinite(seatHeight) &&
          (band !== undefined
            ? seatHeight >= band.minimum &&
              seatHeight <= band.maximum &&
              band.source.length > 0
            : model.provenance.figures.seatHeight !== undefined)
        )
      )
        record(
          failures,
          "seat provenance",
          `sedan seed ${seed} lost its seat-height source`,
        );
      let film: HumanPerformance;
      try {
        film = rideFilm(body, model, true);
      } catch (error) {
        if (
          y.high < minimumSeat &&
          error instanceof HumanRefusal &&
          error.kind === "reach" &&
          error.axis === "seat" &&
          typeof error.value === "number" &&
          nclose(error.value, y.high, 1e-9) &&
          error.feasible?.kind === "range" &&
          error.feasible.minimum !== null &&
          nclose(error.feasible.minimum, minimumSeat, 1e-9) &&
          error.feasible.maximum === null &&
          error.feasible.unit === "m" &&
          error.fix.length > 0
        ) {
          refused.push(seed);
          continue;
        }
        throw error;
      }
      if (y.high < minimumSeat)
        record(
          failures,
          "low seat",
          `sedan seed ${seed} admitted ${y.high} m below ${minimumSeat} m`,
        );
      ++admitted;
      const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
        film,
        "a",
        body,
        0,
      );
      const riding: IAutoMovieMotionHumanSegment = film.segments("a")[1]!;
      const samples: readonly number[] = [
        riding.entryTime,
        3,
        3.00001,
        3.5,
        4,
        4.5,
        5,
        5.5,
        6,
        6.5,
        7,
        riding.end,
      ];
      for (const seconds of samples) {
        const frame: IAutoMovieRigidTransform = placed(seconds);
        const actual: IAutoMovieVector3 = HumanSignature.region(
          reader,
          "seat",
          seconds,
        );
        const local: IAutoMovieVector3 = Quaternion.rotateVector(
          Quaternion.inverse(frame.rotation),
          Vector3.subtract(actual, frame.position),
        );
        const gap: number = Math.hypot(
          Math.max(x.low - local.x, local.x - x.high, 0),
          local.y - y.high,
          Math.max(z.low - local.z, local.z - z.high, 0),
        );
        if (!(gap <= worst)) {
          worst = Number.isFinite(gap) ? gap : Infinity;
          worstTime = seconds;
          worstSeed = seed;
        }
        const forward: IAutoMovieVector3 = Quaternion.rotateVector(
          frame.rotation,
          { x: 0, y: 0, z: 1 },
        );
        const yaw: number = (Math.atan2(forward.x, forward.z) * 180) / Math.PI;
        const error: number = Math.abs(
          ((film.posture("a", seconds).yaw - yaw + 540) % 360) - 180,
        );
        if (!(error <= 1))
          record(
            failures,
            "heading",
            `sedan seed ${seed} heading differs by ${error} degrees at ${seconds} s`,
          );
      }
    } catch (error) {
      record(
        failures,
        "ride admission",
        `sedan seed ${seed}: ${String(error)}`,
      );
    }
  }
  if (!(worst <= 0.01 && worstSeed >= 0))
    record(
      failures,
      "surface",
      `sedan begins/ends ride at most 10 mm from the driver cushion, observed ${worst} m on seed ${worstSeed} at ${worstTime} s`,
    );
  if (!(maximum > minimum))
    record(
      failures,
      "seat spread",
      `the sedan cushion showed no variation, height [${minimum}, ${maximum}] m`,
    );
  console.log(
    `sedan/ride/m-average max ${worst} m, seed ${worstSeed} at ${worstTime} s, cushion height [${minimum}, ${maximum}] m`,
  );
  console.log(
    `sedan seeds [${first}, ${last}): ${admitted} admitted, low-seat refusals [${refused.join(", ")}] at threshold ${minimumSeat} m`,
  );
  if (admitted + refused.length !== last - first)
    record(
      failures,
      "outcomes",
      "a car seed was neither admitted nor validly refused",
    );
  if (first === 0) {
    try {
      rideFilm(body, createCar({ kind: "sedan" }, 0), false).segments("a");
      record(failures, "standing", "the ride admitted a standing driver");
    } catch (error) {
      if (
        !(
          error instanceof HumanRefusal &&
          error.kind === "base" &&
          error.feasible?.kind === "alternatives" &&
          error.feasible.values.includes("sit")
        )
      )
        record(failures, "standing", String(error));
    }
  }
  TestValidator.equals("seeded sedan ride support", [...failures.values()], []);
}

/** The authored sedan runs from rest at 3 s to a quarter turn at 7 s. */
function placed(seconds: number): IAutoMovieRigidTransform {
  const phase: number = Math.max(0, Math.min(1, (seconds - 3) / 4));
  return {
    position: { x: 0, y: 0, z: phase },
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90 * phase),
  };
}

/** Authors the same moving carrier for seated and refused standing entries. */
function rideFilm(
  body: IAutoMovieMotionHumanBody,
  model: Sedan,
  seated: boolean,
): HumanPerformance {
  const seat: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(
    model,
    placed(0),
    "driverSeat",
  );
  const actor: IAutoMovieMotionHumanChain = HumanChain.subject("a");
  const entry: IAutoMovieMotionHumanChain = seated
    ? actor.sit({ seat, seconds: 0.5 })
    : actor.stand({ seconds: 0.5 });
  return new HumanPerformance({
    seed: "catalogue/sedan/ride",
    laws: [HumanRide.ride],
    props: [HumanObject.prop("sedan", model, placed(0), placed)],
    performers: [
      {
        subject: "a",
        body,
        at: { x: seat.at.x, y: 0, z: seat.at.z + 0.2 },
        yaw: seat.yaw,
        proficiency: { level: "trained" },
      },
    ],
    composition: entry.registered("ride", {
      on: "sedan",
      seconds: 7,
      seat: "driverSeat",
    }).node,
  });
}

/** Keep the first case of each failure while every admitted seed is attempted. */
function record(
  failures: Map<string, string>,
  key: string,
  message: string,
): void {
  if (!failures.has(key)) failures.set(key, message);
}
