import { AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionTarget,
} from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import { HumanPerformance } from "../../perform/HumanPerformance";
import { HumanColliders } from "../../posture/HumanColliders";
import { StrikingLimb } from "./StrikingLimb";
import type { StrikingVerdicts } from "./StrikingVerdicts";

/**
 * The striking scenarios of the capture, authored for two bodies: subject `a`
 * at the origin facing +Z and subject `b` a gap ahead, facing back.
 *
 * - `striking-jab-cover`: the forced in-time cover. The average-body fixture
 *   refuses the requested outcome at admission.
 * - `striking-observed-cover`: the average-body rehearsal with an unforced cover.
 *   First contact precedes the defender's movement.
 * - `striking-crosses`: both throw a rear straight at once; what each meets comes
 *   from the geometry, so nothing is declared.
 * - `striking-kicks`: an orthodox right round kick and a southpaw left round kick
 *   thrown at once, each meeting the trunk, the guard or the other leg.
 * - `striking-redirect`: a middle round kick redirected before its chamber key
 *   into a high kick at the jaw, meeting the head or the guard, with the
 *   uninterrupted middle kick as a ghost and the same redirect cut after the
 *   chamber key, which must be refused.
 * - `striking-fooled`: a cover bitten on a jab feint, the real cross landing on
 *   the head.
 * - `striking-knee`: a rear knee to the abdomen from clinch range, meeting the
 *   trunk or the guard.
 * - `striking-air`: a jab and a high round kick at no target, by `a` alone.
 *
 * Every gap comes from the bodies. A punching or kicking range is a share of
 * the striker's bare limb length, of the shorter limb when both strike, so each
 * body stands where its own limb works; the shares are provisional readings
 * that put the tall man where the fixed gaps of the first captures had him (1.1
 * and 1.0 m). The clinch range is the gap at which the two guards just touch.
 *
 * @param A Subject `a`'s body.
 * @param B Subject `b`'s body.
 * @returns Each scenario by its family name, built on demand.
 */
export function strikingScenarios(
  A: IAutoMovieMotionHumanBody,
  B: IAutoMovieMotionHumanBody,
): Record<string, () => strikingScenarios.IScenario> {
  const faceB: IAutoMovieMotionTarget = {
    kind: "person",
    subject: "b",
    region: "face",
  };
  const faceA: IAutoMovieMotionTarget = {
    kind: "person",
    subject: "a",
    region: "face",
  };
  const guardA = (): IAutoMovieMotionHumanChain =>
    HumanChain.subject("a").act("guard", { duration: 0.8, facing: faceB });
  const guardB = (seconds: number = 0.8): IAutoMovieMotionHumanChain =>
    HumanChain.subject("b").act("guard", { duration: seconds, facing: faceA });
  const jab = (): IAutoMovieMotionHumanChain =>
    guardA().act("punch", { technique: "straight", at: faceB }, "jab");
  const arm = (body: IAutoMovieMotionHumanBody): number =>
    StrikingLimb.length(body, "leftHand", false);
  const leg = (body: IAutoMovieMotionHumanBody): number =>
    StrikingLimb.length(body, "leftFoot", false);
  const middle = (): IAutoMovieMotionHumanChain =>
    guardA().act(
      "kick",
      {
        technique: "round",
        at: { kind: "person", subject: "b", region: "ribsLeft" },
      },
      "middle",
    );
  const redirect = (share: number): IAutoMovieMotionHumanChain =>
    middle()
      .until({ type: "share", share })
      .act(
        "kick",
        {
          technique: "round",
          at: { kind: "person", subject: "b", region: "jawLeft" },
        },
        "high",
      );
  return {
    "striking-jab-cover": (): strikingScenarios.IScenario => ({
      a: jab(),
      b: guardB().act("defend", {
        kind: "cover",
        against: "jab",
        outcome: "inTime",
      }),
      gap: strikingScenarios.JAB_RANGE * arm(A),
      ghost: undefined,
      late: undefined,
      meets: { jab: ["guard"] },
    }),
    "striking-observed-cover": (): strikingScenarios.IScenario => ({
      a: jab(),
      b: guardB().act("defend", { kind: "cover", against: "jab" }),
      gap: strikingScenarios.JAB_RANGE * arm(A),
      ghost: undefined,
      late: undefined,
      meets: { jab: ["head"] },
      coverAfterContact: { seed: "striking-jab-cover", strike: "jab" },
    }),
    "striking-crosses": (): strikingScenarios.IScenario => ({
      a: guardA().act(
        "punch",
        { technique: "straight", hand: "rear", at: faceB },
        "crossA",
      ),
      b: guardB().act(
        "punch",
        { technique: "straight", hand: "rear", at: faceA },
        "crossB",
      ),
      gap: strikingScenarios.CROSS_RANGE * Math.min(arm(A), arm(B)),
      ghost: undefined,
      late: undefined,
      meets: {},
    }),
    "striking-kicks": (): strikingScenarios.IScenario => ({
      a: guardA().act(
        "kick",
        {
          technique: "round",
          at: { kind: "person", subject: "b", region: "ribsLeft" },
        },
        "kickA",
      ),
      b: HumanChain.subject("b")
        .act("guard", { duration: 0.8, stance: "southpaw", facing: faceA })
        .act(
          "kick",
          {
            technique: "round",
            at: { kind: "person", subject: "a", region: "ribsRight" },
          },
          "kickB",
        ),
      gap: strikingScenarios.KICK_RANGE * Math.min(leg(A), leg(B)),
      ghost: undefined,
      late: undefined,
      meets: {
        kickA: ["trunk", "guard", "leg"],
        kickB: ["trunk", "guard", "leg"],
      },
    }),
    "striking-redirect": (): strikingScenarios.IScenario => ({
      a: redirect(0.15),
      b: guardB(3),
      gap: strikingScenarios.REDIRECT_RANGE * leg(A),
      ghost: middle(),
      late: redirect(0.35),
      meets: { high: ["head", "guard"] },
    }),
    "striking-fooled": (): strikingScenarios.IScenario => ({
      a: guardA()
        .act("punch", { technique: "straight", at: faceB, feint: 0.5 }, "fake")
        .act(
          "punch",
          { technique: "straight", hand: "rear", at: faceB },
          "real",
        ),
      b: guardB().act("defend", {
        kind: "cover",
        against: "fake",
        outcome: "inTime",
      }),
      gap: strikingScenarios.CROSS_RANGE * arm(A),
      ghost: undefined,
      late: undefined,
      meets: { real: ["head"] },
    }),
    "striking-knee": (): strikingScenarios.IScenario => ({
      a: guardA().act("knee", {
        at: { kind: "person", subject: "b", region: "abdomen" },
      }),
      b: guardB(2),
      gap: touching(A, B, guardA(), guardB()),
      ghost: undefined,
      late: undefined,
      meets: { knee: ["trunk", "guard"] },
    }),
    "striking-air": (): strikingScenarios.IScenario => ({
      a: HumanChain.subject("a")
        .act("guard", { duration: 0.8 })
        .act("punch", {
          technique: "straight",
          at: { kind: "none", line: "high" },
        })
        .act("kick", {
          technique: "round",
          at: { kind: "none", line: "high" },
        }),
      b: undefined,
      gap: 0,
      ghost: undefined,
      late: undefined,
      meets: {},
    }),
  };
}
/**
 * Companion declarations of {@link strikingScenarios}: a scenario's record, the
 * family names and the range shares.
 */
