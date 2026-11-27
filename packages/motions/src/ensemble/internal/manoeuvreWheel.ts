import type {
  IAutoMovieMotionHumanEnsemble,
  IAutoMovieMotionHumanFormation,
  IAutoMovieMotionHumanManoeuvre,
  IAutoMovieMotionHumanManoeuvreWheel,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanFormation } from "./HumanFormation";

/**
 * A wheel on a fixed pivot: the formation turned rigidly about its pivot flank,
 * so the line stays straight as it wheels. In the drill books one flank stands
 * fast while the rest moves round it; "the outward wheeling man always
 * lengthens his step to 33 inches" from the ordinary 30, and every other man
 * shortens his step "in proportion as he is nearer to the standing flank on
 * which the wheel is made" (Rules and Regulations for the Formations and
 * Movements of the Militia of Lower-Canada, c. 1814, after Dundas 1792).
 *
 * The wheeling frame is a course standing on the pivot, the `from` formation's
 * blocks moved so each slot stands where it stood at the word, its heading
 * turning and sampled every `HumanFormation.SAMPLE` seconds: a frame that only
 * turns carries every slot round the pivot exactly between samples. Its angular
 * speed is the slowest member's travel speed lengthened by `LENGTHENED`, over
 * the outward radius, so the outward man takes the lengthened step and nobody a
 * longer one; it gathers and sheds that speed at `HumanFormation.ACCELERATION`
 * over the same radius. Each member keeps its own slot of the wheeling
 * formation as a station, so at a called cadence its steps shorten with its
 * radius (`walkStation.cadenced`) and the pivot turns on its own ground. Its
 * way on paper is the arc its slot draws, a point every `ARC` degrees.
 *
 * @param ensemble The ensemble, its member `i` standing in slot
 *   `members[i].index` of `from`.
 * @param manoeuvre The wheel.
 * @param starts Where each stands at the word.
 * @param ends Each one's slot in `to`.
 * @param speeds Each one's travel speed, m/s.
 * @param column `from`, prepared (`HumanFormation.prepare`).
 * @param line `to`, prepared.
 * @returns Each member's way and station; no stations when nothing turns.
 * @throws {HumanRefusal} When `to` is not `from` turned about the pivot, naming
 *   the member whose slot lies elsewhere and how far.
 */
