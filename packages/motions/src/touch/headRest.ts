import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanHeadRest,
  IAutoMovieMotionHumanJoints,
  IAutoMovieMotionHumanKiss,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRise,
  IAutoMovieMotionHumanTarget,
  IAutoMovieMotionManner,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanHead } from "../compose/AutoMovieMotionHumanHead";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanJoints } from "../compose/AutoMovieMotionHumanJoints";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { kiss } from "./kiss";
import { kissBody } from "./kissBody";
import { kissPose } from "./kissPose";

/** The miss under which the head rests on the region, metres (provisional: a skin contact). */
const NEAR: number = 0.01;

/** The most the neck and the head bend to a side together, degrees (provisional: about the cervical lateral flexion of a healthy adult, 40 to 45 degrees). */
const TILT: number = 40;

/** One candidate of the solve: the kiss's lean and neck flexion, and the head's side bend. */
interface ISolved extends IAutoMovieMotionHumanKiss.ISolved {
  /** The side bend shared over the neck and the head, degrees. */
  tilt: number;
}

/**
 * Rest the head on a partner (#4012). The resting head's own region, the
 * temple on the side the partner's region lies unless named, is brought to
 * the partner's region as it stands at the start. The body leans from the
 * hips as a kiss does (`kissBody`, seated or on planted feet), the neck
 * flexes and the head bends to the side, each found by a coordinate
 * search: the forward lean and the neck on a grid, then the side lean,
 * then the side bend, then the grid again. The head goes down in the free
 * transport time of its travel, rests the authored span and comes up in
 * the same time. A region the lean, the neck and the side bend cannot
 * bring the head to within `NEAR` is refused with the miss and the
 * angles, so a much shorter partner's shoulder is out of reach standing.
 *
 * The resting head is aimed at the partner's region at the start and does
 * not yet follow the partner's later turn; contact windows cannot yet
 * name the head as the bearing part.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the regions, the solve, the timing, the refusal and what the draft does not yet do.
 * @evidence contracts/development/design.md#principled-representation A law over the kiss's lean model with its own region and a side bend.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Adds only the side bend and the own-region aim; the lean, the head shares and the timing are the kiss's owners'.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The miss is measured on the posture the display writes; nothing presses the head on into the partner.
 */
export const headRest: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanHeadRest> =
  {
    name: "headRest",
    interrupts: AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      touch: ["fromRelax", "smooth"],
      walk: ["fromRelax", "smooth"],
      flinch: ["anytime", "reflex"],
    }),
    plan: (
      context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanHeadRest>,
    ): IAutoMovieMotionHumanActionPlan => {
      const p: IAutoMovieMotionHumanHeadRest = context.params;
      const body: IAutoMovieMotionHumanActionContext["body"] = context.body;
      HumanBound.least("seconds", p.seconds, 0, "s");
      if (p.partner === context.subject)
        throw new HumanRefusal({
          kind: "parameter",
          axis: "partner",
          value: p.partner,
          reason: "a head rests on another performer",
          fix: "name another performer as the partner",
        });
      const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
      const surface: Pick<IAutoMovieMotionHumanTarget.IPlace, "point"> =
        context.aim(
          { kind: "person", subject: p.partner, region: p.region },
          context.start,
        );
      const at: IAutoMovieVector3 = surface.point;
      const own: AutoMovieHumanoidRegion = p.own ?? side(context, at);
      const stance: IAutoMovieMotionHumanRise.Stance = {
        left: {
          ankle: context.entry.feet.left.ankle,
          rotation: context.entry.feet.left.rotation,
        },
        right: {
          ankle: context.entry.feet.right.ankle,
          rotation: context.entry.feet.right.rotation,
        },
      };
      const seated: boolean = context.entry.supports.some(
        (s: IAutoMovieMotionHumanEntryState.ISupport): boolean =>
          s.kind === "seat",
      );
      const solved: ISolved = solve(body, entry, stance, seated, own, at);
      if (solved.miss > NEAR)
        throw new HumanRefusal({
          kind: "reach",
          axis: "region",
          value: p.region,
          feasible: { kind: "range", minimum: null, maximum: NEAR, unit: "m" },
          reason: `the ${own} stays ${(solved.miss * 1000).toFixed(0)} mm from the partner's ${p.region} at a lean of ${solved.pitch.toFixed(0)} degrees forward and ${solved.roll.toFixed(0)} to the side, the neck flexed ${solved.flexion.toFixed(0)} and bent ${solved.tilt.toFixed(0)} to the side`,
          fix: "sit or stand nearer, or rest on a region within the lean's reach",
        });
      const modifiers: IAutoMovieMotionManner.IModifiers =
        AutoMovieMotionManner.of(context, p.manner);
      const approach: number = AutoMovieMotionHumanTiming.transport(
        Vector3.distance(HumanTrunk.region(body, entry, own).point, at),
      );
      const timed: IAutoMovieMotionClock = AutoMovieMotionManner.time(
        AutoMovieMotionClock.phrase({
          prepare: approach,
          attack: 0,
          hold: p.seconds,
          retract: approach,
        }),
        modifiers,
      );
      const clock: IAutoMovieMotionClock = AutoMovieMotionClock.of(
        timed.duration,
        [
          ...timed.instants,
          { name: "contact", seconds: timed.at("ready") },
          { name: "part", seconds: timed.at("relax") },
        ],
      );
      const share: (seconds: number) => number = (seconds: number): number =>
        clock.envelope(["start", "ready"], ["relax", "end"], seconds);
      const flexion: IAutoMovieMotionHumanJoints.Angles =
        AutoMovieMotionHumanHead.share(0, solved.flexion);
      const bend: IAutoMovieMotionHumanJoints.Angles =
        AutoMovieMotionHumanHead.share(1, solved.tilt);
      return composeAutoMovieMotionHumanAction({
        base: AutoMovieMotionHumanBase.under(context, clock.duration),
        clock,
        primitives: [
          {
            channels: ["root", "trunk"],
            from: 0,
            to: clock.duration,
            write: (
              posture: IAutoMovieMotionHumanPosture,
              seconds: number,
            ): IAutoMovieMotionHumanPosture =>
              kissBody(body, posture, stance, solved, share(seconds), seated),
          },
          AutoMovieMotionHumanJoints.pulse(
            clock,
            ["start", "ready"],
            ["relax", "end"],
            {
              neck: [flexion.neck![0], bend.neck![1], 0],
              head: [flexion.head![0], bend.head![1], 0],
            },
          ),
        ],
        contact: "contact",
      });
    },
  };

