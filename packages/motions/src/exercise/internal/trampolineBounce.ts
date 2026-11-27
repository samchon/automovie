import { AutoMovieGravity, Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionKey,
  IAutoMovieAffordance,
  IAutoMovieMotionClockInstant,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanExerciseKey,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanTrampoline,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanInterrupt } from "../../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanLeg } from "../../compose/AutoMovieMotionHumanLeg";
import { composeAutoMovieMotionHumanAction } from "../../compose/composeAutoMovieMotionHumanAction";
import { HumanBound } from "../../law/HumanBound";
import { HumanRefusal } from "../../law/HumanRefusal";
import { humanPostureHeading } from "../../posture/humanPostureHeading";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { ExerciseKey } from "../ExerciseKey";

/**
 * Bouncing on a trampoline.
 *
 * The bed is a non-linear spring, `F = K1 x + K3 x^3` (Jaques, The mechanics of
 * the contact phase in trampolining, 2008, finds the trampoline acts as such a
 * spring; `K1` and `K3` are provisional until that relation is read). At each
 * contact the bed deflects until it has taken the jumper's energy, `m g (h + x)
 * = K1 x^2 / 2 + K3 x^4 / 4` for a fall from `h` above the bed, and returns it
 * less a share (`KEEP` of the energy), the legs adding `PUSH` metres of apex a
 * contact. So the apexes build from a standing push toward the authored apex
 * and hold it; an apex beyond the height the push can sustain, `PUSH / (1 -
 * KEEP)`, is refused with it. The feet ride the bed down and up on a quarter
 * sine each way, matching the touchdown and take-off speeds; the flights are
 * ballistic between. At each apex the body takes the asked shape and opens
 * again by the landing; the arms swing up through the flight. The last landing
 * is killed: the bed absorbs it and the jumper stands at rest.
 *
 * Not yet: the seat, front and back drops, salti between bounces, and the bed's
 * deflection published as an articulation for the renderer.
 *
 * Events: `takeoff{k}`, `apex{k}`, `touchdown{k}`, `relax`.
 */
export namespace trampolineBounce {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionKey = "trampolineBounce";

  /** Cancel table: once killed, into standing. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      trampolineBounce: ["fromRelax", "smooth"],
    });

  /** The bed's linear stiffness, newtons per metre (provisional). */
  export const K1: number = 5000;

  /** The bed's cubic stiffness, newtons per cubic metre (provisional). */
  export const K3: number = 40000;

  /** The share of the energy the bed returns (provisional). */
  export const KEEP: number = 0.9;

  /** The apex the legs add at a contact, metres (provisional). */
  export const PUSH: number = 0.35;

  /** The standing push's deflection of the bed, metres (provisional). */
  export const SINK: number = 0.12;

  /** The knees' give at the bed's lowest, a share of the stature (provisional). */
  export const GIVE: number = 0.03;

  /**
   * The shapes held at the apex: hip flexion, knee flexion and leg spread,
   * degrees (provisional).
   */
  export const SHAPES: Readonly<
    Record<
      IAutoMovieMotionHumanTrampoline.Shape,
      IAutoMovieMotionHumanExerciseKey.ILimb
    >
  > = {
    straight: { hip: 0, knee: 0 },
    tuck: { hip: 110, knee: 120 },
    pike: { hip: 100, knee: 0 },
    straddle: { hip: 90, knee: 0, spread: 45 },
  };

  /**
   * The bed's deflection that takes a fall: the root of the energy balance.
   *
   * @param mass The jumper's mass, kilograms.
   * @param fall The height fallen from above the bed, metres.
   * @returns Metres.
   */
  export function deflection(mass: number, fall: number): number {
    const g: number = AutoMovieGravity.STANDARD;
    let x: number = Math.sqrt((2 * mass * g * Math.max(fall, 0.01)) / K1);
    for (let i: number = 0; i < 40; i++) {
      const f: number =
        (K1 * x * x) / 2 + (K3 * x ** 4) / 4 - mass * g * (fall + x);
      const d: number = K1 * x + K3 * x ** 3 - mass * g;
      const next: number = x - f / d;
      if (Math.abs(next - x) < 1e-9) return next;
      x = next;
    }
    return x;
  }