export function manoeuvreWheel(
  ensemble: IAutoMovieMotionHumanEnsemble.IEnsemble,
  manoeuvre: IAutoMovieMotionHumanManoeuvre,
  starts: readonly IAutoMovieVector3[],
  ends: readonly IAutoMovieMotionHumanFormation.ISlot[],
  speeds: readonly number[],
  column: HumanFormation.IPrepared,
  line: HumanFormation.IPrepared,
): IAutoMovieMotionHumanManoeuvreWheel.IWheel {
  const members: readonly IAutoMovieMotionHumanEnsemble.IMember[] =
    ensemble.members;
  const pivot: IAutoMovieVector3 = pivotOf(manoeuvre, members, starts);
  const origin: IAutoMovieMotionHumanFormation.IFrameResult = column.frame(
    manoeuvre.at,
  );
  const target: number = line.frame(manoeuvre.at).heading;
  const sweep: number =
    ((((target - origin.heading + 180) % 360) + 360) % 360) - 180;

  // `to` must be `from` turned about the pivot.
  starts.forEach((s: IAutoMovieVector3, i: number): void => {
    const turned: IAutoMovieVector3 = turn(pivot, s, sweep);
    const off: number = Math.hypot(
      turned.x - ends[i]!.at.x,
      turned.z - ends[i]!.at.z,
    );
    if (off > manoeuvreWheel.FIT)
      throw new HumanRefusal({
        kind: "participant",
        performer: members[i]!.subject,
        axis: `${ensemble.input.id}.manoeuvre`,
        value: off,
        reason: `a wheel turns the formation about its pivot by ${sweep.toFixed(1)} degrees, and ${members[i]!.subject}'s slot in the target lies ${off.toFixed(3)} m from where the turn takes it`,
        fix: "give the wheel the formation turned about its pivot, or use another drill for a change of shape",
      });
  });
  const ways: IAutoMovieVector3[][] = starts.map(
    (s: IAutoMovieVector3, i: number): IAutoMovieVector3[] =>
      arc(pivot, s, ends[i]!.at),
  );
  const outward: number = Math.max(
    0,
    ...starts.map((s: IAutoMovieVector3): number =>
      Math.hypot(s.x - pivot.x, s.z - pivot.z),
    ),
  );
  const whole: number = (Math.abs(sweep) * Math.PI) / 180;
  if (outward < 1e-6 || whole < 1e-9 || speeds.length === 0)
    return { ways, stations: null };

  // The angular profile: gathered and shed at the outward man's acceleration, cruising at his lengthened step.
  const fastest: number =
    (manoeuvreWheel.LENGTHENED * Math.min(...speeds)) / outward;
  const gather: number = HumanFormation.ACCELERATION / outward;
  const ramp: number = Math.min(fastest / gather, Math.sqrt(whole / gather));
  const peak: number = gather * ramp;
  const total: number = 2 * ramp + (whole - gather * ramp * ramp) / peak;
  const angle = (t: number): number =>
    t <= 0
      ? 0
      : t >= total
        ? whole
        : t < ramp
          ? 0.5 * gather * t * t
          : t <= total - ramp
            ? 0.5 * gather * ramp * ramp + peak * (t - ramp)
            : whole - 0.5 * gather * (total - t) ** 2;

  // The frame's origin moved to the pivot, the blocks' offsets moved by as much, so the frame only turns: its heading read between samples turns every slot about the pivot exactly.
  const radians: number = (origin.heading * Math.PI) / 180;
  const ox: number = pivot.x - origin.at.x;
  const oz: number = pivot.z - origin.at.z;
  const lateral: number = -ox * Math.cos(radians) + oz * Math.sin(radians);
  const depth: number = -ox * Math.sin(radians) - oz * Math.cos(radians);
  const sign: number = Math.sign(sweep);
  const count: number = Math.max(
    1,
    Math.ceil(total / HumanFormation.SAMPLE - 1e-9),
  );
  const samples: IAutoMovieMotionHumanFormation.ISample[] = [];
  for (let k: number = 0; k <= count; ++k) {
    const t: number = Math.min(total, k * HumanFormation.SAMPLE);
    samples.push({
      seconds: manoeuvre.at + t,
      x: pivot.x,
      y: 0,
      z: pivot.z,
      heading: origin.heading + (sign * angle(t) * 180) / Math.PI,
    });
  }
  const formation: IAutoMovieMotionHumanFormation = {
    blocks: manoeuvre.from.blocks.map(
      (
        b: IAutoMovieMotionHumanFormation.IBlock,
      ): IAutoMovieMotionHumanFormation.IBlock => ({
        ...b,
        offset: {
          lateral: (b.offset?.lateral ?? 0) - lateral,
          depth: (b.offset?.depth ?? 0) - depth,
        },
      }),
    ),
    frame: { kind: "course", samples },
  };
  return {
    ways,
    stations: members.map(
      (
        m: IAutoMovieMotionHumanEnsemble.IMember,
      ): IAutoMovieMotionHumanFormation.IStation => ({
        formation,
        slot: m.index,
        until: manoeuvre.at + total,
      }),
    ),
  };
}

/** Constants and types of {@link manoeuvreWheel}. */
export namespace manoeuvreWheel {
  /**
   * The outward man's lengthened step over the ordinary one: 33 inches over 30
   * (Rules and Regulations for the Formations and Movements of the Militia of
   * Lower-Canada, c. 1814, after Dundas 1792).
   */
  export const LENGTHENED: number = 33 / 30;

  /**
   * Metres a target slot may lie from the turned one: a millimetre, the
   * rounding of a laid slot, so only a formation of another shape is refused.
   */
  export const FIT: number = 1e-3;

