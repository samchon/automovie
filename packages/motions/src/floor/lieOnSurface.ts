import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionClock,
  IAutoMovieMotionClockPhase,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanLieDown,
  IAutoMovieMotionHumanLieOnSurface,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanPropFrame } from "../perform/HumanPropFrame";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { prepareHumanShapeBlend } from "../posture/prepareHumanShapeBlend";
import { knockdown } from "../reaction/knockdown";
import { lieDownPoses } from "./lieDownPoses";
import { lieOnSurfaceFits } from "./lieOnSurfaceFits";
import { lieOnSurfaceSeat } from "./lieOnSurfaceSeat";
import { lieOnSurfaceSite } from "./lieOnSurfaceSite";

/** Seconds of each phase (provisional: `lieDown`'s phase). */
const PHASE: number = 1.2;

/**
 * The free room beyond the head and beside each shoulder on the surface, metres
 * (provisional).
 */
const MARGIN: number = 0.05;

/**
 * How far behind the edge the seated hips sit, metres (provisional: the thighs
 * resting over the edge).
 */
const BEHIND: number = 0.15;

/**
 * One key of the route: the body's tilt and joints, the hips' world point and
 * the event that names its arrival.
 */
interface IKey {
  /** The tilt and the joints. */
  pose: IAutoMovieMotionHumanLieDown.IPose;

  /** The heading the tilt is written under, degrees. */
  yaw: number;

  /** The hips joint's world point. */
  hips: IAutoMovieVector3;

  /** Whether the body lies on the surface at this key. */
  lying: boolean;

  /** The arrival's event name. */
  event: string;
}
/** The alternatives of `PlanLieOnSurfaceContactsPart`'s site. */
type PlanLieOnSurfaceContactsPart = "leftFoot" | "rightFoot";

/**
 * Lie on a raised support. Entered seated on a bed's or a sofa's long edge, the
 * trunk lowers onto the side that turns toward the head end (the body's left on
 * the edge whose left points there) while the legs swing up onto the surface,
 * then the body rolls onto its back; `rise` reverses the route from lying to
 * sitting on the edge, feet on the floor. The keys are `lieDown`'s side-lying
 * and supine postures (VanSant 1988 components, provisional angles) laid along
 * the surface's length, the hips on its midline with the head's room before
 * them. Lying, the root rests the body's lowest collision shape on the surface
 * (`knockdown.rest` raised to it); between the edge and the side the hips
 * travel on a straight line. A surface shorter than the body and `MARGIN`, or
 * narrower than the shoulders and twice `MARGIN`, is refused with the
 * dimension, as is a lie not entered seated.
 */
