import { Reaction } from "../motion/reactions/Reaction";
import { Vec3 } from "../motion/rig/Vec3";
import { Strike } from "../motion/striking/Strike";
import { BoutScript } from "../shots/kickboxing/ring-bout/BoutScript";
import type { FilmRuntime } from "./FilmRuntime";

/**
 * Whole-film measurement of the displayed motion: limb goals, planted support,
 * speed spikes, body interpenetration, canvas penetration and knee lock.
 *
 * @evidence contracts/common.md#implementation-and-ownership Samples FilmRuntime.solve — the same solve the Viewer and export draw — at a fixed rate and measures FK joints with segment skin radii. Bodies are capsules between joints (torso, head, arms, legs) and gloves are spheres; capsule distances are exact segment–segment distances minus radii, a conservative proxy of the polygon surface. Glove and leg overlaps inside a scripted strike or defence window are contact, not defects; trunk and head overlaps never are.
 * @evidence contracts/common.md#authoring-interface `run` returns worst values with their film seconds; thresholds belong to the caller (the motion audit test). Rate in samples per second; speeds in m/s; distances in metres.
 */
export namespace MotionAudit {
  /**
   * Worst value and when it happened.
   *
   * @evidence contracts/common.md#implementation-and-ownership Plain maximum record.
   * @evidence contracts/common.md#authoring-interface Value units depend on the field; seconds are film seconds.
   */
  export interface Worst {
    /** Measured value. */ value: number;
    /** Film second. */ seconds: number;
    /** What was measured. */ label: string;
  }

  /**
   * Audit result.
   *
   * @evidence contracts/common.md#implementation-and-ownership Plain result of one audit run.
   * @evidence contracts/common.md#authoring-interface Metres, m/s and degrees as named.
   */
  export interface Report {
    /** Samples evaluated. */ samples: number;
    /** Planted-foot ankle goal error of the fighters. */ plantedFoot: Worst;
    /** Planted-foot ankle goal error of the referee. */ refereeFoot: Worst;
    /** Any other limb goal error (gloves, kicks, lying limbs). */ freeLimb: Worst;
    /** Planted foot ball distance from its body root (feet left behind). */ footSpread: Worst;
    /** Trunk/head joint speed. */ trunkSpeed: Worst;
    /** Hand/foot joint speed. */ limbSpeed: Worst;
    /** Trunk or head interpenetration between A and B. */ bodyOverlap: Worst;
    /** Limb interpenetration outside any scripted strike/defence window. */ limbOverlap: Worst;
    /** Lowest body point below the canvas (positive = below). */ canvas: Worst;
    /** Smallest knee flexion of a planted fighting-stance leg, degrees. */ straightKnee: Worst;
  }

