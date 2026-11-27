import { Vector3, AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanLegChain,
  IAutoMovieMotionHumanWalkFoot,
  IAutoMovieMotionHumanWalkLegClearance,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { walkFoot } from "../../actions/internal/walkFoot";
import { walkLeg } from "../../actions/internal/walkLeg";
import { walkLegCapsules } from "../../actions/internal/walkLegCapsules";
import { walkLegClearance } from "../../gait/internal/walkLegClearance";
import { walkReach } from "../../actions/internal/walkReach";
import { walkReachGround } from "../../actions/internal/walkReachGround";
import { readHumanBone } from "../../body/internal/readHumanBone";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanLegChain } from "../../posture/internal/HumanLegChain";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { StrikingTarget } from "../../striking/internal/StrikingTarget";
import { staggerBounds } from "./staggerBounds";
import { staggerDorsal } from "./staggerDorsal";
import { staggerKnots } from "./staggerKnots";
import { staggerLean } from "./staggerLean";
import type { staggerRecover } from "./staggerRecover";

/*
 * Whether a stagger's legs hold its recovery at the given instants
 * (`staggerRecover`): at each, the pelvis carried by the centre of mass's
 * course less the trunk's shift of it (`staggerLean`; the hips read upright,
 * the trunk's tilt about them left out of the legs' reading) and lowered to the
 * height its planted legs allow (`walkReachGround`, the walk's own closed-form
 * claim of each leg's reach with its knee `walkReach`'s least bend), and every
 * planted leg then solved as the two-bone chain it is: its hip-to-ankle
 * distance within the thigh and shank, its knee's flexion inside the rig's knee
 * range (by the cosine law on the measured thigh and shank), and its thigh no
 * further behind the hip than the hip's extension allows (`walkLeg.trailing`
 * against `walkReach.EXTENSION`); a foot touching down must also end its swing
 * inside the swing's own leg ranges (`walkReach.swing`, to
 * `staggerBounds.SETTLED`). Where the feet cross, the two planted legs, each
 * posed by the posture's own leg fit, must keep within the tangle audit's give
 * of each other (`walkLegClearance.excess`, `walkLegClearance.BOUND`).
 *
 * The admission decides every instant it reads: each test is a closed-form
 * reading of the legs under one pelvis, so no instant is left undecided and no
 * stance course is solved.
 * Parameter body: The body.
 * Parameter entry: The posture the push meets.
 * Parameter walk: The recovery's steps, the centre of mass's course from the
 * entry's, the extrapolated centre of mass and the entry's centre, at seconds
 * since the action's start.
 * Parameter bend: The centre of mass's shift per sine of the trunk's pitch and roll
 * (`staggerKnots.bending`).
 * Parameter instants: The seconds to read, since the action's start.
 * Parameter crossing: Whether the feet cross at these instants, so the two planted
 * legs' clearance is read.
 * Returns: Whether every planted leg holds at every instant.
 */
