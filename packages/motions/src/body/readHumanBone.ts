import type { AutoMovieHumanoidBone, IAutoMovieBone } from "@automovie/interface";

import type { IHumanBody } from "./IHumanBody";

/** Each body's bone records by name, built at the first lookup and released with the body. */
const RECORDS: WeakMap<IHumanBody, ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieBone>> = new WeakMap();

/**
 * A bone's record in a body's rig, by name: the first record of that name,
 * the one a scan of `body.skeleton.bones` finds.
 *
 * A body's rig is a value read when the body is made (its forward
 * kinematics, mass model and chain constants are prepared from it once), so
 * the names are indexed once a body, at the first lookup, in place of a scan
 * of the bone list at every lookup. The record returned is the rig's own
 * object, so a caller reads its current constraint, axes and rest.
 *
 * @param body The body.
 * @param bone The bone's name.
 * @returns The record, or undefined when the rig has no bone of that name.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is returned, which record a repeated name gives, when the index is built, its premise and the absent case.
 * @evidence contracts/development/implementation.md#principled-implementation A name-to-record map filled in list order, keeping the first record of a name, gives what `Array.prototype.find` gives for that name on the same list; the body's rig does not change its membership for the body's life.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One weak map of bodies and one lookup.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The record is the rig's own, never a copy or a default; an absent name is undefined, as a scan reports it.
 * @evidence contracts/development/implementation.md#efficient-algorithms One pass over the B bones a body, then one map read a lookup, in place of a scan of up to B records a lookup.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The index is shared by every lookup of one body; the body's identity and its unchanged bone list decide equivalence.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One map of B references a body, weakly keyed, released with the body.
 */
export function readHumanBone(
  body: IHumanBody,
  bone: AutoMovieHumanoidBone,
): IAutoMovieBone | undefined {
  let records: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieBone> | undefined = RECORDS.get(body);
  if (records === undefined) {
    const built: Map<AutoMovieHumanoidBone, IAutoMovieBone> = new Map();
    for (const record of body.skeleton.bones)
      if (!built.has(record.bone)) built.set(record.bone, record);
    records = built;
    RECORDS.set(body, records);
  }
  return records.get(bone);
}