/** The temple on the side of the performer the partner's region lies. */
function side(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanHeadRest>,
  at: IAutoMovieVector3,
): AutoMovieHumanoidRegion {
  const left: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, context.entry.posture.yaw),
    { x: 1, y: 0, z: 0 },
  );
  const head: IAutoMovieVector3 = HumanTrunk.region(
    context.body,
    context.entry.posture,
    "crown",
  ).point;
  return Vector3.dot(Vector3.subtract(at, head), left) >= 0
    ? "templeLeft"
    : "templeRight";
}

/** The lean, the neck flexion and the side bend that bring the own region nearest the point. */
function solve(
  body: IAutoMovieMotionHumanActionContext["body"],
  entry: IAutoMovieMotionHumanPosture,
  stance: IAutoMovieMotionHumanRise.Stance,
  seated: boolean,
  own: AutoMovieHumanoidRegion,
  at: IAutoMovieVector3,
): ISolved {
  const resolution: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();
  const leaned: ReturnType<typeof kissPose> = kissPose(
    body,
    entry,
    stance,
    0,
    seated,
  );
  const point: ReturnType<typeof HumanTrunk.preparePoint> =
    HumanTrunk.preparePoint(body, own);
  const posed: (s: ISolved) => IAutoMovieMotionHumanPosture = (s: ISolved): IAutoMovieMotionHumanPosture => {
    const posture: IAutoMovieMotionHumanPosture = leaned(s);
    const bend: IAutoMovieMotionHumanJoints.Angles =
      AutoMovieMotionHumanHead.share(1, s.tilt);
    const add: (bone: "neck" | "head") => readonly [number, number, number] = (
      bone: "neck" | "head",
    ): readonly [number, number, number] => {
      const held: readonly [number, number, number] =
        posture.joints[bone] ?? [0, 0, 0];
      return [held[0], held[1] + bend[bone]![1], held[2]];
    };
    return {
      ...posture,
      joints: { ...posture.joints, neck: add("neck"), head: add("head") },
    };
  };
  const scored: (s: ISolved) => ISolved = (s: ISolved): ISolved => ({
    ...s,
    miss: Vector3.distance(point(posed(s), resolution), at),
  });
  const least: (candidates: readonly ISolved[]) => ISolved = (candidates: readonly ISolved[]): ISolved =>
    candidates
      .map(scored)
      .reduce((a: ISolved, b: ISolved): ISolved => (b.miss < a.miss ? b : a));
  const span: (from: number, to: number, step: number) => number[] = (from: number, to: number, step: number): number[] => {
    const out: number[] = [];
    for (let v: number = from; v <= to + 1e-9; v += step) out.push(v);
    return out;
  };
  const sagittal: (s: ISolved) => ISolved = (s: ISolved): ISolved => {
    const coarse: ISolved = least([
      s,
      ...span(-10, 45, 5).flatMap((pitch: number): ISolved[] =>
        span(-30, 45, 5).map((flexion: number): ISolved => ({ ...s, pitch, flexion })),
      ),
    ]);
    return least([
      coarse,
      ...span(coarse.pitch - 4, coarse.pitch + 4, 1).flatMap((pitch: number): ISolved[] =>
        span(coarse.flexion - 4, coarse.flexion + 4, 1).map(
          (flexion: number): ISolved => ({ ...coarse, pitch, flexion }),
        ),
      ),
    ]);
  };
  const lateral: (s: ISolved) => ISolved = (s: ISolved): ISolved =>
    least([
      s,
      ...span(-TILT, TILT, 2).map((tilt: number): ISolved => ({ ...s, tilt })),
    ]);
  const neutral: ISolved = scored({
    pitch: 0,
    roll: 0,
    flexion: 0,
    raise: 0,
    tilt: 0,
    miss: Infinity,
  });
  let best: ISolved = sagittal(neutral);
  best = least(
    span(-kiss.ROLL, kiss.ROLL, 1).map((roll: number): ISolved => ({ ...best, roll })),
  );
  best = sagittal(lateral(best));
  return lateral(best);
}
