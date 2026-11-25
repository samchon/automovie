import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  type AutoMovieArchetypeConvexCell,
  AutoMovieArchetypeDrawSession,
} from "../core";
import { AnnularFitting } from "./AnnularFitting";

/** A cuff's size. */
interface ICuff {
  /** Width along the leg, metres. */
  width: number;

  /** The leather's thickness, metres. */
  thickness: number;
}

/**
 * A cuff's width along the leg and its leather's thickness, metres: authored,
 * no maker's listing read gives them.
 */
const CUFF: ICuff = {
  width: 0.05,
  thickness: 0.008,
};

/** The strap's radius, metres: authored. */
const STRAP: number = 0.008;

/** A hobble's mass, kilograms: authored, no listing read gives it. */
const MASS: number = 0.3;

/**
 * A fore hobble: a cuff round each foreleg's cannon and a strap between them.
 *
 * Each cuff is a short ring round the cannon along the leg's axis (`+Y`). The
 * inner radius fits the cannon and the leather extends outward; at rest the
 * cuffs' middles stand the strap's length apart along `+X`, the left at `+X`.
 * The strap is a span from the inner side of one cuff to the inner side of the
 * other, its rest length the strap's length less the two cuffs' radii, so the
 * cuffs' middles never stand farther apart than the strap's length while it is
 * not drawn past its rest length, and a pose that draws it shorter reports it
 * slack. The cuffs are posed onto a hobbled equid's forelegs by
 * `AutoMovieArchetypeEquineHobble`. The cuff's width and thickness, the strap's
 * radius and the mass are authored.
 *
 * @param cannon The radius of the cannon the cuffs close round, metres.
 * @param params The strap's length and the model's id.
 * @returns The hobble.
 * @throws {RangeError} For a nonpositive cannon radius or strap length.
 */
export function createHobble(
  cannon: number,
  params: createHobble.IParams,
): AutoMovieArchetype<never, never> {
  if (!(cannon > 0) || !(params.strap > 0))
    throw new RangeError(
      "A hobble closes round a cannon of positive radius with a strap of positive length",
    );
  const draw: AutoMovieArchetypeDrawSession<never> =
    new AutoMovieArchetypeDrawSession<never>("hobble", {}, undefined, {});
  const builder: AutoMovieArchetypeBuilder<never, never> =
    new AutoMovieArchetypeBuilder({
      material: "leather",
      id: params.id,
      name: "hobble",
      draw,
    });
  const ring: number = cannon + CUFF.thickness;
  if (!(params.strap > 2 * ring))
    throw new RangeError(
      "A hobble's strap is longer than its two cuffs are wide",
    );
  const half: number = params.strap / 2;
  const wall: readonly AutoMovieArchetypeConvexCell.ICell[] =
    AnnularFitting.prepare(cannon, ring, CUFF.width);
  for (const [id, x] of [
    ["leftCuff", half],
    ["rightCuff", -half],
  ] as const)
    AnnularFitting.emit(
      builder,
      id,
      wall,
      Vector3.create(x, -CUFF.width / 2, 0),
      Vector3.create(x, CUFF.width / 2, 0),
      "#4a2f1b",
    );
  builder.span(
    "strap",
    builder.anchor("leftCuff", Vector3.create(half - ring, 0, 0)),
    builder.anchor("rightCuff", Vector3.create(-half + ring, 0, 0)),
    STRAP,
    { color: "#4a2f1b" },
    params.strap - 2 * ring,
  );
  return builder.build(MASS);
}

/** Companion types of {@link createHobble}. */
export namespace createHobble {
  /** The parameters. */
  export interface IParams {
    /**
     * The most the cuffs' middles stand apart, metres, more than the two cuffs
     * are wide.
     */
    strap: number;

    /** The model's id, unique in a scene; `hobble` when absent. */
    id?: string;
  }
}
