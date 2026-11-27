import { AutoMovieGravity } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCrawl,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanLieDown,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSupport,
  IAutoMovieMotionManner,
  IAutoMovieMotionTarget,
} from "@automovie/interface";

import { stand } from "../../actions/internal/stand";
import { support } from "../../actions/internal/support";
import { AutoMovieMotionManner } from "../../compose/internal/AutoMovieMotionManner";
import { HumanBound } from "../../law/internal/HumanBound";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { crawlChain } from "./crawlChain";
import { crawlFrame } from "./crawlFrame";
import { crawlInchwormPose } from "./crawlInchwormPose";
import { floorEntry } from "./floorEntry";
import { getUp } from "./getUp";

/*
 * The inchworm, the crawl's `inchworm` kind: from standing the body folds until
 * its palms are flat on the floor before its feet, walks the hands out one at a
 * time to a plank, then walks the feet in one at a time to the hands, a number
 * of cycles, and rises to standing where its feet have come to.
 *
 * The walk is a support sequence (`support`): each placement of the hands and
 * the feet is a stance whose key posture the whole-body fit solves on those
 * four contacts, started from and kept nearest the chain's shape at that
 * placement (`crawlInchwormPose`), so the hips sink as the hands walk out and
 * rise as the feet walk in, and each step lets one limb go, swings it over the
 * middle of its step and sets it down while the other three bear. The fold's
 * and the plank's reaches are the body's middle-plane chain's (`crawlChain`); a
 * cycle walks the wrists from the fold's reach to the plank's and the feet
 * after them by the same length, a hand's step at most `HAND` of the arm's
 * length and a foot's `FOOT` of the leg's. Folding takes `DOWN` seconds, from
 * standing or from the displayed entry when it is entered crouched or on the
 * knees (`floorEntry`), each step `STEP`, and rising back to standing `RISE`.
 * The steps and the timing are provisional, scaled by the square root of the
 * hip height and the manner's tempo. Events: `down`, per cycle `plank<n>` and
 * `folded<n>`, `rising`, and per limb and step `<limb>Liftoff<n>` and
 * `<limb>Touchdown<n>`, the limb one of `leftHand`, `rightHand`, `leftFoot`,
 * `rightFoot`.
 *
 * Not yet: a push-up at the plank.
 */
export namespace crawlInchworm {
  /*
   * A hand's longest step as a share of the upper arm and the forearm
   * (provisional).
   */
  export const HAND: number = 0.4;

  /*
   * A foot's longest step as a share of the thigh and the shank (provisional).
   */
  export const FOOT: number = 0.25;

  /*
   * One limb's step, in the body's own time unit, the square root of its hip
   * height over gravity (provisional).
   */
  export const STEP: number = 1.6;

  /*
   * The fold from standing to the palms on the floor, in the body's own time
   * unit (provisional).
   */
  export const DOWN: number = 4.9;

  /*
   * The rise from the last fold to standing, in the body's own time unit
   * (provisional).
   */
  export const RISE: number = 4.9;

  /*
   * The limbs that bear, in the order their contacts are listed.
   */
  export const LIMBS = [
    "leftHand",
    "rightHand",
    "leftFoot",
    "rightFoot",
  ] as const;

