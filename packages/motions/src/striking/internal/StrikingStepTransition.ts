import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStep,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanLeg } from "../../compose/internal/AutoMovieMotionHumanLeg";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { lowerHumanPosture } from "../../posture/internal/lowerHumanPosture";
import { StrikingGuard } from "./StrikingGuard";
import { StrikingStance } from "./StrikingStance";
import { StrikingTarget } from "./StrikingTarget";
import { StrikingTwist } from "./StrikingTwist";
import type { strikingStepSupport } from "./strikingStepSupport";

/*
 * Each moving foot gets its own support interval, with both down between lifts.
 */
const FIRST: Window = [0, 0.45];

/*
 * The following foot has planted before the action cut.
 */
const SECOND: Window = [0.5, 0.95];

/*
 * The lead ball stays in place while the other foot takes one swing.
 */
const PIVOT: Window = [0, 0.95];

/*
 * Axis of a positive turn in the world frame.
 */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/*
 * The angled and lead-changing footwork planned by `step`. A stationary turn
 * pivots the lead shoe around its ball and moves the root and rear shoe around
 * that anchor. A traveling turn takes two steps on a new line. A lead exchange
 * lets the old rear foot move first on its own lane and finishes in the new
 * lead. The AIBA coaching illustrations distinguish these support patterns. A
 * cut keeps the inherited bearing shoe as the first support or pivot, and lands
 * the airborne shoe within the incoming beat. The beat windows, vertical load,
 * heel rise and trunk lag are provisional choreography, expressed as beat
 * shares or relative to the body.
 * ://www.iba.sport/wp-content/uploads/2018/07/AIBA-Coach-Regulations-Manual_WEB.pdf
 * @see https://www.iba.sport/wp-content/uploads/2018/07/AIBA-Coach-Regulations-Manual_WEB.pdf
 */
