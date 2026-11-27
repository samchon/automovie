import type { IAutoMovieAnalysisRun, IAutoMovieColor } from "@automovie/interface";
import type * as THREE from "three";

import { analysisRampColor as analysisRampColorImplementation } from "./internal/analysisRampColor";
import { buildAnalysisOverlayObject as buildAnalysisOverlayObjectImplementation } from "./internal/buildAnalysisOverlayObject";
import type { IAutoMovieRenderAnalysisOverlayObject } from "./IAutoMovieRenderAnalysisOverlayObject";

/** Public operations for an analysis result's point overlay. */
export namespace AutoMovieRenderAnalysisOverlay {
  /** Inputs for drawing one selected metric from an analysis run. */
  export interface IBuildProps {
    /** Solved run containing the selected metric and spatial samples. */
    run: IAutoMovieAnalysisRun;
    /** Metric key whose spatial field is drawn. */
    metric: string;
    /** Point size in world metres when this call creates the material; defaults to `0.1`. */
    size?: number;
    /** Ramp domain; defaults to the selected samples' minimum and maximum. */
    domain?: IBuildPropsDomain;
    /** Optional caller-owned point material. */
    material?: THREE.PointsMaterial;
  }

  /** The domain object of {@link IBuildProps}. */
  export type IBuildPropsDomain = { min: number; max: number };

  /** Map a normalized `[0, 1]` position to the blue-green-red ramp. */
  export function rampColor(
    position: number,
  ): Pick<IAutoMovieColor, "r" | "g" | "b"> {
    return analysisRampColorImplementation(position);
  }

  /** Build and return a drawable point field for one solved analysis metric. */
  export function build(
    props: IBuildProps,
  ): IAutoMovieRenderAnalysisOverlayObject {
    return buildAnalysisOverlayObjectImplementation(props);
  }
}
