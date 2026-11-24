import {
  AutoMovieArchetypeFrame,
  createBoat,
  rowBoat,
} from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSignature,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanMount,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
} from "@automovie/motions";
import { HumanFoot, HumanFrame } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../internal/motionHumanBody";

/** An oar contact's largest displayed wrist separation and when it occurred. */
interface IHandleGap {
  gap: number;
  at: number;
  shoulder?: IAutoMovieVector3;
  wrist?: IAutoMovieVector3;
  handle?: IAutoMovieVector3;
}

/** One authored instant of the boat's ride. */
type BoatInstant = ReturnType<typeof rowBoat>["instants"][number];

/** Posed bones observed by the independent contact checks. */
type Bones = ReturnType<typeof HumanSignature.bones>;
/** Boat surface and articulation frames sampled at film time. */
type Part = (id: string, seconds: number) => IAutoMovieTransform;
/** Which skin groups participate in a power grip. */
type Surface = "Hand" | "Thumb" | "Index" | "Middle" | "Ring" | "Little";

/**
 * A fixed-seat rider must hold the requested moving oars or receive a reach
 * refusal.
 *
 * Scenarios:
 *
 * 1. The original average man on the full seed-2 stroke reaches the named handles
 *    at the first catch, mid-stroke and 9.5 s to within 0.7 hand lengths and
 *    leans forward by at least a tenth of his trunk length from the seated
 *    entry.
 * 2. On the same boat the small woman's arms cannot simultaneously reach those
 *    crossed handles. On still water and a swell her ride must report a
 *    bilateral hand-reach refusal with the arm length as its upper bound.
 * 3. On the narrower Thames skiff the aft-facing woman takes the starboard oar in
 *    her left hand and port in her right. The 45-degree catch and finish are
 *    those taught for a solo fixed-seat rowboat in California's Boating the
 *    Right Way, chapter 4, Rowing Technique, steps 1 and 4
 *    (https://files.eric.ed.gov/fulltext/ED256727.pdf). Test the displayed
 *    palm, thumb and fingers against the swept handles, and both soles and seat
 *    against their own boat surfaces, at the same three instants on still water
 *    and a swell. Agius et al. (2023), Bioengineering 10:774, establish the
 *    forward thorax inclination at the catch; the tenth-trunk minimum remains
 *    provisional.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Observes displayed wrist distance and trunk excursion, a typed refusal for the crossed goals, and the skiff's material grip, planted feet and seat contact.
 * @evidence contracts/development/testing.md#independent-expectations The boat supplies the shaft and bearing surfaces. The grip uses the hand profile's displayed colliders and the contact audit's 10 mm pressed-skin limit. The fixed-seat training manual supplies the oar angles independently of the rider's fit.
 * @evidence contracts/development/testing.md#distinguishing-cases Preserves both original statures and the historical 9.5 s sample, including the small woman's two refused rides. The normally handed reduced-arc skiff distinguishes tracking a reachable task on still and moving water.
 * @evidence contracts/development/testing.md#execution-ownership Uses generated polygon men and in-memory ride, articulation and film readers.
 * @evidence contracts/development/common.md#meaningful-documentation Separates the original full-stroke request, its anatomical reach limit and a materially supported fixed-seat rowing stroke.
 */
