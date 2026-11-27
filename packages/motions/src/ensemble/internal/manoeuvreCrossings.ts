import type {
  IAutoMovieMotionHumanEnsemble,
  IAutoMovieMotionHumanFormation,
  IAutoMovieMotionHumanManoeuvre,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanCrowd } from "./HumanCrowd";
import { HumanFormation } from "./HumanFormation";

/*
 * Refuse a manoeuvre whose ways cross: each member read on its way at its
 * travel's speed from its delay, every 1/24 s, against every other.
 */
export function manoeuvreCrossings(
  ensemble: manoeuvreCrossings.IEnsemble,
  parts: readonly IAutoMovieMotionHumanManoeuvre.IPart[],
  speeds: readonly number[],
  at: number,
): void {
  const members: readonly manoeuvreCrossings.IMember[] = ensemble.members;
  const lengths: number[][] = parts.map(
    (p: IAutoMovieMotionHumanManoeuvre.IPart): number[] => {
      const out: number[] = [0];
      for (let k: number = 1; k < p.via.length; ++k)
        out.push(
          out[k - 1]! +
            Math.hypot(
              p.via[k]!.x - p.via[k - 1]!.x,
              p.via[k]!.z - p.via[k - 1]!.z,
            ),
        );
      return out;
    },
  );

  // Each station's formation, prepared once for every part that keeps it.
  const stations: Map<
    IAutoMovieMotionHumanFormation,
    HumanFormation.IPrepared
  > = new Map();
  for (const p of parts)
    if (p.station !== undefined && !stations.has(p.station.formation))
      stations.set(
        p.station.formation,
        HumanFormation.prepare(p.station.formation),
      );
  const where: (i: number, t: number) => IAutoMovieVector3 = (
    i: number,
    t: number,
  ): IAutoMovieVector3 => {
    const p: IAutoMovieMotionHumanManoeuvre.IPart = parts[i]!;
    if (p.station !== undefined)
      return stations.get(p.station.formation)!.slot(p.station.slot, at + t).at;
    const s: number = Math.max(0, (t - p.delay) * speeds[i]!);
    const arcs: number[] = lengths[i]!;
    let k: number = 0;
    while (k + 2 < p.via.length && arcs[k + 1]! < s) ++k;
    if (p.via.length === 1) return p.via[0]!;
    const span: number = arcs[k + 1]! - arcs[k]!;
    const u: number = span < 1e-12 ? 1 : Math.min(1, (s - arcs[k]!) / span);
    return {
      x: p.via[k]!.x + (p.via[k + 1]!.x - p.via[k]!.x) * u,
      y: 0,
      z: p.via[k]!.z + (p.via[k + 1]!.z - p.via[k]!.z) * u,
    };
  };
  const end: number = Math.max(
    0,
    ...parts.map(
      (p: IAutoMovieMotionHumanManoeuvre.IPart, i: number): number =>
        p.station === undefined
          ? p.delay + lengths[i]![lengths[i]!.length - 1]! / speeds[i]!
          : (stations.get(p.station.formation)!.end ?? at) - at,
    ),
  );
  const n: number = parts.length;
  const floor: number[][] = [];
  for (let i: number = 0; i < n; ++i) {
    floor.push([]);
    for (let j: number = 0; j < n; ++j) {
      const a0: IAutoMovieVector3 = where(i, 0);
      const b0: IAutoMovieVector3 = where(j, 0);
      const a1: IAutoMovieVector3 = parts[i]!.via[parts[i]!.via.length - 1]!;
      const b1: IAutoMovieVector3 = parts[j]!.via[parts[j]!.via.length - 1]!;
      floor[i]!.push(
        Math.min(
          HumanCrowd.half(members[i]!) + HumanCrowd.half(members[j]!),
          Math.hypot(a0.x - b0.x, a0.z - b0.z),
          Math.hypot(a1.x - b1.x, a1.z - b1.z),
        ),
      );
    }
  }
  for (let t: number = 0; t <= end + 1e-9; t += HumanCrowd.STEP) {
    const points: IAutoMovieVector3[] = parts.map(
      (_: IAutoMovieMotionHumanManoeuvre.IPart, i: number): IAutoMovieVector3 =>
        where(i, t),
    );
    for (let i: number = 0; i < n; ++i)
      for (let j: number = i + 1; j < n; ++j) {
        const d: number = Math.hypot(
          points[i]!.x - points[j]!.x,
          points[i]!.z - points[j]!.z,
        );
        if (d < floor[i]![j]! - 1e-3)
          throw new AutoMovieMotionHumanRefusal({
            kind: "participant",
            performer: members[i]!.subject,
            axis: `${ensemble.input.id}.manoeuvre`,
            value: members[j]!.subject,
            reason: `${members[i]!.subject} and ${members[j]!.subject} come ${d.toFixed(3)} m apart ${t.toFixed(3)} s after the word, closer than ${floor[i]![j]!.toFixed(3)} m: their ways cross`,
            fix: "step off in another order, or let the crowd's steering take the crossing (path: steered)",
          });
      }
  }
}

/*
 * Companion types of manoeuvreCrossings.
 */
export namespace manoeuvreCrossings {
  /*
   * What the check reads of a member: its name and its shoulders' breadth.
   */
  export interface IMember
    extends
      Pick<IAutoMovieMotionHumanEnsemble.IMember, "subject">,
      HumanCrowd.IHalfMember {}

  /*
   * What the check reads of the ensemble: its id and its members.
   */
  export interface IEnsemble {
    /*
     * The ensemble's input, for its id.
     */
    input: Pick<IAutoMovieMotionHumanEnsemble.IEnsemble["input"], "id">;

    /*
     * The members, by index.
     */
    members: readonly IMember[];
  }
}
