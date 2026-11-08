/**
 * The arm's parameter laws, set aside for the f1-only mission (the owner's
 * order of 2026-11-08: f1's lines are authored as coordinates first,
 * `AutoMovieHumanArmF1Lines`, and the laws come back in the follow-up
 * algorithmization pull request). Nothing reads them now; the view curves'
 * former law path is kept below as a comment, verbatim, with its sources:
 * the boxes at the girth sites (circle of the axillary, upper-arm and elbow
 * tapes; Sanada 2006 and Maruyama 1991 depth split; Perry 2021 forearm and
 * wrist ellipses or the person's calipers; the hand breadth and tape), the
 * Campbell 2009 deltoid support, the declared extrema plan, the Larsen 2025
 * and Akagi 2011 station slopes, and the fullness solved per site for its
 * tape.
 *
 * ```ts
 * const r = tapes.bicep / (2 * Math.PI);
 * const e = tapes.elbow / (2 * Math.PI);
 * const fa = 0.1713 * 0.008 - 0.199 * 0.04 - 0.0535 * 0.2 + 0.1922;
 * const fb = 0.3329 * 0.008 - 0.5798 * 0.04 + 0.2068 * 0.2 + 0.1156;
 * const circularity = 1.4204 - 3.1362 + 1.8798 + 0.5104;
 * const wristHalf = tapes.wrist / ramanujan(1, circularity);
 * const knuckleDepth = semiAxis(tapes.hand, tapes.breadth / 2);
 * const ax = tapes.axillary === undefined ? null : tapes.axillary / (2 * Math.PI);
 * const delta = AutoMovieHumanUpperArmForm.split(female);
 * const raw = [
 *   axilla level: [ax, ax, ax, ax] for tapes.axillary,
 *   biceps site: [r, r, r + delta, r - delta] for tapes.bicep,
 *   olecranon: [e, e, e, e] for tapes.elbow,
 *   forearm maximum: calipers ? halves of calipers.forearm : [fa, fa, fb, fb] * tapes.forearm,
 *   wrist plane: calipers ? halves of calipers.wrist : [wristHalf, wristHalf, circularity * wristHalf, circularity * wristHalf],
 *   knuckles: [breadth / 2, breadth / 2, knuckleDepth, knuckleDepth] for tapes.hand,
 * ];  // shoulder per site: AutoMovieHumanArmViewSegments.shoulder(name, box, girth)
 * const deltoid = (bideltoid - biacromial) / 2 + GH_MEDIAL_OF_ACROMION * scale;
 * const plan = {
 *   lateral: biceps site value, olecranon min, forearm maximum max, wrist plane min, knuckles value;
 *   medial: the same;
 *   anterior: biceps site, olecranon, forearm maximum values, wrist plane flat, knuckles value;
 *   posterior: the same;
 * };
 * const slopes = {
 *   lateral at the axilla level: AutoMovieHumanUpperArmForm.lateralSlope(female, reach),
 *   anterior at the biceps site: AutoMovieHumanUpperArmForm.anteriorSlope(female, reach),
 * };
 * datums per outline: dome pole 0; humeral head (ax ?? r), parallel (lateral: deltoid point, value free);
 *   axilla level ax; the plan's sites with their senses and slopes; web III 0;
 *   solved by AutoMovieHumanFairOutline in the two-pole angle parameter.
 * fullness: the sites' solved shoulders, the poles repeating their neighbours, natural cubic in station.
 * ```
 */
export namespace AutoMovieHumanArmViewCurvesLaw {
  /** The sources of the set-aside laws, for the follow-up algorithmization. */
  export const SOURCES: readonly string[] = [
    "ANSUR 1988 axillary arm circumference (circle)",
    "NHANES mid-upper arm circumference with Sanada 2006 muscle and Maruyama 1991 fat depth split",
    "ANSUR 1988 elbow circumference (circle)",
    "Perry et al. 2021 forearm CS2 ellipse and wrist circularity",
    "ANSUR II hand breadth and ANSUR 1988 hand circumference ellipse",
    "Campbell et al. 2009 GH offset with bideltoid and biacromial breadths (deltoid support)",
    "Larsen et al. 2025 deltoid thinning and Akagi et al. 2011 flexor thickening station slopes",
  ];
}