export namespace StrikingStepTransition {
  /*
   * Plan the prescribed support transfers and the carried full-body posture.
   * Parameter context: The step's action context and actual entry placements.
   * Parameter props: The resolved beat count, duration, travel, turn and entry
   * lead.
   * Returns: The deterministic full-body plan and its support windows.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStep.IParams>,
    props: IProps,
  ): IAutoMovieMotionHumanActionPlan {
    const { body, entry, params } = context;
    const { count, stride, turn, length, lead, support } = props;
    const duration: number = count * stride;
    const exitLead: Side = params.lead ?? lead;
    const entryTurn: number = StrikingStance.heading({ line: 0, lead });
    const baseLine: number = entry.posture.yaw - entryTurn;
    const turnPerBeat: number = turn / count;
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...entry.posture.joints,
      ...StrikingStance.joints(entry.posture.joints),
    };
    const lift: number = 0.025 * body.measure.stature;
    const beats: IBeat[] = [];
    const contacts: IAutoMovieMotionHumanContactWindow[] = [];
    const events: IAutoMovieMotionEvent[] = [];
    let feet: Feet = StrikingTarget.feet(entry);
    let root: IAutoMovieVector3 = entry.posture.root;
    for (let index: number = 0; index < count; ++index) {
      const nextLead: Side = index === count - 1 ? exitLead : lead;
      const swap: boolean = nextLead !== lead;
      const line: number = baseLine + index * turnPerBeat;
      const still: boolean = length === 0 && turnPerBeat === 0 && !swap;
      const carried: IStrikingStepSupport | undefined =
        index === 0 ? support : undefined;
      const pivotSide: Side | undefined =
        carried === undefined ? lead : carried.bearing;
      const pivot: IPivot | undefined =
        length === 0 && turnPerBeat !== 0 && !swap && pivotSide !== undefined
          ? {
              side: pivotSide,
              ball: HumanFoot.point(body, pivotSide, "ball", feet[pivotSide]),
              pitch: HumanFoot.pitch(feet[pivotSide].rotation),
            }
          : undefined;
      const destination: IAutoMovieVector3 = pivot
        ? rotateAround(root, pivot.ball, turnPerBeat)
        : travel(root, params.direction, line + turnPerBeat / 2, length);
      const fromOrigin: IAutoMovieVector3 = pivot?.ball ?? root;
      const toOrigin: IAutoMovieVector3 = pivot?.ball ?? destination;
      const next: Feet = swap
        ? StrikingStance.feet(
            body,
            { lead: nextLead, line: line + turnPerBeat },
            destination,
          )
        : {
            left: moved(
              carried?.landings.left ?? feet.left,
              fromOrigin,
              toOrigin,
              turnPerBeat,
            ),
            right: moved(
              carried?.landings.right ?? feet.right,
              fromOrigin,
              toOrigin,
              turnPerBeat,
            ),
          };
      if (pivot)
        next[pivot.side] = HumanFoot.pivot(
          body,
          pivot.side,
          "ball",
          pivot.ball,
          HumanFoot.heading(feet[pivot.side].rotation) + turnPerBeat,
          pivot.pitch,
        );

      const first: Side =
        carried?.bearing !== undefined
          ? StrikingStance.rear({ lead: carried.bearing })
          : swap
            ? StrikingStance.rear({ lead })
            : firstSide(params.direction, lead);
      const follow: Window =
        carried !== undefined && carried.bearing === undefined ? PIVOT : SECOND;
      const windows: IBeat["windows"] = still
        ? {
            left: carried?.landings.left === undefined ? undefined : FIRST,
            right: carried?.landings.right === undefined ? undefined : FIRST,
          }
        : pivot
          ? { left: PIVOT, right: PIVOT }
          : {
              left: first === "left" ? FIRST : follow,
              right: first === "right" ? FIRST : follow,
            };
      const beat: IBeat = {
        from: feet,
        to: next,
        root,
        destination,
        line,
        delta: turnPerBeat,
        lead,
        nextLead,
        windows,
        pivot,
        airborne: carried?.landings,
      };
      for (const side of ["left", "right"] as const)
        book(contacts, beat, side, index, count);
      events.push({ name: `step${index + 1}`, share: (index + 1) / count });
      beats.push(beat);
      feet = next;
      root = destination;
    }
    return {
      duration,
      contacts,
      events,
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const index: number = Math.min(count - 1, Math.floor(t / stride));
        const local: number = (t - index * stride) / stride;
        const beat: IBeat = beats[index]!;
        const motion: number = progress(PIVOT, local);
        const load: number = 4 * motion * (1 - motion);
        const swap: number = beat.lead === beat.nextLead ? 0 : motion;
        const turning: number = beat.delta * motion;
        const line: number = beat.line + turning;
        const bearing: IAutoMovieVector3 = beat.pivot
          ? rotateAround(beat.root, beat.pivot.ball, turning)
          : Vector3.lerp(beat.root, beat.destination, motion);
        const leadAngle: number = StrikingStance.heading({
          line,
          lead: beat.lead,
        });
        const nextAngle: number = StrikingStance.heading({
          line,
          lead: beat.nextLead,
        });
        const bodyTurn: number =
          leadAngle + (nextAngle - leadAngle) * swap - line;
        const active: boolean =
          beat.windows.left !== undefined || beat.windows.right !== undefined;
        const trunkLag: number = active
          ? -0.1 * (beat.delta + nextAngle - leadAngle) * load
          : 0;
        const placed: Feet = {
          left: placement(context, beat, "left", local, lift),
          right: placement(context, beat, "right", local, lift),
        };
        const down: Record<Side, boolean> = {
          left: bearingAt(beat, "left", local),
          right: bearingAt(beat, "right", local),
        };
        const posture: IAutoMovieMotionHumanPosture = lowerHumanPosture(
          body,
          {
            root: {
              ...bearing,
              y: bearing.y - (active ? 0.025 * body.measure.thigh * load : 0),
            },
            yaw: line + bodyTurn,
            pitch: entry.posture.pitch,
            roll: entry.posture.roll,
            joints: StrikingStance.facing(
              { ...joints, ...StrikingTwist.trunk(joints, trunkLag) },
              bodyTurn - entryTurn + 2 * trunkLag,
            ),
            limbs: StrikingStance.legs(body, placed, down),
          },
          lowerHumanPosture.KNEE,
        );
        return {
          ...posture,
          limbs: {
            ...posture.limbs,
            ...StrikingGuard(
              body,
              posture,
              { lead: beat.lead },
              {},
              undefined,
              undefined,
              params.guard,
              swap,
            ),
          },
        };
      },
    };
  }

  /*
   * A step beat's foot windows, as its bearing and its contacts read them.
   */
  export interface IFootwork {
    /*
     * Each foot's swing window, shares of the beat; none for a foot that stays.
     */
    windows: Record<
      AutoMovieHumanSide,
      readonly [from: number, to: number] | undefined
    >;

    /*
     * The foot that pivots, if any.
     */
    pivot: { side: AutoMovieHumanSide } | undefined;

    /*
     * The feet still landing from a cut step, if any.
     */
    airborne: strikingStepSupport.ISupport["landings"] | undefined;
  }
  /*
   * Apply a world turn around an anchor without changing the point's height.
   */
  export function rotateAround(
    point: IAutoMovieVector3,
    anchor: IAutoMovieVector3,
    yaw: number,
  ): IAutoMovieVector3 {
    return HumanFrame.point(
      { origin: anchor, yaw },
      Vector3.subtract(point, anchor),
    );
  }

  /*
   * Travel one chord in the direction of the stance at the middle of the beat.
   */
  export function travel(
    root: IAutoMovieVector3,
    direction: IAutoMovieMotionHumanStep.IParams["direction"],
    yaw: number,
    length: number,
  ): IAutoMovieVector3 {
    const x: number =
      direction === "left" ? length : direction === "right" ? -length : 0;
    const z: number =
      direction === "forward" ? length : direction === "back" ? -length : 0;
    return HumanFrame.point({ origin: root, yaw }, { x, y: 0, z });
  }