export function staggerAdmission(
  body: IAutoMovieMotionHumanActionContext["body"],
  entry: IAutoMovieMotionHumanActionContext["entry"],
  walk: IStaggerAdmissionWalk,
  bend: Record<StaggerAdmissionBendEntry, IAutoMovieVector3>,
  instants: readonly number[],
  crossing: boolean,
): boolean {
  const lean: ReturnType<typeof staggerLean> = staggerLean(
    body,
    entry,
    walk,
    bend,
  );
  const entered: Record<
    AutoMovieHumanSide,
    IAutoMovieMotionHumanFoot.IPlacement
  > = StrikingTarget.feet(entry);
  const thigh: number = body.measure.thigh;
  const shank: number = body.measure.shank;
  const knee: (side: AutoMovieHumanSide) => number = (
    side: AutoMovieHumanSide,
  ): number =>
    AutoMovieEngineKinematics.getConstraint(
      `${side}LowerLeg`,
      readHumanBone(body, `${side}LowerLeg`)?.constraint ?? null,
    )?.flexion?.max ?? 180;

  // Crossed legs clear in closed form: each leg a two-bone chain whose knee
  // lies on its circle about the hip-to-ankle axis toward its knee hint
  // (`staggerKnots.kneePole`), and each thigh and shank the bounding capsule
  // of every probe of its segment (`walkLegCapsules.prepare`). Capsules
  // that keep apart hold every probe apart, so the legs clear; only legs
  // whose capsules meet are posed by the posture's own fit and read as the
  // tangle audit reads them. The premise is the fit's knee lying in the
  // plane of its hint, which the fit's own hint asks of it.
  // Only a crossed double support needs the leg collision geometry.
  const clearance: walkLegCapsules.IPrepared | undefined = crossing
    ? walkLegClearance.prepare(body)
    : undefined;
  const segment: (
    p: IAutoMovieVector3,
    q: IAutoMovieVector3,
    r: IAutoMovieVector3,
    s: IAutoMovieVector3,
  ) => number = (
    p: IAutoMovieVector3,
    q: IAutoMovieVector3,
    r: IAutoMovieVector3,
    s: IAutoMovieVector3,
  ): number => {
    // The closest points of two segments (Ericson 2005, section 5.1.9).
    const d1: IAutoMovieVector3 = Vector3.subtract(q, p);
    const d2: IAutoMovieVector3 = Vector3.subtract(s, r);
    const w: IAutoMovieVector3 = Vector3.subtract(p, r);
    const a: number = Vector3.dot(d1, d1);
    const e: number = Vector3.dot(d2, d2);
    const f: number = Vector3.dot(d2, w);
    const c: number = Vector3.dot(d1, w);
    const b: number = Vector3.dot(d1, d2);
    const denom: number = a * e - b * b;
    let u: number =
      a > 1e-12 && denom > 1e-12
        ? Math.min(1, Math.max(0, (b * f - c * e) / denom))
        : 0;
    let v: number = e > 1e-12 ? (b * u + f) / e : 0;
    if (v < 0) {
      v = 0;
      u = a > 1e-12 ? Math.min(1, Math.max(0, -c / a)) : 0;
    } else if (v > 1) {
      v = 1;
      u = a > 1e-12 ? Math.min(1, Math.max(0, (b - c) / a)) : 0;
    }
    return Vector3.distance(
      Vector3.add(p, Vector3.scale(d1, u)),
      Vector3.add(r, Vector3.scale(d2, v)),
    );
  };
  function apart(
    ground: walkReach.IGround,
    capsules: walkLegCapsules.IPrepared["capsules"],
  ): boolean {
    const parts: Record<AutoMovieHumanSide, IPartsItemEntry[]> = {
      left: [],
      right: [],
    };
    for (const side of ["left", "right"] as const) {
      const hip: IAutoMovieVector3 = ground.hips[side];
      const ankle: IAutoMovieVector3 = ground.feet[side].ankle;
      const d: number = Math.max(1e-9, Vector3.distance(hip, ankle));
      const n: IAutoMovieVector3 = Vector3.scale(
        Vector3.subtract(ankle, hip),
        1 / d,
      );
      const x: number = Math.min(
        thigh,
        Math.max(-thigh, (thigh ** 2 - shank ** 2 + d ** 2) / (2 * d)),
      );
      const pole: IAutoMovieVector3 = Vector3.subtract(
        staggerKnots.kneePole(
          body,
          ground.root,
          ground.yaw,
          side,
          HumanFoot.heading(ground.feet[side].rotation),
        ),
        hip,
      );
      const off: IAutoMovieVector3 = Vector3.subtract(
        pole,
        Vector3.scale(n, Vector3.dot(pole, n)),
      );
      const size: number = Vector3.length(off);
      const knee: IAutoMovieVector3 = Vector3.add(
        Vector3.add(hip, Vector3.scale(n, x)),
        size > 1e-9
          ? Vector3.scale(
              off,
              Math.sqrt(Math.max(0, thigh ** 2 - x ** 2)) / size,
            )
          : { x: 0, y: 0, z: 0 },
      );
      for (const [bone, from, to] of [
        [`${side}UpperLeg`, hip, knee],
        [`${side}LowerLeg`, knee, ankle],
      ] as const) {
        const capsule: walkLegCapsules.ICapsule | undefined =
          capsules.get(bone);
        if (capsule === undefined) return false;
        const dir: IAutoMovieVector3 = Vector3.normalize(
          Vector3.subtract(to, from),
        );
        parts[side].push({
          from: Vector3.add(from, Vector3.scale(dir, capsule.lo)),
          to: Vector3.add(from, Vector3.scale(dir, capsule.hi)),
          radius: capsule.radius,
        });
      }
    }
    for (const one of parts.left)
      for (const other of parts.right)
        if (
          segment(one.from, one.to, other.from, other.to) <
          one.radius + other.radius
        )
          return false;
    return true;
  }

  for (const t of instants) {
    // The feet as the steps schedule them, a swinging foot read where it
    // left with its share, as the displayed feet are (`StaggerFeet`).
    const feet: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanWalkFoot.IScheduled
    > = {
      left: { placement: entered.left, toes: 0 },
      right: { placement: entered.right, toes: 0 },
    };
    for (const step of walk.steps)
      if (t >= step.land - 1e-9)
        feet[step.side] = { placement: step.to, toes: 0 };
    for (const step of walk.steps)
      if (t > step.start && t < step.land - 1e-9)
        feet[step.side] = {
          placement: step.from,
          toes: 0,
          swing: {
            u: (t - step.start) / (step.land - step.start),
            off: step.start,
            on: step.land,
          },
        };

    // The pelvis on the centre of mass's course less the trunk's shift of
    // it (`staggerLean`), lowered as the legs ask.
    const root: IAutoMovieVector3 = lean(t).root;
    const ground: walkReach.IGround = walkReachGround(
      body,
      root,
      walkReach.pelvis(
        body,
        root,
        entry.posture.yaw,
        entry.posture.joints.hips ?? [0, 0, 0],
        feet,
      ),
      feet,
      {},
      undefined,
      undefined,
      staggerDorsal(body, walk.pressure(t), feet),
    );
    const planted: AutoMovieHumanSide[] = (["left", "right"] as const).filter(
      (side: AutoMovieHumanSide): boolean => feet[side].swing === undefined,
    );
    for (const side of planted) {
      const hip: IAutoMovieVector3 = ground.hips[side];
      const ankle: IAutoMovieVector3 = ground.feet[side].ankle;
      const reach: number = Vector3.distance(hip, ankle);
      if (!(reach <= thigh + shank + 1e-9)) return false;

      // The knee's flexion by the cosine law: 180 degrees less the angle
      // between the thigh and the shank at the knee.
      const inner: number = Math.acos(
        Math.min(
          1,
          Math.max(
            -1,
            (thigh ** 2 + shank ** 2 - reach ** 2) / (2 * thigh * shank),
          ),
        ),
      );
      if (180 - (inner * 180) / Math.PI > knee(side)) return false;
      if (walkLeg.trailing(body, hip, ankle, ground.yaw) > walkReach.EXTENSION)
        return false;

      // A foot touching down here ends its swing where the swing's own leg
      // ranges hold it (`walkReach.swing`), or the displayed swing, held
      // short of it, would snap onto it at the touch-down.
      if (
        walk.steps.some(
          (step: staggerRecover.IStep): boolean =>
            step.side === side && Math.abs(step.land - t) < 1e-9,
        )
      ) {
        const foot: walkFoot.IEnd = ground.feet[side];
        const swung: walkFoot.IEnd = walkReach.swing(body, side, ground, {
          placement: { ankle: foot.ankle, rotation: foot.rotation },
          toes: foot.toes,
        });
        if (Vector3.distance(swung.ankle, foot.ankle) > staggerBounds.SETTLED)
          return false;
      }
    }

    // Crossed feet: the two planted legs as the posture's fit poses them,
    // their knees toward the hints the posture gives them.
    if (clearance !== undefined && planted.length === 2) {
      if (apart(ground, clearance.capsules)) continue;
      const pelvis: IAutoMovieQuaternion =
        ground.pelvis ??
        humanPostureHeading({ yaw: ground.yaw, pitch: 0, roll: 0 });
      const legs: IAutoMovieMotionHumanWalkLegClearance.ILeg[] = [];
      for (const side of planted) {
        const foot: walkFoot.IEnd = ground.feet[side];
        const bend: IAutoMovieVector3 = staggerKnots.kneePole(
          body,
          ground.root,
          ground.yaw,
          side,
          HumanFoot.heading(foot.rotation),
        );
        const swivel: IAutoMovieMotionHumanLegChain.ISwivel = HumanLegChain.fit(
          body,
          side,
          pelvis,
          ground.hips[side],
          foot.ankle,
          bend,
          foot.rotation,
        );
        const posed: IAutoMovieMotionHumanLegChain.IPosed | null =
          HumanLegChain.pose(
            body,
            side,
            pelvis,
            ground.hips[side],
            foot.ankle,
            swivel,
          );
        if (posed === null) return false;
        legs.push({ ...posed, side, rotation: foot.rotation });
      }
      if (
        walkLegClearance.excess(clearance, legs[0]!, legs[1]!) >
        walkLegClearance.BOUND
      )
        return false;
    }
  }
  return true;
}

/*
 * The record of `IPartsItemEntry`'s site.
 */
type IPartsItemEntry = {
  from: IAutoMovieVector3;
  to: IAutoMovieVector3;
  radius: number;
};

/*
 * The alternatives of `StaggerAdmissionBendEntry`'s site.
 */
type StaggerAdmissionBendEntry = "pitch" | "roll";

/*
 * The record of `IStaggerAdmissionWalk`'s site.
 */
type IStaggerAdmissionWalk = {
  steps: readonly staggerRecover.IStep[];
  course: (seconds: number) => IAutoMovieVector3;
  pressure: (seconds: number) => IAutoMovieVector3;
  extrapolated: (seconds: number) => IAutoMovieVector3;
  centre: IAutoMovieVector3;
};
