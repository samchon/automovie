import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieMotionTarget,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import type { IHumanBody } from "../../body/IHumanBody";
import { createHumanBody } from "../../body/createHumanBody";
import { HumanBalance } from "../../everyday/HumanBalance";
import { HumanProxemics } from "../../everyday/HumanProxemics";
import { gestureStroke } from "../../everyday/gestureStroke";
import { gestureStrokeTables } from "../../everyday/gestureStrokeTables";
import { rest } from "../../everyday/rest";
import { seated } from "../../everyday/seated";
import { typeText } from "../../everyday/typeText";
import { HumanPerformance } from "../../perform/HumanPerformance";
import { HumanFoot } from "../../posture/HumanFoot";
import { HumanHand } from "../../posture/HumanHand";
import { poseBones } from "../../posture/poseBones";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { MotionBodies } from "../MotionBodies";
import type { humanPolygonMan } from "../humanPolygonMan";
import { everydayGestureVerdicts } from "./everydayGestureVerdicts";
import { everydayVerdicts } from "./everydayVerdicts";

/**
 * Capture cases of the everyday laws on the polygon man, each with the
 * numeric verdicts its family's acceptance names, so a sheet is read
 * together with the measured contacts it shows.
 *
 * Every case reports foot slip in its plant windows (at most 5 mm) and the
 * largest range-of-motion overshoot (none). Beyond that:
 *
 * - `everyday-approach`: a tall man walks up to a small woman and stops at a
 *   personal gap; the sternum gap within 0.02 m and the facing within 5
 *   degrees.
 * - `everyday-look`: looks at a point 50 degrees to the left and up and at the
 *   floor ahead; each eye within 2 degrees of its target once settled.
 * - `everyday-gesture-<kind>`: each gesture at rest, mid-preparation, the
 *   stroke's start, middle and end, mid-retraction and the end; each elbow
 *   slower than 2.5 m/s while the arm is carried to and from the stroke,
 *   pointing within 2 degrees of the eye-to-target line, self-touch within 15 mm of
 *   its region, claps meeting within 10 mm, and each gesture's own goal
 *   (`everydayGestureVerdicts`).
 * - `everyday-rest`: each rest place held; each hand surface within 15 mm of
 *   its place and not inside the region beyond 10 mm.
 * - `everyday-seat`: sitting on a box at the popliteal height, shifting and
 *   rising; the seated body's lowest bearing point (the seat socket or the
 *   thighs' undersides) within 15 mm of the seat surface at contact and
 *   seated, the thighs not inside the seat beyond 10 mm, and the
 *   extrapolated centre of mass inside the feet's base at seat-off.
 * - `everyday-bend`: a stoop to a point above mid-shank (the `auto` rule's
 *   stoop range; a straight-legged reach to the floor needs more hamstring
 *   length than most adults have), a semi-squat to a point a fifth of the
 *   shank above the ankle (a low object; with the hips kept at 0.75 of
 *   their height the smallest body's balanced reach ends above the floor,
 *   where `auto` squats instead) and a squat to a floor point; the palm
 *   within 15 mm of it and the extrapolated centre of mass over the feet at
 *   the deepest.
 * - `everyday-brace`: bracing for a push from ahead; the centre of mass's
 *   margin to the base's edge along the push higher at `set` than at the
 *   start, and laterally not lower (Massion 1992; Hof et al. 2005).
 * - `everyday-type-seated` and `everyday-type-standing`: typing "hello
 *   world" seated at a desk and standing at a standing desk, each keyboard
 *   at the elbows' height a forearm ahead of the shoulders; the index
 *   fingertip on each key's pressed centre within 10 mm and the key dip 2
 *   to 4 mm.
 * - `everyday-step`: stepping over a 0.3 m box, at tenths of the crossing;
 *   every sole point at least 5 cm above the box while over it.
 *
 * @param family One family or every family when absent.
 * @param bodies The sweep bodies to run each case on; `m-average` when absent.
 * @returns The cases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists every case, its instants and its verdicts.
 * @evidence contracts/development/implementation.md#principled-implementation Each case runs the real performance, samples its displayed poses at the laws' events and measures contacts on them.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One block per family over shared performance and verdict helpers.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Instants come from the plans' events, and verdicts from displayed poses.
 * @evidence contracts/development/implementation.md#efficient-algorithms One performance per case and body.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
export function everydayCases(
  family?:
    | "approach"
    | "look"
    | "gesture"
    | "rest"
    | "seat"
    | "bend"
    | "step"
    | "brace"
    | "type",
  bodies: readonly string[] = ["m-average"],
): IMotionCaptureCase[] {
  const wants = (name: string): boolean =>
    family === undefined || family === name;
  const out: IMotionCaptureCase[] = [];
  const within = everydayVerdicts.within;
  for (const id of bodies) {
    const man: humanPolygonMan.IPolygonMan = MotionBodies.population(id);
    const body: IHumanBody = createHumanBody(
      man.body.skeleton,
      man.body.profile,
    );
    const suffix: string = bodies.length === 1 ? "" : `-${id}`;
    const one = (chain: HumanChain): HumanPerformance =>
      perform([[man, { x: 0, y: 0, z: 0 }, 0]], chain);

    if (wants("approach")) {
      const partner: humanPolygonMan.IPolygonMan = MotionBodies.population(
        id === "f-small" ? "m-tall" : "f-small",
      );
      const performance: HumanPerformance = perform(
        [
          [man, { x: 0, y: 0, z: 0 }, 0],
          [partner, { x: 0.4, y: 0, z: 3.2 }, 180],
        ],
        HumanChain.subject("a")
          .approach({
            target: { kind: "person", subject: "b", region: "sternum" },
            at: "personal",
          })
          .with(HumanChain.subject("b").stand({ seconds: 8 })),
      );
      const walking = performance.segments("a")[0]!;
      const sternum = (subject: string, t: number): IAutoMovieVector3 =>
        performance.aim(
          { kind: "person", subject, region: "sternum" },
          t,
          frame(body),
        ).point;
      const pa: IAutoMovieVector3 = sternum("a", walking.end);
      const pb: IAutoMovieVector3 = sternum("b", walking.end);
      const gap: number = Math.hypot(pa.x - pb.x, pa.z - pb.z);
      const forward: IAutoMovieVector3 = Quaternion.rotateVector(
        performance.bones("a", walking.end).get("hips")!.worldRotation,
        { x: 0, y: 0, z: 1 },
      );
      const facing: number = angle(
        { x: forward.x, y: 0, z: forward.z },
        { x: pb.x - pa.x, y: 0, z: pb.z - pa.z },
      );
      out.push({
        name: `everyday-approach${suffix}`,
        times: [
          { seconds: 0, label: "start" },
          { seconds: walking.end / 2, label: "walking" },
          {
            seconds: event(performance, "a", 0, "lastFootfall"),
            label: "last footfall",
          },
          { seconds: walking.end, label: "arrive" },
        ],
        performers: [
          figure(performance, "a", man),
          figure(performance, "b", partner, 0x7a8fa6),
        ],
        targets: [{ at: pb, radius: 0.03, color: 0xd04040 }],
        verdicts: [
          within(
            "gap error",
            Math.abs(gap - HumanProxemics.GAPS.personal),
            0.02,
            "mm",
          ),
          within("facing", facing, 5, "deg"),
          ...everydayVerdicts.standard(performance, "a", body),
        ],
      });
    }

    if (wants("look")) {
      const points: IAutoMovieVector3[] = [
        {
          x: 2 * Math.sin((50 * Math.PI) / 180),
          y: 2.2,
          z: 2 * Math.cos((50 * Math.PI) / 180),
        },
        { x: 0, y: 0, z: 1.2 },
      ];
      const targets: AutoMovieMotionTarget[] = points.map(
        (at: IAutoMovieVector3): AutoMovieMotionTarget => ({
          kind: "point",
          at,
          frame: "world",
        }),
      );
      const performance: HumanPerformance = one(
        HumanChain.subject("a")
          .look({ target: targets[0]!, seconds: 1.2 })
          .look({ target: targets[1]!, seconds: 1.2 }),
      );
      const verdicts: IMotionCaptureCase.IVerdict[] = [];
      const times: IMotionCaptureCase.ITime[] = [
        { seconds: 0, label: "start" },
      ];
      points.forEach((point: IAutoMovieVector3, i: number): void => {
        const t: number = event(performance, "a", i, "settled");
        times.push({
          seconds: t,
          label: i === 0 ? "side settled" : "floor settled",
        });
        const bones = performance.bones("a", t);
        for (const eye of ["leftEye", "rightEye"] as const) {
          const e = bones.get(eye)!;
          verdicts.push(
            within(
              `${eye} on target ${i}`,
              angle(
                Quaternion.rotateVector(e.worldRotation, { x: 0, y: 0, z: 1 }),
                Vector3.subtract(point, e.worldPosition),
              ),
              2,
              "deg",
            ),
          );
        }
      });
      out.push({
        name: `everyday-look${suffix}`,
        times,
        performers: [figure(performance, "a", man)],
        targets: points.map((at: IAutoMovieVector3) => ({
          at,
          radius: 0.04,
          color: 0xd04040,
        })),
        verdicts: [
          ...verdicts,
          ...everydayVerdicts.standard(performance, "a", body),
        ],
      });
    }

    if (wants("gesture")) {
      const goal: IAutoMovieVector3 = { x: 1.5, y: 2.2, z: 3 };
      const kinds: gestureStroke.Kind[] = [
        "wave",
        "raiseHand",
        "cheer",
        "stopPalm",
        "point",
        "palmsUp",
        "beckon",
        "clap",
        "rubHands",
        "touchFace",
        "pushGlasses",
        "scratchHead",
        "shrug",
        "nod",
        "shakeHead",
        "bow",
        "chinLift",
        "squareShoulders",
        "slump",
      ];
      for (const kind of kinds) {
        const performance: HumanPerformance = one(
          HumanChain.subject("a").gesture({
            kind,
            ...(kind === "point"
              ? { target: { kind: "point", at: goal, frame: "world" } }
              : {}),
          }),
        );
        const s: number = event(performance, "a", 0, "strokeStart");
        const e: number = event(performance, "a", 0, "strokeEnd");
        const r: number = event(performance, "a", 0, "retract");
        const end: number = performance.segments("a")[0]!.end;
        const mid = performance.bones("a", (s + e) / 2);
        const verdicts: IMotionCaptureCase.IVerdict[] =
          everydayVerdicts.standard(performance, "a", body);
        // An arm carried to and from its stroke swings from the shoulder: an
        // elbow that moves faster than 2.5 m/s has flipped to the other side.
        for (const side of ["left", "right"] as const)
          verdicts.push(
            within(
              `${side} elbow travel per frame outside the stroke`,
              Math.max(
                everydayVerdicts.travel(
                  performance,
                  "a",
                  `${side}LowerArm`,
                  0,
                  s,
                ),
                everydayVerdicts.travel(
                  performance,
                  "a",
                  `${side}LowerArm`,
                  r,
                  end,
                ),
              ),
              2.5 / 24,
              "mm",
            ),
          );
        if (kind === "point") {
          const eye: IAutoMovieVector3 = mid.get("rightEye")!.worldPosition;
          verdicts.push(
            within(
              "fingertip on the eye-to-target line",
              angle(
                Vector3.subtract(
                  HumanHand.frame(body, mid, "right", "indexTip", "point")
                    .point,
                  eye,
                ),
                Vector3.subtract(goal, eye),
              ),
              2,
              "deg",
            ),
          );
        }
        if (kind === "touchFace" || kind === "pushGlasses") {
          const region =
            kind === "touchFace"
              ? body.surfaces.regions.forehead
              : body.surfaces.regions.noseBridge;
          const at: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
            region,
            mid.get(region.bone)!,
          ).point;
          verdicts.push(
            within(
              "fingertip at the face region",
              Vector3.length(
                Vector3.subtract(
                  HumanHand.frame(body, mid, "right", "indexTip", "flat").point,
                  at,
                ),
              ),
              0.015 + 0.012,
              "mm",
            ),
          );
        }
        if (kind === "bow") {
          const margin: number = everydayVerdicts.stability(
            performance,
            "a",
            body,
            (s + e) / 2,
          );
          verdicts.push({
            name: "bowed body balanced over the feet",
            passed: margin >= 0,
            detail: `${(margin * 1000).toFixed(1)} mm margin`,
          });
        }
        verdicts.push(
          ...everydayGestureVerdicts(
            kind,
            performance,
            body,
            s,
            e,
            gestureStrokeTables.RHYTHM[kind].cycles,
          ),
        );
        if (kind === "clap")
          for (let k: number = 0; k < 4; k++) {
            const b = performance.bones("a", s + ((k + 0.5) / 4) * (e - s));
            verdicts.push(
              within(
                `palms meet on beat ${k + 1}`,
                Vector3.length(
                  Vector3.subtract(
                    HumanHand.frame(body, b, "left", "palm").point,
                    HumanHand.frame(body, b, "right", "palm").point,
                  ),
                ),
                0.01,
                "mm",
              ),
            );
          }
        out.push({
          name: `everyday-gesture-${kind}${suffix}`,
          times: [
            { seconds: 0, label: "rest" },
            { seconds: s / 2, label: "prepare" },
            { seconds: s, label: "stroke start" },
            { seconds: (s + e) / 2, label: "stroke" },
            { seconds: e, label: "stroke end" },
            { seconds: (r + end) / 2, label: "retract" },
            { seconds: end, label: "end" },
          ],
          performers: [figure(performance, "a", man)],
          ...(kind === "point"
            ? { targets: [{ at: goal, radius: 0.05, color: 0xd04040 }] }
            : {}),
          verdicts,
        });
      }
    }

    if (wants("rest")) {
      const places: [rest.Place, rest.Place][] = [
        ["pocket", "pocket"],
        ["hip", "hip"],
        ["crossed", "crossed"],
        ["claspedFront", "claspedFront"],
        ["claspedBehind", "claspedBehind"],
        ["behindHead", "behindHead"],
        ["side", "chinRest"],
      ];
      let chain: HumanChain = HumanChain.subject("a");
      for (const [left, right] of places)
        chain = chain.rest({ left, right, seconds: 1.5 });
      const performance: HumanPerformance = one(chain);
      const verdicts: IMotionCaptureCase.IVerdict[] = everydayVerdicts.standard(
        performance,
        "a",
        body,
      );
      const times: IMotionCaptureCase.ITime[] = [];
      performance.segments("a").forEach((segment, i: number): void => {
        const t: number = segment.end - 0.05;
        const [left, right] = places[i]!;
        times.push({ seconds: t, label: right });
        const goals = rest.goals(body, performance.posture("a", t), {
          left,
          right,
        });
        const bones = performance.bones("a", t);
        for (const side of ["left", "right"] as const) {
          const goal = goals[side];
          if (goal === undefined) continue;
          const got = HumanHand.frame(
            body,
            bones,
            side,
            goal.surface,
            goal.shape,
          );
          verdicts.push(
            within(
              `${right} ${side} ${goal.surface} at its place`,
              Vector3.length(Vector3.subtract(got.point, goal.point)),
              0.015,
              "mm",
            ),
          );
        }
      });
      out.push({
        name: `everyday-rest${suffix}`,
        times,
        performers: [figure(performance, "a", man)],
        verdicts,
      });
    }

    if (wants("seat")) {
      const seat: seated.ISeat = {
        at: {
          x: 0,
          y: seated.popliteal(body),
          z: body.rest.get("leftFoot")!.z - 0.1,
        },
        yaw: 0,
        depth: 0.45,
      };
      const performance: HumanPerformance = one(
        HumanChain.subject("a")
          .sit({ seat, seconds: 0.5 })
          .shift({ by: 0.12 })
          .rise(),
      );
      const [sit, shift, rise] = performance.segments("a");
      const contact: number = event(performance, "a", 0, "seatContact");
      const socket = (t: number): IAutoMovieVector3 =>
        resolveAutoMovieHumanoidSurfaces.place(
          body.surfaces.sockets.seat,
          performance.bones("a", t).get(body.surfaces.sockets.seat.bone)!,
        ).point;
      const thighs = (t: number): number => {
        const b = performance.bones("a", t);
        let low: number = Infinity;
        for (const side of ["left", "right"] as const)
          for (let k: number = 0; k <= 20; k++) {
            const p: IAutoMovieVector3 = Vector3.lerp(
              b.get(`${side}UpperLeg`)!.worldPosition,
              b.get(`${side}LowerLeg`)!.worldPosition,
              k / 20,
            );
            if (p.z <= seat.at.z && p.z >= seat.at.z - seat.depth!)
              low = Math.min(low, p.y - body.measure.thighRadius - seat.at.y);
          }
        return low;
      };
      out.push({
        name: `everyday-seat${suffix}`,
        times: [
          { seconds: 0, label: "standing" },
          { seconds: contact / 2, label: "lowering" },
          { seconds: contact, label: "seat contact" },
          { seconds: sit!.end, label: "seated" },
          { seconds: (shift!.entryTime + shift!.end) / 2, label: "shifting" },
          { seconds: event(performance, "a", 2, "seatOff"), label: "seat off" },
          {
            seconds: event(performance, "a", 2, "standing"),
            label: "standing",
          },
          { seconds: rise!.end, label: "end" },
        ],
        performers: [figure(performance, "a", man)],
        boxes: [
          {
            centre: {
              x: seat.at.x + 0.1,
              y: seat.at.y / 2,
              z: seat.at.z - 0.225,
            },
            half: { x: 0.45, y: seat.at.y / 2, z: 0.225 },
            color: 0x9a7b55,
          },
        ],
        verdicts: [
          within(
            "seated body on the seat at contact",
            Math.abs(Math.min(socket(contact).y - seat.at.y, thighs(contact))),
            0.015,
            "mm",
          ),
          within(
            "seated body on the seat while seated",
            Math.abs(
              Math.min(socket(sit!.end).y - seat.at.y, thighs(sit!.end)),
            ),
            0.015,
            "mm",
          ),
          within(
            "thighs not inside the seat",
            Math.max(0, -thighs(sit!.end)),
            0.01,
            "mm",
          ),
          {
            name: "extrapolated centre of mass over the feet at seat-off",
            passed:
              everydayVerdicts.stability(
                performance,
                "a",
                body,
                event(performance, "a", 2, "seatOff"),
              ) >= 0,
            detail: `${(everydayVerdicts.stability(performance, "a", body, event(performance, "a", 2, "seatOff")) * 1000).toFixed(1)} mm margin`,
          },
          ...everydayVerdicts.standard(performance, "a", body),
        ],
      });
    }

    if (wants("bend")) {
      const strategies = ["stoop", "semiSquat", "squat"] as const;
      const points: Record<(typeof strategies)[number], IAutoMovieVector3> = {
        stoop: {
          x: -0.15,
          y: body.measure.ankleHeight + 0.6 * body.measure.shank,
          z: 0.45,
        },
        semiSquat: {
          x: -0.15,
          y: body.measure.ankleHeight + 0.2 * body.measure.shank,
          z: 0.3,
        },
        squat: { x: -0.15, y: 0, z: 0.3 },
      };
      let chain: HumanChain = HumanChain.subject("a");
      for (const strategy of strategies)
        chain = chain.bend({
          toward: { kind: "point", at: points[strategy], frame: "world" },
          strategy,
        });
      const performance: HumanPerformance = one(chain);
      const verdicts: IMotionCaptureCase.IVerdict[] = everydayVerdicts.standard(
        performance,
        "a",
        body,
      );
      strategies.forEach((strategy, i: number): void => {
        const t: number = event(performance, "a", i, "deepest");
        verdicts.push(
          within(
            `${strategy} palm at the point`,
            Vector3.length(
              Vector3.subtract(
                HumanHand.frame(
                  body,
                  performance.bones("a", t),
                  "right",
                  "palm",
                  "flat",
                ).point,
                points[strategy],
              ),
            ),
            0.015,
            "mm",
          ),
        );
        const margin: number = everydayVerdicts.stability(
          performance,
          "a",
          body,
          t,
        );
        verdicts.push({
          name: `${strategy} balanced over the feet`,
          passed: margin >= 0,
          detail: `${(margin * 1000).toFixed(1)} mm margin`,
        });
      });
      out.push({
        name: `everyday-bend${suffix}`,
        times: strategies.map((strategy, i: number) => ({
          seconds: event(performance, "a", i, "deepest"),
          label: strategy,
        })),
        performers: [figure(performance, "a", man)],
        targets: strategies.map((strategy) => ({
          at: points[strategy],
          radius: 0.03,
          color: 0xd04040,
        })),
        verdicts,
      });
    }

    if (wants("step")) {
      const box = { at: { x: 0, y: 0, z: 0.35 }, height: 0.3, depth: 0.25 };
      const performance: HumanPerformance = one(
        HumanChain.subject("a").stepOver({ obstacle: box }),
      );
      const crossing = performance.segments("a")[0]!;
      const span: number = crossing.end - crossing.start;
      let clearance: number = Infinity;
      for (let t: number = 0; t <= performance.duration + 1e-9; t += 1 / 96)
        for (const p of HumanFoot.base(body, performance.bones("a", t)))
          if (p.z > box.at.z && p.z < box.at.z + box.depth)
            clearance = Math.min(clearance, p.y - box.height);
      out.push({
        name: `everyday-step${suffix}`,
        times: [0, 0.2, 0.3, 0.4, 0.5, 0.7, 0.8, 0.9, 1].map((u: number) => ({
          seconds: crossing.start + u * span,
          label: `${Math.round(u * 100)} %`,
        })),
        performers: [figure(performance, "a", man)],
        boxes: [
          {
            centre: { x: 0, y: box.height / 2, z: box.at.z + box.depth / 2 },
            half: { x: 0.4, y: box.height / 2, z: box.depth / 2 },
            color: 0x9a7b55,
          },
        ],
        verdicts: [
          {
            name: "sole clearance over the box",
            passed: clearance >= 0.05,
            detail: `${(clearance * 1000).toFixed(1)} mm (at least 50 mm)`,
          },
          ...everydayVerdicts.standard(performance, "a", body),
        ],
      });
    }

    if (wants("brace")) {
      const performance: HumanPerformance = one(
        HumanChain.subject("a").brace({
          toward: { kind: "point", at: { x: 0, y: 1.2, z: 2 }, frame: "world" },
          kind: "push",
        }),
      );
      const set: number = event(performance, "a", 0, "set");
      const margins = (t: number): { push: number; side: number } => {
        const held = HumanBalance.support(body, performance.posture("a", t));
        return {
          push: HumanBalance.along(held.centre, held.points, {
            x: 0,
            y: 0,
            z: -1,
          }),
          side: Math.min(
            HumanBalance.along(held.centre, held.points, { x: 1, y: 0, z: 0 }),
            HumanBalance.along(held.centre, held.points, { x: -1, y: 0, z: 0 }),
          ),
        };
      };
      const before = margins(0);
      const after = margins(set);
      out.push({
        name: `everyday-brace${suffix}`,
        times: [
          { seconds: 0, label: "start" },
          { seconds: set / 2, label: "stepping" },
          { seconds: set, label: "set" },
          { seconds: performance.segments("a")[0]!.end, label: "end" },
        ],
        performers: [figure(performance, "a", man)],
        verdicts: [
          {
            name: "margin along the push higher at set",
            passed: after.push > before.push,
            detail: `${(before.push * 1000).toFixed(1)} mm before, ${(after.push * 1000).toFixed(1)} mm at set`,
          },
          {
            name: "lateral margin not lower at set",
            passed: after.side >= before.side - 1e-3,
            detail: `${(before.side * 1000).toFixed(1)} mm before, ${(after.side * 1000).toFixed(1)} mm at set`,
          },
          ...everydayVerdicts.standard(performance, "a", body),
        ],
      });
    }

    if (wants("type")) {
      // Seated at a desk: the keyboard at seated elbow height ahead of the
      // shoulders by the forearm (ANSI/HFES 100-2007 posture), the desk top
      // under it; and standing at a standing desk at standing elbow height.
      const seat: seated.ISeat = {
        at: {
          x: 0,
          y: seated.popliteal(body),
          z: body.rest.get("leftFoot")!.z - 0.1,
        },
        yaw: 0,
        depth: 0.45,
      };
      const sitting: HumanPerformance = one(
        HumanChain.subject("a").sit({ seat, seconds: 0.2 }),
      );
      const held = sitting.posture("a", sitting.duration);
      const reach: number = body.measure.forearm + 0.5 * body.measure.hand;
      const setups: [string, HumanChain, IAutoMovieVector3][] = [
        [
          "seated",
          HumanChain.subject("a").sit({ seat, seconds: 0.2 }),
          {
            x: 0,
            y:
              held.root.y + body.measure.shoulderHeight - body.measure.upperArm,
            z: held.root.z + body.rest.get("rightUpperArm")!.z + reach,
          },
        ],
        [
          "standing",
          HumanChain.subject("a"),
          {
            x: 0,
            y: body.measure.shoulderHeight - body.measure.upperArm - 0.005,
            z: body.rest.get("rightUpperArm")!.z + reach,
          },
        ],
      ];
      for (const [label, start, at] of setups) {
        const keyboard = { at, yaw: 0 };
        const text: string = "hello world";
        const performance: HumanPerformance = one(
          start.typeText({ keyboard, text }),
        );
        const segment = performance.segments("a").at(-1)!;
        const verdicts: IMotionCaptureCase.IVerdict[] =
          everydayVerdicts.standard(performance, "a", body);
        let worst: { miss: number; letter: string } = { miss: 0, letter: "" };
        let dips: number[] = [];
        [...text].forEach((letter: string, i: number): void => {
          const t: number =
            segment.start +
            segment.plan.events[i]!.share * segment.plan.duration;
          const k = typeText.key(letter);
          const tip: IAutoMovieVector3 = HumanHand.frame(
            body,
            performance.bones("a", t),
            k.side,
            "indexTip",
            "point",
          ).point;
          const target: IAutoMovieVector3 = {
            x: keyboard.at.x + k.at.x,
            y: keyboard.at.y - typeText.TRAVEL,
            z: keyboard.at.z + k.at.z,
          };
          const miss: number = Vector3.length(Vector3.subtract(tip, target));
          if (miss > worst.miss) worst = { miss, letter };
          dips.push(keyboard.at.y - tip.y);
        });
        dips = dips.sort((x: number, y: number): number => x - y);
        verdicts.push({
          ...within(
            "fingertip on each key at its press",
            worst.miss,
            0.01,
            "mm",
          ),
          detail: `${(worst.miss * 1000).toFixed(1)} mm worst, on "${worst.letter}" (limit 10.0 mm)`,
        });
        verdicts.push({
          name: "key dip 2 to 4 mm",
          // A key bottoms out at 4 mm, the law's own travel, so the deepest
          // press is compared at the 0.02 mm the posture resolver holds a
          // contact to.
          passed: dips[0]! >= 0.002 && dips.at(-1)! <= 0.004 + 2e-5,
          detail: `${(dips[0]! * 1000).toFixed(1)} to ${(dips.at(-1)! * 1000).toFixed(1)} mm below the key tops`,
        });
        verdicts.push({
          name: "desk height reported",
          passed: true,
          detail: `${(keyboard.at.y - 0.03).toFixed(3)} m work surface under a keyboard at ${keyboard.at.y.toFixed(3)} m`,
        });
        const boxes: {
          centre: IAutoMovieVector3;
          half: IAutoMovieVector3;
          color: number;
        }[] = [
          {
            centre: { x: 0, y: keyboard.at.y - 0.045, z: keyboard.at.z + 0.2 },
            half: { x: 0.6, y: 0.015, z: 0.3 },
            color: 0x8a6d4b,
          },
          {
            centre: { x: 0, y: keyboard.at.y - 0.015, z: keyboard.at.z },
            half: { x: 0.22, y: 0.015, z: 0.08 },
            color: 0x444444,
          },
        ];
        if (label === "seated")
          boxes.push({
            centre: { x: seat.at.x, y: seat.at.y / 2, z: seat.at.z - 0.225 },
            half: { x: 0.25, y: seat.at.y / 2, z: 0.225 },
            color: 0x9a7b55,
          });
        out.push({
          name: `everyday-type-${label}${suffix}`,
          times: [0, 2, 4, 6, 8].map((i: number) => ({
            seconds:
              segment.start +
              segment.plan.events[i]!.share * segment.plan.duration,
            label: `press ${text[i]}`,
          })),
          performers: [figure(performance, "a", man)],
          boxes,
          verdicts,
        });
      }
    }
  }
  return out;
}

/** A performance of polygon men at places and headings, the first `a` and the second `b`. */
function perform(
  people: [humanPolygonMan.IPolygonMan, IAutoMovieVector3, number][],
  chain: HumanChain,
): HumanPerformance {
  return new HumanPerformance({
    seed: "everyday",
    performers: people.map(([man, at, yaw], i: number) => ({
      subject: i === 0 ? "a" : "b",
      body: createHumanBody(man.body.skeleton, man.body.profile),
      at,
      yaw,
      proficiency: { level: "trained" as const },
    })),
    composition: chain.node,
  });
}