  /*
   * Rotate the placement from one stance frame into the next.
   */
  export function moved(
    foot: IAutoMovieMotionHumanFoot.IPlacement,
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    turn: number,
  ): IAutoMovieMotionHumanFoot.IPlacement {
    return {
      ankle: HumanFrame.point(
        { origin: to, yaw: turn },
        Vector3.subtract(foot.ankle, from),
      ),
      rotation: Quaternion.multiply(
        Quaternion.fromAxisAngle(UP, turn),
        foot.rotation,
      ),
    };
  }

  /*
   * Pick the near foot first for travel without changing lead.
   */
  export function firstSide(
    direction: IAutoMovieMotionHumanStep.IParams["direction"],
    lead: AutoMovieHumanSide,
  ): AutoMovieHumanSide {
    if (direction === "forward") return lead;
    if (direction === "back") return StrikingStance.rear({ lead });
    return direction;
  }

  /*
   * Ease into and out of a foot's own motion window.
   */
  export function progress(
    window: readonly [from: number, to: number],
    local: number,
  ): number {
    return AutoMovieEngineMotionSampling.minimumJerkShare((local - window[0]) / (window[1] - window[0]));
  }

  /*
   * The bearing selection includes the anchored ball throughout its pivot.
   */
  export function bearingAt(
    beat: IFootwork,
    side: AutoMovieHumanSide,
    local: number,
  ): boolean {
    const window: readonly [from: number, to: number] | undefined =
      beat.windows[side];
    return (
      beat.pivot?.side === side ||
      window === undefined ||
      (local <= window[0] && beat.airborne?.[side] === undefined) ||
      local >= window[1]
    );
  }

  /*
   * Declare only the ground windows occupied by each motion.
   */
  export function book(
    contacts: IAutoMovieMotionHumanContactWindow[],
    beat: IFootwork,
    side: AutoMovieHumanSide,
    index: number,
    count: number,
  ): void {
    const add = (kind: "plant" | "pivot", from: number, to: number): void => {
      if (from < to)
        contacts.push({
          part: `${side}Foot`,
          kind,
          from: (index + from) / count,
          to: (index + to) / count,
          support: { kind: "ground" },
        });
    };
    const window: readonly [from: number, to: number] | undefined =
      beat.windows[side];
    if (window === undefined) add("plant", 0, 1);
    else {
      if (beat.airborne?.[side] === undefined) add("plant", 0, window[0]);
      if (beat.pivot?.side === side) add("pivot", window[0], window[1]);
      add("plant", window[1], 1);
    }
  }
}

/*
 * Evaluate the pivot or swing of one foot on its own clock.
 */
function placement(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStep.IParams>,
  beat: IBeat,
  side: Side,
  local: number,
  lift: number,
): IAutoMovieMotionHumanFoot.IPlacement {
  const window: Window | undefined = beat.windows[side];
  if (window === undefined) return beat.from[side];
  const share: number = StrikingStepTransition.progress(window, local);
  if (share === 0) return beat.from[side];
  if (share === 1) return beat.to[side];
  if (beat.pivot?.side === side)
    return HumanFoot.pivot(
      context.body,
      side,
      "ball",
      beat.pivot.ball,
      HumanFoot.heading(beat.from[side].rotation) + beat.delta * share,
      beat.pivot.pitch - 12 * 4 * share * (1 - share),
    );
  return AutoMovieMotionHumanLeg.arc(
    beat.from[side],
    beat.to[side],
    lift,
    share,
  );
}

/*
 * A single stance side.
 */
type Side = AutoMovieHumanSide;

/*
 * Both feet in world metres with their actual rotations.
 */
type Feet = Record<Side, IAutoMovieMotionHumanFoot.IPlacement>;
/*
 * A foot's normalized motion interval within one beat.
 */
type Window = readonly [from: number, to: number];
/*
 * The inherited support only present at a cut with at least one airborne foot.
 */
type IStrikingStepSupport = strikingStepSupport.ISupport;
/*
 * The original planted sole point and pitch of the lead foot.
 */
interface IPivot {
  side: Side;
  ball: IAutoMovieVector3;
  pitch: number;
}

/*
 * Fixed geometry and support schedule of one beat.
 */
interface IBeat {
  from: Feet;
  to: Feet;
  root: IAutoMovieVector3;
  destination: IAutoMovieVector3;
  line: number;
  delta: number;
  lead: Side;
  nextLead: Side;
  windows: Record<Side, Window | undefined>;
  pivot: IPivot | undefined;
  airborne: IStrikingStepSupport["landings"] | undefined;
}

/*
 * Resolved controls from the step law, in seconds, degrees and metres.
 */
interface IProps {
  count: number;
  stride: number;
  length: number;
  turn: number;
  lead: Side;
  support: IStrikingStepSupport | undefined;
}
