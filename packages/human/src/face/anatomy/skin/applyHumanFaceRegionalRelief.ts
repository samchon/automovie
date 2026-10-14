import { findHumanSkinLandmark } from "../../../common/basis/findHumanSkinLandmark";
import { readHumanFaceLipMarginPoints } from "../../basis/readHumanFaceLipMarginPoints";
import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceSkinRelief } from "../../structures/IAutoMovieHumanFaceSkinRelief";
import type { IAutoMovieHumanFaceRegionalRelief } from "../../structures/IAutoMovieHumanFaceRegionalRelief";
import { applyHumanFaceSkinCourseRelief } from "./applyHumanFaceSkinCourseRelief";
import { createHumanFaceSkinHost } from "./createHumanFaceSkinHost";
import { createHumanFaceSkinMaterialCourse } from "./createHumanFaceSkinMaterialCourse";
import type { IHumanFaceSkinMaterialGuidePoint } from "./IHumanFaceSkinMaterialGuidePoint";
import type { IAutoMovieHumanSkinLandmark as IAutoMovieHumanSkinLandmarkImported } from "../../../common/basis/IAutoMovieHumanSkinLandmark";
import type { IAutoMovieHumanFaceBasisSurface as IAutoMovieHumanFaceBasisSurfaceImported } from "../../structures/IAutoMovieHumanFaceBasisSurface";
import type { IHumanFaceLipMarginPoints as IHumanFaceLipMarginPointsImported } from "../../basis/IHumanFaceLipMarginPoints";
import type { IHumanFaceLipMarginPoint as IHumanFaceLipMarginPointImported } from "../../basis/IHumanFaceLipMarginPoint";
import type { IHumanFaceSkinHost as IHumanFaceSkinHostImported } from "./IHumanFaceSkinHost";


/**
 * Shape forehead, glabellar, marionette, philtral and perioral relief on the
 * actual connected anterior skin. The source landmarks define coarse visible
 * courses; the forehead's author supplies length/height and the glabellar
 * course its length. These are source-frame construction conventions, not
 * measured crease trajectories, age reconstruction or hidden tissue anatomy.
 * Ocular/lower-lid sections belong exclusively to the ocular cage owner.
 *
 * The shared course kernel seats each course on the current skin and
 * displaces along the skin's own smooth normal: a positive offset raises the
 * skin and a negative one presses it in, whichever way the skin faces.
 * Every region samples the same immutable input and adds to one owned copy.
 * A registered material chart compiles a continuous native course independent
 * of width. Its source-owned positive disk retains every native guide anchor.
 * Forehead and glabellar use registered glabella support and convert their
 * finite dimensioned guides once on the same shape-only reference skin.
 * Unsupported source coverage and continuation refuse. This representation
 * replaces a width-dependent sampled curve, so affected identity references,
 * source derivatives and assembled observations require regeneration.
 * Endpoint fade holds all source landmarks and the complete lip margin, and
 * side-specific courses affect only their own midsagittal half. Persistent
 * signed relief and independent performed fold fractions remain separate.
 * For the shape-only reference, the orchestrator omits performance values.
 * Clinical observations never enter this displacement owner.
 *
 * @evidence contracts/common.md#principled-implementation Registered landmarks and the shape-only material reference define supported regional courses; signed rest minus performed fold depth converts once to metres and accumulates on the same unchanged skin while holding source landmarks and lip support.
 * @evidence contracts/common.md#clear-and-simple-design One region loop owns course-role admission and one shared skin host; existing chart/kernel owners retain correspondence and displacement, with ocular deformation left to its cage owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Named regions select actual anatomical registrations; clinical grades, free sculpt curves, unsupported dimension overrides and ineffective active widths do not receive fallback geometry or clamped values.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies conventional rather than measured trajectories, reference/performance separation, held anatomy, missing-support refusal and regeneration of contact/normal derivatives.
 * @evidence contracts/performance.md#efficient-algorithms Up to eight supported regions each compile their native chart and scan V vertices against S course spans, costing O(VS) per active course plus exact chart work; one host/position copy and one complete lip/landmark collection serve the application.
 * @evidence contracts/performance.md#reuse-equivalent-work Regions share immutable source positions and welded host normals, while each distinct registered domain owns its course; a moved skin or changed reference invalidates those courses rather than reusing physical metrics across states.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Held/support sets, host, courses and changed positions are invocation-local and scale with actual native geometry; failed courses discard the local output, and only completed active positions enter the returned map.
 *
 * @author Samchon
 */
