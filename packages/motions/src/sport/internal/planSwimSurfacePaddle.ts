import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanExerciseKey,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { ExerciseKey } from "../../exercise/internal/ExerciseKey";
import { HumanPreparedPlayback } from "../../perform/internal/HumanPreparedPlayback";

/*
 * Front paddle travels on the surface with short alternating submerged
 * reaches and pulls, and alternating kicks from the hip. The Swimming
 * Teachers' Association describes front paddle and vertical treading
 * separately (School Swimming Manual, Beginner, lessons 2 and 3,
 * https://www.sta.co.uk/wp-content/uploads/2017/05/STA-School-Swimming-Manual.pdf).
 * The trim, cadence, travel and clearance model a short film passage and
 * have no measured speed calibration. Falter is one authored loss of rhythm,
 * followed by a chance to breathe and continue in another surface action.
 */
export function planSwimSurfacePaddle(
  props: IProps,
): IAutoMovieMotionHumanActionPlan {
  const { body, entry, water, tempo, turn } = props;
  const reach = ExerciseKey.from(
    body,
    { pitch: 67, neck: -37 },
    { ankle: -25, raise: 20 },
    { shoulder: 32, elbow: 76, hip: 12, knee: 29 },
    { shoulder: 91, elbow: 25, hip: -6, knee: 13 },
  );
  const pull = ExerciseKey.from(
    body,
    { pitch: 67, neck: -37 },
    { ankle: -25, raise: 20 },
    { shoulder: 56, elbow: 83, hip: -5, knee: 14 },
    { shoulder: 52, elbow: 47, hip: 14, knee: 32 },
  );
  const phases: readonly IPhase[] = props.falter
    ? [
        { share: 0, key: reach, air: 0.03 },
        { share: 0.31, key: pull, air: 0.022 },
        {
          share: DIP,
          key: ExerciseKey.from(
            body,
            { pitch: 52, roll: 13, neck: -20 },
            { ankle: -20, raise: 28 },
            { shoulder: 66, elbow: 86, hip: 26, knee: 49 },
            { shoulder: 21, elbow: 55, hip: 5, knee: 34 },
          ),
          air: -0.025,
        },
        { share: 0.8, key: ExerciseKey.mirror(reach), air: 0.025 },
        { share: 1, key: ExerciseKey.mirror(pull), air: 0.035 },
      ]
    : [
        { share: 0, key: reach, air: 0.025 },
        { share: 0.25, key: pull, air: 0.03 },
        { share: 0.5, key: ExerciseKey.mirror(reach), air: 0.025 },
        { share: 0.75, key: ExerciseKey.mirror(pull), air: 0.03 },
        { share: 1, key: reach, air: 0.025 },
      ];
  const spans = phases.slice(1).map((to, index) => {
    const from = phases[index]!;
    return { from, to, blend: ExerciseKey.prepareBlend(from.key, to.key) };
  });
  const last = spans[spans.length - 1]!;
  const period: number = (props.falter ? 1.65 : 1.1) * tempo;
  const duration: number = period * props.cycles;
  const course: number = props.falter ? 0 : props.cycles * TRAVEL_PER_CYCLE;
  const radians = (degrees: number): number => (degrees * Math.PI) / 180;
  const mouth = HumanTrunk.preparePoint(body, "mouth");
  const posture: IAutoMovieMotionHumanActionPlan["posture"] = (
    seconds,
    _channels,
    resolution,
    projection,
  ) => {
    const t: number = Math.max(0, Math.min(duration, seconds));
    const elapsed: number = t / period;
    const phase: number = props.falter
      ? elapsed
      : elapsed - Math.floor(elapsed);
    const span = spans.find(({ to }) => phase <= to.share) ?? last;
    const blend: number = AutoMovieEngineMotionSampling.minimumJerkShare(
      Math.min(
        1,
        (phase - span.from.share) / (span.to.share - span.from.share),
      ),
    );
    const progress: number = t / duration;
    const headed: number = turn * progress;
    // The chord of a constant-curvature path lies along the midpoint heading.
    const half: number = radians(headed) / 2;
    const along: number = radians(entry.yaw) + half;
    const distance: number =
      course * progress * (half === 0 ? 1 : Math.sin(half) / half);
    const hip: IAutoMovieVector3 = {
      x: entry.root.x + Math.sin(along) * distance,
      y: water,
      z: entry.root.z + Math.cos(along) * distance,
    };
    const posed: IAutoMovieMotionHumanPosture = ExerciseKey.pinned(
      body,
      span.blend(blend),
      entry.yaw + headed,
      HIPS,
      hip,
      HIP_BONES,
      resolution,
      projection,
    );
    const clearance: number =
      span.from.air + (span.to.air - span.from.air) * blend;
    return {
      ...posed,
      root: {
        ...posed.root,
        y: posed.root.y + water + clearance - mouth(posed, resolution).y,
      },
    };
  };
  const events: IAutoMovieMotionEvent[] = props.falter
    ? [
        { name: "falter", share: 0.31 },
        { name: "dip", share: DIP },
        { name: "breath", share: 0.8 },
      ]
    : Array.from({ length: props.cycles }, (_, i): IAutoMovieMotionEvent[] => [
        { name: "reachRight" + (i + 1), share: i / props.cycles },
        { name: "reachLeft" + (i + 1), share: (i + 0.5) / props.cycles },
        { name: "breath" + (i + 1), share: (i + 0.75) / props.cycles },
      ]).flat();
  events.push({ name: "relax", share: 1 });
  const plan: IAutoMovieMotionHumanActionPlan = {
    duration,
    contacts: [],
    events,
    posture,
  };
  HumanPreparedPlayback.attach(plan, body, {
    mode: "posture",
    phases: [
      {
        from: 0,
        to: duration,
        sample: (...args) => ({ posture: posture(...args) }),
      },
    ],
  });
  return plan;
}

interface IProps {
  body: IAutoMovieMotionHumanBody;
  entry: IAutoMovieMotionHumanPosture;
  water: number;
  tempo: number;
  cycles: number;
  turn: number;
  falter: boolean;
}

interface IPhase {
  share: number;
  key: IAutoMovieMotionHumanExerciseKey.IKey;
  air: number;
}

const TRAVEL_PER_CYCLE = 0.6;
const DIP = 0.58;
const HIPS: readonly AutoMovieHumanoidBone[] = [
  "leftUpperLeg",
  "rightUpperLeg",
];
const HIP_BONES: ReadonlySet<AutoMovieHumanoidBone> = new Set(HIPS);
