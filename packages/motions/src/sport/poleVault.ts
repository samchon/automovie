import {
  AutoMovieGravity,
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  minimumJerk,
  preparePoseResolution,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionKey } from "../HumanActionKey";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { WorkoutSupport } from "../exercise/WorkoutSupport";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { GymnasticsFlight } from "./GymnasticsFlight";
import { GymnasticsMat } from "./GymnasticsMat";
import { GymnasticsTakeoff } from "./GymnasticsTakeoff";
import { prepareGymnasticsPlacement } from "./prepareGymnasticsPlacement";
import { preparePoleVaultPlant } from "./preparePoleVaultPlant";

/**
 * A pole vault (#3377): out of a run, the hand that holds the pole plants
 * its end on the floor ahead at the take-off, the body swings over the
 * planted end with the pole, lets go as the pole stands upright, and flies
 * on to come down lying on the landing surface.
 *
 * The pole is a held prop (`AutoMovieMotionHumanHeld`): taken up before,
 * typically by a pick up with a use, and rigid in the hand. Its planted end
 * is the prop's `tip` affordance, or the one named.
 *
 * 1. Take-off: the jump's push-off (`GymnasticsTakeoff`) at the run's speed,
 *    kept, rising at `ANGLE`. Over it the holding hand carries the pole from
 *    the entry to the plant: the hand as high above the shoulder as the arm
 *    reaches, unless the pole is too short to reach the floor from there
 *    leaning `LEAN` or more, then lower, and the pole's end on the floor
 *    ahead along the run.
 * 2. Swing, about one axis, the body's left one through the planted end:
 *    body and pole turn as one rigid pendulum. At the plant the centre's
 *    velocity across the pendulum's radius is kept, as the angular momentum
 *    about the planted end is, and the part along the radius is lost to the
 *    plant; the turn then follows the energy of a point mass on a rigid
 *    massless pole, ω² = ω₀² + (2g/R)(cos θ₀ − cos θ), integrated once into a
 *    table of time by angle. The hand lets go when the pole stands upright.
 *    A run too slow to bring it upright is refused with the speed needed.
 * 3. Flight: the centre on the parabola of its velocity at the release, the
 *    body keeping the swing's rate, until its lowest shape meets the
 *    landing surface; then it lies there (`GymnasticsMat`), on its back or
 *    its front as its turn brought it.
 *
 * First pass: the pole does not bend and the body does not swing about the
 * hands, so there is no inversion, no pull and turn and no push off the
 * pole, which a bending pole and a body that rocks back over its hands
 * give a vaulter (the multi-axis case is #3416); the pole's own mass and
 * the body's inertia about its centre are left out of the pendulum; the
 * other hand keeps the jump's arm swing; the released pole is not planned.
 *
 * Events: `takeoff` (the plant), `release`, `touchdown`, `settled`, `relax`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the figure, the pole, the three phases with their physics, the refusal, the first pass and the events.
 * @evidence contracts/development/design.md#principled-representation The jump's push-off, a pendulum table from the take-off's own centre and velocity, and a parabola; the hand on the pole is its held frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel and accept tables, the angles, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The pole's length is the prop's; speeds follow from the run.
 */
export namespace poleVault {
  /** The action's name. */
  export const name: HumanActionKey = "poleVault";

