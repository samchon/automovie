import {
  AutoMovieGravity,
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanRopeSkipPresentation,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanFoot } from "../../posture/HumanFoot";
import { HumanFrame } from "../../posture/HumanFrame";
import { HumanHand } from "../../posture/HumanHand";

/** Match the displayed-action seam precision in HumanSegmentPose. */
const SEAM_SECONDS: number = 1e-12;

/** The 50 mm reference grip in resolveAutoMovieHumanoidSurfaces, in metres. */
const REFERENCE_GRIP_RADIUS: number = 0.025;

/** The measured 7/8-inch barrel used by the standard rope archetype, in metres. */
const DEFAULT_HANDLE_DIAMETER: number = (7 / 8) * 0.0254;

/**
 * Drive a visible rope on the clock of a placed two-foot skip.
 *
 * The central cable runs transversely and revolves over the neutral body height
 * and below the foot station. The two side legs complete a four-point cable of
 * the specified length. Its orbit starts overhead and reaches the bottom at the
 * action's airborne underpass. If needed, the rope waits at the overhead
 * position so its entire passage fits within the flight. Each handle follows
 * the displayed grasp's wrapped axis, with its local +Z end on the thumb side.
 * The cable can flex where it joins that end. A film host poses its two barrels
 * and supplies the unindexed cord to the existing soft-prop draw binding. This
 * is a derived staging curve.
 *
 * @returns A seekable film-time sampler, undefined outside the surviving
 *   action.
 * @throws {HumanRefusal} For invalid dimensions, an incompatible action, or a
 *   rope that cannot span the sampled pose above the floor.
 */
