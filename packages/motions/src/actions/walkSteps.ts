import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  minimumJerk,
  wrapDegrees,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanEntryState } from "../law/IHumanEntryState";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { stand } from "./stand";

/**
 * The footstep plan of a walk: footprints, their heel-strike and toe-off
 * times, each foot's rockers and swings, and the pelvis path, all as closed
 * functions of seconds.
 *
 * Footprints lie along the path from the feet's midpoint through the `via`
 * points to the destination, at even arc lengths at most `longest` apart,
 * each turned to the path's heading averaged over one step so a corner is
 * taken over a step, alternately half a step width to
 * either side (step width 0.1 hip heights, about 9 cm, inside the 7 to 12 cm
 * of normal adult gait, Perry and Burnfield; a run passes its swing share,
 * mid-swing lift and vertical oscillation), the foot behind stepping
 * first and the last two ending at the body's rest separation, facing `face`
 * when given: the two footfalls before the closing pair turn a third and
 * two thirds of the way, a stepping turn, the closing pair faces the
 * arrival, and the pelvis turns over the last four steps, so no foot needs
 * more hip rotation than the hip's range. Each step's
 * heel strike comes one step period after the previous; its toe-off one swing
 * (0.8 step periods, 40 % of a stride) before its heel strike; the first
 * toe-off comes 0.25 s after the start, a provisional gait-initiation delay
 * (anticipatory postural adjustments take a few tenths of a second,
 * Breni챔re, Do and Bouisset 1987). In stance a foot rolls on its heel from
 * 15째 toes-up to flat over 12 % of stance and, from 60 % of stance, on its
 * ball to 40째 toes-down at toe-off (provisional angles inside the ranges of
 * Perry and Burnfield's rockers), the toes extending at the ball by the same
 * angle so they stay flat on the floor, and relaxing to neutral over the first
 * half of the swing. In swing the ankle travels between the toe-off and
 * heel-strike placements on a minimum-jerk path lifted 0.07 hip heights at
 * mid-swing and raised further wherever the toe or heel would come within
 * 12 mm of the floor.
 *
 * The plan's root is the unconstrained pelvis path; `reach` then makes every
 * foot goal reachable on the actual pelvis, the footskate cleanup of Kovar,
 * Schreiner and Gleicher (2002): the contacts are enforced by IK, and the
 * root moves so the IK can meet them.
 */
export namespace walkSteps {
  /** The toe-off pitch of a straight step, degrees toes-down (provisional, inside Perry and Burnfield's forefoot rocker). */
  export const PUSH: number = 40;

  /** The largest extension, degrees, of a swinging leg's thigh, 2째 inside the hip's 30째 extension; the ankle trails further by the knee's bend. */
  export const EXTENSION: number = 28;

  /** The share of a swing over which its foot's claim on the root's drop fades out after toe-off and in before heel strike. */
  export const FADE: number = 0.25;

  /** Planner input. */
  export interface IInput {
    /** The body. */
    body: IHumanBody;

    /** The state the walk starts from. */
    entry: IHumanEntryState;

    /** The destination floor point, world metres. */
    to: IAutoMovieVector3;

    /** Floor points passed in order before the destination, world metres. */
    via?: readonly IAutoMovieVector3[];

    /** The heading at arrival, degrees; the last leg's direction when absent. */
    face?: number;

    /** Walking speed, m/s. */
    speed: number;

    /** The longest step, metres. */
    longest: number;

    /** The realised step period for a planned one, seconds (timing variability). */
    period(seconds: number): number;

    /** Swing duration in step periods; 0.8 (a walk's 40 % of the stride) when absent, above 1 for a run's flight. */
    swing?: number;

    /** A run's vertical oscillation, hip heights: the mean drop and the amplitude, lowest at mid-stance; a walk's when absent. */
    bob?: { mean: number; amplitude: number };

    /** Mid-swing ankle lift, hip heights; 0.07 when absent. */
    lift?: number;
  }

  /** A foot at an instant. */
  export interface IFoot {
    /** Its placement. */
    placement: HumanFoot.IPlacement;

    /** Whether it bears on the floor. */
    planted: boolean;

    /** The toes' flexion from the foot, degrees, positive lifting them. */
    toes: number;

    /** A swinging foot's share of its swing, the heading and the pitch it left the floor with. */
    swing?: { u: number; from: number; push: number };
  }

  /** The plan. */
  export interface IPlan {
    /** Seconds. */
    duration: number;

    /** Named instants in seconds. */
    events: { name: string; seconds: number }[];

    /** Stance spans per foot, seconds. */
    stances: { side: "left" | "right"; from: number; to: number }[];

    /** The rig origin before `reach`, world metres. */
    root(seconds: number): IAutoMovieVector3;

    /** The heading, degrees. */
    yaw(seconds: number): number;

    /** Stride phase: 0.25 at a left heel strike, one per stride. */
    phase(seconds: number): number;

