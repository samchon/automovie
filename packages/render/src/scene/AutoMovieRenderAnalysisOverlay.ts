import type { IAutoMovieAnalysisRun, IAutoMovieColor } from "@automovie/interface";
import type * as THREE from "three";

import { autoMovieAnalysisRampColor as autoMovieAnalysisRampColorImplementation } from "./internal/autoMovieAnalysisRampColor.js";
import { buildAnalysisOverlayObject as buildAnalysisOverlayObjectImplementation } from "./internal/buildAnalysisOverlayObject.js";
import type { IAutoMovieAnalysisOverlayObject } from "./IAutoMovieAnalysisOverlayObject.js";

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
    domain?: { min: number; max: number };
    /** Optional caller-owned point material. */
    material?: THREE.PointsMaterial;
  }

  /** Map a normalized `[0, 1]` position to the blue-green-red ramp. */
  export function rampColor(
    position: number,
  ): Pick<IAutoMovieColor, "r" | "g" | "b"> {
    return autoMovieAnalysisRampColorImplementation(position);
  }

  /** Build and return a drawable point field for one solved analysis metric. */
  export function build(
    props: IBuildProps,
  ): IAutoMovieAnalysisOverlayObject {
    return buildAnalysisOverlayObjectImplementation(props);
  }
}
