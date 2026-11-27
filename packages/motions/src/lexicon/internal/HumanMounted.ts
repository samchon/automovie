import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBase,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanMounted,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBound } from "../../law/internal/HumanBound";
import { HumanRefusal } from "../../law/HumanRefusal";
import { mixHumanPosture } from "../../posture/internal/mixHumanPosture";
import { HumanMountRider } from "./HumanMountRider";
import { HumanMountedAids } from "./HumanMountedAids";
import { HumanMountedBank } from "./HumanMountedBank";
import { HumanMountedFrame } from "./HumanMountedFrame";
import { HumanMountedHandoffs } from "./HumanMountedHandoffs";
import { HumanMountedKeys } from "./HumanMountedKeys";
import { HumanMountedMembers } from "./HumanMountedMembers";
import { HumanMountedPaths } from "./HumanMountedPaths";
import { HumanMountedSeats } from "./HumanMountedSeats";
import { HumanMountedStirrups } from "./HumanMountedStirrups";
import { HumanMountedStride } from "./HumanMountedStride";
import { HumanMountedTimeline } from "./HumanMountedTimeline";
import { HumanMountedTransfer } from "./HumanMountedTransfer";
import { HumanMountedWhip } from "./HumanMountedWhip";
import { HumanRideHands } from "./HumanRideHands";
import { admitHumanMountedFigure } from "./admitHumanMountedFigure";

/*
 * Plan a mounted performance on a moving carrier
 * (`IAutoMovieMotionHumanMounted`): seat figures in a carrier contact's frame,
 * joined by transfers that keep a support held through them, with each named
 * support acquired, held and released on the figures' clock and the whole
 * carried by the carrier's moving contact. Register `HumanMounted` to use it.
 */
export const HumanMounted: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanMounted> =
  {
    name: "mounted",
    interrupts: {
      any: [{ window: { start: 0, end: 1 }, kind: "inertialize", entry: 0 }],
    },
    plan: planHumanMounted,
  };

/*
 * The mounted law's context.
 */
type Context = IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanMounted>;

/*
 * A limb's joints by bone, clinical degrees `[flexion, abduction, twist]`.
 */
type Joints = IAutoMovieMotionHumanPosture["joints"];

/*
 * Admit the figures, solve each seat once in the carrier contact's frame, then
 * sample the carried key postures and the hands' holds.
 */
function planHumanMounted(context: Context): IAutoMovieMotionHumanActionPlan {
  return plan(context);
}

/*
 * Admit the figures, solve each seat once, then sample the carried key postures
 * and holds.
 */
