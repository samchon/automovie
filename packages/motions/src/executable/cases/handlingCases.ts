import {
  DEFAULT_HUMANOID_ROM,
  Quaternion,
  Transform,
  Vector3,
  closestPointsBetweenSegments,
  jointRomOvershoot,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGrip,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanProp,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import { createHumanBody } from "../../body/createHumanBody";
import { HumanGrip } from "../../handling/HumanGrip";
import { HumanPerformance } from "../../perform/HumanPerformance";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { MotionBodies } from "../MotionBodies";
import type { humanPolygonMan } from "../humanPolygonMan";
import { handoverCases } from "./handoverCases";
import { handshakeCases } from "./handshakeCases";

/** The alternatives of `HandlingCasesFamily`'s site. */
type HandlingCasesFamily = "handshake" | "grasp" | "handover";

/**
 * Capture cases of the handling laws on the polygon man, for what the numeric
 * tests cannot show: whether a reach reads as reaching for a hand, whether the
 * fingers wrap the partner's hand, and whether the pump reads.
 *
 * - `handling-handshake-<pair>`: the handshake cases of `handshakeCases`.
 * - `handling-grasp-<body>`: the small woman, the average man and the tall man
 *   pick up a bottle (an upright 70 by 190 mm capsule) from a standing work
 *   surface 15 cm below their own elbow height, walk 0.6 m and put it on one 10
 *   cm below it, the two edges of Grandjean's band for light standing work
 *   (Fitting the Task to the Man: 10 to 15 cm below the elbow; a fixed 0.91 m
 *   counter lies below the tall man's standing reach, and these laws do not
 *   bend), the grip each time at 85 % of the arm's reach (upper arm and
 *   forearm) from the shoulder where the standing body actually holds it at the
 *   action's entry. Key frames at the start, 60 and 70 % of the reach,
 *   `gripClosed`, `lifted`, mid-carry, `placed` and the end. Boxes: the two
 *   surfaces (sand), the bottle where it starts (green) and where it ends
 *   (brown), drawn statically since an overlay does not move; trails: the right
 *   wrist (red) and the bottle's centre (green). Verdicts: peak aperture inside
 *   60-70 % of the transport, each digit within 2 mm of the bottle without
 *   entering it, the bottle within 1 mm of its grip through the carry, the put
 *   down's place and uprightness, ankle slip while handling, and the range of
 *   motion.
 * - `handling-handover-<giver>-<receiver>`: the small woman hands a bottle to the
 *   tall man, and an average man to another, standing at `handshake.gap`; key
 *   frames at the offer's start, `offered`, `gripClosed`, the shared hold,
 *   `release` and the end; the bottle's path is a trail and the chests'
 *   midpoint is marked. Verdicts: the release after the receiver's grip, the
 *   bottle's middle within 0.15 m of the chests' midpoint at the exchange, no
 *   jump of the bottle, the receiver's hold within 1 mm, no hand or forearm
 *   interpenetration beyond 10 mm (`HandOverlap`), ankle slip and the range of
 *   motion.
 *
 * @param family One case family (`handshake`, `grasp`, `handover`) or all when
 *   absent.
 * @returns The cases.
 */
export function handlingCases(
  family?: HandlingCasesFamily,
): IMotionCaptureCase[] {
  const out: IMotionCaptureCase[] = [];
  if (family === undefined || family === "handshake")
    out.push(...handshakeCases());
  if (family === undefined || family === "grasp")
    for (const name of ["f-small", "m-average", "m-tall"]) {
      const man: humanPolygonMan.IPolygonMan = MotionBodies.population(name);
      const body: IAutoMovieMotionHumanBody = createHumanBody(
        man.body.skeleton,
        man.body.profile,
      );
      // The shoulders the pick up and the put down start from: the same stand
      // and walk performed without the bottle, read at each action's entry.
      const rehearsal: IAutoMovieMotionHumanPerformance = new HumanPerformance({
        seed: `handling-grasp-${name}`,
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        props: [],
        composition: HumanChain.subject("a")
          .stand({ hold: 0.4 })
          .walk({ to: { x: 0, y: 0, z: 0.6 } }).node,
      });
      const shoulderAt = (t: number): IAutoMovieVector3 =>
        rehearsal.bones("a", t).get("rightUpperArm")!.worldPosition;
      // The bottle stands so its grip, on the axis 0.095 m up, lies 85 % of
      // the arm's reach from the shoulder, the palm 0.035 m short of the axis.
      const reach: number =
        0.85 * (body.measure.upperArm + body.measure.forearm);
      const front = (
        shoulder: IAutoMovieVector3,
        top: number,
      ): IAutoMovieVector3 => {
        const drop: number = shoulder.y - top - 0.095;
        if (Math.abs(drop) >= reach)
          throw new Error(
            `handling-grasp-${name}: a surface at ${top.toFixed(3)} m lies beyond a standing reach`,
          );
        return {
          x: shoulder.x,
          y: top,
          z: shoulder.z + Math.sqrt(reach * reach - drop * drop) + 0.035,
        };
      };
      const elbow: number = body.measure.shoulderHeight - body.measure.upperArm;
      const desk: number = elbow - 0.15;
      const surface: number = elbow - 0.1;
      const place: IAutoMovieVector3 = front(shoulderAt(0.4), desk);
      const target: IAutoMovieVector3 = front(
        shoulderAt(rehearsal.duration),
        surface,
      );

      // The grip frame: +X up the bottle (the wrapped axis), +Y toward the performer.
      const turn: IAutoMovieQuaternion = Quaternion.normalize(
        Quaternion.multiply(
          Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 90),
          Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, -90),
        ),
      );
      const bottle: IAutoMovieMotionHumanProp = {
        subject: "bottle",
        frame: { position: place, rotation: Quaternion.identity() },
        points: {},
        shapes: [
          {
            id: "glass",
            material: "glass",
            transform: {
              position: { x: 0, y: 0.095, z: 0 },
              rotation: Quaternion.identity(),
            },
            kind: "capsule",
            radius: 0.035,
            halfLength: 0.06,
          },
        ],
        affordances: [
          {
            id: "handle",
            kind: "handle",
            frame: Transform.of({ x: 0, y: 0.095, z: 0 }, turn),
            extent: null,
            grip: "power",
            aperture: 0.07,
          },
        ],
      };
      const performance: IAutoMovieMotionHumanPerformance =
        new HumanPerformance({
          seed: `handling-grasp-${name}`,
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" },
            },
          ],
          props: [bottle],
          composition: HumanChain.subject("a")
            .stand({ hold: 0.4 })
            .pickUp({ prop: "bottle", handle: "handle", hand: "right" })
            .walk({ to: { x: 0, y: 0, z: 0.6 } })
            .putDown({ prop: "bottle", to: target, yaw: 0, hand: "right" })
            .stand({ hold: 0.4 }).node,
        });
      const up = performance.segments("a").find((s) => s.name === "pickUp")!;
      const down = performance.segments("a").find((s) => s.name === "putDown")!;
      const at = (segment: typeof up, event: string): number =>
        segment.start +
        segment.plan.events.find((e) => e.name === event)!.share *
          segment.plan.duration;
      const closed: number = at(up, "gripClosed");
      const placed: number = at(down, "placed");
      const centre = (t: number): IAutoMovieVector3 => {
        const f = performance.prop("bottle", t);
        return Vector3.add(
          f.position,
          Quaternion.rotateVector(f.rotation, { x: 0, y: 0.095, z: 0 }),
        );
      };

      // Aperture: thumb to index tip, peaking inside the reach.
      let peak: number = -Infinity;
      let peakAt: number = up.entryTime;
      for (let t: number = up.entryTime; t <= closed; t += 1 / 240) {
        const aperture: number = HumanGrip.aperture(
          body,
          "right",
          HumanGrip.fingers(performance.pose("a", t), "right"),
        );
        if (aperture > peak) {
          peak = aperture;
          peakAt = t;
        }
      }
      const share: number = (peakAt - up.entryTime) / (closed - up.entryTime);

      // Digits against the bottle's capsule at the grip.
      const bones = performance.bones("a", closed);
      const frame = performance.prop("bottle", closed);
      const axis: IAutoMovieVector3 = Quaternion.rotateVector(frame.rotation, {
        x: 0,
        y: 0.06,
        z: 0,
      });
      const digits: readonly IAutoMovieMotionHumanGrip.Digit[] = [
        "Thumb",
        "Index",
        "Middle",
        "Ring",
        "Little",
      ];
      const gaps: number[] = digits.map(
        (digit: IAutoMovieMotionHumanGrip.Digit): number =>
          Math.min(
            ...HumanGrip.bones("right", digit).map(
              (bone: AutoMovieHumanoidBone): number => {
                const c = HumanGrip.chain(body, "right", digit);
                const r: IAutoMovieResolvedBone = bones.get(bone)!;
                const shape = body.profile.segments
                  .find((s) => s.bone === bone)!
                  .shapes.find((s) => s.kind === "capsule")!;
                const middle: IAutoMovieVector3 = Vector3.add(
                  r.worldPosition,
                  Quaternion.rotateVector(
                    r.worldRotation,
                    shape.transform.position,
                  ),
                );
                const along: IAutoMovieVector3 = Quaternion.rotateVector(
                  Quaternion.multiply(
                    r.worldRotation,
                    shape.transform.rotation,
                  ),
                  {
                    x: 0,
                    y: shape.kind === "capsule" ? shape.halfLength : 0,
                    z: 0,
                  },
                );
                return (
                  closestPointsBetweenSegments(
                    Vector3.subtract(middle, along),
                    Vector3.add(middle, along),
                    Vector3.subtract(centre(closed), axis),
                    Vector3.add(centre(closed), axis),
                  ).distance -
                  c.radius -
                  0.035
                );
              },
            ),
          ),
      );

      // The carry: the bottle's offset in the hand from the grip to the placing.
      const offset = (t: number): IAutoMovieVector3 => {
        const hand: IAutoMovieResolvedBone = performance
          .bones("a", t)
          .get("rightHand")!;
        return Quaternion.rotateVector(
          Quaternion.inverse(hand.worldRotation),
          Vector3.subtract(
            performance.prop("bottle", t).position,
            hand.worldPosition,
          ),
        );
      };
      let carried: number = 0;
      for (let t: number = closed; t <= placed; t += 1 / 24)
        carried = Math.max(
          carried,
          Vector3.distance(offset(t), offset(closed)),
        );

      // Put down, slip during the handling, range of motion.
      const rest = performance.prop("bottle", performance.duration);
      const tilt: number =
        (Math.acos(
          Math.min(
            1,
            Quaternion.rotateVector(rest.rotation, { x: 0, y: 1, z: 0 }).y,
          ),
        ) *
          180) /
        Math.PI;
      let slip: number = 0;
      for (const segment of [up, down])
        for (const foot of ["leftFoot", "rightFoot"] as const) {
          const from: IAutoMovieVector3 = performance
            .bones("a", segment.entryTime)
            .get(foot)!.worldPosition;
          for (let t: number = segment.entryTime; t <= segment.end; t += 1 / 24)
            slip = Math.max(
              slip,
              Vector3.distance(
                performance.bones("a", t).get(foot)!.worldPosition,
                from,
              ),
            );
        }
      let overshoot: number = 0;
      for (let t: number = 0; t <= performance.duration; t += 1 / 24)
        for (const j of performance.pose("a", t).joints) {
          const c = DEFAULT_HUMANOID_ROM[j.bone];
          if (c !== undefined)
            overshoot = Math.max(overshoot, jointRomOvershoot(j, c));
        }
      const trail: IAutoMovieVector3[] = [];
      const path: IAutoMovieVector3[] = [];
      for (
        let t: number = up.entryTime;
        t <= performance.duration;
        t += 1 / 48
      ) {
        trail.push(performance.bones("a", t).get("rightHand")!.worldPosition);
        path.push(centre(t));
      }
      out.push({
        name: `handling-grasp-${name}`,
        times: [
          { seconds: up.entryTime, label: "start" },
          {
            seconds: up.entryTime + 0.6 * (closed - up.entryTime),
            label: "reach 60 %",
          },
          {
            seconds: up.entryTime + 0.7 * (closed - up.entryTime),
            label: "reach 70 %",
          },
          { seconds: closed, label: "gripClosed" },
          { seconds: at(up, "lifted"), label: "lifted" },
          { seconds: (up.end + down.entryTime) / 2, label: "carry" },
          { seconds: placed, label: "placed" },
          { seconds: performance.duration, label: "end" },
        ],
        performers: [
          {
            id: "a",
            body: man.body,
            pose: (t: number) => performance.pose("a", t),
          },
        ],
        trails: [
          { color: 0xd04040, points: trail },
          { color: 0x4a8a5a, points: path },
        ],
        boxes: [
          {
            centre: { x: place.x, y: desk - 0.015, z: place.z },
            half: { x: 0.3, y: 0.015, z: 0.2 },
            color: 0xb8a888,
          },
          {
            centre: { x: target.x, y: surface - 0.015, z: target.z },
            half: { x: 0.3, y: 0.015, z: 0.2 },
            color: 0xb8a888,
          },
          {
            centre: centre(0),
            half: { x: 0.035, y: 0.095, z: 0.035 },
            color: 0x4a8a5a,
          },
          {
            centre: centre(performance.duration),
            half: { x: 0.035, y: 0.095, z: 0.035 },
            color: 0x8a6a4a,
          },
        ],
        targets: [{ at: centre(closed), radius: 0.02, color: 0x40a040 }],
        verdicts: [
          {
            name: "peak aperture inside 60-70 % of the transport (Jeannerod 1984)",
            passed: share >= 0.6 && share <= 0.7,
            detail: `${(share * 100).toFixed(1)} % at ${(peak * 1000).toFixed(1)} mm`,
          },
          {
            name: "each digit within 2 mm of the bottle, none entering",
            passed: gaps.every(
              (g: number): boolean => g >= -0.001 && g <= 0.002,
            ),
            detail:
              gaps
                .map((g: number): string => `${(g * 1000).toFixed(1)}`)
                .join(", ") + " mm (thumb to little)",
          },
          {
            name: "the bottle within 1 mm of its grip through the carry",
            passed: carried <= 0.001,
            detail: `${(carried * 1000).toFixed(2)} mm`,
          },
          {
            name: "put down within 1 mm of its place",
            passed: Vector3.distance(rest.position, target) <= 0.001,
            detail: `${(Vector3.distance(rest.position, target) * 1000).toFixed(2)} mm`,
          },
          {
            name: "put down upright within 1 degree",
            passed: tilt <= 1,
            detail: `${tilt.toFixed(2)} deg`,
          },
          {
            name: "ankles move at most 5 mm while handling",
            passed: slip <= 0.005,
            detail: `${(slip * 1000).toFixed(2)} mm`,
          },
          {
            name: "every joint inside the default range of motion",
            passed: overshoot <= 1e-6,
            detail: `${overshoot.toFixed(4)} deg`,
          },
        ],
      });
    }
  if (family === undefined || family === "handover")
    out.push(...handoverCases());
  return out;
}
