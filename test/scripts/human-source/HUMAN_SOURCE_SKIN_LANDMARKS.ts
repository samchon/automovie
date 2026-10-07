import type { IHumanSourceSkinLandmarkSource } from "./structures/IHumanSourceSkinLandmarkSource.ts";

const ANSUR = "Hotzman et al. 2011, NATICK/TR-11/017";
const FIXED =
  "The vertex is fixed on the neutral body. When the shape changes, the definition's point can move to another vertex, and a fixed vertex does not follow that move.";

/**
 * The named skin points the body view carries, each with the vertex it is
 * read from, its meaning and how the vertex was determined. Sided points read
 * on the right name their left twin, which is built as the exact position
 * mirror.
 *
 * - `nipple-left`: the published body (r16) placed its bust level and bra on
 *   vertex 21898, the left nipple-areola fill's centre; the view takes its
 *   exact twin.
 * - `neck-anterior-midline`: the front midline vertex of MakeHuman's
 *   neck-circumference ruler ring, base-mesh vertex 803.
 * - Hand points (read by the upper-limb owner on the neutral rest A-pose):
 *   stylion at the joint-centre plane of the wrist (no radial styloid relief
 *   in the skin), metacarpale II and V at the MCP II and V planes.
 * - `midpatella-right` (read by the lower-limb owner): the front centre of the
 *   patellar dome at the knee cube's height band.
 */
export const HUMAN_SOURCE_SKIN_LANDMARKS: readonly IHumanSourceSkinLandmarkSource[] =
  [
    {
      name: "nipple-left",
      from: { kind: "published-body-vertex", vertex: 21898 },
      definition: "The centre of the left nipple-areola complex.",
      citation: "published body basis r16 bust level and bra vertex",
      status: "carried from the published body",
      neighbours: [],
      limit: FIXED,
      ambiguity: null,
    },
    {
      name: "neck-anterior-midline",
      from: { kind: "source-sample", sample: 803 },
      definition:
        "The front midline point of the neck-circumference ruler ring.",
      citation:
        "MakeHuman plugins/0_modeling_a_measurement.py, measure-neck-circ ruler",
      status: "carried from the published body",
      neighbours: [],
      limit: FIXED,
      ambiguity: null,
    },
    {
      name: "stylion-right",
      from: { kind: "source-sample", sample: 24319 },
      mirror: "stylion-left",
      definition: "The inferior point of the bottom of the radius.",
      citation: `${ANSUR}, 5.2.36`,
      status: "named approximation",
      neighbours: [37680, 43757, 3771, 43783],
      limit: `The skin has no radial styloid relief, so the wrist joint-centre plane stands in for the styloid's height; read on the rest A-pose with slightly flexed fingers, not ANSUR's palm-down posture. ${FIXED}`,
      ambiguity: null,
    },
    {
      name: "metacarpale-ii-right",
      from: { kind: "source-sample", sample: 3160 },
      mirror: "metacarpale-ii-left",
      definition:
        "The most lateral point of the right metacarpophalangeal joint II (at the base of the index finger).",
      mirrorDefinition:
        "The most lateral point of the left metacarpophalangeal joint II (at the base of the index finger).",
      citation: `${ANSUR}, 5.2.24`,
      status: "definition, read from renders",
      neighbours: [14273, 43619, 34330, 34174],
      limit: `Read on the rest A-pose with slightly flexed fingers, not ANSUR's palm-down posture. ${FIXED}`,
      ambiguity: null,
    },
    {
      name: "metacarpale-v-right",
      from: { kind: "source-sample", sample: 42892 },
      mirror: "metacarpale-v-left",
      definition:
        "The most medial point of the right metacarpophalangeal joint V (at the base of the little finger).",
      mirrorDefinition:
        "The most medial point of the left metacarpophalangeal joint V (at the base of the little finger).",
      citation: `${ANSUR}, 5.2.25`,
      status: "definition, read from renders",
      neighbours: [37506, 27461, 20744, 3122],
      limit: `Read on the rest A-pose with slightly flexed fingers, not ANSUR's palm-down posture. ${FIXED}`,
      ambiguity: null,
    },
    {
      name: "midpatella-right",
      from: { kind: "source-sample", sample: 4624 },
      mirror: "midpatella-left",
      definition:
        "The anterior point halfway between the top and bottom of the patella (the kneecap).",
      citation: `${ANSUR}, 5.2.26`,
      status: "definition, read from renders",
      neighbours: [31157, 14455, 31156, 14459],
      limit: FIXED,
      ambiguity:
        "Vertical position uncertain by about +/-10 mm: the lateral contour shows no distinct patellar prominence, so the point was read as the centre of the patellar dome in the front normal frame.",
    },
  ];