function planLieOnSurface(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanLieOnSurface>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanLieOnSurface = context.params;
  const body: IAutoMovieMotionHumanActionContext["body"] = context.body;
  const hold: number = p.hold ?? 0;
  HumanBound.least("hold", hold, 0, "s");
  const rise: boolean = p.rise === true;
  const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
  const seatedEntry: boolean = context.entry.supports.some(
    (s: IAutoMovieMotionHumanEntryState.ISupport): boolean => s.kind === "seat",
  );
  if (!rise && !seatedEntry)
    throw new HumanRefusal({
      kind: "base",
      axis: "edge",
      value: p.edge,
      reason: "lying down onto a raised surface starts seated on its edge",
      fix: "sit on the edge first",
    });
  const reader: IAutoMovieMotionHumanPropReader = context.prop(p.prop);
  const model: IAutoMovieRigidTransform = reader.frame(context.start);
  const surface: IAutoMovieAffordance = lieOnSurfaceSite(
    reader,
    p.surface ?? "surface",
    "surface",
  );
  const edge: IAutoMovieAffordance = lieOnSurfaceSite(reader, p.edge, "seat");
  const bed: IAutoMovieRigidTransform = HumanPropFrame.compose(
    model,
    frame(surface),
  );
  const seat: IAutoMovieRigidTransform = HumanPropFrame.compose(
    model,
    frame(edge),
  );
  lieOnSurfaceFits(body, surface, MARGIN);

  // The head end lies along the surface's -Z; the body lies onto the side that turns toward it.
  const head: IAutoMovieVector3 = Quaternion.rotateVector(bed.rotation, {
    x: 0,
    y: 0,
    z: -1,
  });
  const out: IAutoMovieVector3 = Quaternion.rotateVector(seat.rotation, {
    x: 0,
    y: 0,
    z: 1,
  });
  const yaw: number = (Math.atan2(out.x, out.z) * 180) / Math.PI;
  const left: IAutoMovieVector3 = {
    x: Math.cos((yaw * Math.PI) / 180),
    y: 0,
    z: -Math.sin((yaw * Math.PI) / 180),
  };
  const side: AutoMovieHumanSide =
    Vector3.dot(left, head) >= 0 ? "left" : "right";
  const roll: number = side === "left" ? -90 : 90;
  const offset: (posture: IAutoMovieMotionHumanPosture) => IAutoMovieVector3 = (
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieVector3 =>
    Quaternion.rotateVector(
      humanPostureHeading(posture),
      body.rest.get("hips")!,
    );
  const reach: number = body.measure.stature - body.rest.get("hips")!.y;
  const lyingHips: IAutoMovieVector3 = Vector3.add(
    bed.position,
    Vector3.scale(head, surface.depth! / 2 - MARGIN - reach),
  );
  const entryHips: IAutoMovieVector3 = Vector3.add(entry.root, offset(entry));
  const along: number = Vector3.dot(
    Vector3.subtract(rise ? entryHips : lyingHips, seat.position),
    head,
  );
  const seatedHips: IAutoMovieVector3 = rise
    ? Vector3.add(Vector3.add(seat.position, Vector3.scale(head, along)), {
        ...Vector3.scale(out, -BEHIND),
        y: entryHips.y - bed.position.y,
      })
    : entryHips;
  const perched: lieOnSurfaceSeat.IKey = lieOnSurfaceSeat.key(
    body,
    seatedHips.y,
    0,
  );
  const seated: IKey = {
    pose: rise
      ? perched.pose
      : { pitch: entry.pitch, roll: entry.roll, joints: entry.joints },
    yaw: rise ? yaw : entry.yaw,
    hips: seatedHips,
    lying: false,
    event: "seated",
  };
  const lateral: IKey = {
    pose: {
      ...lieDownPoses.POSES[side === "left" ? "lateralLeft" : "lateralRight"],
      pitch: -2,
      roll,
    },
    yaw,
    hips: lyingHips,
    lying: true,
    event: "lateral",
  };
  const supine: IKey = {
    pose: { ...lieDownPoses.POSES.supine, pitch: -90, roll },
    yaw,
    hips: lyingHips,
    lying: true,
    event: "supine",
  };
  const position: IAutoMovieMotionHumanLieOnSurface.Position =
    p.position ?? "supine";
  const lyingEntry: IKey = rise
    ? {
        pose: {
          pitch: entry.pitch,
          roll: entry.roll,
          joints: entry.joints,
        },
        yaw: entry.yaw,
        hips: entryHips,
        lying: true,
        event: position,
      }
    : seated;
  const keys: readonly IKey[] = rise
    ? position === "supine"
      ? [lyingEntry, lateral, seated]
      : [lyingEntry, seated]
    : position === "supine"
      ? [seated, lateral, supine]
      : [seated, lateral];
  const phases: IAutoMovieMotionClockPhase[] = [
    { name: rise ? "sitUp" : "lowering", seconds: PHASE },
    ...keys.slice(1, -1).map(
      (k: IKey): IAutoMovieMotionClockPhase => ({
        name: k.event,
        seconds: PHASE,
      }),
    ),
    { name: keys.at(-1)!.event, seconds: 0 },
    { name: "settled", seconds: hold },
  ];
  const clock: IAutoMovieMotionClock = AutoMovieMotionManner.time(
    AutoMovieMotionClock.sequence(phases),
    AutoMovieMotionManner(context, p.manner),
    { holds: ["settled"] },
  );
  const progress: ReturnType<typeof AutoMovieMotionClock.prepare>[] = keys
    .slice(1)
    .map(
      (_k: IKey, i: number): ReturnType<typeof AutoMovieMotionClock.prepare> =>
        AutoMovieMotionClock.prepare(
          clock,
          phases[i]!.name,
          phases[i + 1]!.name,
        ),
    );
  const blends: ((weight: number) => IAutoMovieMotionHumanPosture["joints"])[] =
    keys
      .slice(1)
      .map(
        (
          k: IKey,
          i: number,
        ): ((weight: number) => IAutoMovieMotionHumanPosture["joints"]) =>
          prepareHumanShapeBlend(keys[i]!.pose.joints, k.pose.joints),
      );
  const rest: ReturnType<typeof knockdown.prepareRest> =
    knockdown.prepareRest(body);
  const posed: (index: number, u: number) => IAutoMovieMotionHumanPosture = (
    index: number,
    u: number,
  ): IAutoMovieMotionHumanPosture => {
    const a: IKey = keys[index]!;
    const b: IKey = keys[index + 1]!;
    // The whole body turns on the shortest rotation between the keys' own tilts, whatever chart each was written in.
    return {
      root: { x: 0, y: 0, z: 0 },
      ...humanPostureHeading.angles(
        Quaternion.slerp(
          humanPostureHeading({
            yaw: a.yaw,
            pitch: a.pose.pitch,
            roll: a.pose.roll,
          }),
          humanPostureHeading({
            yaw: b.yaw,
            pitch: b.pose.pitch,
            roll: b.pose.roll,
          }),
          u,
        ),
      ),
      joints: blends[index]!(u),
      limbs: {},
    };
  };
  // A key's root height: resting on the surface when lying, the entry's or the seat's otherwise.
  const height: (
    k: IKey,
    posture: IAutoMovieMotionHumanPosture,
    read: ReturnType<typeof prepareHumanPoseResolution>,
    project: ReturnType<typeof prepareHumanPostureProjection>,
  ) => number = (
    k: IKey,
    posture: IAutoMovieMotionHumanPosture,
    read: ReturnType<typeof prepareHumanPoseResolution>,
    project: ReturnType<typeof prepareHumanPostureProjection>,
  ): number =>
    k.lying
      ? rest(posture, read, project) + bed.position.y
      : k.hips.y - offset(posture).y;
  const at: (
    seconds: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ) => IAutoMovieMotionHumanPosture = (
    seconds: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieMotionHumanPosture => {
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(resolution);
    const project: ReturnType<typeof prepareHumanPostureProjection> =
      projection ?? prepareHumanPostureProjection(body);
    let index: number = 0;
    let u: number = progress[0]!.progress(seconds);
    for (let i: number = 1; i < progress.length; ++i)
      if (progress[i]!.progress(seconds) > 0) {
        index = i;
        u = progress[i]!.progress(seconds);
      }
    const a: IKey = keys[index]!;
    const b: IKey = keys[index + 1]!;
    const posture: IAutoMovieMotionHumanPosture = posed(index, u);
    const hips: IAutoMovieVector3 = Vector3.lerp(a.hips, b.hips, u);
    const shift: IAutoMovieVector3 = offset(posture);
    const y: number =
      a.lying && b.lying
        ? rest(posture, read, project) + bed.position.y
        : height(a, posed(index, 0), read, project) +
          (height(b, posed(index, 1), read, project) -
            height(a, posed(index, 0), read, project)) *
            u;
    return {
      ...posture,
      root: { x: hips.x - shift.x, y, z: hips.z - shift.z },
    };
  };
  const duration: number = clock.duration;
  const lying: IAutoMovieMotionHumanPrimitive = {
    channels: [
      "root",
      "trunk",
      "head",
      "leftLeg",
      "rightLeg",
      "leftArm",
      "rightArm",
    ],
    reads: [],
    from: 0,
    to: duration,
    write: (
      _: IAutoMovieMotionHumanPosture,
      seconds: number,
      _before?: IAutoMovieMotionHumanPrimitive.Reader,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: ReturnType<typeof prepareHumanPostureProjection>,
    ): IAutoMovieMotionHumanPosture => at(seconds, resolution, projection),
  };
  const turned: number = clock.at(phases[1]!.name) / duration;
  const support: IAutoMovieMotionHumanContactWindow.Support = {
    kind: "prop",
    subject: p.prop,
  };
  // The contact parts have no side or chest; the trunk's window is the back's in every lying position.
  const contacts: IAutoMovieMotionHumanContactWindow[] = rise
    ? [
        { part: "back", kind: "lie", from: 0, to: turned, support },
        { part: "seat", kind: "seat", from: turned, to: 1, support },
        ...(perched.planted ? (["leftFoot", "rightFoot"] as const) : []).map(
          (
            part: PlanLieOnSurfaceContactsPart,
          ): IAutoMovieMotionHumanContactWindow => ({
            part,
            kind: "plant",
            from: clock.at(keys.at(-1)!.event) / duration,
            to: 1,
            support: { kind: "ground" },
          }),
        ),
      ]
    : [
        { part: "seat", kind: "seat", from: 0, to: turned, support },
        { part: "back", kind: "lie", from: turned, to: 1, support },
      ];
  const planned: IAutoMovieMotionHumanActionPlan =
    composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.still(duration, entry, contacts),
      clock,
      contact: "settled",
      primitives: [lying],
    });
  return {
    ...planned,
    base: rise ? { kind: "seated" } : { kind: "lying" },
  };
}

/**
 * Lie on a raised support. Entered seated on a bed's or a sofa's long edge, the
 * trunk lowers onto the side that turns toward the head end (the body's left on
 * the edge whose left points there) while the legs swing up onto the surface,
 * then the body rolls onto its back; `rise` reverses the route from lying to
 * sitting on the edge, feet on the floor. The keys are `lieDown`'s side-lying
 * and supine postures (VanSant 1988 components, provisional angles) laid along
 * the surface's length, the hips on its midline with the head's room before
 * them. Lying, the root rests the body's lowest collision shape on the surface
 * (`knockdown.rest` raised to it); between the edge and the side the hips
 * travel on a straight line. A surface shorter than the body and `MARGIN`, or
 * narrower than the shoulders and twice `MARGIN`, is refused with the
 * dimension, as is a lie not entered seated.
 */
export const lieOnSurface: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLieOnSurface> =
  {
    name: "lieOnSurface",
    interrupts: {
      any: [{ window: ["settled", 1], kind: "inertialize", entry: 0 }],
    },
    plan: planLieOnSurface,
  };

/** An affordance's local frame. */
function frame(a: IAutoMovieAffordance): IAutoMovieRigidTransform {
  return { position: a.frame.translation, rotation: a.frame.rotation };
}
