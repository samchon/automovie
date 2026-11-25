import { createPhone } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePhysicalShape,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanOperate,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../internal/archetypeExtent";
import { motionHumanBody } from "../../internal/motionHumanBody";

const { swipeTouchscreen } = AutoMovieMotionHumanOperate;

/** One measured case dimension and its stated source bounds, metres. */
interface IBand {
  /** The phone dimension the band bounds. */
  name: createPhone.Dimension;

  /** The source band's lower bound. */
  minimum: number;

  /** The source band's upper bound. */
  maximum: number;
}

/** The low and high value observed for one band across the seeds, metres. */
interface IBounds {
  /** The lowest observed value. */
  low: number;

  /** The highest observed value. */
  high: number;
}

/** The touchscreen row the test adds to the chain, keyed by its registered name. */
type SwipeRows = Record<"swipeTouchscreen", typeof swipeTouchscreen>;

/** The contact-relevant case measurements and stated source bounds, metres. */
const BANDS: readonly IBand[] = [
  { name: "width", minimum: 0.0642, maximum: 0.078 },
  { name: "height", minimum: 0.1315, maximum: 0.1634 },
  { name: "thickness", minimum: 0.00564, maximum: 0.00875 },
];

/** The measured maximum and its exact replay coordinates. */
interface IWorst {
  /** The greatest fingertip gap, metres. */
  gap: number;

  /** The model seed where it occurred. */
  seed: number;

  /** The film time where it occurred, seconds. */
  seconds: number;
}

/**
 * The canonical phone presents its seeded glass to the displayed index tip.
 *
 * Scenarios:
 *
 * 1. Build 200 seeded phone colliders. Keep one fixed actor seed and the
 *    maintained 30-degree kiosk placement.
 * 2. Read the actual index tip at the glass stroke start, midpoint and end. Check
 *    the measured stroke duration.
 * 3. Refuse a `to` endpoint beyond the physical screen.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the seeded case dimensions, glass placement, measured right index tip and adjacent forbidden endpoint.
 * @evidence contracts/development/testing.md#behavioral-verification Uses the public createPhone and swipeTouchscreen entries and measured emitted case extrema. The returned FK provides the fingertip, so a centered, shortened or floating stroke fails.
 * @evidence contracts/development/testing.md#independent-expectations An independent plane follows from the real case's front face and 94-percent width. Jeong's touchscreen experiment Sections 2.2.3 and 2.3 gives the maintained 9 mm position and 285 ms duration signature. Maker figures and the existing 80-percent band coverage rule bound the emitted case dimensions.
 * @evidence contracts/development/testing.md#distinguishing-cases Exercises both sides and the midpoint of the pressed interval, width and thickness variation across seeds, and a refused out-of-screen endpoint. The separate touchscreen law test owns reversal, withdrawal and cut cases between cells.
 * @evidence contracts/development/testing.md#execution-ownership Constructs the real phone and film in memory one at a time. Keeps only observed extrema, one message per failure and exact worst replay coordinates.
 */
