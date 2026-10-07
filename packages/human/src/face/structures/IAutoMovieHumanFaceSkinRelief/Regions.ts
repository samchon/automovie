import type { IAutoMovieHumanFaceRegionalRelief } from "../IAutoMovieHumanFaceRegionalRelief";

/** Source-landmark courses, independent of raw skin-condition observations.
 *
 * @evidence contracts/common.md#principled-implementation Independent named regional records preserve source-landmark ownership and omission without duplicating their displacement kernel.
 * @evidence contracts/common.md#clear-and-simple-design This named file owns the sole Regions field definition; a separate compatibility alias preserves its existing public namespace.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Existing namespace qualification, fields and units are preserved without duplicate definitions or runtime patching.
 * @evidence contracts/common.md#meaningful-documentation Each retained member documents its established units, optional meaning and styling responsibility.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Named regions identify traits of one connected skin sheet and do not compose independent tissue parts.
 * @evidence contracts/modeling.md#parameter-channels Each optional region carries independent persistent outward/inward offset and inward fold depth/performance; zero adds no displacement and paired Left/Right members never copy one another. Forehead/glabellar guide dimensions keep their explicit source-course meaning.
 * @evidenceExclude contracts/modeling.md#emitted-geometry applyHumanFaceRegionalRelief samples and displaces the existing source sheet; this region selector emits no new vertex, triangle or patch.
 * @evidence contracts/modeling.md#spatial-conventions Member lengths/offsets are mm converted once by the regional owner to basis metres; signs follow the live outward host normal and left/right follow +X/-X source halves.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Source landmark endpoints and complete lip margins are held by the regional producer and its compact course kernel; this selector constructs no separate join.
 * @evidenceExclude contracts/modeling.md#rendered-observation The input has no independent visible object; the connected regional-relief and whole-face owners owe assembled skin and neighbour observations.
 * @evidence contracts/anatomy.md#anatomical-source The named sites use source-landmark registration, while courses, support kernels and additional mm relief are authored visible conventions; they infer no clinical grade, hidden tissue anatomy or measured individual trajectory.
 * @evidenceExclude contracts/anatomy.md#permitted-range applyHumanFaceRegionalRelief owns finite dimensions/fraction checks, anatomical-side support and contributing samples; source-cell/contact admission judges combinations without a physiological range claim from this container.
 * @evidence contracts/anatomy.md#parametric-authority The record selects named regional numerical traits; its producer derives supported courses from the existing registered glabella/cheilion/philtral/labial/gnathion identities, not caller-supplied vertices or curves.
 *
 * @author Samchon
 */
export interface Regions {
  /** Horizontal forehead course above source glabella; explicit length/elevation in mm, independent rest/fold traits, omitted for no added relief. */
  forehead?: IAutoMovieHumanFaceRegionalRelief;

  /** Superior glabellar course from source glabella with explicit mm length; rest offset and performed fold remain independent. */
  glabellar?: IAutoMovieHumanFaceRegionalRelief;

  /** Anatomical-left cheilion-to-gnathion authored course on the connected anterior skin; omission adds no left relief. */
  marionetteLeft?: IAutoMovieHumanFaceRegionalRelief;

  /** Anatomical-right cheilion-to-gnathion authored course, independently omitted or performed from the left. */
  marionetteRight?: IAutoMovieHumanFaceRegionalRelief;

  /** Left source crista-philtri-to-subnasale course, confined to anatomical +X; authored mm relief is separate from clinical grades. */
  philtralLeft?: IAutoMovieHumanFaceRegionalRelief;

  /** Right source crista-philtri-to-subnasale course, confined to anatomical -X; neither identity nor performance inherits the left. */
  philtralRight?: IAutoMovieHumanFaceRegionalRelief;

  /** Cheilion-to-labiale-superius-to-cheilion source course; independent mm identity/fold support holds the registered lip margin. */
  perioralUpper?: IAutoMovieHumanFaceRegionalRelief;

  /** Cheilion-to-labiale-inferius-to-cheilion source course; independent lower mm identity/fold support, omitted for no added relief. */
  perioralLower?: IAutoMovieHumanFaceRegionalRelief;
}
