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
  IAutoMovieMotionHumanRopeSkipPresentation,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";

/** Match the displayed-action seam precision in HumanSegmentPose. */
const SEAM_SECONDS: number = 1e-12;

/**
 * Drive a visible rope on the clock of a placed two-foot skip.
 *
 * The central cable runs transversely and revolves over the neutral body
 * height and below the foot station. The two side legs complete a four-point
 * cable of the specified length. Its orbit starts overhead and reaches
 * the bottom at the action's airborne underpass. If needed, the rope waits
 * at the overhead position so its entire passage fits within the flight.
 * Each handle swivels around the displayed grasp with its local +Z tip
 * pointing down the outgoing cord.
 * A film host poses its two barrels and supplies the unindexed cord to the
 * existing soft-prop draw binding. This is a derived staging curve.
 *
 * @returns A seekable film-time sampler, undefined outside the surviving action.
 * @throws {HumanRefusal} For invalid dimensions, an incompatible action, or a rope that cannot span the sampled pose above the floor.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the active clock, handle axes, cord length, staging status and host ownership.
 * @evidence contracts/development/implementation.md#principled-implementation The circle's sagitta bounds the cable's rise over the sole footprint and the flight parabola bounds its angular passage. Projection onto the grasp chord's bisector gives two equal side legs. Squaring the length equation gives the central width and the handle tips shorten the side legs by their half lengths.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Reads the opening stance and action clock once. Each draw reads one displayed bone map to place both handles, fits the cable once and checks the underpass against both actual feet.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An inadmissible cable or obstructed underpass is refused. The actor's grasp, cord length and action clock are preserved.
 * @evidence contracts/development/implementation.md#efficient-algorithms Preparation scans the performer's segments and the action's events. Sampling uses one displayed pose, four cable vertices and each foot's fixed sole outline.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Both handles and the clearance witnesses use the same displayed bone sample. The winding and stance geometry are prepared once for this action.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the borrowed performance, the selected action bounds and a fixed size geometric setup. Each returned frame owns plain data and no native resources.
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
  } = input;
  if (
    ![length, radius, handleLength].every(
      (metres: number): boolean => Number.isFinite(metres) && metres > 0,
    ) ||
    typeof subject !== "string" ||
    subject.trim().length === 0
  )
    throw new HumanRefusal({
      kind: "parameter",
      axis: "rope",
      value: { subject, length, radius, handleLength },
      reason:
        "a skipping rope needs an identity and positive finite dimensions",
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
  const next: IAutoMovieMotionHumanSegment | undefined = segments.find(
    (part: IAutoMovieMotionHumanSegment): boolean =>
      part.entry > segment.entry &&
      Math.abs(part.entryTime - segment.end) <= SEAM_SECONDS,
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
  const combinedLength: number = length + handleLength;

  return (
    seconds: number,
  ): IAutoMovieMotionHumanRopeSkipPresentation.IFrame | undefined => {
    if (
      !Number.isFinite(seconds) ||
      seconds + SEAM_SECONDS < segment.entryTime ||
      seconds > segment.end ||
      (next !== undefined && next.entryTime <= seconds + SEAM_SECONDS)
    )
      return undefined;
    const bones: ReturnType<typeof performance.bones> = performance.bones(
      performer,
      seconds,
    );
    const l: IAutoMovieVector3 = HumanHand.frame(
      body,
      bones,
      "left",
      "grip",
    ).point;
    const r: IAutoMovieVector3 = HumanHand.frame(
      body,
      bones,
      "right",
      "grip",
    ).point;
    const chord: IAutoMovieVector3 = Vector3.subtract(l, r);
    const span: number = Vector3.length(chord);
    if (!(span > 0 && combinedLength > span && Vector3.dot(chord, left) > 0))
      refuse(subject, seconds, "the cable cannot span the two grasps");
    const axis: IAutoMovieVector3 = Vector3.scale(chord, 1 / span);
    const mid: IAutoMovieVector3 = Vector3.lerp(l, r, 0.5);
    const angle: number =
      Math.PI *
      (1 +
        Math.max(
          -1,
          Math.min(
            1,
            (seconds - under) / (seconds <= under ? frontHalf : rearHalf),
          ),
        ));
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

    // L = w + sqrt((w - d)^2 + 4 r^2), where d is the grasp chord and r
    // the perpendicular offset. Including the two handle halves lets the
    // cable leave each tip along its barrel while preserving the cable length.
    const width: number =
      (combinedLength + span) / 2 -
      (2 * Vector3.dot(offset, offset)) / (combinedLength - span);
    if (!(Number.isFinite(width) && width >= span))
      refuse(subject, seconds, "the cable is too short for the visible orbit");
    const half: IAutoMovieVector3 = Vector3.scale(axis, width / 2);
    const a: IAutoMovieVector3 = Vector3.add(crossbar, half);
    const b: IAutoMovieVector3 = Vector3.subtract(crossbar, half);
    const leg: number = (combinedLength - width) / 2;
    if (!(leg > halfHandle))
      refuse(
        subject,
        seconds,
        "the side legs do not extend beyond the barrels",
      );
    const leftExit: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(a, l),
    );
    const rightExit: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(b, r),
    );
    const leftTip: IAutoMovieVector3 = Vector3.add(
      l,
      Vector3.scale(leftExit, halfHandle),
    );
    const rightTip: IAutoMovieVector3 = Vector3.add(
      r,
      Vector3.scale(rightExit, halfHandle),
    );
    if (Math.min(leftTip.y, a.y, b.y, rightTip.y) < floor + radius)
      refuse(subject, seconds, "the cord would penetrate the floor");

    // A projected sole box conservatively bounds every outline corner. Check
    // the height only on each cord segment's overlap with that footprint.
    const path: readonly IAutoMovieVector3[] = [leftTip, a, b, rightTip];
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
        if (clip(aZ, bZ, minZ, maxZ) !== null && (bX > minX || aX < maxX))
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
        left: handle(l, leftExit),
        right: handle(r, rightExit),
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

/** Aim the circular barrel's +Z axis along its outgoing cord segment. */
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
