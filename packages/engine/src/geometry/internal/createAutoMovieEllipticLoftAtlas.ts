import type {
  IAutoMovieBicubicAtlasGeometry,
  IAutoMovieCreateEllipticLoftAtlas,
  IAutoMovieEllipticLoft,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * Form a shared bicubic atlas from cubic centre and ellipse-radius profiles.
 * Each quarter uses the tangent-matching circular cubic with k = 4 (sqrt(2) -
 *
 * 1. / 3. Its radial deviation from the unit circle is below 0.000273:
 *    differentiating x(t)^2 + z(t)^2 locates the interior extrema. Applying the
 *    diagonal ellipse scale bounds the section's Hausdorff deviation by that
 *    constant times its largest half-axis. This is a separate geometric
 *    approximation from the atlas-to-triangle tolerance and any observation
 *    error. Clockwise angular U and increasing physical Y make U cross V
 *    outward. Adjacent spans share coefficient identity at equal endpoints;
 *    each patch keeps its own analytic normal fan so a C0-only axial join
 *    retains both limits. C1 remains the caller's constraint rather than an
 *    inferred property.
 */
export function createAutoMovieEllipticLoftAtlas(
  input: IAutoMovieCreateEllipticLoftAtlas.IInput,
): IAutoMovieCreateEllipticLoftAtlas.IResult {
  if (
    !input.loft.spans.length ||
    !input.topologyDomain.trim() ||
    input.tolerance <= 0 ||
    input.maxCells <= 0 ||
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
      !(span.interval.lowerY < span.interval.upperY) ||
      (previous !== undefined &&
        previous.interval.upperY !== span.interval.lowerY)
    )
      throw new Error(
        "Elliptic loft intervals must be finite, increasing and exactly adjacent",
      );
    for (const field of fields) {
      if (span[field].length !== 4)
        throw new Error("Every elliptic profile needs four Bernstein controls");
      for (let control: number = 0; control < 4; control++) {
        const value: number = span[field][control];
        if ((field === "radiusX" || field === "radiusZ") && value <= 0)
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
          span.interval.lowerY +
          (span.interval.upperY - span.interval.lowerY) * (row / 3);
        const z: number = span.centreZ[row] + span.radiusZ[row] * angular[1];
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
  const boundaryAuthorities: NonNullable<
    IAutoMovieBicubicAtlasGeometry["boundaryAuthorities"]
  > = [];
  const boundaryBindings: NonNullable<
    IAutoMovieBicubicAtlasGeometry["boundaryBindings"]
  > = [];
  const authorities: Map<string, string> = new Map();
  const sides: readonly (readonly number[])[] = [
    [0, 1, 2, 3],
    [3, 7, 11, 15],
    [12, 13, 14, 15],
    [0, 4, 8, 12],
  ];
  for (const patch of patches)
    for (let side: number = 0; side < 4; side++) {
      const ids: number[] = sides[side].map(
        (slot: number): number => patch.controlIds[slot],
      );
      const reversed: boolean = ids[0] > ids[3];
      const canonical: [number, number, number, number] = (
        reversed ? [...ids].reverse() : ids
      ) as [number, number, number, number];
      const key: string = canonical.join(":");
      let authority: string | undefined = authorities.get(key);
      if (authority === undefined) {
        authority = `edge.${authorities.size}`;
        authorities.set(key, authority);
        boundaryAuthorities.push({ id: authority, controlIds: canonical });
      }
      boundaryBindings.push({
        patch: patch.id,
        side: side as 0 | 1 | 2 | 3,
        authority,
        start: reversed ? 1 : 0,
        end: reversed ? 0 : 1,
        normalFan: patch.id,
      });
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
