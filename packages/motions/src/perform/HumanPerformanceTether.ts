import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanTether,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanPerformanceGrips } from "./HumanPerformanceGrips";
import { HumanPerformanceObject } from "./HumanPerformanceObject";

/** How many points a slack line is drawn with. */
const SAMPLES: number = 16;

/** A tether found by its far prop: the declaring prop and the line. */
type IHeld = IAutoMovieMotionHumanPerformanceState.ITethered;

/**
 * The lines between props (`IAutoMovieMotionHumanTether`): where a line lies at
 * a second, and how it holds its far prop.
 *
 * A line's length is its free metres, or its metres less its rate times the
 * driving articulation's travel at that second
 * (`HumanPerformanceObject.state`), never below zero. The far prop is pulled to
 * the line's length from the near end while no hand or worn span carries it, a
 * driven line only once its articulation has paid it in; a flight pays the line
 * out, so a line long enough never pulls it and one too short stops it. Pulled,
 * it keeps its height and slides along the surface it rests on toward the near
 * end, as a lure drawn back across the water. A slack line hangs as the
 * catenary of its length between its ends (Irvine 1981, Cable Structures).
 */
export namespace HumanPerformanceTether {
  /**
   * The line as it lies at a second.
   *
   * @param self The resolved performance.
   * @param subject The prop the line runs from.
   * @param id The line's id.
   * @param seconds Film seconds.
   * @param frame Reads a prop's displayed frame.
   * @returns The ends, the length, whether taut and the drawn points.
   * @throws {HumanRefusal} For an unknown prop, line or point, or a length of
   *   no line.
   */
  export function span(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
    id: string,
    seconds: number,
    frame: (prop: string, seconds: number) => IAutoMovieRigidTransform,
  ): IAutoMovieMotionHumanTether.ISpan {
    const owner: IAutoMovieMotionHumanProp = prop(self, subject);
    const tether: IAutoMovieMotionHumanTether | undefined = owner.tethers?.find(
      (t: IAutoMovieMotionHumanTether): boolean => t.id === id,
    );
    if (tether === undefined)
      throw refuse(
        "tether",
        id,
        `the prop ${subject} declares no line named ${id}`,
      );
    const from: IAutoMovieVector3 = point(
      owner,
      tether.from,
      frame(subject, seconds),
    );
    const to: IAutoMovieVector3 = point(
      prop(self, tether.to.prop),
      tether.to.point,
      frame(tether.to.prop, seconds),
    );
    const length: number = out(self, tether, seconds);
    const taut: boolean = Vector3.distance(from, to) >= length - 1e-9;
    return {
      from,
      to,
      length,
      taut,
      points: taut ? [from, to] : hang(from, to, length),
    };
  }

  /**
   * A prop's frame held by the lines that run to it.
   *
   * @param self The resolved performance.
   * @param subject The prop.
   * @param seconds Film seconds.
   * @param rested Its frame as its carriers leave it.
   * @param frame Reads a prop's displayed frame.
   * @returns The frame, pulled to each line's length while the prop rests.
   */
  export function pull(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
    seconds: number,
    rested: IAutoMovieRigidTransform,
    frame: (prop: string, seconds: number) => IAutoMovieRigidTransform,
  ): IAutoMovieRigidTransform {
    const lines: readonly IHeld[] | undefined = self.tethered.get(subject);
    if (lines === undefined) return rested;
    // A driven line pulls only once paid in: before its articulation moves it
    // is the line let out, which a cast only pays out further. Read first, it
    // spares the near prop's frame for every read of a prop no line pulls.
    const pulling: IHeld[] = lines.filter(
      ({ tether }: IHeld): boolean =>
        tether.length.kind === "free" || paid(self, tether.length, seconds) > 0,
    );
    if (pulling.length === 0 || carried(self, subject, seconds)) return rested;
    let placed: IAutoMovieRigidTransform = rested;
    for (const { owner, tether } of pulling) {
      const length: number = out(self, tether, seconds);
      const near: IAutoMovieVector3 = point(
        owner,
        tether.from,
        frame(owner.subject, seconds),
      );
      const far: IAutoMovieVector3 = point(
        prop(self, subject),
        tether.to.point,
        placed,
      );
      if (Vector3.distance(near, far) <= length) continue;
      const rise: number = far.y - near.y;
      const across: IAutoMovieVector3 = {
        x: far.x - near.x,
        y: 0,
        z: far.z - near.z,
      };
      const reach: number = Math.sqrt(
        Math.max(0, length * length - rise * rise),
      );
      const flat: number = Math.hypot(across.x, across.z);
      const scale: number = flat > 1e-9 ? reach / flat : 0;
      const moved: IAutoMovieVector3 = {
        x: near.x + across.x * scale,
        y: far.y,
        z: near.z + across.z * scale,
      };
      placed = {
        ...placed,
        position: Vector3.add(placed.position, Vector3.subtract(moved, far)),
      };
    }
    return placed;
  }

