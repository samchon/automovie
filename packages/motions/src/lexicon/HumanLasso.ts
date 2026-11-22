import { AutoMovieGravity, Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBase,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanLasso,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { courseArmGoal } from "../compose/courseArmGoal";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { poseBones } from "../posture/poseBones";
import { StrikingHeld } from "../striking/StrikingHeld";
import { HumanMountedFrame } from "./HumanMountedFrame";
import { HumanUnseatPose } from "./HumanUnseatPose";

/** The bone whose rotation the entry's hold is read from: the right hand. */
const HAND: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>([
  "rightHand",
]);

/** The law's context. */
type Context = IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanLasso>;

/** The swinging hand's circle about the overhead centre, a forearm's small circle, and the centre's height over the head, metres; the throw's reach-out time, seconds; the dally's radius round the horn, metres, and seconds per turn (provisional stage readings). */
const SWING: Readonly<
  Record<"radius" | "over" | "throw" | "wrap" | "turn", number>
> = {
  radius: 0.3,
  over: 0.2,
  throw: 0.25,
  wrap: 0.08,
  turn: 0.5,
};

/** The farthest a loop is thrown, metres (provisional). */
const REACH: number = 12;

/**
 * Rope from the saddle (`IAutoMovieMotionHumanLasso`, #3952): carried on the saddle, the rider's hand circles over the head, one turn per stride of the horse's own stride cue (or per second), the held lariat running out from the hand along the circle's radius by its working length (`StrikingHeld`); at the release the hand reaches out toward the target and the lariat is launched so its loop's centre flies the projectile that meets the target's contact at the catch; with a dally the hand then circles the horn its turns and holds there. Register `HumanLasso` to use it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the swing and its timing, the throw, the catch and the dally.
 * @evidence contracts/development/design.md#principled-representation One law; the swing as a phase locked to the stride, the throw as a closed-form launch.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The law's name, cut table and planner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The catch point is the target's own contact at the catch; the stride is the author's cue track of the horse's own.
 */
export const HumanLasso: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLasso> =
  {
    name: "lasso",
    interrupts: {},
    /**
     * Admit the throw, lay the swing and the launch, then sample.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the refusals: a non-seated entry, bad counts or times, a stride track with fewer than two instants inside the swing, and a target beyond `REACH`.
     * @evidence contracts/development/implementation.md#principled-implementation The swing's period is the stride track's mean interval and its phase puts the loop ahead of the rider at each stride instant; the launch velocity is the projectile's from the release point to the target's contact in the flight time under standard gravity; the loop is placed on its circle with the lariat along the radius, the hand keeping about that line the roll its entry hold gives it.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission, the clock, the launch, then the sampler.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A target out of reach is refused, never pulled in.
     * @evidence contracts/development/implementation.md#efficient-algorithms A sample reads one carrier frame and fits one arm goal.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work The tool and the launch are shared by every sample.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains the tool and the carrier reader.
     */
    plan(context: Context): IAutoMovieMotionHumanActionPlan {
      const params: IAutoMovieMotionHumanLasso = context.params;
      const entered: IAutoMovieMotionHumanBase = context.entry.base;
      if (entered.kind !== "seated")
        throw new HumanRefusal({
          kind: "base",
          axis: "base",
          value: entered.kind,
          feasible: { kind: "alternatives", values: ["ride", "mounted"] },
          reason: `a rope is swung from the saddle, and the performer is ${entered.kind}`,
          fix: "ride the horse first",
        });
      if (!(Number.isInteger(params.swings) && params.swings >= 1))
        throw new HumanRefusal({
          kind: "parameter",
          axis: "swings",
          value: params.swings,
          feasible: null,
          reason: "a loop swings a whole number of turns from one",
          fix: "give a whole number of swings",
        });
      const flight: number = params.flight ?? 0.8;
      HumanBound.above("flight", flight, 0, "s");
      if (
        params.dally !== undefined &&
        !(Number.isInteger(params.dally.turns) && params.dally.turns >= 1)
      )
        throw new HumanRefusal({
          kind: "parameter",
          axis: "dally.turns",
          value: params.dally.turns,
          feasible: null,
          reason: "a dally wraps a whole number of turns from one",
          fix: "give a whole number of turns",
        });

      const support = context.prop(params.on);
      const carrier: HumanMountedFrame.Reader = HumanMountedFrame.of(
        support,
        params.on,
        params.frame,
      );
      const origin: IAutoMovieRigidTransform = carrier(context.start);
      const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
      const tool: IAutoMovieMotionHumanStrikingHeld.ITool = StrikingHeld.of(
        context,
        "right",
        params.lariat,
        { tip: "loop" },
      );
      const goal = StrikingHeld.prepareGoal(context, tool, 0);
      // The lariat's edge as the entry hand holds it, read as an angle about the swing's first radius between the vertical and the way round; every station keeps that angle about its own radius, so the forearm keeps its roll as the hand circles.
      const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
      const held: IAutoMovieVector3 = Quaternion.rotateVector(
        poseBones(context.body, context.entry.pose, undefined, HAND).get(
          "rightHand",
        )!.worldRotation,
        tool.edge,
      );
      let rolled: number | undefined;
      const roll = (radial: IAutoMovieVector3): IAutoMovieVector3 => {
        const round: IAutoMovieVector3 = Vector3.cross(up, radial);
        rolled ??= Math.atan2(
          Vector3.dot(held, round),
          Vector3.dot(held, up),
        );
        return Vector3.add(
          Vector3.scale(up, Math.cos(rolled)),
          Vector3.scale(round, Math.sin(rolled)),
        );
      };

      // The swing's clock: the stride's mean period and its first instant, or a second a turn from the start.
      let period: number = 1;
      let phase0: number = 0;
      if (params.stride !== undefined) {
        const instants: number[] = context
          .cue(params.stride)
          .map((c) => c.seconds - context.start)
          .filter((t: number): boolean => t >= 0)
          .sort((a: number, b: number): number => a - b);
        if (instants.length < 2)
          throw new HumanRefusal({
            kind: "parameter",
            axis: "stride",
            value: params.stride,
            feasible: null,
            reason:
              "the swing keeps time with a stride track of at least two instants inside the act",
            fix: "cue the horse's stride",
          });
        period =
          (instants[instants.length - 1]! - instants[0]!) /
          (instants.length - 1);
        phase0 = instants[0]!;
      }
      const release: number = phase0 + params.swings * period;
      const reach: number = release - SWING.throw;
      const caught: number = release + flight;
      const turns: number = params.dally?.turns ?? 0;
      const duration: number = caught + turns * SWING.turn + 0.5;

      // Where the loop is: on the circle over the head, then reaching out.
      const m = context.body.measure;
      const centre = (film: number): IAutoMovieVector3 => {
        const frame: IAutoMovieRigidTransform = carrier(film);
        const head: IAutoMovieVector3 = HumanMountedFrame.move(
          entry,
          origin,
          frame,
        ).root;
        return Vector3.add(head, {
          x: 0,
          y: m.headHeight - m.hipHeight + SWING.over,
          z: 0,
        });
      };
      const loop = (t: number): IAutoMovieVector3 => {
        const film: number = context.start + t;
        const angle: number = (2 * Math.PI * (t - phase0)) / period;
        const ahead: IAutoMovieVector3 = carrier(film).position;
        const forward: IAutoMovieVector3 = Vector3.normalize({
          ...Vector3.subtract(carrier(film + 0.05).position, ahead),
          y: 0,
        });
        const left: IAutoMovieVector3 = { x: forward.z, y: 0, z: -forward.x };
        return Vector3.add(
          centre(film),
          Vector3.add(
            Vector3.scale(forward, SWING.radius * Math.cos(angle)),
            Vector3.scale(left, SWING.radius * Math.sin(angle)),
          ),
        );
      };
      const target = (film: number): IAutoMovieVector3 =>
        HumanMountedFrame.contact(
          context.prop(params.target.subject),
          params.target.contact,
          film,
        );
      // The hand circles overhead and the loop runs out from it along the swing's radius by the lariat's working length; at the release the hand turns toward the target and the loop leaves from there.
      const at: IAutoMovieVector3 = target(context.start + caught);
      const centreOut: IAutoMovieVector3 = centre(context.start + release);
      const toward: IAutoMovieVector3 = Vector3.normalize(
        Vector3.subtract(at, centreOut),
      );
      const thrown: IAutoMovieVector3 = Vector3.add(
        centreOut,
        Vector3.scale(toward, SWING.radius),
      );
      const out: IAutoMovieVector3 = Vector3.add(
        thrown,
        Vector3.scale(toward, tool.length),
      );
      const distance: number = Vector3.distance(out, at);
      if (distance > REACH)
        throw new HumanRefusal({
          kind: "reach",
          axis: "target",
          value: distance,
          feasible: { kind: "range", minimum: 0, maximum: REACH, unit: "m" },
          reason: `the target lies ${distance.toFixed(3)} m from the release, beyond a loop's ${REACH} m`,
          fix: "ride closer to the animal before the throw",
        });
      const g: number = AutoMovieGravity.STANDARD;
      const velocity: IAutoMovieVector3 = {
        x: (at.x - out.x) / flight,
        y: (at.y - out.y) / flight + 0.5 * g * flight,
        z: (at.z - out.z) / flight,
      };
      const placed = (t: number): IAutoMovieVector3 => {
        if (t <= reach) return loop(t);
        const s: number = Math.min(1, (t - reach) / SWING.throw);
        return Vector3.lerp(loop(reach), thrown, s);
      };
      const windows: IAutoMovieMotionHumanContactWindow[] = StrikingHeld.grips(
        tool,
      ).map(
        (
          w: IAutoMovieMotionHumanContactWindow,
        ): IAutoMovieMotionHumanContactWindow => ({
          ...w,
          to: Math.min(w.to, release / duration),
        }),
      );
      if (params.dally !== undefined)
        windows.push({
          part: "rightHand",
          kind: "grip",
          from: caught / duration,
          to: 1,
          support: { kind: "prop", subject: params.on },
        });
      const goals: IAutoMovieMotionHumanActionPlan = {
        duration,
        events: [
          ...Array.from({ length: params.swings }, (_: unknown, k: number) => ({
            name: `swing:${k}`,
            share: (phase0 + k * period) / duration,
          })),
          { name: "release", share: release / duration },
          { name: "catch", share: caught / duration },
          ...(params.dally === undefined
            ? []
            : [
                {
                  name: "dallied",
                  share: (caught + turns * SWING.turn) / duration,
                },
              ]),
        ],
        contacts: [
          {
            part: "seat",
            kind: "seat",
            from: 0,
            to: 1,
            support: { kind: "prop", subject: params.on },
          },
          ...windows,
        ],
        base: entered,
        holds: StrikingHeld.holds(context, tool),
        launches: [
          {
            prop: params.lariat,
            seconds: context.start + release,
            point: out,
            velocity,
          },
        ],
        posture: (time: number): IAutoMovieMotionHumanPosture => {
          const t: number = Math.max(0, Math.min(duration, time));
          const film: number = context.start + t;
          const shown: IAutoMovieMotionHumanPosture = HumanMountedFrame.move(
            entry,
            origin,
            carrier(film),
          );
          if (t <= release) {
            const p: IAutoMovieVector3 = placed(t);
            // The loop placed on its circle as the precision strokes place their working point, the lariat running out from the hand along the radius, the hand keeping the roll it entered with about the line (`roll`), the elbow hung from the body.
            const radial: IAutoMovieVector3 = Vector3.normalize({
              ...Vector3.subtract(p, centre(film)),
              y: 0,
            });
            const frame = StrikingHeld.hand(
              tool,
              0,
              Vector3.add(p, Vector3.scale(radial, tool.length)),
              radial,
              roll(radial),
            );
            return {
              ...shown,
              limbs: {
                ...shown.limbs,
                rightArm: goal(
                  frame,
                  AutoMovieMotionHumanBend.hang(context.body, shown, "right"),
                ),
              },
            };
          }
          if (params.dally === undefined || t < caught) return shown;
          const horn: IAutoMovieVector3 = HumanMountedFrame.contact(
            support,
            params.dally.horn,
            film,
          );
          const angle: number =
            2 * Math.PI * Math.min(turns, (t - caught) / SWING.turn);
          return HumanUnseatPose.reach(
            shown,
            "right",
            Vector3.add(horn, {
              x: SWING.wrap * Math.cos(angle),
              y: 0.02,
              z: SWING.wrap * Math.sin(angle),
            }),
            1,
          );
        },
      };
      // The swinging arm is laid as a planned course on the loop's circle, paced at the hand's own peak speed: the reach into the swing, the swing held to the release; after it the arm keeps its angles until the dally.
      let peak: number = 0;
      for (let k: number = 1; k <= 64; ++k) {
        const a: number = (release * (k - 1)) / 64;
        const b: number = (release * k) / 64;
        peak = Math.max(peak, Vector3.distance(placed(b), placed(a)) / (b - a));
      }
      return HumanMountedFrame.coursed(
        goals,
        carrier,
        context.start,
        (local: IAutoMovieMotionHumanActionPlan) =>
          courseArmGoal({
            body: context.body,
            plan: local,
            side: "right",
            rest: AutoMovieMotionHumanArm.angles(context.entry.pose, "right"),
            span: {
              start: 0,
              ready: Math.min(SWING.throw, release),
              relax: release,
              end: release,
            },
            pace: (): number => peak,
          }),
      );
    },
  };