  /** Degrees between two points of a wheeling member's arc. */
  export const ARC: number = 10;
}

/** Turn a point about a pivot by degrees about +Y, as a heading turns. */
function turn(
  pivot: IAutoMovieVector3,
  p: IAutoMovieVector3,
  degrees: number,
): IAutoMovieVector3 {
  const radians: number = (degrees * Math.PI) / 180;
  const dx: number = p.x - pivot.x;
  const dz: number = p.z - pivot.z;
  return {
    x: pivot.x + dx * Math.cos(radians) + dz * Math.sin(radians),
    y: 0,
    z: pivot.z - dx * Math.sin(radians) + dz * Math.cos(radians),
  };
}
/** The alternatives of `PivotOfSide`'s site. */
type PivotOfSide = "left" | "right" | "centre";

/**
 * The wheel's pivot: the front rank's left or right file, or its centre, where
 * the members stand at the word.
 */
function pivotOf(
  manoeuvre: IAutoMovieMotionHumanManoeuvre,
  members: readonly IAutoMovieMotionHumanEnsemble.IMember[],
  starts: readonly IAutoMovieVector3[],
): IAutoMovieVector3 {
  const front: number[] = members
    .map(
      (
        m: IAutoMovieMotionHumanEnsemble.IMember,
        i: number,
      ): [number, IAutoMovieMotionHumanFormation.ILocal] => [
        i,
        HumanFormation.local(manoeuvre.from, m.index),
      ],
    )
    .filter(
      (e: [number, IAutoMovieMotionHumanFormation.ILocal]): boolean =>
        e[1].rank === 0 && e[1].block === 0,
    )
    .sort(
      (
        a: [number, IAutoMovieMotionHumanFormation.ILocal],
        b: [number, IAutoMovieMotionHumanFormation.ILocal],
      ): number => a[1].file - b[1].file,
    )
    .map((e: [number, IAutoMovieMotionHumanFormation.ILocal]): number => e[0]);
  if (front.length === 0) return starts[0] ?? { x: 0, y: 0, z: 0 };
  const side: PivotOfSide = manoeuvre.pivot ?? "left";
  if (side === "centre") {
    const n: number = front.length;
    return {
      x:
        front.reduce((s: number, i: number): number => s + starts[i]!.x, 0) / n,
      y: 0,
      z:
        front.reduce((s: number, i: number): number => s + starts[i]!.z, 0) / n,
    };
  }
  // The layout's files run from the frame's left (file 0) to its right.
  return starts[side === "left" ? front[0]! : front[front.length - 1]!]!;
}

/**
 * A way about a pivot from one point to another: the radius and the angle each
 * changed evenly, a point every `ARC` degrees.
 */
function arc(
  centre: IAutoMovieVector3,
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
): IAutoMovieVector3[] {
  const r0: number = Math.hypot(from.x - centre.x, from.z - centre.z);
  const r1: number = Math.hypot(to.x - centre.x, to.z - centre.z);
  if (r0 < 1e-6 || r1 < 1e-6) return [from, to];
  const a0: number = Math.atan2(from.x - centre.x, from.z - centre.z);
  const a1: number = Math.atan2(to.x - centre.x, to.z - centre.z);
  const sweep: number =
    ((((a1 - a0 + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) -
    Math.PI;
  const count: number = Math.max(
    1,
    Math.ceil(Math.abs(sweep) / ((manoeuvreWheel.ARC * Math.PI) / 180)),
  );
  const out: IAutoMovieVector3[] = [from];
  for (let k: number = 1; k < count; ++k) {
    const u: number = k / count;
    const r: number = r0 + (r1 - r0) * u;
    const a: number = a0 + sweep * u;
    out.push({
      x: centre.x + r * Math.sin(a),
      y: 0,
      z: centre.z + r * Math.cos(a),
    });
  }
  out.push(to);
  return out;
}