export function test_motion_ride_oar_handle_tracking(): void {
  const complaints: string[] = [];
  const WAIT: number = 6;
  for (const rig of ["original", "skiff"] as const) {
    const boat: ReturnType<typeof createBoat> =
      rig === "original"
        ? createBoat({ kind: "rowboat" }, 2)
        : createBoat({ kind: "rowboat", model: "thamesSkiff" });
    const affordances: readonly IAutoMovieAffordance[] = boat.affordances ?? [];
    const along = (id: string): number =>
      affordances.find((a: IAutoMovieAffordance): boolean => a.id === id)!.frame
        .translation.z;
    const oarlocks: number = (along("leftOarlock") + along("rightOarlock")) / 2;
    const thwart: string = affordances
      .filter((a: IAutoMovieAffordance): boolean => /^thwart\d$/.test(a.id))
      .reduce((a: IAutoMovieAffordance, b: IAutoMovieAffordance) =>
        Math.abs(b.frame.translation.z - oarlocks) <
        Math.abs(a.frame.translation.z - oarlocks)
          ? b
          : a,
      ).id;
    const forward: IAutoMovieVector3 = Quaternion.rotateVector(
      affordances.find((a: IAutoMovieAffordance): boolean => a.id === thwart)!
        .frame.rotation,
      { x: 0, y: 0, z: 1 },
    );
    for (const water of ["still", "swell"] as const) {
      const ride: ReturnType<typeof rowBoat> = rowBoat(
        boat,
        {
          start: { x: 0, z: 0, heading: 0 },
          legs: [{ kind: "straight", length: 20 }],
          cruise: 1.5,
          acceleration: 0.5,
          deceleration: 0.5,
        },
        water === "swell" ? { sea: { height: 1, seed: 7 } } : {},
      );
      const binding: ReturnType<typeof rowBoat.bind> | undefined =
        rig === "original" ? rowBoat.bind(ride, WAIT) : undefined;
      const placed: (seconds: number) => IAutoMovieRigidTransform =
        binding?.motion ??
        ((seconds: number): IAutoMovieRigidTransform => {
          const placement: IAutoMovieTransform = ride.at(
            Math.max(0, seconds - WAIT),
          ).placement;
          return {
            position: placement.translation,
            rotation: placement.rotation,
          };
        });
      const part: Part =
        binding?.point ??
        ((id: string, seconds: number): IAutoMovieTransform => {
          const at: number = Math.max(0, seconds - WAIT);
          const name: createBoat.Affordance = id as createBoat.Affordance;
          const instant: ReturnType<typeof ride.at> = ride.at(at);
          const native: typeof boat = instant.archetype;
          const cycle: number = (instant.course.distance / rowBoat.STROKE) % 1;
          const drive: number = rowBoat.drive(
            rowBoat.rate(instant.course.speed),
          );
          const phase: number =
            cycle < drive ? cycle / drive : 1 + (cycle - drive) / (1 - drive);
          const stroke: number = 45 * Math.cos(Math.PI * phase);
          const posed: typeof boat = boat.articulate({
            leftOarlock: stroke,
            rightOarlock: stroke,
            leftOar: native.travel("leftOar"),
            rightOar: native.travel("rightOar"),
          });
          return AutoMovieArchetypeFrame.compose(
            instant.placement,
            posed.affordance(name).frame,
          );
        });
      const seat: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(
        boat,
        placed(0),
        thwart,
      );
      // The rower stands on the boat's floor before sitting, so the thwart
      // is measured from that floor (`seated.floor`), on the swell too.
      const floor: IAutoMovieVector3 = Quaternion.rotateVector(
        placed(0).rotation,
        affordances.find(
          (a: IAutoMovieAffordance): boolean => a.id === "floor",
        )!.frame.translation,
      );
      const standing: IAutoMovieVector3 = HumanFrame.point(
        { origin: { ...seat.at, y: 0 }, yaw: seat.yaw },
        { x: 0, y: 0, z: 0.4 },
      );
      // 1. The wrists on the handles at each catch and halfway to the next.
      const catches: number[] = ride.instants
        .filter((i: BoatInstant): boolean => /^catch\d+$/.test(i.label))
        .map((i: BoatInstant): number => WAIT + i.seconds);
      if (catches.length === 0)
        complaints.push(`${water} water: the ride names no catch`);
      if (catches.length < 2)
        throw new Error(
          "Two oar catches are required to observe the intervening drive.",
        );
      const instants: number[] = [
        ...new Set([catches[0]!, (catches[0]! + catches[1]!) / 2, 9.5]),
      ];
      const targets: ReadonlyArray<
        readonly [number, Record<AutoMovieHumanSide, IAutoMovieVector3>]
      > = instants.map(
        (
          seconds: number,
        ): readonly [number, Record<AutoMovieHumanSide, IAutoMovieVector3>] => [
          seconds,
          {
            left: part(
              rig === "original" ? "leftHandle" : "rightHandle",
              seconds,
            ).translation,
            right: part(
              rig === "original" ? "rightHandle" : "leftHandle",
              seconds,
            ).translation,
          },
        ],
      );
      for (const name of water === "still" && rig === "original"
        ? (["m-average", "f-small"] as const)
        : (["f-small"] as const)) {
        const label: string = `${rig} ${name} on ${water} water`;
        const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
        const crossed: boolean = name === "f-small" && rig === "original";
        let performance: IAutoMovieMotionHumanPerformance;
        try {
          performance = new HumanPerformance({
            seed: "rowing",
            laws: [AutoMovieMotionHumanMount.rideHorse.ride],
            props: [HumanObject.prop("boat", boat, placed(0), placed, part)],
            performers: [
              {
                subject: "a",
                body,
                at: { ...standing, y: placed(0).position.y + floor.y },
                yaw: seat.yaw,
                proficiency: { level: "trained" },
              },
            ],
            composition: HumanChain.subject("a")
              .stand({ hold: 0.3, on: { prop: "boat" } })
              .sit({ seat, hold: 0.5 })
              .registered("ride", {
                on: "boat",
                seat: thwart,
                duration: WAIT + ride.duration,
                hands:
                  rig === "original"
                    ? { left: "leftHandle", right: "rightHandle" }
                    : { left: "rightHandle", right: "leftHandle" },
              }).node,
          });
          if (crossed) {
            complaints.push(
              label + ": accepted both crossed grips on the full stroke",
            );
            continue;
          }
        } catch (error) {
          if (
            crossed &&
            error instanceof HumanRefusal &&
            error.kind === "affordance" &&
            error.axis === "hands" &&
            error.act === "ride" &&
            error.feasible?.kind === "range" &&
            typeof error.value === "number" &&
            error.feasible.maximum !== null &&
            error.feasible.unit === "m" &&
            Math.abs(
              error.feasible.maximum -
                (body.measure.upperArm + body.measure.forearm),
            ) < 1e-9 &&
            error.value > error.feasible.maximum
          )
            continue;
          complaints.push(
            `${label}: ${error instanceof Error ? error.message : String(error)}`,
          );
          continue;
        }
        try {
          const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature(
            performance,
            "a",
            body,
            0,
          );

          const neckAhead = (
            frame: ReturnType<typeof HumanSignature.bones>,
            t: number,
          ): number => {
            const neck: IAutoMovieVector3 = frame.get("neck")!.worldPosition;
            const hips: IAutoMovieVector3 = frame.get("hips")!.worldPosition;
            const local: IAutoMovieVector3 = Quaternion.rotateVector(
              Quaternion.inverse(placed(t).rotation),
              Vector3.subtract(neck, hips),
            );
            return Vector3.dot(local, forward);
          };
          const worst: Record<AutoMovieHumanSide, IHandleGap> = {
            left: { gap: 0, at: 0 },
            right: { gap: 0, at: 0 },
          };
          const planted: Partial<
            Record<AutoMovieHumanSide, IAutoMovieVector3>
          > = {};
          let firstCatch: number | undefined;
          for (const [t, handles] of targets) {
            const frame: ReturnType<typeof HumanSignature.bones> =
              HumanSignature.bones(reader, t);
            if (rig === "skiff") {
              const seatFrame: IAutoMovieTransform = part(thwart, t);
              const socket: IAutoMovieVector3 = localPoint(
                seatFrame,
                HumanSignature.region(reader, "seat", t),
              );
              const board: IAutoMovieAffordance = boat.affordance(
                thwart as createBoat.Affordance,
              );
              if (
                !(
                  Math.abs(socket.y) <= 0.001 &&
                  Math.abs(socket.x) <= board.width! / 2 &&
                  socket.z <= 0 &&
                  socket.z >= -board.depth!
                )
              )
                complaints.push(
                  `${label}: the seated region leaves the thwart at ${t} s`,
                );
              for (const side of ["left", "right"] as const) {
                const floorPart: IAutoMovieTransform = part("floor", t);
                const soles: IAutoMovieVector3[] = HumanFoot.sockets(
                  body,
                  frame,
                  side,
                ).map((s) => localPoint(floorPart, s.point));
                const sole: IAutoMovieVector3 = soles.reduce((a, b) =>
                  a.y < b.y ? a : b,
                );
                // Use a single material socket for slip: which socket is lowest can
                // change on a nearly flat sole without moving either foot.
                const ball: IAutoMovieVector3 = soles[1]!;
                const previous: IAutoMovieVector3 = (planted[side] ??= ball);
                if (
                  !(
                    Math.abs(sole.y) <= HumanFoot.BEARING &&
                    Vector3.distance(previous, ball) <= 0.005
                  )
                )
                  complaints.push(
                    `${label}: the ${side} sole leaves or slides on the floor at ${t} s`,
                  );
                const id: createBoat.Affordance =
                  side === "left" ? "rightHandle" : "leftHandle";
                const errors: string[] = gripContacts(
                  body,
                  frame,
                  side,
                  boat.affordance(id),
                  part(id, t),
                  t > catches[0]!,
                );
                for (const issue of errors)
                  complaints.push(`${label}: ${side} grip at ${t} s: ${issue}`);
              }
            }
            if (t === catches[0]) firstCatch = neckAhead(frame, t);
            for (const side of ["left", "right"] as const) {
              const wrist: IAutoMovieVector3 = frame.get(
                `${side}Hand`,
              )!.worldPosition;
              const handle: IAutoMovieVector3 = handles[side];
              const gap: number = Math.hypot(
                wrist.x - handle.x,
                wrist.y - handle.y,
                wrist.z - handle.z,
              );
              if (!Number.isFinite(gap)) {
                complaints.push(
                  `${label}: the ${side} wrist or handle has no finite displayed gap at ${t} s`,
                );
                continue;
              }
              if (gap > worst[side].gap)
                worst[side] = {
                  gap,
                  at: t,
                  shoulder: frame.get(`${side}UpperArm`)!.worldPosition,
                  wrist,
                  handle,
                };
            }
          }
          for (const side of ["left", "right"] as const) {
            const miss: IHandleGap = worst[side];
            if (miss.gap > 0.7 * body.measure.hand)
              complaints.push(
                `${label}: ${side} wrist misses by ${miss.gap} m at ${miss.at} s, limit ${0.7 * body.measure.hand} m`,
              );
          }

          // The boat's rest time can already show the handles in catch position.
          // Only the displayed entry into this ride is still the seated pose.
          if (firstCatch !== undefined) {
            const trunk: number =
              body.measure.shoulderHeight - body.measure.hipHeight;
            const entry: IAutoMovieMotionHumanSegment | undefined = performance
              .segments("a")
              .find(
                (span: IAutoMovieMotionHumanSegment): boolean =>
                  span.name === "ride",
              );
            if (entry === undefined) {
              complaints.push(`${label}: the film contains no placed ride`);
              continue;
            }
            const upright: number = neckAhead(
              HumanSignature.bones(reader, entry.entryTime),
              entry.entryTime,
            );
            const lean: number = firstCatch - upright;
            if (!(lean >= 0.1 * trunk))
              complaints.push(
                `${label}: at the first catch the neck lies ${(lean * 1000).toFixed(0)} mm further forward than the ride entry, at least ${(100 * trunk).toFixed(0)} mm expected (Agius et al. 2023)`,
              );
          }
        } catch (error) {
          complaints.push(label + ": " + String(error));
        }
      }
    }
  }
  TestValidator.equals("a rower's hands stay on the handles", complaints, []);
}