    /** How much the body is walking, 0 standing to 1 in full stride. */
    amount(seconds: number): number;

    /** A foot at an instant. */
    foot(side: "left" | "right", seconds: number): IFoot;
  }

  /** One footfall. */
  interface IStep {
    side: "left" | "right";
    heelStrike: number;
    toeOff: number;
    flat: HumanFoot.IPlacement;
    heading: number;
    /** The toe-off pitch of the foot leaving for this footfall, degrees, negative. */
    push: number;
  }

  /**
   * Plan the footsteps of a walk.
   *
   * @param input The body, its entry state, the destination, the speed, the longest step and the period law.
   * @returns The plan.
   */
  export function plan(input: IInput): IPlan {
    const { body } = input;
    const m = body.measure;
    const l: number = m.hipHeight;
    const yaw0: number = input.entry.posture.yaw;
    const flatten = (side: "left" | "right"): HumanFoot.IPlacement => ({
      ankle: { ...input.entry.feet[side].ankle, y: m.ankleHeight },
      rotation: HumanFoot.rotation(
        HumanFrame.heading(input.entry.feet[side].rotation),
        0,
      ),
    });
    const start: Record<"left" | "right", HumanFoot.IPlacement> = {
      left: flatten("left"),
      right: flatten("right"),
    };
    const S: IAutoMovieVector3 = {
      x: (start.left.ankle.x + start.right.ankle.x) / 2,
      y: 0,
      z: (start.left.ankle.z + start.right.ankle.z) / 2,
    };
    const path: Path = new Path(
      [S, ...(input.via ?? []), input.to].map(
        (p: IAutoMovieVector3): IAutoMovieVector3 => ({ x: p.x, y: 0, z: p.z }),
      ),
    );
    const D: number = path.length;
    const n: number = Math.max(1, Math.ceil(D / input.longest - 1e-9));
    const delta: number = D / n;
    // The equivalent of an angle nearest a reference heading, so the headings
    // read along the path never jump by a full turn between footprints.
    const unwrap = (angle: number, near: number): number =>
      near + wrapDegrees(angle - near);
    const heading: number =
      D < 1e-6 ? yaw0 : unwrap(path.heading(0, delta / 2), yaw0);
    const along$ = (s: number): number =>
      D < 1e-6 ? heading : unwrap(path.heading(s, delta / 2), heading);
    const ending: number = unwrap(
      input.face ?? (D < 1e-6 ? heading : path.heading(D, delta / 2)),
      along$(D),
    );
    const frame: HumanFrame.IFrame = { origin: S, yaw: heading };
    const along = (side: "left" | "right"): number =>
      HumanFrame.local(frame, start[side].ankle).z;
    const lead: "left" | "right" =
      along("left") < along("right") - 1e-6 ? "left" : "right";
    const other = (side: "left" | "right"): "left" | "right" =>
      side === "left" ? "right" : "left";
    const half: number = 0.05 * l;
    const rest = (side: "left" | "right"): number =>
      Math.abs(body.rest.get(`${side}Foot`)!.x);
    const T: number = input.period(Math.max(delta, 0.05) / input.speed);
    const swing: number = (input.swing ?? 0.8) * T;
    const first: number = 0.25;
    const steps: IStep[] = [];
    for (let j: number = 1; j <= n + 1; j++) {
      const side: "left" | "right" = j % 2 === 1 ? lead : other(lead);
      const d: number = Math.min(D, j * delta);
      const lateral: number =
        (side === "left" ? 1 : -1) * (j >= n ? rest(side) : half);
      // The footfalls before the closing pair turn a third and two thirds; the pair faces the arrival.
      const toward: number =
        j >= n
          ? ending
          : j >= n - 2
            ? along$(d) + ((ending - along$(d)) * (j - n + 3)) / 3
            : along$(d);
      const point: IAutoMovieVector3 = HumanFrame.point(
        { origin: path.at(d), yaw: toward },
        { x: lateral, y: m.ankleHeight, z: 0 },
      );
      const footHeading: number =
        toward + (side === "left" ? stand.TOE_OUT : -stand.TOE_OUT);
      const heelStrike: number = first + swing + (j - 1) * T;
      steps.push({
        side,
        heelStrike,
        toeOff: heelStrike - swing,
        flat: { ankle: point, rotation: HumanFoot.rotation(footHeading, 0) },
        heading: footHeading,
        push: -PUSH,
      });
    }
    const last: number = steps.at(-1)!.heelStrike;
    const duration: number = last + 0.35;
    const counts: Record<string, number> = {};
    const events: { name: string; seconds: number }[] = [];
    for (const step of steps) {
      counts[step.side] = (counts[step.side] ?? 0) + 1;
      events.push({
        name: `${step.side}ToeOff${counts[step.side]}`,
        seconds: step.toeOff,
      });
      events.push({
        name: `${step.side}HeelStrike${counts[step.side]}`,
        seconds: step.heelStrike,
      });
    }
    events.push(
      { name: "lastFootfall", seconds: last },
      { name: "arrive", seconds: duration },
    );
    events.sort((a, b): number => a.seconds - b.seconds);
    const stances: { side: "left" | "right"; from: number; to: number }[] = [];
    for (const side of ["left", "right"] as const) {
      let from: number = 0;
      for (const step of steps.filter((s: IStep): boolean => s.side === side)) {
        stances.push({ side, from, to: step.toeOff });
        from = step.heelStrike;
      }
      stances.push({ side, from, to: duration });
    }

    // The pelvis: progression with smooth start and stop, sway and bob.
    const firstLeft: number = steps.find(
      (s: IStep): boolean => s.side === "left",
    )!.heelStrike;
    const ramp = (t: number): number => {
      const up: number = minimumJerk(t / (first + T)).s;
      const down: number =
        1 -
        minimumJerk(
          (t - steps.at(-2)!.heelStrike) /
            (last + 0.2 - steps.at(-2)!.heelStrike),
        ).s;
      return Math.min(up, down);
    };
    const accel: number = first + T;
    const decel: number = T;
    const span: number = last;
    const v: number = D / Math.max(1e-6, span - (accel + decel) / 2);
    const progress = (t: number): number => {
      const clamp: number = Math.min(span, Math.max(0, t));
      const integral = (u: number): number =>
        2.5 * u ** 4 - 3 * u ** 5 + u ** 6;
      const rise: number = accel * integral(Math.min(1, clamp / accel));
      const flatPart: number = Math.max(
        0,
        Math.min(clamp, span - decel) - accel,
      );
      const fall: number =
        clamp > span - decel
          ? decel * (0.5 - integral(1 - (clamp - (span - decel)) / decel))
          : 0;
      return v * (rise + flatPart + fall);
    };
    const rootStart: IAutoMovieVector3 = input.entry.posture.root;
    const centre = (yaw: number): IAutoMovieVector3 => {
      const a: IAutoMovieVector3 = body.rest.get("leftFoot")!;
      const b: IAutoMovieVector3 = body.rest.get("rightFoot")!;
      return HumanFrame.point(
        { origin: { x: 0, y: 0, z: 0 }, yaw },
        { x: (a.x + b.x) / 2, y: 0, z: (a.z + b.z) / 2 },
      );
    };
    const turn: number = steps[Math.max(0, steps.length - 5)]!.toeOff;
    const yawAt = (t: number): number => {
      const travel: number =
        yaw0 + (along$(progress(t)) - yaw0) * minimumJerk(t / (first + T)).s;
      return (
        travel +
        (ending - travel) *
          minimumJerk((t - turn) / Math.max(1e-6, last - turn)).s
      );
    };
    const amount = (t: number): number => Math.max(0, Math.min(1, ramp(t)));
    // A foot turned from the pelvis at its toe-off pushes off less: a turning
    // step pivots more and pushes less in the sagittal plane (Hase and Stein
    // 1999; Taylor et al. 2005); provisional, the pitch falls linearly to 15
    // degrees as the turn reaches TWIST.
    for (const side of ["left", "right"] as const) {
      let leaving: number = HumanFrame.heading(start[side].rotation);
      for (const step of steps.filter((x: IStep): boolean => x.side === side)) {
        const turn: number = wrapDegrees(
          leaving -
            (yawAt(step.toeOff) +
              (side === "left" ? stand.TOE_OUT : -stand.TOE_OUT)),
        );
        step.push = -PUSH + (PUSH - 15) * Math.min(1, Math.abs(turn) / TWIST);
        leaving = step.heading;
      }
    }
    const foot = (side: "left" | "right", t: number): IFoot =>
      footAt(body, side, steps, start[side], t, input.lift ?? 0.07);
    const planned = (t: number): IAutoMovieVector3 => {
      const yaw: number = yawAt(t);
      const c: IAutoMovieVector3 = centre(yaw);
      const a: number = amount(t);
      const sway: number =
        0.02 *
        (l / 0.93) *
        a *
        Math.cos((2 * Math.PI * (t - (firstLeft + 0.6 * T))) / (2 * T));
      const bob: number =
        input.bob === undefined
          ? a *
            (-0.015 +
              0.025 * Math.cos((2 * Math.PI * (t - (firstLeft + 0.6 * T))) / T))
          : a *
            l *
            (input.bob.mean -
              input.bob.amplitude *
                Math.cos(
                  (2 * Math.PI * (t - (firstLeft + (2 * T - swing) / 2))) / T,
                ));
      const s: number = progress(t);
      const p: IAutoMovieVector3 = HumanFrame.point(
        { origin: path.at(s), yaw: along$(s) },
        { x: sway, y: 0, z: 0 },
      );
      return { x: p.x - c.x, y: -0.005 + bob, z: p.z - c.z };
    };
    const offset: IAutoMovieVector3 = {
      x: rootStart.x - planned(0).x,
      y: rootStart.y - planned(0).y,
      z: rootStart.z - planned(0).z,
    };
    const root = (t: number): IAutoMovieVector3 => {
      const fade: number = 1 - minimumJerk(t / 0.3).s;
      const p: IAutoMovieVector3 = planned(t);
      return {
        x: p.x + offset.x * fade,
        y: p.y + offset.y * fade,
        z: p.z + offset.z * fade,
      };
    };
    return {
      duration,
      events,
      stances,
      root,
      yaw: yawAt,
      phase: (t: number): number => (t - firstLeft) / (2 * T) + 0.25,
      amount,
      foot,
    };
  }

