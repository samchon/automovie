import type {
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieBone,
  IAutoMovieGazeChainJoints,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import { getConstraint } from "../../rom/internal/getConstraint";
/*
 * Shared gaze-chain implementation used by the Kinematics owner.
 */
export const gazeChainJointsImplementation: IGazeChainJointsImplementation = {
  run: runGazeChainJoints,
  prepare: prepareGazeChainJoints,
};

interface IGazeChainJointsImplementation {
  run(props: IAutoMovieGazeChainJoints.IProps): IAutoMovieJointPose[];
  prepare(
    rig: IAutoMovieSkeleton | null,
  ): (flexionDeg: number, twistDeg: number) => IAutoMovieJointPose[];
}

/*
 * The bone a gaze is expressed on: the last link, and the one the eyes ride.
 */
const HEAD: AutoMovieHumanoidBone = "head";

/*
 * The bone that carries whatever the head cannot hold legally.
 */
const NECK: AutoMovieHumanoidBone = "neck";

/*
 * Distribute one solved aim over the gaze chain, `neck` then `head`, so a gaze
 * the rig's declared ranges can hold compiles inside them.
 *
 * The head takes as much of each axis as its range holds, since its rotation
 * points the eyes, and the neck takes what remains up to its own range. An aim
 * the head holds alone therefore compiles to the single `head` joint, and the
 * neck appears only when it carries something. Whatever neither range can hold
 * stays on the head unclamped, so the shot's ROM gate reports the head
 * overshooting by exactly the amount the whole chain falls short, as an
 * impossible reach does; bending the aim into range would point the actor
 * somewhere it was never told to look.
 *
 * Splitting relies on the two joints' angles adding along the chain. Both use
 * the default clinical basis, so this holds exactly for a split on one axis
 * when the head rests unrotated relative to the neck, as the canonical humanoid
 * does. Flexion and twist split together compose two non-commuting rotations,
 * so the combined aim then differs slightly from the single-bone aim.
 *
 * The aim stays on the single `head` joint when there is no rig (`null`; the
 * perform-shot ROM gate does not run for a rig-less actor), when the rig
 * declares no `head` or `neck`, or when the head's parent is not the neck,
 * because rotating a neck the head does not hang from would not move the head.
 * A missing per-bone constraint falls back to the default humanoid ROM, as the
 * gate does.
 * Parameter props.rig: The actor's resolved skeleton, or `null` when it has none.
 * Parameter props.flexionDeg: Sagittal aim in degrees, `+` down, matching the pose
 * axis.
 * Parameter props.twistDeg: Transverse aim in degrees about the chain's long axis.
 * Returns: The joints of the aim pose, parent first; abduction is always
 * `null`, and a neck axis that carries nothing is `null`.
 */
function runGazeChainJoints(
  props: IAutoMovieGazeChainJoints.IProps,
): IAutoMovieJointPose[] {
  const headBone: IAutoMovieBone | null = props.rig?.bones.find(isHead) ?? null;
  const neckBone: IAutoMovieBone | null = props.rig?.bones.find(isNeck) ?? null;
  if (headBone === null || neckBone === null || headBone.parent !== NECK)
    return single(props);

  const headRom: Constraint = getConstraint(HEAD, headBone.constraint)!;
  const neckRom: Constraint = getConstraint(NECK, neckBone.constraint)!;
  return resolved(props, headRom, neckRom);
}

/*
 * Fixed-rig preparation for the same canonical cervical distribution.
 */
/*
 * Bind one unchanged rig for repeated actual clinical-degree aims.
 * Parameter rig: The unchanged resolved skeleton, or null for the original
 * single-head policy.
 * Returns: Fresh parent-first joints at every flexion/twist pair. Rig
 * structure and constraints are first demanded by an actual query; each
 * axis and only its used min/max bound is captured on first actual need,
 * after which that metadata must remain unchanged.
 *
 * Defines fixed rig/ROM lifetime, degree signs inherited from
 * gazeChainJoints, lazy first-use admission, original fallback and fresh
 * outputs. The same greedy head-first capacity and unclamped residual owner
 * distributes every current axis. Fixed topology selects the same
 * head/neck/default constraints, with null axes immobile and a missing or
 * disconnected chain retaining the single-head result. One lazy cervical
 * source preparation feeds the shared raw numerical owner; private lazy
 * range snapshots preserve first-needed axis/bound order without a second
 * split algorithm. Original null/fallback/parent rules, shareOf formulas,
 * residuals, nullable neck axes and output order remain. Unused bounds are
 * not eagerly read, failed field reads are not retained, and no aim is
 * clamped to hide insufficient combined range. Two O(B) bone searches and
 * constraint selection run once across Q aims; at most four axis references
 * and eight min/max scalar observations are prepared lazily. Each query
 * retains fixed scalar arithmetic and fresh output joints, with no measured
 * speedup claim. This explicit API requires the rig/default cervical
 * metadata to stay unchanged. Only topology and first-observed range
 * prerequisites are shared; each flexion/twist request is evaluated afresh
 * and no joint, pose, direction, target or time answer is reused. The
 * caller owns one reader, its fixed rig and at most two constraints/four
 * range snapshots/eight bound scalars until release. Queries add no
 * retained aim, output, dynamic workspace or growing history.
 */
function prepareGazeChainJoints(
  rig: IAutoMovieSkeleton | null,
): (flexionDeg: number, twistDeg: number) => IAutoMovieJointPose[] {
  let known: { head: Constraint; neck: Constraint } | null | undefined;
  return (flexionDeg: number, twistDeg: number): IAutoMovieJointPose[] => {
    if (known === undefined) {
      const head: IAutoMovieBone | null = rig?.bones.find(isHead) ?? null;
      const neck: IAutoMovieBone | null = rig?.bones.find(isNeck) ?? null;
      known =
        head === null || neck === null || head.parent !== NECK
          ? null
          : {
              head: fixedConstraint(getConstraint(HEAD, head.constraint)!),
              neck: fixedConstraint(getConstraint(NECK, neck.constraint)!),
            };
    }
    const current: IAngles = { flexionDeg, twistDeg };
    return known === null
      ? single(current)
      : resolved(current, known.head, known.neck);
  };
}

/*
 * How much of `need` one joint may legally take on one axis.
 *
 * A `null` range is **immobile**, not unconstrained: `validateJointRom` refuses
 * any non-zero value on an axis whose range is null ("does not move in twist;
 * this axis must be null or 0"), so such a joint's capacity is exactly zero.
 *
 * The share never overshoots and never flips sign, so a range that excludes
 * zero (a rig whose neck rests bent) cannot inject rotation the aim did not ask
 * for: a zero need always yields a zero share.
 */
function shareOf(need: number, range: IAutoMovieAngleRange | null): number {
  if (range === null) return 0;
  return need >= 0
    ? Math.min(need, Math.max(range.max, 0))
    : Math.max(need, Math.min(range.min, 0));
}

/*
 * Original degree inputs, read only when the selected branch actually needs
 * them.
 */
interface IAngles {
  flexionDeg: number;
  twistDeg: number;
}

/*
 * Only these two axes participate in the existing gaze-chain law.
 */
type Constraint = Pick<IAutoMovieJointConstraint, "flexion" | "twist">;

/*
 * Original first-match head predicate, without a per-query closure.
 */
function isHead(entry: IAutoMovieBone): boolean {
  return entry.bone === HEAD;
}

/*
 * Original first-match neck predicate, without a per-query closure.
 */
function isNeck(entry: IAutoMovieBone): boolean {
  return entry.bone === NECK;
}

/*
 * Preserve the original missing/disconnected-chain head-only field read order.
 */
function single(props: IAngles): IAutoMovieJointPose[] {
  return [
    {
      bone: HEAD,
      flexion: props.flexionDeg,
      abduction: null,
      twist: props.twistDeg,
    },
  ];
}

/*
 * Each actual flexion finishes its residual before the twist getter is read.
 */
function resolved(
  props: IAngles,
  headRom: Constraint,
  neckRom: Constraint,
): IAutoMovieJointPose[] {
  const flexion: number = props.flexionDeg;
  const headFlexion: number = shareOf(flexion, headRom.flexion);
  const neckFlexion: number = shareOf(flexion - headFlexion, neckRom.flexion);
  const flexionResidual: number = flexion - neckFlexion;
  const twist: number = props.twistDeg;
  const headTwist: number = shareOf(twist, headRom.twist);
  const neckTwist: number = shareOf(twist - headTwist, neckRom.twist);
  const twistResidual: number = twist - neckTwist;
  const head: IAutoMovieJointPose = {
    bone: HEAD,
    flexion: flexionResidual,
    abduction: null,
    twist: twistResidual,
  };
  return neckFlexion !== 0 || neckTwist !== 0
    ? [
        {
          bone: NECK,
          flexion: neckFlexion === 0 ? null : neckFlexion,
          abduction: null,
          twist: neckTwist === 0 ? null : neckTwist,
        },
        head,
      ]
    : [head];
}

/*
 * Capture only the actual axis reference first requested by the shared split.
 */
function fixedConstraint(source: Constraint): Constraint {
  let flexion: IAutoMovieAngleRange | null = null;
  let twist: IAutoMovieAngleRange | null = null;
  let hasFlexion: boolean = false;
  let hasTwist: boolean = false;
  return {
    get flexion(): IAutoMovieAngleRange | null {
      if (!hasFlexion) {
        flexion = fixedRange(source.flexion);
        hasFlexion = true;
      }
      return flexion;
    },
    get twist(): IAutoMovieAngleRange | null {
      if (!hasTwist) {
        twist = fixedRange(source.twist);
        hasTwist = true;
      }
      return twist;
    },
  };
}

/*
 * A positive/negative request admits only the original max/min field it uses.
 */
function fixedRange(
  source: IAutoMovieAngleRange | null,
): IAutoMovieAngleRange | null {
  if (source === null) return null;
  let minimum: number = 0;
  let maximum: number = 0;
  let hasMinimum: boolean = false;
  let hasMaximum: boolean = false;
  return {
    get min(): number {
      if (!hasMinimum) {
        minimum = source.min;
        hasMinimum = true;
      }
      return minimum;
    },
    get max(): number {
      if (!hasMaximum) {
        maximum = source.max;
        hasMaximum = true;
      }
      return maximum;
    },
  };
}