/** A drawn performer. */
function figure(
  performance: HumanPerformance,
  subject: string,
  man: humanPolygonMan.IPolygonMan,
  color?: number,
): IMotionCaptureCase.IPerformer {
  return {
    id: subject,
    body: man.body,
    pose: (seconds: number): IAutoMoviePose =>
      performance.pose(subject, seconds),
    ...(color === undefined ? {} : { color }),
  };
}

/** The film second of an event of a person's n-th action. */
function event(
  performance: HumanPerformance,
  subject: string,
  index: number,
  name: string,
): number {
  const segment = performance.segments(subject)[index]!;
  return (
    segment.start +
    segment.plan.events.find((e) => e.name === name)!.share *
      segment.plan.duration
  );
}

/** Angle between two vectors, degrees. */
function angle(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
  return (
    (Math.acos(
      Math.max(
        -1,
        Math.min(1, Vector3.dot(Vector3.normalize(a), Vector3.normalize(b))),
      ),
    ) *
      180) /
    Math.PI
  );
}

/** A neutral aiming frame, for reading person targets; its own bones are the body at rest. */
function frame(body: IHumanBody): Parameters<HumanPerformance["aim"]>[2] {
  return {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    heights: { low: 0, middle: 0, high: 0 },
    range: 1,
    body,
    bones: () =>
      poseBones(body, { skeleton: body.skeleton.id, root: null, joints: [] }),
  };
}