  /**
   * Make every foot goal reachable on the actual pelvis: lower the root until
   * each planted ankle is reached with the knee at least `KNEE` degrees bent
   * (`resolveHumanPosture.lower`), a swinging foot's claim on that drop fading
   * out over the first `FADE` of its swing and in over the last so the drop
   * is continuous through every contact event, then pull an unreachable
   * swinging ankle toward its hip and turn one trailing further behind the
   * hip than a thigh `EXTENSION` degrees back and the knee's bend carry it,
   * inside the hip's 30째 extension range (DEFAULT_HUMANOID_ROM). A planted foot whose shank leans past the
   * ankle's dorsal limit raises its heel about its ball, or lowers its toes
   * about its heel in the heel rocker, and names that point as its contact; a
   * swinging foot's pitch is held inside the ankle's range relative to its
   * shank and its heading within `TWIST` of the pelvis, the limits less
   * `ANKLE` and 5 degrees, and it is lifted again wherever those clamps put a
   * toe or heel under the floor. A planted foot pivots on its toe pad by the
   * pelvis's turn beyond `TWIST`, in proportion to its heel's rise up to
   * `HEEL_UP`, the pivot of a stepping turn, and the pelvis turns no further
   * than `TWIST` from the pivoted feet; the band narrows with a swinging
   * foot's pitch. The hip
   * joints are read from the pelvis posed by the root, the heading and the
   * pelvis joint, so its rotation and list count.
   *
   * @param body The body.
   * @param root The unconstrained root, world metres.
   * @param yaw The heading, degrees.
   * @param hips The pelvis joint's clinical angles, degrees.
   * @param feet Each foot.
   * @returns The lowered root and each foot's reachable ankle.
   */
  export function reach(
    body: IHumanBody,
    root: IAutoMovieVector3,
    planned: number,
    hips: readonly [number, number, number],
    feet: Readonly<Record<"left" | "right", IFoot>>,
  ): {
    yaw: number;
    root: IAutoMovieVector3;
    ankles: Record<"left" | "right", IAutoMovieVector3>;
    rotations: Record<"left" | "right", IAutoMovieQuaternion>;
    toes: Record<"left" | "right", number>;
    contacts: Partial<Record<"left" | "right", IAutoMovieVector3>>;
  } {
    const m = body.measure;
    const limit: number = Math.sqrt(
      m.thigh ** 2 +
        m.shank ** 2 +
        2 * m.thigh * m.shank * Math.cos((KNEE * Math.PI) / 180),
    );
    // A planted foot pivots on its toe pad by the pelvis's turn beyond TWIST, in
    // proportion to how far its heel is up (none flat, all at HEEL_UP), and the
    // pelvis then turns no further than TWIST from that pivoted heading, so a
    // stepping turn unfolds continuously with the heel's rise.
    const wrap: (degrees: number) => number = wrapDegrees;
    const pivots: Record<"left" | "right", number> = { left: 0, right: 0 };
    let yaw: number = planned;
    for (const side of ["left", "right"] as const) {
      const foot: IFoot = feet[side];
      if (!foot.planted) continue;
      const heading: number = HumanFrame.heading(foot.placement.rotation);
      const off: number = wrap(planned - heading);
      const excess: number =
        Math.abs(off) > TWIST ? off - Math.sign(off) * TWIST : 0;
      pivots[side] =
        excess *
        Math.min(1, Math.max(0, -pitchOf(foot.placement.rotation) / HEEL_UP));
      const turned: number = wrap(yaw - (heading + pivots[side]));
      if (Math.abs(turned) > TWIST) yaw -= turned - Math.sign(turned) * TWIST;
    }
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      {
        skeleton: body.skeleton.id,
        root: {
          translation: root,
          rotation: resolveHumanPosture.heading({ yaw, pitch: 0, roll: 0 }),
          scale: { x: 1, y: 1, z: 1 },
        },
        joints: [
          {
            bone: "hips",
            flexion: hips[0],
            abduction: hips[1],
            twist: hips[2],
          },
        ],
      },
    );
    const hip = (side: "left" | "right"): IAutoMovieVector3 =>
      bones.get(`${side}UpperLeg`)!.worldPosition;
    const ankles = {} as Record<"left" | "right", IAutoMovieVector3>;
    const rotations: Record<"left" | "right", IAutoMovieQuaternion> = {
      left: feet.left.placement.rotation,
      right: feet.right.placement.rotation,
    };
    const toes: Record<"left" | "right", number> = {
      left: feet.left.toes,
      right: feet.right.toes,
    };
    const contacts: Partial<Record<"left" | "right", IAutoMovieVector3>> = {};
    // The planted feet are placed first (their heel rise and pivot turn) and
    // the root lowered for the ankles they end at, then placed again against
    // the lowered hips, so the root is lowered for the feet actually shown.
    // Each foot claims the drop its own ankle needs: a planted foot fully, a
    // swinging one fading out over the first FADE of its swing and back in
    // over the last, on a minimum-jerk weight (Flash and Hogan 1985), so the
    // drop is continuous with its rate through toe-off and heel strike.
    const weight = (side: "left" | "right"): number => {
      const foot: IFoot = feet[side];
      if (foot.planted) return 1;
      const u: number = foot.swing?.u ?? 0.5;
      return u < 0.5
        ? 1 - minimumJerk(Math.min(1, u / FADE)).s
        : minimumJerk(Math.max(0, (u - (1 - FADE)) / FADE)).s;
    };
    const lowering = (): number =>
      Math.max(
        0,
        ...(["left", "right"] as const).map((side): number => {
          const w: number = weight(side);
          if (w <= 0) return 0;
          const placed: IAutoMovieVector3 = feet[side].planted
            ? ankles[side]
            : feet[side].placement.ankle;
          return (
            w *
            (root.y -
              resolveHumanPosture.lower(
                body,
                {
                  root,
                  yaw,
                  pitch: 0,
                  roll: 0,
                  joints: { hips },
                  limbs: {
                    [`${side}Leg`]: {
                      point: placed,
                      bend: feet[side].placement.ankle,
                      planted: true,
                    },
                  },
                },
                KNEE,
              ).root.y)
          );
        }),
      );
    const place = (drop: number): void => {
      for (const side of ["left", "right"] as const) {
        if (!feet[side].planted) continue;
        const h: IAutoMovieVector3 = { ...hip(side), y: hip(side).y - drop };
        // The heel rises about the ball once the shank leans past the ankle's
        // dorsal limit: the forefoot rocker begins where the ankle can bend no
        // further (Perry and Burnfield), so the ball never slides.
        // A heel strike's toes come down about the heel the same way, once the
        // shank leans past that limit: the heel rocker ends no later.
        let placement: HumanFoot.IPlacement = feet[side].placement;
        const heading: number = HumanFrame.heading(placement.rotation);
        let pitch: number = pitchOf(placement.rotation);
        const about: "heel" | "mtp" = pitch > 1e-6 ? "heel" : "mtp";
        const pivot: IAutoMovieVector3 = HumanFoot.point(
          body,
          side,
          about,
          placement,
        );
        if (
          HumanFoot.point(
            body,
            side,
            about === "heel" ? "heel" : "toe",
            placement,
            feet[side].toes,
          ).y < 0.01
        )
          for (let k: number = 0; k < 4; k++) {
            const top: number =
              -lean(body, h, placement.ankle, heading) + 20 - ANKLE;
            if (pitch <= top + 1e-6) break;
            pitch = about === "heel" ? Math.max(0, top) : top;
            placement = HumanFoot.pivot(
              body,
              side,
              about,
              pivot,
              heading,
              pitch,
            );
          }
        // The pivot turn: the foot turns about its toe pad by its pivot.
        if (about === "mtp" && Math.abs(pivots[side]) > 1e-9) {
          const pad: IAutoMovieVector3 = HumanFoot.point(
            body,
            side,
            "toe",
            placement,
            Math.max(feet[side].toes, -pitch),
          );
          const turned: IAutoMovieQuaternion = HumanFoot.rotation(
            heading + pivots[side],
            pitch,
          );
          placement = {
            ankle: Vector3.subtract(
              pad,
              Quaternion.rotateVector(
                turned,
                HumanFoot.offset(
                  body,
                  side,
                  "toe",
                  Math.max(feet[side].toes, -pitch),
                ),
              ),
            ),
            rotation: turned,
          };
        }
        ankles[side] = placement.ankle;
        rotations[side] = placement.rotation;
        toes[side] = Math.max(feet[side].toes, -pitch);
        contacts[side] = HumanFoot.offset(body, side, about);
      }
    };
    place(0);
    const first: number = lowering();
    place(first);
    const drop: number = Math.max(first, lowering());
    const forward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      { x: 0, y: 0, z: 1 },
    );
    for (const side of ["left", "right"] as const) {
      if (feet[side].planted) continue;
      const ankle: IAutoMovieVector3 = feet[side].placement.ankle;
      const h: IAutoMovieVector3 = { ...hip(side), y: hip(side).y - drop };
      // A swinging ankle within reach and no further behind the hip than the
      // hip's extension allows: the thigh cannot carry it further back, and
      // the bent knee carries the ankle behind the thigh by the angle between
      // the thigh and the hip-to-ankle line, fixed by their lengths (the law
      // of cosines), so a foot leaving a trailing stance is not pulled forward.
      let v: IAutoMovieVector3 = {
        x: ankle.x - h.x,
        y: ankle.y - h.y,
        z: ankle.z - h.z,
      };
      const d: number = Math.hypot(v.x, v.y, v.z);
      if (d > limit)
        v = {
          x: (v.x * limit) / d,
          y: (v.y * limit) / d,
          z: (v.z * limit) / d,
        };
      const ahead: number = v.x * forward.x + v.z * forward.z;
      const sagittal: number = Math.hypot(ahead, v.y);
      const reach: number = Math.hypot(v.x, v.y, v.z);
      const behind: number = Math.acos(
        Math.min(
          1,
          Math.max(
            -1,
            (m.thigh ** 2 + reach ** 2 - m.shank ** 2) /
              (2 * m.thigh * Math.max(reach, 1e-9)),
          ),
        ),
      );
      const extension: number = (EXTENSION * Math.PI) / 180 + behind;
      if (v.y < 0 && Math.atan2(-ahead, -v.y) > extension) {
        const lateral: IAutoMovieVector3 = {
          x: v.x - ahead * forward.x,
          y: 0,
          z: v.z - ahead * forward.z,
        };
        const back: number = sagittal * Math.sin(extension);
        v = {
          x: lateral.x - back * forward.x,
          y: -sagittal * Math.cos(extension),
          z: lateral.z - back * forward.z,
        };
      }
      ankles[side] = { x: h.x + v.x, y: h.y + v.y, z: h.z + v.z };
      // The swinging foot leaves with the toe-pad pivot it ended its stance
      // with, decaying over the first half of the swing, so toe-off does not
      // turn the foot back; then its heading stays within the hip's rotation
      // of the pelvis.
      let rotation: IAutoMovieQuaternion = feet[side].placement.rotation;
      const swing = feet[side].swing;
      if (swing !== undefined) {
        const away: number = wrap(planned - swing.from);
        const excess: number =
          Math.abs(away) > TWIST ? away - Math.sign(away) * TWIST : 0;
        const carried: number =
          excess *
          Math.min(1, Math.max(0, -swing.push / HEEL_UP)) *
          (1 - minimumJerk(Math.min(1, 2 * swing.u)).s);
        if (Math.abs(carried) > 1e-9)
          rotation = HumanFoot.rotation(
            HumanFrame.heading(rotation) + carried,
            pitchOf(rotation),
          );
      }
      const turned: number = HumanFrame.heading(rotation);
      const off: number = wrapDegrees(turned - yaw);
      // A pitched foot leaves the hip less rotation to turn it with.
      const band: number =
        TWIST *
        Math.max(0.25, Math.cos((pitchOf(rotation) * Math.PI) / 180) ** 2);
      if (Math.abs(off) > band)
        rotation = HumanFoot.rotation(
          yaw + Math.sign(off) * band,
          pitchOf(rotation),
        );
      rotations[side] = ankleRange(body, h, ankles[side], rotation);
      // Clearance again after the clamps: neither toe nor heel below the floor.
      const placed: HumanFoot.IPlacement = {
        ankle: ankles[side],
        rotation: rotations[side],
      };
      const low: number = Math.min(
        HumanFoot.point(body, side, "toe", placed, toes[side]).y,
        HumanFoot.point(body, side, "heel", placed).y,
      );
      if (low < 0) ankles[side] = { ...ankles[side], y: ankles[side].y - low };
    }
    return {
      yaw,
      root: { ...root, y: root.y - drop },
      ankles,
      rotations,
      toes,
      contacts,
    };
  }

  /** A foot's pitch from its rotation, degrees, positive toes up. */
  function pitchOf(rotation: IAutoMovieQuaternion): number {
    const toes: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
      x: 0,
      y: 0,
      z: 1,
    });
    return (Math.asin(Math.max(-1, Math.min(1, toes.y))) * 180) / Math.PI;
  }

  /**
   * The shank's forward lean from vertical along a heading, degrees, with the
   * knee placed by the two-bone geometry in the plane of the hip, the ankle
   * and the heading.
   */
  function lean(
    body: IHumanBody,
    hip: IAutoMovieVector3,
    ankle: IAutoMovieVector3,
    heading: number,
  ): number {
    const forward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: heading },
      { x: 0, y: 0, z: 1 },
    );
    const v: IAutoMovieVector3 = Vector3.subtract(ankle, hip);
    const d: number = Vector3.length(v);
    const a: number = body.measure.thigh;
    const b: number = body.measure.shank;
    if (d < 1e-6) return 0;
    const axis: IAutoMovieVector3 = Vector3.scale(v, 1 / d);
    const along: number = (a * a - b * b + d * d) / (2 * d);
    const across: number = Math.sqrt(Math.max(0, a * a - along * along));
    let perpendicular: IAutoMovieVector3 = Vector3.subtract(
      forward,
      Vector3.scale(axis, Vector3.dot(forward, axis)),
    );
    if (Vector3.length(perpendicular) < 1e-9) return 0;
    perpendicular = Vector3.normalize(perpendicular);
    const knee: IAutoMovieVector3 = Vector3.add(
      hip,
      Vector3.add(
        Vector3.scale(axis, along),
        Vector3.scale(perpendicular, across),
      ),
    );
    const shank: IAutoMovieVector3 = Vector3.subtract(knee, ankle);
    return (Math.atan2(Vector3.dot(shank, forward), shank.y) * 180) / Math.PI;
  }

  /**
   * A swinging foot's rotation kept inside the ankle's range: the knee is
   * placed by the two-bone geometry in the plane of the hip, the ankle and
   * the foot's heading, the shank's inclination read from it, and the foot's
   * pitch held within `ANKLE` of the ankle's 50째 plantar and 20째 dorsal limits
   * (DEFAULT_HUMANOID_ROM) relative to the shank.
   */
  function ankleRange(
    body: IHumanBody,
    hip: IAutoMovieVector3,
    ankle: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion,
  ): IAutoMovieQuaternion {
    const heading: number = HumanFrame.heading(rotation);
    const shank: number = lean(body, hip, ankle, heading);
    const pitch: number = pitchOf(rotation);
    const clamped: number = Math.min(
      -shank + 20 - ANKLE,
      Math.max(-shank - 50 + ANKLE, pitch),
    );
    return clamped === pitch ? rotation : HumanFoot.rotation(heading, clamped);
  }

  /** Degrees a swinging foot keeps inside the ankle's range. */
  const ANKLE: number = 2;

  /** The least knee flexion of a planted or reaching leg, degrees: a walking knee never locks straight. */
  const KNEE: number = 10;

  /** The largest heading, degrees, a foot may keep from the pelvis: 25째 inside the hip's 45째 rotation (DEFAULT_HUMANOID_ROM), room for the pitch a toe-off and the list a turned leg also ask of it. */
  const TWIST: number = 20;

  /** Pitch, degrees toes-down, at which a planted foot's heel is far enough up to take the whole pivot turn on its toe pad. */
  const HEEL_UP: number = 30;
}

