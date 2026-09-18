import { IAutoMovieBuiltEnvironment, IAutoMovieFluidDomain, IAutoMovieWaterFeature } from "@automovie/interface";
import { builtEnvironmentContainsPoint } from "../architecture/builtEnvironmentContainsPoint";
import { sampleFluidSpray } from "./fluidSpray";
import { fluidSurfaceGeometry } from "./fluidSurface";
import { sampleFluidDomain } from "./sampleFluidDomain";
import { simulateFluidDomain } from "./simulateFluidDomain";
import { IAutoMovieWaterFeatureFrame } from "./IAutoMovieWaterFeatureFrame";

/**
 * Lower one bound water feature to everything a renderer needs at a shot
 * second.
 *
 * A `static` feature always reads its authored step-0 state, which is what
 * makes a mirror pool read identically in every frame of a cut; `flowing` and
 * `simulated` read the fixed-step solve at that second. The distinction between
 * those two is a surface-animation hint the renderer applies, never a different
 * solve — two features over the same domain must never disagree about where the
 * water is.
 *
 * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-flow-spray Lowers the authored water mode to state, surface, and bounded spray.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Produces the renderer-ready result of the feature's independent fluid domain.
 * @author Samchon
 */
export const lowerWaterFeature = (props: {
  feature: IAutoMovieWaterFeature;
  domain: IAutoMovieFluidDomain;
  time: number;
  /**
   * Camera distance in metres driving spray LOD; defaults to `0`. It must be a
   * real number: {@link sampleFluidSpray} refuses a non-finite one rather than
   * thinning the mist to nothing and reading as a fountain that stopped.
   */
  cameraDistance?: number;
}): IAutoMovieWaterFeatureFrame => {
  const state =
    props.feature.mode === "static"
      ? simulateFluidDomain(props.domain, 0)
      : sampleFluidDomain(props.domain, props.time);
  return {
    feature: props.feature.id,
    state,
    surface: fluidSurfaceGeometry({ domain: props.domain, state }),
    spray: sampleFluidSpray({
      domain: props.domain,
      state,
      cameraDistance: props.cameraDistance ?? 0,
    }),
  };
};

/**
 * The first bed point of the lattice standing outside the basin, or `null`.
 *
 * The points measured are cell centres, because that is where the water is: the
 * free surface carries one vertex per cell at its centre, so the drawn water
 * never reaches past the outermost centres and a rim half a cell wide is not
 * flooded by arithmetic nobody authored.
 *
 * `exhaustive` walks every cell; otherwise only the corner cells are measured,
 * which decides a rectangle against a single convex region exactly. The caller
 * pays the full walk exactly when the basin is not convex, and only for a
 * domain whose own cell budget has already been enforced.
 */
const strayCell = (props: {
  environment: IAutoMovieBuiltEnvironment;
  space: string;
  domain: IAutoMovieFluidDomain;
  exhaustive: boolean;
}): { x: number; y: number; z: number } | null => {
  const { domain } = props;
  const span = (length: number): number[] =>
    props.exhaustive ? Array.from({ length }, (_, at) => at) : [0, length - 1];
  for (const row of span(domain.grid.rows))
    for (const column of span(domain.grid.columns)) {
      const point = {
        x: domain.grid.origin.x + (column + 0.5) * domain.grid.cellX,
        y:
          domain.grid.origin.y + domain.bed[row * domain.grid.columns + column],
        z: domain.grid.origin.z + (row + 0.5) * domain.grid.cellZ,
      };
      if (
        builtEnvironmentContainsPoint(props.environment, props.space, point) ===
        false
      )
        return point;
    }
  return null;
};