  /**
   * Run the audit over [start, end] at `rate` samples per second.
   *
   * @evidence contracts/common.md#implementation-and-ownership Solves every sample with FilmRuntime.solve and measures FK joints, capsules and speeds against the previous sample.
   * @evidence contracts/common.md#authoring-interface Interval in film seconds and a sample rate; returns worst values.
   */
  export function run(
    runtime: FilmRuntime,
    start: number,
    end: number,
    rate: number,
  ): Report {
    const worst = (label: string, value: number = -Infinity): Worst => ({
      value,
      seconds: NaN,
      label,
    });
    const report: Report = {
      samples: 0,
      plantedFoot: worst("planted ankle error"),
      refereeFoot: worst("referee planted ankle error"),
      freeLimb: worst("free limb error"),
      footSpread: worst("foot to root"),
      trunkSpeed: worst("trunk speed"),
      limbSpeed: worst("limb speed"),
      bodyOverlap: worst("trunk/head overlap"),
      limbOverlap: worst("limb overlap"),
      canvas: worst("below canvas"),
      straightKnee: { value: Infinity, seconds: NaN, label: "knee flexion" },
    };
    const raise = (w: Worst, value: number, t: number, label: string): void => {
      if (value > w.value) Object.assign(w, { value, seconds: t, label });
    };
    let previous: Record<string, FilmRuntime.Solved> | undefined;
    const dt: number = 1 / rate;
    for (let t: number = start; t <= end + 1e-9; t += dt) {
      const solved: Record<string, FilmRuntime.Solved> = runtime.solve(
        Math.min(t, 180),
      );
      report.samples++;
      for (const [id, s] of Object.entries(solved)) {
        const lift: number = s.root.position[1] - s.request.root.position[1];
        const at = (bone: string): Vec3.Value => s.joints.get(bone)!;
        const lowered = (p: Vec3.Value): Vec3.Value => [
          p[0],
          p[1] - lift,
          p[2],
        ];

        // Limb goals.
        for (const side of ["left", "right"] as const) {
          const leg = s.request.legs?.[side];
          if (leg) {
            const error: number = Vec3.distance(
              lowered(at(`${side}Foot`)),
              leg.point,
            );
            if (s.frame.legs[side].kind === "place")
              raise(
                id === "referee" ? report.refereeFoot : report.plantedFoot,
                error,
                t,
                `${id} ${side} foot`,
              );
            else
              raise(
                report.freeLimb,
                error,
                t,
                `${id} ${side} leg ${s.frame.legs[side].kind}`,
              );
          }
          const arm = s.request.arms?.[side];
          if (arm) {
            const hand: Vec3.Value = at(`${side}Hand`);
            const glove: Vec3.Value = Vec3.add(
              hand,
              Vec3.scale(
                Vec3.normalize(Vec3.sub(hand, at(`${side}LowerArm`))),
                0.065,
              ),
            );
            raise(
              report.freeLimb,
              Vec3.distance(lowered(glove), arm.point),
              t,
              `${id} ${side} hand ${s.frame.hands[side].kind}`,
            );
          }
          const leg2 = s.frame.legs[side];
          if (
            leg2.kind === "place" &&
            !(id === "b" && t > BoutScript.finish.at)
          ) {
            const ball: Vec3.Value = Vec3.lerp(
              at(`${side}HalluxProximal`),
              at(`${side}Toe5Proximal`),
              0.5,
            );
            raise(
              report.footSpread,
              Math.hypot(
                ball[0] - s.root.position[0],
                ball[2] - s.root.position[2],
              ),
              t,
              `${id} ${side} foot`,
            );
            const knee: number = s.pose.legs?.[side]?.knee?.flexion ?? 0;
            if (
              id !== "referee" &&
              s.frame.turn !== 0 &&
              knee < report.straightKnee.value
            )
              Object.assign(report.straightKnee, {
                value: knee,
                seconds: t,
                label: `${id} ${side} knee`,
              });
          }
        }

        // Canvas.
        for (const [bone, point] of s.joints)
          raise(
            report.canvas,
            -(point[1] - Math.min(s.radii.get(bone) ?? 0, 0.08)),
            t,
            `${id} ${bone}`,
          );

        // Speeds against the previous sample.
        const before: FilmRuntime.Solved | undefined = previous?.[id];
        if (before)
          for (const [bone, point] of s.joints) {
            const speed: number =
              Vec3.distance(point, before.joints.get(bone)!) / dt;
            if (/^(hips|spine|chest|neck|head)$/u.test(bone))
              raise(report.trunkSpeed, speed, t, `${id} ${bone}`);
            else if (/(Hand|Foot)$/u.test(bone))
              raise(report.limbSpeed, speed, t, `${id} ${bone}`);
          }
      }

      // A–B interpenetration.
      const a: Capsule[] = capsules(solved.a!);
      const b: Capsule[] = capsules(solved.b!);
      const exchange: boolean = engaged(t);
      for (const x of a)
        for (const y of b) {
          const overlap: number =
            x.radius + y.radius - segment(x.from, x.to, y.from, y.to);
          if (overlap <= 0) continue;
          if (x.trunk && y.trunk)
            raise(report.bodyOverlap, overlap, t, `a ${x.name} / b ${y.name}`);
          else if (!exchange && t < BoutScript.finish.at)
            raise(report.limbOverlap, overlap, t, `a ${x.name} / b ${y.name}`);
        }
      previous = solved;
    }
    return report;
  }

  /** A body capsule between two joints. */
  interface Capsule {
    /** Part name. */ name: string;
    /** Segment start, world metres. */ from: Vec3.Value;
    /** Segment end, world metres. */ to: Vec3.Value;
    /** Radius, metres. */ radius: number;
    /** Trunk or head (never allowed to overlap). */ trunk: boolean;
  }