  /**
   * How far a line is stretched past its length at a second: zero when it
   * reaches.
   *
   * @param span The line as it lies.
   * @returns Metres.
   */
  export function stretch(span: IAutoMovieMotionHumanTether.ISpan): number {
    return Math.max(0, Vector3.distance(span.from, span.to) - span.length);
  }

  /**
   * The lines by far prop, built once when the performance's props are known
   * (`IAutoMovieMotionHumanPerformanceState.tethered`).
   *
   * @param props The performance's props, by subject.
   * @returns Each far prop's lines with the prop each runs from, in prop and
   *   declaration order.
   */
  export function index(
    props: ReadonlyMap<string, IAutoMovieMotionHumanProp>,
  ): Map<string, IHeld[]> {
    const out: Map<string, IHeld[]> = new Map();
    for (const owner of props.values())
      for (const tether of owner.tethers ?? []) {
        const list: IHeld[] = out.get(tether.to.prop) ?? [];
        list.push({ owner, tether });
        out.set(tether.to.prop, list);
      }
    return out;
  }
}

/**
 * Whether a hand or a wear carries the prop at a second. A mount a launch
 * leaves is not read: a flight only pays the line out, so a line long enough
 * never pulls it, and one too short stops it.
 */
function carried(
  self: IAutoMovieMotionHumanPerformanceState,
  subject: string,
  seconds: number,
): boolean {
  return HumanPerformanceGrips(self, subject).some(
    (g: IAutoMovieMotionHumanPerformanceState.IGrip): boolean =>
      g.mount === undefined && g.from <= seconds && seconds <= g.to,
  );
}

/** The line out at a second. */
function out(
  self: IAutoMovieMotionHumanPerformanceState,
  tether: IAutoMovieMotionHumanTether,
  seconds: number,
): number {
  const length: IAutoMovieMotionHumanTether.Length = tether.length;
  const metres: number =
    length.kind === "free"
      ? length.metres
      : length.metres - length.per * paid(self, length, seconds);
  if (!(length.metres > 0))
    throw refuse(
      "tether",
      length.metres,
      `the line ${tether.id} has no line out`,
    );
  return Math.max(0, metres);
}

/**
 * A driven line's articulation travel at a second, in its own unit: zero,
 * without reading the prop's state, until an action's drive or the prop's own
 * track has begun moving it.
 */
function paid(
  self: IAutoMovieMotionHumanPerformanceState,
  length: IAutoMovieMotionHumanTether.IDriven,
  seconds: number,
): number {
  const owner: IAutoMovieMotionHumanProp = prop(self, length.articulation.prop);
  if (!begun(self, owner, length.articulation.point, seconds)) return 0;
  return (
    HumanPerformanceObject.state(self, owner, seconds)[
      length.articulation.point
    ] ?? 0
  );
}