export function test_archetype_catalogue_actor_touchscreen(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("f-average");
  const Chain: ReturnType<typeof HumanChain.extend<SwipeRows>> =
    HumanChain.extend({ swipeTouchscreen });
  const rotation: IAutoMovieQuaternion = Quaternion.multiply(
    Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 30),
    Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 180),
  );
  const direction: IAutoMovieVector3 = { x: -Math.sqrt(3) / 2, y: -0.5, z: 0 };
  const center: IAutoMovieVector3 = {
    x: -body.measure.shoulderHalfWidth,
    y: body.measure.shoulderHeight - 0.14,
    z: 0.48,
  };
  const bounds: IBounds[] = BANDS.map(() => ({
    low: Infinity,
    high: -Infinity,
  }));
  const failures: Set<string> = new Set();
  let failedSeed: number | undefined;
  let worst: IWorst = { gap: -Infinity, seed: -1, seconds: 0 };
  let timing: number = 0;
  for (let seed: number = 0; seed < 200; ++seed) {
    try {
      const phone: ReturnType<typeof createPhone> = createPhone({}, seed);
      const shapes: IAutoMoviePhysicalShape[] = phone.shapes();
      const width: number = archetypeExtent(shapes, "x", ["body"]).size;
      const y: ReturnType<typeof archetypeExtent> = archetypeExtent(
        shapes,
        "y",
        ["body"],
      );
      const z: ReturnType<typeof archetypeExtent> = archetypeExtent(
        shapes,
        "z",
        ["body"],
      );
      [width, y.size, z.size].forEach((value: number, index: number): void => {
        const range: (typeof bounds)[number] = bounds[index]!;
        range.low = Math.min(range.low, value);
        range.high = Math.max(range.high, value);
      });
      const offset: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
        x: 0,
        y: (y.high + y.low) / 2,
        z: z.high,
      });
      const prop: IAutoMovieMotionHumanProp = HumanObject.prop("phone", phone, {
        position: Vector3.subtract(center, offset),
        rotation,
        fixed: true,
      });
      const play = (to: number): HumanPerformance =>
        new HumanPerformance({
          seed: "catalogue/phone-use",
          laws: [swipeTouchscreen],
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" },
            },
          ],
          props: [prop],
          composition: Chain.subject("a")
            .stand({ hold: 0.6, sway: 0 })
            .swipeTouchscreen({
              prop: "phone",
              screen: "screen",
              from: -0.25,
              to,
            }).node,
        });
      const film: HumanPerformance = play(0.25);
      const stroke: IAutoMovieMotionHumanSegment = film.segments("a")[1]!;
      const start: number = stroke.plan.events.find(
        (event): boolean => event.name === "strokeStart",
      )!.share;
      const end: number = stroke.plan.events.find(
        (event): boolean => event.name === "strokeEnd",
      )!.share;
      for (const [share, u] of [
        [start, -0.25],
        [(start + end) / 2, 0],
        [end, 0.25],
      ] as const) {
        const seconds: number = stroke.start + share * stroke.plan.duration;
        const tip: IAutoMovieVector3 = HumanHand.frame(
          body,
          film.bones("a", seconds),
          "right",
          "indexTip",
          "point",
        ).point;
        const expected: IAutoMovieVector3 = Vector3.add(
          center,
          Vector3.scale(direction, u * width * 0.94),
        );
        const gap: number = Vector3.distance(tip, expected);
        if (!(gap <= worst.gap)) worst = { gap: gap, seed, seconds };
      }
      timing = Math.max(
        timing,
        Math.abs((end - start) * stroke.plan.duration - 0.285),
      );
      if (seed === 0) {
        try {
          play(0.6).segments("a");
          failures.add("the phone accepted the off-screen endpoint");
        } catch (error) {
          if (
            !(error instanceof HumanRefusal) ||
            error.axis !== "to" ||
            !error.fix
          )
            failures.add(String(error));
        }
      }
    } catch (error) {
      if (failedSeed === undefined) {
        failedSeed = seed;
        failures.add(`phone seed ${seed}: ${String(error)}`);
      }
    }
  }
  BANDS.forEach(({ name, minimum, maximum }, index: number): void => {
    const { low, high }: IBounds = bounds[index]!;
    if (
      !(
        low >= minimum - 1e-9 &&
        high <= maximum + 1e-9 &&
        high - low >= 0.8 * (maximum - minimum)
      )
    )
      failures.add(
        `phone ${name} covers [${low}, ${high}] m for [${minimum}, ${maximum}] m`,
      );
  });
  if (!(worst.gap <= 0.009 && worst.seed >= 0))
    failures.add(
      `phone contact gap ${worst.gap} m, seed ${worst.seed} at ${worst.seconds} s`,
    );
  if (!(timing <= 0.005))
    failures.add(`phone contact duration drifts by ${timing} s`);
  console.log(
    `phone/use/swipe/f-average max ${worst.gap} m, seed ${worst.seed} at ${worst.seconds} s`,
  );
  TestValidator.equals("seeded phone actor contact", [...failures], []);
}
