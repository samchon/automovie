import {
  Quaternion,
  Vector3,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAudit,
  AutoMovieMotionHumanAuditMotion,
  AutoMovieMotionHumanAuditTangleModel,
  HumanArmGeometry,
  HumanArmTrajectoryPairs,
  HumanColliders,
} from "@automovie/motions/internal";
import { writeFileSync } from "node:fs";

/** One directed skin reading, including the probe's standing allowance. */
interface IGap {
  probe: number;
  shape: number;
  signedMm: number;
  referenceMm: number;
  depthMm: number;
}

/** One collider segment's placed queries and the probes that ride it. */
interface IPlacedPart {
  frame: IAutoMovieMotionHumanColliders.IPlaced;
  centre: IAutoMovieVector3;
  probes: IAutoMovieVector3[];
  queries: ReturnType<typeof physicalShapeSegmentDistance.prepare>[];
}

/**
 * Record the same body's directed arm/self skin distances on the pickup's
 * original waypoint clock and on the 24 Hz take verdict clock. The displayed
 * take is already solved, so the diagnostic only reads it. The original
 * waypoint clock is reconstructed from the authored events, before any
 * admissions that insert new solver knots.
 *
 * @param take The actual take passed to the fixture assertion.
 * @param body The same performer's body.
 * @param subject The pickup performer.
 * @param side The pickup arm.
 * @param path The explicitly requested JSON receipt path.
 */
export function traceMotionArmClearance(
  take: IAutoMovieMotionHumanPerformance,
  body: IAutoMovieMotionHumanBody,
  subject: string,
  side: AutoMovieHumanSide,
  path: string,
): void {
  const action = take.segments(subject).find(({ name }) => name === "pickUp");
  if (action === undefined) throw new Error("The arm trace requires a pickup");
  const events = action.plan.events.map(({ name, share }) => ({
    name,
    at: share * action.plan.duration,
  }));
  const event = (name: string): number => {
    const found = events.find((row) => row.name === name);
    if (found === undefined) throw new Error("Missing pickup event " + name);
    return found.at;
  };
  const closed = event("gripClosed");
  const liftOff = event("liftOff");
  const lifted = event("lifted");
  const parent = HumanArmGeometry.parent(
    body,
    side === "left" ? "leftUpperArm" : "rightUpperArm",
  );
  if (parent === null) throw new Error("The pickup arm has no parent frame");
  const model = body.tangle;
  const times = [
    // AutoMovieMotionHumanArmCourse.grid uses at most one 30 Hz frame
    // per step, exactly subdividing each authored event interval.
    ...[0, closed, liftOff].flatMap((from, i) => {
      const to = [closed, liftOff, lifted][i]!;
      const pieces = Math.max(1, Math.ceil((to - from) * 30 - 1e-9));
      return Array.from({ length: pieces }, (_, j) => ({
        native: true,
        seconds: action.start + (from + ((to - from) * j) / pieces),
      }));
    }),
    { native: true, seconds: action.start + lifted },
    ...AutoMovieMotionHumanAuditMotion.grid(
      Math.max(0, action.start - 0.1),
      Math.min(take.duration, action.end + 0.1),
      24,
    ).map((seconds) => ({ native: false, seconds })),
  ].sort((a, b) => a.seconds - b.seconds);
  const frames = times.map(({ native, seconds }) => {
    const local = seconds - action.start;
    const bones = take.bones(subject, seconds);
    const root = bones.get(parent)!;
    const inverse = Quaternion.inverse(root.worldRotation);
    const relative = (position: IAutoMovieVector3): IAutoMovieVector3 =>
      Quaternion.rotateVector(
        inverse,
        Vector3.subtract(position, root.worldPosition),
      );
    const inParent = (
      pose: IAutoMovieRigidTransform,
    ): IAutoMovieRigidTransform => ({
      position: relative(pose.position),
      rotation: Quaternion.multiply(inverse, pose.rotation),
    });
    const placed = HumanColliders.placed(body, bones);
    const parts: IPlacedPart[] = placed.map((frame, i) => ({
      frame,
      centre: AutoMovieMotionHumanAuditTangleModel.centre(
        frame,
        model.parts[i]!,
      ),
      probes: model.parts[i]!.probes.map((point) =>
        Vector3.add(
          frame.pose.position,
          Quaternion.rotateVector(frame.pose.rotation, point),
        ),
      ),
      queries: frame.shapes.map((shape) =>
        physicalShapeSegmentDistance.prepare(frame.pose, shape),
      ),
    }));
    const pairs = parts.flatMap((a, i) =>
      parts.flatMap((b, j) => {
        if (model.arms[side][i] === model.arms[side][j] || model.related[i]![j])
          return [];
        const sphereGap =
          Vector3.distance(a.centre, b.centre) -
          model.parts[i]!.radius -
          model.parts[j]!.radius;
        if (sphereGap * 1000 > HumanArmTrajectoryPairs.CUT) return [];
        const gap = directedGap(
          a,
          b,
          AutoMovieMotionHumanAuditTangleModel.reference(model, i, j),
        );
        return gap === undefined
          ? []
          : [{ from: a.frame.bone, to: b.frame.bone, ...gap }];
      }),
    );
    const fingerPose = [...bones].flatMap(
      ([bone, frame]: [AutoMovieHumanoidBone, IAutoMovieResolvedBone]) =>
        bone.startsWith(side) && /(Thumb|Index|Middle|Ring|Little)/u.test(bone)
          ? [{ bone, rotation: frame.localRotation }]
          : [],
    );
    return {
      clock: native ? "authored" : "playback",
      seconds,
      local,
      phase:
        local < -1e-9
          ? "entry"
          : local < closed - 1e-9
            ? "reach"
            : local < liftOff - 1e-9
              ? "hold"
              : local <= lifted + 1e-9
                ? "lift"
                : "rise",
      bodyInParent: placed.flatMap(({ bone, pose }, i) =>
        model.arms[side][i] ? [] : [{ bone, ...inParent(pose) }],
      ),
      fingerPose,
      pairs,
    };
  });
  writeFileSync(
    path,
    JSON.stringify({
      subject,
      side,
      armParent: parent,
      start: action.start,
      end: action.end,
      events,
      limitMm: 1000 * AutoMovieMotionHumanAudit.LIMITS.tangle,
      pairScreenMm: HumanArmTrajectoryPairs.CUT,
      frames,
    }),
  );
}

/**
 * Choose the deepest allowed probe in one direction. Nonpenetrating ties retain
 * the closest actual signed reading.
 */
function directedGap(
  a: IPlacedPart,
  b: IPlacedPart,
  reference: Float64Array,
): IGap | undefined {
  let best: IGap | undefined;
  a.probes.forEach((point: IAutoMovieVector3, probe: number): void => {
    const allowance = reference[probe]!;
    if (!Number.isFinite(allowance)) return;
    b.queries.forEach((query, shape) => {
      const signedMm = 1000 * query(point, point);
      const referenceMm = 1000 * allowance;
      const depthMm = Math.max(0, -signedMm) - referenceMm;
      if (
        best === undefined ||
        depthMm > best.depthMm ||
        (depthMm === best.depthMm && signedMm < best.signedMm)
      )
        best = { probe, shape, signedMm, referenceMm, depthMm };
    });
  });
  return best;
}