  /**
   * Plan a bounce routine.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the bed is missing, the jumper is not on it,
   *   the count is not a positive whole number, or the apex exceeds what the
   *   push sustains.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanTrampoline.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanTrampoline.IParams = context.params;
    const body: IAutoMovieMotionHumanBody = context.body;
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const g: number = AutoMovieGravity.STANDARD;
    const mass: number = body.profile.mass;
    const bounces: number = HumanBound.whole("bounces", p.bounces ?? 4);
    const apex: number = p.apex ?? 1;
    HumanBound.above("apex", apex, 0, "m");
    const sustained: number = PUSH / (1 - KEEP);
    if (apex > sustained)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "apex",
        value: apex,
        feasible: { kind: "range", minimum: 0, maximum: sustained, unit: "m" },
        reason: `an apex of ${apex} m is beyond the ${sustained.toFixed(2)} m the legs' push can sustain`,
        fix: `bounce at most ${sustained.toFixed(2)} m high`,
      });

    // The bed's top under the jumper.
    bedTop(context, p.on);

    // The apexes: built from a standing push toward the authored one.
    const heights: number[] = [];
    let h: number = 0;
    for (let k: number = 0; k < bounces; k++) {
      h = Math.min(apex, KEEP * h + PUSH);
      heights.push(h);
    }

    // The phases: the standing push, then for each flight its contact
    // after, the last one killed.
    const phases: IPhase[] = [];
    const instants: IAutoMovieMotionClockInstant[] = [];
    let t: number = 0;
    const up0: number = Math.sqrt(2 * g * heights[0]!);
    const pushed: number = 0.3 + (Math.PI / 2) * (SINK / up0);
    phases.push({
      kind: "push",
      from: t,
      to: t + pushed,
      depth: SINK,
      down: 0.3,
      inSpeed: 0,
      outSpeed: up0,
    });
    t += pushed;
    for (let k: number = 0; k < bounces; k++) {
      const height: number = heights[k]!;
      const speed: number = Math.sqrt(2 * g * height);
      const flight: number = (2 * speed) / g;
      instants.push({ name: `takeoff${k + 1}`, seconds: t });
      instants.push({ name: `apex${k + 1}`, seconds: t + flight / 2 });
      phases.push({
        kind: "flight",
        from: t,
        to: t + flight,
        depth: height,
        down: 0,
        inSpeed: speed,
        outSpeed: speed,
      });
      t += flight;
      instants.push({ name: `touchdown${k + 1}`, seconds: t });
      const x: number = deflection(mass, height);
      const last: boolean = k === bounces - 1;
      const out: number = last ? 0 : Math.sqrt(2 * g * heights[k + 1]!);
      const down: number = (Math.PI / 2) * (x / speed);
      const rise: number = last ? 0.6 : (Math.PI / 2) * (x / out);
      phases.push({
        kind: last ? "kill" : "contact",
        from: t,
        to: t + down + rise,
        depth: x,
        down,
        inSpeed: speed,
        outSpeed: out,
      });
      t += down + rise;
    }
    const duration: number = t + 0.2;
    instants.push({ name: "relax", seconds: t });

    // The feet's height above the bed's rest at a second.
    const final: IPhase = phases[phases.length - 1]!;
    const phaseAt: (s: number) => IPhase = (s: number): IPhase =>
      phases.find((ph: IPhase): boolean => s >= ph.from && s <= ph.to) ?? final;
    const feet: (s: number) => number = (s: number): number => {
      const ph: IPhase = phaseAt(s);
      const u: number = Math.max(0, Math.min(ph.to - ph.from, s - ph.from));
      if (s > final.to) return 0;
      if (ph.kind === "flight") return ph.inSpeed * u - 0.5 * g * u * u;
      if (ph.kind === "push")
        return u <= ph.down
          ? -ph.depth * 0.5 * (1 - Math.cos((Math.PI * u) / ph.down))
          : -ph.depth * Math.cos(((u - ph.down) * ph.outSpeed) / ph.depth);
      if (u <= ph.down)
        return -ph.depth * Math.sin((u * ph.inSpeed) / ph.depth);
      const v: number = u - ph.down;
      if (ph.kind === "kill") {
        const w: number = Math.min(1, v / (ph.to - ph.from - ph.down));
        return -ph.depth * 0.5 * (1 + Math.cos(Math.PI * w));
      }
      return -ph.depth * Math.cos((v * ph.outSpeed) / ph.depth);
    };
    // How far through a flight, 0 off the bed's contact and its apex at 1.
    const shaped: (s: number) => number = (s: number): number => {
      const ph: IPhase = phaseAt(s);
      return ph.kind === "flight"
        ? Math.sin((Math.PI * (s - ph.from)) / (ph.to - ph.from))
        : 0;
    };
    // How deep the bed is, a share of its deflection, for the knees' give.
    const sunk: (s: number) => number = (s: number): number => {
      const ph: IPhase = phaseAt(s);
      return ph.kind === "flight" || s > final.to
        ? 0
        : Math.min(1, -feet(s) / Math.max(1e-9, ph.depth));
    };

    const rest: IAutoMovieVector3 = body.rest.get("hips")!;
    const standingHips: IAutoMovieVector3 = Vector3.add(
      entry.root,
      Quaternion.rotateVector(humanPostureHeading(entry), rest),
    );
    const shape: IAutoMovieMotionHumanExerciseKey.ILimb =
      SHAPES[p.shape ?? "straight"];
    const contacts: IAutoMovieMotionHumanContactWindow[] = [];
    for (const ph of phases)
      if (ph.kind !== "flight")
        for (const side of ["left", "right"] as const)
          contacts.push({
            part: side === "left" ? "leftFoot" : "rightFoot",
            kind: "bear",
            from: ph.from / duration,
            to: (ph.kind === "kill" ? duration : ph.to) / duration,
            support: { kind: "prop", subject: p.on },
          });
    const writer: IAutoMovieMotionHumanPrimitive = {
      channels: ["root", "trunk", "leftArm", "rightArm", "leftLeg", "rightLeg"],
      reads: ["root"],
      from: 0,
      to: duration,
      write: (
        posture: IAutoMovieMotionHumanPosture,
        s: number,
      ): IAutoMovieMotionHumanPosture => {
        const air: number = shaped(s);
        const give: number = sunk(s);
        const key: IAutoMovieMotionHumanExerciseKey.IKey = ExerciseKey.from(
          body,
          {},
          {
            shoulder: 30 + 120 * air,
            raise: 10,
            elbow: 10,
            hip: (shape.hip ?? 0) * air,
            knee: (shape.knee ?? 0) * air,
            spread: (shape.spread ?? 0) * air,
          },
        );
        const lift: number = feet(s);
        const hips: IAutoMovieVector3 = {
          x: standingHips.x,
          y: standingHips.y + lift - GIVE * body.measure.stature * give,
          z: standingHips.z,
        };
        const turned: IAutoMovieMotionHumanPosture = {
          ...posture,
          joints: { ...posture.joints, ...key.joints },
        };
        const root: IAutoMovieVector3 = Vector3.subtract(
          hips,
          Quaternion.rotateVector(humanPostureHeading(turned), rest),
        );
        const onBed: boolean = phaseAt(s).kind !== "flight";
        // The feet ride the bed on it; in the air each foot leaves the bed's
        // place for where the shape's joints carry it as the shape comes in
        // (`air`), so the take-off and the landing meet the bed's goal.
        const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
          ...turned.limbs,
          leftLeg: undefined,
          rightLeg: undefined,
        };
        const free: IAutoMovieMotionHumanPosture = { ...turned, root, limbs };
        for (const side of ["left", "right"] as const) {
          const stand: IAutoMovieMotionHumanFoot.IPlacement =
            context.entry.feet[side];
          const bed: IAutoMovieMotionHumanFoot.IPlacement = {
            ankle: { ...stand.ankle, y: stand.ankle.y + lift },
            rotation: stand.rotation,
          };
          limbs[side === "left" ? "leftLeg" : "rightLeg"] =
            AutoMovieMotionHumanLeg.goal(
              body,
              { ...turned, root },
              side,
              onBed ? bed : toward(body, bed, free, side, air),
              onBed,
            );
        }
        return { ...turned, root, limbs };
      },
    };
    return composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.still(duration, entry, contacts),
      clock: AutoMovieMotionClock(duration, instants),
      primitives: [writer],
    });
  }

  /**
   * A foot's placement in the air: from the bed's place toward where the
   * shape's joints carry it, by how far the shape has come in.
   */
  function toward(
    body: IAutoMovieMotionHumanBody,
    bed: IAutoMovieMotionHumanFoot.IPlacement,
    shaped: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    air: number,
  ): IAutoMovieMotionHumanFoot.IPlacement {
    const bone: AutoMovieHumanoidBone =
      side === "left" ? "leftFoot" : "rightFoot";
    const free: IAutoMovieResolvedBone = poseBones(
      body,
      resolveHumanPosture(body, shaped),
      undefined,
      new Set<AutoMovieHumanoidBone>([bone]),
    ).get(bone)!;
    return {
      ankle: Vector3.lerp(bed.ankle, free.worldPosition, air),
      rotation: Quaternion.slerp(bed.rotation, free.worldRotation, air),
    };
  }
  /** One phase of the routine. */
  interface IPhase {
    /** What it is. */
    kind: Phase;