/** Whether a drive or a track on a prop's articulation starts by a second. */
function begun(
  self: IAutoMovieMotionHumanPerformanceState,
  owner: IAutoMovieMotionHumanProp,
  articulation: string,
  seconds: number,
): boolean {
  if (
    (owner.tracks ?? []).some(
      (track: IAutoMovieMotionHumanProp.ITrack): boolean =>
        track.articulation === articulation,
    )
  )
    return true;
  for (const person of self.people.values())
    for (const segment of [...person.segments, ...person.overlays])
      for (const drive of segment.plan.drives ?? [])
        if (
          drive.prop === owner.subject &&
          drive.articulation === articulation &&
          segment.start + drive.from * segment.plan.duration <= seconds
        )
          return true;
  return false;
}

/** A prop's named point in the world. */
function point(
  owner: IAutoMovieMotionHumanProp,
  id: string,
  frame: IAutoMovieRigidTransform,
): IAutoMovieVector3 {
  const site: IAutoMovieAffordance | undefined = owner.affordances?.find(
    (a: IAutoMovieAffordance): boolean => a.id === id,
  );
  if (site === undefined)
    throw refuse(
      "tether",
      id,
      `the prop ${owner.subject} declares no point named ${id}`,
    );
  return Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, site.frame.translation),
  );
}

/** A declared prop, or a refusal. */
function prop(
  self: IAutoMovieMotionHumanPerformanceState,
  subject: string,
): IAutoMovieMotionHumanProp {
  const found: IAutoMovieMotionHumanProp | undefined = self.props.get(subject);
  if (found === undefined)
    throw refuse("tether", subject, `no prop is named ${subject}`);
  return found;
}

/**
 * The catenary of a length between two points, sampled from the first to the
 * second.
 */
function hang(
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
  length: number,
): IAutoMovieVector3[] {
  const across: IAutoMovieVector3 = {
    x: to.x - from.x,
    y: 0,
    z: to.z - from.z,
  };
  const h: number = Math.hypot(across.x, across.z);
  const v: number = to.y - from.y;
  // Hanging straight down from the higher end when the ends share a vertical.
  if (h < 1e-6) {
    const low: number = Math.min(from.y, to.y) - (length - Math.abs(v)) / 2;
    return [from, { x: from.x, y: low, z: from.z }, to];
  }
  // Solve 2a sinh(h / 2a) = sqrt(L² - v²) for a by Newton's method on b = h / 2a.
  const target: number = Math.sqrt(length * length - v * v) / h;
  let b: number = Math.sqrt(6 * (target - 1));
  for (let i: number = 0; i < 30; ++i) {
    const f: number = Math.sinh(b) / b - target;
    const df: number = (Math.cosh(b) * b - Math.sinh(b)) / (b * b);
    const next: number = b - f / df;
    if (Math.abs(next - b) < 1e-12) break;
    b = next > 0 ? next : b / 2;
  }
  const a: number = h / (2 * b);
  const x0: number = h / 2 - a * Math.atanh(v / length);
  const y: (x: number) => number = (x: number): number =>
    a * (Math.cosh((x - x0) / a) - Math.cosh(-x0 / a));
  const unit: IAutoMovieVector3 = { x: across.x / h, y: 0, z: across.z / h };
  return Array.from(
    { length: SAMPLES + 1 },
    (_v: unknown, k: number): IAutoMovieVector3 => {
      const x: number = (h * k) / SAMPLES;
      return {
        x: from.x + unit.x * x,
        y: from.y + y(x),
        z: from.z + unit.z * x,
      };
    },
  );
}
/** The alternatives of `RefuseValue`'s site. */
type RefuseValue = string | number;

/** A tether refusal. */
function refuse(
  axis: string,
  value: RefuseValue,
  reason: string,
): HumanRefusal {
  return new HumanRefusal({
    kind: "parameter",
    axis,
    value,
    reason,
    fix: "declare the line between existing props' points with line out",
  });
}
