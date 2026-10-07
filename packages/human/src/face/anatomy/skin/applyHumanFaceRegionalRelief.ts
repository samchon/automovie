import { findHumanSkinLandmark } from "../../../common/basis/findHumanSkinLandmark";
import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceSkinRelief } from "../../structures/IAutoMovieHumanFaceSkinRelief";
import { applyHumanFaceSkinCourseRelief } from "./applyHumanFaceSkinCourseRelief";
import { createHumanFaceSkinHost } from "./createHumanFaceSkinHost";
import { createHumanFaceSkinMaterialCourse } from "./createHumanFaceSkinMaterialCourse";
import type { IHumanFaceSkinMaterialGuidePoint } from "./IHumanFaceSkinMaterialGuidePoint";

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
 * dimensioned displacements through its reference facet differential.
 * Unsupported source coverage and continuation refuse. This representation
 * replaces a width-dependent sampled curve, so affected identity references,
 * source derivatives and assembled observations require regeneration.
 * Endpoint fade holds all source landmarks and the complete lip margin, and
 * side-specific courses affect only their own midsagittal half. Persistent
 * signed relief and independent performed fold fractions remain separate.
 * For the shape-only reference, the orchestrator omits performance values.
 * Clinical observations never enter this displacement owner.
 *
 * @evidence contracts/common.md#principled-implementation Actual source landmarks define courses that the shared course kernel seats on the skin and displaces along its normal; independent contributions accumulate from immutable geometry before contact and common normals.
 * @evidence contracts/common.md#clear-and-simple-design One regional skin owner; optical sections remain with their separate source cage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No clinical-grade, age-to-depth or Portrait/card-host substitution enters.
 * @evidence contracts/common.md#meaningful-documentation States guide conventions, signed identity, performance, immutable sampling, source resolution and clinical limits.
 * @evidence contracts/modeling.md#part-identity-and-grouping Shapes named regions of the same connected skin and adds no independent surface part.
 * @evidence contracts/modeling.md#parameter-channels Regional signed offsets and fold fractions are independent of original source expression and clinical grades.
 * @evidence contracts/modeling.md#shared-boundaries Complete source lip margins and registered landmark vertices remain exact; whole contact still judges neighboring tissue.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres convert once into Y-up head-frame metres; positive offset is along the outward skin normal.
 * @evidence contracts/modeling.md#emitted-geometry Adds no vertex or triangle and remains limited by the actual source sampling.
 * @evidence contracts/anatomy.md#anatomical-source Source-landmark courses and compact support are authored visible shape conventions without a clinical crease, population or tissue-mechanics claim.
 * @evidence contracts/anatomy.md#permitted-range Finite representable dimensions, fraction domain and actual contributing source samples are required without clinical bounds or clamps.
 * @evidence contracts/anatomy.md#parametric-authority Only named regional numerical traits enter; no personal curves or vertices can be supplied.
 * @author Samchon
 */
export function applyHumanFaceRegionalRelief(
  basis: IAutoMovieHumanFaceBasis,
  positions: ReadonlyMap<string, readonly number[]>,
  relief: IAutoMovieHumanFaceSkinRelief | undefined,
): ReadonlyMap<string, readonly number[]> {
  if (relief?.regions === undefined) return positions;
  const glabella = findHumanSkinLandmark(basis, "glabella");
  const surface =
    glabella === undefined ? undefined : basis.surfaces[glabella.surface];
  const source = surface === undefined ? undefined : positions.get(surface.id);
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
  const held = new Set([
    ...basis.contact.margin.upper,
    ...basis.contact.margin.lower,
    ...Object.values(basis.skinLandmarks ?? {})
      .filter((landmark) => landmark.surface === glabella.surface)
      .map((landmark) => landmark.vertex),
  ]);
  const supportVertices = new Set<number>();
  const point = (name: string): number[] => {
    const landmark = findHumanSkinLandmark(basis, name);
    if (landmark === undefined || landmark.surface !== glabella.surface)
      throw new Error(
        "Regional skin relief needs a registered source landmark: " + name,
      );
    supportVertices.add(landmark.vertex);
    return source.slice(3 * landmark.vertex, 3 * landmark.vertex + 3);
  };
  const host = createHumanFaceSkinHost(surface.indices, source);
  const changed = [...source];
  let active = false;
  for (const [name, settings] of Object.entries(relief.regions)) {
    if (settings === undefined) continue;
    supportVertices.clear();
    const rest = settings.restOffsetMm ?? 0,
      fold = settings.foldDepthMm ?? 0,
      performance = settings.performance ?? 0;
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
    const offset = (rest - fold * performance) / 1000,
      width = settings.widthMm / 1000;
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
    const side = name.endsWith("Left") ? 1 : name.endsWith("Right") ? -1 : 0;
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
      const anchor = point("glabella"),
        length = settings.lengthMm / 1000;
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
    const lengths = guide
      .slice(1)
      .map((b, k) => Math.hypot(b[0] - guide[k][0], b[1] - guide[k][1]));
    const total = lengths.reduce((sum, length) => sum + length, 0);
    if (!(total > 0) || !Number.isFinite(total))
      throw new Error(
        "Regional skin source course has no finite projected length: " + name,
      );
    if (width > total)
      throw new Error(
        "Regional skin width exceeds its current source-course length: " + name,
      );
    if (offset === 0) continue;
    const anchors = [...supportVertices];
    const materialGuide: IHumanFaceSkinMaterialGuidePoint[] =
      name === "forehead" || name === "glabellar"
        ? (name === "forehead"
            ? [[-settings.lengthMm! / 2000, settings.elevationMm! / 1000, 0],
               [settings.lengthMm! / 2000, settings.elevationMm! / 1000, 0]]
            : [[0, 0, 0], [0, settings.lengthMm! / 1000, 0]])
          .map((displacement) => ({
            vertex: glabella.vertex,
            displacement,
          }))
        : anchors.map((vertex) => ({ vertex }));
    const supported = applyHumanFaceSkinCourseRelief({
      host,
      source,
      changed,
      course: createHumanFaceSkinMaterialCourse({
        host,
        surface,
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
  const output = new Map(positions);
  output.set(surface.id, changed);
  return output;
}