/** A foot's placement at an instant: the rocker of its stance or its swing between footprints. */
function footAt(
  body: IHumanBody,
  side: "left" | "right",
  steps: readonly {
    side: "left" | "right";
    heelStrike: number;
    toeOff: number;
    flat: HumanFoot.IPlacement;
    heading: number;
    push: number;
  }[],
  start: HumanFoot.IPlacement,
  t: number,
  lift: number,
): walkSteps.IFoot {
  const own = steps.filter((s) => s.side === side);
  let flat: HumanFoot.IPlacement = start;
  let heading: number | undefined;
  let strike: number = -Infinity;
  for (const step of own) {
    if (t < step.toeOff) {
      return stance(
        body,
        side,
        flat,
        headingOf(flat, heading),
        strike,
        step.toeOff,
        t,
        step.push,
      );
    }
    if (t < step.heelStrike) {
      const off: HumanFoot.IPlacement = rocked(
        body,
        side,
        flat,
        headingOf(flat, heading),
        step.push,
        "mtp",
      );
      const land: HumanFoot.IPlacement = rocked(
        body,
        side,
        step.flat,
        step.heading,
        15,
        "heel",
      );
      const u: number = (t - step.toeOff) / (step.heelStrike - step.toeOff);
      const toes: number = -step.push * (1 - minimumJerk(Math.min(1, 2 * u)).s);
      return {
        placement: swingAt(
          body,
          side,
          off,
          land,
          headingOf(flat, heading),
          step.heading,
          u,
          toes,
          lift,
          step.push,
        ),
        planted: false,
        toes,
        swing: { u, from: headingOf(flat, heading), push: step.push },
      };
    }
    flat = step.flat;
    heading = step.heading;
    strike = step.heelStrike;
  }
  return stance(
    body,
    side,
    flat,
    headingOf(flat, heading),
    strike,
    Infinity,
    t,
    -walkSteps.PUSH,
  );
}