export namespace strikingScenarios {
  /** One scenario. */
  export interface IScenario {
    /** Subject `a`'s chain. */
    a: IAutoMovieMotionHumanChain;

    /** Subject `b`'s chain; undefined when `a` strikes at no one. */
    b: IAutoMovieMotionHumanChain | undefined;

    /** The gap between the two roots along +Z, metres. */
    gap: number;

    /**
     * A chain of `a` drawn as a translucent figure, the uninterrupted source of
     * a redirect.
     */
    ghost: IAutoMovieMotionHumanChain | undefined;

    /** A chain of `a` whose planning must be refused as an illegal cut. */
    late: IAutoMovieMotionHumanChain | undefined;

    /**
     * The part classes each strike is declared to meet, by its segment id; a
     * strike not named may meet any.
     */
    meets: Record<string, readonly StrikingVerdicts.Class[]>;

    /** The comparison seed and strike for an observed cover after contact. */
    coverAfterContact?: { seed: string; strike: string };
  }

  /** Every family name, in capture order. */
  export const FAMILIES: readonly string[] = [
    "striking-jab-cover",
    "striking-crosses",
    "striking-kicks",
    "striking-redirect",
    "striking-fooled",
    "striking-knee",
    "striking-air",
    "striking-observed-cover",
  ];

  /**
   * A jab's range as a share of the bare arm's length; provisional, the tall
   * man's 1.1 m.
   */
  export const JAB_RANGE: number = 1.3;

  /**
   * A rear straight's range as a share of the bare arm's length; provisional,
   * the tall man's 1.0 m.
   */
  export const CROSS_RANGE: number = 1.2;

  /**
   * A round kick's range as a share of the bare leg's length; provisional, the
   * tall man's 1.1 m.
   */
  export const KICK_RANGE: number = 0.9;

  /**
   * A redirected round kick's range as a share of the bare leg's length;
   * provisional, the tall man's 1.0 m.
   */
  export const REDIRECT_RANGE: number = 0.85;
}
/** The alternatives of `TouchingExtentSign`'s site. */
type TouchingExtentSign = 1 | -1;

/**
 * The root gap at which two bodies, each holding its chain's last pose and
 * facing the other along +Z, just touch along that line: posed once two metres
 * apart, the attacker's foremost and the defender's hindmost collider extents
 * along +Z are the exact world bounds of their placed shapes, and the gap
 * closes by their separation.
 */
function touching(
  A: IAutoMovieMotionHumanBody,
  B: IAutoMovieMotionHumanBody,
  a: IAutoMovieMotionHumanChain,
  b: IAutoMovieMotionHumanChain,
): number {
  const apart: number = 2;
  const performance: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "touching",
    performers: [
      {
        subject: "a",
        body: A,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
      {
        subject: "b",
        body: B,
        at: { x: 0, y: 0, z: apart },
        yaw: 180,
        proficiency: { level: "trained" },
      },
    ],
    composition: a.with(b).node,
  });
  const extent = (
    body: IAutoMovieMotionHumanBody,
    subject: string,
    sign: TouchingExtentSign,
  ): number => {
    const seconds: number = performance.segments(subject).at(-1)!.end;
    let most: number = -Infinity;
    for (const { pose, shapes } of HumanColliders.placed(
      body,
      performance.bones(subject, seconds),
    ))
      for (const shape of shapes) {
        const bounds: ReturnType<typeof AutoMovieEnginePhysics.physicalShapeBounds> =
          AutoMovieEnginePhysics.physicalShapeBounds(pose, shape);
        most = Math.max(most, sign === 1 ? bounds.max.z : -bounds.min.z);
      }
    return most;
  };
  const front: number = extent(A, "a", 1);
  const rear: number = -extent(B, "b", -1);
  return apart - (rear - front);
}
