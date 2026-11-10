import {
  DEFAULT_HUMANOID_ROM,
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  closestPointsBetweenSegments,
  jointRomOvershoot,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import type { IHumanBody } from "../../body/IHumanBody";
import { createHumanBody } from "../../body/createHumanBody";
import { HumanGrip } from "../../handling/HumanGrip";
import { handshake } from "../../handling/handshake";
import { HumanPerformance } from "../../perform/HumanPerformance";
import type { IHumanProp } from "../../perform/IHumanProp";
import { HumanHand } from "../../posture/HumanHand";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { MotionBodies } from "../MotionBodies";
import type { humanPolygonMan } from "../humanPolygonMan";

/**
 * Capture cases of the handling laws on the polygon man, for what the
 * numeric tests cannot show: whether a reach reads as reaching for a hand,
 * whether the fingers wrap the partner's hand, and whether the pump reads.
 *
 * - `handling-handshake-<pair>`: the tall man with the small woman, and two
 *   average men, standing at `handshake.gap` (where their offering arms
 *   meet), shake hands; instants at the start, the reach's peak aperture band
 *   (60 and 70 % of the reach), the clasp, the pump's top and bottom, the
 *   release and the end. Both right wrists leave trails and the meeting point
 *   is marked. Verdicts: the palms meet within 15 mm at the clasp and stay
 *   within 10 mm through the pump, the chests stand in Hall's personal zone,
 *   no right-hand phalanx or forearm capsule enters the other's by more than
 *   10 mm (the palm boxes are not measured here), every joint stays in the
 *   default range, and the ankles move at most 5 mm.
 * - `handling-grasp-<body>`: the small woman, the average man and the tall
 *   man pick up a bottle (an upright 70 by 190 mm capsule) from a standing
 *   work surface 15 cm below their own elbow height, walk 0.6 m and put it on
 *   one 10 cm below it, the two edges of Grandjean's band for light standing
 *   work (Fitting the Task to the Man: 10 to 15 cm below the elbow; a fixed
 *   0.91 m counter lies below the tall man's standing reach, and these laws
 *   do not bend), the grip each time at 85 % of
 *   the arm's reach (upper arm and forearm) from the shoulder where the
 *   standing body actually holds it at the action's entry. Key frames at the start, 60 and 70 % of the reach,
 *   `gripClosed`, `lifted`, mid-carry, `placed` and the end. Boxes: the two
 *   surfaces (sand), the bottle where it starts (green) and where it ends
 *   (brown), drawn statically since an overlay does not move; trails: the
 *   right wrist (red) and the bottle's centre (green). Verdicts: peak
 *   aperture inside 60-70 % of the transport, each digit within 2 mm of the
 *   bottle without entering it, the bottle within 1 mm of its grip through
 *   the carry, the put down's place and uprightness, ankle slip while
 *   handling, and the range of motion.
 * - `handling-handover-<giver>-<receiver>`: the small woman hands a bottle
 *   to the tall man, and an average man to another, standing at
 *   `handshake.gap`; key frames at the offer's start, `offered`,
 *   `gripClosed`, the shared hold, `release` and the end; the bottle's path
 *   is a trail and the chests' midpoint is marked. Verdicts: the release
 *   after the receiver's grip, the exchange within 0.15 m of the chests'
 *   midpoint, no jump of the bottle, the receiver's hold within 1 mm, no
 *   hand or forearm interpenetration beyond 10 mm, ankle slip and the range
 *   of motion.
 *
 * @param family One case family (`handshake`, `grasp`, `handover`) or all when absent.
 * @returns The cases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists every case, its instants, overlays and verdicts.
 * @evidence contracts/development/implementation.md#principled-implementation Each case runs the real performance and samples its displayed poses at the plan's own events.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One builder per family over a shared performance and figure helper.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Instants come from the plan's events; verdicts read forward kinematics, not the law's goals.
 * @evidence contracts/development/implementation.md#efficient-algorithms One performance per case; poses are sampled at drawn instants and trail points.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
export function handlingCases(
  family?: "handshake" | "grasp" | "handover",
): IMotionCaptureCase[] {
  const out: IMotionCaptureCase[] = [];
  if (family === undefined || family === "handshake")
    for (const [first, second] of [
      ["m-tall", "f-small"],
      ["m-average", "m-average"],
    ] as const) {
      const one: humanPolygonMan.IPolygonMan = MotionBodies.population(first);
      const two: humanPolygonMan.IPolygonMan = MotionBodies.population(second);
      const a: IHumanBody = createHumanBody(
        one.body.skeleton,
        one.body.profile,
      );
      const b: IHumanBody = createHumanBody(
        two.body.skeleton,
        two.body.profile,
      );

      // The partners stand where their offering arms meet.

      const D: number =
        handshake.gap(a.measure, b.measure) +
        a.measure.chestDepth / 2 +
        b.measure.chestDepth / 2;
      const performance: HumanPerformance = new HumanPerformance({
        seed: `handling-handshake-${first}-${second}`,
        performers: [
          {
            subject: "a",
            body: a,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
          {
            subject: "b",
            body: b,
            at: { x: 0, y: 0, z: D },
            yaw: 180,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.pair(
          HumanChain.subject("a").stand({ seconds: 0.4 }),
          HumanChain.subject("b").stand({ seconds: 0.4 }),
        ).handshake().node,
      });
      const segment = performance
        .segments("a")
        .find((x) => x.name === "handshake")!;
      const at = (event: string): number =>
        segment.start +
        segment.plan.events.find((e) => e.name === event)!.share *
          segment.plan.duration;
      const clasp: number = at("clasp");
      const release: number = at("release");
      const pump: number = 1 / handshake.FREQUENCY;
      const palm = (
        subject: string,
        body: IHumanBody,
        t: number,
      ): IAutoMovieVector3 =>
        HumanHand.frame(
          body,
          performance.bones(subject, t),
          "right",
          "palm",
          "flat",
        ).point;
      const wrist = (subject: string, t: number): IAutoMovieVector3 =>
        performance.bones(subject, t).get("rightHand")!.worldPosition;
      const samples: number[] = [];
      for (
        let t: number = segment.entryTime;
        t <= segment.end + 1e-9;
        t += 1 / 48
      )
        samples.push(t);
      let drift: number = 0;
      let deepest: number = Infinity;
      let overshoot: number = 0;
      for (const t of samples) {
        if (t >= clasp && t <= release) {
          drift = Math.max(drift, distance(palm("a", a, t), palm("b", b, t)));
          deepest = Math.min(
            deepest,
            penetration(
              a,
              performance.bones("a", t),
              b,
              performance.bones("b", t),
            ),
          );
        }
        for (const subject of ["a", "b"])
          for (const j of performance.pose(subject, t).joints) {
            const c = DEFAULT_HUMANOID_ROM[j.bone];
            if (c !== undefined)
              overshoot = Math.max(overshoot, jointRomOvershoot(j, c));
          }
      }
      const meet: number = distance(palm("a", a, clasp), palm("b", b, clasp));
      const sternum = (subject: string, body: IHumanBody): IAutoMovieVector3 =>
        resolveAutoMovieHumanoidSurfaces.place(
          body.surfaces.regions.sternum,
          performance
            .bones(subject, clasp)
            .get(body.surfaces.regions.sternum.bone)!,
        ).point;
      const chest: number = Math.hypot(
        sternum("a", a).x - sternum("b", b).x,
        sternum("a", a).z - sternum("b", b).z,
      );
      let slip: number = 0;
      for (const subject of ["a", "b"])
        for (const foot of ["leftFoot", "rightFoot"] as const) {
          const from: IAutoMovieVector3 = performance
            .bones(subject, segment.entryTime)
            .get(foot)!.worldPosition;
          for (const t of samples)
            slip = Math.max(
              slip,
              distance(
                performance.bones(subject, t).get(foot)!.worldPosition,
                from,
              ),
            );
        }
      const performers: IMotionCaptureCase.IPerformer[] = [
        {
          id: "a",
          body: one.body,
          pose: (t: number) => performance.pose("a", t),
        },
        {
          id: "b",
          body: two.body,
          pose: (t: number) => performance.pose("b", t),
          color: 0x7a8fa6,
        },
      ];
      out.push({
        name: `handling-handshake-${first}-${second}`,
        times: [
          { seconds: segment.entryTime, label: "start" },
          {
            seconds: segment.entryTime + 0.6 * (clasp - segment.entryTime),
            label: "reach 60 %",
          },
          {
            seconds: segment.entryTime + 0.7 * (clasp - segment.entryTime),
            label: "reach 70 %",
          },
          { seconds: clasp, label: "clasp" },
          { seconds: clasp + 0.25 * pump, label: "pump top" },
          { seconds: clasp + 0.75 * pump, label: "pump bottom" },
          { seconds: release, label: "release" },
          { seconds: segment.end, label: "end" },
        ],
        performers,
        trails: [
          {
            color: 0xd04040,
            points: samples.map(
              (t: number): IAutoMovieVector3 => wrist("a", t),
            ),
          },
          {
            color: 0x3a6ea5,
            points: samples.map(
              (t: number): IAutoMovieVector3 => wrist("b", t),
            ),
          },
        ],
        targets: [{ at: palm("a", a, clasp), radius: 0.015, color: 0x40a040 }],
        verdicts: [
          {
            name: "palms meet within 15 mm at the clasp",
            passed: meet <= 0.015,
            detail: `${(meet * 1000).toFixed(1)} mm`,
          },
          {
            name: "palms stay within 10 mm through the pump",
            passed: drift <= 0.01,
            detail: `${(drift * 1000).toFixed(1)} mm`,
          },
          {
            name: "partners stand in the personal zone (chest gap 0.46 to 1.2 m, Hall 1966)",
            passed: chest >= 0.46 && chest <= 1.2,
            detail: `${chest.toFixed(3)} m`,
          },
          {
            name: "no hand or forearm capsule enters the other's by more than 10 mm",
            passed: deepest >= -0.01,
            detail: `${(deepest * 1000).toFixed(1)} mm`,
          },
          {
            name: "every joint inside the default range of motion",
            passed: overshoot <= 1e-6,
            detail: `${overshoot.toFixed(4)} deg`,
          },
          {
            name: "ankles move at most 5 mm",
            passed: slip <= 0.005,
            detail: `${(slip * 1000).toFixed(2)} mm`,
          },
        ],
      });
    }
  if (family === undefined || family === "grasp")
    for (const name of ["f-small", "m-average", "m-tall"]) {
      const man: humanPolygonMan.IPolygonMan = MotionBodies.population(name);
      const body: IHumanBody = createHumanBody(
        man.body.skeleton,
        man.body.profile,
      );
      // The shoulders the pick up and the put down start from: the same stand
      // and walk performed without the bottle, read at each action's entry.
      const rehearsal: HumanPerformance = new HumanPerformance({
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
          .stand({ seconds: 0.4 })
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
      const bottle: IHumanProp = {
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
            frame: {
              translation: { x: 0, y: 0.095, z: 0 },
              rotation: turn,
              scale: { x: 1, y: 1, z: 1 },
            },
            extent: null,
            grip: "power",
            aperture: 0.07,
          },
        ],
      };
      const performance: HumanPerformance = new HumanPerformance({
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
          .stand({ seconds: 0.4 })
          .pickUp({ prop: "bottle", handle: "handle", hand: "right" })
          .walk({ to: { x: 0, y: 0, z: 0.6 } })
          .putDown({ prop: "bottle", at: target, yaw: 0, hand: "right" })
          .stand({ seconds: 0.4 }).node,
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
      const gaps: number[] = ["Thumb", "Index", "Middle", "Ring", "Little"].map(
        (digit: string): number =>
          Math.min(
            ...HumanGrip.bones("right", digit as HumanGrip.Digit).map(
              (bone: AutoMovieHumanoidBone): number => {
                const c = HumanGrip.chain(
                  body,
                  "right",
                  digit as HumanGrip.Digit,
                );
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
        carried = Math.max(carried, distance(offset(t), offset(closed)));

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
              distance(
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
            passed: distance(rest.position, target) <= 0.001,
            detail: `${(distance(rest.position, target) * 1000).toFixed(2)} mm`,
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
    for (const [first, second] of [
      ["f-small", "m-tall"],
      ["m-average", "m-average"],
    ] as const) {
      const one: humanPolygonMan.IPolygonMan = MotionBodies.population(first);
      const two: humanPolygonMan.IPolygonMan = MotionBodies.population(second);
      const a: IHumanBody = createHumanBody(
        one.body.skeleton,
        one.body.profile,
      );
      const b: IHumanBody = createHumanBody(
        two.body.skeleton,
        two.body.profile,
      );
      const shoulder: IAutoMovieVector3 = a.rest.get("rightUpperArm")!;
      const grip = (
        id: string,
        y: number,
        toward: number,
      ): IAutoMovieAffordance => ({
        id,
        kind: "handle",
        frame: {
          translation: { x: 0, y, z: 0 },
          rotation: Quaternion.normalize(
            Quaternion.multiply(
              Quaternion.fromAxisAngle(
                { x: 0, y: 1, z: 0 },
                toward > 0 ? 180 : 0,
              ),
              Quaternion.normalize(
                Quaternion.multiply(
                  Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 90),
                  Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, -90),
                ),
              ),
            ),
          ),
          scale: { x: 1, y: 1, z: 1 },
        },
        extent: null,
        grip: "power",
        aperture: 0.07,
      });
      const bottle: IHumanProp = {
        subject: "bottle",
        frame: {
          position: { x: shoulder.x, y: a.measure.hipHeight, z: 0.3 },
          rotation: Quaternion.identity(),
        },
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
        affordances: [grip("low", 0.06, -1), grip("high", 0.15, 1)],
      };
      const D: number =
        handshake.gap(a.measure, b.measure) +
        a.measure.chestDepth / 2 +
        b.measure.chestDepth / 2;
      const performance: HumanPerformance = new HumanPerformance({
        seed: `handling-handover-${first}-${second}`,
        performers: [
          {
            subject: "a",
            body: a,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
          {
            subject: "b",
            body: b,
            at: { x: 0, y: 0, z: D },
            yaw: 180,
            proficiency: { level: "trained" },
          },
        ],
        props: [bottle],
        composition: HumanChain.pair(
          HumanChain.subject("a")
            .stand({ seconds: 0.3 })
            .pickUp({ prop: "bottle", handle: "low", hand: "right" }),
          HumanChain.subject("b").stand({ seconds: 0.3 }),
        ).handOver({
          prop: "bottle",
          handle: "high",
          hand: "right",
          receiverHand: "right",
          mass: 0.5,
        }).node,
      });
      const giving = performance
        .segments("a")
        .find((s) => s.name === "handOver")!;
      const taking = performance
        .segments("b")
        .find((s) => s.name === "receive")!;
      const event = (s: typeof giving, n: string): number =>
        s.start +
        s.plan.events.find((e) => e.name === n)!.share * s.plan.duration;
      const closed: number = event(taking, "gripClosed");
      const release: number = event(giving, "release");
      const centre = (t: number): IAutoMovieVector3 => {
        const f = performance.prop("bottle", t);
        return Vector3.add(
          f.position,
          Quaternion.rotateVector(f.rotation, { x: 0, y: 0.095, z: 0 }),
        );
      };
      const sternum = (
        subject: string,
        body: IHumanBody,
        t: number,
      ): IAutoMovieVector3 =>
        resolveAutoMovieHumanoidSurfaces.place(
          body.surfaces.regions.sternum,
          performance
            .bones(subject, t)
            .get(body.surfaces.regions.sternum.bone)!,
        ).point;
      const middle: IAutoMovieVector3 = Vector3.scale(
        Vector3.add(sternum("a", a, closed), sternum("b", b, closed)),
        0.5,
      );
      const exchange: number = distance(
        performance.prop("bottle", closed).position,
        middle,
      );
      let jump: number = 0;
      let previous: IAutoMovieVector3 = performance.prop("bottle", 0).position;
      for (let t: number = 1 / 240; t <= performance.duration; t += 1 / 240) {
        const now: IAutoMovieVector3 = performance.prop("bottle", t).position;
        jump = Math.max(jump, distance(now, previous));
        previous = now;
      }
      const offset = (t: number): IAutoMovieVector3 => {
        const hand: IAutoMovieResolvedBone = performance
          .bones("b", t)
          .get("rightHand")!;
        return Quaternion.rotateVector(
          Quaternion.inverse(hand.worldRotation),
          Vector3.subtract(
            performance.prop("bottle", t).position,
            hand.worldPosition,
          ),
        );
      };
      let held: number = 0;
      for (let t: number = release; t <= performance.duration; t += 1 / 24)
        held = Math.max(held, distance(offset(t), offset(release)));
      let deepest: number = Infinity;
      for (let t: number = closed; t <= release; t += 1 / 48)
        deepest = Math.min(
          deepest,
          penetration(
            a,
            performance.bones("a", t),
            b,
            performance.bones("b", t),
          ),
        );
      let overshoot: number = 0;
      let slip: number = 0;
      for (const subject of ["a", "b"]) {
        for (const foot of ["leftFoot", "rightFoot"] as const) {
          const from: IAutoMovieVector3 = performance
            .bones(subject, giving.entryTime)
            .get(foot)!.worldPosition;
          for (
            let t: number = giving.entryTime;
            t <= performance.duration;
            t += 1 / 24
          )
            slip = Math.max(
              slip,
              distance(
                performance.bones(subject, t).get(foot)!.worldPosition,
                from,
              ),
            );
        }
        for (let t: number = 0; t <= performance.duration; t += 1 / 24)
          for (const j of performance.pose(subject, t).joints) {
            const c = DEFAULT_HUMANOID_ROM[j.bone];
            if (c !== undefined)
              overshoot = Math.max(overshoot, jointRomOvershoot(j, c));
          }
      }
      const path: IAutoMovieVector3[] = [];
      for (let t: number = 0; t <= performance.duration; t += 1 / 48)
        path.push(centre(t));
      out.push({
        name: `handling-handover-${first}-${second}`,
        times: [
          { seconds: giving.entryTime, label: "offer starts" },
          { seconds: event(giving, "offered"), label: "offered" },
          { seconds: closed, label: "gripClosed" },
          { seconds: (closed + release) / 2, label: "both hold" },
          { seconds: release, label: "release" },
          { seconds: performance.duration, label: "taken" },
        ],
        performers: [
          {
            id: "a",
            body: one.body,
            pose: (t: number) => performance.pose("a", t),
          },
          {
            id: "b",
            body: two.body,
            pose: (t: number) => performance.pose("b", t),
            color: 0x7a8fa6,
          },
        ],
        trails: [{ color: 0x4a8a5a, points: path }],
        targets: [{ at: middle, radius: 0.02, color: 0x40a040 }],
        verdicts: [
          {
            name: "the giver lets go only after the receiver's grip closes",
            passed: release >= closed,
            detail: `release ${release.toFixed(3)} s, gripClosed ${closed.toFixed(3)} s`,
          },
          {
            name: "the exchange within 0.15 m of the chests' midpoint",
            passed: exchange <= 0.15,
            detail: `${exchange.toFixed(3)} m`,
          },
          {
            name: "the bottle never jumps (under 5 mm per 1/240 s)",
            passed: jump < 0.005,
            detail: `${(jump * 1000).toFixed(2)} mm`,
          },
          {
            name: "the receiver holds the bottle within 1 mm after the release",
            passed: held <= 0.001,
            detail: `${(held * 1000).toFixed(2)} mm`,
          },
          {
            name: "no hand or forearm capsule enters the other's by more than 10 mm",
            passed: deepest >= -0.01,
            detail: `${(deepest * 1000).toFixed(1)} mm`,
          },
          {
            name: "ankles move at most 5 mm",
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
  return out;
}

/** The deepest overlap, metres (negative), between two people's right-hand phalanx and forearm capsules; positive when apart. */
function penetration(
  a: IHumanBody,
  aBones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  b: IHumanBody,
  bBones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
): number {
  const digit = /^right(Thumb|Index|Middle|Ring|Little)/;
  const capsules = (
    body: IHumanBody,
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): { p: IAutoMovieVector3; q: IAutoMovieVector3; r: number }[] =>
    body.profile.segments
      .filter((x) => digit.test(x.bone) || x.bone === "rightLowerArm")
      .flatMap((x) =>
        x.shapes.flatMap((shape) => {
          if (shape.kind !== "capsule") return [];
          const bone: IAutoMovieResolvedBone = bones.get(
            x.bone as AutoMovieHumanoidBone,
          )!;
          const centre: IAutoMovieVector3 = Vector3.add(
            bone.worldPosition,
            Quaternion.rotateVector(
              bone.worldRotation,
              shape.transform.position,
            ),
          );
          const axis: IAutoMovieVector3 = Quaternion.rotateVector(
            Quaternion.multiply(bone.worldRotation, shape.transform.rotation),
            { x: 0, y: shape.halfLength, z: 0 },
          );
          return [
            {
              p: Vector3.subtract(centre, axis),
              q: Vector3.add(centre, axis),
              r: shape.radius,
            },
          ];
        }),
      );
  let least: number = Infinity;
  for (const u of capsules(a, aBones))
    for (const v of capsules(b, bBones))
      least = Math.min(
        least,
        closestPointsBetweenSegments(u.p, u.q, v.p, v.q).distance - u.r - v.r,
      );
  return least;
}

/** Distance between two points, metres. */
function distance(p: IAutoMovieVector3, q: IAutoMovieVector3): number {
  return Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
}
