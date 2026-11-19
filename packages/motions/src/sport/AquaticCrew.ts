import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionPropDrive,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { ExerciseKey } from "../exercise/ExerciseKey";
import { prepareHumanShapeBlend } from "../handling/prepareHumanShapeBlend";
import { HumanRefusal } from "../law/HumanRefusal";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AquaticPosture } from "./AquaticPosture";

/**
 * Small-craft motion. Actor contacts use the displayed hull transform at the
 * film second. Double-scull landmarks follow Cuijpers et al. at 26 strokes/min
 * (doi:10.1111/sms.12800, corrected by doi:10.1111/sms.13507). Paddle support
 * roles follow the ICF Canoe Sprint Coaching Manual and kayak footplate study
 * (PMCID PMC8539159). Dinghy gait follows the head-to-wind and recovery
 * progression from World Sailing Racing Rules 13 and 42 and Schutt (2017).
 *
 * @evidence contracts/development/common.md#meaningful-documentation Explains the hull clock and references for the visible performance.
 * @evidence contracts/development/design.md#principled-representation Holds foot or knee positions in the actual moving hull while allowing a sliding seat or support transfers.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owns small-craft body tracks and reads existing prop tracks.
 */
export namespace AquaticCrew {
  /** A hull frame reader from the action's film clock, with poised local contact anchors. */
  interface IHull {
    /** Supporting prop id. */
    id: string;
    /** Carrier orientation before the action, expressed as world to hull. */
    inverse: IAutoMovieQuaternion;
    /** Entered carrier transform. */
    origin: IAutoMovieRigidTransform;
    /** Local position of the entered root. */
    root: IAutoMovieVector3;
    /** Ankle targets relative to the hull at the entered phase. */
    feet: Readonly<Record<Side, IAutoMovieVector3>>;
    /** Carrier state at a local action second. */
    frame(seconds: number): IAutoMovieRigidTransform;
    /** The named articulated world grip, when authored. */
    grip(side: Side, seconds: number): IAutoMovieVector3 | undefined;
    /** Entered travel of a named hull articulation in its own unit. */
    travel(articulation: string): number;
  }

  /** Anatomical side. */
  type Side = "left" | "right";

  /** Types of seated or kneeling paddle performance. */
  type Stroke = "doubleScull" | "canoeStroke" | "kayakStroke";

  /** A supported race stroke or transfer over a sailing hull. */
  export function plan(
    context: AquaticPosture.Context,
    kind: Stroke | "sailTack" | "sailAbort",
  ): IAutoMovieMotionHumanActionPlan {
    const hull: IHull = bind(context);
    return kind === "sailTack" || kind === "sailAbort"
      ? sail(context, hull, kind === "sailAbort")
      : stroke(context, hull, kind);
  }

