/**
 * How high the ground is, as a rule rather than a mesh.
 *
 * One declaration, because two records ask the question: the production world's
 * terrain, which a crowd is placed on, and the scene's standable space, which a
 * performer stands and foot-plants on. A rule spelled twice is how a member and
 * the figure beside it come to stand on two different grounds, so both cite
 * this and one engine function answers it.
 *
 * Every kind is pure arithmetic over its own stored numbers: the same rule
 * answers the same height on every machine and every run. The rule ignores the
 * footprint; the record that carries it says where the surface exists.
 *
 * @evidence contracts/common.md#principled-implementation `surfaceHeightAt` evaluates `constant` as a level, `plane` as `originHeight + slopeX * x + slopeZ * z`, and `heightfield` by bilinear interpolation with lattice coordinates clamped to the edge, so heights are continuous, exact at samples, and never extrapolated.
 * @evidence contracts/common.md#clear-and-simple-design A three-member union discriminated on `kind`, the smallest set covering level ground, a single tilt and authored relief; the world terrain and a scene's standable surface both cite it so one function answers both.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No coordinate is special-cased; a `samples` array shorter than declared reads `0` instead of `NaN` in `surfaceHeightAt`, a fallback for unvalidated input that `validateSpace` and `validateProductionDesign` refuse up front.
 * @evidence contracts/common.md#meaningful-documentation States the formula and metre unit of each kind, the row-major sample order and count, the lattice minimums, edge clamping, interpolation, determinism, and that the footprint bounds the surface.
 * @author Samchon
 */
export type IAutoMovieHeightRule =
  | {
      /** Flat surface. */
      kind: "constant";

      /** Surface height in meters. */
      value: number;
    }
  | {
      /** Planar slope: `originHeight + slopeX * x + slopeZ * z`. */
      kind: "plane";

      /** Plane height at the world origin, in meters. */
      originHeight: number;

      /** Height in meters gained per positive X meter. */
      slopeX: number;

      /** Height in meters gained per positive Z meter. */
      slopeZ: number;
    }
  | {
      /**
       * Sampled relief: a regular XZ grid of heights over the surface.
       *
       * `constant` is one number and `plane` is a single tilt, so neither can
       * express a rise: a hill, a terraced square, a riverbank, a stepped
       * approach. This is the smallest rule that can. The grid is a lattice of
       * stored heights and the surface height between them is interpolated, so
       * relief costs `columns * rows` numbers rather than a mesh.
       *
       * **Bounds.** The grid is a sampling lattice, not an extent: the
       * footprint still says where the surface exists, exactly as it does for
       * `constant` and `plane`. A query outside the lattice clamps to the
       * nearest edge sample rather than extrapolating, because extrapolating a
       * sampled relief invents terrain nobody authored, and a lattice that
       * covers its footprint never reaches this at all.
       *
       * **Interpolation.** Bilinear between the four surrounding samples. The
       * result is continuous across cell boundaries and reproduces a stored
       * sample exactly at its own lattice point, so a member standing on a
       * sample stands at the authored height.
       *
       * **Determinism.** Pure arithmetic over the stored samples: the same
       * design answers the same height on every machine and every run. Nothing
       * is sampled from an image, a noise function, or a seed here; a generator
       * that wants relief bakes its samples into this array, where the builder
       * digests them with the rest of the design.
       */
      kind: "heightfield";

      /** World X of sample column zero, in meters. */
      originX: number;

      /** World Z of sample row zero, in meters. */
      originZ: number;

      /** Finite column pitch along +X in meters, strictly above zero. */
      spacingX: number;

      /** Finite row pitch along +Z in meters, strictly above zero. */
      spacingZ: number;

      /** Sample columns along +X; at least two. */
      columns: number;

      /** Sample rows along +Z; at least two. */
      rows: number;

      /**
       * Finite sample heights in meters, row-major: index `row * columns +
       * column`. Exactly `columns * rows` entries.
       */
      samples: number[];
    };
