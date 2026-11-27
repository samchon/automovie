import { ROM_TOLERANCE } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAudit,
  IAutoMovieMotionHumanAuditContact,
  IAutoMovieMotionHumanAuditMeasure,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanAuditRange,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPropOutcome,
  IAutoMovieMotionHumanSimulation,
  IAutoMovieMotionHumanVerdicts,
  IAutoMovieMotionHumanWater,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { HumanBound } from "../law/internal/HumanBound";
import { HumanPropFrame } from "../perform/internal/HumanPropFrame";
import { AutoMovieMotionHumanAudit } from "./internal/AutoMovieMotionHumanAudit";
import { AutoMovieMotionHumanAuditContact } from "./internal/AutoMovieMotionHumanAuditContact";
import { AutoMovieMotionHumanAuditPartner } from "./internal/AutoMovieMotionHumanAuditPartner";
import { AutoMovieMotionHumanAuditRange } from "./internal/AutoMovieMotionHumanAuditRange";
import { AutoMovieMotionHumanAuditSkin } from "./internal/AutoMovieMotionHumanAuditSkin";
import { AutoMovieMotionHumanAuditSpin } from "./internal/AutoMovieMotionHumanAuditSpin";
import { AutoMovieMotionHumanAuditStatics } from "./internal/AutoMovieMotionHumanAuditStatics";
import { AutoMovieMotionHumanAuditTiming } from "./internal/AutoMovieMotionHumanAuditTiming";
import type { HumanVerdictsInput } from "./HumanVerdictsInput";
import { HumanVerdictsSpan } from "./internal/HumanVerdictsSpan";
import { solvedHumanAuditSpans } from "./internal/solvedHumanAuditSpans";

/**
 * The verdict report of a performance: every physical bound that holds for any
 * human motion whatever it means to do, read on the film a composition gives,
 * with each finding placed on the performer and the action it happens in.
 *
 * A composition that plans is not yet a composition that performs well: a hand
 * may pass through a hip, a foot may skate. A production checks its own scene
 * with this report before it looks at a single frame, and a scene is accepted
 * only when the report is clean, a cited signature value holds
 * (`AutoMovieMotionHumanSignature`) and the stills show no flaw.
 *
 * ```ts
 * const report = AutoMovieMotionHumanVerdicts.read(performance);
 * if (!report.clean) throw new Error(AutoMovieMotionHumanVerdicts.describe(report));
 * ```
 *
 * The bounds, the ones the vocabulary's own sweep holds every action to:
 *
 * - `timing`: every declared contact window and event is well formed.
 * - `tangle`: no part of a body passes more than 10 mm into another part of it
 *   (the skin's give where a hand rests on the body).
 * - `floor`, `slip`, `lift`: nothing sinks under the floor, and a planted foot
 *   neither slides nor leaves it, each within 5 mm. The floor is the ground the
 *   person's bearing contacts declare (a bank, a slope), none while a prop or a
 *   partner bears them or an action carries them in water (its params name the
 *   water); a foot planted on a prop or a person is read in that support's
 *   frame, so a deck, tread or saddle carries it.
 * - `jump`, `reversal`, `speed`: every joint centre travels a continuous path
 *   with no out-and-back spike and no impossible speed.
 * - `balance`: while both feet alone bear the body, its extrapolated centre of
 *   mass stays over them.
 * - `skate`, `loose`, `afloat`: a foot the motion shows on the floor does not
 *   skate, and a declared plant is neither loose nor afloat.
 * - `statics`: while a held body's bearing contacts all declare their load, the
 *   load-weighted contact centre lies under the centre of mass within 2 % of
 *   stature (`AutoMovieMotionHumanAuditStatics`).
 * - `range`: every joint stays within its range of motion, within `ROM_TOLERANCE`
 *   (0.01 degrees).
 * - `unloaded`: a foot no plant holds dorsiflexes no further than an ankle
 *   bearing no weight does (`ANKLE_DORSIFLEXION.unloaded`), within
 *   `ROM_TOLERANCE`.
 * - `turn`: no bone snaps by more than 5 degrees, the turn left once an interval
 *   is halved until a smooth turn is gone
 *   (`AutoMovieMotionHumanAuditSpin.SNAP`).
 * - `partner`: two people do not pass more than 10 mm into each other.
 *
 * A performer who swims or climbs a ladder is not carried by the floor, so the
 * floor, plant and balance bounds are left unread for that performer. Each
 * reading is in its bound's own unit: metres, except metres per second for
 * `speed`, `skate` and `loose`, degrees for `range`, `unloaded` and `turn`, and
 * none for `timing`. Inside a window solved through the engine
 * (`AutoMovieMotionHumanPerformance.simulate`), the parts the solver owns are judged by the
 * solver's contacts instead of their declared plants, its owned feet take no
 * unloaded bound and a body whose root it owns takes no balance judgement
 * (`solvedHumanAuditSpans`); every check of the displayed bones still reads
 * it.
 */
