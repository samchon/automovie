import { type AutoMovieArchetype, createSeat } from "@automovie/archetypes";
import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanAffect,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanLayer,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanTouchEffector,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanExpression,
  AutoMovieMotionHumanTouch,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { HUMAN_EVERYDAY_LAWS, HumanHand } from "@automovie/motions/internal";

import { assertTakeClean } from "../../internal/assertTakeClean";
import { everydayTake } from "../../internal/everydayTake";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";
import { throwsError } from "../../internal/throwsError";

const { hug } = AutoMovieMotionHumanTouch;

const { HumanAffect } = AutoMovieMotionHumanExpression;
const { AutoMovieMotionHumanTouchEffector } = AutoMovieMotionHumanTouch;

/**
 * The nominal interval between sob inspirations at intensity 1, seconds, and
 * its documented ±30 % seeded variation.
 */
const SOB: readonly [number, number, number] = [0.5, 0.7, 1.3];

/**
 * The shortest interval 24 Hz film shows as separate pulses, seconds: the 12 Hz
 * Nyquist limit.
 */
const NYQUIST: number = 1 / 12;

/** The sampling step of the angle reads, seconds. */
const STEP: number = 0.001;

/** How far a contact the layer must not move may drift, metres. */
const KEEP: number = 0.001;

/** The hug's palm-to-back contact bound, metres. */
const TOUCH: number = 0.01;

/** The flat palm that covers a cheek. */
const PALM: IAutoMovieMotionHumanTouchEffector.IEffector = {
  surface: "palm",
  shape: "flat",
};

/**
 * Sobbing, weeping and gasping play on the affect layer without moving the
 * contacts of the action under them.
 *
 * Scenarios:
 *
 * 1. A sob's shoulder lift peaks once per inspiration. The intervals vary, each
 *    within ±30 % of 0.5 s, never closer than the 12 Hz Nyquist limit of 24 Hz
 *    film, and the same seed repeats the train while another seed changes it.
 *    Intensity 2 makes the train denser than intensity 1.
 * 2. A weep lowers the head while it plays, and a gasp's head extension peaks 0.25
 *    s in, returns to rest at its end, and a gasp too short for its inspiration
 *    is refused.
 * 3. On the average man and the small woman, a sob over `coverFace` leaves both
 *    hands where the plain cover puts them while the shoulders heave.
 * 4. A seated sob leaves the hips on the seat, and a sob over a `hug` leaves the
 *    sobbing performer's palms within 10 mm of the partner's back.
 * 5. Reading the sobbing cover backwards gives the same poses as forwards.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the five scenarios and what each pins.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displays' angles and the posed bodies of public performances with and without the layer; a regular or too dense train, an unseeded or unrepeatable train, a gasp off its rise, a layer that moves a hand, a seat or a partner contact, or an order-dependent read fails.
 * @evidence contracts/development/testing.md#independent-expectations The interval band and rise are the documented provisional parameters; the Nyquist limit follows from the 24 Hz film rate; the cover's quarter-hand and the hug's 10 mm palm bounds are those actions' own; a seated sob must leave the hips where the same performance without the layer puts them.
 * @evidence contracts/development/testing.md#distinguishing-cases Two seeds and two intensities, all three displays, a refused short gasp, standing, seated and embracing bases and two body sizes; the general zero-end and continuity checks of every display are test_motion_expression_affect_signal's.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory unit over the public layer and HumanPerformance on canonical bodies; the feature runner discovers it.
 */
