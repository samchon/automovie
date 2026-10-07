import type { AutoMovieHumanoidBone } from "@automovie/interface";

import { bodyContactBudget } from "./bodyContactBudget";
import { crossedCorners } from "./bodyContactGeometry";
import { type BodyContactBones } from "./BodyContactBones";
import { chooseContactPlane } from "./chooseContactPlane";
import { ownerOfSeam } from "./ownerOfSeam";
import { isBoneThroughSkin } from "./classifyBodyContact";
import { relaxBodyCrease } from "./relaxBodyCrease";
import type { IBodyStanding } from "./solveBodyContact";
import { solveBodyContactBest } from "./solveBodyContactBest";
import { splitBodySheets } from "./splitBodySheets";

/**
 * The working state one push of crossing segments shares across its pairs.
 *
 * Positions are metres in the body frame and are mutated in place as pairs are
 * resolved; `posed` accumulates each moved vertex's displacement from `base`
 * and `standing` the separations already won, so a later pair holds what an
 * earlier one cleared. Everything else is read only.
 */
export interface IBodyContactWork {
  /** Bone of each segment to its corner list, three corners per triangle. */
  segments: Map<string, number[]>;

  /** Vertex neighbour graph over the whole skin. */
  near: number[][];

  /** Parent of each bone. */
  parents: Map<AutoMovieHumanoidBone, AutoMovieHumanoidBone | null>;

  /** The bone that dominates a vertex. */
  dominant: (vertex: number) => string;

  /** Posed bones the planes read. */
  bones: BodyContactBones;

  /** The untouched posed skin. */
  base: number[];

  /** The skin being pushed. */
  positions: number[];

  /** Posed displacement from `base` of every moved vertex. */
  posed: Map<number, number[]>;

  /** Separations the state's earlier contacts won. */
  standing: Map<number, IBodyStanding[]>;

  /** One line per pair resolved. */
  log: string[];
}

/**
 * Resolve a segment that passes through itself (a crease).
 *
 * The crumple is first relaxed into one smooth fold inside the segment's
 * tissue budget; what that cannot part is split into its two sheets and each
 * tangle's sheets are pushed apart by the best-of contact solver, offered the
 * fold plane of the joint to the segment's parent beside the surface rules
 * (a crease inside one segment folds about that joint). The root has no
 * parent and is offered no plane.
 */
export function resolveBodyCrease(work: IBodyContactWork, part: string): void {
  const segment = work.segments.get(part)!;
  const budget = bodyContactBudget(part, part);
  const crease = relaxBodyCrease(
    work.positions,
    work.base,
    work.posed,
    work.near,
    segment,
    budget,
  );
  work.log.push(
    `[${part}]relax:${crease.solved ? "ok" : "left"}@${crease.rounds}`,
  );
  if (crease.solved) return;
  const parent = work.parents.get(part as AutoMovieHumanoidBone) ?? null;
  for (const [k, sheet] of splitBodySheets(work.positions, segment).entries()) {
    const fold =
      parent === null
        ? null
        : chooseContactPlane(
            work.bones,
            work.positions,
            crossedCorners(work.positions, sheet.a, sheet.b),
            crossedCorners(work.positions, sheet.b, sheet.a),
            part,
            parent,
          );
    const result = solveBodyContactBest(
      work.positions,
      work.base,
      work.posed,
      work.near,
      sheet.a,
      sheet.b,
      budget,
      fold?.plane ?? null,
      new Map(),
      work.standing,
    );
    work.log.push(
      `[${part}]#${k}:${result.solved ? "ok" : "left"}:${result.rule}`,
    );
  }
}

/**
 * Resolve two different segments that cross.
 *
 * Tissue gives; bone does not: when either segment's bone passes through the
 * other's skin the body is passing through the body and the pair is logged and
 * left alone. Otherwise the best-of contact solver pushes the two apart
 * against the cheaper of the fold plane and the contact plane, inside the
 * tissue budget of the pair, holding every separation already won and giving
 * a vertex both segments touch to the segment of its dominant bone.
 */
export function resolveBodyPair(
  work: IBodyContactWork,
  part: string,
  other: string,
): void {
  const a = work.segments.get(part)!;
  const b = work.segments.get(other)!;
  if (
    isBoneThroughSkin(work.bones, part, work.positions, b) ||
    isBoneThroughSkin(work.bones, other, work.positions, a)
  ) {
    work.log.push(`${part}x${other}:bone through skin`);
    return;
  }
  const chosen = chooseContactPlane(
    work.bones,
    work.positions,
    crossedCorners(work.positions, a, b),
    crossedCorners(work.positions, b, a),
    part,
    other,
  );
  const result = solveBodyContactBest(
    work.positions,
    work.base,
    work.posed,
    work.near,
    a,
    b,
    bodyContactBudget(part, other),
    chosen?.plane ?? null,
    ownerOfSeam(work.segments, work.dominant, part, other),
    work.standing,
  );
  work.log.push(
    `${part}x${other}[${result.rule.split("@")[0]}]:${result.solved ? "ok" : "left"}:${result.rule}`,
  );
}