export function prepareRopeSkip(
  input: IAutoMovieMotionHumanRopeSkipPresentation,
): (
  seconds: number,
) => IAutoMovieMotionHumanRopeSkipPresentation.IFrame | undefined {
  const {
    performance,
    performer,
    action,
    subject,
    length,
    radius,
    handleLength,
    handleDiameter = DEFAULT_HANDLE_DIAMETER,
  } = input;
  if (
    ![length, radius, handleLength, handleDiameter].every(
      (metres: number): boolean => metres > 0,
    )
  )
    throw new HumanRefusal({
      kind: "parameter",
      axis: "rope",
      value: { subject, length, radius, handleLength, handleDiameter },
      reason:
        "a skipping rope needs positive finite dimensions",
      fix: "supply the measured cord and handle dimensions in metres",
    });

  const segments: readonly IAutoMovieMotionHumanSegment[] =
    performance.segments(performer);
  const matches: IAutoMovieMotionHumanSegment[] = segments.filter(
    (part: IAutoMovieMotionHumanSegment): boolean =>
      part.id === action && part.name === "ropeSkip",
  );
  const segment: IAutoMovieMotionHumanSegment | undefined =
    matches.length === 1 ? matches[0] : undefined;
  const phases: ReadonlyMap<string, number> = new Map(
    segment?.plan.events.map((event): [string, number] => [
      event.name,
      event.share,
    ]),
  );
  const lift: number = phases.get("takeoff") ?? NaN;
  const pass: number = phases.get("ropeUnder") ?? NaN;
  const land: number = phases.get("landed") ?? NaN;
  if (
    segment === undefined ||
    !(0 <= lift && lift < pass && pass < land && land <= 1)
  )
    throw new HumanRefusal({
      kind: "parameter",
      axis: "action",
      value: action,
      reason: "the rope needs one anchored skip with an airborne underpass",
      fix: "place and anchor a ropeSkip action for this performer",
    });

  const { body, entry } = segment.context;
  const yaw: number = entry.posture.yaw;
  const forward: IAutoMovieVector3 = HumanFrame.forward(yaw);
  const left: IAutoMovieVector3 = HumanFrame.forward(yaw + 90);
  const sides: readonly AutoMovieHumanSide[] = ["left", "right"];
  const outlines = sides.map((side) => ({
    side,
    frames: HumanFoot.outline(body, side),
  }));
  const opened: ReturnType<typeof performance.bones> = performance.bones(
    performer,
    segment.entryTime,
  );
  const soles: IAutoMovieVector3[] = outlines.flatMap(({ frames }) =>
    solePoints(frames, opened),
  );
  const floor: number = Math.min(
    ...sides.flatMap((side) =>
      HumanFoot.sockets(body, opened, side).map((socket) => socket.point.y),
    ),
  );
  const outlineDrop: number = Math.max(
    0,
    floor - Math.min(...soles.map((point) => point.y)),
  );
  const footStation: IAutoMovieVector3 = Vector3.scale(
    soles.reduce((sum, point) => Vector3.add(sum, point)),
    1 / soles.length,
  );
  const orbit: number = body.measure.stature / 2;
  const under: number = segment.start + pass * segment.plan.duration;
  const finish: number = segment.start + segment.plan.duration;
  const handoff: number = segments.reduce(
    (next: number, part: IAutoMovieMotionHumanSegment): number =>
      part.entry > segment.entry && part.entryTime >= segment.entryTime
        ? Math.min(next, part.entryTime)
        : next,
    Infinity,
  );

  // Bound when the circular span overlaps the sole in the sagittal plane.
  // Its maximum rise there is the sagitta. Reserve a cable radius of clearance
  // on top of the gap already left below and above the cable centre.
  const depth: number =
    Math.max(
      ...soles.map((point) =>
        Math.abs(Vector3.dot(Vector3.subtract(point, footStation), forward)),
      ),
    ) + radius;
  const sagitta: number = orbit - Math.sqrt(orbit ** 2 - depth ** 2);
  const flight: number = (land - lift) * segment.plan.duration;
  const g: number = AutoMovieGravity.STANDARD;
  const safeHalfWindow: number = Math.sqrt(
    (flight / 2) ** 2 - (2 * (4 * radius + sagitta + outlineDrop)) / g,
  );
  if (!(depth < orbit && safeHalfWindow > 0))
    refuse(subject, under, "the hop cannot clear the cable across the soles");
  const maximumHalfTurn: number =
    (Math.PI * safeHalfWindow) / Math.asin(depth / orbit);
  const frontHalf: number = Math.min(under - segment.start, maximumHalfTurn);
  const rearHalf: number = Math.min(finish - under, maximumHalfTurn);
  const halfHandle: number = handleLength / 2;
  const gripOffset: number = handleDiameter / 2 - REFERENCE_GRIP_RADIUS;
  const frontWaits: boolean = frontHalf < under - segment.start;
  const rearWaits: boolean = rearHalf < finish - under;

  const sample = (
    seconds: number,
  ): IAutoMovieMotionHumanRopeSkipPresentation.IFrame | undefined => {
    if (
      seconds + SEAM_SECONDS < segment.entryTime ||
      seconds > segment.end ||
      handoff <= seconds + SEAM_SECONDS
    )
      return undefined;
    const bones: ReturnType<typeof performance.bones> = performance.bones(
      performer,
      seconds,
    );
    const leftGrip: IAutoMovieMotionHumanHand.IFrame = HumanHand.frame(
      body,
      bones,
      "left",
      "grip",
    );
    const rightGrip: IAutoMovieMotionHumanHand.IFrame = HumanHand.frame(
      body,
      bones,
      "right",
      "grip",
    );
    const leftHandle: IAutoMovieVector3 = Vector3.add(
      leftGrip.point,
      Vector3.scale(leftGrip.normal, gripOffset),
    );
    const rightHandle: IAutoMovieVector3 = Vector3.add(
      rightGrip.point,
      Vector3.scale(rightGrip.normal, gripOffset),
    );
    const l: IAutoMovieVector3 = Vector3.add(
      leftHandle,
      Vector3.scale(leftGrip.forward, halfHandle),
    );
    const r: IAutoMovieVector3 = Vector3.add(
      rightHandle,
      Vector3.scale(rightGrip.forward, halfHandle),
    );
    const chord: IAutoMovieVector3 = Vector3.subtract(l, r);
    const span: number = Vector3.length(chord);
    if (!(span > 0 && length > span && Vector3.dot(chord, left) > 0))
      refuse(subject, seconds, "the cable cannot span the two handle tips");
    const axis: IAutoMovieVector3 = Vector3.scale(chord, 1 / span);
    const mid: IAutoMovieVector3 = Vector3.lerp(l, r, 0.5);
    const before: boolean = seconds <= under;
    const u: number = Math.max(
      0,
      1 - Math.abs(seconds - under) / (before ? frontHalf : rearHalf),
    );
    // For a held overhead phase, match zero speed at u=0 and the linear
    // speed at u=1. The cubic u²(2-u) delays passage toward the soles.
    const progress: number = (before ? frontWaits : rearWaits)
      ? u * u * (2 - u)
      : u;
    const angle: number = Math.PI * (before ? progress : 2 - progress);
    const center: IAutoMovieVector3 = Vector3.add(
      { ...footStation, y: floor + 2 * radius + orbit * (1 + Math.cos(angle)) },
      Vector3.scale(forward, orbit * Math.sin(angle)),
    );
    const fromMid: IAutoMovieVector3 = Vector3.subtract(center, mid);
    const offset: IAutoMovieVector3 = Vector3.subtract(
      fromMid,
      Vector3.scale(axis, Vector3.dot(fromMid, axis)),
    );
    const crossbar: IAutoMovieVector3 = Vector3.add(mid, offset);

    // L = w + sqrt((w - d)^2 + 4 r^2), where d joins the handle tips
    // and r is the perpendicular offset. The cable can bend at a tip.
    const width: number =
      (length + span) / 2 - (2 * Vector3.dot(offset, offset)) / (length - span);
    if (!(width > 0))
      refuse(subject, seconds, "the cable is too short for the visible orbit");
    const half: IAutoMovieVector3 = Vector3.scale(axis, width / 2);
    const a: IAutoMovieVector3 = Vector3.add(crossbar, half);
    const b: IAutoMovieVector3 = Vector3.subtract(crossbar, half);
    if (Math.min(l.y, a.y, b.y, r.y) < floor + radius)
      refuse(subject, seconds, "the cord would penetrate the floor");

    // A projected sole box conservatively bounds every outline corner. Check
    // the height only on each cord segment's overlap with that footprint.
    const path: readonly IAutoMovieVector3[] = [l, a, b, r];
    if (Math.cos(angle) < 0) {
      const aX: number = Vector3.dot(a, left);
      const bX: number = Vector3.dot(b, left);
      const aZ: number = Vector3.dot(a, forward);
      const bZ: number = Vector3.dot(b, forward);
      for (const { side, frames } of outlines) {
        const foot: IAutoMovieVector3[] = solePoints(frames, bones);
        const along: number[] = foot.map((point) =>
          Vector3.dot(point, forward),
        );
        const across: number[] = foot.map((point) => Vector3.dot(point, left));
        const low: number = Math.min(...foot.map((point) => point.y));
        const minZ: number = Math.min(...along) - radius;
        const maxZ: number = Math.max(...along) + radius;
        const minX: number = Math.min(...across) - radius;
        const maxX: number = Math.max(...across) + radius;
        const crossing: readonly [number, number] | null = clip(
          bZ,
          aZ,
          minZ + radius,
          maxZ - radius,
        );
        const spanning: boolean = bX <= minX && aX >= maxX;
        if (
          Math.abs(seconds - under) <= SEAM_SECONDS &&
          (crossing === null ||
            !spanning ||
            bX + (aX - bX) * crossing[0] > maxX ||
            bX + (aX - bX) * crossing[1] < minX)
        )
          refuse(
            subject,
            seconds,
            `the central cord misses the ${side} underpass`,
          );
        if (clip(aZ, bZ, minZ, maxZ) !== null && !spanning)
          refuse(
            subject,
            seconds,
            `the central cord does not span the ${side} sole`,
          );
        for (let i: number = 1; i < path.length; i++) {
          const start: IAutoMovieVector3 = path[i - 1]!;
          const end: IAutoMovieVector3 = path[i]!;
          const z: readonly [number, number] | null = clip(
            Vector3.dot(start, forward),
            Vector3.dot(end, forward),
            minZ,
            maxZ,
          );
          const x: readonly [number, number] | null = clip(
            Vector3.dot(start, left),
            Vector3.dot(end, left),
            minX,
            maxX,
          );
          if (x === null || z === null) continue;
          const from: number = Math.max(x[0], z[0]);
          const to: number = Math.min(x[1], z[1]);
          if (
            from <= to &&
            Math.max(
              start.y + (end.y - start.y) * from,
              start.y + (end.y - start.y) * to,
            ) +
              radius >=
              low
          )
            refuse(
              subject,
              seconds,
              `the cord cannot pass below the ${side} sole`,
            );
        }
      }
    }

    return {
      handles: {
        left: handle(leftHandle, leftGrip.forward),
        right: handle(rightHandle, rightGrip.forward),
      },
      cord: {
        subject,
        status: "derived",
        cordRadius: radius,
        surface: {
          domain: subject,
          step: 0,
          bounds: null,
          mesh: {
            positions: path.flatMap((point) => [point.x, point.y, point.z]),
            indices: null,
            normals: null,
            uvs: null,
            skin: null,
          },
        },
      },
    };
  };

  // Validate the decisive sample even when the host's frame grid skips it.
  // A trimmed turn that never enters the underpass has no such obligation.
  sample(under);
  return sample;
}

