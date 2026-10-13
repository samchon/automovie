/**
 * How high the ground is, as a rule rather than a mesh.
 *
 * One declaration serves the two records that ask the question: the production
 * world's terrain (`IAutoMovieWorldSurface.height`), which a crowd is placed
 * on, and the scene's standable patch (`IAutoMovieSurface.height`), which a
 * performer stands and foot-plants on. Both are read by the engine's
 * `surfaceHeightAt`, so a crowd member and the figure beside it cannot stand on
 * two different grounds.
 *
 * Every kind is pure arithmetic over its own stored numbers, so the same rule
 * answers the same height on every machine and run. The rule ignores the
 * footprint; the record that carries it says where the surface exists.
 * `validateSpace` checks a scene patch's rule and `validateProductionDesign` a
 * world surface's, each requiring finite numbers, positive lattice pitch, at
 * least two lattice lines per axis, and exactly `columns * rows` samples.
 *
 * @evidence contracts/common.md#principled-implementation `surfaceHeightAt` returns `value` for `constant`, evaluates `originHeight + slopeX * x + slopeZ * z` for `plane`, and interpolates bilinearly within the clamped lattice cell for `heightfield`, which is continuous across cells and reproduces each sample at its own lattice point.
 * @evidence contracts/common.md#clear-and-simple-design Three kinds in one discriminated union, from one number to a sampled lattice, cover level, tilted and relief ground without a mesh, and both the world terrain and the scene patch cite this one type instead of spelling their own.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A query off the lattice clamps to the edge samples rather than extrapolating relief nobody authored; the remaining gap is that the engine and production packages each keep their own copy of the validity checks, so the two refusals can drift.
 * @evidence contracts/common.md#meaningful-documentation States which records carry the rule, the one evaluating function, determinism, that the footprint is ignored, which validators refuse what, and per kind the formula, units, lattice layout, clamping and interpolation.
 * @author Samchon
 */
export type IAutoMovieHeightRule =
  | {
      /** Flat surface. */
      kind: "constant";

      /** Finite surface height in meters. */
      value: number;
    }
  | {
      /** Planar slope: `originHeight + slopeX * x + slopeZ * z`. */
      kind: "plane";

      /** Finite plane height at the world origin, in meters. */
      originHeight: number;

      /** Finite height in meters gained per positive X meter. */
      slopeX: number;

      /** Finite height in meters gained per positive Z meter. */
      slopeZ: number;
    }
  | {
      /**
       * Sampled relief: a regular XZ grid of heights over the surface.
       *
       * `constant` is one number and `plane` is a single tilt, so neither can
       * express a hill, a terraced square, a riverbank, or a stepped approach.
       * This is the smallest rule that can, costing `columns * rows` numbers
       * rather than a mesh.
       *
       * The grid is a sampling lattice, not an extent: the footprint still says
       * where the surface exists. A query outside the lattice clamps to the
       * nearest edge sample rather than extrapolating, so a lattice that covers
       * its footprint never reaches the clamp.
       *
       * Between samples the height is bilinear over the four surrounding
       * samples, continuous across cell boundaries and exact at each lattice
       * point. Nothing is sampled from an image, a noise function, or a seed
       * here; a generator that wants relief bakes its samples into this array,
       * as `worldHeightfield` does.
       */
      kind: "heightfield";

      /** Finite world X of sample column zero, in meters. */
      originX: number;

      /** Finite world Z of sample row zero, in meters. */
      originZ: number;

      /** Finite column pitch along +X in meters, strictly above zero. */
      spacingX: number;

      /** Finite row pitch along +Z in meters, strictly above zero. */
      spacingZ: number;

      /** Sample columns along +X; an integer of at least two. */
      columns: number;

      /** Sample rows along +Z; an integer of at least two. */
      rows: number;

      /**
       * Finite sample heights in meters, row-major: index
       * `row * columns + column`. Exactly `columns * rows` entries.
       */
      samples: number[];
    };