/** A footprint's heading, or the starting foot's own heading. */
function headingOf(
  flat: HumanFoot.IPlacement,
  heading: number | undefined,
): number {
  return heading ?? HumanFrame.heading(flat.rotation);
}

/** A flat footprint pitched about its heel or ball. */
function rocked(
  body: IHumanBody,
  side: "left" | "right",
  flat: HumanFoot.IPlacement,
  heading: number,
  pitch: number,
  about: "heel" | "mtp",
): HumanFoot.IPlacement {
  return HumanFoot.pivot(
    body,
    side,
    about,
    HumanFoot.point(body, side, about, flat),
    heading,
    pitch,
  );
}

/** A foot in stance: heel rocker after its strike, flat, forefoot rocker before its toe-off. */
function stance(
  body: IHumanBody,
  side: "left" | "right",
  flat: HumanFoot.IPlacement,
  heading: number,
  strike: number,
  toeOff: number,
  t: number,
  push: number,
): walkSteps.IFoot {
  const length: number =
    Number.isFinite(strike) && Number.isFinite(toeOff) ? toeOff - strike : 1;
  if (Number.isFinite(strike) && t < strike + 0.12 * length) {
    const pitch: number =
      15 * (1 - minimumJerk((t - strike) / (0.12 * length)).s);
    return {
      placement: rocked(body, side, flat, heading, pitch, "heel"),
      planted: true,
      toes: 0,
    };
  }
  if (Number.isFinite(toeOff)) {
    const rise: number =
      toeOff - 0.4 * (Number.isFinite(strike) ? length : 0.6);
    if (t > rise) {
      const pitch: number = push * minimumJerk((t - rise) / (toeOff - rise)).s;
      return {
        placement: rocked(body, side, flat, heading, pitch, "mtp"),
        planted: true,
        toes: -pitch,
      };
    }
  }
  return {
    placement: { ankle: flat.ankle, rotation: HumanFoot.rotation(heading, 0) },
    planted: true,
    toes: 0,
  };
}

