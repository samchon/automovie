import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionClock,
  IAutoMovieMotionClockInstant,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanCrawl,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionManner,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { supportBalance } from "../actions/supportBalance";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { kneel } from "../everyday/kneel";
import { kneelKeys } from "../everyday/kneelKeys";
import { prepareBearingTrunkBalance } from "../everyday/prepareBearingTrunkBalance";
import { HumanBound } from "../law/HumanBound";
import { HumanPhysics } from "../law/HumanPhysics";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { crawlCourse } from "./crawlCourse";
import { crawlDown } from "./crawlDown";
import { crawlFeet } from "./crawlFeet";
import { crawlFrame } from "./crawlFrame";
import { crawlInchworm } from "./crawlInchworm";
import { crawlPitch } from "./crawlPitch";
import { floorEntry } from "./floorEntry";

/**
 * Crawling on hands and knees along the heading, from standing: the body gets
 * down onto hands and knees, then crawls a number of cycles in the diagonal
 * pattern, each hand moving with the opposite knee like a quadruped's trot
 * (Patrick, Noah and Yang 2009, J Neurophysiol 101:603).
 *
 * The goals are floor points. The knees rest a shank's radius over the floor
 * under the hip joints with the thighs upright, the shins lying back to feet
 * tucked on their toes (`kneelKeys.tucked`); the palms rest flat with each
 * wrist under its shoulder and the arm at `ARM` of its length, so the trunk's
 * pitch is the one that puts the posed shoulders at that height. The pelvis
 * travels at a constant speed of one stride a cycle, as high as each thigh
 * reaches its knee from it; each limb is planted on a floor point for `DUTY` of
 * the cycle, centred on its own share, and swings to the next one a stride
 * ahead on an arc, a hand `LIFT` high and a knee `KNEE_LIFT`, rising on the
 * swing's time and travelling on its minimum-jerk progress so it leaves the
 * floor before it moves, the left hand and the right knee half a cycle apart
 * from the right hand and the left knee. Each hip joint rides a thigh over its
 * own knee, so a swinging knee is lifted by the pelvis turning about the
 * spine's axis (the hip hike of a quadruped's swing), which the spine and the
 * chest turn back so the shoulders stay level over the hands. The crawl is
 * placed so each tucked foot's toes' joint is where the standing foot rolls
 * onto its toes, and the limbs land side by side, the first steps reaching each
 * limb's own footprint. Getting down from standing, the supports take the body
 * in turn (`crawlDown`): the feet roll onto their toes where they stood, the
 * body sits onto its knees in the kneel's time to lower and sit back
 * (`kneel.PHASES`), leans to its hands and comes forward over its knees.
 * Entered on the knees or crouched (a crawl ends kneeling, a bear crawl
 * crouched, and declares it), it blends from the displayed entry over `DOWN`
 * seconds instead, and any other base is refused (`floorEntry`). The cycle, the
 * stride, the duty and the lift are provisional, scaled by the square root of
 * the hip height and the manner's tempo. Events: `down` (on hands and knees),
 * and per limb and cycle `<limb>Liftoff<n>` and `<limb>Touchdown<n>`, the limb
 * one of `leftHand`, `rightHand`, `leftKnee`, `rightKnee`.
 *
 * The bear crawl is the same gait on the hands and the feet: the knees are held
 * `HOVER` off the floor, so the hips ride that much higher, and each foot, on
 * its ball behind its knee, is planted while its knee is. The inchworm is its
 * own walk (`crawlInchworm`).
 *
 * Each knee on the floor bears through a window of its lower leg at the knee's
 * region while its foot does.
 *
 * Not yet: the bear crawl's own timing (MacLellan et al. 2012 measured
 * hands-and-feet crawling; the knees' cycle is kept), the belly crawl, turning
 * and rising from the crawl.
 */
export namespace crawl {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "crawl";

  /** Cancel table: none yet; a crawl ends on hands and knees. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {};

  /** The kinds of {@link Kind}, as data. */
  export const KINDS = [
    "knees",
    "bear",
    "inchworm",
  ] as const satisfies readonly NonNullable<IAutoMovieMotionHumanCrawl.Kind>[];

  /** Each limb's swing start as a share of the cycle: diagonal pairs together. */
  export const PHASES: Readonly<
    Record<IAutoMovieMotionHumanCrawl.Limb, number>
  > = {
    leftHand: 0,
    rightKnee: 0,
    rightHand: 0.5,
    leftKnee: 0.5,
  };

