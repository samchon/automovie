/**
 * The Human profile's minimum ankle cut and section, shared by the leg and foot.
 *
 * Fitted offline on the four lean young-adult gate identities' selected reference meshes: each reference's closed shank sections were cut perpendicular to its own knee-to-ankle axis at 53 fractions from 0.72 to 0.98, the minimum convex-hull perimeter selected, then the same operation repeated after carrying the reference through skin weights onto the identity's skeleton. The cut's height above sphyrion over lateral malleolus height averaged 0.504985, leaving one identity out 0.495140 to 0.511778; depth over breadth averaged 1.464002, leaving one out 1.439829 to 1.486634. The rounded coefficients below retain that shared form, not a reference mesh or its samples. Reference selection is a sensitivity choice from input dimensions that include surrogate breadth protocols, not validated anatomical correspondence. Grade: fitted to modelled references, not a measured population regression; the muscular woman's reference carries ordinary lean form because no muscular female reference was available.
 *
 * The section is deeper than broad, independently consistent with standing 16- to 18.5-year-olds in Snyder et al. 1977 (UM-HSRI-77-17, NIST AnthroKids, measurements 83 and 84 at https://math.nist.gov/~SRessler/anthrokids/data1977/descrip.htm): mean individual minimum breadth/minimum girth 0.26639 in 77 males and 0.25661 in 76 females, against 1/pi for a circle. Those two minima need not be at one height, so they bound the approximation rather than set the cut. The ellipse keeps the identity's girth by its own perimeter. Other ages retain this profile's conventional shape; their girths remain their own measurements.
 */
export const AUTOMOVIE_HUMAN_ANKLE_SECTION: { readonly aboveSphyrion: 0.505; readonly depthOverBreadth: 1.464; } = {
  /** Height above the medial malleolus tip, in lateral malleolus heights. */
  aboveSphyrion: 0.505,
  /** Depth of the minimum section over its breadth. */
  depthOverBreadth: 1.464,
} as const;