function plan(context: Context): IAutoMovieMotionHumanActionPlan {
  const { on, frame, figures }: IAutoMovieMotionHumanMounted = context.params;
  const entered: IAutoMovieMotionHumanBase = context.entry.base;
  if (entered.kind !== "seated")
    throw new HumanRefusal({
      kind: "base",
      axis: "base",
      value: entered.kind,
      feasible: { kind: "alternatives", values: ["sit", "ride", "mounted"] },
      reason: `a mounted performance is entered seated on its carrier, and the performer is ${entered.kind}`,
      fix: "sit on the carrier's seat first",
    });
  if (
    figures.length === 0 ||
    !HumanMountedSeats.sits(figures[figures.length - 1]!.seat)
  )
    throw new HumanRefusal({
      kind: "parameter",
      axis: "figures",
      value: figures.map(
        (f: IAutoMovieMotionHumanMounted.IFigure): string => f.seat,
      ),
      feasible: null,
      reason: "a mounted performance holds at least one figure and ends seated",
      fix: "end on an entered, aside, basic or descent figure",
    });
  const support: IAutoMovieMotionHumanPropReader = context.prop(on);
  const hands: Partial<Record<AutoMovieHumanSide, string>> = {};
  const stride: number | undefined = context.params.stride;
  const planted: Record<AutoMovieHumanSide, boolean> = {
    left: context.entry.feet.left.planted,
    right: context.entry.feet.right.planted,
  };
  if (stride !== undefined) HumanBound.above("stride", stride, 0, "s");
  const respond: number = context.params.respond ?? 0;
  HumanBound.within("respond", respond, 0, 1);
  figures.forEach((_: IAutoMovieMotionHumanMounted.IFigure, i: number): void =>
    admitHumanMountedFigure(
      on,
      support,
      figures,
      i,
      HumanMountedMembers.PARTS,
      hands,
      planted,
      stride,
    ),
  );

  // The figures are solved in the carrier contact's frame as it stands at the start.
  const carrier: HumanMountedFrame.Reader = HumanMountedFrame(
    support,
    on,
    frame,
  );
  const origin: IAutoMovieRigidTransform = carrier(context.start);
  const placed: IAutoMovieRigidTransform = support.frame(context.start);
  const entry: IAutoMovieMotionHumanPosture = HumanMountedPaths.unarmed(
    HumanMountedFrame.move(
      context.entry.posture,
      origin,
      HumanMountedFrame.LOCAL,
    ),
  );
  const gripped: Set<AutoMovieHumanSide> = HumanMountedFrame.held(
    context.body,
    context.entry.posture,
    support,
    figures[0]!,
    context.start,
  );

  // The clock, and how far the carrier strays from its stride-averaged path out of the saddle.
  const clock: HumanMountedTimeline = new HumanMountedTimeline(
    figures,
    gripped,
  );
  const slack: number = HumanMountedPaths.slack(
    carrier,
    context.start,
    clock,
    figures,
    stride,
  );
  const { keys, middles, arcs, pivots }: HumanMountedKeys.IKeys =
    HumanMountedKeys(context, support, origin, placed, entry, slack, planted);
  const hipsOf: (posture: IAutoMovieMotionHumanPosture) => IAutoMovieVector3 = (
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieVector3 => HumanMountedPaths.hips(context.body, posture);
  const handoffs: Partial<Record<AutoMovieHumanLimb, Joints>>[] =
    HumanMountedHandoffs(context.body, entry, keys);

  const { held, members }: HumanMountedMembers.IMembers = HumanMountedMembers(
    context,
    gripped,
  );
  const aids: HumanMountedAids.IGiven[] = HumanMountedAids.given(
    context.cue,
    context.start,
    clock.duration,
    context.params.aids ?? [],
    context.params.aided,
  );
  const strokes: HumanMountedWhip.IStroke[] = HumanMountedWhip.strokes(
    context.cue,
    context.start,
    figures,
    clock,
  );
  const contacts: IAutoMovieMotionHumanContactWindow[] = HumanMountedWhip.split(
    clock.windows(members, held),
    strokes,
    clock.duration,
  );

  // Hands hold their contacts by the ride's own grip reader and closure.
  const holding: AutoMovieHumanSide[] = (["left", "right"] as const).filter(
    (side: AutoMovieHumanSide): boolean => hands[side] !== undefined,
  );
  const grips: HumanRideHands.IHands | undefined =
    holding.length === 0
      ? undefined
      : HumanRideHands(
          { ...context, params: { on, duration: clock.duration, hands } },
          on,
          support,
          // The hands take and close on their holds in the first figure's key posture, where the transfer brings them, not in the entry's.
          HumanMountedFrame.move(keys[0]!, HumanMountedFrame.LOCAL, origin),
          placed,
          figures[0]!.transfer,
          // A hand that enters holding keeps the crossing its rein is displayed with.
          {
            pose: context.entry.pose,
            holding: gripped,
            posture: context.entry.posture,
          },
        );
  return {
    duration: clock.duration,
    // Each figure's arrival, then each whip stroke's contact.
    events: [
      ...figures.map(
        (figure: IAutoMovieMotionHumanMounted.IFigure, i: number) => ({
          name: `${figure.seat}:${i}`,
          share: clock.arrivals[i]! / clock.duration,
        }),
      ),
      ...strokes.map((stroke: HumanMountedWhip.IStroke, k: number) => ({
        name: `whip:${k}`,
        share: stroke.at / clock.duration,
      })),
      ...aids.map((aid: HumanMountedAids.IGiven, k: number) => ({
        name: `aid:${aid.kind}:${k}`,
        share: aid.onset / clock.duration,
      })),
    ],
    contacts,
    base: entered,
    posture: (
      at: number,
      _channels,
      resolution,
      projection,
    ): IAutoMovieMotionHumanPosture => {
      const time: number = Math.max(0, Math.min(clock.duration, at));
      const film: number = context.start + time;
      const { index, share }: IAutoMovieMotionHumanMounted.IPhase =
        clock.at(time);
      const from: IAutoMovieMotionHumanPosture =
        index === 0 ? entry : keys[index - 1]!;
      const local: IAutoMovieMotionHumanPosture = mixHumanPosture(
        from,
        keys[index]!,
        share,
      );
      HumanMountedTransfer(
        local,
        from,
        keys[index]!,
        share,
        pivots[index]!,
        handoffs[index]!,
        arcs[index]!,
        index === 0 ? hipsOf(entry) : middles[index - 1]!,
        middles[index]!,
        hipsOf,
      );
      // The trunk leans against the carrier's own pitch and roll by the author's share, and in a bank seat keeps its inclination in space.
      const now: IAutoMovieRigidTransform = carrier(film);
      const moved: IAutoMovieMotionHumanPosture = HumanMountedFrame.move(
        HumanMountedBank.respond(
          context.body,
          HumanMountedPaths.heels(
            context.body,
            HumanMountedAids.body(aids, time, local),
          ),
          figures,
          { index, share },
          origin.rotation,
          now.rotation,
          respond,
          HumanMountedPaths.grips(support, figures[index]!, now, film),
          respond === 0 ? 0 : HumanMountedFrame.surge(carrier, film, stride),
        ),
        HumanMountedFrame.LOCAL,
        now,
      );

      // Out of the saddle the pelvis rides the stride-averaged path, faded in and out over the transfers.
      const level: number =
        stride === undefined
          ? 0
          : HumanMountedStirrups.blend(
              figures,
              index,
              share,
              (p: HumanMountedStirrups.IProfile): number => p.decouple,
            );
      const shown: IAutoMovieMotionHumanPosture =
        level === 0
          ? moved
          : {
              ...moved,
              root: Vector3.lerp(
                moved.root,
                HumanMountedStride.level(carrier, film, local.root, stride!),
                level,
              ),
            };
      if (grips === undefined) return shown;
      const riding = (i: number): boolean =>
        i >= 0 && figures[i]!.handRide === true;
      const pushed: number =
        (riding(index)
          ? riding(index - 1)
            ? 1
            : share
          : riding(index - 1)
            ? 1 - share
            : 0) *
        HumanMountedStride.PUSH *
        context.body.measure.forearm;
      const read: ReturnType<HumanRideHands.IHands["gripsAt"]> = grips.gripsAt(
        film,
        support.frame(film),
      );
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...shown.limbs };
      const joints: IAutoMovieMotionHumanPosture["joints"] = {
        ...shown.joints,
      };
      for (const side of holding) {
        const taken: number = clock.hand(side, time);
        const reading: HumanRideHands.IMaterialGrip | undefined = read[side];
        if (taken <= 0 || reading === undefined) continue;
        // Out of the saddle the hands take the reins shorter, forward on the neck.
        const shortened: HumanRideHands.IMaterialGrip =
          HumanMountedStride.along(
            HumanMountedAids.rein(
              aids,
              side,
              time,
              reading,
              context.body.measure.forearm,
            ),
            HumanMountedBank.reins(figures, { index, share }) *
              context.body.measure.forearm,
          );
        const grip: HumanRideHands.IMaterialGrip =
          pushed === 0
            ? shortened
            : HumanMountedStride.push(shortened, time, stride!, pushed);
        const hold: ReturnType<typeof HumanMountRider.hold> =
          HumanMountRider.hold(
            context.body,
            side,
            shown,
            grip,
            taken,
            grips.closures[side] ?? {},
            resolution,
            projection,
          );
        limbs[`${side}Arm`] = hold.arm;
        Object.assign(joints, hold.fingers);
      }
      // A striking hand leaves its rein for the stroke and returns to it.
      HumanMountedWhip.strike(context.body, shown, limbs, strokes, time);
      return { ...shown, limbs, joints };
    },
  };
}
