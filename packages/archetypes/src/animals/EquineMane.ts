import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
} from "../core";
import { type AutoMovieArchetypeEquine } from "./AutoMovieArchetypeEquine";

/**
 * A handful of mane, metres: the round aperture a fist closes on, a
 * construction estimate no source read gives.
 */
const HANDFUL: number = 0.03;

/**
 * The run of crest a rider's hand may take, metres along the neck from its
 * root, a construction estimate.
 */
const RUN: number = 0.2;

/** The colour of the mane's drawn rod, sRGB. */
const HAIR: string = "#2b1d14";

/**
 * Lay the `mane` contact a rider grips on the crest of a saddled horse's neck:
 * a round hold centred on the neck's top where it meets the withers, its axis
 * up the neck toward the poll, `+Y` out of the crest. The hold closes on a
 * `mane` rod, the one handful of hair: a rod of the handful's 0.03 m diameter
 * and the run's 0.2 m, centred a radius above the crest so it rests on the
 * neck, massless like the rest of the tack.
 *
 * The hold is on the neck bar's top line, `crest` of the rest rig (the neck
 * root raised by the neck bar's radius), so it rides the trunk with the saddle.
 * A swimming horse's rider holds it with the reins loose (Horse Training by
 * Modern Methods, cited by #3953).
 *
 * @param builder The equid under construction, its body laid.
 * @param rig The equid's rest rig.
 */
export function EquineMane(
  builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension
  >,
  rig: AutoMovieArchetypeEquine.IRig,
): void {
  const along: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(rig.poll, rig.neck),
  );
  const out: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract({ x: 0, y: 1, z: 0 }, Vector3.scale(along, along.y)),
  );

  // The hair the hand closes on: a rod of the handful's diameter along the
  // crest, its axis perpendicular to the grip's +Y so the span across the grip
  // is the aperture.
  const middle: IAutoMovieVector3 = Vector3.add(
    rig.crest,
    Vector3.scale(out, HANDFUL / 2),
  );
  const half: IAutoMovieVector3 = Vector3.scale(along, RUN / 2);
  builder.rod(
    "mane",
    HANDFUL / 2,
    Vector3.subtract(middle, half),
    Vector3.add(middle, half),
    { color: HAIR, share: 0 },
  );
  builder.affordance({
    id: "mane",
    kind: "bar",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(rig.crest, out, along),
    extent: null,
    grip: "power",
    aperture: HANDFUL,
    length: RUN,
  });
}