/** A swinging foot between its toe-off and heel-strike placements, clear of the floor. */
function swingAt(
  body: IHumanBody,
  side: "left" | "right",
  lift: HumanFoot.IPlacement,
  land: HumanFoot.IPlacement,
  fromHeading: number,
  toHeading: number,
  u: number,
  toes: number,
  height: number,
  push: number,
): HumanFoot.IPlacement {
  const s: number = minimumJerk(u).s;
  const pitch: number = push + (15 - push) * s;
  const heading: number = fromHeading + (toHeading - fromHeading) * s;
  const ankle: IAutoMovieVector3 = {
    x: lift.ankle.x + (land.ankle.x - lift.ankle.x) * s,
    y:
      lift.ankle.y +
      (land.ankle.y - lift.ankle.y) * s +
      height *
        body.measure.hipHeight *
        Math.sin(Math.PI * Math.min(1, Math.max(0, u))),
    z: lift.ankle.z + (land.ankle.z - lift.ankle.z) * s,
  };
  const placement: HumanFoot.IPlacement = {
    ankle,
    rotation: HumanFoot.rotation(heading, pitch),
  };
  const low: number = Math.min(
    HumanFoot.point(body, side, "toe", placement, toes).y,
    HumanFoot.point(body, side, "heel", placement).y,
  );
  const clearance: number =
    0.012 * Math.sin(Math.PI * Math.min(1, Math.max(0, u)));
  if (low < clearance && u > 0 && u < 1) ankle.y += clearance - low;
  return placement;
}