export namespace AutoMovieMotionHumanVerdicts {

  /**
   * Read every bound on a performance, or on one span of its film.
   *
   * A span lets a long film be read in parts, each by its own caller: the bounds
   * are read over the span as a film of its own, starting at its `from`, and
   * every finding is placed at its film second. A bound that reads a step between
   * frames reads it only where both frames lie in the span, so parts that are to
   * cover a film whole overlap by two frames of the grid. The timing faults
   * belong to the schedule, not to a span, and are read whatever the span.
   *
   * @param performance The performance.
   * @param rate Grid samples per second for the bounds read on a grid; 24 when
   *   absent.
   * @param span The film seconds the bounds are read over; the whole film when
   *   absent.
   * @returns The report.
   * @throws {AutoMovieMotionHumanRefusal} When the span does not lie within the film or ends
   *   before it starts.
   */
  export function read(
    performance: AutoMovieMotionHumanVerdicts.IPerformance,
    rate: number = 24,
    span?: IAutoMovieMotionHumanVerdicts.IOfSpan,
  ): IAutoMovieMotionHumanVerdicts.IReport {
    const from: number = span?.from ?? 0;
    const to: number = span?.to ?? performance.duration;
    HumanBound.within("span.from", from, 0, performance.duration, "s");
    HumanBound.within("span.to", to, from, performance.duration, "s");
    const remembered: IAutoMovieMotionHumanAuditMotion = remember(performance);
    const motion: IAutoMovieMotionHumanAuditMotion = HumanVerdictsSpan(
      remembered,
      from,
      to,
    );
    // Range and unloaded read the canonical pose; each instant is resolved
    // once and shared by both, on the same rounded key as the bones.
    const poses: Map<
      string,
      ReturnType<IAutoMovieMotionHumanAuditRange.IPosed["pose"]>
    > = new Map();
    const posed: IAutoMovieMotionHumanAuditRange.IPosed = {
      duration: to - from,
      pose: (
        subject: string,
        seconds: number,
      ): ReturnType<IAutoMovieMotionHumanAuditRange.IPosed["pose"]> => {
        const key: string = instant(subject, from + seconds);
        let pose:
          | ReturnType<IAutoMovieMotionHumanAuditRange.IPosed["pose"]>
          | undefined = poses.get(key);
        if (pose === undefined) {
          pose = performance.pose(subject, from + seconds);
          poses.set(key, pose);
        }
        return pose;
      },
    };
    const people: HumanVerdictsInput.IPerformance["performers"] =
      performance.performers;
    const findings: IAutoMovieMotionHumanVerdicts.IFinding[] = [];
    const place = (
      subject: string,
      seconds: number,
    ): Pick<IAutoMovieMotionHumanVerdicts.IFinding, OfPlaceResult> => {
      const spans = performance.segments(subject);
      const span = [...spans]
        .reverse()
        .find((s): boolean => s.entryTime <= seconds + 1e-9);
      if (span === undefined) return { act: "", instance: 0 };
      return {
        act: span.name,
        instance: spans.filter(
          (s): boolean => s.id === span.id && s.index <= span.index,
        ).length,
      };
    };
    const measured = (
      subject: string,
      owner: string,
      check: string,
      measure: IAutoMovieMotionHumanAuditMeasure,
      limit: number,
    ): void => {
      if (measure.value > limit + 1e-9)
        findings.push({
          check,
          subject,
          ...place(owner, from + measure.seconds),
          value: measure.value,
          limit,
          seconds: from + measure.seconds,
          where: measure.where,
        });
    };

    for (const person of people) {
      const who: string = person.subject;
      const spans = performance.segments(who);
      const airborne: boolean = isAirborne(spans);
      for (const fault of AutoMovieMotionHumanAuditTiming.faults(spans))
        findings.push({
          check: "timing",
          subject: who,
          act: "",
          instance: 0,
          value: 0,
          limit: 0,
          seconds: 0,
          where: fault,
        });
      const report: IAutoMovieMotionHumanAudit.IReport =
        AutoMovieMotionHumanAudit.run(motion, who, person.body, {
          rate,
          limits: airborne
            ? { floor: null, slip: null, lift: null, balance: null }
            : {},
        });
      for (const finding of report.findings)
        measured(who, who, finding.check, finding, finding.limit);
      if (!airborne) {
        // A foot the solver owns is judged by the solver's contacts: the
        // plant, skate and unloaded readings run outside those spans only.
        for (const [a, b] of solvedHumanAuditSpans.unsolved(
          performance.simulations?.() ?? [],
          who,
          solvedHumanAuditSpans.FEET,
          from,
          to,
        )) {
          const piece: IAutoMovieMotionHumanAuditMotion = HumanVerdictsSpan(
            remembered,
            a,
            b,
          );
          const contact: IAutoMovieMotionHumanAuditContact.IResult =
            AutoMovieMotionHumanAuditContact.measure(piece, who, person.body);
          const pose: IAutoMovieMotionHumanAuditRange.IPosed["pose"] = (
            subject: string,
            seconds: number,
          ): ReturnType<IAutoMovieMotionHumanAuditRange.IPosed["pose"]> =>
            posed.pose(subject, a - from + seconds);
          for (const [check, reading, limit] of [
            ["skate", contact.skate, AutoMovieMotionHumanAuditContact.SPEED],
            ["loose", contact.loose, AutoMovieMotionHumanAuditContact.SPEED],
            ["afloat", contact.afloat, AutoMovieMotionHumanAuditContact.HEIGHT],
            [
              "unloaded",
              AutoMovieMotionHumanAuditRange.unloaded(
                piece,
                { duration: b - a, pose },
                who,
                rate,
              ).overshoot,
              ROM_TOLERANCE,
            ],
          ] as const)
            measured(
              who,
              who,
              check,
              { ...reading, seconds: a - from + reading.seconds },
              limit,
            );
        }
        measured(
          who,
          who,
          "statics",
          AutoMovieMotionHumanAuditStatics.measure(
            motion,
            who,
            person.body,
            rate,
          ),
          AutoMovieMotionHumanAuditStatics.SHARE * person.body.measure.stature,
        );
      }
      measured(
        who,
        who,
        "range",
        AutoMovieMotionHumanAuditRange.measure(posed, who, rate).overshoot,
        ROM_TOLERANCE,
      );
      measured(
        who,
        who,
        "turn",
        AutoMovieMotionHumanAuditSpin.measure(motion, who).turn,
        AutoMovieMotionHumanAuditSpin.SNAP,
      );
    }
    for (let i: number = 0; i < people.length; i++)
      for (let j: number = i + 1; j < people.length; j++)
        measured(
          `${people[i]!.subject}+${people[j]!.subject}`,
          people[i]!.subject,
          "partner",
          AutoMovieMotionHumanAuditPartner.measure(
            motion,
            people[i]!,
            people[j]!,
            rate,
          ).worst,
          AutoMovieMotionHumanVerdicts.SKIN,
        );

    // Every launched prop's flights, those still airborne at the end apart.
    const launched: Set<string> = new Set();
    for (const person of people)
      for (const s of performance.segments(person.subject))
        for (const l of s.plan.launches ?? []) launched.add(l.prop);
    const unended: string[] = [];
    for (const prop of launched)
      for (const f of performance.flights(prop)) {
        const last: IAutoMovieMotionHumanPropOutcome.ILeg | undefined =
          f.legs?.at(-1);
        if (
          f.supersededAt === undefined &&
          (f.end === Infinity ||
            (last?.segment.kind === "flight" && last.end === Infinity))
        )
          unended.push(`${prop}@${f.launch.toFixed(3)}`);
      }
    return { clean: findings.length === 0, findings, unended };
  }

