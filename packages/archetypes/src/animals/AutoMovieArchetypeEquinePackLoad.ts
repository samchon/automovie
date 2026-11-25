import type {
  IAutoMovieAffordance,
  IAutoMovieTransform,
} from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  type AutoMovieArchetypeRide,
} from "../core";
import { type AutoMovieArchetypeEquine } from "./AutoMovieArchetypeEquine";

/**
 * Two side loads hung on a pack saddle's load contacts: a box against each
 * side, its inner face on the pad's outer face at the contact frame, carried
 * with the trunk wherever the pack horse's ride takes it.
 *
 * Each `leftLoad` and `rightLoad` contact is a surface frame whose `+Y` faces
 * out of the pad, whose `+X` runs along the back and whose `width` and `depth`
 * give the pad's extent along the back and down the side (`EquinePack.lay`). A
 * load is a box `length` along the back, `height` down the side and `thickness`
 * out from the pad, its inner face centred on the contact; both sides take the
 * same box, an authored balanced pair. A load longer than the pad along the
 * back or taller than the pad down the side does not sit on it and is refused.
 *
 * @param horse A horse under a pack saddle.
 * @param load The box hung on each side, metres and kilograms.
 * @returns The two load models and their placements at a ride's sample.
 * @throws {AutoMovieArchetypeRefusal} For a horse without the pack saddle's
 *   load contacts, a nonpositive size or mass, or a box that overhangs its
 *   pad.
 */
export function AutoMovieArchetypeEquinePackLoad(
  horse: AutoMovieArchetype<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension
  >,
  load: AutoMovieArchetypeEquinePackLoad.ILoad,
): AutoMovieArchetypeEquinePackLoad.IPrepared {
  const refuse = (axis: string, value: unknown, reason: string): never => {
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: horse.archetype,
      axis,
      value,
      feasible: null,
      reason,
      fix: "Hang loads that fit the pack saddle's pads on a horse under a pack saddle.",
    });
  };
  for (const key of ["length", "height", "thickness", "mass"] as const)
    if (!(load[key] > 0))
      refuse(`load.${key}`, load[key], "must be finite and positive");
  const models: Record<
    AutoMovieArchetypeEquinePackLoad.Side,
    AutoMovieArchetype<"base", never>
  > = {
    leftLoad: box("leftLoad"),
    rightLoad: box("rightLoad"),
  };
  return {
    models,
    at: (
      sample: AutoMovieArchetypeRide.ISample<
        AutoMovieArchetypeEquine.Affordance,
        AutoMovieArchetypeEquine.Dimension
      >,
    ): Record<AutoMovieArchetypeEquinePackLoad.Side, IAutoMovieTransform> => ({
      leftLoad: AutoMovieArchetypeFrame.compose(
        sample.placement,
        sample.archetype.affordance("leftLoad").frame,
      ),
      rightLoad: AutoMovieArchetypeFrame.compose(
        sample.placement,
        sample.archetype.affordance("rightLoad").frame,
      ),
    }),
  };

  /**
   * One side's box, admitted against its pad, with its inner face's centre at
   * its model origin.
   */
  function box(
    side: AutoMovieArchetypeEquinePackLoad.Side,
  ): AutoMovieArchetype<"base", never> {
    if (
      !horse.affordances.some(
        (a: IAutoMovieAffordance): boolean => a.id === side,
      )
    )
      refuse(
        "tack",
        horse.name,
        `the horse has no ${side} contact of a pack saddle`,
      );
    const pad: IAutoMovieAffordance = horse.affordance(side);
    if (pad.width === undefined || pad.depth === undefined)
      refuse("tack", side, "the load contact declares no pad extent");
    if (load.length > pad.width!)
      refuse(
        "load.length",
        load.length,
        `longer than the ${pad.width} m pad along the back`,
      );
    if (load.height > pad.depth!)
      refuse(
        "load.height",
        load.height,
        `taller than the ${pad.depth} m pad down the side`,
      );
    return new AutoMovieArchetypeBuilder<"base", never>({
      material: "wood",
      name: "pack load",
      draw: new AutoMovieArchetypeDrawSession<never>("packLoad", {}, undefined),
    })
      .box(
        "load",
        { x: load.length, y: load.thickness, z: load.height },
        { x: 0, y: load.thickness / 2, z: 0 },
      )
      .affordance({
        id: "base",
        kind: "surface",
        frame: AutoMovieArchetypeFrame.upright({ x: 0, y: 0, z: 0 }),
        extent: null,
      })
      .build(load.mass);
  }
}

/** Types of {@link AutoMovieArchetypeEquinePackLoad}. */
export namespace AutoMovieArchetypeEquinePackLoad {
  /** The two load contacts of a pack saddle. */
  export type Side = "leftLoad" | "rightLoad";

  /** A side load's box, metres, and its mass, kilograms. */
  export interface ILoad {
    /** Along the back. */
    length: number;
    /** Down the side. */
    height: number;
    /** Out from the pad. */
    thickness: number;
    /** Each side's mass. */
    mass: number;
  }

  /** The two loads' models and their placements at a sample. */
  export interface IPrepared {
    /**
     * Each side's box model, its inner face's centre at its origin, `+Y` out of
     * the pad.
     */
    models: Readonly<Record<Side, AutoMovieArchetype<"base", never>>>;
    /** Each side's world placement at a pack horse ride's sample. */
    at: (
      sample: AutoMovieArchetypeRide.ISample<
        AutoMovieArchetypeEquine.Affordance,
        AutoMovieArchetypeEquine.Dimension
      >,
    ) => Record<Side, IAutoMovieTransform>;
  }
}
