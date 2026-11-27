import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanTether,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanPerformanceGrips } from "./HumanPerformanceGrips";
import { HumanPerformanceObject } from "./HumanPerformanceObject";
import { humanTetherCatenary } from "./humanTetherCatenary";
import { humanTetherReach } from "./humanTetherReach";

/*
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
  /*
   * The line as it lies at a second.
   * Parameter self: The resolved performance.
   * Parameter subject: The prop the line runs from.
   * Parameter id: The line's id.
   * Parameter seconds: Film seconds.
   * Parameter frame: Reads a prop's displayed frame.
   * Returns: The ends, the length, whether taut and the drawn points.
   * For an unknown prop, line or point, or a length of
   * no line.
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
      points: taut ? [from, to] : humanTetherCatenary(from, to, length),
    };
  }

  /*
   * A prop's frame held by the lines that run to it.
   * Parameter self: The resolved performance.
   * Parameter subject: The prop.
   * Parameter seconds: Film seconds.
   * Parameter rested: Its frame as its carriers leave it.
   * Parameter frame: Reads a prop's displayed frame.
   * Returns: The frame, pulled to each line's length while the prop rests.
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
      const moved: IAutoMovieVector3 = humanTetherReach(near, far, length);
      placed = {
        ...placed,
        position: Vector3.add(placed.position, Vector3.subtract(moved, far)),
      };
    }
    return placed;
  }

  /*
   * How far a line is stretched past its length at a second: zero when it
   * reaches.
   * Parameter span: The line as it lies.
   * Returns: Metres.
   */
  export function stretch(span: IAutoMovieMotionHumanTether.ISpan): number {
    return Math.max(0, Vector3.distance(span.from, span.to) - span.length);
  }

  /*
   * The lines by far prop, built once when the performance's props are known
   * (`IAutoMovieMotionHumanPerformanceState.tethered`).
   * Parameter props: The performance's props, by subject.
   * Returns: Each far prop's lines with the prop each runs from, in prop and
   * declaration order.
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

/*
 * A tether found by its far prop: the declaring prop and the line.
 */
type IHeld = IAutoMovieMotionHumanPerformanceState.ITethered;

/*
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

/*
 * The line out at a second.
 */
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

/*
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

/*
 * Whether a drive or a track on a prop's articulation starts by a second.
 */
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

/*
 * A prop's named point in the world.
 */
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

/*
 * A declared prop, or a refusal.
 */
function prop(
  self: IAutoMovieMotionHumanPerformanceState,
  subject: string,
): IAutoMovieMotionHumanProp {
  const found: IAutoMovieMotionHumanProp | undefined = self.props.get(subject);
  if (found === undefined)
    throw refuse("tether", subject, `no prop is named ${subject}`);
  return found;
}

type RefuseValue = string | number;

/*
 * A tether refusal.
 */
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