    /** Its first and last action seconds. */
    from: number;
    to: number;

    /** A contact's deflection, metres, or a flight's apex. */
    depth: number;

    /** A contact's seconds going down. */
    down: number;

    /** The speed it is entered at and left at, metres per second. */
    inSpeed: number;
    outSpeed: number;
  }

  /** A phase's kind: the standing push, a flight, a contact, the killed landing. */
  type Phase = "push" | "flight" | "contact" | "kill";

  /** The bed's top, checked under the jumper's feet. */
  function bedTop(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanTrampoline.IParams>,
    subject: string,
  ): number {
    const read: IAutoMovieMotionHumanPropReader = context.prop(subject);
    const placed: IAutoMovieRigidTransform = read.frame(context.start);
    const found: IAutoMovieAffordance | undefined = (
      read.prop.affordances ?? []
    ).find((a: IAutoMovieAffordance): boolean => a.id === "bed");
    if (found === undefined)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "on",
        value: subject,
        reason: `${subject} declares no bed`,
        fix: "bounce on a trampoline that declares its bed",
      });
    const top: number = Vector3.add(
      placed.position,
      Quaternion.rotateVector(placed.rotation, found.frame.translation),
    ).y;
    const ankle: number = context.body.rest.get("leftFoot")!.y;
    const off: number = Math.abs(context.entry.feet.left.ankle.y - ankle - top);
    if (off > 0.06)
      throw new HumanRefusal({
        kind: "base",
        axis: "on",
        value: subject,
        reason: `the feet stand ${(off * 1000).toFixed(0)} mm off the bed`,
        fix: "stand on the bed before bouncing",
      });
    return top;
  }
}