  /** Cancel table: once lying, into rising. */
  export const interrupts: IHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      rise: ["fromRelax", "smooth"],
    });

  /** What may be cut into a vault: a run, at any instant. */
  export const accepts: IHumanActionLaw["accepts"] = {
    run: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.15 }],
  };

  /** The take-off's rise above the horizontal, degrees (Linthorne and Weetman 2012, J. Sports Sci. Med. 11: about 20 degrees at an athlete's competition run-up of 8.4 m/s). */
  export const ANGLE: number = 20;

  /** The least lean of the pole from upright at the plant, degrees (provisional). */
  export const LEAN: number = 20;

  /** The least run-up speed a vault is planned from, m/s (provisional). */
  export const RUN: number = 1;

  /** The most times the plant's wrist goal is corrected by the solved end's height. */
  const PLANT: number = 4;

  /** The number of steps the swing's table is integrated in. */
  const STEPS: number = 200;

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The pole and its planted end, and the landing surface.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Subject and affordance ids.
   */
  export interface IParams {
    /** The pole, its subject id; a hand holds it at the entry. */
    pole: string;

    /** The pole's affordance planted on the floor; `tip` when absent. */
    end?: string;

    /** The prop landed on, its subject id, whose `surface` is the landing's height; the floor when absent. */
    on?: string;
  }

  /**
   * Plan a pole vault.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When no hand holds the pole, the run is slower than `RUN`, the pole cannot reach the floor, the run cannot bring the pole upright, or the body is not above the landing surface at the release.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The plant from the arm's reach and the pole's length; the swing from the kept angular momentum and the pendulum's energy; the flight ballistic; the touchdown bisected on the lowest shape.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The pole, the take-off, the plant, the pendulum table, the flight, the landing, then the posture by phase.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every bound refuses with its numbers; the wrist goal is corrected by the solved end's height so the end is on the floor, and the pivot is the end where the solved hand actually puts it.
   * @evidence contracts/development/implementation.md#efficient-algorithms Four jump plans, STEPS stations and touchdown bisection remain. Station rates serve admission/trapezoids and monotone seconds use O(log STEPS) lookup. Shoulder/grip FK request actual dependencies while wrist goals fit fully. One native floor demand/profile selection serves every actual bisection station; fixed flight COM/joints and scalar easing omit unused work. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses held prop, take-off, flight, mat and support owners. The unchanged run fixes requested launch components; every original aim call receives a fresh copy. One fixed take-off raw query supplies shoulder/raw root with local FK/projector loans. Entered hand/root displacement, half-outward pole hint and hand arc prepare once; corrected wrist displacement stays current. Adjacent trapezoids share initial rate squared/endpoint rates; one released raw supplies COM/checked flight preparation. Wrist trials retain real solves/grip demand; push/landing forward synchronous loans.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns take-off, pendulum table, mass model, fixed hand arc, raw take-off root and one released articulation/local COM. Initial raw posture/shoulder map and its local FK/projector end with their IIFE, leaving two owned vectors. Rate arrays and grip demand end with construction; native floor reader/FK/projector end with the local touchdown operation, leaving one second. Borrowed query loans never enter the plan or output evidence.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const p: IParams = context.params;
    const model: GymnasticsFlight.Model = GymnasticsFlight.model(body);

    // The pole in the hand that holds it.
    const side: "left" | "right" =
      context.entry.holds.right === p.pole ? "right" : "left";
    const held: AutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld.of(
      context,
      side,
      p.pole,
    );
    const end: IAutoMovieVector3 = AutoMovieMotionHumanHeld.point(
      held,
      p.end ?? "tip",
    ).point;
    const length: number = Vector3.length(end);
    const readGrip: ReturnType<typeof poseBones.prepare> = poseBones.prepare(body, HumanHand.frameBones(body, side, "grip"));
    const entered: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = readGrip(context.entry.pose);
    const hand0: IAutoMovieResolvedBone = entered.get(`${side}Hand`)!;
    const socket: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(hand0.worldRotation),
      Vector3.subtract(
        HumanHand.frame(body, entered, side, "grip").point,
        hand0.worldPosition,
      ),
    );

    // The run: its speed kept, rising at `ANGLE`.
    const run: IAutoMovieVector3 = {
      x: context.entry.velocity.linear.x,
      y: 0,
      z: context.entry.velocity.linear.z,
    };
    const speed: number = Vector3.length(run);
    if (speed < RUN)
      throw new HumanRefusal({
        kind: "base",
        axis: "run",
        value: speed,
        feasible: { kind: "range", minimum: RUN, maximum: null, unit: "m/s" },
        reason: `a pole vault is entered at a run, and the body moves at ${speed.toFixed(2)} m/s`,
        fix: "run into the vault",
      });
    const ahead: IAutoMovieVector3 = Vector3.scale(run, 1 / speed);
    const rise: number = (ANGLE * Math.PI) / 180;
    const climbCosine: number = Math.cos(rise);
    const takeoffVelocity: IAutoMovieVector3 = {
      x: ahead.x * speed * climbCosine,
      y: speed * Math.sin(rise),
      z: ahead.z * speed * climbCosine,
    };
    const takeoff: GymnasticsTakeoff.ITakeoff = GymnasticsTakeoff.of(
      context,
      (): IAutoMovieVector3 => ({ ...takeoffVelocity }),
    );
    const off: number = takeoff.seconds;

    // The plant: the hand as high as the arm reaches over the shoulder, or
    // as high as lets the pole lean `LEAN` to the floor, ahead of it.
    const shoulderBones: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>([`${side}UpperArm`]);
    const { shoulder, root: rootT }: { shoulder: IAutoMovieVector3; root: IAutoMovieVector3 } = ((): { shoulder: IAutoMovieVector3; root: IAutoMovieVector3 } => {
      const resolution: ReturnType<typeof preparePoseResolution> = preparePoseResolution();
      const projection: ReturnType<typeof prepareHumanPostureProjection> = prepareHumanPostureProjection(body);
      const raw: IHumanPosture = takeoff.plan.posture(off, undefined, resolution, projection);
      const shoulder: IAutoMovieVector3 = poseBones(body,
        resolveHumanPosture.seeded(body, raw, undefined, undefined, resolution, shoulderBones, projection).pose, resolution, shoulderBones,
      ).get(`${side}UpperArm`)!.worldPosition;
      return { shoulder, root: raw.root };
    })();
    const reach: number = body.measure.upperArm + body.measure.forearm;
    const high: number = Math.min(
      shoulder.y + reach,
      length * Math.cos((LEAN * Math.PI) / 180),
    );
    if (high < shoulder.y - reach)
      throw new HumanRefusal({
        kind: "reach",
        axis: "pole",
        value: length,
        reason: `the pole reaches ${length.toFixed(2)} m from the hand, too short to stand on the floor from a hand the arm can hold`,
        fix: "vault with a longer pole",
      });
    const grip: IAutoMovieVector3 = Vector3.add(
      { ...shoulder, y: high },
      Vector3.scale(
        ahead,
        Math.sqrt(Math.max(0, reach * reach - (high - shoulder.y) ** 2)),
      ),
    );
    const planted: IAutoMovieVector3 = Vector3.add(
      { ...grip, y: 0 },
      Vector3.scale(ahead, Math.sqrt(length * length - high * high)),
    );
    const along: IAutoMovieVector3 = Vector3.normalize(end);
    const wanted: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(planted, grip),
    );
    const turning: IAutoMovieVector3 = Quaternion.rotateVector(
      hand0.worldRotation,
      along,
    );
    const axis: IAutoMovieVector3 = Vector3.cross(turning, wanted);
    const rotation: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(
        Vector3.length(axis) < 1e-9
          ? Quaternion.identity()
          : Quaternion.fromAxisAngle(
              axis,
              (Math.acos(
                Math.max(-1, Math.min(1, Vector3.dot(turning, wanted))),
              ) *
                180) /
                Math.PI,
            ),
        hand0.worldRotation,
      ),
    );
    let wrist: IAutoMovieVector3 = Vector3.subtract(
      grip,
      Quaternion.rotateVector(rotation, socket),
    );
    const outward: IAutoMovieVector3 = Vector3.scale(
      Vector3.normalize(Vector3.cross({ x: 0, y: 1, z: 0 }, ahead)),
      side === "left" ? 1 : -1,
    );

    // The push-off, its holding arm carrying the pole to the plant. The
    // wrist's path is laid on the root, which runs on under it: from its
    // place off the entry's root to its place off the take-off's.
    const root0: IAutoMovieVector3 = context.entry.posture.root;
    const handFrom: IAutoMovieVector3 = Vector3.subtract(hand0.worldPosition, root0);
    const poleBend: IAutoMovieVector3 = Vector3.scale(outward, 0.5);
    const handTurn: ReturnType<typeof Quaternion.prepareSlerp> = Quaternion.prepareSlerp(hand0.worldRotation, rotation);
    const pushing: (t: number, resolution?: Parameters<IHumanActionPlan["posture"]>[2], projection?: Parameters<IHumanActionPlan["posture"]>[3]) => IHumanPosture = (t: number, resolution?: Parameters<IHumanActionPlan["posture"]>[2], projection?: Parameters<IHumanActionPlan["posture"]>[3]): IHumanPosture => {
      const base: IHumanPosture = takeoff.plan.posture(t, undefined, resolution, projection);
      const u: number = minimumJerk.share(t / off);
      const point: IAutoMovieVector3 = Vector3.add(
        base.root,
        Vector3.lerp(
          handFrom,
          Vector3.subtract(wrist, rootT),
          u,
        ),
      );
      return {
        ...base,
        limbs: {
          ...base.limbs,
          [`${side}Arm`]: {
            point,
            rotation: handTurn(u),
            bend: Vector3.add(point, poleBend),
          },
        },
      };
    };

    // The plant as solved: the arm may not turn the hand quite as asked, so
    // the pole's end lands where the solved hand puts it. The wrist goal is
    // raised or lowered by that end's height and solved again until the end
    // is on the floor, the hand's turn being nearly the same a few
    // centimetres away.
    const plantFit: ReturnType<typeof preparePoleVaultPlant> = preparePoleVaultPlant({
      body, model, side, end, height: wrist.y, passes: PLANT,
      posture: (height: number, resolution: Parameters<IHumanActionPlan["posture"]>[2], projection: Parameters<IHumanActionPlan["posture"]>[3]): IHumanPosture => {
        wrist = { ...wrist, y: height };
        return pushing(off, resolution, projection);
      },
    });
    const from: IHumanPosture = plantFit.posture;
    const tipAt: IAutoMovieVector3 = plantFit.tip;
    const gripAt: IAutoMovieVector3 = plantFit.grip;
    const c0: IAutoMovieVector3 = plantFit.centre;
    const radius: IAutoMovieVector3 = Vector3.subtract(c0, tipAt);
    const rf: number = Vector3.dot(radius, ahead);
    const ry: number = radius.y;
    const r: number = Math.hypot(rf, ry);
    const vf: number = Vector3.dot(takeoff.velocity, ahead);
    const omega0: number = (vf * ry - takeoff.velocity.y * rf) / (r * r);
    const beta0: number = Math.atan2(rf, ry);
    const pole0: number = Math.atan2(
      Vector3.dot(Vector3.subtract(gripAt, tipAt), ahead),
      gripAt.y - tipAt.y,
    );
    const upright: number = -pole0;
    const cosine: number = Math.cos(beta0);
    const gravity: number = (2 * AutoMovieGravity.STANDARD) / r;
    const initialRate2: number = omega0 * omega0;
    const rate2: (alpha: number) => number = (alpha: number): number =>
      initialRate2 +
      gravity * (cosine - Math.cos(beta0 + alpha));
    const rates: number[] = [];
    let needed: number = 0;
    for (let i: number = 0; i <= STEPS; i++) {
      const at: number = Math.cos(beta0 + (upright * i) / STEPS);
      needed = Math.max(needed, gravity * (at - cosine));
      rates.push(initialRate2 + gravity * (cosine - at));
    }
    if (!(omega0 > 0) || initialRate2 <= needed)
      throw new HumanRefusal({
        kind: "base",
        axis: "run",
        value: speed,
        feasible: {
          kind: "range",
          minimum: omega0 > 0 ? (speed * Math.sqrt(needed)) / omega0 : null,
          maximum: null,
          unit: "m/s",
          open: "minimum",
        },
        reason: `at ${speed.toFixed(2)} m/s the body swings over the planted pole at ${omega0.toFixed(2)} rad/s, too slow to bring the pole upright`,
        fix: "run faster into the vault",
      });

    // The table of seconds by angle, by the trapezoid rule on 1 / ω.
    const inverse: number[] = rates.map((value: number): number => 1 / Math.sqrt(value));
    const seconds: number[] = [0];
    for (let i: number = 1; i <= STEPS; i++) {
      const a: number = (upright * (i - 1)) / STEPS;
      const b: number = (upright * i) / STEPS;
      seconds.push(
        seconds[i - 1]! +
          ((b - a) / 2) * (inverse[i - 1]! + inverse[i]!),
      );
    }
    const swing: number = seconds[STEPS]!;
    const angleAt: (t: number) => number = (t: number): number => {
      let low: number = 1;
      let high: number = STEPS;
      while (low < high) {
        const middle: number = Math.floor((low + high) / 2);
        if (seconds[middle]! < t) low = middle + 1; else high = middle;
      }
      const i: number = low;
      const u: number = (t - seconds[i - 1]!) / (seconds[i]! - seconds[i - 1]!);
      return (upright * (i - 1 + Math.min(1, Math.max(0, u)))) / STEPS;
    };
    const degrees: number = 180 / Math.PI;
    const turnFrom: ReturnType<typeof GymnasticsFlight.prepareTurned> = GymnasticsFlight.prepareTurned(from, tipAt);
    const swinging: (t: number) => IHumanPosture = (t: number): IHumanPosture =>
      turnFrom(0, angleAt(t) * degrees);

    // The release: the centre and its velocity from the pendulum.
    const omega: number = Math.sqrt(rate2(upright));
    const released: IHumanPosture = swinging(swing);
    const cr: IAutoMovieVector3 = GymnasticsFlight.centre(
      body,
      model,
      released,
    );
    const out: IAutoMovieVector3 = Vector3.subtract(cr, tipAt);
    const forth: number = Vector3.dot(out, ahead);
    const velocity: IAutoMovieVector3 = Vector3.add(
      Vector3.scale(ahead, omega * out.y),
      { x: 0, y: -omega * forth, z: 0 },
    );
    const placeFlight: ReturnType<typeof prepareGymnasticsPlacement> =
      prepareGymnasticsPlacement(body, model, released);
    const flying: (t: number) => IHumanPosture = (t: number): IHumanPosture =>
      placeFlight(
        { yaw: released.yaw, pitch: released.pitch + omega * degrees * t, roll: 0 },
        GymnasticsFlight.at(cr, velocity, t),
      );

    // The touchdown on the landing surface, and the landing.
    const surface: number =
      p.on === undefined
        ? 0
        : WorkoutSupport.at(context, { prop: p.on, affordance: "surface" }).y;
    const down: number = ((): number => {
      const [floorResolution, floorProjection]: [ReturnType<typeof preparePoseResolution>, ReturnType<typeof prepareHumanPostureProjection>] = [preparePoseResolution(), prepareHumanPostureProjection(body)];
      const readLowest: ReturnType<typeof GymnasticsFlight.prepareLowest> = GymnasticsFlight.prepareLowest(body);
      const lowest: (t: number) => number = (t: number): number => readLowest(flying(t), floorResolution, floorProjection);
      const releaseLowest: number = lowest(0);
      if (!(releaseLowest > surface))
        throw new HumanRefusal({
          kind: "reach",
          axis: "on",
          value: surface,
          reason: `at the release the body's lowest point is at ${releaseLowest.toFixed(2)} m, no higher than the landing surface at ${surface.toFixed(2)} m`,
          fix: "land on a lower surface, or run faster",
        });
      const fallen: number = GymnasticsFlight.fall(cr.y, velocity.y, surface)!;
      return GymnasticsFlight.touchdown(0, fallen, lowest, surface);
    })();
    const landing: ReturnType<typeof GymnasticsMat.lie> = GymnasticsMat.lie({
      body,
      model,
      from: flying(down),
      velocity: {
        ...velocity,
        y: velocity.y - AutoMovieGravity.STANDARD * down,
      },
      height: surface,
    });

    const release: number = off + swing;
    const touchdown: number = release + down;
    const settled: number = touchdown + GymnasticsMat.SETTLE;
    const duration: number = settled + GymnasticsMat.HOLD;
    const contacts: IHumanContactWindow[] = [
      { ...takeoff.plan.contacts[0]!, from: 0, to: off / duration },
      {
        part: `${side}Hand`,
        kind: "grip",
        from: 0,
        to: release / duration,
        support: { kind: "prop", subject: p.pole },
      },
      {
        part: "back",
        kind: "lie",
        from: touchdown / duration,
        to: 1,
        support:
          p.on === undefined
            ? { kind: "ground" }
            : { kind: "prop", subject: p.on },
      },
    ];
    const events: IAutoMovieMotionEvent[] = [
      { name: "takeoff", share: off / duration },
      { name: "release", share: release / duration },
      { name: "touchdown", share: touchdown / duration },
      { name: "settled", share: settled / duration },
      { name: "relax", share: settled / duration },
    ];
    return {
      duration,
      events,
      contacts,
      contact: off,
      base: { kind: "lying" },
      posture: (t: number, _channels?: Parameters<IHumanActionPlan["posture"]>[1], resolution?: Parameters<IHumanActionPlan["posture"]>[2], projection?: Parameters<IHumanActionPlan["posture"]>[3]): IHumanPosture => {
        const s: number = Math.min(duration, Math.max(0, t));
        if (s <= off) return pushing(s, resolution, projection);
        if (s < release) return swinging(s - off);
        if (s < touchdown) return flying(s - release);
        return landing(s - touchdown, resolution, projection);
      },
    };
  }
}
