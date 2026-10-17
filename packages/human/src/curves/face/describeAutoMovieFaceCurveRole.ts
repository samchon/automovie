/** Describe the actual named face-family construction without asserting a skin boundary.
 *
 * Closed cranial and neck supports are sections. Longitudinal, jaw-floor,
 * collar diagnostic and conventional insertion courses are guides. Facial
 * margins and named auricular courses are features; this role does not prove
 * visibility, cavity topology or anatomical fit. Unknown identifiers remain
 * unspecified so new courses require an explicit owner decision.
 *
 * @param name Exact generated course name, without an assembly gate prefix.
 * @returns The construction responsibility of an established owned course.
 */
export function describeAutoMovieFaceCurveRole(
  name: string,
): "section" | "guide" | "feature" | "unspecified" {
  if (
    /^skull\.section\.(upperCrown|upperVault|cranialBreadth|temple|zygomaticBand|upperMouthBand|mandibleBand|chinProminence|evaluated)$/.test(
      name,
    ) ||
    name === "neck.midTube" ||
    name === "neck.upperTube"
  )
    return "section";
  if (
    /^skull\.longitudinal\.(centralFront|frontWingLeft|cheekLeft|sideLeft|posteriorQuarterLeft|posteriorWingLeft|centralBack|posteriorWingRight|posteriorQuarterRight|sideRight|cheekRight|frontWingRight)$/.test(
      name,
    ) ||
    /^cheek\.frontTransition\.(left|right)$/.test(name) ||
    /^neck\.jawTransition\.(left|back|right)$/.test(name) ||
    /^neck\.collarPhase\.[0-3]$/.test(name) ||
    /^ear\.(left|right)\.attachment\.conventionalInsertion$/.test(name) ||
    name === "neck.chinSagittalBridge" ||
    name === "jaw.inferiorSkinSupport"
  )
    return "guide";
  if (
    /^eye\.(left|right)-(upper-(aperture-margin|lid-roll|lid-fold)|lower-(aperture-margin|lid-roll|infraorbital-transition)|brow-region-support)$/.test(
      name,
    ) ||
    /^lips\.(vermilion|roll|sagittal)\.(upper|lower)$/.test(name) ||
    /^mouth\.contact\.(upper|lower)$/.test(name) ||
    /^nose\.(alar\.arch|sidewall|nostril\.rim)\.(left|right)$/.test(name) ||
    /^philtrum\.column\.(left|right)$/.test(name) ||
    /^ear\.(left|right)\.(helix\.crest|antihelix\.(stem|superiorCrus|inferiorCrus)|concha\.(floorCourse|divider|visibleRim)|tragus\.visibleFold|notch\.visibleValley|antitragus\.crest|attachment\.visiblePosteriorBlend|lobule\.freeEdge)$/.test(
      name,
    ) ||
    ["nose.dorsum", "nose.columella", "philtrum.centralBridge"].includes(name)
  )
    return "feature";
  return "unspecified";
}