  /** What the verdicts read of a performance (`HumanVerdictsInput`). */
  export type IPerformance = HumanVerdictsInput.IPerformance;

  /** What the verdicts read of a placed action (`HumanVerdictsInput`). */
  export type ISegment = HumanVerdictsInput.ISegment;
  /**
   * The depth a pressed skin gives, metres: how far two bodies may enter each
   * other, the tangle audit's own skin (`AutoMovieMotionHumanAuditSkin.BUILT`),
   * which the arm planner admits a course by.
   */
  export const SKIN: number = AutoMovieMotionHumanAuditSkin.BUILT;

  /** The actions whose body the floor does not carry. */
  export const AIRBORNE: readonly string[] = ["swim", "climbLadder"];

  /**
   * Whether an action of one performer carries a body the floor does not: the
   * performer whose floor, plant and balance bounds `of` leaves unread.
   *
   * @param performance The performance.
   * @param subject The performer.
   * @returns Whether the performer swims or climbs a ladder.
   */
  export function airborne(
    performance: AutoMovieMotionHumanVerdicts.IPerformance,
    subject: string,
  ): boolean {
    return isAirborne(performance.segments(subject));
  }

  /**
   * One line per finding, for a failed assertion's message.
   *
   * @param report A report.
   * @returns `clean`, or each finding as `subject.act#instance check value over
   *   limit at seconds (where)`.
   */
  export function describe(
    report: IAutoMovieMotionHumanVerdicts.IReport,
  ): string {
    if (report.clean) return "clean";
    return report.findings
      .map((f: IAutoMovieMotionHumanVerdicts.IFinding): string => {
        const place: string =
          f.act === "" ? f.subject : `${f.subject}.${f.act}#${f.instance}`;
        return f.check === "timing"
          ? `${place} timing ${f.where}`
          : `${place} ${f.check} ${f.value.toFixed(4)} over ${f.limit} at ${f.seconds.toFixed(2)} s (${f.where})`;
      })
      .join("; ");
  }
}