/** Place a displayed material point in the moving support's metre frame. */
function localPoint(
  frame: IAutoMovieTransform,
  point: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Quaternion.rotateVector(
    Quaternion.inverse(frame.rotation),
    Vector3.subtract(point, frame.translation),
  );
}

/** Check the grasp against the same finite capsule the round handle publishes. */
function gripContacts(
  body: IAutoMovieMotionHumanBody,
  bones: Bones,
  side: AutoMovieHumanSide,
  handle: IAutoMovieAffordance,
  frame: IAutoMovieTransform,
  midStroke: boolean,
): string[] {
  const radius: number = handle.aperture! / 2;
  const axle: IAutoMovieVector3 = Quaternion.rotateVector(frame.rotation, {
    x: handle.length! / 2 - radius,
    y: 0,
    z: 0,
  });
  const from: IAutoMovieVector3 = Vector3.subtract(frame.translation, axle);
  const to: IAutoMovieVector3 = Vector3.add(frame.translation, axle);
  const gap = (surface: Surface): number => {
    let least: number = Infinity;
    for (const segment of body.profile.segments) {
      if (!segment.bone.startsWith(side + surface)) continue;
      const bone: IAutoMovieResolvedBone = bones.get(
        segment.bone as AutoMovieHumanoidBone,
      )!;
      const placement: IAutoMovieRigidTransform = {
        position: bone.worldPosition,
        rotation: bone.worldRotation,
      };
      for (const shape of segment.shapes)
        least = Math.min(
          least,
          physicalShapeSegmentDistance(placement, shape, from, to) - radius,
        );
    }
    return least;
  };
  const fingers: number[] = (
    ["Index", "Middle", "Ring", "Little"] as const
  ).map(gap);
  const thumb: number = gap("Thumb"),
    palm: number = gap("Hand");
  const all: number[] = [palm, thumb, ...fingers];
  const errors: string[] = [];
  // All fingers close on the handle at mid-stroke. At the catch the bent
  // fingers and opposed thumb retain the handle against the palm.
  if (
    !(
      palm <= 0.001 &&
      thumb <= 0.001 &&
      Math.min(...fingers) <= 0.001 &&
      (!midStroke || Math.max(...fingers) <= 0.001)
    )
  )
    errors.push("the displayed hand loses its power grip");
  if (!all.every((d: number): boolean => Number.isFinite(d) && d >= -0.01))
    errors.push("the handle penetrates the hand beyond the 10 mm contact skin");
  return errors;
}
