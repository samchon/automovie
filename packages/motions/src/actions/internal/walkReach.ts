import { AutoMovieEngineDefaultHumanoidRom, AutoMovieEngineMotionSampling, AutoMovieEngineMath, AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAngleRange,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanWalkFoot,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../../posture/internal/HumanFoot";
import { hipJoints } from "../../posture/internal/hipJoints";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { prepareWalkReachSwing } from "./prepareWalkReachSwing";
import type { walkFoot } from "./walkFoot";
import { walkHipTwist } from "./walkHipTwist";
import { walkLeg } from "./walkLeg";
import { walkReachShort } from "./walkReachShort";
import { walkReachStance } from "./walkReachStance";

/*
 * Makes every foot goal of a stepping gait reachable on the actual pelvis, the
 * footskate cleanup of Kovar, Schreiner and Gleicher (2002): the contacts are
 * enforced by IK, and the root moves so the IK can meet them.
 *
 * `ground` settles the pelvis against the stances. It lowers the root until
 * each stance's ankle is reached with the knee at least `walkReachShort.KNEE`
 * degrees bent and turns the pelvis no further than `TWIST` from each stance's
 * foot (`pelvis`). Each foot claims a lowering (`short`), signed, so a leg with
 * slack claims less than none. A swinging foot claims through the stance it
 * left or the stance it lands in, its claim fading out over the first `FADE` of
 * its swing and in over the last on a minimum-jerk weight (Flash and Hogan
 * 1985), unless the caller names its claim, as a walk does over the second half
 * of a swing (`walkDescent`). The two feet's claims and none at all join in a
 * smooth maximum `CLAIM` wide (the engine's `smoothMinimum`, negated), which
 * never lowers less than either asks, so the pelvis is continuous with its rate
 * through every contact event and where a leg runs out of slack. The stances
 * are placed against the lowered hips, which changes what they claim, so the
 * lowering is the one whose stances claim exactly it, found between none and
 * the first claim by the engine's `bracketedRoot`. Each stance is held by
 * `walkReachStance`: a shank leaning toward the ankle's dorsal limit raises its
 * heel about its ball (`walkLeg.heelRise`, from `walkLeg.ROCKER` of room on),
 * or lowers its toes about its heel in the heel rocker; a thigh that would
 * trail more than `walkReachStance.TRAIL` raises it further; and a foot pivots
 * on its toe pad by the pelvis's turn beyond `TWIST`, in proportion to its
 * heel's rise up to `HEEL_UP`, the pivot of a stepping turn. The hip joints are
 * read from the pelvis posed by the root, the heading and the pelvis joint, so
 * its rotation and list count.
 *
 * `swing` then holds a swinging foot inside the leg's reach, the hip's
 * extension, the hip's rotation and the ankle's range under that pelvis, and
 * off the floor. A turning pelvis can leave a stance outside them (a trailing
 * foot far behind or aside of its hip at toe-off), so a walk passes the swing's
 * share and the clamps come in over its first `FADE` and go over its last, the
 * swing leaving and joining its stances where they stand.
 */
export namespace walkReach {
  /*
   * A pelvis turned toward its stances, before it is lowered.
   */
  export interface IPelvis {
    /*
     * The heading, degrees.
     */
    yaw: number;

    /*
     * Each foot's pivot turn on its toe pad, degrees.
     */
    pivots: Record<AutoMovieHumanSide, number>;

    /*
     * The hip joints, world metres.
     */
    hips: Record<AutoMovieHumanSide, IAutoMovieVector3>;
  }

  /*
   * The pelvis settled against the stances.
   */
  export interface IGround {
    /*
     * The heading, degrees.
     */
    yaw: number;

    /*
     * The lowered root, world metres.
     */
    root: IAutoMovieVector3;

    /*
     * The hip joints under that root, world metres.
     */
    hips: Record<AutoMovieHumanSide, IAutoMovieVector3>;

    /*
     * Each foot's stance as reached.
     */
    feet: Record<AutoMovieHumanSide, walkFoot.IEnd>;

    /*
     * Each stance's contact point in its foot's frame.
     */
    contacts: Record<AutoMovieHumanSide, IAutoMovieVector3>;

    /*
     * Each foot's pitch as its stance rule reached it, degrees negative toes
     * down (`walkReachStance`): what a prepared course of the stance keeps.
     */
    pitches: Record<AutoMovieHumanSide, number>;

    /*
     * The pelvis's world rotation, where the caller tilts it from upright under
     * its heading (a trunk tipped about the hips,
     * `AutoMovieMotionHumanLean.pivot`), the hip joints then the tilted ones;
     * upright when absent.
     */
    pelvis?: IAutoMovieQuaternion;
  }

  /*
   * The share of a swing over which its foot's claim on the pelvis fades out
   * after toe-off and in before heel strike (provisional).
   */
  export const FADE: number = 0.25;

  /*
   * The difference, metres, under which the claims on the root's height blend
   * (provisional); a foot that asks nothing claims this much less than none, so
   * it leaves the blend alone.
   */
  export const CLAIM: number = 0.01;

  /*
   * A scheduled foot's claim on the pelvis.
   * Parameter foot: The foot.
   * Returns: 1 in stance, fading to 0 in mid-swing.
   */
  export function weight(
    foot: IAutoMovieMotionHumanWalkFoot.IScheduled,
  ): number {
    if (foot.swing === undefined) return 1;
    const u: number = foot.swing.u;
    return u < 0.5
      ? 1 - AutoMovieEngineMotionSampling.minimumJerkShare(Math.min(1, u / FADE))
      : AutoMovieEngineMotionSampling.minimumJerkShare(Math.max(0, (u - (1 - FADE)) / FADE));
  }

  /*
   * The lowering a leg asks of the root at the knee floor
   * (`walkReachShort.short`).
   */
  export const short: typeof walkReachShort.short = walkReachShort.short;

  /*
   * Prepare the fixed body's lowering claims (`walkReachShort.prepare`).
   */
  export const prepareShort: typeof walkReachShort.prepare =
    walkReachShort.prepare;

  /*
   * Turn the pelvis toward its stances: no further than `TWIST` from each
   * claiming foot, a foot with its heel up taking the rest as a pivot turn;
   * feet turned further apart than that, in a stepping turn, hold it between
   * them, each by its claim.
   * Parameter body: The body.
   * Parameter root: The unconstrained root, world metres.
   * Parameter planned: The unconstrained heading, degrees.
   * Parameter hips: The pelvis joint's clinical angles, degrees.
   * Parameter feet: Each foot as scheduled.
   * Parameter resolution: Optional exact FK reader borrowed from this synchronous
   * descent construction; the returned points never retain it.
   * Returns: The heading, the pivots and the hip joints under that root.
   */
  export function pelvis(
    body: IAutoMovieMotionHumanBody,
    root: IAutoMovieVector3,
    planned: number,
    hips: readonly [number, number, number],
    feet: Readonly<
      Record<AutoMovieHumanSide, IAutoMovieMotionHumanWalkFoot.IScheduled>
    >,
    resolution?: ReturnType<typeof AutoMovieEngineKinematics.preparePoseResolution>,
  ): IPelvis {
    const { yaw, pivots }: Pick<IPelvis, Pelvis> = turn(planned, feet);
    return {
      yaw,
      pivots,
      hips: hipJoints(
        body,
        root,
        humanPostureHeading({ yaw, pitch: 0, roll: 0 }),
        hips,
        resolution,
      ),
    };
  }

  /*
   * Read the pelvis heading and stance pivots before any root or hip placement.
   * Parameter planned: The unconstrained heading, degrees.
   * Parameter feet: Each actual scheduled foot and its swing share.
   * Returns: The same heading and toe-pad pivots used by pelvis, in degrees.
   */
  export function turn(
    planned: number,
    feet: Readonly<
      Record<AutoMovieHumanSide, IAutoMovieMotionHumanWalkFoot.IScheduled>
    >,
  ): Pick<IPelvis, TurnResult> {
    const pivots: Record<AutoMovieHumanSide, number> = { left: 0, right: 0 };
    let yaw: number = planned;
    // Each claiming foot's band: its pivoted heading, near the planned one,
    // give or take `TWIST` over its claim.
    type IBand = { centre: number; half: number };
    const bands: IBand[] = [];
    for (const side of SIDES) {
      const w: number = weight(feet[side]);
      if (w <= 0) continue;
      const rotation: IAutoMovieQuaternion = feet[side].placement.rotation;
      const direction: ReturnType<typeof HumanFoot.headingPitch> =
        HumanFoot.headingPitch(rotation);
      const heading: number = direction.heading;
      pivots[side] = pivot(planned, direction);
      bands.push({
        centre: planned + AutoMovieEngineMath.wrapDegrees(heading + pivots[side] - planned),
        half: TWIST / w,
      });
      const turned: number = AutoMovieEngineMath.wrapDegrees(yaw - (heading + pivots[side]));
      if (Math.abs(turned) > TWIST / w)
        yaw -= turned - (Math.sign(turned) * TWIST) / w;
    }
    // Disjoint stance bands hold the pelvis at the nearest heading in their gap.
    if (bands.length === 2) {
      const a: IBand =
        bands[0]!.centre <= bands[1]!.centre ? bands[0]! : bands[1]!;
      const b: IBand = a === bands[0] ? bands[1]! : bands[0]!;
      const upper: number = a.centre + a.half;
      const lower: number = b.centre - b.half;
      if (upper < lower) yaw = Math.min(lower, Math.max(upper, planned));
    }
    return { yaw, pivots };
  }

  /*
   * One scheduled foot's toe pivot, in degrees. Contact classification only
   * needs this foot, whereas pelvis heading depends on both stance bands.
   */
  export function footPivot(
    planned: number,
    foot: IAutoMovieMotionHumanWalkFoot.IScheduled,
  ): number {
    return weight(foot) > 0
      ? pivot(planned, HumanFoot.headingPitch(foot.placement.rotation))
      : 0;
  }

  /*
   * Hold a swinging foot inside its leg's ranges under a settled pelvis: the
   * ankle within reach and no further behind the hip than a thigh `EXTENSION`
   * degrees back and the knee's bend carry it (an ankle past that turns forward
   * onto that boundary at the same hip-to-ankle distance and knee angle), the
   * heading within `TWIST` of the pelvis, the pitch inside the ankle's range,
   * and neither toe nor heel nearer the floor than the swing carried them.
   * Parameter body: The body.
   * Parameter side: The foot.
   * Parameter settled: The pelvis.
   * Parameter foot: The swinging foot.
   * Parameter share: The share of the swing, when the caller's stances may stand
   * outside these ranges (a foot rolled onto its edge, a stance far behind
   * the hip): the ranges then come in over the first `FADE` of the swing and
   * go over its last, so the swing leaves and joins its stances where they
   * stand. Held throughout when absent.
   * Returns: The foot as reached.
   */
  export function swing(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    settled: IGround,
    foot: IAutoMovieMotionHumanWalkFoot.IFoot,
    share?: number,
  ): walkFoot.IEnd {
    return prepareSwing(body, side)(settled, foot, share);
  }

  /*
   * Prepare fixed body and foot geometry for repeated swing-range reads.
   * Parameter body: The action's unchanged body.
   * Parameter side: The swinging foot.
   * Returns: This law's same swing constraints with its fixed bounds prepared.
   */
  export function prepareSwing(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
  ): ReturnType<typeof prepareWalkReachSwing> {
    return prepareWalkReachSwing(body, side, {
      knee: walkReachShort.KNEE,
      extension: EXTENSION,
      side: SIDE,
      twist: TWIST,
      fade: FADE,
    });
  }

  /*
   * Both feet.
   */
  export const SIDES: readonly ["left", "right"] = ["left", "right"];
  /*
   * The largest extension, degrees, of a leg's thigh, swinging or planted: the
   * hip's extension in the range table (`AutoMovieEngineDefaultHumanoidRom`, 30° on either
   * hip, the lesser taken), kept inside by the margin a foot keeps inside its
   * ankle's range (`walkLeg.ANKLE`); the ankle trails further by the knee's
   * bend.
   */
  export const EXTENSION: number =
    Math.min(
      ...(["leftUpperLeg", "rightUpperLeg"] as const).map(
        (bone: EXTENSIONBone): number => {
          const flexion: IAutoMovieAngleRange | null | undefined =
            AutoMovieEngineDefaultHumanoidRom[bone]?.flexion;
          if (flexion === null || flexion === undefined)
            throw new Error(
              `The range-of-motion table gives ${bone} no flexion`,
            );
          return -flexion.min;
        },
      ),
    ) - walkLeg.ANKLE;

  /*
   * The largest heading, degrees, a foot may keep from the pelvis: the hip's
   * own internal and external rotation (`AutoMovieEngineDefaultHumanoidRom`, 45° either way,
   * `walkHipTwist`); a turn that asks more is taken by spinning on the ball of
   * the foot (a spin turn, Hase and Stein 1999).
   */
  export const TWIST: number = walkHipTwist(AutoMovieEngineDefaultHumanoidRom);

  /*
   * The requested toe rotation after consuming the available hip twist.
   */
  function pivot(
    planned: number,
    direction: ReturnType<typeof HumanFoot.headingPitch>,
  ): number {
    const off: number = AutoMovieEngineMath.wrapDegrees(planned - direction.heading);
    const excess: number =
      Math.abs(off) > TWIST ? off - Math.sign(off) * TWIST : 0;
    return excess * Math.min(1, Math.max(0, -direction.pitch / HEEL_UP));
  }

  /*
   * The furthest a swinging leg's line leans to the side of its foot, degrees:
   * the ankle's inversion and eversion (`walkReachStance.SIDE`), the same bound
   * a stance stands inside, so a swing joins its stances where they are.
   */
  const SIDE: number = walkReachStance.SIDE;

  /*
   * Pitch, degrees toes-down, at which a planted foot's heel is far enough up
   * to take the whole pivot turn on its toe pad (provisional).
   */
  const HEEL_UP: number = 30;
}

/*
 * The alternatives of `EXTENSIONBone`'s site.
 */
type EXTENSIONBone = "leftUpperLeg" | "rightUpperLeg";

/*
 * The alternatives of `TurnResult`'s site.
 */
type TurnResult = "yaw" | "pivots";

/*
 * The alternatives of `Pelvis`'s site.
 */
type Pelvis = "yaw" | "pivots";