  /*
   * A limb that bears in the inchworm.
   */
  export type Limb = (typeof LIMBS)[number];
  /*
   * Plan an inchworm.
   * Parameter context: The crawl's context.
   * Returns: The plan.
   * When the cycle count is not a positive integer, or a
   * placement the body cannot bear on (`support`).
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCrawl.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const m = body.measure;
    const cycles: number = HumanBound.whole("count", context.params.count ?? 3);
    const modifiers: IAutoMovieMotionManner.IModifiers = AutoMovieMotionManner(
      context,
      context.params.manner,
    );

    // The reaches are measured from a stance over the entry's feet, so an
    // inchworm entered crouched or on the knees walks from where it is.
    const { standing }: floorEntry.IStart = floorEntry.start(
      context,
      "inchworm",
      "feet",
      (): IAutoMovieMotionHumanPosture =>
        stand.plan({ ...context, params: { hold: 1 } }).posture(0),
    );
    const frame: IAutoMovieMotionHumanFrame = {
      origin: { ...standing.root, y: 0 },
      yaw: standing.yaw,
    };
    const chain: crawlChain.IChain = crawlChain(
      body,
      standing,
      frame,
      HumanFrame.forward(standing.yaw),
    );
    const laid: ReturnType<typeof crawlFrame.prepareLaid> =
      crawlFrame.prepareLaid(body, HumanFrame.forward(standing.yaw));
    const posed: ReturnType<typeof crawlInchwormPose.prepare> =
      crawlInchwormPose.prepare(body, chain, frame, laid);
    const floor: ReturnType<typeof HumanFrame.prepare> =
      HumanFrame.prepare(frame);
    const travel: number = Math.max(0, chain.plank - chain.folding);
    const hands: number = Math.max(
      1,
      Math.ceil(travel / (HAND * (m.upperArm + m.forearm))),
    );
    const feet: number = Math.max(
      1,
      Math.ceil(travel / (FOOT * (m.thigh + m.shank))),
    );
    // Every span is a share of the body's own time, the square root of its hip
    // height over gravity (equal Froude number, Alexander 1984), times the
    // manner's tempo: the fold, each step and the rise.
    const scale: number =
      Math.sqrt(m.hipHeight / AutoMovieGravity.STANDARD) * modifiers.tempo;
    const step: number = STEP * scale;

    const { stances, steps }: IPlan = ((): IPlanResult => {
      const resolution: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution();
      const projection: ReturnType<typeof prepareHumanPostureProjection> =
        prepareHumanPostureProjection(body);
      // Each limb's place along the heading, in the floor frame: the wrists at
      // the fold's reach before the feet's balls, the balls where they stand.
      const mu0: number = (chain.balls.left.z + chain.balls.right.z) / 2;
      const now: Record<Limb, number> = {
        leftHand: mu0 + chain.folding,
        rightHand: mu0 + chain.folding,
        leftFoot: chain.balls.left.z,
        rightFoot: chain.balls.right.z,
      };
      // A bearing hand is placed by its wrist across the floor (`support`), so
      // its place is the wrist over its flat palm, under the shoulder.
      const point = (limb: Limb): IAutoMovieMotionTarget => {
        const side: AutoMovieHumanSide = limb.startsWith("left")
          ? "left"
          : "right";
        return {
          kind: "point",
          frame: "world",
          at: floor.point({
            x: limb.endsWith("Hand")
              ? chain.palms[side] + chain.wrists[side].x
              : chain.balls[side].x,
            y: 0,
            z: now[limb],
          }),
        };
      };
      const targets: Record<Limb, IAutoMovieMotionTarget> = {
        leftHand: point("leftHand"),
        rightHand: point("rightHand"),
        leftFoot: point("leftFoot"),
        rightFoot: point("rightFoot"),
      };
      const contacts = (
        only?: readonly Limb[],
      ): IAutoMovieMotionHumanSupport.IContact[] =>
        (only ?? LIMBS).map(
          (limb: Limb): IAutoMovieMotionHumanSupport.IContact => ({
            part: limb,
            target: targets[limb],
            kind: "bear",
          }),
        );

      // Each walking stance is solved from, and kept nearest, the chain's shape
      // at its placement (`crawlInchwormPose`).
      const prefer = (): IAutoMovieMotionHumanLieDown.IPose =>
        posed(
          { left: now.leftFoot, right: now.rightFoot },
          { left: now.leftHand, right: now.rightHand },
          resolution,
          projection,
        );

      // The stances: the fold, one per step, and standing on the feet.
      const stances: IAutoMovieMotionHumanSupport.IStance[] = [
        {
          contacts: contacts(),
          seconds: DOWN * scale,
          event: "down",
          prefer: prefer(),
        },
      ];
      const steps: IPlanStepsItem2[] = [];
      const counts: Record<Limb, number> = {
        leftHand: 0,
        rightHand: 0,
        leftFoot: 0,
        rightFoot: 0,
      };
      const go = (limb: Limb, length: number, event?: string): void => {
        now[limb] += length;
        targets[limb] = point(limb);
        counts[limb] += 1;
        steps.push({ limb, n: counts[limb], at: stances.length });
        stances.push({
          contacts: contacts(),
          seconds: step,
          prefer: prefer(),
          ...(event === undefined ? {} : { event }),
        });
      };
      for (let c: number = 1; c <= cycles; c++) {
        for (let i: number = 0; i < hands; i++)
          for (const side of ["left", "right"] as const)
            go(
              `${side}Hand`,
              travel / hands,
              i === hands - 1 && side === "right" ? `plank${c}` : undefined,
            );
        for (let i: number = 0; i < feet; i++)
          for (const side of ["left", "right"] as const)
            go(
              `${side}Foot`,
              travel / feet,
              i === feet - 1 && side === "right" ? `folded${c}` : undefined,
            );
      }
      stances.push({
        contacts: contacts(["leftFoot", "rightFoot"]),
        seconds: RISE * scale,
        event: "standing",
        prefer: getUp.quiet(body),
      });
      return { stances, steps };
    })();

    // The walk's events on the support plan's keys: a limb lifts as the
    // stance before its step is left and touches down as its step bears.
    const planned: IAutoMovieMotionHumanActionPlan = support.plan({
      ...context,
      params: { stances },
    });
    const shares: Map<string, number> = new Map();
    for (const event of planned.events)
      if (!shares.has(event.name)) shares.set(event.name, event.share);
    const share = (name: string): number => {
      const found: number | undefined = shares.get(name);
      if (found === undefined)
        throw new Error(`The inchworm support plan has no event ${name}`);
      return found;
    };
    const held = (i: number): string => stances[i]!.event ?? `stance${i}`;
    return {
      ...planned,
      events: [
        ...planned.events,
        ...steps.flatMap((s: IPlanS): IPlanItemResult[] => [
          { name: `${s.limb}Liftoff${s.n}`, share: share(held(s.at - 1)) },
          { name: `${s.limb}Touchdown${s.n}`, share: share(`bear${s.at}`) },
        ]),
        { name: "rising", share: share(`folded${cycles}`) },
      ].sort((a: IPlanA, b: IPlanB): number => a.share - b.share),
      base: { kind: "standing" },
    };
  }

  /*
   * The record of `IPlanS`'s site.
   */
  type IPlanS = {
    limb: Limb;
    n: number;
    at: number;
  };

  /*
   * The record of `IPlanStepsItem2`'s site.
   */
  type IPlanStepsItem2 = { limb: Limb; n: number; at: number };

  /*
   * The record of `IPlanResult`'s site.
   */
  type IPlanResult = {
    stances: IAutoMovieMotionHumanSupport.IStance[];
    steps: IStepsItemResult[];
  };

  /*
   * The record of `IStepsItemResult`'s site.
   */
  type IStepsItemResult = { limb: Limb; n: number; at: number };

  /*
   * The record of `IPlan`'s site.
   */
  type IPlan = {
    stances: IAutoMovieMotionHumanSupport.IStance[];
    steps: IPlanStepsItem[];
  };

  /*
   * The record of `IPlanStepsItem`'s site.
   */
  type IPlanStepsItem = { limb: Limb; n: number; at: number };
}

/*
 * The record of `IPlanB`'s site.
 */
type IPlanB = { share: number };

/*
 * The record of `IPlanA`'s site.
 */
type IPlanA = { share: number };

/*
 * The record of `IPlanItemResult`'s site.
 */
type IPlanItemResult = {
  name: string;
  share: number;
};
