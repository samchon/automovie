import type {
  AutoMovieHumanSide,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSignature,
} from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  HumanSignature,
} from "@automovie/motions";
import { HUMAN_LEXICON, HumanFoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../internal/motionHumanBody";

/** The two public events bracketing stance and swing. */
type PhaseEvent = "HeelStrike" | "ToeOff";

/** The registered row's optional unilateral direction. */
interface IStyle {
  /** The installed gait row. */
  name: string;

  /** The affected limb, where the row exposes a side. */
  side?: AutoMovieHumanSide;
}

/** A timed walk and its displayed body reader. */
interface ITrial {
  /** The public gait segment after the shared standing entry. */
  segment: IAutoMovieMotionHumanSegment;

  /** The actual displayed joints and soles. */
  shown: IAutoMovieMotionHumanSignature.IReader;
}

/** An announced footfall in film seconds. */
interface IStrike {
  /** The landing foot. */
  side: AutoMovieHumanSide;

  /** The marker's film second. */
  seconds: number;
}

/**
 * Distinct gait rules change pace, suspension, the stance interval or the limb
 * that moves. Check their defining observations at the relevant phase.
 *
 * Scenarios:
 *
 * 1. A march keeps the quick-time cadence and displayed step length.
 * 2. A jog has a free-flight interval and advances faster than a walk.
 * 3. A unilateral limp shortens that side's stance. A stiff-knee limp also reduces
 *    the affected side's displayed knee flexion.
 * 4. A tiptoe lifts the heel above the toe at the centre of stance.
 * 5. Wandering changes lateral displacement and cadence regularity.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents the cadence, step length, flight, sided stance and mid-phase display observations and their bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the installed rows and reads their marker times, displayed ankles, hips, knees and sole points at the events needed by each claim.
 * @evidence contracts/development/testing.md#independent-expectations US Army TC 3-21.5 gives 120 steps per minute and 30-inch steps. Flight is the absence of support on both feet. The unilateral and tiptoe expectations use the established signed and distance bounds.
 * @evidence contracts/development/testing.md#distinguishing-cases Walking supplies a negative flight control, the opposite leg supplies a within-take control, and the same foot supplies both sole heights.
 * @evidence contracts/development/testing.md#execution-ownership One take per distinct gait rule and its neutral reference. One original stature serves each rule and the poses are read only inside the tested phase.
 */
export function test_motion_gait_gait_styles(): void {
  const man: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const woman: IAutoMovieMotionHumanBody = motionHumanBody("f-small");
  const step: number = 30 * 0.0254;
  const beats: number = 120;
  const march: ITrial = trial(man, 12 * step, { name: "march" }, "gaits");
  const all: IStrike[] = strikes(march.segment, "HeelStrike");
  const duration: number = all.at(-1)!.seconds - all[0]!.seconds;
  const cadence: number = (60 * (all.length - 1)) / duration;
  const middle: IStrike[] = steady(march.segment);
  const first: IStrike = middle[0]!;
  const last: IStrike = middle.at(-1)!;
  const placement = (one: IStrike): number =>
    HumanSignature.joint(march.shown, one.seconds + 1 / 24, `${one.side}Foot`)
      .z;
  const stride: number =
    (placement(last) - placement(first)) / (middle.length - 1);
  TestValidator.predicate(
    "quick-time cadence within two percent",
    Math.abs(cadence / beats - 1) <= 0.02,
  );
  TestValidator.predicate(
    "quick-time step within five percent",
    Math.abs(stride / step - 1) <= 0.05,
  );

  const walking: ITrial = trial(man, 8, undefined, "gaits");
  const jogging: ITrial = trial(man, 12, { name: "jog" }, "gaits");
  TestValidator.predicate(
    "only running has a free-flight interval",
    !flight(walking) && flight(jogging),
  );
  TestValidator.predicate(
    "the jog advances faster than the walk",
    speed(jogging) > speed(walking),
  );

  const limp: ITrial = trial(man, 6, { name: "limp", side: "right" }, "styles");
  const stood = (side: AutoMovieHumanSide): number =>
    average(
      phases(limp.segment, side, "HeelStrike").map(
        ([from, to]): number => to - from,
      ),
    );
  TestValidator.predicate(
    "limp reduces the affected stance by at least ten percent",
    stood("right") <= 0.9 * stood("left"),
  );

  const stiff: ITrial = trial(
    woman,
    6,
    { name: "stiffLimp", side: "right" },
    "styles",
  );
  const bent = (side: AutoMovieHumanSide): number =>
    average(
      phases(stiff.segment, side, "ToeOff")
        .slice(0, 2)
        .map(([from, to]): number =>
          HumanSignature.knee(stiff.shown, (from + to) / 2, side),
        ),
    );
  TestValidator.predicate(
    "the stiff knee flexes at least fifteen degrees less",
    bent("right") <= bent("left") - 15,
  );

  const tiptoe: ITrial = trial(woman, 6, { name: "tiptoe" }, "styles");
  for (const side of ["left", "right"] as const) {
    const [from, to]: readonly [number, number] = phases(
      tiptoe.segment,
      side,
      "HeelStrike",
    )[0]!;
    const frame = HumanSignature.bones(tiptoe.shown, (from + to) / 2);
    const sole = HumanFoot.sockets(woman, frame, side);
    const heel: number = sole.find((site) => site.socket === "heel")!.point.y;
    const toe: number = sole.find((site) => site.socket === "toe")!.point.y;
    TestValidator.predicate(
      `${side} heel rises twenty millimetres while the toe stays grounded`,
      heel >= 0.02 && toe <= 0.02,
    );
  }

  const straight: ITrial = trial(woman, 6, undefined, "styles");
  const wandering: ITrial = trial(woman, 6, { name: "drunk" }, "styles");
  const sideways = (one: ITrial): number =>
    Math.max(
      ...(["left", "right"] as const).flatMap(
        (side: AutoMovieHumanSide): number[] =>
          phases(one.segment, side, "HeelStrike")
            .slice(0, 2)
            .map(([from, to]): number =>
              Math.abs(
                HumanSignature.joint(one.shown, (from + to) / 2, "hips").x,
              ),
            ),
      ),
    );
  TestValidator.predicate(
    "wandering triples the straight walk's lateral excursion",
    sideways(wandering) > 3 * sideways(straight),
  );
  TestValidator.predicate(
    "wandering increases cadence variability",
    unevenness(wandering) > unevenness(straight),
  );
}

/**
 * Prepare the installed gait once with the same standing setup as its
 * reference.
 */
function trial(
  body: IAutoMovieMotionHumanBody,
  distance: number,
  style: IStyle | undefined,
  seed: string,
): ITrial {
  const chain: IAutoMovieMotionHumanChain = HumanChain.subject("a").stand({
    hold: 0.3,
  });
  const to = { x: 0, y: 0, z: distance };
  const film: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed,
    laws: [...HUMAN_LEXICON.gait!],
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: (style === undefined
      ? chain.walk({ to })
      : chain.registered(style.name, { to, side: style.side })
    ).node,
  });
  return {
    segment: film.segments("a")[1]!,
    shown: HumanSignature(film, "a", body, 0),
  };
}

