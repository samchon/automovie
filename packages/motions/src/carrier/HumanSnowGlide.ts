import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClockInstant,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanMountRider,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanSurface,
  IAutoMovieMotionTarget,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanMountRider } from "../lexicon/HumanMountRider";
import { HumanSurfaceGlide } from "./HumanSurfaceGlide";
import { pivotSurfaceFoot } from "./pivotSurfaceFoot";

type Params = IAutoMovieMotionHumanSurface.ISnowGlideParams;
type Context = IAutoMovieMotionHumanActionContext<Params>;
type Plan = IAutoMovieMotionHumanActionPlan;
type Posture = IAutoMovieMotionHumanPosture;

/** The ski's local forward axis. */
const FORWARD: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
/** The axis a handle is wrapped about: its affordance frame's local +X. */
const HANDLE: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
/** Both feet checked against each set of ski edges. */
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

/**
 * Turn on the selected ski edges or use a Nordic pole and opposite ski on the
 * shared glide. Alpine skiing measures a transfer across opposing edges during
 * the turn (https://doi.org/10.1371/journal.pone.0176975). The distinct Nordic
 * stroke follows the pole and opposite ski phases of Pellegrini et al. (2020,
 * Figure 2, https://pubmed.ncbi.nlm.nih.gov/32439501/). The authored glide
 * supplies speed and stopping. The pole's own prop motion supplies its moving
 * grip.
 *
 * @param context The entered stance and the authored snow technique.
 * @returns The fitted glide and the named edge or pole transitions.
 * @throws {HumanRefusal} When the edge change or the pole support is
 *   infeasible.
 */