  /** Capsules of one solved body. */
  function capsules(s: FilmRuntime.Solved): Capsule[] {
    const at = (bone: string): Vec3.Value => s.joints.get(bone)!;
    const head: Vec3.Value = at("head");
    const list: Capsule[] = [
      {
        name: "pelvis-chest",
        from: at("hips"),
        to: at("chest"),
        radius: 0.14,
        trunk: true,
      },
      {
        name: "chest-neck",
        from: at("chest"),
        to: at("neck"),
        radius: 0.13,
        trunk: true,
      },
      {
        name: "head",
        from: head,
        to: Vec3.add(head, [0, 0.1, 0]),
        radius: 0.1,
        trunk: true,
      },
    ];
    for (const side of ["left", "right"] as const) {
      const hand: Vec3.Value = at(`${side}Hand`);
      const glove: Vec3.Value = Vec3.add(
        hand,
        Vec3.scale(
          Vec3.normalize(Vec3.sub(hand, at(`${side}LowerArm`))),
          0.065,
        ),
      );
      list.push(
        {
          name: `${side} upper arm`,
          from: at(`${side}UpperArm`),
          to: at(`${side}LowerArm`),
          radius: 0.05,
          trunk: false,
        },
        {
          name: `${side} forearm`,
          from: at(`${side}LowerArm`),
          to: at(`${side}Hand`),
          radius: 0.045,
          trunk: false,
        },
        {
          name: `${side} glove`,
          from: glove,
          to: glove,
          radius: 0.095,
          trunk: false,
        },
        {
          name: `${side} thigh`,
          from: at(`${side}UpperLeg`),
          to: at(`${side}LowerLeg`),
          radius: 0.075,
          trunk: false,
        },
        {
          name: `${side} shin`,
          from: at(`${side}LowerLeg`),
          to: at(`${side}Foot`),
          radius: 0.05,
          trunk: false,
        },
      );
    }
    return list;
  }

  /** Whether any scripted strike or defence is live (limbs may then meet). */
  function engaged(t: number): boolean {
    if (t < 1.6) return true;
    for (const action of BoutScript.actions) {
      const [start, end] = Strike.window(action);
      const [checkStart, checkEnd] =
        action.defense === "check"
          ? Reaction.checkWindow(action)
          : [start, end];
      if (
        t >= Math.min(start, checkStart) - 0.15 &&
        t <= Math.max(end, checkEnd) + 0.25
      )
        return true;
    }
    return false;
  }
}

/** Distance between segments [p1, q1] and [p2, q2]. */
function segment(
  p1: Vec3.Value,
  q1: Vec3.Value,
  p2: Vec3.Value,
  q2: Vec3.Value,
): number {
  const d1: Vec3.Value = Vec3.sub(q1, p1);
  const d2: Vec3.Value = Vec3.sub(q2, p2);
  const r: Vec3.Value = Vec3.sub(p1, p2);
  const a: number = Vec3.dot(d1, d1);
  const e: number = Vec3.dot(d2, d2);
  const f: number = Vec3.dot(d2, r);
  let s: number;
  let t: number;
  if (a <= 1e-12 && e <= 1e-12) return Vec3.length(r);
  if (a <= 1e-12) {
    s = 0;
    t = Math.min(1, Math.max(0, f / e));
  } else {
    const c: number = Vec3.dot(d1, r);
    if (e <= 1e-12) {
      t = 0;
      s = Math.min(1, Math.max(0, -c / a));
    } else {
      const b: number = Vec3.dot(d1, d2);
      const denominator: number = a * e - b * b;
      s =
        denominator > 1e-12
          ? Math.min(1, Math.max(0, (b * f - c * e) / denominator))
          : 0;
      t = (b * s + f) / e;
      if (t < 0) {
        t = 0;
        s = Math.min(1, Math.max(0, -c / a));
      } else if (t > 1) {
        t = 1;
        s = Math.min(1, Math.max(0, (b - c) / a));
      }
    }
  }
  return Vec3.distance(
    Vec3.add(p1, Vec3.scale(d1, s)),
    Vec3.add(p2, Vec3.scale(d2, t)),
  );
}
