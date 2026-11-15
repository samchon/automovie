import {
  ArchetypeAssembly,
  ArchetypeFrame,
  createBar,
  createSeat,
  createWall,
} from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type { IAutoMovieTransform } from "@automovie/interface";

/**
 * A test carriage: three benches facing along `+Z` down its middle, a rail along each side and a low wall across its front, as one assembly.
 *
 * @param seed The seed every member is drawn with.
 * @returns The assembly.
 */
export function archetypeCarriage(
  seed: number,
): ArchetypeAssembly<archetypeCarriage.Members> {
  return ArchetypeAssembly.of(
    "carriage",
    "railway carriage",
    archetypeCarriage.members(seed),
  );
}

/** The test carriage's members and placements. */
export namespace archetypeCarriage {
  /** The members by key. */
  export type Members = {
    /** The rear bench. */
    bench1: ArchetypeAssembly.IMember<
      createSeat.Affordance,
      createSeat.Dimension
    >;

    /** The middle bench. */
    bench2: ArchetypeAssembly.IMember<
      createSeat.Affordance,
      createSeat.Dimension
    >;

    /** The front bench. */
    bench3: ArchetypeAssembly.IMember<
      createSeat.Affordance,
      createSeat.Dimension
    >;

    /** The rail along the left side. */
    railLeft: ArchetypeAssembly.IMember<
      createBar.Affordance,
      createBar.Dimension
    >;

    /** The rail along the right side. */
    railRight: ArchetypeAssembly.IMember<
      createBar.Affordance,
      createBar.Dimension
    >;

    /** The low wall across the front. */
    wall: ArchetypeAssembly.IMember<createWall.Affordance, createWall.Dimension>;
  };

  /**
   * The members, each drawn with one seed.
   *
   * @param seed The seed.
   * @returns The members by key.
   */
  export function members(seed: number): Members {
    return {
      bench1: {
        archetype: createSeat({ kind: "bench" }, seed),
        placement: placement(0, 0, -2, 0),
      },
      bench2: {
        archetype: createSeat({ kind: "bench" }, seed),
        placement: placement(0, 0, 0, 0),
      },
      bench3: {
        archetype: createSeat({ kind: "bench" }, seed),
        placement: placement(0, 0, 2, 0),
      },
      railLeft: {
        archetype: createBar({ kind: "rail" }, seed),
        placement: placement(1.2, 0, 0, 90),
      },
      railRight: {
        archetype: createBar({ kind: "rail" }, seed),
        placement: placement(-1.2, 0, 0, -90),
      },
      wall: {
        archetype: createWall({ kind: "low" }, seed),
        placement: placement(0, 0, 3.2, 180),
      },
    };
  }

  /**
   * A placement in an assembly: a point and a heading about `+Y`, with unit scale.
   *
   * @param x X, metres.
   * @param y Height, metres.
   * @param z Z, metres.
   * @param heading Degrees about `+Y`.
   * @returns The placement.
   */
  export function placement(
    x: number,
    y: number,
    z: number,
    heading: number,
  ): IAutoMovieTransform {
    return {
      translation: { x, y, z },
      rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, heading),
      scale: { ...ArchetypeFrame.UNIT },
    };
  }
}