export function HumanSnowGlide(context: Context): Plan {
  HumanSnowGlide.admit(context.params);
  const base: Plan = HumanSurfaceGlide.plan(context);
  const transfer: Params["edgeTransfer"] = context.params.edgeTransfer;
  const stroke: Params["nordic"] = context.params.nordic;
  if (transfer === undefined && stroke === undefined) return base;
  if (transfer !== undefined) {
    return {
      ...base,
      events: [
        ...base.events,
        { name: "edgeChange", share: transfer.at / base.duration },
      ].sort(byShare),
      posture: (at: number): Posture => {
        const posture: Posture = base.posture(at);
        const first: boolean = at <= transfer.at;
        const edge: IAutoMovieMotionHumanSurface.IBladeEdge = first
          ? transfer.first
          : transfer.next;
        const share: number = first
          ? at / transfer.at
          : (at - transfer.at) / (base.duration - transfer.at);
        const weight: number =
          minimumJerk.share(2 * share) * (1 - minimumJerk.share(2 * share - 1));
        const twist: number =
          transfer.counter * weight * Math.sign(edge.degrees);
        const chest: readonly [number, number, number] = posture.joints
          .chest ?? [0, 0, 0];
        return {
          ...posture,
          joints: {
            ...posture.joints,
            chest: [chest[0], chest[1], chest[2] - twist],
          },
          limbs: {
            ...posture.limbs,
            leftLeg: pivotSurfaceFoot(
              posture.limbs.leftLeg!,
              edge.pivots.left,
              FORWARD,
              edge.degrees * weight,
            ),
            rightLeg: pivotSurfaceFoot(
              posture.limbs.rightLeg!,
              edge.pivots.right,
              FORWARD,
              edge.degrees * weight,
            ),
          },
        };
      },
    };
  }
  if (stroke === undefined) return base;
  const [catchAt, release]: typeof stroke.window = stroke.window;
  HumanBound.within("nordic.window[0]", catchAt, 0, base.duration, "s", "both");
  HumanBound.within(
    "nordic.window[1]",
    release,
    catchAt,
    base.duration,
    "s",
    "both",
  );
  HumanBound.within(
    "nordic.kick",
    stroke.kick,
    0,
    context.body.measure.shank,
    "m",
    "minimum",
  );
  const pole: IAutoMovieMotionHumanPropReader = context.prop(stroke.on);
  const named: IAutoMovieMotionTarget = {
    kind: "prop",
    subject: stroke.on,
    point: stroke.grip,
  };
  const affordance: IAutoMovieAffordance | undefined =
    pole.prop.affordances?.find(
      (item: IAutoMovieAffordance): boolean => item.id === stroke.grip,
    );
  const radius: number = (affordance?.aperture ?? 0) / 2;

  // A pole whose grip moves within it says where; a rigid pole carries its
  // rest point and handle frame on its displayed frame, as a rider's hands
  // read a carried handle (`HumanRideHands`).
  const read = (at: number): IAutoMovieMotionHumanMountRider.IHoldGrip => {
    const film: number = context.start + at;
    const moving: IAutoMovieMotionHumanProp.IPlacedPoint | undefined =
      pole.prop.point?.(stroke.grip, film);
    if (moving === undefined && !Object.hasOwn(pole.prop.points, stroke.grip))
      throw new HumanRefusal({
        kind: "affordance",
        axis: "nordic.grip",
        value: stroke.grip,
        feasible: {
          kind: "alternatives",
          values: Object.keys(pole.prop.points),
        },
        reason: `${stroke.on} has no point named ${stroke.grip}`,
        fix: "name one of the pole's grip points",
      });
    const contact: IAutoMovieMotionHumanProp.IPlacedPoint =
      moving ?? context.aim(named, film);
    const rotation: IAutoMovieQuaternion | undefined =
      moving?.rotation ??
      (affordance === undefined
        ? undefined
        : Quaternion.multiply(
            pole.frame(film).rotation,
            affordance.frame.rotation,
          ));
    return {
      point: contact.point,
      normal: contact.normal,
      radius,
      ...(rotation === undefined
        ? {}
        : { axis: Quaternion.rotateVector(rotation, HANDLE) }),
    };
  };
  read(catchAt);
  read(release);
  const leg: AutoMovieHumanLimb =
    stroke.hand === "left" ? "rightLeg" : "leftLeg";
  const duration: number = base.duration;
  const events: IAutoMovieMotionEvent[] = [
    ...base.events,
    { name: "poleCatch", share: catchAt / duration },
    { name: "poleRelease", share: release / duration },
  ].sort(byShare);

  // The glide with the opposite ski's kick through the pole phase.
  const kicked: Plan = {
    ...base,
    events,
    contacts: [
      ...base.contacts,
      {
        part: `${stroke.hand}Hand`,
        kind: "grip",
        support: { kind: "prop", subject: stroke.on },
        from: catchAt / duration,
        to: release / duration,
      },
    ],
    posture: (
      at: number,
      channels?: Parameters<Plan["posture"]>[1],
      resolution?: Parameters<Plan["posture"]>[2],
      projection?: Parameters<Plan["posture"]>[3],
    ): Posture => {
      const posture: Posture = base.posture(
        at,
        channels,
        resolution,
        projection,
      );
      const foot: IAutoMovieHumanLimbGoal | undefined = posture.limbs[leg];
      if (foot === undefined) return posture;
      const amount: number =
        minimumJerk.share((at - catchAt) / (release - catchAt)) *
        (1 - minimumJerk.share((at - release) / (duration - release)));
      const kick: IAutoMovieVector3 = Quaternion.rotateVector(foot.rotation!, {
        x: 0,
        y: 0,
        z: -stroke.kick * amount,
      });
      return {
        ...posture,
        limbs: {
          ...posture.limbs,
          [leg]: {
            ...foot,
            point: Vector3.add(foot.point, kick),
            bend: Vector3.add(foot.bend, kick),
          },
        },
      };
    },
  };

  // The pole hand's whole stroke is one planned arm (the planner's
  // trajectory over the action, `AutoMovieMotionHumanArm.carried`): it
  // leaves its rest at the start, takes the grip by the catch, rides the
  // moving grip to the release and returns by the end. A grip goal solved
  // afresh at each second chose its elbow anew at each, and turned it over
  // between two of them.
  const arm: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.carried({
    body: context.body,
    side: stroke.hand,
    from: 0,
    to: duration,
    rest: AutoMovieMotionHumanArm.angles(context.entry.pose, stroke.hand),
    weight: (at: number): number =>
      (catchAt > 0 ? minimumJerk.share(at / catchAt) : 1) *
      (release < duration
        ? 1 - minimumJerk.share((at - release) / (duration - release))
        : 1),
    span: { start: 0, ready: catchAt, relax: release, end: duration },
    goal: (posture: Posture, at: number): IAutoMovieHumanLimbGoal =>
      HumanMountRider.hold(context.body, stroke.hand, posture, read(at), 1, {})
        .arm,
  });
  const composed: Plan = composeAutoMovieMotionHumanAction({
    base: kicked,
    clock: AutoMovieMotionClock(
      duration,
      events.map(
        (event: IAutoMovieMotionEvent): IAutoMovieMotionClockInstant => ({
          name: event.name,
          seconds: event.share * duration,
        }),
      ),
    ),
    primitives: [arm],
  });
  // The glide writes the whole body: the composed arm is its own, not a
  // channel it leaves to a carrier.
  const { channels: _arm, ...written }: Plan = composed;
  void _arm;
  return { ...kicked, ...written };
}