/** Project the sole's cited perimeter frames with the actual foot and toe bones. */
function solePoints(
  outline: readonly IAutoMovieHumanoidSurfaces.IFrame[],
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
): IAutoMovieVector3[] {
  return outline.map(
    (frame) =>
      resolveAutoMovieHumanoidSurfaces.place(frame, bones.get(frame.bone)!)
        .point,
  );
}

/** Clip one coordinate of a segment to a closed interval of its parameter. */
function clip(
  a: number,
  b: number,
  low: number,
  high: number,
): readonly [number, number] | null {
  if (a === b) return low <= a && a <= high ? [0, 1] : null;
  const enter: number = (low - a) / (b - a);
  const exit: number = (high - a) / (b - a);
  const from: number = Math.max(0, Math.min(enter, exit));
  const to: number = Math.min(1, Math.max(enter, exit));
  return from <= to ? [from, to] : null;
}

/** Aim the circular barrel's +Z axis along the displayed grasp's wrapped axis. */
function handle(
  position: IAutoMovieVector3,
  exit: IAutoMovieVector3,
): IAutoMovieRigidTransform {
  return {
    position,
    rotation:
      exit.x === 0 && exit.y === 0 && exit.z < 0
        ? { x: 1, y: 0, z: 0, w: 0 }
        : Quaternion.normalize({ x: -exit.y, y: exit.x, z: 0, w: 1 + exit.z }),
  };
}

/** Report an infeasible emitted cable or a missed underpass on the film clock. */
function refuse(subject: string, seconds: number, reason: string): never {
  throw new HumanRefusal({
    kind: "reach",
    axis: "rope",
    value: { subject, seconds },
    reason,
    fix: "fit the cable to the performer and give both soles clearance",
  });
}
