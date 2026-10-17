/**
 * Describe the current bilateral foot family's named construction curves.
 *
 * Ankle/collar boundaries, main transverse courses and toe profile courses are
 * sections, including the open rearfoot courses. Longitudinal support rails,
 * collar derivative segments, transitions, shared web courses and toe-root
 * branches are guides. Their anatomical names describe construction ownership,
 * not measured skin creases; this family currently declares no feature curves.
 * Only exact names emitted by the public foot recipe are recognised. Custom or
 * future course names remain unspecified until their generating meaning is owned.
 * Classification changes display metadata only, without reading or changing spans.
 *
 * @param name Complete case-sensitive primitive name, including left.foot or right.foot.
 * @returns The declared section or guide role, or unspecified for an unknown name.
 */
export function describeAutoMovieFootCurveRole(
  name: string,
): "section" | "guide" | "feature" | "unspecified" {
  const match: RegExpExecArray | null = /^(?:left|right)\.foot\.(.+)$/.exec(
    name,
  );
  if (match === null) return "unspecified";
  const suffix: string = match[1]!;
  if (
    /^(?:sharedAnkle|sharedCollar)$/.test(suffix) ||
    /^course\.(?:heelRear|heelShoulder|AchillesWall|hindfoot|ankleAxis|rearArch|instep|arch|midfoot|forefoot)$/.test(
      suffix,
    ) ||
    /^toe[1-5]\.section\.(?:root|proximalPad|distalPad|tipBase)$/.test(suffix)
  )
    return "section";
  if (
    /^collarJet[0-3]_(?:0|0\.5)$/.test(suffix) ||
    /^family\.(?:outer|plantarOuter|sole|plantarInner|inner)$/.test(suffix) ||
    /^ankleWallFamily\.(?:ankleOuterShoulder|ankleInnerShoulder)$/.test(
      suffix,
    ) ||
    /^(?:forefootFamily|heelFamily)\.(?:dorsum|upperOuter|upperInner)$/.test(
      suffix,
    ) ||
    /^(?:instepTransition|AchillesTransition)\.(?:dorsum|upperOuter|upperInner)$/.test(
      suffix,
    ) ||
    /^toe[1-5]\.(?:outer|dorsum|inner|sole)$/.test(suffix) ||
    /^web[1-4]\.sharedSaddleCourse$/.test(suffix) ||
    /^toe[1-5]\.branch\.(?:dorsum|sole|outer|inner)$/.test(suffix)
  )
    return "guide";
  return "unspecified";
}
