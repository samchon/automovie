import {
  Vector3,
  bracketedRoot,
  minimumJerk,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanSit,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { HumanPhysics } from "../law/HumanPhysics";
import { HumanRefusal } from "../law/HumanRefusal";
import type { HumanKnot } from "../posture/HumanKnot";
import { prepareHumanKnotCourse } from "../posture/prepareHumanKnotCourse";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { HumanBalance } from "./HumanBalance";
import type { prepareSitLowering } from "./prepareSitLowering";

type Event = IAutoMovieMotionHumanActionPlan["events"][number];

/** Descent geometry and the seat approach's offset on the action clock. */
interface ISeatDescent {
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSit.IParams>;
  start: IAutoMovieVector3;
  goal: IAutoMovieVector3;
  yaw0: number;
  across: number;
  contact: number;
  descent: number;
  duration: number;
  prefix: number;
  shares: number;
  lowered: ReturnType<typeof prepareSitLowering>;
}

/** Seat travel evaluated against the original action-local balance window. */
interface ISeatCourse {
  clock: IAutoMovieMotionClock;
  window: HumanPhysics.Window;
  travel: (seconds: number) => number;
}

/**
 * Prepare the backward socket travel that precedes seat contact. The absolute
 * event bounds include the preliminary foot placements while the lowering's
 * evaluator reads descent-local seconds.
 */
export function prepareSitBalance(props: ISeatDescent): ISeatCourse {
  const {
    context,
    start,
    goal,
    yaw0,
    across,
    contact,
    descent,
    duration,
    prefix,
    shares,
    lowered,
  }: ISeatDescent = props;
  const body: typeof context.body = context.body;
  // The weight stays over the feet until the seat takes it (Kralj, Jaeger
  // and Munih 1990): until a pendulum's time constant before contact
  // (Hof, Gazendam and Sinke 2005, the time the body needs to fall onto
  // the seat), the seat socket goes back only as far as keeps the centre
  // of mass where it stands over the feet, read in the world along the
  // heading so a change of the base under it does not move the mark,
  // solved by bisection at shares of that time and read between them on a
  // knot course; over the last of it the socket comes back onto the seat, which
  // it reaches at contact.
  // The weight-over-the-feet course is the balance option's
  // (`IAutoMovieMotionHumanBalance`); without it the seat socket goes
  // back on its own minimum-jerk progress and no centre of mass is read.
  const clock: ReturnType<typeof AutoMovieMotionClock> = AutoMovieMotionClock(
    duration,
    [
      { name: "commit", seconds: contact },
      { name: "seatContact", seconds: contact },
      { name: "seated", seconds: descent },
    ],
  );

  const total: number = prefix + duration;
  const timing: Parameters<typeof HumanPhysics.prepare>[3] = {
    duration: total,
    events: clock.events().map(
      (event: Event): Event => ({
        ...event,
        share: (prefix + duration * event.share) / total,
      }),
    ),
  };
  const window: HumanPhysics.Window = HumanPhysics.prepare(
    context.params,
    { balance: { by: "hips" } },
    context.start,
    timing,
    context.instant,
  );
  if (window !== null && window.by !== "hips")
    throw new HumanRefusal({
      kind: "parameter",
      axis: "balance.by",
      value: window.by,
      reason:
        "sitting adjusts the hips over the planted feet before seat contact",
      fix: "give hips for balance.by",
    });
  const freeTravel: (seconds: number) => number = (seconds: number): number =>
    minimumJerk.share(seconds / across);
  if (window === null || window.from >= prefix + contact || window.to <= prefix)
    return { clock, window, travel: freeTravel };
  const fall: number = Math.min(
    contact,
    1 /
      resolveAutoMovieCenterOfMass.frequency(
        resolveAutoMovieCenterOfMass.pendulum(body.measure.hipHeight),
      ),
  );
  const held: number = contact - fall;
  if (held <= 0) return { clock, window, travel: freeTravel };
  // The active lookup interval needs its two bounding samples. Once
  // falling starts only the final held sample contributes to travel.
  const first: number = Math.floor(
    Math.min(1, Math.max(0, (window.from - prefix) / held)) * shares,
  );
  const last: number = Math.ceil(
    Math.min(1, Math.max(0, (window.to - prefix) / held)) * shares,
  );
  const reaches: number[] = ((): number[] => {
    const heading: IAutoMovieVector3 = {
      x: Math.sin((yaw0 * Math.PI) / 180),
      y: 0,
      z: Math.cos((yaw0 * Math.PI) / 180),
    };
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const project: ReturnType<typeof prepareHumanPostureProjection> =
      prepareHumanPostureProjection(body);
    const centre: ReturnType<typeof HumanBalance.prepareCentre> =
      HumanBalance.prepareCentre(body);
    const ahead: (t: number, back: number) => number = (
      t: number,
      back: number,
    ): number =>
      Vector3.dot(centre(lowered(t, back, read), read, project), heading);
    const stood: number = ahead(0, 0);

    // Keep every bracket trial and the original physical travel tolerance;
    // only this synchronous table construction borrows the shared readers.
    const way: number = Math.hypot(goal.x - start.x, goal.z - start.z);
    const balanced: (t: number) => number = (t: number): number => {
      const free: number = minimumJerk.share(t / across);
      const behind: (back: number) => number = (back: number): number =>
        ahead(t, back) - stood;
      const far: number = behind(free);
      if (far >= 0) return free;
      const near: number = behind(0);
      if (near <= 0 || way <= 0) return 0;
      return bracketedRoot(
        (trial: number): number =>
          trial === 0 ? near : trial === free ? far : behind(trial),
        0,
        free,
        HumanBalance.TOLERANCE / way,
      );
    };
    return Array.from(
      { length: last - first + 1 },
      (_: unknown, index: number): number => {
        const k: number = first + index;
        return k === 0 ? 0 : balanced((held * k) / shares);
      },
    );
  })();
  // The solved reaches are knots of a course on the descent's seconds
  // (`prepareHumanKnotCourse`, Flash and Hogan's minimum-jerk path through
  // them), so a read evaluates one quintic.
  const course: prepareHumanKnotCourse.ICourse = prepareHumanKnotCourse(
    reaches.map(
      (reach: number): HumanKnot.IKnot => ({ position: [reach], dwell: 0 }),
    ),
    {
      kind: "fixed",
      times: reaches.map(
        (_: number, index: number): number => (held * (first + index)) / shares,
      ),
    },
  );
  const kept: (at: number) => number = (at: number): number =>
    course.position(Math.max(0, Math.min(held, at)))[0]!;
  function travel(t: number): number {
    const free: number = minimumJerk.share(t / across);
    const weight: number = HumanPhysics.weightAt(window, prefix + t);
    if (weight === 0 || t >= contact) return free;
    if (t <= held) return free + weight * (Math.min(free, kept(t)) - free);
    const from: number = Math.min(minimumJerk.share(held / across), kept(held));
    return (
      free + weight * (from - free) * (1 - minimumJerk.share((t - held) / fall))
    );
  }
  return { clock, window, travel };
}