/** Emit simultaneous support events in chronological order. */
function byShare(
  left: IAutoMovieMotionEvent,
  right: IAutoMovieMotionEvent,
): number {
  return left.share - right.share;
}

/** The snow glide's own admission. */
export namespace HumanSnowGlide {
  /**
   * Admit a snow glide's own requests before its glide is planned: alpine
   * edging or a Nordic stroke, not both; an edge transfer inside the glide (its
   * `duration`), its counter-rotation up to 35 degrees, each edge pair within
   * 45 degrees with its pivots within a metre, and the new edges of the
   * opposite cant.
   *
   * @param params The glide's requests.
   * @throws {HumanRefusal} When a request lies outside its range.
   */
  export function admit(
    params: Pick<Params, "edgeTransfer" | "nordic" | "duration">,
  ): void {
    const transfer: Params["edgeTransfer"] = params.edgeTransfer;
    const stroke: Params["nordic"] = params.nordic;
    if (transfer !== undefined && stroke !== undefined)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "nordic",
        value: stroke,
        feasible: null,
        reason: "one snow glide uses either alpine edging or a Nordic stroke",
        fix: "stage the two techniques as separate glides",
      });
    if (transfer !== undefined) {
      HumanBound.within(
        "edgeTransfer.at",
        transfer.at,
        0,
        params.duration,
        "s",
        "both",
      );
      HumanBound.within("edgeTransfer.counter", transfer.counter, 0, 35, "deg");
      for (const [name, edge] of [
        ["first", transfer.first],
        ["next", transfer.next],
      ] as const) {
        HumanBound.within(
          `edgeTransfer.${name}.degrees`,
          edge.degrees,
          -45,
          45,
          "deg",
        );
        for (const side of SIDES) {
          const pivot: IAutoMovieVector3 = edge.pivots[side];
          HumanBound.within(
            `edgeTransfer.${name}.pivots.${side}.x`,
            pivot.x,
            -1,
            1,
            "m",
          );
          HumanBound.within(
            `edgeTransfer.${name}.pivots.${side}.y`,
            pivot.y,
            -1,
            1,
            "m",
          );
          HumanBound.within(
            `edgeTransfer.${name}.pivots.${side}.z`,
            pivot.z,
            -1,
            1,
            "m",
          );
        }
      }
      if (transfer.first.degrees * transfer.next.degrees >= 0)
        throw new HumanRefusal({
          kind: "parameter",
          axis: "edgeTransfer.next.degrees",
          value: transfer.next.degrees,
          feasible: null,
          reason: "the new ski edges must have the opposite sign",
          fix: "select the other pair of ski edges with the opposite cant",
        });
    }
  }
}
