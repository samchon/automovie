import type {
  IAutoMovieBicubicAtlasGeometry,
  IAutoMovieEllipticLoft,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Form a shared bicubic atlas from cubic centre and ellipse-radius profiles.
 * Each quarter uses the tangent-matching circular cubic with
 * k = 4 (sqrt(2) - 1) / 3. Its radial deviation from the unit circle is below
 * 0.000273: differentiating x(t)^2 + z(t)^2 locates the interior extrema.
 * Applying the diagonal ellipse scale bounds the section's Hausdorff deviation
 * by that constant times its largest half-axis. This is a separate geometric
 * approximation from the atlas-to-triangle tolerance and any observation error.
 * Clockwise angular U and increasing physical Y make U cross V outward.
 * Adjacent spans share coefficient identity at equal endpoints; each patch keeps
 * its own analytic normal fan so a C0-only axial join retains both limits.
 * C1 remains the caller's constraint rather than an inferred property.
 *
 * @evidence contracts/common.md#principled-implementation Tensor products of the same cubic axial profiles and four standard cubic quarter arcs define every surface coefficient. Positive radius controls and increasing Y preserve an open regular section family; the explicit circular approximation bound is independent of tessellation and source fit.
 * @evidence contracts/common.md#clear-and-simple-design This generic engine producer turns one pure section-family contract into the existing bicubic geometry arm, reusing its admission, adaptive tessellation and viewer consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Shared row and angular indices own exact seams rather than coordinate welding. No source samples, copied mesh, end cap, fitted fixture constant or normal field enters generation.
 * @evidence contracts/common.md#meaningful-documentation Gives local metre axes, cubic coefficient semantics, circular approximation derivation, orientation, continuity limits, open ends and refusal behavior.
 * @evidence contracts/performance.md#efficient-algorithms For S spans the producer validates O(S) profiles and creates 12(3S+1) controls and 4S patches, linear in the required coefficient output; tessellation is deferred to its existing bounded owner.
 * @evidence contracts/performance.md#reuse-equivalent-work One angular coefficient ring and one shared row per physical span boundary supply all patches, without regenerating geometry for construction or a camera change.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No state survives except the caller-owned atlas and scalar deviation bound. The input profiles are borrowed synchronously and no I/O, process, handle or global cache is acquired.
 */
export function createAutoMovieEllipticLoftAtlas(input: {
  loft: IAutoMovieEllipticLoft;
  topologyDomain: string;
  tolerance: number;
  maxCells: number;
  maxVertices: number;
}): { geometry: IAutoMovieBicubicAtlasGeometry; arcDeviationBound: number } {
  if (
    !input ||
    !input.loft ||
    !Array.isArray(input.loft.spans) ||
    !input.loft.spans.length ||
    typeof input.topologyDomain !== "string" ||
    !input.topologyDomain.trim() ||
    !Number.isFinite(input.tolerance) ||
    input.tolerance <= 0 ||
    !Number.isSafeInteger(input.maxCells) ||
    input.maxCells <= 0 ||
    !Number.isSafeInteger(input.maxVertices) ||
    input.maxVertices <= 0
  )
    throw new Error(
      "An ordered elliptic loft, identity and positive atlas budgets are required",
    );
  const fields: readonly ("radiusX" | "radiusZ" | "centreX" | "centreZ")[] = [
    "radiusX",
    "radiusZ",
    "centreX",
    "centreZ",
  ];
  let maximumRadius: number = 0;
  for (let index: number = 0; index < input.loft.spans.length; index++) {
    const span: IAutoMovieEllipticLoft["spans"][number] =
      input.loft.spans[index];
    const previous: IAutoMovieEllipticLoft["spans"][number] | undefined =
      input.loft.spans[index - 1];
    if (
      !span ||
      !Array.isArray(span.interval) ||
      span.interval.length !== 2 ||
      !Number.isFinite(span.interval[0]) ||
      !Number.isFinite(span.interval[1]) ||
      !(span.interval[0] < span.interval[1]) ||
      !Number.isFinite(span.interval[1] - span.interval[0]) ||
      (previous !== undefined && previous.interval[1] !== span.interval[0])
    )
      throw new Error(
        "Elliptic loft intervals must be finite, increasing and exactly adjacent",
      );
    for (const field of fields) {
      if (!Array.isArray(span[field]) || span[field].length !== 4)
        throw new Error("Every elliptic profile needs four Bernstein controls");
      for (let control: number = 0; control < 4; control++) {
        const value: number = span[field][control];
        if (
          !Number.isFinite(value) ||
          ((field === "radiusX" || field === "radiusZ") && value <= 0)
        )
          throw new Error(
            "Elliptic radii need positive finite controls and centres need finite controls",
          );
        if (field === "radiusX" || field === "radiusZ")
          maximumRadius = Math.max(maximumRadius, value);
      }
      if (previous !== undefined && previous[field][3] !== span[field][0])
        throw new Error(
          "Adjacent elliptic profiles must share their endpoint coefficients exactly",
        );
    }
  }
  const k: number = (4 * (Math.SQRT2 - 1)) / 3;
  const circle: readonly [number, number][] = [
    [1, 0],
    [1, -k],
    [k, -1],
    [0, -1],
    [-k, -1],
    [-1, -k],
    [-1, 0],
    [-1, k],
    [-k, 1],
    [0, 1],
    [k, 1],
    [1, k],
  ];
  const controls: IAutoMovieVector3[] = [];
  const patches: IAutoMovieBicubicAtlasGeometry["patches"] = [];
  for (let index: number = 0; index < input.loft.spans.length; index++) {
    const span: IAutoMovieEllipticLoft["spans"][number] =
      input.loft.spans[index];
    for (let row: number = index === 0 ? 0 : 1; row < 4; row++)
      for (const angular of circle) {
        const x: number = span.centreX[row] + span.radiusX[row] * angular[0];
        const y: number =
          span.interval[0] + (span.interval[1] - span.interval[0]) * (row / 3);
        const z: number = span.centreZ[row] + span.radiusZ[row] * angular[1];
        if (![x, y, z].every(Number.isFinite))
          throw new Error(
            "Elliptic tensor coefficient arithmetic exceeded finite coordinates",
          );
        controls.push({ x, y, z });
      }
    for (let quarter: number = 0; quarter < 4; quarter++) {
      const controlIds: number[] = [];
      for (let row: number = 0; row < 4; row++)
        for (let angular: number = 0; angular < 4; angular++)
          controlIds.push(
            12 * (3 * index + row) + ((3 * quarter + angular) % 12),
          );
      patches.push({ id: `span.${index}.quarter.${quarter}`, controlIds });
    }
  }
  const boundaryAuthorities: NonNullable<IAutoMovieBicubicAtlasGeometry["boundaryAuthorities"]> = [];
  const boundaryBindings: NonNullable<IAutoMovieBicubicAtlasGeometry["boundaryBindings"]> = [];
  const authorities: Map<string,string> = new Map();
  const sides: readonly (readonly number[])[] = [[0,1,2,3],[3,7,11,15],[12,13,14,15],[0,4,8,12]];
  for (const patch of patches)
    for (let side: number = 0; side < 4; side++) {
      const ids: number[] = sides[side].map((slot:number):number=>patch.controlIds[slot]);
      const reversed: boolean = ids[0] > ids[3];
      const canonical: [number,number,number,number] = (reversed ? [...ids].reverse() : ids) as [number,number,number,number];
      const key: string = canonical.join(":");
      let authority: string | undefined = authorities.get(key);
      if (authority === undefined) {
        authority = `edge.${authorities.size}`;
        authorities.set(key,authority);
        boundaryAuthorities.push({id:authority,controlIds:canonical});
      }
      boundaryBindings.push({patch:patch.id,side:side as 0|1|2|3,authority,
        start:reversed?1:0,end:reversed?0:1,normalFan:patch.id});
    }
  return {
    geometry: {
      type: "bicubic-atlas",
      topologyDomain: input.topologyDomain,
      controls,
      patches,
      boundaryAuthorities,
      boundaryBindings,
      tolerance: input.tolerance,
      maxCells: input.maxCells,
      maxVertices: input.maxVertices,
    },
    arcDeviationBound: 0.000273 * maximumRadius,
  };
}
