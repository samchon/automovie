import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanBodyBasisCorrective,
} from "@automovie/human";
import { storeHumanBodyCorrectiveRows } from "@automovie/human/body/basis/storeHumanBodyCorrectiveRows";

import {
  isSidedBodyCorrective,
  mirrorBodyCorrective,
  mirrorBodyVertices,
  symmetrizeBodyRows,
} from "./mirrorBodyCorrective";
import type { IBodyCorrectiveMerge } from "./IBodyCorrectiveMerge";
import type { IBodyCorrectiveShard } from "./IBodyCorrectiveShard";

/**
 * Publish a solve shard onto a basis: remove the correctives the shard
 * dropped, append the correctives it solved, and make them bilaterally
 * symmetric.
 *
 * A sided corrective (its drivers mirror to a different set) gains its exact
 * mirror as a new corrective; a midline or bilateral corrective (its drivers
 * mirror to themselves) has its rows replaced by the mean of the field and its
 * mirror. Mirrors and symmetrized rows are stored at 10 micrometres and rows
 * that fall to zero there are dropped. A mirror whose id already names a
 * corrective of the basis, of the shard or of an earlier mirror is refused, as
 * is a dropped id the basis does not carry, so a merge can not silently
 * replace or miss a corrective. The revision id and the basis' other fields
 * are the caller's: this returns the basis under `id`.
 * Source dependency markers retain their order for every remaining declared
 * target. Removing a target removes its marker; replacing a corrective with
 * the same target never certifies that target's source as complete. A legacy
 * basis without dependency metadata keeps that absence.
 *
 * The neutral surface is the one `mirrorBodyVertices` pairs; a vertex without
 * a mirror in a corrective's rows throws. The input basis is not mutated.
 */
export function mergeBodyCorrectives(
  basis: IAutoMovieHumanBodyBasis,
  shard: IBodyCorrectiveShard,
  id: string,
): IBodyCorrectiveMerge {
  const held = new Set((basis.correctives ?? []).map((c) => c.id));
  for (const gone of shard.dropped)
    if (!held.has(gone))
      throw new Error("The shard drops a corrective the basis lacks: " + gone);
  const dropped = new Set(shard.dropped);
  const surface = basis.surfaces[0];
  const channels = new Map(basis.channels.map((c) => [c.id, c]));
  const partner = mirrorBodyVertices(surface.positions);
  const targets = Object.fromEntries(
    Object.entries(surface.targets).filter(([name]) => !dropped.has(name)),
  );
  const correctives = (basis.correctives ?? []).filter(
    (c) => !dropped.has(c.id),
  );
  const taken = new Set(correctives.map((c) => c.id));
  const added: string[] = [];
  const mirrored: string[] = [];
  const symmetrized: string[] = [];
  const claim = (corrective: IAutoMovieHumanBodyBasisCorrective, rows: number[]): void => {
    if (taken.has(corrective.id))
      throw new Error("A corrective already carries the id " + corrective.id);
    taken.add(corrective.id);
    correctives.push(corrective);
    targets[corrective.id] = rows;
  };
  for (const corrective of shard.correctives) {
    const rows = shard.rows[corrective.id];
    if (isSidedBodyCorrective(corrective, channels)) {
      claim(corrective, rows);
      added.push(corrective.id);
      const mirror = mirrorBodyCorrective(corrective, rows, partner, channels);
      claim(mirror.corrective, storeHumanBodyCorrectiveRows(mirror.rows));
      mirrored.push(mirror.corrective.id);
    } else {
      claim(
        corrective,
        storeHumanBodyCorrectiveRows(symmetrizeBodyRows(rows, partner)),
      );
      added.push(corrective.id);
      symmetrized.push(corrective.id);
    }
  }
  // a row that fell to zero at 10 micrometres is no row
  for (const name of [...mirrored, ...symmetrized]) {
    const rows = targets[name];
    const kept: number[] = [];
    for (let at = 0; at < rows.length; at += 4)
      if (rows.slice(at + 1, at + 4).some((one) => one !== 0))
        kept.push(...rows.slice(at, at + 4));
    targets[name] = kept;
  }
  const dependencies =
    basis.unavailableTargets === undefined
      ? {}
      : {
          unavailableTargets: basis.unavailableTargets.filter(
            (target) =>
              basis.channels.some(
                (channel) =>
                  channel.positive === target || channel.negative === target,
              ) ||
              correctives.some((corrective) => corrective.target === target),
          ),
        };
  return {
    basis: {
      ...basis,
      ...dependencies,
      id,
      correctives,
      surfaces: [{ ...surface, targets }, ...basis.surfaces.slice(1)],
    },
    dropped: [...dropped],
    added,
    mirrored,
    symmetrized,
  };
}
