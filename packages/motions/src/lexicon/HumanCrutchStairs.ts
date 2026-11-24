import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanCrutchStairs,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSupport,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { support } from "../actions/support";
import { supportContact } from "../actions/supportContact";
import type { supportCourse } from "../actions/supportCourse";
import { crawl } from "../floor/crawl";
import { getUp } from "../floor/getUp";
import { HumanContactWindow } from "../law/HumanContactWindow";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFoot } from "../posture/HumanFoot";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { carryCrutchHands } from "./carryCrutchHands";
import { crutchHeldLeg } from "./crutchHeldLeg";
import { crutchStairsFlight } from "./crutchStairsFlight";

/** World vertical. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** No offset: a planted crutch's grip lies on the support course. */
const STILL: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

/** The two joints a held leg sets. */
type LegJoint = "hip" | "knee";

/**
 * The hip's and knee's flexion that hold the injured foot off the steps,
 * degrees: the crutch walk's three-point gait's.
 */
const HELD: Readonly<Record<LegJoint, number>> = { hip: 30, knee: 80 };

/** Refuse a crutch setting with its reason. */
function refuse(axis: string, value: unknown, reason: string): never {
  throw new HumanRefusal({
    kind: "affordance",
    axis,
    value,
    reason,
    fix: "stage both crutches on the floor level with the toes, each with a grip and a tip",
  });
}

/**
 * Climbing stairs on two crutches: "up with the good, down with the bad"
 * (HealthLinkBC, Using crutches). The hands take the handgrips on both feet,
 * then the injured leg is held off the steps (`HELD`), its foot first lifted
 * clear over its place (`crutchHeldLeg`). Going up, each step first sets the
 * sound foot down on the next tread while the crutches stay planted
 * (`footUp<n>`), then lifts both crutches up and over the nosing onto that
 * tread (`crutchUp<n>`); going down, each step first moves both crutches over
 * and down onto the next tread (`crutchDown<n>`), then sets the sound foot down
 * beside them (`footDown<n>`). A foot's ball and a crutch's tip come down `ON`
 * of the tread back from its front edge. The flight starts at the floor the
 * body and the crutches enter on, so a descent is staged on its top landing and
 * never below the floor plane. The flight's riser and tread are bounded as the
 * climb bounds them (`climbStairsFlight`: a riser above 0.35 of the hip height,
 * a tread shorter than 0.6 of the foot, refused), since the climb is the sound
 * leg's single step-up or step-down. The crutch props share the climb's clock
 * (`track`), so the scene's crutches and the body read one course: the hands
 * hold their grips where each crutch stands at every support key and ride its
 * move between them (`carryCrutchHands`), and the injured leg is raised by the
 * instant the first step's foot lifts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both orders, their source, the events, the bounds and how the props share the clock.
 * @evidence contracts/development/design.md#principled-representation Support stances on the treads with the hands on the crutches, and one track per crutch from the same flight.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One law and its crutch track.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The hands bear at the crutches' own grips; every foot and tip place follows from the flight.
 *
 * Each step takes `seconds`, 2 s when absent (provisional, missing a study), after an opening of a quarter of a step in which the hands take the grips.
 */
