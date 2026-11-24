import { createSeat } from "@automovie/archetypes";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSignature,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "./archetypeExtent";
import { motionHumanBody } from "./motionHumanBody";

/** The two disk seats use independently sourced height and diameter ranges. */
type Seat = "stool" | "barStool";

/** The stool's allowed height in metres, including the NKBA bar height gap. */
const HEIGHT: Readonly<Record<Seat, readonly [number, number]>> = {
  stool: [0.43, 0.457],
  barStool: [1.067 - 12 * 0.0254, 1.067 - 10 * 0.0254],
};

/** Where a seat stands: its floor point and its turn about +Y, degrees. */
interface IPlacement {
  /** The floor point, metres. */
  at: IAutoMovieVector3;

  /** The turn about +Y, degrees. */
  yaw: number;
}

/** The fixed placement keeps the seat's analytic disc in the same floor frame. */
const PLACEMENT: IPlacement = {
  at: { x: 0, y: 0, z: -0.6 },
  yaw: 0,
};

/**
 * Observe the actual supported pose across a fixed seat seed range.
 *
 * @param kind The emitted seat shape.
 * @param first First model seed, inclusive.
 * @param last Last model seed, exclusive.
 */
export function archetypeCatalogueSeatContact(
  kind: Seat,
  first: number,
  last: number,
): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const failures: Map<string, string> = new Map();
  let low: number = Infinity;
  let high: number = -Infinity;
  let narrow: number = Infinity;
  let wide: number = -Infinity;
  let largest: number = -Infinity;
  let largestSeed: number = -1;
  let largestTime: number = 0;
  for (let seed: number = first; seed < last; ++seed) {
    try {
      const model: ReturnType<typeof createSeat> = createSeat({ kind }, seed);
      const shapes: ReturnType<typeof model.shapes> = model.shapes();
      const top: number = archetypeExtent(shapes, "y", ["seat"]).high;
      const diameter: number = archetypeExtent(shapes, "x", ["seat"]).size;
      low = Math.min(low, top);
      high = Math.max(high, top);
      narrow = Math.min(narrow, diameter);
      wide = Math.max(wide, diameter);
      const seat: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(
        model,
        PLACEMENT,
        "seat",
      );
      const film: IAutoMovieMotionHumanPerformance = supportFilm(
        body,
        seat,
        0.2,
        kind,
      );
      const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature(
        film,
        "a",
        body,
        0,
      );
      const [sit, hold]: readonly IAutoMovieMotionHumanSegment[] =
        film.segments("a");
      const settled: number = sit!.plan.events.find(
        (event): boolean => event.name === "seated",
      )!.share;
      const at: number = sit!.start + settled * sit!.plan.duration;
      for (const seconds of [
        at,
        hold!.entryTime,
        ...Array.from(
          { length: 9 },
          (_: unknown, index: number): number =>
            hold!.entryTime + (hold!.end - hold!.entryTime) * (index / 8),
        ),
      ]) {
        const actual: IAutoMovieVector3 = HumanSignature.region(
          reader,
          "seat",
          seconds,
        );
        const radial: number = Math.hypot(
          actual.x - PLACEMENT.at.x,
          actual.z - PLACEMENT.at.z,
        );
        const gap: number = Math.hypot(
          actual.y - top,
          Math.max(radial - diameter / 2, 0),
        );
        if (!(gap <= largest)) {
          largest = Number.isFinite(gap) ? gap : Infinity;
          largestSeed = seed;
          largestTime = seconds;
        }
      }
      if (
        !hold!.plan.contacts.some(
          (contact): boolean =>
            contact.part === "seat" &&
            contact.from <= 1e-9 &&
            contact.to >= 1 - 1e-9,
        )
      )
        record(
          failures,
          `${kind}/window`,
          `${kind} seed ${seed} lost the declared seated support window`,
        );
    } catch (error) {
      record(
        failures,
        `${kind}/admission`,
        `${kind} seed ${seed}: ${String(error)}`,
      );
    }
  }
  const [minimum, maximum]: readonly [number, number] = HEIGHT[kind];
  if (!(low >= minimum - 1e-9 && high <= maximum + 1e-9 && high >= low))
    record(
      failures,
      `${kind}/height`,
      `${kind} seat top covers [${low}, ${high}] m for [${minimum}, ${maximum}] m`,
    );
  if (!(narrow >= 0.3 - 1e-9 && wide <= 0.35 + 1e-9 && wide >= narrow))
    record(
      failures,
      `${kind}/diameter`,
      `${kind} seat diameter covers [${narrow}, ${wide}] m for [0.3, 0.35] m`,
    );
  if (!(largest <= 0.01))
    record(
      failures,
      `${kind}/contact`,
      `${kind} seat gap ${largest} m, seed ${largestSeed} at ${largestTime} s`,
    );
  console.log(
    `${kind}/support/m-average max ${largest} m, seed ${largestSeed} at ${largestTime} s, height [${low}, ${high}] m`,
  );
  TestValidator.equals(
    "seeded stool support contacts",
    [...failures.values()],
    [],
  );
}