export function test_motion_expression_affect_crying(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  const lifts: number[] = peaks("sob", 4, 1, "a");

  // Between the envelope's ramps every inspiration peaks at full height, so
  // the peaks there are the pulse tops themselves.
  const steady: number[] = lifts.filter(
    (t: number): boolean => t > 0.08 * 4 && t < 0.8 * 4,
  );
  const gaps: number[] = steady
    .slice(1)
    .map((t: number, i: number): number => t - steady[i]!);
  checks.check(
    "a sob heaves once per inspiration at irregular seeded intervals",
    gaps.length >= 3 &&
      gaps.every(
        (gap: number): boolean =>
          gap >= SOB[0] * SOB[1] - 2 * STEP &&
          gap <= SOB[0] * SOB[2] + 2 * STEP &&
          gap > NYQUIST,
      ) &&
      Math.max(...gaps) - Math.min(...gaps) > 4 * STEP,
  );
  checks.equals("the same seed repeats", peaks("sob", 4, 1, "a"), lifts);
  checks.check(
    "another seed changes the train",
    peaks("sob", 4, 1, "b").join() !== lifts.join(),
  );
  checks.check(
    "a stronger sob is denser",
    peaks("sob", 4, 2, "a").length > lifts.length,
  );

  const weep: number = HumanAffect.angles("weep", 3, 6).head![0];
  checks.check("a weep lowers the head", weep > 6);
  const gasp: number[] = samples("gasp", 1.5, 1, "a", "head", 0);
  const deepest: number = gasp.indexOf(Math.min(...gasp));
  checks.check(
    "a gasp peaks at its rise and returns to rest",
    Math.abs(deepest * STEP - 0.25) <= 2 * STEP &&
      Math.abs(gasp.at(-1)!) < 0.05,
  );
  checks.check(
    "a gasp shorter than its inspiration is refused",
    throwsError(() => HumanAffect.angles("gasp", 0.1, 0.2)),
  );

  for (const fit of ["m-average", "f-small"] as const) {
    try {
      const body: IAutoMovieMotionHumanBody = motionHumanBody(fit);
      const cover = (sob: boolean): HumanPerformance =>
        solo(
          body,
          HumanChain.extend(HUMAN_EVERYDAY_LAWS)
            .subject("a")
            .coverFace({ hold: 3 }),
          [],
          sob,
        );
      const plain: HumanPerformance = cover(false);
      const sobbing: HumanPerformance = cover(true);
      verdict(checks, `${fit} sob over a cover`, sobbing);
      const face: IAutoMovieMotionHumanSegment = sobbing.segments("a")[0]!;
      const from: number = event(face, "atFace");
      const to: number = event(face, "relax");
      const times: number[] = [0, 0.25, 0.5, 0.75, 1].map(
        (share: number): number => from + share * (to - from),
      );

      // The cover's own bound: each palm within a quarter hand of its cheek.
      checks.check(
        `${fit}: the palms stay on the cheeks while the shoulders heave`,
        times.every(
          (t: number): boolean =>
            cheek(sobbing, body, "left", t) <= body.measure.hand / 4 &&
            cheek(sobbing, body, "right", t) <= body.measure.hand / 4,
        ) &&
          times.some(
            (t: number): boolean =>
              apart(plain, sobbing, t, "leftShoulder") > 0,
          ),
      );
      const forward: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>[] =
        times.map((t: number) => sobbing.bones("a", t));
      const fresh: HumanPerformance = cover(true);
      const backward: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>[] = [
        ...times,
      ]
        .reverse()
        .map(
          (t: number): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
            fresh.bones("a", t),
        )
        .reverse();
      checks.check(
        `${fit}: reading backwards gives the same poses`,
        forward.every(
          (
            bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
            i: number,
          ) =>
            Vector3.distance(
              bones.get("head")!.worldPosition,
              backward[i]!.get("head")!.worldPosition,
            ) <= 1e-9,
        ),
      );
    } catch (error: unknown) {
      checks.check(`${String(fit)}: ${everydayTake.describe(error)}`, false);
    }
  }

  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const chair: AutoMovieArchetype<createSeat.Affordance, createSeat.Dimension> =
    createSeat({ kind: "dining" });
  const placed: IAutoMovieMotionHumanProp = HumanObject.prop("chair", chair, {
    at: { x: 0, y: 0, z: -0.3 },
    yaw: 0,
    fixed: true,
  });
  const seat: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(chair, {
    at: { x: 0, y: 0, z: -0.3 },
    yaw: 0,
  });
  const seated = (sob: boolean): HumanPerformance =>
    solo(body, HumanChain.subject("a").sit({ seat, hold: 4 }), [placed], sob);
  const sitting: HumanPerformance = seated(false);
  const sitSob: HumanPerformance = seated(true);
  checks.check(
    "a seated sob leaves the hips on the seat",
    [2, 2.5, 3].every(
      (t: number): boolean => apart(sitting, sitSob, t, "hips") <= KEEP,
    ),
  );

  const embrace = (sob: boolean): HumanPerformance =>
    new HumanPerformance({
      seed: "crying",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
        {
          subject: "b",
          body,
          at: { x: -0.1, y: 0, z: 0.32 },
          yaw: 180,
          proficiency: { level: "trained" },
        },
      ],
      layers: sob ? { a: [crying(0.3)] } : {},
      composition: HumanChain.mutual(
        hug,
        {
          one: HumanChain.subject("a").stand({ hold: 0.3 }),
          other: HumanChain.subject("b").stand({ hold: 0.3 }),
        },
        { hold: 2 },
      ).node,
    });
  const heldSob: HumanPerformance = embrace(true);
  const hugA: IAutoMovieMotionHumanSegment = heldSob.segments("a")[1]!;
  const hugB: IAutoMovieMotionHumanSegment = heldSob.segments("b")[1]!;
  const dwellFrom: number = Math.max(
    event(hugA, "strokeEnd"),
    event(hugB, "strokeEnd"),
  );
  const dwellTo: number = Math.min(event(hugA, "relax"), event(hugB, "relax"));
  // The hug's own bound: each palm within 10 mm of the partner's back region
  // (the right on the upper back, the left on the lower) through the dwell.
  const reach = (film: HumanPerformance): number[] =>
    [0.25, 0.5, 0.75]
      .map((share: number): number => dwellFrom + share * (dwellTo - dwellFrom))
      .flatMap((t: number): number[] => [
        back(film, body, "right", "upperBack", t),
        back(film, body, "left", "lowerBack", t),
      ]);
  const palms: number[] = reach(heldSob);
  const plainPalms: number[] = reach(embrace(false));
  checks.check(
    `a sob over a hug leaves the palms on the partner's back (${palms
      .map((gap: number): string => (1000 * gap).toFixed(1))
      .join(", ")} mm; plain ${plainPalms
      .map((gap: number): string => (1000 * gap).toFixed(1))
      .join(", ")} mm)`,
    dwellTo > dwellFrom && palms.every((gap: number): boolean => gap <= TOUCH),
  );
  checks.assert("expression affect crying");
}

