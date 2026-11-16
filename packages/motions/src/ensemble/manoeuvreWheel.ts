import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import type { HumanEnsemble } from "./HumanEnsemble";
import { HumanFormation } from "./HumanFormation";
import type { IHumanFormation } from "./IHumanFormation";
import type { IHumanManoeuvre } from "./IHumanManoeuvre";

/**
 * A wheel on a fixed pivot: the formation turned rigidly about its pivot
 * flank, so the line stays straight as it wheels. In the drill books one
 * flank stands fast while the rest moves round it; "the outward wheeling
 * man always lengthens his step to 33 inches" from the ordinary 30, and
 * every other man shortens his step "in proportion as he is nearer to the
 * standing flank on which the wheel is made" (Rules and Regulations for the
 * Formations and Movements of the Militia of Lower-Canada, c. 1814, after
 * Dundas 1792).
 *
 * The wheeling frame is a course standing on the pivot, the `from`
 * formation's blocks moved so each slot stands where it stood at the word,
 * its heading turning and sampled every `HumanFormation.SAMPLE` seconds: a
 * frame that only turns carries every slot round the pivot exactly between
 * samples. Its angular speed is the slowest
 * member's travel speed lengthened by `LENGTHENED`, over the outward
 * radius, so the outward man takes the lengthened step and nobody a longer
 * one; it gathers and sheds that speed at `HumanFormation.ACCELERATION`
 * over the same radius. Each member keeps its own slot of the wheeling
 * formation as a station, so at a called cadence its steps shorten with its
 * radius (`walkStation.cadenced`) and the pivot turns on its own ground. Its
 * way on paper is the arc its slot draws, a point every `ARC` degrees.
 *
 * @param ensemble The ensemble, its member `i` standing in slot `members[i].index` of `from`.
 * @param manoeuvre The wheel.
 * @param starts Where each stands at the word.
 * @param ends Each one's slot in `to`.
 * @param speeds Each one's travel speed, m/s.
 * @returns Each member's way and station; no stations when nothing turns.
 * @throws {HumanRefusal} When `to` is not `from` turned about the pivot, naming the member whose slot lies elsewhere and how far.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the drill's rule with its source, how the frame turns, its speed bound and what each member keeps.
 * @evidence contracts/development/implementation.md#principled-implementation A rigid turn about the pivot with a trapezoidal angular profile, bounded so the outward man's step is the manual's lengthened one; each member's station is a slot of the same blocks in that frame.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The pivot, the check of the target, the profile, the samples, then one station and one arc per member.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts `LENGTHENED` is the manual's 33 over 30 inches; a target that is not the turned formation is refused, not bent onto it.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the members and in the samples, the frame shared by every station.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The frame is built once and shared.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The stations hold the frame for as long as they are held.
 */
export function manoeuvreWheel(
  ensemble: HumanEnsemble.IEnsemble,
  manoeuvre: IHumanManoeuvre,
  starts: readonly IAutoMovieVector3[],
  ends: readonly IHumanFormation.ISlot[],
  speeds: readonly number[],
): manoeuvreWheel.IWheel {
  const members: readonly HumanEnsemble.IMember[] = ensemble.members;
  const pivot: IAutoMovieVector3 = pivotOf(manoeuvre, members, starts);
  const origin: { at: IAutoMovieVector3; heading: number } =
    HumanFormation.frame(manoeuvre.from, manoeuvre.at);
  const target: number = HumanFormation.frame(
    manoeuvre.to,
    manoeuvre.at,
  ).heading;
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
  const samples: IHumanFormation.ISample[] = [];
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
  const formation: IHumanFormation = {
    blocks: manoeuvre.from.blocks.map(
      (b: IHumanFormation.IBlock): IHumanFormation.IBlock => ({
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
      (m: HumanEnsemble.IMember): IHumanFormation.IStation => ({
        formation,
        slot: m.index,
        until: manoeuvre.at + total,
      }),
    ),
  };
}

/**
 * Constants and types of {@link manoeuvreWheel}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each constant states its unit and source.
 * @evidence contracts/development/design.md#principled-representation A ratio of steps, a distance, an angle, and the ways and stations a wheel returns.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What `HumanManoeuvre.plan` reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Named, not numbers inside the function.
 */
export namespace manoeuvreWheel {
  /** The outward man's lengthened step over the ordinary one: 33 inches over 30 (Rules and Regulations for the Formations and Movements of the Militia of Lower-Canada, c. 1814, after Dundas 1792). */
  export const LENGTHENED: number = 33 / 30;

  /** Metres a target slot may lie from the turned one: a millimetre, the rounding of a laid slot, so only a formation of another shape is refused. */
  export const FIT: number = 1e-3;

  /** Degrees between two points of a wheeling member's arc. */
  export const ARC: number = 10;

  /** A wheel's members' ways, and the stations they keep, or null when nothing turns. */
  export interface IWheel {
    /** Each member's arc about the pivot, world metres, by member order. */
    ways: IAutoMovieVector3[][];

    /** Each member's slot in the wheeling formation, by member order; null when nothing turns. */
    stations: IHumanFormation.IStation[] | null;
  }
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

/** The wheel's pivot: the front rank's left or right file, or its centre, where the members stand at the word. */
function pivotOf(
  manoeuvre: IHumanManoeuvre,
  members: readonly HumanEnsemble.IMember[],
  starts: readonly IAutoMovieVector3[],
): IAutoMovieVector3 {
  const front: number[] = members
    .map(
      (
        m: HumanEnsemble.IMember,
        i: number,
      ): [number, HumanFormation.ILocal] => [
        i,
        HumanFormation.local(manoeuvre.from, m.index),
      ],
    )
    .filter(
      (e: [number, HumanFormation.ILocal]): boolean =>
        e[1].rank === 0 && e[1].block === 0,
    )
    .sort(
      (
        a: [number, HumanFormation.ILocal],
        b: [number, HumanFormation.ILocal],
      ): number => a[1].file - b[1].file,
    )
    .map((e: [number, HumanFormation.ILocal]): number => e[0]);
  if (front.length === 0) return starts[0] ?? { x: 0, y: 0, z: 0 };
  const side: "left" | "right" | "centre" = manoeuvre.pivot ?? "left";
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

/** A way about a pivot from one point to another: the radius and the angle each changed evenly, a point every `ARC` degrees. */
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