export const HumanCrutchStairs: IAutoMovieMotionHumanCrutchStairs.ILaw = {
  name: "crutchStairs",
  interrupts: {},

  track: (
    start: IAutoMovieRigidTransform,
    params: IAutoMovieMotionHumanCrutchStairs,
    startsAt: number = 0,
  ): ((filmSecond: number) => IAutoMovieRigidTransform) => {
    const climb: crutchStairsFlight.IClimb = crutchStairsFlight.resolve(
      params,
      undefined,
      undefined,
    );
    return (filmSecond: number): IAutoMovieRigidTransform =>
      crutchStairsFlight.frameAt(climb, start, filmSecond - startsAt);
  },

  plan: (
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCrutchStairs>,
  ): IAutoMovieMotionHumanActionPlan => {
    const { params, body }: typeof context = context;
    const climb: crutchStairsFlight.IClimb = crutchStairsFlight.resolve(
      params,
      body.measure.hipHeight,
      body.measure.footLength,
    );
    const injured: AutoMovieHumanSide = params.injured ?? "left";
    const sound: AutoMovieHumanSide = injured === "left" ? "right" : "left";
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;

    // The floor the body stands on at entry, the height of its sound sole. A
    // bearing foot above the floor plane is placed by its toes' joint
    // (`prepareSupportContactForm`), so a raised surface's target stands that
    // joint's height above the surface; on the floor plane the foot bears by
    // its own sole.
    const standing: IAutoMovieMotionHumanEntryState["feet"][AutoMovieHumanSide] =
      context.entry.feet[sound];
    const ground: number = HumanFoot.point(body, sound, "sole", {
      ankle: standing.ankle,
      rotation: standing.rotation,
    }).y;
    const joint: number =
      supportContact.points(body, entry, [
        { contact: { part: `${sound}Foot`, kind: "bear" }, at: null },
      ])[0]!.y - ground;
    const surface = (
      point: IAutoMovieVector3,
      height: number,
    ): IAutoMovieVector3 => ({
      ...point,
      y: height <= HumanFoot.BEARING ? 0 : height + joint,
    });
    for (const side of ["left", "right"] as const) {
      const subject: string = side === "left" ? params.left : params.right;
      const affordances: readonly IAutoMovieAffordance[] =
        context.prop(subject).prop.affordances ?? [];
      if (
        !["grip", "tip"].every((id: string): boolean =>
          affordances.some((a: IAutoMovieAffordance): boolean => a.id === id),
        )
      )
        refuse(side, subject, "a crutch declares a grip and a tip");
      if (
        Math.abs(
          context.prop(subject).frame(context.start).position.y - ground,
        ) > 0.01
      )
        refuse(
          side,
          subject,
          "the crutch does not start on its tip on the floor",
        );
    }
    const hand = (
      side: AutoMovieHumanSide,
    ): IAutoMovieMotionHumanSupport.IContact => ({
      part: `${side}Hand`,
      kind: "grip",
      target: {
        kind: "prop",
        subject: side === "left" ? params.left : params.right,
        point: "grip",
      },
    });
    const forward: IAutoMovieVector3 = {
      x: Math.sin((entry.yaw * Math.PI) / 180),
      y: 0,
      z: Math.cos((entry.yaw * Math.PI) / 180),
    };
    const [left, right]: IAutoMovieVector3[] = supportContact.onFloors(
      body,
      entry,
      ["leftFoot", "rightFoot"],
    );
    const floor: IAutoMovieVector3 = sound === "left" ? left! : right!;
    // The sound foot's ball sits a quarter of the foot behind the toes.
    const ball = (k: number): IAutoMovieMotionHumanSupport.IContact => {
      const offset: IAutoMovieVector3 = crutchStairsFlight.level(climb, k);
      const ahead: number =
        k === 0 ? 0 : offset.z + 0.25 * body.measure.footLength;
      return {
        part: `${sound}Foot`,
        kind: "bear",
        target: {
          kind: "point",
          frame: "world",
          at: surface(
            Vector3.add(floor, Vector3.scale(forward, ahead)),
            ground + offset.y,
          ),
          normal: UP,
        },
      };
    };
    const prefer: IAutoMovieMotionHumanSupport.IStance["prefer"] =
      getUp.quiet(body);
    const stances: IAutoMovieMotionHumanSupport.IStance[] = [
      {
        contacts: [
          {
            part: "leftFoot",
            kind: "bear",
            target: {
              kind: "point",
              frame: "world",
              at: surface(left!, ground),
              normal: UP,
            },
          },
          {
            part: "rightFoot",
            kind: "bear",
            target: {
              kind: "point",
              frame: "world",
              at: surface(right!, ground),
              normal: UP,
            },
          },
          hand("left"),
          hand("right"),
        ],
        seconds: climb.ready,
        event: "crutchReady",
        prefer,
      },
    ];
    const name: string = climb.sign > 0 ? "Up" : "Down";
    for (let i: number = 0; i < params.count; ++i) {
      const footFirst: IAutoMovieMotionHumanSupport.IStance = {
        contacts: [ball(i + 1), hand("left"), hand("right")],
        seconds: climb.step / 2,
        event: `foot${name}${i + 1}`,
        prefer,
        // Going up, the first step leaves the injured foot with the floor:
        // it is held off from the hands' bearing on, so the sound foot steps
        // on the crutches alone, never on a foot that has already lifted.
        ...(climb.sign > 0 && i === 0
          ? { free: [`${injured}Foot` as const] }
          : {}),
      };
      const crutchFirst = (
        k: number,
      ): IAutoMovieMotionHumanSupport.IStance => ({
        contacts: [ball(k), hand("left"), hand("right")],
        seconds: climb.step / 2,
        event: `crutch${name}${i + 1}`,
        prefer,
      });
      if (climb.sign > 0) stances.push(footFirst, crutchFirst(i + 1));
      else stances.push(crutchFirst(i), footFirst);
    }
    // The sound foot stands flat on each raised tread, its heel level, so it
    // stays still while the crutches move instead of rocking about its toes'
    // joint, the only point a raised foot target places; on the floor plane
    // the foot already bears flat on its sole.
    // A step between treads lifts the toes' joint straight up a stepping
    // limb's rise (`crawl.LIFT`) above the higher tread, carries it level and
    // sets it straight down (`supportCourse`'s toe course between the
    // waypoints), so the sole leaves and meets each tread vertically and never
    // travels within its bearing height; a joint-space swing between the keys
    // slid it while the root moved.
    const toesAt: (point: IAutoMovieVector3) => number = (
      point: IAutoMovieVector3,
    ): number => (point.y > HumanFoot.BEARING ? point.y : point.y + joint);
    const via: NonNullable<supportCourse.ICourse["via"]> = (
      previous: IAutoMovieMotionHumanSupport.IContact,
      next: IAutoMovieMotionHumanSupport.IContact,
    ): readonly IAutoMovieVector3[] | undefined => {
      if (
        previous.part !== `${sound}Foot` ||
        next.part !== `${sound}Foot` ||
        previous.target === undefined ||
        previous.target === "on" ||
        previous.target.kind !== "point" ||
        next.target === undefined ||
        next.target === "on" ||
        next.target.kind !== "point"
      )
        return undefined;
      const from: IAutoMovieVector3 = previous.target.at;
      const to: IAutoMovieVector3 = next.target.at;
      // A foot named again where it stands does not step.
      if (Vector3.distance(from, to) <= HumanFoot.BEARING) return undefined;
      const height: number = Math.max(toesAt(from), toesAt(to)) + crawl.LIFT;
      return [
        { ...from, y: height },
        { ...to, y: height },
      ];
    };
    const plan: IAutoMovieMotionHumanActionPlan = support.plan(
      { ...context, params: { stances } },
      {
        via,
        level: (contact: IAutoMovieMotionHumanSupport.IContact): boolean =>
          contact.part === `${sound}Foot` &&
          contact.target !== undefined &&
          contact.target !== "on" &&
          contact.target.kind === "point" &&
          contact.target.at.y > HumanFoot.BEARING,
      },
    );

    // The support keys hold each hand on its grip where the crutch stands at
    // that key; between the keys of a crutch move the crutch goes up and over
    // the nosing (or over and down), so each hand is carried by the grip's
    // offset from the support's minimum-jerk chord between the two keys.
    const gripAt = (
      side: AutoMovieHumanSide,
      seconds: number,
    ): IAutoMovieVector3 => {
      const read: ReturnType<typeof context.prop> = context.prop(
        side === "left" ? params.left : params.right,
      );
      const frame: IAutoMovieRigidTransform = crutchStairsFlight.frameAt(
        climb,
        read.frame(context.start),
        seconds,
      );
      const grip: IAutoMovieAffordance = (read.prop.affordances ?? []).find(
        (a: IAutoMovieAffordance): boolean => a.id === "grip",
      )!;
      return Vector3.add(
        frame.position,
        Quaternion.rotateVector(frame.rotation, grip.frame.translation),
      );
    };
    const offset =
      (seconds: number): ((side: AutoMovieHumanSide) => IAutoMovieVector3) =>
      (side: AutoMovieHumanSide): IAutoMovieVector3 => {
        const move: crutchStairsFlight.IMove | undefined = climb.moves.find(
          (m: crutchStairsFlight.IMove): boolean =>
            seconds > m.from && seconds < m.to,
        );
        if (move === undefined) return STILL;
        return Vector3.subtract(
          gripAt(side, seconds),
          Vector3.lerp(
            gripAt(side, move.from),
            gripAt(side, move.to),
            minimumJerk.share((seconds - move.from) / (move.to - move.from)),
          ),
        );
      };

    // The injured leg held off the steps once the hands bear, raised by the
    // instant the first step's foot leaves its place: a support step lifts at
    // a third of its move (`supportStep`), the move being half a step.
    const lifted: number = climb.ready;
    // The sound foot's set-downs, action seconds, and each one's settle.
    const bears: readonly number[] = plan.events
      .filter((e: IAutoMovieMotionEvent): boolean => e.name.startsWith("bear"))
      .map((e: IAutoMovieMotionEvent): number => e.share * plan.duration)
      .sort((a: number, b: number): number => a - b);
    const settle: number = climb.step / 2 / 3;
    const hold: ReturnType<typeof crutchHeldLeg> = crutchHeldLeg({
      body,
      side: injured,
      lifted,
      held: lifted + climb.step / 2 / 3,
      hip: HELD.hip,
      knee: HELD.knee,
      read: (seconds: number): IAutoMovieMotionHumanPosture =>
        plan.posture(seconds),
      // The held foot is held above the tread the sound foot stands on: the
      // floor a body reads under it until that foot sets down on the next
      // (`bear<i>`), easing onto the next tread over the set-down's settle
      // (a third of the half-step move, `supportStep`) so the held leg
      // never snaps as the tread under it changes.
      floor: (seconds: number): number =>
        bears.reduce(
          (height: number, at: number): number =>
            height +
            climb.sign *
              climb.riser *
              minimumJerk.share(
                Math.min(1, Math.max(0, (seconds - at) / settle)),
              ),
          ground,
        ),
    });
    const posture: IAutoMovieMotionHumanActionPlan["posture"] = (
      seconds,
      channels,
      resolution,
      projection,
    ): IAutoMovieMotionHumanPosture =>
      hold(
        carryCrutchHands(
          plan.posture(seconds, channels, resolution, projection),
          offset(seconds),
        ),
        seconds,
      );
    // The law's intent: the injured foot bears only until it lifts; the
    // sound foot bears on the tread it stands on.
    const declared: IAutoMovieMotionHumanContactWindow[] =
      plan.contacts.flatMap(
        (
          w: IAutoMovieMotionHumanContactWindow,
        ): IAutoMovieMotionHumanContactWindow[] =>
          w.part === `${injured}Foot`
            ? w.from * plan.duration >= lifted
              ? []
              : [{ ...w, to: Math.min(w.to, lifted / plan.duration) }]
            : w.part === `${sound}Foot`
              ? [
                  {
                    ...w,
                    support: {
                      kind: "ground",
                      height:
                        ground +
                        climb.sign *
                          climb.riser *
                          crutchStairsFlight.arrived(
                            climb,
                            w.from * plan.duration,
                          ),
                    },
                  },
                ]
              : [w],
      );

    // The feet bear where their planned toes stand still on the static
    // treads (`HumanContactWindow.fromPath`), on the support the intent
    // names.
    const toes: ReadonlySet<AutoMovieHumanoidBone> =
      new Set<AutoMovieHumanoidBone>(["leftToes", "rightToes"]);
    const feetWindows: IAutoMovieMotionHumanContactWindow[] =
      HumanContactWindow.fromPath({
        windows: declared,
        duration: plan.duration,
        toes: (seconds: number): HumanContactWindow.Toes => {
          const placed: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
            poseBones(
              body,
              resolveHumanPosture(body, posture(seconds)),
              undefined,
              toes,
            );
          return {
            leftFoot: placed.get("leftToes")!.worldPosition,
            rightFoot: placed.get("rightToes")!.worldPosition,
          };
        },
      });
    return {
      ...plan,
      posture,
      yields: ["head"],
      contacts: [
        ...feetWindows,
        ...(["left", "right"] as const).map(
          (side: AutoMovieHumanSide): IAutoMovieMotionHumanContactWindow => ({
            part: `${side}Hand`,
            kind: "grip",
            from: 0,
            to: 1,
            support: {
              kind: "prop",
              subject: side === "left" ? params.left : params.right,
              carries: false,
            },
          }),
        ),
      ],
      events: [...plan.events].sort(
        (a: IAutoMovieMotionEvent, b: IAutoMovieMotionEvent): number =>
          a.share - b.share,
      ),
    };
  },
};