/** How far performer `a`'s flat palm is from a region of partner `b`, metres. */
function back(
  film: HumanPerformance,
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  region: AutoMovieHumanoidRegion,
  t: number,
): number {
  const surface: IAutoMovieHumanoidSurfaces.IFrame =
    body.surfaces.regions[region];
  return Vector3.distance(
    HumanHand.frame(body, film.bones("a", t), side, "palm", "flat").point,
    resolveAutoMovieHumanoidSurfaces.place(
      surface,
      film.bones("b", t).get(surface.bone)!,
    ).point,
  );
}

/**
 * One performer `a` at the origin playing a chain, with or without a sob from
 * 0.3 s.
 */
function solo(
  body: IAutoMovieMotionHumanBody,
  chain: IAutoMovieMotionHumanChain,
  props: IAutoMovieMotionHumanProp[],
  sob: boolean,
): HumanPerformance {
  return new HumanPerformance({
    seed: "crying",
    laws: Object.values(HUMAN_EVERYDAY_LAWS),
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    props,
    layers: sob ? { a: [crying(0.3)] } : {},
    composition: chain.node,
  });
}

/** The film second of a segment's named event. */
function event(segment: IAutoMovieMotionHumanSegment, name: string): number {
  return (
    segment.start +
    segment.plan.duration *
      segment.plan.events.find(
        (item: IAutoMovieMotionEvent): boolean => item.name === name,
      )!.share
  );
}

/** How far a displayed palm is from the cheek on its side, metres. */
function cheek(
  film: HumanPerformance,
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  t: number,
): number {
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = film.bones(
    "a",
    t,
  );
  const region: IAutoMovieHumanoidSurfaces.IFrame =
    body.surfaces.regions[side === "right" ? "cheekRight" : "cheekLeft"];
  return Vector3.distance(
    AutoMovieMotionHumanTouchEffector.point(body, bones, side, PALM),
    resolveAutoMovieHumanoidSurfaces.place(region, bones.get(region.bone)!)
      .point,
  );
}

/** A four-second sob starting at a film second. */
function crying(at: number): IAutoMovieMotionHumanLayer {
  const display: IAutoMovieMotionHumanAffect.IDisplay = {
    kind: "sob",
    at,
    duration: 4,
  };
  return HumanAffect.layer([display]);
}

/**
 * How far one bone's displayed position differs between two performances,
 * metres.
 */
function apart(
  a: HumanPerformance,
  b: HumanPerformance,
  t: number,
  bone: AutoMovieHumanoidBone,
): number {
  return Vector3.distance(
    a.bones("a", t).get(bone)!.worldPosition,
    b.bones("a", t).get(bone)!.worldPosition,
  );
}

/**
 * One angle of one bone of a display, sampled every STEP from its start through
 * its end.
 */
function samples(
  kind: IAutoMovieMotionHumanAffect.Kind,
  seconds: number,
  intensity: number,
  seed: string,
  bone: AutoMovieHumanoidBone,
  axis: number,
): number[] {
  const values: number[] = [];
  for (let t: number = 0; t <= seconds + 1e-9; t += STEP)
    values.push(
      HumanAffect.angles(kind, t, seconds, intensity, seed)[bone]?.[axis] ?? 0,
    );
  return values;
}

/** The times of a display's local maxima of the left shoulder's lift, seconds. */
function peaks(
  kind: IAutoMovieMotionHumanAffect.Kind,
  seconds: number,
  intensity: number,
  seed: string,
): number[] {
  const lift: number[] = samples(
    kind,
    seconds,
    intensity,
    seed,
    "leftShoulder",
    1,
  );
  const times: number[] = [];
  for (let i: number = 1; i + 1 < lift.length; ++i)
    if (lift[i]! > lift[i - 1]! && lift[i]! >= lift[i + 1]! && lift[i]! > 0.5)
      times.push(i * STEP);
  return times;
}

/** Gather a take's shipped verdicts as one check. */
function verdict(
  checks: motionComplaints.IGatherer,
  label: string,
  film: HumanPerformance,
): void {
  try {
    assertTakeClean(label, film);
  } catch (error: unknown) {
    checks.check(
      `${label}: ${error instanceof Error ? error.message : String(error)}`,
      false,
    );
  }
}
