import { AutoMovieHumanJunctionSite } from "./AutoMovieHumanJunctionSite";
import { IAutoMovieHumanRingDefinition } from "./IAutoMovieHumanRingDefinition";

/**
 * Trunk to neck, 12 vertices from the anterior midline.
 *
 * The base of the neck carries more distinct masses than any limb cut: the two sternocleidomastoid heads converging on the jugular notch, the trachea between them, and the upper trapezius rising behind on each side. Twelve spans give each quadrant three, enough for the sternocleidomastoid's anterior border and the trapezius' anterior border to each run along a vertex line. The ring lies in the plane through cervicale and suprasternale, the oblique plane in which the base of the neck rises from the jugular notch to the seventh cervical spine.
 */
const AUTOMOVIE_HUMAN_NECK_BASE_RING: IAutoMovieHumanRingDefinition<"neckBase"> =
  {
    site: "neckBase",
    proximal: "trunk",
    distal: "neck",
    bilateral: false,
    count: 12,
    start: "anterior",
  };

/**
 * Neck to head, 28 vertices from the anterior midline.
 *
 * The head's lattice carries 60 columns round the jaw, and a quad strip sheds at most a third of a ring's columns without two of its reduction blocks meeting in a valence-six pole, so the head reaches this ring in two strips, 60 to 40 to 28, and the neck sheds the rest toward its base, 28 to 18 to 12, where the reference meshes spread their poles too. Twenty-eight spans, a multiple of four, keep a vertex on each midline and each side. The ring lies in the mandibular plane, through both gonia and menton: in front it follows the lower border of the mandible, so the submental surface under the chin belongs to the neck, and behind it passes below the skull base.
 */
const AUTOMOVIE_HUMAN_NECK_TOP_RING: IAutoMovieHumanRingDefinition<"neckTop"> =
  {
    site: "neckTop",
    proximal: "neck",
    distal: "head",
    bilateral: false,
    count: 28,
    start: "anterior",
  };

/**
 * Trunk to arm at mid upper arm, 8 vertices from the anterior surface.
 *
 * The section there is close to round and holds four masses, one per quadrant: biceps in front, triceps behind, the deltoid insertion laterally and the neurovascular groove medially. Eight spans give each a vertex on its crest and one between. The cut lies where the upper arm circumference is measured, midway between acromion and olecranon, so both parts shape the ring from that one measurement.
 */
const AUTOMOVIE_HUMAN_UPPER_ARM_RING: IAutoMovieHumanRingDefinition<"upperArm"> =
  {
    site: "upperArm",
    proximal: "trunk",
    distal: "arm",
    bilateral: true,
    count: 8,
    start: "anterior",
  };

/**
 * Arm to hand at the wrist, 8 vertices from the palmar surface.
 *
 * The same count as mid upper arm, so the arm is a regular tube whose elbow gains loops along its length rather than around it, and no pole lands on the broad forearm. The flattened wrist section keeps a vertex on each of its palmar, dorsal, radial and ulnar sides. The hand expands these spans into the palm and digits inside its own cage. The cut passes through the radial styloid, where the wrist circumference is measured.
 */
const AUTOMOVIE_HUMAN_WRIST_RING: IAutoMovieHumanRingDefinition<"wrist"> = {
  site: "wrist",
  proximal: "arm",
  distal: "hand",
  bilateral: true,
  count: 8,
  start: "anterior",
};

/**
 * Trunk to leg at mid thigh, 12 vertices from the anterior surface.
 *
 * The thigh is the largest limb section, nearly twice the upper arm's girth, and holds more masses: rectus femoris in front, vastus lateralis and medialis to either side, the adductors medially and the hamstrings behind. Eight spans would make each span about twice as long as the arm's; twelve keep span length close to the arm's and give the vasti and adductors their own vertices. The cut lies midway between the hip and knee joint centres, below the gluteal fold, so the fold and the upper thigh stay in the trunk.
 */
const AUTOMOVIE_HUMAN_THIGH_RING: IAutoMovieHumanRingDefinition<"thigh"> = {
  site: "thigh",
  proximal: "trunk",
  distal: "leg",
  bilateral: true,
  count: 12,
  start: "anterior",
};

/**
 * Leg to foot at the ankle, 8 vertices from the anterior surface.
 *
 * Above the malleoli the section narrows to its minimum and holds four features, one per quadrant: the tibialis anterior tendon in front, the Achilles tendon behind, and the two malleolar ridges to the sides. Eight spans give each a vertex. The leg part reduces its twelve thigh spans to these eight inside its own cage, where its generator places the poles.
 */
const AUTOMOVIE_HUMAN_ANKLE_RING: IAutoMovieHumanRingDefinition<"ankle"> = {
  site: "ankle",
  proximal: "leg",
  distal: "foot",
  bilateral: true,
  count: 8,
  start: "anterior",
};

/**
 * Head to ear around the attachment of the auricle, 8 vertices from its superior point.
 *
 * The attachment is an elongated loop, from the root of the helix above the tragus down to the lobule and back along the posterior auricular sulcus. Eight spans put a vertex at its superior, anterior, inferior and posterior extremes and one between each. The ear part builds its folds inside that loop, so an ear of another species with the same ring replaces it without touching the head.
 */
const AUTOMOVIE_HUMAN_EAR_RING: IAutoMovieHumanRingDefinition<"ear"> = {
  site: "ear",
  proximal: "head",
  distal: "ear",
  bilateral: true,
  count: 8,
  start: "superior",
};

/**
 * Ring definition of every junction site, the contract every part generator and the junction read.
 *
 * A ring is an edge loop of the control cage, and one Catmull-Clark subdivision turns its spans into a cubic B-spline cross-section, so a cage needs few spans: "6 spans are enough to create accurate circular shapes" (Pixar, OpenSubdiv documentation, "Modeling Tips"). Above that floor, spans go where the surface has distinct masses and where it deforms, since edge loops "follow the natural contours and deformation lines of the skin and the underlying muscles" and are "denser in areas that deform more" (Blender Manual, "Mesh Structure"). Every count is a multiple of four, so the anterior, posterior, medial and lateral directions each fall on a vertex: a midline ring keeps the mirror plane through vertices, and each quadrant's muscle crest or tendon has a control point of its own. Counts are equal on both sides of a site, so no junction of the human profile needs a transition patch and every extraordinary vertex sits inside a part, where its generator places it.
 */
export const AUTOMOVIE_HUMAN_RINGS: {
  [Site in AutoMovieHumanJunctionSite]: IAutoMovieHumanRingDefinition<Site>;
} = {
  neckBase: AUTOMOVIE_HUMAN_NECK_BASE_RING,
  neckTop: AUTOMOVIE_HUMAN_NECK_TOP_RING,
  upperArm: AUTOMOVIE_HUMAN_UPPER_ARM_RING,
  wrist: AUTOMOVIE_HUMAN_WRIST_RING,
  thigh: AUTOMOVIE_HUMAN_THIGH_RING,
  ankle: AUTOMOVIE_HUMAN_ANKLE_RING,
  ear: AUTOMOVIE_HUMAN_EAR_RING,
};