  /** One cycle's seconds at a 0.93 m hip height (provisional). */
  export const CYCLE: number = 1.2;

  /** The stride as a share of the thigh (provisional). */
  export const STRIDE: number = 0.6;

  /** The share of a cycle a limb is planted (provisional). */
  export const DUTY: number = 0.6;

  /** A swinging hand's rise, metres (provisional). */
  export const LIFT: number = 0.04;

  /**
   * A swinging knee's rise, metres (provisional): the pelvis hikes it, so it
   * clears the floor by less than a hand.
   */
  export const KNEE_LIFT: number = 0.02;

  /**
   * A bear crawl's knees over the floor, metres (provisional): an inch or two,
   * as the exercise is cued.
   */
  export const HOVER: number = 0.05;

  /**
   * The shoulder's height over the wrist as a share of the upper arm and the
   * forearm: an elbow just short of straight (provisional).
   */
  export const ARM: number = 0.98;

  /**
   * Seconds to get onto hands and knees from the knees or a crouch
   * (provisional).
   */
  export const DOWN: number = 1.5;

  /**
   * Plan a crawl.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the cycle count is not a positive integer.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCrawl.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    if (context.params.kind === "inchworm")
      return supportBalance(context, crawlInchworm.plan(context));
    const bear: boolean = context.params.kind === "bear";
    const body: IAutoMovieMotionHumanBody = context.body;
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const cycles: number = context.params.count ?? 3;
    HumanBound.whole("count", cycles);
    const modifiers: IAutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, context.params.manner);

    // Entered on the knees or crouched over the hands, the crawl measures
    // from a stance over the entry's hips and gets down from the entry.
    const { standing, entered }: floorEntry.IStart = floorEntry.start(
      context,
      name,
      "hips",
      (): IAutoMovieMotionHumanPosture =>
        stand.plan({ ...context, params: { hold: 1 } }).posture(0),
    );
    const yaw: number = standing.yaw;
    const measured: IAutoMovieMotionHumanFrame = {
      origin: { ...standing.root, y: 0 },
      yaw,
    };
    const forward: IAutoMovieVector3 = HumanFrame.forward(yaw);

    // Each wrist over its flat palm on the floor, floor frame from the palm;
    // the body tilted by a pitch, and the root under its hip joints.
    const sides: readonly ["left", "right"] = ["left", "right"] as const;
    const wrists: Record<AutoMovieHumanSide, IAutoMovieVector3> =
      crawlFrame.wrists(body, standing, forward);
    const laid: ReturnType<typeof crawlFrame.prepareLaid> =
      crawlFrame.prepareLaid(body, forward);
    const posed: (
      share: number,
      degrees: number,
      hike?: number,
    ) => IAutoMovieMotionHumanPosture = (
      share: number,
      degrees: number,
      hike: number = 0,
    ): IAutoMovieMotionHumanPosture =>
      crawlFrame.posed(body, yaw, share, degrees, hike, -40);
    const rootFor: (
      tilted: IAutoMovieMotionHumanPosture,
      hips: IAutoMovieVector3,
    ) => IAutoMovieVector3 = (
      tilted: IAutoMovieMotionHumanPosture,
      hips: IAutoMovieVector3,
    ): IAutoMovieVector3 => crawlFrame.rootFor(body, tilted, hips);

    // The trunk's pitch: the one that puts the posed shoulders an arm at
    // `ARM` of its length over the wrists, the hip joints a thigh over the
    // knees, which a bear crawl holds `HOVER` off the floor.
    const knee: number = m.shankRadius + (bear ? HOVER : 0);
    const hipY: number = knee + m.thigh;
    const shoulderY: number =
      (wrists.left.y + wrists.right.y) / 2 + ARM * (m.upperArm + m.forearm);
    const solved: ReturnType<typeof crawlPitch> = crawlPitch(
      body,
      HumanFrame.point(measured, { x: 0, y: hipY, z: 0 }),
      shoulderY,
      posed(1, 0),
    );
    const pitch: number = solved.pitch;
    const bones: ReturnType<typeof crawlPitch>["bones"] = solved.bones;
    const local: (bone: AutoMovieHumanoidBone) => IAutoMovieVector3 = (
      bone: AutoMovieHumanoidBone,
    ): IAutoMovieVector3 =>
      HumanFrame.local(measured, bones.get(bone)!.worldPosition);

    // Nominal limb places relative to the hips' travel, floor frame: each
    // palm where its wrist stands under the shoulder, each knee under its
    // hip joint.
    const under: (side: AutoMovieHumanSide) => IAutoMovieVector3 = (
      side: AutoMovieHumanSide,
    ): IAutoMovieVector3 => {
      const shoulder: IAutoMovieVector3 = local(`${side}UpperArm`);
      return {
        x: shoulder.x - wrists[side].x,
        y: 0,
        z: shoulder.z - wrists[side].z,
      };
    };
    const nominal: Record<IAutoMovieMotionHumanCrawl.Limb, IAutoMovieVector3> =
      {
        leftHand: under("left"),
        rightHand: under("right"),
        leftKnee: { ...local("leftUpperLeg"), y: knee },
        rightKnee: { ...local("rightUpperLeg"), y: knee },
      };

    // The gait: the cycle, the stride, the swing.
    const period: number =
      CYCLE * Math.sqrt(m.hipHeight / 0.93) * modifiers.tempo;
    const stride: number = STRIDE * m.thigh;
    const speed: number = stride / period;
    const swing: number = (1 - DUTY) * period;
    const limbs: IAutoMovieMotionHumanCrawl.Limb[] = [
      "leftHand",
      "rightHand",
      "leftKnee",
      "rightKnee",
    ];

    // A limb's floor point: footprint j sits a stride ahead of j - 1, centred
    // on its stance, the first ones side by side where the limbs land. A
    // stance runs from the swing's end, `PHASES + 1 - DUTY`, for `DUTY` of
    // the cycle, so its middle is `DUTY / 2` before the next swing's start.
    const centred: (
      limb: IAutoMovieMotionHumanCrawl.Limb,
      j: number,
    ) => number = (limb: IAutoMovieMotionHumanCrawl.Limb, j: number): number =>
      j + PHASES[limb] - DUTY / 2;
    const landed: number =
      limbs
        .map((limb: IAutoMovieMotionHumanCrawl.Limb): number =>
          centred(limb, 0),
        )
        .reduce((a: number, b: number): number => a + b, 0) / limbs.length;

    // Each foot tucked on its toes behind its knee, solved once and carried
    // with the knee, the crawl standing where the tucked balls are the
    // standing ones, so the feet stay where they stood as the body gets down.
    const { frame, tucks } = crawlFeet.planted(
      body,
      standing,
      measured,
      { left: nominal.leftKnee, right: nominal.rightKnee },
      stride * landed,
    );

    // Only the contact point changes as each tucked foot follows its knee.
    const placing: (
      side: AutoMovieHumanSide,
    ) => ReturnType<typeof HumanFoot.prepareAt> = (
      side: AutoMovieHumanSide,
    ): ReturnType<typeof HumanFoot.prepareAt> =>
      HumanFoot.prepareAt(
        body,
        side,
        "mtp",
        tucks[side].foot.heading,
        tucks[side].foot.pitch,
      );
    const placements: Record<AutoMovieHumanSide, ReturnType<typeof placing>> = {
      left: placing("left"),
      right: placing("right"),
    };
    const footContacts: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
      left: HumanFoot.offset(body, "left", "mtp"),
      right: HumanFoot.offset(body, "right", "mtp"),
    };
    const print: (
      limb: IAutoMovieMotionHumanCrawl.Limb,
      j: number,
    ) => IAutoMovieVector3 = (
      limb: IAutoMovieMotionHumanCrawl.Limb,
      j: number,
    ): IAutoMovieVector3 =>
      HumanFrame.point(
        frame,
        Vector3.add(nominal[limb], {
          x: 0,
          y: 0,
          z: stride * (j === 0 ? landed : centred(limb, j)),
        }),
      );

    // The posture on hands and knees with each limb at a place and the hips'
    // middle `level` metres along, each hip joint a thigh from its knee
    // (`crawlFrame.over`); on the way down the hips sit `back` behind and
    // the trunk leans by `lean` of its pitch.
    const separation: number = Vector3.length(
      Vector3.subtract(local("leftUpperLeg"), local("rightUpperLeg")),
    );
    const kneeling: (
      posture: IAutoMovieMotionHumanPosture,
      at: (limb: IAutoMovieMotionHumanCrawl.Limb) => IAutoMovieVector3,
      level: number,
      back: number,
      lean: number,
      palms?: boolean,
    ) => IAutoMovieMotionHumanPosture = (
      posture: IAutoMovieMotionHumanPosture,
      at: (limb: IAutoMovieMotionHumanCrawl.Limb) => IAutoMovieVector3,
      level: number,
      back: number,
      lean: number,
      palms: boolean = true,
    ): IAutoMovieMotionHumanPosture => {
      const knees: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
        left: at("leftKnee"),
        right: at("rightKnee"),
      };
      const hips: ReturnType<typeof crawlFrame.over> = crawlFrame.over(
        m.thigh,
        HumanFrame.point(frame, { x: 0, y: 0, z: level - back }),
        forward,
        knees,
        { left: nominal.leftKnee.z, right: nominal.rightKnee.z },
        separation,
        lean * pitch,
      );
      const target: IAutoMovieMotionHumanPosture = posed(
        lean,
        pitch,
        hips.hike,
      );
      const legged: IAutoMovieMotionHumanPosture = {
        ...target,
        root: rootFor(target, hips.point),
        limbs: {},
        joints: { ...posture.joints, ...target.joints },
      };
      for (const side of sides) {
        const kneeAt: IAutoMovieVector3 = knees[side];
        const foot: kneelKeys.IFoot = tucks[side].foot;
        const placement: IAutoMovieMotionHumanFoot.IPlacement = placements[
          side
        ](Vector3.add(kneeAt, tucks[side].offset));
        legged.limbs[`${side}Leg`] = {
          point: placement.ankle,
          rotation: placement.rotation,
          bend: kneeAt,
          contact: { ...footContacts[side] },
        };
        legged.joints[`${side}Toes`] = [foot.toes, 0, 0];
      }
      if (!palms) return legged;
      return laid(
        legged,
        (side: AutoMovieHumanSide): IAutoMovieVector3 => at(`${side}Hand`),
      );
    };

    // From standing the supports take the body in turn, each foot rolling
    // onto its tucked place; the sit lowers the hips onto the knees and back
    // over the heels, the kneel's lowering and sitting back.
    const down: crawlDown.IDown | null =
      entered !== null
        ? null
        : crawlDown.of({
            body,
            standing,
            entry: context.entry.pose,
            sit: ((kneel.PHASES.lower + kneel.PHASES.sit) * period) / CYCLE,
            kneeling: (
              posture: IAutoMovieMotionHumanPosture,
              back: number,
              lean: number,
              palms?: boolean,
            ): IAutoMovieMotionHumanPosture =>
              kneeling(
                posture,
                (limb: IAutoMovieMotionHumanCrawl.Limb) => print(limb, 0),
                0,
                back,
                lean,
                palms,
              ),
            pitch,
            tucks,
            hover: bear,
          });
    const downAt: number = down?.seconds ?? DOWN;
    const handsDown: number = down?.hands ?? DOWN;

    // The clock: getting down, the cycles, a settle.
    const instants: IAutoMovieMotionClockInstant[] = [
      { name: "down", seconds: downAt },
    ];
    const lift: (limb: IAutoMovieMotionHumanCrawl.Limb, k: number) => number = (
      limb: IAutoMovieMotionHumanCrawl.Limb,
      k: number,
    ): number => downAt + (k - 1 + PHASES[limb]) * period;
    for (const limb of limbs)
      for (let k: number = 1; k <= cycles; k++)
        instants.push(
          { name: `${limb}Liftoff${k}`, seconds: lift(limb, k) },
          { name: `${limb}Touchdown${k}`, seconds: lift(limb, k) + swing },
        );
    const duration: number = downAt + cycles * period + 0.3;
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock.of(
      duration,
      instants,
    );
    const requested: HumanPhysics.Window = HumanPhysics.fromClock(
      context.params,
      {},
      context.start,
      clock,
      context.instant,
    );
    const window: HumanPhysics.Window =
      requested?.by === "hips"
        ? down === null
          ? null
          : HumanPhysics.during(requested, 0, down.seconds)
        : requested;
    const place: (
      limb: IAutoMovieMotionHumanCrawl.Limb,
      seconds: number,
    ) => IAutoMovieVector3 = crawlCourse.of({
      limbs,
      cycles,
      print,
      lift,
      swing,
      handLift: LIFT,
      kneeLift: KNEE_LIFT,
    });
    // The hips travel at a constant speed once down.
    const crawling: (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ) => IAutoMovieMotionHumanPosture = (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ): IAutoMovieMotionHumanPosture =>
      kneeling(
        posture,
        (limb: IAutoMovieMotionHumanCrawl.Limb) => place(limb, seconds),
        speed * Math.min(cycles * period, Math.max(0, seconds - downAt)),
        0,
        1,
      );

    const whole: IAutoMovieMotionHumanPrimitive = {
      channels: [
        "root",
        "trunk",
        "head",
        "leftLeg",
        "rightLeg",
        "leftHand",
        "rightHand",
        "leftArm",
        "rightArm",
      ],
      from: 0,
      to: duration,
      write:
        down !== null
          ? (
              posture: IAutoMovieMotionHumanPosture,
              seconds: number,
            ): IAutoMovieMotionHumanPosture =>
              seconds < downAt
                ? down.write(
                    posture,
                    seconds,
                    window?.by === "hips"
                      ? HumanPhysics.weightAt(window, seconds)
                      : 0,
                  )
                : crawling(posture, seconds)
          : floorEntry.down(
              body,
              entered,
              DOWN,
              (seconds: number): number =>
                clock.progress("start", "down", seconds),
              crawling,
            ),
    };
    // The hands bear from landing. Each foot keeps its standing contact
    // through the descent, then bears while its knee is in stance, in both
    // the kneeling and the bear crawl: rolling onto the toes does not unload
    // it, and the roll turns about the toes' tip (`crawlFeet.prepareRoll`).
    const contacts: IAutoMovieMotionHumanContactWindow[] = [];
    const bearing: (readonly [
      IAutoMovieMotionHumanContactWindow["part"],
      IAutoMovieMotionHumanCrawl.Limb,
    ])[] = [
      ["leftHand", "leftHand"],
      ["rightHand", "rightHand"],
      ["leftFoot", "leftKnee"],
      ["rightFoot", "rightKnee"],
    ];
    for (const [part, limb] of bearing)
      for (let k: number = 0; k <= cycles; k++) {
        const from: number =
          k === 0
            ? part.endsWith("Foot")
              ? 0
              : handsDown
            : lift(limb, k) + swing;
        const to: number = k === cycles ? duration : lift(limb, k + 1);
        contacts.push({
          part,
          kind: "plant",
          from: from / duration,
          to: to / duration,
          support: { kind: "ground" },
        });
      }

    // On the hands and knees each knee bears on the floor from the instant
    // it lands, as its foot does, while it is in stance; a bear crawl holds
    // its knees over the floor, so they bear nothing. Entered kneeling, the
    // knees already bear; entered crouched, they land with the blend's end.
    const kneesDown: number =
      down?.knees ?? (context.entry.base.kind === "kneeling" ? 0 : DOWN);
    if (!bear)
      for (const side of ["left", "right"] as const)
        for (let k: number = 0; k <= cycles; k++) {
          const limb: IAutoMovieMotionHumanCrawl.Limb = `${side}Knee`;
          const from: number = k === 0 ? kneesDown : lift(limb, k) + swing;
          const to: number = k === cycles ? duration : lift(limb, k + 1);
          if (to > from)
            contacts.push({
              part: `${side}LowerLeg`,
              kind: "bear",
              region: side === "left" ? "kneeLeft" : "kneeRight",
              from: from / duration,
              to: to / duration,
              support: { kind: "ground" },
            });
        }

    const adjust: ReturnType<typeof prepareBearingTrunkBalance> =
      prepareBearingTrunkBalance(body, window, duration, contacts);
    // A crawl ends on the hands and the knees, or crouched over the hands
    // and the feet, and the next act is entered on that base.
    return {
      ...composeAutoMovieMotionHumanAction({
        base: AutoMovieMotionHumanBase.still(duration, standing, contacts),
        clock,
        contact: "down",
        primitives: [
          window?.by !== "trunk"
            ? whole
            : {
                ...whole,
                write: (posture, seconds, before, resolution, projection) =>
                  adjust(
                    whole.write(
                      posture,
                      seconds,
                      before,
                      resolution,
                      projection,
                    ),
                    seconds,
                    before,
                    resolution,
                    projection,
                  ),
              },
        ],
      }),
      ...HumanPhysics.declared(context.params, window),
      base: { kind: bear ? "crouched" : "kneeling" },
    };
  }
}