export function applyHumanFaceRegionalRelief(
  basis: IAutoMovieHumanFaceBasis,
  positions: ReadonlyMap<string, readonly number[]>,
  relief: IAutoMovieHumanFaceSkinRelief | undefined,
  reference: ReadonlyMap<string, readonly number[]>,
): ReadonlyMap<string, readonly number[]> {
  if (relief?.regions === undefined) return positions;
  const glabella: IAutoMovieHumanSkinLandmarkImported | undefined = findHumanSkinLandmark(basis, "glabella");
  const surface: IAutoMovieHumanFaceBasisSurfaceImported | undefined =
    glabella === undefined ? undefined : basis.surfaces[glabella.surface];
  const source: readonly number[] | undefined = surface === undefined ? undefined : positions.get(surface.id);
  if (
    source === undefined ||
    surface === undefined ||
    glabella === undefined ||
    basis.contact?.lips.surface !== surface.id ||
    basis.contact.margin === undefined
  )
    throw new Error(
      "Regional skin relief needs registered connected head skin and complete lip ports.",
    );
  const margin: IHumanFaceLipMarginPointsImported = readHumanFaceLipMarginPoints(surface, basis.contact.margin, source);
  const held: Set<number> = new Set([
    ...[...margin.upper, ...margin.lower].flatMap((point: IHumanFaceLipMarginPointImported): number[]  =>
      point.vertices.filter((_: number, axis: number): boolean  => point.weights[axis] !== 0)),
    ...Object.values(basis.skinLandmarks ?? {})
      .filter((landmark: IAutoMovieHumanSkinLandmarkImported): boolean  => landmark.surface === glabella.surface)
      .map((landmark: IAutoMovieHumanSkinLandmarkImported): number  => landmark.vertex),
  ]);
  const supportVertices: Set<number> = new Set<number>();
  const point: (name: string) => number[] = (name: string): number[] => {
    const landmark: IAutoMovieHumanSkinLandmarkImported | undefined = findHumanSkinLandmark(basis, name);
    if (landmark === undefined || landmark.surface !== glabella.surface)
      throw new Error(
        "Regional skin relief needs a registered source landmark: " + name,
      );
    supportVertices.add(landmark.vertex);
    return source.slice(3 * landmark.vertex, 3 * landmark.vertex + 3);
  };
  const host: IHumanFaceSkinHostImported = createHumanFaceSkinHost(surface.indices, source);
  const changed: number[] = [...source];
  let active: boolean = false;
  const regions: [string, IAutoMovieHumanFaceRegionalRelief | undefined][] = Object.entries(relief.regions);
  for (const [name, settings] of regions) {
    if (settings === undefined) continue;
    supportVertices.clear();
    const rest: number = settings.restOffsetMm ?? 0,
      fold: number = settings.foldDepthMm ?? 0,
      performance: number = settings.performance ?? 0;
    if (
      ![rest, fold, performance, settings.widthMm].every(Number.isFinite) ||
      fold < 0 ||
      performance < 0 ||
      performance > 1 ||
      settings.widthMm <= 0
    )
      throw new Error(
        "Regional skin " +
          name +
          " needs finite offsets, nonnegative fold depth, positive width and a performed fraction in [0,1].",
      );
    const offset: number = (rest - fold * performance) / 1000,
      width: number = settings.widthMm / 1000;
    if (!Number.isFinite(offset) || !(width > 0))
      throw new Error(
        "Regional skin dimensions must be representable in metres: " + name,
      );
    if (
      (settings.lengthMm !== undefined &&
        (!Number.isFinite(settings.lengthMm) || settings.lengthMm <= 0)) ||
      (settings.elevationMm !== undefined &&
        (!Number.isFinite(settings.elevationMm) || settings.elevationMm < 0))
    )
      throw new Error(
        "Regional skin guide dimensions are unsupported: " + name,
      );
    let guide: number[][];
    const side: 0 | 1 | -1 = name.endsWith("Left") ? 1 : name.endsWith("Right") ? -1 : 0;
    if (name === "forehead" || name === "glabellar") {
      if (
        settings.lengthMm === undefined ||
        (name === "forehead" && settings.elevationMm === undefined)
      )
        throw new Error(
          "Regional " +
            name +
            " requires an explicitly authored source-guide length/height.",
        );
      const anchor: number[] = point("glabella"),
        length: number = settings.lengthMm / 1000;
      guide =
        name === "forehead"
          ? [
              [
                anchor[0] - length / 2,
                anchor[1] + settings.elevationMm! / 1000,
                anchor[2],
              ],
              [
                anchor[0] + length / 2,
                anchor[1] + settings.elevationMm! / 1000,
                anchor[2],
              ],
            ]
          : [anchor, [anchor[0], anchor[1] + length, anchor[2]]];
    } else if (name === "marionetteLeft" || name === "marionetteRight")
      guide = [
        point("cheilion-" + (side > 0 ? "left" : "right")),
        point("gnathion"),
      ];
    else if (name === "philtralLeft" || name === "philtralRight")
      guide = [
        point("crista-philtri-" + (side > 0 ? "left" : "right")),
        point("subnasale"),
      ];
    else if (name === "perioralUpper" || name === "perioralLower")
      guide = [
        point("cheilion-right"),
        point(
          name === "perioralUpper" ? "labiale-superius" : "labiale-inferius",
        ),
        point("cheilion-left"),
      ];
    else throw new Error("Unsupported regional skin source course: " + name);
    if (
      name !== "forehead" &&
      name !== "glabellar" &&
      (settings.lengthMm !== undefined || settings.elevationMm !== undefined)
    )
      throw new Error(
        "Only forehead/glabellar source courses accept authored guide dimensions.",
      );
    if (name === "glabellar" && settings.elevationMm !== undefined)
      throw new Error(
        "Glabellar source course starts at its registered glabella without an elevation override.",
      );
    // The admission of a course keeps its original frontal-projection measure.
    const lengths: number[] = guide
      .slice(1)
      .map((b: number[], k: number): number  => Math.hypot(b[0] - guide[k][0], b[1] - guide[k][1]));
    const total: number = lengths.reduce((sum: number, length: number): number  => sum + length, 0);
    if (!(total > 0) || !Number.isFinite(total))
      throw new Error(
        "Regional skin source course has no finite projected length: " + name,
      );
    if (width > total)
      throw new Error(
        "Regional skin width exceeds its current source-course length: " + name,
      );
    if (offset === 0) continue;
    const anchors: number[] = [...supportVertices];
    const materialGuide: IHumanFaceSkinMaterialGuidePoint[] =
      name === "forehead" || name === "glabellar"
        ? (name === "forehead"
            ? [[-settings.lengthMm! / 2000, settings.elevationMm! / 1000, 0],
               [settings.lengthMm! / 2000, settings.elevationMm! / 1000, 0]]
            : [[0, 0, 0], [0, settings.lengthMm! / 1000, 0]])
          .map((displacement: number[]): { vertex: number; displacement: number[]; }  => ({
            vertex: glabella.vertex,
            displacement,
          }))
        : anchors.map((vertex: number): { vertex: number; }  => ({ vertex }));
    const supported: boolean = applyHumanFaceSkinCourseRelief({
      host,
      source,
      changed,
      course: createHumanFaceSkinMaterialCourse({
        host,
        surface,
        referencePositions: reference.get(surface.id) ?? [],
        domain: name,
        supportVertices: [...supportVertices],
        guide: materialGuide,
      }),
      widthMetres: width,
      offsetMetres: offset,
      held,
      side: side as -1 | 0 | 1,
    });
    if (!supported)
      throw new Error(
        "Regional skin width has no contributing source sample: " + name,
      );
    active = true;
  }
  if (!active) return positions;
  const output: Map<string, readonly number[]> = new Map(positions);
  output.set(surface.id, changed);
  return output;
}
