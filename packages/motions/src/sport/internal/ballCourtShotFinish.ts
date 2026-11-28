import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPlaced,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangle } from "../../audit/internal/AutoMovieMotionHumanAuditTangle";
import { AutoMovieMotionHumanArmCourse } from "../../compose/internal/AutoMovieMotionHumanArmCourse";
import { motionClock } from "../../compose/internal/motionClock";
import { motionHumanChannel } from "../../compose/internal/motionHumanChannel";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanHand } from "../../posture/internal/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";

/*
 * A detached set shot's finish between its placed endpoint arms. Validate the
 * candidate against the original material sites, wrist travel and active body
 * clearance at no more than a half arm-course waypoint step. Retain the admitted
 * source when those sites move or the candidate exceeds its bounds.
 */
export function ballCourtShotFinish(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanActionPlan["posture"],
  clock: IAutoMovieMotionClock,
  site: ISiteReader,
): IAutoMovieMotionHumanActionPlan["posture"] {
  const from = clock.at("strokeEnd");
  const to = clock.at("relax");
  if (!(clock.at("stroke") < from && from < to)) return posture;
  const window = motionClock.prepare(clock, "strokeEnd", "relax");
  let finish: IEnds | null | undefined;
  return (seconds, channels, resolution, projection) => {
    const actual = posture(seconds, channels, resolution, projection);
    if (seconds <= from || seconds >= to) return actual;
    if (finish === undefined)
      finish = admitted(body, posture, from, to, site, window.linear);
    return finish === null
      ? actual
      : placed(actual, finish, window.linear(seconds), channels);
  };
}

function admitted(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanActionPlan["posture"],
  from: number,
  to: number,
  site: ISiteReader,
  progress: (seconds: number) => number,
): IEnds | null {
  const first = posture(from);
  const last = posture(to);

  if (
    ARMS.some(
      (bone) =>
        first.joints[bone] === undefined ||
        last.joints[bone] === undefined ||
        !first.joints[bone]!.every(Number.isFinite) ||
        !last.joints[bone]!.every(Number.isFinite),
    )
  )
    return null;
  const capture = (state: IAutoMovieMotionHumanPosture) =>
    Object.fromEntries(
      ARMS.map((bone) => {
        const [x, y, z] = state.joints[bone]!;
        return [bone, [x, y, z] as const];
      }),
    );
  const endpoints: IEnds = [capture(first), capture(last)];
  const sites = SIDES.map((side) => site(side, first, from));
  const base = poseBones(body, resolveHumanPosture(body, first));
  const references = SIDES.map(
    (side) => base.get(`${side}Hand`)!.worldRotation,
  );
  const old: IEnvelope[] = SIDES.map(() => ({ point: 0, turn: 0, step: 0 }));
  const next: IEnvelope[] = SIDES.map(() => ({ point: 0, turn: 0, step: 0 }));
  const steps = Math.ceil(
    (2 * (to - from)) / AutoMovieMotionHumanArmCourse.STEP,
  );
  let previous = base;
  let previousFinish = base;
  for (let k = 0; k <= steps; ++k) {
    const seconds = from + ((to - from) * k) / steps;
    const source = k === 0 ? first : k === steps ? last : posture(seconds);
    const goals = SIDES.map((side) => site(side, source, seconds));
    if (
      goals.some(
        ({ point, facing }, i) =>
          AutoMovieEngineVector3.distance(point, sites[i]!.point) > 1e-9 ||
          AutoMovieEngineVector3.distance(facing, sites[i]!.facing) > 1e-9,
      )
    )
      return null;
    const native =
      k === 0 ? base : poseBones(body, resolveHumanPosture(body, source));
    let candidate: typeof native;
    try {
      candidate =
        k === 0 || k === steps
          ? native
          : poseBones(
              body,
              resolveHumanPosture(
                body,
                placed(source, endpoints, progress(seconds)),
              ),
            );
    } catch (error) {
      if (error instanceof AutoMovieMotionHumanRefusal) return null;
      throw error;
    }
    if (
      AutoMovieMotionHumanAuditTangle.pose(body, candidate).some(
        ({ depth }) => depth > AutoMovieMotionHumanAuditTangle.BUILT,
      )
    )
      return null;
    SIDES.forEach((side, i) => {
      const observe = (
        bounds: IEnvelope,
        current: typeof native,
        preceding: typeof native,
      ) => {
        const bone = `${side}Hand` as const;
        const wrist = current.get(bone)!;
        const palm = HumanHand.frame(body, current, side, "palm", "flat").point;
        bounds.point = Math.max(
          bounds.point,
          AutoMovieEngineVector3.distance(palm, goals[i]!.point),
        );
        bounds.turn = Math.max(
          bounds.turn,
          turn(references[i]!, wrist.worldRotation),
        );
        bounds.step = Math.max(
          bounds.step,
          AutoMovieEngineVector3.distance(
            wrist.worldPosition,
            preceding.get(bone)!.worldPosition,
          ),
        );
      };
      observe(old[i]!, native, previous);
      observe(next[i]!, candidate, previousFinish);
    });
    previous = native;
    previousFinish = candidate;
  }
  return next.every(
    (candidate, i) =>
      candidate.point <= old[i]!.point &&
      candidate.turn <= old[i]!.turn &&
      candidate.step <= old[i]!.step,
  )
    ? endpoints
    : null;
}

function placed(
  source: IAutoMovieMotionHumanPosture,
  endpoints: IEnds,
  u: number,
  channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
): IAutoMovieMotionHumanPosture {
  const share = u * u * (3 - 2 * u);
  let joints: IAutoMovieMotionHumanPosture["joints"] | undefined;
  for (const bone of ARMS) {
    if (
      source.joints[bone] === undefined ||
      (channels !== undefined && !motionHumanChannel.covers(channels, bone))
    )
      continue;
    const a = endpoints[0][bone]!;
    const b = endpoints[1][bone]!;
    (joints ??= { ...source.joints })[bone] = [
      arc(a[0], b[0], share),
      arc(a[1], b[1], share),
      arc(a[2], b[2], share),
    ];
  }
  return joints === undefined ? source : { ...source, joints };
}

function arc(a: number, b: number, share: number): number {
  return a + (((((b - a + 180) % 360) + 360) % 360) - 180) * share;
}

function turn(a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): number {
  return (
    1 - Math.min(1, Math.abs(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w))
  );
}

const SIDES = ["left", "right"] as const;
const ARMS = [
  "leftUpperArm",
  "leftLowerArm",
  "leftHand",
  "rightUpperArm",
  "rightLowerArm",
  "rightHand",
] as const;
type ISiteReader = (
  side: AutoMovieHumanSide,
  posture: IAutoMovieMotionHumanPosture,
  seconds: number,
) => ReturnType<IAutoMovieMotionHumanPlaced.IArm["place"]>;
type IEnds = readonly [
  IAutoMovieMotionHumanPosture["joints"],
  IAutoMovieMotionHumanPosture["joints"],
];
interface IEnvelope {
  point: number;
  turn: number;
  step: number;
}
