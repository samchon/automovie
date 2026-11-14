import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import type { IHumanBody } from "../../body/IHumanBody";
import { createHumanBody } from "../../body/createHumanBody";
import { HumanBalance } from "../../everyday/HumanBalance";
import { HumanProxemics } from "../../everyday/HumanProxemics";
import { rest } from "../../everyday/rest";
import { HumanPerformance } from "../../perform/HumanPerformance";
import { HumanHand } from "../../posture/HumanHand";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { MotionBodies } from "../MotionBodies";
import type { humanPolygonMan } from "../humanPolygonMan";
import { everydayCaseKit } from "./everydayCaseKit";
import { everydayGestureCases } from "./everydayGestureCases";
import { everydayPostureCases } from "./everydayPostureCases";
import { everydayTypeCases } from "./everydayTypeCases";
import { everydayVerdicts } from "./everydayVerdicts";

const { perform, figure, event, angle, frame } = everydayCaseKit;

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
    const c: everydayCaseKit.IContext = { id, man, body, suffix };
    const one = (chain: HumanChain): HumanPerformance =>
      everydayCaseKit.one(c, chain);

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

    if (wants("gesture")) out.push(...everydayGestureCases(c));

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

    out.push(...everydayPostureCases(c, wants));

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

    if (wants("type")) out.push(...everydayTypeCases(c));
  }
  return out;
}