/** Ancillary source band and refused seat verification. */
export namespace archetypeCatalogueSeatContact {
  /** Read complete emitted size bands and the seat reach refusal. */
  export function boundaries(): void {
    const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
    const failures: Map<string, string> = new Map();
    for (const kind of ["stool", "barStool"] as const) {
      const [minimum, maximum]: readonly [number, number] = HEIGHT[kind];
      const heights: number[] = [];
      const diameters: number[] = [];
      for (let seed: number = 0; seed < 200; ++seed) {
        const shapes: ReturnType<ReturnType<typeof createSeat>["shapes"]> =
          createSeat({ kind }, seed).shapes();
        heights.push(archetypeExtent(shapes, "y", ["seat"]).high);
        diameters.push(archetypeExtent(shapes, "x", ["seat"]).size);
      }
      spread(failures, `${kind} seat height`, heights, minimum, maximum);
      spread(failures, `${kind} seat diameter`, diameters, 0.3, 0.35);
    }
    const stool: ReturnType<typeof createSeat> = createSeat(
      { kind: "barStool" },
      0,
    );
    const seat: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(
      stool,
      PLACEMENT,
      "seat",
    );
    try {
      supportFilm(body, seat, 1.5, "barStool").segments("a");
      record(
        failures,
        "remote seat",
        "a bar stool 1.5 m behind the body was admitted",
      );
    } catch (error) {
      if (
        !(error instanceof HumanRefusal) ||
        error.kind !== "reach" ||
        error.axis !== "seat" ||
        !error.fix
      )
        record(failures, "remote seat", String(error));
    }
    TestValidator.equals(
      "seat source bands and reach refusal",
      [...failures.values()],
      [],
    );
  }
}

/** Verify all shape draws stay inside the source limits and cover the interval. */
function spread(
  failures: Map<string, string>,
  label: string,
  values: readonly number[],
  minimum: number,
  maximum: number,
): void {
  const low: number = Math.min(...values);
  const high: number = Math.max(...values);
  if (
    !(
      low >= minimum - 1e-9 &&
      high <= maximum + 1e-9 &&
      high - low >= 0.8 * (maximum - minimum)
    )
  )
    record(
      failures,
      label,
      `${label} covers [${low}, ${high}] m for [${minimum}, ${maximum}] m`,
    );
}

/** Replays the authored support followed by an upper-body drinking gesture. */
function supportFilm(
  body: IAutoMovieMotionHumanBody,
  seat: IAutoMovieMotionHumanSeated.ISeat,
  ahead: number,
  kind: Seat,
): IAutoMovieMotionHumanPerformance {
  return new HumanPerformance({
    seed: `catalogue/${kind}/support`,
    performers: [
      {
        subject: "a",
        body,
        at: { x: seat.at.x, y: 0, z: seat.at.z + ahead },
        yaw: seat.yaw,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a")
      .sit({ seat, hold: 0.5 })
      .handToFace({ kind: "drink" }).node,
  });
}

/** Keep one diagnostic per independent failure while the seed round finishes. */
function record(
  failures: Map<string, string>,
  key: string,
  message: string,
): void {
  if (!failures.has(key)) failures.set(key, message);
}
