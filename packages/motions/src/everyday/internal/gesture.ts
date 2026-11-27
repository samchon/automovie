import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionName,
  AutoMovieMotionHumanChannel,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEffort,
  IAutoMovieMotionHumanGesture,
  IAutoMovieMotionHumanGestureStroke,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTarget,
  IAutoMovieMotionHumanVariation,
  IAutoMovieMotionHumanVariationPlace,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../../actions/internal/stand";
import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { motionHumanChannel as HumanChannels } from "../../compose/internal/motionHumanChannel";
import { AutoMovieMotionHumanInterrupt } from "../../compose/internal/AutoMovieMotionHumanInterrupt";
import { motionHumanTiming } from "../../compose/internal/motionHumanTiming";
import { motionHumanVariation } from "../../compose/internal/motionHumanVariation";
import { AutoMovieMotionHumanVariationPlace } from "../../compose/internal/AutoMovieMotionHumanVariationPlace";
import { motionManner } from "../../compose/internal/motionManner";
import { HumanPhysics } from "../../law/internal/HumanPhysics";
import { HumanHandShape } from "../../posture/internal/HumanHandShape";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { HumanEffort } from "./HumanEffort";
import { gestureAdmit } from "./gestureAdmit";
import { gestureHands } from "./gestureHands";
import { gestureJoints } from "./gestureJoints";
import { gesturePlanned } from "./gesturePlanned";
import { gestureStroke } from "./gestureStroke";
import { gestureStrokeTables } from "./gestureStrokeTables";
import { gestureTouch } from "./gestureTouch";
import { prepareGestureTransport } from "./prepareGestureTransport";

/*
 * A communicative gesture while standing: the hand, head or trunk moves through
 * Kendon's phases (Kendon 1980; McNeill 1992, Hand and Mind): preparation from
 * rest to the stroke's start, the stroke that carries the meaning, an optional
 * post-stroke hold, and retraction to rest.
 *
 * The feet stay planted and the body stands as the stand law places it;
 * performed over a carrier (a walk, a seat, a ride) the body is the carrier's,
 * instant by instant, and the gesture takes only the parts it moves. Each
 * moving hand is an effector goal (gestureStroke), solved by inverse
 * kinematics with a natural elbow hint widened by the gesture and the Effort;
 * the moving arms are planned over the whole gesture as one trajectory
 * (`gestureHands.planned`): from what the entry left to the stroke's goals in
 * the preparation, on them through the stroke, and back to the relaxed hanging
 * arm's in the retraction, while the fingers take the gesture's shape and leave
 * it on the same share. Head, shoulder and trunk gestures add their joint
 * angles under an envelope that rises in the preparation and falls in the
 * retraction; a bow pitches the whole trunk about the hips by its depth (15, 30
 * or 45 degrees are the conventional light, ordinary and deep bows) while the
 * hips move back to keep the body balanced over the feet
 * (`HumanBalance.shift`).
 *
 * Transport time is the free-space time of the distance moved
 * (`motionHumanTiming.transport`), and at least the time each moving
 * arm's arc takes within the audit's travel bound (`gestureHands.reaching`),
 * 0.3 s for head and shoulder gestures (no source found), and for a bow its
 * depth at the measured rates of standing bows, down in 1.21 s and up in 1.38 s
 * for 60 degrees, held 0.95 s at the deepest (Kawabata et al. 2009, ISBS 27).
 * The Effort's tempo scales every phase, its extent the gesture's size and its
 * elbow term the arm's width (HumanEffort).
 *
 * The plan names the hands it moves (`hands`), so a gesture with a hand that
 * holds a prop is refused, naming the free hand.
 *
 * Events: `prepare`, `strokeStart`, `strokeEnd`, `retract`. A gesture may be
 * cut into another during its retraction, making a gesture unit, and into
 * standing or moving before its stroke or after it; its stroke is never cut,
 * since a cut stroke loses the gesture's meaning.
 */
export namespace gesture {
  /*
   * The action's name.
   */
  export const name: AutoMovieMotionHumanActionName = "gesture";