  /** Obtain support anchors once from the entered performer and the moving scene prop. */
  function bind(context: AquaticPosture.Context): IHull {
    const { params, entry, start } = context;
    const id: string | undefined = params.support;
    if (id === undefined)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "support",
        value: null,
        feasible: null,
        reason: "a small-craft action must use the performance's moving hull",
        fix: "supply the subject id of the supporting hull",
      });
    const carrier: IAutoMovieMotionHumanPropReader = context.prop(id);
    const origin: IAutoMovieRigidTransform = carrier.frame(start);
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(origin.rotation);
    const local = (point: IAutoMovieVector3): IAutoMovieVector3 =>
      Quaternion.rotateVector(inverse, Vector3.subtract(point, origin.position));
    const rest: IAutoMovieVector3 | undefined = params.footRest;
    const foot = (side: Side, sign: number): IAutoMovieVector3 => rest === undefined
      ? local(entry.feet[side].ankle)
      : { ...rest, x: rest.x + sign * context.body.measure.stature * 0.085 };
    const grip = (side: Side, seconds: number): IAutoMovieVector3 | undefined => {
      const name: string | undefined = side === "left" ? params.leftGrip : params.rightGrip;
      return name === undefined ? undefined : carrier.prop.point?.(name, start + seconds)?.point;
    };
    for (const side of ["left", "right"] as const)
      if ((side === "left" ? params.leftGrip : params.rightGrip) !== undefined && grip(side, 0) === undefined)
        throw new HumanRefusal({
          kind: "affordance",
          axis: `${side}Grip`,
          value: (side === "left" ? params.leftGrip : params.rightGrip)!,
          feasible: null,
          reason: "the supporting craft has no such grip point",
          fix: "name a socket furnished by the boat's performance prop",
        });
    return {
      id, inverse, origin,
      root: local(entry.posture.root),
      feet: { left: foot("left", 1), right: foot("right", -1) },
      frame: (seconds: number): IAutoMovieRigidTransform => carrier.frame(start + seconds),
      grip,
      travel: (articulation: string): number => carrier.state?.(start)[articulation] ?? 0,
    };
  }

  /** Sample three cycles with separate drive and unloaded recovery. */
  function stroke(context: AquaticPosture.Context, hull: IHull, kind: Stroke): IAutoMovieMotionHumanActionPlan {
    const { body, entry, params } = context;
    const scull: boolean = kind === "doubleScull";
    const canoe: boolean = kind === "canoeStroke";
    const staticSide: Side = params.side ?? "right";
    const period: number = scull ? 60 / 26 : 1.24;
    const duration: number = period * 3;
    const offset: number = (params.phase ?? 0) % 1;
    const extraction: number = scull ? 0.44 : 0.49;
    const size: number = body.measure.stature;
    const rail: ReturnType<typeof scullRail> | undefined = scull ? scullRail(context, hull) : undefined;
    const seatsOrKnee: IAutoMovieMotionHumanContactWindow[] = canoe
      ? [bear(hull.id, `${staticSide}LowerLeg`, "bear", 0, 1, staticSide === "left" ? "kneeLeft" : "kneeRight")]
      : [bear(hull.id, "seat", "seat", 0, 1)];
    const contacts: IAutoMovieMotionHumanContactWindow[] = [
      ...seatsOrKnee,
      ...(["left", "right"] as const).filter((side: Side): boolean => !canoe || side !== staticSide)
        .map((side: Side): IAutoMovieMotionHumanContactWindow => bear(hull.id, `${side}Foot`, "plant", 0, 1)),
      ...grips(hull, params),
      ...(scull || params.prop === undefined ? []
        : [{
          part: `${staticSide}Hand` as const,
          kind: "grip" as const,
          from: 0, to: 1,
          support: { kind: "prop" as const, subject: params.prop },
        }]),
    ];
    const events: IAutoMovieMotionEvent[] = [];
    for (let i: number = 0; i <= 3; i++)
      for (const [name, phase] of [["catch", 0], ["extract", extraction], ["clear", extraction + 0.11]] as const) {
        const share: number = (i + phase - offset) / 3;
        if (share >= 0 && share < 1) events.push({ name: `${name}${i + 1}`, share });
      }
    events.push({ name: "relax", share: 1 });
    return {
      duration, events, contacts,
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const t: number = Math.max(0, Math.min(duration, seconds));
        const total: number = t / period + offset;
        const cycle: number = Math.floor(total);
        const u: number = total - cycle;
        const drive: number = u <= extraction
          ? minimumJerk.share(u / extraction)
          : 1 - minimumJerk.share((u - extraction) / (1 - extraction));
        const airborne: number = u <= extraction ? 0 : Math.sin(Math.PI * (u - extraction) / (1 - extraction));
        const active: Side = scull || canoe || cycle % 2 === 0 ? staticSide : staticSide === "left" ? "right" : "left";
        const side: number = active === "left" ? 1 : -1;
        const lean: number = scull ? 25 - 39 * drive : 12 - 9 * drive;
        const leg: number = scull ? 109 - 85 * drive : 53 + 8 * drive;
        const pulling = {
          shoulder: 78 - 104 * drive + 21 * airborne,
          raise: scull ? 32 : 30 + 40 * drive,
          elbow: 10 + 84 * drive,
          wrist: 5 - 22 * airborne,
        };
        const opposite = scull ? pulling : {
          shoulder: 109 - 27 * drive + 10 * airborne,
          raise: 32 - 10 * drive,
          elbow: 64 - 24 * drive,
          wrist: 12,
        };
        const makeShape = (hand: Side): IAutoMovieMotionHumanPosture => {
          const sign: number = hand === "left" ? 1 : -1;
          return AquaticPosture.key(entry.posture, ExerciseKey.from(body, {
            pitch: scull ? 0 : lean,
            roll: scull ? 0 : sign * (canoe ? 6 : 3) * drive,
            spine: [scull ? 0.55 * lean : 8 - 6 * drive, 0, scull ? 0 : sign * (30 - 54 * drive)],
            chest: scull ? [0.45 * lean, 0, 0] : undefined,
            neck: -lean * 0.52,
          }, {
            hip: canoe ? 42 : 71 - (scull ? 33 : 0) * drive,
            knee: leg, ankle: 5,
          }, {
            ...(hand === "left" ? pulling : opposite),
            ...(canoe ? { knee: staticSide === "left" ? 104 : 77, hip: staticSide === "left" ? 9 : 77 } : {}),
          }, {
            ...(hand === "right" ? pulling : opposite),
            ...(canoe ? { knee: staticSide === "right" ? 104 : 77, hip: staticSide === "right" ? 9 : 77 } : {}),
          }));
        };
        const current: IAutoMovieMotionHumanPosture = makeShape(active);
        const switched: number = kind === "kayakStroke" ? span(u, 0.76, 1) : 0;
        const next: IAutoMovieMotionHumanPosture = switched > 0 ? makeShape(active === "left" ? "right" : "left") : current;
        const shape: IAutoMovieMotionHumanPosture = switched === 0 ? current : {
          ...current,
          roll: current.roll + (next.roll - current.roll) * switched,
          joints: prepareHumanShapeBlend(current.joints, next.joints)(switched),
        };
        const slide: IAutoMovieVector3 = rail === undefined ? direction(context, hull, {
          x: canoe ? side * 0.027 * drive : 0,
          y: 0,
          z: size * 0.025 * drive,
        }) : Vector3.scale(rail.travel, drive);
        const root: IAutoMovieVector3 = Vector3.add(rail?.root ?? hull.root, slide);
        return apply(context, hull, t, shape, root,
          canoe && staticSide === "left" ? undefined : hull.feet.left,
          canoe && staticSide === "right" ? undefined : hull.feet.right,
          true);
      },
    };
  }

  /** Keep the entered hip height on the rail and bound its rear travel by both braced legs. */
  function scullRail(context: AquaticPosture.Context, hull: IHull): {
    root: IAutoMovieVector3;
    travel: IAutoMovieVector3;
  } {
    const { body, entry } = context;
    const upright: IAutoMovieMotionHumanPosture = AquaticPosture.key(entry.posture, ExerciseKey.standing(body));
    const at: ReturnType<typeof poseBones> = poseBones(body, entry.pose);
    const nominal: ReturnType<typeof poseBones> = poseBones(body, resolveHumanPosture(body, upright));
    const offset: IAutoMovieVector3 = Vector3.subtract(at.get("hips")!.worldPosition, nominal.get("hips")!.worldPosition);
    const root: IAutoMovieVector3 = Vector3.add(hull.root, Quaternion.rotateVector(hull.inverse, offset));
    const aft: IAutoMovieVector3 = direction(context, hull, { x: 0, y: 0, z: -1 });
    const along: IAutoMovieVector3 = Vector3.normalize({ ...aft, y: 0 });
    const { thigh, shank } = body.measure;
    const reachSquared: number = thigh ** 2 + shank ** 2 + 2 * thigh * shank;
    let distance: number = body.measure.stature * 0.18;
    for (const side of ["left", "right"] as const) {
      const hip: IAutoMovieVector3 = Vector3.add(nominal.get(`${side}UpperLeg`)!.worldPosition, offset);
      const local: IAutoMovieVector3 = Quaternion.rotateVector(hull.inverse, Vector3.subtract(hip, hull.origin.position));
      const leg: IAutoMovieVector3 = Vector3.subtract(local, hull.feet[side]);
      const projected: number = Vector3.dot(leg, along);
      const discriminant: number = reachSquared - Vector3.dot(leg, leg) + projected ** 2;
      if (Vector3.dot(leg, leg) > reachSquared)
        throw new HumanRefusal({
          kind: "reach",
          axis: "footRest",
          value: hull.feet[side],
          reason: `the ${side} leg cannot reach its brace while the hips ride the seat rail`,
          fix: "stage the seat and both foot braces within the sculler's seated reach",
        });
      distance = Math.min(distance, Math.max(0, Math.sqrt(discriminant) - projected));
    }
    return { root, travel: Vector3.scale(along, distance) };
  }

  /** Two discrete foot transfers, or a near-side recovery when the helm aborts. */
  function sail(
    context: AquaticPosture.Context,
    hull: IHull,
    aborted: boolean,
  ): IAutoMovieMotionHumanActionPlan {
    const { body, entry, params } = context;
    const duration: number = 3.65;
    const helm: boolean = params.role !== "crew";
    const lead: Side = params.side ?? "left";
    const trail: Side = lead === "left" ? "right" : "left";
    const enteredHips: IAutoMovieVector3 = poseBones(body, entry.pose, undefined, new Set(["hips"])).get("hips")!.worldPosition;
    const hips: IAutoMovieVector3 = Quaternion.rotateVector(hull.inverse, Vector3.subtract(enteredHips, hull.origin.position));
    const initialSide: number = params.side === undefined ? Math.sign(hips.x) || 1 : lead === "left" ? 1 : -1;
    const cross: number = -initialSide * Math.max(Math.abs(hips.x), body.measure.stature * 0.21) * (aborted ? 1 : 2);
    const leadStart: number = helm ? 0.29 : 0.21;
    const leadEnd: number = leadStart + 0.21;
    const trailStart: number = aborted ? 0.58 : leadEnd + 0.02;
    const trailEnd: number = trailStart + 0.19;
    const clearance: number = body.measure.stature * 0.075;
    const contacts: IAutoMovieMotionHumanContactWindow[] = [
      bear(hull.id, `${lead}Foot`, "plant", 0, leadStart),
      bear(hull.id, `${lead}Foot`, "plant", leadEnd, aborted ? trailStart : 1),
      bear(hull.id, `${trail}Foot`, "plant", 0, aborted ? 1 : trailStart),
      bear(hull.id, aborted ? `${lead}Foot` : `${trail}Foot`, "plant", trailEnd, 1),
      ...grips(hull, params),
    ];
    const upright: IAutoMovieMotionHumanPosture = entry.posture;
    const drives: IAutoMovieMotionPropDrive[] = [];
    if (helm && params.boom !== undefined) {
      const start: number = hull.travel(params.boom);
      drives.push({
        prop: hull.id, articulation: params.boom, from: 0, to: 1,
        travel: (t: number): number => {
          const u: number = t / duration;
          return aborted ? start * (1 - 0.65 * (span(u, 0.12, leadEnd) - span(u, trailStart, trailEnd)))
            : start * (1 - 2 * span(u, leadStart, trailEnd));
        },
      });
    }
    if (helm && params.rudder !== undefined) {
      const start: number = hull.travel(params.rudder);
      drives.push({
        prop: hull.id, articulation: params.rudder, from: 0, to: 1,
        travel: (t: number): number => {
          const u: number = t / duration;
          return start + initialSide * 18 * (span(u, 0.12, leadStart) - span(u, leadEnd, trailEnd));
        },
      });
    }
    return {
      duration, contacts, drives,
      events: [
        { name: "helmIn", share: 0.12 },
        { name: "leadLift", share: leadStart },
        { name: "leadPlant", share: leadEnd },
        { name: aborted ? "abort" : "trailLift", share: trailStart },
        { name: "settle", share: trailEnd },
        { name: "relax", share: 1 },
      ],
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const t: number = Math.max(0, Math.min(duration, seconds));
        const u: number = t / duration;
        const first: number = span(u, leadStart, leadEnd);
        const second: number = span(u, trailStart, trailEnd);
        const stride: number = aborted ? first - second : (first + second) / 2;
        const lower: number = span(u, 0.12, leadStart) * (1 - span(u, trailEnd, 0.98));
        const trunk: IAutoMovieMotionHumanPosture = AquaticPosture.key(upright, ExerciseKey.from(body, {
          pitch: 9 + 28 * lower,
          roll: initialSide * (9 - 18 * stride),
          yaw: initialSide * 80 * stride,
          spine: [9 * lower, 0, (helm ? 20 : 10) * stride],
          neck: -12 * lower,
        }, { hip: 23 + 32 * lower, knee: 28 + 40 * lower, shoulder: 36, raise: 28, elbow: 65 }));
        const leadX: number = aborted ? first - second : first;
        const trailX: number = aborted ? 0 : second;
        const leadBase: IAutoMovieVector3 = hull.feet[lead];
        const trailBase: IAutoMovieVector3 = hull.feet[trail];
        const footA: IAutoMovieVector3 = {
          ...leadBase,
          x: leadBase.x + cross * leadX,
          y: leadBase.y + clearance * (swing(u, leadStart, leadEnd) + (aborted ? swing(u, trailStart, trailEnd) : 0)),
        };
        const footB: IAutoMovieVector3 = {
          ...trailBase,
          x: trailBase.x + cross * trailX,
          y: trailBase.y + (aborted ? 0 : clearance * swing(u, trailStart, trailEnd)),
        };
        const carriedHips: IAutoMovieVector3 = {
          ...hips,
          x: hips.x + cross * (aborted ? 0.48 : 1) * stride,
          y: hips.y - body.measure.stature * 0.26 * lower,
        };
        // The pelvis crosses the deck. Counter the offset from rotating the
        // floor-origin rig to duck, so pitch and yaw do not move it off that path.
        const offset: IAutoMovieVector3 = Vector3.subtract(AquaticPosture.marker(body, trunk, "hips"), trunk.root);
        const root: IAutoMovieVector3 = Vector3.subtract(carriedHips, Quaternion.rotateVector(hull.inverse, offset));
        return apply(context, hull, t, trunk, root, lead === "left" ? footA : footB, lead === "right" ? footA : footB);
      },
    };
  }

  /** Convert staged hull-local motion to the displayed pose and fit the active wrists and ankles. */
  function apply(
    context: AquaticPosture.Context,
    hull: IHull,
    seconds: number,
    shape: IAutoMovieMotionHumanPosture,
    local: IAutoMovieVector3,
    left?: IAutoMovieVector3,
    right?: IAutoMovieVector3,
    braced: boolean = false,
  ): IAutoMovieMotionHumanPosture {
    const frame: IAutoMovieRigidTransform = hull.frame(seconds);
    const world = (point: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.add(frame.position, Quaternion.rotateVector(frame.rotation, point));
    const root: IAutoMovieVector3 = world(local);
    const rotation: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.multiply(frame.rotation, hull.inverse),
      resolveHumanPosture.heading(shape),
    );
    const posture: IAutoMovieMotionHumanPosture = {
      ...shape,
      ...resolveHumanPosture.angles(rotation),
      root,
    };
    const carrierTurn: IAutoMovieQuaternion = Quaternion.multiply(frame.rotation, hull.inverse);
    for (const side of ["left", "right"] as const) {
      const foot: IAutoMovieVector3 | undefined = side === "left" ? left : right;
      if (foot !== undefined)
        posture.limbs[`${side}Leg`] = {
          ...AutoMovieMotionHumanLeg.goal(context.body, posture, side, {
            ankle: world(foot),
            rotation: Quaternion.multiply(carrierTurn, context.entry.feet[side].rotation),
          }, false),
          planted: braced,
        };
      const grip: IAutoMovieVector3 | undefined = hull.grip(side, seconds);
      if (grip !== undefined)
        posture.limbs[`${side}Arm`] = {
          point: grip,
          bend: Vector3.add(grip, Quaternion.rotateVector(rotation, { x: side === "left" ? 0.24 : -0.24, y: -0.18, z: -0.1 })),
        };
    }
    return posture;
  }

  /** Entered body-relative displacement expressed in the hull frame. */
  function direction(context: AquaticPosture.Context, hull: IHull, displacement: IAutoMovieVector3): IAutoMovieVector3 {
    return Quaternion.rotateVector(hull.inverse, Quaternion.rotateVector(
      resolveHumanPosture.heading(context.entry.posture), displacement,
    ));
  }

  /** Continuous, bounded progress along one authored stage. */
  function span(at: number, from: number, to: number): number {
    return minimumJerk.share(Math.max(0, Math.min(1, (at - from) / (to - from))));
  }

  /** An ankle's clearance pulse between release and replant. */
  function swing(at: number, from: number, to: number): number {
    return Math.sin(Math.PI * span(at, from, to)) ** 2;
  }

  /** A bearing window anchored in the moving hull. */
  function bear(
    subject: string,
    part: IAutoMovieMotionHumanContactWindow["part"],
    kind: IAutoMovieMotionHumanContactWindow["kind"],
    from: number,
    to: number,
    region?: IAutoMovieMotionHumanContactWindow["region"],
  ): IAutoMovieMotionHumanContactWindow {
    return { part, kind, from, to, region, support: { kind: "prop", subject } };
  }

  /** Hold articulated sockets without taking ownership of the entire hull. */
  function grips(hull: IHull, params: AquaticPosture.Context["params"]): IAutoMovieMotionHumanContactWindow[] {
    return (["left", "right"] as const).filter((side: Side): boolean =>
      (side === "left" ? params.leftGrip : params.rightGrip) !== undefined
    ).map((side: Side): IAutoMovieMotionHumanContactWindow => ({
      part: `${side}Hand`, kind: "grip", from: 0, to: 1,
      support: { kind: "prop", subject: hull.id, carries: false },
    }));
  }
}
