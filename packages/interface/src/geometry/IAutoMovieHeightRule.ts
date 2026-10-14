/**
 * How high the ground is, as a rule rather than a mesh.
 *
 * Production terrain (IAutoMovieWorldSurface.height) and scene patches (IAutoMovieSurface.height) share this rule and the engine's surfaceHeightAt evaluator. Their authored records and footprint membership still determine which surface a crowd member or performer queries.
 *
 * Every kind uses stored numbers through surfaceHeightAt. It ignores footprint membership, which the containing surface owns. Engine scene validation checks finite fields, positive lattice pitch, at least two lines per axis and exact sample count; the production world gate is retired. Finite inputs alone do not prevent overflow in coordinate conversion, differences or interpolation.
 *
 * @evidence contracts/common.md#principled-implementation surfaceHeightAt returns a constant, evaluates the authored plane or uses edge-clamped bilinear lattice interpolation. Continuity and sample reproduction describe the admitted mathematical rule; binary64 overflow, rounding and malformed-grid fallback remain numerical limits rather than universally exact output guarantees.
 * @evidence contracts/common.md#clear-and-simple-design Three kinds in one discriminated union, from one number to a sampled lattice, cover level, tilted and relief ground without a mesh, and both the world terrain and the scene patch cite this one type instead of spelling their own.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A query off the lattice clamps to edge samples rather than extrapolating relief nobody authored. Explicit world callers must establish the numeric/grid premises because the retired production validator no longer supplies them automatically.
 * @evidence contracts/common.md#meaningful-documentation Defines containing surfaces, the shared evaluator, separate footprint membership, validator domains, formulas, metre units, row-major lattice layout, clamping and derived-arithmetic limits.
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
       * Constant and plane rules cannot represent varying relief, while this spelling stores columns * rows height values without a mesh.
       *
       * The grid is a sampling lattice whose containing surface separately declares its footprint. Queries outside the lattice clamp to its edge rather than extrapolating; the authored lattice must cover the footprint to avoid edge clamping within that surface.
       *
       * Between samples the mathematical rule is bilinear over four surrounding values, continuous across cell boundaries and reproducing lattice samples. The implementation uses binary64 arithmetic without finite-result admission, so extreme finite differences can overflow even at a lattice point. Generators bake their values into this array rather than the rule sampling an image, noise function or seed.
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
       * Finite sample heights in metres, row-major at row * columns + column, with exactly columns * rows entries.
       */
      samples: number[];
    };