  /*
   * Cancel table.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    stand: [
      {
        window: { start: 0, end: "strokeStart" },
        kind: "inertialize",
        entry: 0,
      },
      { window: { start: "strokeEnd", end: 1 }, kind: "inertialize", entry: 0 },
    ],
    walk: [
      {
        window: { start: 0, end: "strokeStart" },
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
      {
        window: { start: "strokeEnd", end: 1 },
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
    look: [
      { window: { start: "strokeEnd", end: 1 }, kind: "inertialize", entry: 0 },
    ],
    gesture: [
      { window: { start: "retract", end: 1 }, kind: "inertialize", entry: 0 },
    ],
  };

  /*
   * A gesture may be performed over a carrier: it claims the moving arms with
   * their hands, and the head or the trunk when its kind moves them.
   */
  export const overlay: boolean = true;

  /*
   * A bow's depth when the caller names none, degrees: the ordinary of the
   * conventional light, ordinary and deep bows of 15, 30 and 45 degrees (the
   * Japanese eshaku, keirei and saikeirei).
   */
  export const BOW: number = 30;

  /*
   * The wave's elbow and wrist travel limit outside the stroke, m/s.
   */
  export const WAVE_TRANSPORT_SPEED: number = 2.5;

  /*
   * The deepest bow accepted, degrees: two standard deviations past the mean
   * deepest trunk angle of 33 men's standing bows, 60.0 +- 11.1 degrees
   * (Kawabata et al. 2009, ISBS 27, Table 1).
   */
  export const DEEPEST_BOW: number = 60 + 2 * 11.1;

  /*
   * How fast a bow goes down, degrees a second: the same bows reached their 60
   * degree mean depth in 1.21 +- 0.41 s (Kawabata et al. 2009, Table 2).
   */
  export const BOW_DOWN: number = 60 / 1.21;

  /*
   * How fast a bow comes back up, degrees a second: the same bows rose in 1.38
   * +- 0.32 s (Kawabata et al. 2009, Table 2).
   */
  export const BOW_UP: number = 60 / 1.38;

  /*
   * The preparation and retraction of a head, shoulder or trunk gesture,
   * seconds (provisional: no source found).
   */
  export const JOINT_TRANSPORT: number = 0.3;

