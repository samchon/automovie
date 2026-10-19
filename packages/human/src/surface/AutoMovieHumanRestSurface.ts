import type { IAutoMovieModel, IAutoMovieModelPart } from "@automovie/interface";

import { dressAutoMovieHumanSkin } from "../appearance/dressAutoMovieHumanSkin";
import { AUTOMOVIE_HUMAN_SKIN_MATERIAL } from "../human/AUTOMOVIE_HUMAN_SKIN_MATERIAL";
import type { IAutoMovieHumanMeasurements } from "../measure/IAutoMovieHumanMeasurements";
import { skinAutoMovieHumanSurface } from "../rig/skinAutoMovieHumanSurface";
import type { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import type { IAutoMovieHumanAppearance } from "../structures/IAutoMovieHumanAppearance";
import type { IAutoMovieHumanConstructionNet } from "../structures/IAutoMovieHumanConstructionNet";
import type { IAutoMovieHumanSurfaceMeasurements } from "../structures/IAutoMovieHumanSurfaceMeasurements";
import { generateAutoMovieHumanSurfaceDefinition } from "./generateAutoMovieHumanSurfaceDefinition";
import { inspectAutoMovieHumanSurface } from "./inspectAutoMovieHumanSurface";
import { realizeAutoMovieHumanSurface64 } from "./realizeAutoMovieHumanSurface64";

/**
 * Own one successful parameter-generated rest field for an immutable person.
 * Model and construction read the same coefficients and realized triangle
 * ownership. A refused edit leaves the previous cache intact, but is thrown to
 * its caller rather than returned as that edit's geometry. The model carries
 * only implemented exterior charts; no cage, reference mesh or attachment
 * from a missing chart supplies an invisible fallback.
 *
 * The exact document serialization keys this one-entry cache. Identity and
 * skeleton belong to the owning Human instance. Realization is O(V+F), and the
 * entry retains one mesh, owner cuts and inspection until replacement or owner
 * release. Returned documents are copied so callers cannot mutate the cache.
 */
export class AutoMovieHumanRestSurface {
  private cached: {key: string; value: AutoMovieHumanRestSurface.Result} | undefined;

  /** Borrow the person's admitted physical identity and its one T-rest skeleton. */
  public constructor(private readonly person: {
    measurements: IAutoMovieHumanMeasurements;
    skeleton: IAutoMovieHumanSkeleton;
  }) {}

  /** Admit/generate one physical target document; every returned net restricts this field. */
  public inspect(input: IAutoMovieHumanSurfaceMeasurements): AutoMovieHumanRestSurface.Result {
    const key: string = JSON.stringify(input);
    if (this.cached?.key === key) return structuredClone(this.cached.value);
    const definition: ReturnType<typeof generateAutoMovieHumanSurfaceDefinition> =
      generateAutoMovieHumanSurfaceDefinition({skeleton: this.person.skeleton, measurements: input});
    const surface: ReturnType<typeof realizeAutoMovieHumanSurface64> =
      realizeAutoMovieHumanSurface64(definition);
    const part: IAutoMovieModelPart = {
      id: "skin", name: "Generated rest surface (partial)",
      geometry: {type: "mesh", mesh: {
        ...surface.mesh,
        skin: skinAutoMovieHumanSurface({
          mesh: surface.mesh, trianglePatches: surface.trianglePatches,
          definition, skeleton: this.person.skeleton,
        }),
      }},
      material: AUTOMOVIE_HUMAN_SKIN_MATERIAL.id,
      attachedBone: null, transform: null,
    };
    const value: AutoMovieHumanRestSurface.Result = {
      status: "partial", revision: definition.revision,
      measurements: structuredClone(input), parts: [part],
      construction: inspectAutoMovieHumanSurface(definition),
      boundaries: structuredClone(definition.boundaries),
      realizationComplete: surface.complete,
      approximationQualified: surface.approximationQualified,
      diagnostics: surface.diagnostics,
    };
    this.cached = {key, value};
    return structuredClone(value);
  }

  /** Dress the same partial rest mesh with pigmentation and a plain finish. */
  public model(props: {
    id: string;
    input: IAutoMovieHumanSurfaceMeasurements;
    appearance: IAutoMovieHumanAppearance;
    skeleton: IAutoMovieModel["skeleton"];
  }): IAutoMovieModel {
    const rest: AutoMovieHumanRestSurface.Result = this.inspect(props.input);
    const dressed: ReturnType<typeof dressAutoMovieHumanSkin> = dressAutoMovieHumanSkin({
      parts: rest.parts, measurements: this.person.measurements,
      skeleton: this.person.skeleton, skin: props.appearance.skin,
      features: null, relief: null,
    });
    return {
      id: props.id, name: "Generated rest surface (partial)", origin: "generated",
      parts: dressed.parts, skeleton: props.skeleton, body: null,
      materials: [{...dressed.material, name: "skin, physical-rest-field-1 (plain)"}], images: dressed.images,
    };
  }
}

/** Inspectable output of this actual, possibly incomplete, surface consumer. */
export namespace AutoMovieHumanRestSurface {
  /**
   * Partial generated exterior with exact ownership and scoped diagnostics.
   * No field in this record certifies anatomical fit or population coverage.
   *
   * @author Samchon
   */
  export interface Result {
    /** The current anatomical layout has explicit unimplemented incident regions. */
    status: "partial";

    /** Actual equation/topology revision. */
    revision: string;

    /** Physical target document consumed by these coefficients. */
    measurements: IAutoMovieHumanSurfaceMeasurements;

    /** Same realized skin used by model(), before its appearance is dressed. */
    parts: IAutoMovieModelPart[];

    /** Actual polynomial restrictions and controls of the generated exterior. */
    construction: IAutoMovieHumanConstructionNet[];

    /** Position/fullJ owner cuts, including missing incident regions. */
    boundaries: ReturnType<typeof generateAutoMovieHumanSurfaceDefinition>["boundaries"];

    /** Whether the core emitted every requested patch within its resource budget. */
    realizationComplete: boolean;

    /** Core approximation status, separate from anatomical completeness. */
    approximationQualified: boolean;

    /** Missing regions, measurement qualification and actual numerical findings. */
    diagnostics: string[];
  }
}
