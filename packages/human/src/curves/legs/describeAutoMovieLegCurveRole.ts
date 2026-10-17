/**
 * Classify only courses and meridians emitted by the leg producer.
 * Muscle-direction and patellar-axis meridians remain generating guides, not
 * measured anatomical borders or separate feature/skin primitives.
 * Unknown names retain an explicit unspecified role in the common viewer.
 *
 * @author Samchon
 */
export function describeAutoMovieLegCurveRole(
  name: string,
): "section" | "guide" | "feature" | "unspecified" {
  const match: RegExpMatchArray | null = /^legs\.(left|right)\.(.+)$/.exec(
    name,
  );
  if (match === null) return "unspecified";
  const local: string = match[2]!;
  const courses: readonly string[] = [
    "thighNative",
    "vastusLateralisProxy",
    "thighLower",
    "vastusMedialisProxy",
    "aboveKnee",
    "kneeNative",
    "patellaInferior",
    "belowKnee",
    "calfLateralProxy",
    "calfNative",
    "calfMedialProxy",
    "lowerCalf",
    "ankleAbove",
  ];
  const guides: readonly string[] = [
    "cardinal0",
    "cardinal1",
    "cardinal2",
    "cardinal3",
    "lateralThighToFibularSide",
    "anteriorQuadricepsToShin",
    "medialThighToMedialCalf",
    "posteriorHamstringToCalf",
    "anteriorThighSurfaceAxis",
    "patellarSurfaceAxis",
    "patellarTendonSurfaceAxis",
    "tibialAnteriorSurfaceAxis",
    "vastusLateralisSurfaceGuide",
    "vastusMedialisSurfaceGuide",
    "medialHamstringSurfaceGuide",
    "lateralHamstringSurfaceGuide",
    "anteriorLateralShinSurfaceGuide",
    "medialShinSurfaceGuide",
    "medialGastrocnemiusSurfaceGuide",
    "lateralGastrocnemiusSurfaceGuide",
  ];
  if (local.startsWith("section.") && courses.includes(local.slice(8)))
    return "section";
  return guides.includes(local) ? "guide" : "unspecified";
}
