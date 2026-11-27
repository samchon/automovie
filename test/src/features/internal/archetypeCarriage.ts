import { AutoMovieArchetypeAssembly, AutoMovieArchetypeFrame, AutoMovieArchetypeBar, AutoMovieArchetypeSeat, AutoMovieArchetypeWall } from "@automovie/archetypes";
import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type { IAutoMovieTransform } from "@automovie/interface";
/**
 * A test carriage: three benches facing along `+Z` down its middle, a rail along each side and a low wall across its front, as one assembly.
 *
 * @param seed The seed every member is drawn with.
 * @returns The assembly.
 */
export function archetypeCarriage(
  seed: number,
): AutoMovieArchetypeAssembly<archetypeCarriage.Members> {
  return AutoMovieArchetypeAssembly.of(
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
    bench1: AutoMovieArchetypeAssembly.IMember<
      AutoMovieArchetypeSeat.Affordance,
      AutoMovieArchetypeSeat.Dimension
    >;
    /** The middle bench. */
    bench2: AutoMovieArchetypeAssembly.IMember<
      AutoMovieArchetypeSeat.Affordance,
      AutoMovieArchetypeSeat.Dimension
    >;
    /** The front bench. */
    bench3: AutoMovieArchetypeAssembly.IMember<
      AutoMovieArchetypeSeat.Affordance,
      AutoMovieArchetypeSeat.Dimension
    >;
    /** The rail along the left side. */
    railLeft: AutoMovieArchetypeAssembly.IMember<
      AutoMovieArchetypeBar.Affordance,
      AutoMovieArchetypeBar.Dimension
    >;
    /** The rail along the right side. */
    railRight: AutoMovieArchetypeAssembly.IMember<
      AutoMovieArchetypeBar.Affordance,
      AutoMovieArchetypeBar.Dimension
    >;
    /** The low wall across the front. */
    wall: AutoMovieArchetypeAssembly.IMember<
      AutoMovieArchetypeWall.Affordance,
      AutoMovieArchetypeWall.Dimension
    >;
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
        archetype: AutoMovieArchetypeSeat.create({ kind: "bench" }, seed),
        placement: placement(0, 0, -2, 0),
      },
      bench2: {
        archetype: AutoMovieArchetypeSeat.create({ kind: "bench" }, seed),
        placement: placement(0, 0, 0, 0),
      },
      bench3: {
        archetype: AutoMovieArchetypeSeat.create({ kind: "bench" }, seed),
        placement: placement(0, 0, 2, 0),
      },
      railLeft: {
        archetype: AutoMovieArchetypeBar.create({ kind: "rail" }, seed),
        placement: placement(1.2, 0, 0, 90),
      },
      railRight: {
        archetype: AutoMovieArchetypeBar.create({ kind: "rail" }, seed),
        placement: placement(-1.2, 0, 0, -90),
      },
      wall: {
        archetype: AutoMovieArchetypeWall.create({ kind: "low" }, seed),
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
      rotation: AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, heading),
      scale: { ...AutoMovieArchetypeFrame.UNIT },
    };
  }
}