/** A floor polyline by arc length. */
class Path {
  /** Cumulative arc length at each point. */
  private readonly cumulative: number[];

  /** Total length, metres. */
  public readonly length: number;

  public constructor(private readonly points: readonly IAutoMovieVector3[]) {
    this.cumulative = [0];
    for (let i: number = 1; i < points.length; i++)
      this.cumulative.push(
        this.cumulative[i - 1]! +
          Math.hypot(
            points[i]!.x - points[i - 1]!.x,
            points[i]!.z - points[i - 1]!.z,
          ),
      );
    this.length = this.cumulative.at(-1)!;
  }

  /**
   * The point at an arc length, clamped to the ends.
   *
   * @param s Arc length, metres.
   * @returns The floor point.
   */
  public at(s: number): IAutoMovieVector3 {
    const c: number = Math.min(this.length, Math.max(0, s));
    let i: number = 1;
    while (i < this.points.length - 1 && this.cumulative[i]! < c) i++;
    const a: IAutoMovieVector3 = this.points[i - 1]!;
    const b: IAutoMovieVector3 = this.points[i]!;
    const span: number = this.cumulative[i]! - this.cumulative[i - 1]!;
    const u: number = span < 1e-12 ? 0 : (c - this.cumulative[i - 1]!) / span;
    return { x: a.x + (b.x - a.x) * u, y: 0, z: a.z + (b.z - a.z) * u };
  }

  /**
   * The heading of the chord across an arc length's neighbourhood, degrees about +Y (0 faces +Z).
   *
   * @param s Arc length, metres.
   * @param width Half the neighbourhood, metres.
   * @returns The heading.
   */
  public heading(s: number, width: number): number {
    const w: number = Math.max(width, 1e-3);
    let lo: number = s - w;
    let hi: number = s + w;
    if (lo < 0) [lo, hi] = [0, 2 * w];
    if (hi > this.length)
      [lo, hi] = [Math.max(0, this.length - 2 * w), this.length];
    const a: IAutoMovieVector3 = this.at(lo);
    const b: IAutoMovieVector3 = this.at(hi);
    return (Math.atan2(b.x - a.x, b.z - a.z) * 180) / Math.PI;
  }
}
