import { Vector3, AutoMovieEngineMotionSampling, AutoMovieEngineMath } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { HumanBalance } from "../../everyday/internal/HumanBalance";
import { kneelKeys } from "../../everyday/internal/kneelKeys";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { hipJoints } from "../../posture/internal/hipJoints";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { prepareHumanShapeBlend } from "../../posture/internal/prepareHumanShapeBlend";
import type { ICrawlDownProps } from "./ICrawlDownProps";
import { crawlDownTiming } from "./crawlDownTiming";
import { crawlFeet } from "./crawlFeet";
import { crawlFrame } from "./crawlFrame";
import { prepareCrawlDownResolution } from "./prepareCrawlDownResolution";

/** The record of `IStatesBack`'s site. */
type IStatesBack = { sat: number; leant: number };

/**
 * Build the way down.
 *
 * @param props What it is built from.
 * @returns The way down.
 */
export function crawlDown(props: ICrawlDownProps): crawlDown.IDown {
  const body: IAutoMovieMotionHumanBody = props.body;
  const m = body.measure;
  const sides = ["left", "right"] as const;
  const S: IAutoMovieMotionHumanPosture = props.standing;
  const crawling: IAutoMovieMotionHumanPosture = props.kneeling(S, 0, 1);
  // Each tucked foot where the way down ends, carried with its knee.
  const tucked: Record<AutoMovieHumanSide, kneelKeys.IFoot> = {
    left: placed("left"),
    right: placed("right"),
  };
  function placed(side: AutoMovieHumanSide): kneelKeys.IFoot {
    return {
      ...props.tucks[side].foot,
      at: Vector3.add(
        crawling.limbs[`${side}Leg`]!.bend,
        props.tucks[side].offset,
      ),
    };
  }
  const holding: Record<
    AutoMovieHumanSide,
    IAutoMovieMotionHumanArmAngles.IAngles
  > = {
    left: AutoMovieMotionHumanArm.angles(props.entry, "left"),
    right: AutoMovieMotionHumanArm.angles(props.entry, "right"),
  };
  const middle = (pair: Record<AutoMovieHumanSide, IAutoMovieVector3>) =>
    Vector3.lerp(pair.left, pair.right, 0.5);
  const hipsOf = (posture: IAutoMovieMotionHumanPosture): IAutoMovieVector3 =>
    middle(
      hipJoints(
        body,
        posture.root,
        humanPostureHeading(posture),
        posture.joints.hips,
      ),
    );

  // Each standing foot rolled onto its toes (`crawlFeet.rolled`), what
  // the roll leaves short of the tucked foot taken up on the way.
  const prepareRoll = (
    side: AutoMovieHumanSide,
  ): ReturnType<typeof crawlFeet.prepareRoll> => {
    const goal: IAutoMovieHumanLimbGoal = S.limbs[`${side}Leg`]!;
    return crawlFeet.prepareRoll(
      body,
      side,
      {
        ankle: goal.point,
        rotation: goal.rotation ?? HumanFrame.turn(S.yaw),
      },
      tucked[side].heading,
      -tucked[side].pitch,
    );
  };
  const rollers: Record<
    AutoMovieHumanSide,
    ReturnType<typeof crawlFeet.prepareRoll>
  > = { left: prepareRoll("left"), right: prepareRoll("right") };
  const roll = (
    side: AutoMovieHumanSide,
    share: number,
  ): ReturnType<ReturnType<typeof crawlFeet.prepareRoll>> =>
    rollers[side](share);
  const short = (side: AutoMovieHumanSide): IAutoMovieVector3 =>
    Vector3.subtract(tucked[side].at, roll(side, 1).mtp);
  const shorts = { left: short("left"), right: short("right") };

  const armed = (
    posture: IAutoMovieMotionHumanPosture,
    toward: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanArmAngles.IAngles
    > | null,
    share: number,
  ): IAutoMovieMotionHumanPosture =>
    crawlFrame.armed(body, posture, holding, toward ?? holding, share);

  /** Both palm goals are overwritten here; keep their original flat fingers. */
  const heldKneeling: (
    base: IAutoMovieMotionHumanPosture,
    back: number,
    lean: number,
  ) => IAutoMovieMotionHumanPosture = (
    base: IAutoMovieMotionHumanPosture,
    back: number,
    lean: number,
  ): IAutoMovieMotionHumanPosture =>
    crawlFrame.flatHands(props.kneeling(base, back, lean, false));

  // The way down's states, solved once.
  interface IStates {
    back: IStatesBack;
    lean: number;
    angles: Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmAngles.IAngles>;
    ends: number[];
    /**
     * The feet-supported sitting key, solved as the way down is built when the
     * hips own a balance window; none otherwise.
     */
    satBalance: number | undefined;
    /**
     * The hips and lean when the hands first reach their fixed places, solved
     * with `satBalance`; none otherwise.
     */
    handBalance: IHandKey | undefined;
  }
  interface IHandKey {
    back: number;
    lean: number;
  }
  const solve = (base: IAutoMovieMotionHumanPosture): IStates => {
    const read: ReturnType<typeof prepareCrawlDownResolution> =
      prepareCrawlDownResolution(body);
    const at = (
      back: number,
      lean: number,
      palms?: boolean,
    ): IAutoMovieMotionHumanPosture => props.kneeling(base, back, lean, palms);
    const pair = (
      crawlDown: (side: AutoMovieHumanSide) => IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      middle({ left: crawlDown("left"), right: crawlDown("right") });

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
          tucked[side].at,
          tucked[side].heading,
          tucked[side].pitch,
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
    ): IAutoMovieVector3 => read.shoulders({ ...posture, limbs: {} });
    const shoulder: IAutoMovieVector3 = shoulders(crawling);
    const reach: number = Vector3.length(Vector3.subtract(shoulder, wrist));
    const trunk: number = Vector3.length(
      Vector3.subtract(shoulder, hipsOf(crawling)),
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
        AutoMovieEngineMath.bracketedRoot(
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
        const bones: ReturnType<typeof read.knees> = read.knees(posture);
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

    // The hips sit back as far as the knees can still reach the floor.
    const satBack: number = furthest((): number => 0);
    const leantBack: number = Math.min(satBack, furthest(leanAt));
    const lean: number = leanAt(leantBack);
    const leant: IAutoMovieMotionHumanPosture = at(leantBack, lean);
    const solved: ReturnType<typeof read.pose> = read.pose(leant);

    // The balanced keys, which only a balance window of the hips reads: the
    // sitting key no further back than keeps the centre over the feet, and
    // the hips where the centre stays behind the knees (or the tucked toes)
    // as the hands land.
    const sat: number | undefined = props.balanced
      ? Math.min(
          satBack,
          HumanBalance.shift(
            body,
            (back: number): IAutoMovieMotionHumanPosture =>
              armed(heldKneeling(base, back, 0), null, 0),
            satBack / m.hipHeight,
          ),
        )
      : undefined;
    const hand: IHandKey | undefined = props.balanced
      ? ((): IHandKey => {
          const support: IAutoMovieVector3 = props.hover
            ? pair((side) => tucked[side].at)
            : knee;
          const forward: IAutoMovieVector3 = HumanFrame.forward(S.yaw);
          const centre: ReturnType<typeof HumanBalance.prepareCentre> =
            HumanBalance.prepareCentre(body);
          const error = (back: number): number =>
            Vector3.dot(
              Vector3.subtract(centre(at(back, leanAt(back))), support),
              forward,
            );
          const back: number =
            error(0) <= 0
              ? 0
              : error(leantBack) > 0
                ? leantBack
                : AutoMovieEngineMath.bracketedRoot(error, 0, leantBack, HumanBalance.TOLERANCE);
          return { back, lean: leanAt(back) };
        })()
      : undefined;

    // The time shared by how far the limbs' joints travel.
    const ends: number[] = crawlDownTiming(
      body,
      [
        armed(S, null, 0),
        armed(heldKneeling(base, satBack, 0), null, 0),
        leant,
        crawling,
      ],
      props.sit,
    );
    return {
      satBalance: sat,
      handBalance: hand,
      back: { sat: satBack, leant: leantBack },
      lean,
      angles: {
        left: AutoMovieMotionHumanArm.angles(solved, "left"),
        right: AutoMovieMotionHumanArm.angles(solved, "right"),
      },
      ends,
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
      ...prepareHumanShapeBlend(S.joints, to.joints)(u),
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
  const carriedArms: ReturnType<typeof crawlFrame.prepareArmed> =
    crawlFrame.prepareArmed(body, holding, s.angles);
  const write = (
    base: IAutoMovieMotionHumanPosture,
    seconds: number,
    weight: number = 0,
  ): IAutoMovieMotionHumanPosture => {
    const k: number = Math.max(
      1,
      s.ends.findIndex((end: number): boolean => seconds < end),
    );
    if (seconds >= s.ends[s.ends.length - 1]!)
      return props.kneeling(base, 0, 1);
    const u: number = AutoMovieEngineMotionSampling.minimumJerkShare(
      (seconds - s.ends[k - 1]!) / (s.ends[k]! - s.ends[k - 1]!),
    );
    const lerp = (a: number, b: number): number => a + (b - a) * u;
    const sat: number =
      k > 2 ||
      weight === 0 ||
      (k === 1 && u === 0) ||
      s.satBalance === undefined
        ? s.back.sat
        : s.back.sat + weight * (s.satBalance - s.back.sat);
    const hand: IHandKey | undefined =
      k === 1 || weight === 0 || (k === 2 && u === 0)
        ? undefined
        : s.handBalance;
    const back: number =
      hand === undefined
        ? s.back.leant
        : s.back.leant + weight * (hand.back - s.back.leant);
    const lean: number =
      hand === undefined ? s.lean : s.lean + weight * (hand.lean - s.lean);
    // Onto the hands: the hips forward over the knees.
    if (k === s.ends.length - 1)
      return props.kneeling(base, lerp(back, 0), lerp(lean, 1));
    // Until the hands land the arms are carried from their held angles to
    // the palms, over the whole way to them; the body sits onto the knees
    // from standing, then leans from them.
    const landing: number = s.ends[s.ends.length - 2]!;
    const reach: number = AutoMovieEngineMotionSampling.minimumJerkShare(seconds / landing);
    if (k === 1)
      return carriedArms(
        fromStanding(base, heldKneeling(base, sat, 0), u),
        reach,
      );
    return carriedArms(
      heldKneeling(base, lerp(sat, back), lerp(0, lean)),
      reach,
    );
  };
  return {
    write,
    knees: s.ends[1]!,
    hands: s.ends[s.ends.length - 2]!,
    seconds: s.ends[s.ends.length - 1]!,
  };
}

/**
 * The way down from standing onto the hands and the knees, or onto the hands
 * and the feet of a bear crawl, as the supports take the body one after
 * another.
 *
 * Each foot rolls onto its toes where it stood (`crawlFeet.rolled`), into the
 * tucked foot the crawl kneels on, so no sole contact slides and no toe sinks.
 * Until a second support bears, the feet alone carry the body: the body first
 * sits down onto its knees with the trunk upright, the hips as far back as the
 * knee's sitting flexion lets (`kneelKeys.SIT`) and the knees still land, and
 * with the balance option (`IAutoMovieMotionHumanBalance`, off by default) no
 * further back than keeps the centre of mass over the feet
 * (`HumanBalance.shift`). With the knees down, the feet and the knees bear, so
 * the trunk leans until the palms reach their places, the shoulders as far from
 * the wrists as the crawl holds them, with the hips as far back as keeps the
 * centre of mass behind the knees, or behind the feet's toes when a bear crawl
 * holds its knees over the floor and the feet alone bear until the hands land.
 * With the hands down the hips come forward over the knees into the crawl. A
 * bear crawl comes down the same way, as it is cued from all fours, its knees
 * stopping where it holds them over the floor. The knees and the hands land
 * side by side, the symmetric stance the crawl's first steps leave from.
 *
 * Between these states the joints and the trunk's lean are carried in joint
 * space and the hips by how far back they sit, each stretch on its own
 * minimum-jerk progress, so each support lands at rest. The sit takes the time
 * it is given and the other stretches go at its pace, each in proportion to how
 * far the limbs' joints travel over it.
 */
export namespace crawlDown {
  /** The way down built. */
  export interface IDown {
    /** The posture over a base at a second before the way down ends. */
    write(
      base: IAutoMovieMotionHumanPosture,
      seconds: number,
      weight?: number,
    ): IAutoMovieMotionHumanPosture;

    /**
     * The second the knees land, or come to where a bear crawl holds them over
     * the floor.
     */
    knees: number;

    /** The second the hands land. */
    hands: number;

    /** The seconds the way down takes. */
    seconds: number;
  }
}
