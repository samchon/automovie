import {
  AutoMovieArkitChannel,
  AutoMovieExpressionPreset,
  AutoMovieHumanoidBone,
  IAutoMovieBlendshapeChannel,
  IAutoMovieExpression,
  IAutoMovieJointPose,
  IAutoMovieLookAt,
  type IAutoMovieMotionSample,
} from "@automovie/interface";

import { GAZE_PRESET_CHANNELS } from "../constants/GAZE_PRESET_CHANNELS";

/** One eye's four gaze channels. */
interface IEyeChannels {
  /** Turns the eye up. */
  up: AutoMovieArkitChannel;

  /** Turns the eye down. */
  down: AutoMovieArkitChannel;

  /** Turns the eye toward the nose. */
  in: AutoMovieArkitChannel;

  /** Turns the eye away from the nose. */
  out: AutoMovieArkitChannel;
}

const LEFT: IEyeChannels = {
  up: "eyeLookUpLeft",
  down: "eyeLookDownLeft",
  in: "eyeLookInLeft",
  out: "eyeLookOutLeft",
};

const RIGHT: IEyeChannels = {
  up: "eyeLookUpRight",
  down: "eyeLookDownRight",
  in: "eyeLookInRight",
  out: "eyeLookOutRight",
};

const GAZE_CHANNELS: ReadonlySet<AutoMovieArkitChannel> = new Set([
  ...Object.values(LEFT),
  ...Object.values(RIGHT),
]);

/**
 * Turn the gaze channels of a sampled expression into eye-bone rotations, for a
 * model whose {@link IAutoMovieLookAt} is `"bone"`.
 *
 * Each eye channel's weight is its gaze preset's expansion
 * ({@link GAZE_PRESET_CHANNELS}) times the preset intensity, replaced by the
 * expression's own blendshape for that channel when it lists one, and clamped
 * to `[0, 1]` with a non-finite value read as `0`, the rules the viewer's morph
 * expansion applies. A weight scales the declared range in its direction
 * linearly. Each eye's flexion, positive down, is `down · verticalDown − up ·
 * verticalUp`; its twist, positive toward the model's own left, is `out ·
 * horizontalOuter − in · horizontalInner` on the left eye and `in ·
 * horizontalInner − out · horizontalOuter` on the right, since the left eye
 * looks out toward the left and the right eye looks in. The bone's declared
 * axes, or the host table's, decide what those clinical angles rotate about
 * when the pose is resolved.
 *
 * The turn adds to the angles the pose authors on `leftEye` and `rightEye`; an
 * eye the pose does not author joins it only when its turn is nonzero. The
 * channels move from the expression to the bones: a gaze preset becomes
 * `"neutral"` and the eye channels leave the blendshape list, so morphs and
 * expression sinks no longer receive them.
 *
 * Returns `sample` itself when `lookAt` is absent or `"expression"`, or when
 * the expression carries no gaze channel; otherwise a new sample that shares
 * the untouched joints and root with `sample`.
 *
 * @param sample A sampled pose and expression, as from `sampleMotion`.
 * @param lookAt The model's gaze declaration, or `undefined` for none.
 */
export function resolveLookAt(
  sample: IAutoMovieMotionSample,
  lookAt: IAutoMovieLookAt | undefined,
): IAutoMovieMotionSample {
  const expression: IAutoMovieExpression | null = sample.expression;
  if (lookAt?.type !== "bone" || expression === null) return sample;

  const preset: readonly (readonly [AutoMovieArkitChannel, number])[] | null =
    (
      GAZE_PRESET_CHANNELS as Partial<
        Record<
          AutoMovieExpressionPreset,
          readonly (readonly [AutoMovieArkitChannel, number])[]
        >
      >
    )[expression.preset] ?? null;
  const listed: IAutoMovieBlendshapeChannel[] = (
    expression.blendshapes ?? []
  ).filter((channel: IAutoMovieBlendshapeChannel): boolean =>
    GAZE_CHANNELS.has(channel.channel),
  );
  if (preset === null && listed.length === 0) return sample;

  const weights: Map<AutoMovieArkitChannel, number> = new Map();
  const intensity: number = unit(expression.intensity);
  for (const [channel, factor] of preset ?? [])
    weights.set(
      channel,
      Math.max(weights.get(channel) ?? 0, unit(intensity * factor)),
    );
  for (const channel of listed)
    weights.set(channel.channel, unit(channel.weight));
  const weight: (channel: AutoMovieArkitChannel) => number = (
    channel: AutoMovieArkitChannel,
  ): number => weights.get(channel) ?? 0;

  const flexion: (eye: IEyeChannels) => number = (eye: IEyeChannels): number =>
    weight(eye.down) * lookAt.verticalDown - weight(eye.up) * lookAt.verticalUp;
  const turns: ReadonlyMap<
    AutoMovieHumanoidBone,
    { flexion: number; twist: number }
  > = new Map([
    [
      "leftEye",
      {
        flexion: flexion(LEFT),
        twist:
          weight(LEFT.out) * lookAt.horizontalOuter -
          weight(LEFT.in) * lookAt.horizontalInner,
      },
    ],
    [
      "rightEye",
      {
        flexion: flexion(RIGHT),
        twist:
          weight(RIGHT.in) * lookAt.horizontalInner -
          weight(RIGHT.out) * lookAt.horizontalOuter,
      },
    ],
  ]);

  const joints: IAutoMovieJointPose[] = sample.pose.joints.map(
    (joint: IAutoMovieJointPose): IAutoMovieJointPose => {
      const turn: { flexion: number; twist: number } | undefined = turns.get(
        joint.bone,
      );
      return turn === undefined
        ? joint
        : {
            ...joint,
            flexion: add(joint.flexion, turn.flexion),
            twist: add(joint.twist, turn.twist),
          };
    },
  );
  for (const [bone, turn] of turns)
    if (
      (turn.flexion !== 0 || turn.twist !== 0) &&
      !sample.pose.joints.some(
        (joint: IAutoMovieJointPose): boolean => joint.bone === bone,
      )
    )
      joints.push({
        bone,
        flexion: add(null, turn.flexion),
        abduction: null,
        twist: add(null, turn.twist),
      });

  return {
    pose: { ...sample.pose, joints },
    expression: {
      preset: preset === null ? expression.preset : "neutral",
      intensity: expression.intensity,
      blendshapes:
        expression.blendshapes === null
          ? null
          : expression.blendshapes.filter(
              (channel: IAutoMovieBlendshapeChannel): boolean =>
                !GAZE_CHANNELS.has(channel.channel),
            ),
    },
  };
}

/** Add a turn to an authored angle, keeping `null` (at rest) for no turn. */
const add: (angle: number | null, turn: number) => number | null = (
  angle: number | null,
  turn: number,
): number | null => (angle === null && turn === 0 ? null : (angle ?? 0) + turn);

/** Clamp a weight to `[0, 1]`. */
const unit: (value: number) => number = (value: number): number =>
  Math.max(0, Math.min(1, value));