  /*
   * Plan a gesture: the phase times from the hands' transport, the stroke's
   * rhythm and the Effort, a bow's balance shift, and postures that move the
   * hands, head and trunk through preparation, stroke, hold and retraction.
   * Parameter context: The action's context.
   * Returns: The plan.
   * On a missing pointing target, a count that is not a
   * positive whole number, a negative hold, or a bow outside (0,
   * `DEEPEST_BOW`] degrees.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanGesture.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanGesture.IParams = context.params;
    const body: IAutoMovieMotionHumanBody = context.body;
    const mods: IAutoMovieMotionHumanEffort.IModifiers = HumanEffort.modifiers(
      p.effort,
    );
    const rhythm: (typeof gestureStrokeTables.RHYTHM)[IAutoMovieMotionHumanGestureStroke.Kind] =
      gestureStrokeTables.RHYTHM[p.kind];
    const { cycles, hold, depth, sides }: gestureAdmit.IAdmitted = gestureAdmit(
      p,
      rhythm,
    );
    const target: (seconds: number) => IAutoMovieVector3 | undefined = (
      seconds: number,
    ): IAutoMovieVector3 | undefined =>
      p.target === undefined
        ? undefined
        : context.aim(p.target, context.start + seconds).point;
    const input: (
      base: IAutoMovieMotionHumanPosture,
      seconds: number,
      side: AutoMovieHumanSide,
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    ) => gestureStroke.IInput = (
      base: IAutoMovieMotionHumanPosture,
      seconds: number,
      side: AutoMovieHumanSide,
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    ): gestureStroke.IInput => {
      const point: IAutoMovieVector3 | undefined = target(seconds);
      return {
        body,
        base,
        side,
        region: p.region ?? "forehead",
        extent: mods.extent,
        ...(geometry[side] === undefined ? {} : { prepared: geometry[side] }),
        ...(bent === undefined ? {} : { bend: bent }),
        ...(resolution === undefined ? {} : { resolution }),
        ...(point === undefined ? {} : { target: point }),
        ...(source === undefined || travel === undefined
          ? {}
          : {
              vary: (
                record: IAutoMovieMotionHumanTarget.IDefault,
              ): IAutoMovieMotionHumanTarget.IDefault =>
                AutoMovieMotionHumanVariationPlace.vary(
                  source,
                  "place",
                  body,
                  side,
                  record,
                  travel,
                ),
            }),
      };
    };
    // This repeat's variation, and the arrival its place offset is read
    // from: set once the named place's transport is known, so the places are
    // as named until then.
    const source: IAutoMovieMotionHumanVariation.ISource | undefined =
      motionHumanVariation(context, p.manner);
    let travel: IAutoMovieMotionHumanVariationPlace.ITravel | undefined;

    // The body under the gesture: the carrier's when the gesture is an
    // overlay, otherwise the stand law's. Each hand starts where the entry
    // left it and rests where that body's arm hangs.
    // A one-handed gesture's stand sways in that hand's frame, so a left
    // gesture mirrors a right one (`stand.plan`).
    // A body not standing on its feet at the entry (seated, kneeling) keeps
    // the base it was entered in: the stand law would stand it up.
    const standing: boolean =
      context.entry.supports.length > 0 &&
      context.entry.supports.every(
        (
          s: IAutoMovieMotionHumanActionContext["entry"]["supports"][number],
        ): boolean => s.part.endsWith("Foot") && s.kind !== "seat",
      );
    const under: (seconds: number) => IAutoMovieMotionHumanActionPlan = (
      seconds: number,
    ): IAutoMovieMotionHumanActionPlan =>
      context.carrier === undefined && standing
        ? stand.plan(
            { ...context, params: { hold: seconds } },
            sides.length === 1 ? sides[0]! : "right",
          )
        : AutoMovieMotionHumanBase.under(context, seconds);
    const probe: IAutoMovieMotionHumanActionPlan = under(1);
    const at0: IAutoMovieMotionHumanPosture = probe.posture(0);
    // The bend of the trunk the gesture is entered on, read once: the places
    // of the air ride it (`gestureStroke.bend`).
    const bent: gestureStroke.IBend | undefined =
      sides.length === 0
        ? undefined
        : gestureStroke.bend(
            body,
            at0,
            p.kind === "stopPalm" ? body.upright.joints : undefined,
          );
    const restPose: IAutoMoviePose | undefined =
      sides.length === 0 ? undefined : resolveHumanPosture(body, at0);
    const begin: Partial<
      Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmAngles.IAngles>
    > = {};
    const rest: Partial<
      Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmAngles.IAngles>
    > = {};
    // The aimed digit's own direction in each moving hand's frame, read once.
    const digits: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>> = {};
    const geometry: Partial<
      Record<AutoMovieHumanSide, ReturnType<typeof gestureTouch.prepare>>
    > = {};
    const hands: Partial<
      Record<AutoMovieHumanSide, ReturnType<typeof gestureHands.prepare>>
    > = {};
    const shapes: Partial<
      Record<AutoMovieHumanSide, IAutoMovieMotionHumanHand.Shape>
    > = {};
    for (const side of sides) {
      begin[side] = AutoMovieMotionHumanArm.angles(context.entry.pose, side);
      rest[side] = AutoMovieMotionHumanArm.angles(restPose!, side);
      if (p.aim !== undefined && p.shape !== undefined)
        digits[side] = HumanHandShape.digit(
          body,
          side,
          HumanHandShape.emblem(side, p.shape),
          p.aim.digit === "thumb" ? "Thumb" : "Index",
        );
      const stroke: IAutoMovieMotionHumanGestureStroke.IHand =
        gestureStroke.hand(p.kind, side, 0, cycles, input(at0, 0, side));
      shapes[side] = stroke.shape;
      hands[side] = gestureHands.prepare(
        body,
        side,
        p,
        digits[side],
        mods.elbow,
        stroke,
      );
      geometry[side] = gestureTouch.prepare(
        body,
        side,
        p.kind,
        p.region ?? "forehead",
      );
    }
    // The farthest a hand travels from the entry to its stroke's start.
    const measure: ReturnType<typeof prepareGestureTransport> =
      prepareGestureTransport(body, context.entry.pose, sides);
    const span: () => number = (): number =>
      measure(
        (side: AutoMovieHumanSide): IAutoMovieMotionHumanGestureStroke.IHand =>
          gestureStroke.hand(p.kind, side, 0, cycles, input(at0, 0, side)),
      );

    // The Effort's tempo, slowed by the action's own time scale where it is
    // replanned to take the time its motion needs (`motionManner`).
    const T: number =
      mods.tempo * motionManner(context, undefined).tempo;
    const named: number = span();
    if (source !== undefined && named > 0)
      travel = {
        distance: named,
        seconds: T * motionHumanTiming.transport(named),
      };
    const transport: number = travel === undefined ? named : span();
    // The retraction keeps the named length; only the preparation varies, so
    // the stroke's start moves and the stroke's own length does not.
    const timed: number =
      T *
      (p.kind === "bow"
        ? depth / BOW_DOWN
        : sides.length === 0
          ? JOINT_TRANSPORT
          : motionHumanTiming.transport(transport));

    // Each transport lasts at least what its arms need to keep within the
    // audit's travel bound (`gestureHands.reaching`), from the entry to the
    // stroke's start and from its end to rest.
    const tempo: number = context.tempo ?? 1;
    const arcs: (u: number, from: typeof begin) => number = (
      u: number,
      from: typeof begin,
    ): number =>
      tempo *
      Math.max(
        0,
        ...sides.map((side: AutoMovieHumanSide): number =>
          gestureHands.reaching(
            body,
            at0,
            side,
            from[side]!,
            hands[side]!,
            gestureStroke.hand(p.kind, side, u, cycles, input(at0, 0, side)),
            p.kind === "wave" ? WAVE_TRANSPORT_SPEED : undefined,
          ),
        ),
      );
    // A bow comes up slower than it goes down (Kawabata et al. 2009).
    const back: number = p.kind === "bow" ? (timed * BOW_DOWN) / BOW_UP : timed;
    const retract: number = Math.max(back, arcs(1, rest));
    const prepare: number = Math.max(
      motionHumanVariation.duration(source, "prepare", timed),
      arcs(0, begin),
    );
    const stroke: number =
      T * cycles * motionHumanTiming.seconds(rhythm.period);
    const strokeEnd: number = prepare + stroke;
    const retractAt: number = strokeEnd + hold;
    const duration: number = retractAt + retract;
    const events: IAutoMovieMotionHumanActionPlan["events"] = [
      { name: "prepare", share: 0 },
      { name: "strokeStart", share: prepare / duration },
      { name: "strokeEnd", share: strokeEnd / duration },
      { name: "retract", share: retractAt / duration },
    ];
    const window: HumanPhysics.Window = HumanPhysics.prepare(
      p,
      p.kind === "bow" ? { balance: { by: "hips" } } : {},
      context.start,
      { duration, events },
      context.instant,
    );
    if (window !== null && p.kind !== "bow")
      HumanPhysics.unsupported(
        window.by,
        "only the bow gesture moves the hips under an inclined trunk",
      );
    const base: IAutoMovieMotionHumanActionPlan = under(duration);

    // Any sample lists the direct bones this kind claims from its carrier.
    const direct: readonly AutoMovieHumanoidBone[] = Object.keys(
      gestureJoints.at(p.kind, 0, cycles, 1, 1),
    ) as AutoMovieHumanoidBone[];
    const claimed: Set<AutoMovieMotionHumanChannel> = new Set(
      direct.map(HumanChannels),
    );
    for (const side of sides) {
      claimed.add(`${side}Arm`);
      claimed.add(`${side}Hand`);
    }
    if (p.kind === "bow") {
      claimed.add("root");
      claimed.add("trunk");
    }

    return gesturePlanned({
      context,
      p,
      body,
      mods,
      cycles,
      depth,
      sides,
      at0,
      begin,
      rest,
      hands,
      shapes,
      input,
      prepare,
      stroke,
      strokeEnd,
      retractAt,
      retract,
      duration,
      events,
      window,
      base,
      direct,
      claimed,
    });
  }
}
