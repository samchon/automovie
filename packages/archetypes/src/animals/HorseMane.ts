import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { type ArchetypeBuilder, ArchetypeFrame } from "../core";
import type { createHorse } from "./createHorse";

/** A handful of mane, metres: the round aperture a fist closes on, a construction estimate no source read gives. */
const HANDFUL: number = 0.03;

/** The run of crest a rider's hand may take, metres along the neck from its root, a construction estimate. */
const RUN: number = 0.2;

/**
 * Lay the `mane` contact a rider grips on the crest of a saddled horse's neck: a round hold centred on the neck's top where it meets the withers, its axis up the neck toward the poll, `+Y` out of the crest.
 *
 * The hold is on the neck bar's actual top line, `crest` of the rest rig (the neck root raised by the neck bar's radius), so it rides the trunk with the saddle. A swimming horse's rider holds it with the reins loose (Horse Training by Modern Methods, cited by #3953).
 *
 * @param builder The equid under construction, its body laid.
 * @param rig The equid's rest rig.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States where the hold lies, its axes, what carries it and its use.
 * @evidence contracts/development/implementation.md#principled-implementation The hold is placed on the actual neck bar's top line from the rig, its axis along the neck toward the poll.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One contact.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The handful and the run are named estimates.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Lays one contact.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function HorseMane(
  builder: ArchetypeBuilder<createHorse.Affordance, createHorse.Dimension>,
  rig: createHorse.IRig,
): void {
  const along: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(rig.poll, rig.neck),
  );
  builder.affordance({
    id: "mane",
    kind: "bar",
    symmetry: "round",
    frame: ArchetypeFrame.facing(
      rig.crest,
      Vector3.subtract({ x: 0, y: 1, z: 0 }, Vector3.scale(along, along.y)),
      along,
    ),
    extent: null,
    grip: "power",
    aperture: HANDFUL,
    length: RUN,
  });
}
