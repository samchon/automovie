import {
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieBone,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import { getConstraint } from "../rom/getConstraint";

/** The bone a gaze is expressed on: the last link, and the one the eyes ride. */
const HEAD: AutoMovieHumanoidBone = "head";

/** The bone that carries whatever the head cannot hold legally. */
const NECK: AutoMovieHumanoidBone = "neck";

/**
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
const shareOf: (need: number, range: IAutoMovieAngleRange | null) => number = (
  need: number,
  range: IAutoMovieAngleRange | null,
): number => {
  if (range === null) return 0;
  return need >= 0
    ? Math.min(need, Math.max(range.max, 0))
    : Math.max(need, Math.min(range.min, 0));
};

/**
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
 *
 * @param props.rig The actor's resolved skeleton, or `null` when it has none.
 * @param props.flexionDeg Sagittal aim in degrees, `+` down, matching the pose
 *   axis.
 * @param props.twistDeg Transverse aim in degrees about the chain's long axis.
 * @returns The joints of the aim pose, parent first; abduction is always
 *   `null`, and a neck axis that carries nothing is `null`.
 *
 * @evidence contracts/common.md#principled-implementation A greedy head-first split per axis bounded by each declared range, where `shareOf` never overshoots or flips sign; it relies on angles about the same default-basis axis adding along a parent-child chain, which is exact for one axis when the head rests unrotated under the neck, and the stated limitation is that a simultaneous flexion and twist split composes non-commuting rotations.
 * @evidence contracts/common.md#clear-and-simple-design The actor synthesizer solves the aim angles with `aimYawPitch` and this function only decides which joints carry them; ROM lookup goes through the shared `getConstraint`, so the split and the gate read the same ranges.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The residual is left on the head for the gate to report instead of being clamped, and the single-bone fallbacks follow from the rig's structure, not from a named rig or shot.
 * @evidence contracts/common.md#meaningful-documentation States the head-first order, the unclamped residual and why, the additivity premise and its limitation, every fallback to the single head joint including the parent requirement, the ROM fallback, and each parameter's unit and sign.
 * @evidence contracts/performance.md#efficient-algorithms Two linear searches of the rig's bones and constant arithmetic for two axes; it allocates only the returned joints.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of one aim and rig that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned joints.
 * @author Samchon
 */
export const gazeChainJoints: (props: {
  rig: IAutoMovieSkeleton | null;
  flexionDeg: number;
  twistDeg: number;
}) => IAutoMovieJointPose[] = (props: {
  rig: IAutoMovieSkeleton | null;
  flexionDeg: number;
  twistDeg: number;
}): IAutoMovieJointPose[] => {
  const declared: (bone: AutoMovieHumanoidBone) => IAutoMovieBone | null = (
    bone: AutoMovieHumanoidBone,
  ): IAutoMovieBone | null =>
    props.rig?.bones.find(
      (entry: IAutoMovieBone): boolean => entry.bone === bone,
    ) ?? null;
  const headBone: IAutoMovieBone | null = declared(HEAD);
  const neckBone: IAutoMovieBone | null = declared(NECK);
  if (headBone === null || neckBone === null || headBone.parent !== NECK)
    return [
      {
        bone: HEAD,
        flexion: props.flexionDeg,
        abduction: null,
        twist: props.twistDeg,
      },
    ];

  // Both cervical bones sit in `DEFAULT_HUMANOID_ROM`, so a declared bone
  // always resolves to a constraint: the override when the rig states one, the
  // canonical table otherwise, which is the same fallback the ROM gate applies.
  const headRom: IAutoMovieJointConstraint = getConstraint(
    HEAD,
    headBone.constraint,
  )!;
  const neckRom: IAutoMovieJointConstraint = getConstraint(
    NECK,
    neckBone.constraint,
  )!;
  const split: (
    need: number,
    axis: "flexion" | "twist",
  ) => { head: number; neck: number } = (
    need: number,
    axis: "flexion" | "twist",
  ): { head: number; neck: number } => {
    const onHead: number = shareOf(need, headRom[axis]);
    const onNeck: number = shareOf(need - onHead, neckRom[axis]);
    // The residual rides the head: see the unclamped-failure note above.
    return { head: need - onNeck, neck: onNeck };
  };
  const flexion: { head: number; neck: number } = split(
    props.flexionDeg,
    "flexion",
  );
  const twist: { head: number; neck: number } = split(props.twistDeg, "twist");

  return [
    // The neck joins the pose only when it carries something, so an aim the
    // head holds on its own is byte-identical to the single-bone pose.
    ...(flexion.neck !== 0 || twist.neck !== 0
      ? [
          {
            bone: NECK,
            flexion: flexion.neck === 0 ? null : flexion.neck,
            abduction: null,
            twist: twist.neck === 0 ? null : twist.neck,
          },
        ]
      : []),
    { bone: HEAD, flexion: flexion.head, abduction: null, twist: twist.head },
  ];
};