/** Convert the relevant authored markers to ordered film seconds. */
function strikes(
  segment: IAutoMovieMotionHumanSegment,
  kind: PhaseEvent,
): IStrike[] {
  const pattern: RegExp = new RegExp(`^(left|right)${kind}\\d+$`);
  return segment.plan.events
    .filter((event: IAutoMovieMotionEvent): boolean => pattern.test(event.name))
    .map(
      (event: IAutoMovieMotionEvent): IStrike => ({
        side: event.name.startsWith("left") ? "left" : "right",
        seconds: segment.start + event.share * segment.plan.duration,
      }),
    )
    .sort((a: IStrike, b: IStrike): number => a.seconds - b.seconds);
}

/**
 * Use the original steady-gait window without reading separate poses for every
 * style.
 */
function steady(segment: IAutoMovieMotionHumanSegment): IStrike[] {
  const duration: number = segment.end - segment.entryTime;
  return strikes(segment, "HeelStrike")
    .filter(
      ({ seconds }: IStrike): boolean =>
        seconds >= segment.entryTime + 0.3 * duration &&
        seconds <= segment.entryTime + 0.8 * duration,
    )
    .slice(0, 4);
}

/** Observe actual support at the possible intervals between lift and landing. */
function flight(test: ITrial): boolean {
  const lifts: IStrike[] = strikes(test.segment, "ToeOff").reverse();
  return steady(test.segment)
    .slice(1)
    .some(({ side, seconds }: IStrike): boolean => {
      const lift: IStrike | undefined = lifts.find(
        (event: IStrike): boolean =>
          event.side !== side && event.seconds < seconds,
      );
      const at: number =
        lift === undefined || seconds - lift.seconds > 0.5
          ? seconds - 1 / 60
          : (seconds + lift.seconds) / 2;
      return (
        !HumanSignature.bears(test.shown, at, "left") &&
        !HumanSignature.bears(test.shown, at, "right")
      );
    });
}

/** Divide displayed hip advance between two steady footfalls by elapsed seconds. */
function speed(test: ITrial): number {
  const nodes: IStrike[] = steady(test.segment);
  const first: number = nodes[0]!.seconds;
  const last: number = nodes.at(-1)!.seconds;
  const hips = (time: number): number =>
    HumanSignature.joint(test.shown, time + 1 / 24, "hips").z;
  return (hips(last) - hips(first)) / (last - first);
}

/** The coefficient of variation of steady step periods, independent of pace. */
function unevenness(test: ITrial): number {
  const clocks: IStrike[] = steady(test.segment);
  const periods: number[] = clocks
    .slice(1)
    .map(
      (event: IStrike, i: number): number => event.seconds - clocks[i]!.seconds,
    );
  const mean: number = average(periods);
  return (
    Math.sqrt(
      average(periods.map((period: number): number => (period - mean) ** 2)),
    ) / mean
  );
}

/**
 * Find each same-foot interval ending at the next opposite event in the steady
 * window.
 */
function phases(
  segment: IAutoMovieMotionHumanSegment,
  side: AutoMovieHumanSide,
  kind: PhaseEvent,
): (readonly [number, number])[] {
  const length: number = segment.end - segment.entryTime;
  const from: number = segment.entryTime + 0.25 * length;
  const to: number = segment.entryTime + 0.85 * length;
  const interior = ({ side: foot, seconds }: IStrike): boolean =>
    foot === side && seconds >= from && seconds <= to;
  const endings: IStrike[] = strikes(
    segment,
    kind === "HeelStrike" ? "ToeOff" : "HeelStrike",
  ).filter(interior);
  return strikes(segment, kind)
    .filter(interior)
    .flatMap(({ seconds }: IStrike): (readonly [number, number])[] => {
      const end: IStrike | undefined = endings.find(
        (event: IStrike): boolean => event.seconds > seconds,
      );
      return end === undefined ? [] : [[seconds, end.seconds]];
    });
}

/** Equal-weight average of the observed stance durations or flexions. */
function average(values: readonly number[]): number {
  return (
    values.reduce((sum: number, value: number): number => sum + value, 0) /
    values.length
  );
}
