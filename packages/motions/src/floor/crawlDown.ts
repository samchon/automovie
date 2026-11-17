import { Vector3, bracketedRoot, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { HumanBalance } from "../everyday/HumanBalance";
import { kneelKeys } from "../everyday/kneelKeys";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { hipJoints } from "../posture/hipJoints";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { crawlFeet } from "./crawlFeet";
import { crawlFrame } from "./crawlFrame";
import { floorEntry } from "./floorEntry";

/**
 * The way down from standing onto the hands and the knees, or onto the hands
 * and the feet of a bear crawl, as the supports take the body one after
 * another.
 *
 * Each foot rolls onto its toes where it stood (`crawlFeet.rolled`), into
 * the tucked foot the crawl kneels on, so no sole contact slides and no toe
 * sinks. Until a second support bears, the feet
 * alone carry the body, so the centre of mass must stay over them: the body
 * first sits down onto its knees with the trunk upright, the hips as far back
 * over the feet as balance asks (`HumanBalance.shift`) and the knee's sitting
 * flexion lets (`kneelKeys.SIT`). With the knees down, the feet and the knees
 * bear, so the trunk leans until the palms reach their places, the shoulders
 * as far from the wrists as the crawl holds them, with the hips as far back
 * as keeps the centre of mass behind the knees. With the hands down the
 * hips come forward over the knees into the crawl. A bear crawl comes down
 * the same way, as it is cued from all fours, its knees stopping where it
 * holds them over the floor. The knees and the hands land side by side, the
 * symmetric stance the crawl's first steps leave from.
 *
 * Between these states the joints and the trunk's lean are carried in joint
 * space and the hips by how far back they sit, each stretch on its own
 * minimum-jerk progress, so each support lands at rest. The sit takes the
 * time it is given and the other stretches go at its pace, each in proportion
 * to how far the limbs' joints travel over it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the order the supports take the body, why, the balance condition at each state, the joint-space carry between them and how the time is shared.
 * @evidence contracts/development/design.md#principled-representation The way down as the states at which a support lands, each solved on the body against the support that bears before it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One builder and its record, read by the crawl.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No share of the time or the way is typed; every state follows from the supports, the balance owner and the knee's sitting flexion, and every stretch's time from the sit's pace.
 */
export namespace crawlDown {
  /**
   * What the way down is built from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, frame and unit.
   * @evidence contracts/development/design.md#principled-representation The standing start, the crawl's posture as a function of how far back its hips sit and how far its trunk leans, and the supports' places.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Seven members, all read by `of`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The crawl's own posture is passed, not rebuilt here.
   */
  export interface IProps {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The standing posture the body gets down from, its feet on their goals. */
    standing: IAutoMovieMotionHumanPosture;

    /** The pose the entry displays, whose arms the way down starts from. */
    entry: IAutoMoviePose;

    /** Seconds the sit onto the knees takes; the rest of the way down goes at its pace. */
    sit: number;

    /**
     * The crawl's posture where the way down ends, its hips `back` metres
     * behind their place over the knees and its trunk at `lean` of its pitch,
     * the feet tucked on their goals and the palms on theirs.
     *
     * @param base The posture the row is written over.
     * @param back Metres the hips sit back along the heading.
     * @param lean The share of the crawl's pitch the trunk leans by.
     * @param palms Whether the palms are laid on their places; true when absent, and false where only the trunk and the legs are read.
     * @returns The posture.
     */
    kneeling(
      base: IAutoMovieMotionHumanPosture,
      back: number,
      lean: number,
      palms?: boolean,
    ): IAutoMovieMotionHumanPosture;

    /** The crawl's trunk pitch, degrees. */
    pitch: number;

    /** Each foot tucked behind its knee where the way down ends. */
    tucks: Record<"left" | "right", crawlFeet.ITuck>;
  }

  /**
   * The way down built.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The posture at a second, the instant the hands land, which the crawl's plant windows start at, and the way down's length, which its clock starts the crawl at.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, all read by the crawl.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The landing is solved with the posture, so the two agree.
   */
  export interface IDown {
    /** The posture over a base at a second before the way down ends. */
    write(
      base: IAutoMovieMotionHumanPosture,
      seconds: number,
    ): IAutoMovieMotionHumanPosture;

    /** The second the hands land. */
    hands: number;

    /** The seconds the way down takes. */
    seconds: number;
  }

  /**
   * Build the way down.
   *
   * @param props What it is built from.
   * @returns The way down.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the result; the namespace gives the law.
   * @evidence contracts/development/implementation.md#principled-implementation The sitting state is the balance owner's shift over the feet, bounded by the knee's sitting flexion and by the knees landing on their places; the leaning state is the lean that puts the shoulders an arm from the wrists, at the back that keeps the centre of mass behind the knees found by the engine's bracketed root; joint-space carries join them.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The states solved once, then one carry per stretch.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Each foot rolls about its standing contact, never lerped; a state no back balances keeps the nearest one.
   * @evidence contracts/development/implementation.md#efficient-algorithms The states are solved once, when the way down is built: one balance shift and a bracketed root of lean bisections; each second then costs one posture build and the arm's palm goals.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the crawl's posture, `HumanBalance`, `bracketedRoot`, `crawlFeet.rolled` and `crawlFrame`'s arm blend and root.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds the solved states for the plan's life.
   */
  export function of(props: IProps): IDown {
    const body: IAutoMovieMotionHumanBody = props.body;
    const m = body.measure;
    const sides = ["left", "right"] as const;
    const S: IAutoMovieMotionHumanPosture = props.standing;
    const crawling: IAutoMovieMotionHumanPosture = props.kneeling(S, 0, 1);
    // Each tucked foot where the way down ends, carried with its knee.
    const feet = (side: "left" | "right"): kneelKeys.IFoot => ({
      ...props.tucks[side].foot,
      at: Vector3.add(
        crawling.limbs[`${side}Leg`]!.bend,
        props.tucks[side].offset,
      ),
    });
    const holding: Record<
      "left" | "right",
      IAutoMovieMotionHumanArmAngles.IAngles
    > = {
      left: AutoMovieMotionHumanArm.angles(props.entry, "left"),
      right: AutoMovieMotionHumanArm.angles(props.entry, "right"),
    };
    const forward: IAutoMovieVector3 = HumanFrame.forward(S.yaw);
    const along = (p: IAutoMovieVector3): number => Vector3.dot(p, forward);
    const middle = (pair: Record<"left" | "right", IAutoMovieVector3>) =>
      Vector3.lerp(pair.left, pair.right, 0.5);
    const hipsOf = (posture: IAutoMovieMotionHumanPosture): IAutoMovieVector3 =>
      middle(
        hipJoints(
          body,
          posture.root,
          resolveHumanPosture.heading(posture),
          posture.joints.hips,
        ),
      );
    const shouldersOf = (
      posture: IAutoMovieMotionHumanPosture,
    ): IAutoMovieVector3 => {
      const bones = poseBones(body, resolveHumanPosture(body, posture));
      return Vector3.lerp(
        bones.get("leftUpperArm")!.worldPosition,
        bones.get("rightUpperArm")!.worldPosition,
        0.5,
      );
    };

    // Each standing foot rolled onto its toes (`crawlFeet.rolled`), what
    // the roll leaves short of the tucked foot taken up on the way.
    const roll = (side: "left" | "right", share: number) => {
      const goal: IAutoMovieHumanLimbGoal = S.limbs[`${side}Leg`]!;
      return crawlFeet.rolled(
        body,
        side,
        {
          ankle: goal.point,
          rotation: goal.rotation ?? HumanFrame.turn(S.yaw),
        },
        feet(side).heading,
        -feet(side).pitch,
        share,
      );
    };
    const short = (side: "left" | "right"): IAutoMovieVector3 =>
      Vector3.subtract(feet(side).at, roll(side, 1).mtp);
    const shorts = { left: short("left"), right: short("right") };

    const armed = (
      posture: IAutoMovieMotionHumanPosture,
      toward: Record<
        "left" | "right",
        IAutoMovieMotionHumanArmAngles.IAngles
      > | null,
      share: number,
    ): IAutoMovieMotionHumanPosture =>
      crawlFrame.armed(body, posture, holding, toward ?? holding, share);

    // The way down's states, solved once.
    interface IStates {
      back: { sat: number; leant: number };
      lean: number;
      angles: Record<"left" | "right", IAutoMovieMotionHumanArmAngles.IAngles>;
      ends: number[];
    }
    const solve = (base: IAutoMovieMotionHumanPosture): IStates => {
      const at = (
        back: number,
        lean: number,
        palms?: boolean,
      ): IAutoMovieMotionHumanPosture =>
        props.kneeling(base, back, lean, palms);
      const pair = (
        of: (side: "left" | "right") => IAutoMovieVector3,
      ): IAutoMovieVector3 => middle({ left: of("left"), right: of("right") });

      // The knee's sitting flexion bounds how far back the hips sit.
      const knee: IAutoMovieVector3 = pair(
        (side) => crawling.limbs[`${side}Leg`]!.bend,
      );
      const ankle: IAutoMovieVector3 = pair(
        (side) =>
          HumanFoot.pivot(
            body,
            side,
            "mtp",
            feet(side).at,
            feet(side).heading,
            feet(side).pitch,
          ).ankle,
      );
      const flexion = (back: number): number =>
        180 -
        (Math.acos(
          Math.min(
            1,
            Vector3.dot(
              Vector3.normalize(
                Vector3.subtract(hipsOf(at(back, 0, false)), knee),
              ),
              Vector3.normalize(Vector3.subtract(ankle, knee)),
            ),
          ),
        ) *
          180) /
          Math.PI;
      let lo: number = 0;
      let hi: number = m.thigh;
      while (hi - lo > HumanBalance.TOLERANCE) {
        const mid: number = (lo + hi) / 2;
        if (flexion(mid) < kneelKeys.SIT) lo = mid;
        else hi = mid;
      }
      const deepest: number = lo;

      // Leaning to the hands: the shoulders as far from the wrists as on
      // the hands, the lean solved to the pitch that moves the shoulders by
      // the balance search's resolution.
      const wrist: IAutoMovieVector3 = pair(
        (side) => crawling.limbs[`${side}Arm`]!.point,
      );
      const shoulders = (
        posture: IAutoMovieMotionHumanPosture,
      ): IAutoMovieVector3 => shouldersOf({ ...posture, limbs: {} });
      const reach: number = Vector3.length(
        Vector3.subtract(shoulders(crawling), wrist),
      );
      const trunk: number = Vector3.length(
        Vector3.subtract(shoulders(crawling), hipsOf(crawling)),
      );
      const leanAt = (back: number): number => {
        const short = (degrees: number): number =>
          Vector3.length(
            Vector3.subtract(
              shoulders(at(back, degrees / props.pitch, false)),
              wrist,
            ),
          ) - reach;
        if (short(crawlFrame.PITCH) > 0) return crawlFrame.PITCH / props.pitch;
        return (
          bracketedRoot(
            short,
            0,
            crawlFrame.PITCH,
            ((HumanBalance.TOLERANCE / trunk) * 180) / Math.PI,
          ) / props.pitch
        );
      };

      // The hips sit back no further than the legs still bring each knee
      // onto its place within the foot's bearing height, at the lean the
      // trunk has there.
      const furthest = (lean: (back: number) => number): number => {
        const lands = (back: number): boolean => {
          const posture: IAutoMovieMotionHumanPosture = at(
            back,
            lean(back),
            false,
          );
          const bones = poseBones(body, resolveHumanPosture(body, posture));
          return sides.every(
            (side): boolean =>
              Vector3.length(
                Vector3.subtract(
                  bones.get(`${side}LowerLeg`)!.worldPosition,
                  posture.limbs[`${side}Leg`]!.bend,
                ),
              ) <= HumanFoot.BEARING,
          );
        };
        if (lands(deepest)) return deepest;
        let low: number = 0;
        let high: number = deepest;
        while (high - low > HumanBalance.TOLERANCE) {
          const mid: number = (low + high) / 2;
          if (lands(mid)) low = mid;
          else high = mid;
        }
        return low;
      };

      // Sitting onto the knees, the feet alone bear: the hips as far back
      // as balance over the feet asks, the trunk upright.
      const sitting: number = furthest((): number => 0);
      const satBack: number = Math.min(
        sitting,
        HumanBalance.shift(
          body,
          (back: number): IAutoMovieMotionHumanPosture =>
            armed(at(back, 0), null, 0),
          sitting / m.hipHeight,
        ),
      );

      // Leaning to the hands, the centre of mass behind the knees.
      const error = (back: number): number =>
        along(HumanBalance.support(body, at(back, leanAt(back))).centre) -
        along(knee);
      const leaning: number = Math.min(sitting, furthest(leanAt));
      const leantBack: number =
        error(0) <= 0
          ? 0
          : error(leaning) > 0
            ? leaning
            : bracketedRoot(error, 0, leaning, HumanBalance.TOLERANCE);
      const lean: number = leanAt(leantBack);
      const leant: IAutoMovieMotionHumanPosture = at(leantBack, lean);
      const solved = resolveHumanPosture(body, leant);

      // The time shared by how far the limbs' joints travel.
      const keys = [
        armed(S, null, 0),
        armed(at(satBack, 0), null, 0),
        leant,
        crawling,
      ].map((key: IAutoMovieMotionHumanPosture) =>
        poseBones(body, resolveHumanPosture(body, key)),
      );
      const travel: number[] = [0];
      for (let i: number = 1; i < keys.length; i++)
        travel.push(
          travel[i - 1]! +
            TRAVELLING.reduce(
              (sum: number, bone: AutoMovieHumanoidBone): number =>
                sum +
                Vector3.length(
                  Vector3.subtract(
                    keys[i]!.get(bone)!.worldPosition,
                    keys[i - 1]!.get(bone)!.worldPosition,
                  ),
                ),
              0,
            ),
        );
      return {
        back: { sat: satBack, leant: leantBack },
        lean,
        angles: {
          left: AutoMovieMotionHumanArm.angles(solved, "left"),
          right: AutoMovieMotionHumanArm.angles(solved, "right"),
        },
        ends: travel.map((d: number): number => (props.sit * d) / travel[1]!),
      };
    };

    // From standing: each foot rolled toward the tucked foot, the hips
    // carried on the straight line, the joints in joint space.
    const fromStanding = (
      base: IAutoMovieMotionHumanPosture,
      to: IAutoMovieMotionHumanPosture,
      u: number,
    ): IAutoMovieMotionHumanPosture => {
      const lerp = (a: number, b: number): number => a + (b - a) * u;
      const joints: IAutoMovieMotionHumanPosture["joints"] = {
        ...base.joints,
        ...floorEntry.blended(S.joints, to.joints, u),
      };
      const tilted: IAutoMovieMotionHumanPosture = {
        ...to,
        pitch: lerp(S.pitch, to.pitch),
        roll: lerp(S.roll, to.roll),
        yaw: S.yaw,
        joints,
        limbs: {},
      };
      const out: IAutoMovieMotionHumanPosture = {
        ...tilted,
        root: crawlFrame.rootFor(
          body,
          tilted,
          Vector3.lerp(hipsOf(S), hipsOf(to), u),
        ),
      };
      for (const side of sides) {
        const r = roll(side, u);
        out.limbs[`${side}Leg`] = {
          point: Vector3.add(r.placement.ankle, Vector3.scale(shorts[side], u)),
          rotation: r.placement.rotation,
          contact: HumanFoot.offset(body, side, "mtp"),
          bend: Vector3.lerp(
            S.limbs[`${side}Leg`]!.bend,
            to.limbs[`${side}Leg`]!.bend,
            u,
          ),
        };
        out.joints[`${side}Toes`] = [r.toes, 0, 0];
      }
      return out;
    };

    // The states solved once, on the standing posture the row is written
    // over.
    const s: IStates = solve(S);
    const write = (
      base: IAutoMovieMotionHumanPosture,
      seconds: number,
    ): IAutoMovieMotionHumanPosture => {
      const k: number = Math.max(
        1,
        s.ends.findIndex((end: number): boolean => seconds < end),
      );
      if (seconds >= s.ends[s.ends.length - 1]!)
        return props.kneeling(base, 0, 1);
      const u: number = minimumJerk(
        (seconds - s.ends[k - 1]!) / (s.ends[k]! - s.ends[k - 1]!),
      ).s;
      const lerp = (a: number, b: number): number => a + (b - a) * u;
      // Onto the hands: the hips forward over the knees.
      if (k === s.ends.length - 1)
        return props.kneeling(base, lerp(s.back.leant, 0), lerp(s.lean, 1));
      // Until the hands land the arms are carried from their held angles to
      // the palms, over the whole way to them; the body sits onto the knees
      // from standing, then leans from them.
      const landing: number = s.ends[s.ends.length - 2]!;
      const reach: number = minimumJerk(seconds / landing).s;
      if (k === 1)
        return armed(
          fromStanding(base, props.kneeling(base, s.back.sat, 0), u),
          s.angles,
          reach,
        );
      return armed(
        props.kneeling(base, lerp(s.back.sat, s.back.leant), lerp(0, s.lean)),
        s.angles,
        reach,
      );
    };
    return {
      write,
      hands: s.ends[s.ends.length - 2]!,
      seconds: s.ends[s.ends.length - 1]!,
    };
  }
}

/** The limbs' joints whose travel shares the way down's time. */
const TRAVELLING: readonly AutoMovieHumanoidBone[] = (
  ["left", "right"] as const
).flatMap((side: "left" | "right"): AutoMovieHumanoidBone[] => [
  `${side}UpperLeg`,
  `${side}LowerLeg`,
  `${side}Foot`,
  `${side}UpperArm`,
  `${side}LowerArm`,
  `${side}Hand`,
]);