/*
 * The alternatives of `OfPlaceResult`'s site.
 */
type OfPlaceResult = "act" | "instance";

/*
 * Whether any action of a chain is one the floor does not carry.
 */
const isAirborne = (spans: readonly AutoMovieMotionHumanVerdicts.ISegment[]): boolean =>
  spans.some((s): boolean =>
    AutoMovieMotionHumanVerdicts.AIRBORNE.includes(s.law.family ?? s.name),
  );

/*
 * Whether an action carries a person in water at a film second: the action that
 * has taken the body over names its water in its params, as the surface's world
 * height (`IAutoMovieMotionHumanAquatic.IParams.water`) or as the water itself
 * (`IAutoMovieMotionHumanSwimImmersed.IParams.water`), so the water, not a
 * floor, bears the body.
 */
const inWater = (
  performance: AutoMovieMotionHumanVerdicts.IPerformance,
  subject: string,
  seconds: number,
): boolean => {
  const active = [...performance.segments(subject)]
    .reverse()
    .find((s): boolean => s.entryTime <= seconds + 1e-9);
  return active !== undefined && surface((active.params as IWatered).water);
};

/*
 * Whether a params' water names a surface: a height, or a water with one.
 */
const surface = (water: IWatered["water"]): boolean =>
  typeof water === "number" ||
  (water !== undefined && water.surface !== undefined);

/*
 * An action's params as the water reading sees them.
 */
interface IWatered {
  /*
   * The water, by its surface's world height or as the water itself.
   */
  water?: WaterParam;
}

/*
 * The two shipped ways an action names its water.
 */
type WaterParam = number | Partial<IAutoMovieMotionHumanWater>;
/*
 * The key of one person's instant: the second rounded to a microsecond, so
 * grids that reach the same instant by different float arithmetic (i / rate
 * against i * (1 / rate)) share one resolution.
 */
const instant = (subject: string, seconds: number): string =>
  `${subject}@${Math.round(seconds * 1e6)}`;

/*
 * The performance as a motion that resolves each person's instant once, for the
 * span of one report.
 */
const remember = (
  performance: AutoMovieMotionHumanVerdicts.IPerformance,
): IAutoMovieMotionHumanAuditMotion => {
  const known: Map<
    string,
    ReturnType<IAutoMovieMotionHumanAuditMotion["bones"]>
  > = new Map();
  const bones = (
    subject: string,
    seconds: number,
  ): ReturnType<IAutoMovieMotionHumanAuditMotion["bones"]> => {
    const key: string = instant(subject, seconds);
    let found:
      | ReturnType<IAutoMovieMotionHumanAuditMotion["bones"]>
      | undefined = known.get(key);
    if (found === undefined) {
      found = performance.bones(subject, seconds);
      known.set(key, found);
    }
    return found;
  };
  const simulations: readonly IAutoMovieMotionHumanSimulation[] =
    performance.simulations?.() ?? [];
  return {
    duration: performance.duration,
    segments: (
      subject: string,
    ): readonly IAutoMovieMotionHumanAuditMotion.ISpan[] =>
      simulations.length === 0
        ? performance.segments(subject)
        : solvedHumanAuditSpans(
            performance.segments(subject),
            subject,
            performance.performers.find(
              (
                p: HumanVerdictsInput.IPerformance["performers"][number],
              ): boolean => p.subject === subject,
            )!.body,
            simulations,
          ),
    support: (
      support: IAutoMovieMotionHumanContactWindow.Support,
      seconds: number,
    ): IAutoMovieRigidTransform => {
      if (support.kind === "ground")
        return {
          position: { x: 0, y: support.height ?? 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        };
      // A contact on a moving part rides the part's frame, not the prop's.
      if (support.kind === "prop")
        return support.point !== undefined && performance.site !== undefined
          ? performance.site(support.subject, support.point, seconds)
          : performance.prop(support.subject, seconds);
      const bone: AutoMovieHumanoidBone =
        "bone" in support
          ? support.bone
          : performance.performers.find(
              (
                p: HumanVerdictsInput.IPerformance["performers"][number],
              ): boolean => p.subject === support.subject,
            )!.body.surfaces.regions[support.region].bone;
      return HumanPropFrame.bone(bones(support.subject, seconds).get(bone)!);
    },
    water: (subject: string, seconds: number): boolean =>
      inWater(performance, subject, seconds),
    bones,
  };
};
