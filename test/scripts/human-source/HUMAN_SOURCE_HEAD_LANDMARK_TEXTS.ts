import type { IHumanSourceHeadLandmarkText } from "./structures/IHumanSourceHeadLandmarkText.ts";

const ANSUR = "Hotzman et al. 2011, NATICK/TR-11/017";

/**
 * The meaning and selection rule of each head landmark, keyed by name. ANSUR
 * definitions are quoted from the 2011 report; a stand-in for a structure the
 * skin does not carry is labelled a named approximation.
 */
export const HUMAN_SOURCE_HEAD_LANDMARK_TEXTS: Readonly<
  Record<string, IHumanSourceHeadLandmarkText>
> = {
  glabella: {
    name: "glabella",
    definition:
      "The most anterior point on the frontal bone midway between the bony browridges.",
    citation: `${ANSUR}, 5.2.14, p. 36`,
    status: "named approximation",
    rule: "largest z among head midline vertices (hm08.mirror 'm') whose neutral height lies within the eyebrow card's neutral vertical extent; the card's extent stands in for the browridge height",
  },
  sellion: {
    name: "sellion",
    definition:
      "The point of the deepest depression of the nasal bones at the top of the nose.",
    citation: `${ANSUR}, 5.2.35, p. 59`,
    status: "definition",
    rule: "smallest z on the outer midline profile from glabella to pronasale, end points excluded; the profile is the shortest path over base-mesh midline edges (hm08.mirror 'm'), and pronasale is the most anterior midline vertex above the mouth joint",
  },
  menton: {
    name: "menton",
    definition:
      "The inferior point of the mandible in the midsagittal plane (bottom of the chin).",
    citation: `${ANSUR}, 5.2.23, p. 45`,
    status: "named approximation",
    rule: "lowest head midline vertex whose jaw attachment weight is one within storage, with the jaw closed; skin that moves entirely with the mandible stands in for the mandible, because the midline profile keeps descending from the chin into the neck",
  },
  "tragion-right": {
    name: "tragion-right",
    definition:
      "The superior point on the juncture of the cartilaginous flap (tragus) of the ear with the head.",
    citation: `${ANSUR}, 5.2.42, p. 66`,
    status: "definition, read from renders",
    rule: "uppermost vertex of the anterior tragus–head juncture, chosen by reading rendered frames of the neutral right ear (frame path); the compared neighbours and the reading ambiguity of about 0.4 mm are listed with the candidates",
  },
  "tragion-left": {
    name: "tragion-left",
    definition:
      "The superior point on the juncture of the cartilaginous flap (tragus) of the ear with the head.",
    citation: `${ANSUR}, 5.2.42, p. 66`,
    status: "definition, read from renders",
    rule: "exact mirror twin (hm08.mirror) of tragion-right",
  },
  gnathion: {
    name: "gnathion",
    definition:
      "The lowest median point on the lower border of the mandible (Farkas).",
    citation: "Farkas 1994; same point as menton (ANSUR II 5.2.23)",
    status: "named approximation",
    rule: "same vertex as menton (same point as menton, ANSUR II 5.2.23): the Farkas gnathion and the ANSUR menton name one skin point",
  },
  subnasale: {
    name: "subnasale",
    definition:
      "The point where the nasal septum merges with the upper cutaneous lip in the mid-sagittal plane; curve definition: the point of maximal curvature on the mid-line curve at the base of the nasal septum.",
    citation: "Katina et al. 2016, J Anat, Table 2",
    status: "definition, read from renders",
    rule: "corner where the midline profile turns from the columella slope into the upper lip, read on rendered frames of the neutral nose (frame path)",
  },
  "alar-curvature-right": {
    name: "alar-curvature-right",
    definition:
      "The facial insertion of each alar base (alare crest); Farkas ac is the most posterior-lateral point of the alar base curve.",
    citation: "Katina et al. 2016, J Anat, Table 2",
    status: "definition, read from renders",
    rule: "most posterior point of the alar mass boundary, read on rendered frames of the neutral nose (frame path)",
  },
  "alar-curvature-left": {
    name: "alar-curvature-left",
    definition:
      "The facial insertion of each alar base (alare crest); Farkas ac is the most posterior-lateral point of the alar base curve.",
    citation: "Katina et al. 2016, J Anat, Table 2",
    status: "definition, read from renders",
    rule: "exact mirror twin (hm08.mirror) of alar-curvature-right",
  },
  "subalare-right": {
    name: "subalare-right",
    definition:
      "The point where the lower border of the alar base meets the skin of the upper lip (Farkas).",
    citation: "Farkas 1994 (secondary summary)",
    status: "definition, read from renders",
    rule: "lowest point where the alar boundary meets the upper lip, read on rendered frames of the neutral nose (frame path); Limit: the Farkas definition was confirmed only from a secondary summary; the Farkas (1994) original was not read",
  },
  "subalare-left": {
    name: "subalare-left",
    definition:
      "The point where the lower border of the alar base meets the skin of the upper lip (Farkas).",
    citation: "Farkas 1994 (secondary summary)",
    status: "definition, read from renders",
    rule: "exact mirror twin (hm08.mirror) of subalare-right; Limit: the Farkas definition was confirmed only from a secondary summary; the Farkas (1994) original was not read",
  },
  "otobasion-superius-right": {
    name: "otobasion-superius-right",
    definition:
      "The highest point where the ear attaches to the head (Farkas).",
    citation: "Farkas 1994",
    status: "definition, read from renders",
    rule: "highest vertex of the read ear attachment loop, read on rendered frames of the neutral right ear (frame path); Earlier rejected as a helix-top (highest point of the ear) candidate because it lies on temporal skin, not the ear; the definition here is the highest point of the ear's attachment line, and 5767 is a vertex of the read attachment loop, so the two readings agree",
  },
  "otobasion-superius-left": {
    name: "otobasion-superius-left",
    definition:
      "The highest point where the ear attaches to the head (Farkas).",
    citation: "Farkas 1994",
    status: "definition, read from renders",
    rule: "exact mirror twin (hm08.mirror) of otobasion-superius-right",
  },
  "otobasion-inferius-right": {
    name: "otobasion-inferius-right",
    definition:
      "The point of attachment of the ear lobe to the cheek, which determines the lower border of the ear insertion; curve definition: the final point at the preauricular end of the ear rim curve.",
    citation: "Katina et al. 2016, J Anat, Table 2",
    status: "definition, read from renders",
    rule: "lowest point of the lobe-cheek notch on the attachment loop, read on rendered frames of the neutral right ear (frame path)",
  },
  "otobasion-inferius-left": {
    name: "otobasion-inferius-left",
    definition:
      "The point of attachment of the ear lobe to the cheek, which determines the lower border of the ear insertion; curve definition: the final point at the preauricular end of the ear rim curve.",
    citation: "Katina et al. 2016, J Anat, Table 2",
    status: "definition, read from renders",
    rule: "exact mirror twin (hm08.mirror) of otobasion-inferius-right",
  },
  "labiale-superius": {
    name: "labiale-superius",
    definition: "The midpoint of the upper vermilion line.",
    citation:
      "3D Facial Norms (Weinberg et al. 2016) landmark definitions, lips apposed",
    status: "definition",
    rule: "most anterior midline (|x| < 0.6 mm) vermilion border vertex above the central contact pair; the border is every vertex shared by a lips and a skin triangle, so the inner mucosal border is passed over by being posterior",
  },
  "labiale-inferius": {
    name: "labiale-inferius",
    definition: "The midpoint of the lower vermilion line.",
    citation:
      "3D Facial Norms (Weinberg et al. 2016) landmark definitions, lips apposed",
    status: "definition",
    rule: "most anterior midline (|x| < 0.6 mm) vermilion border vertex below the central contact pair",
  },
  "cheilion-left": {
    name: "cheilion-left",
    definition:
      "The point where the upper and lower lips meet at the left commissure.",
    citation:
      "3D Facial Norms (Weinberg et al. 2016) landmark definitions, lips apposed",
    status: "definition",
    rule: "lateral-most lips-region vertex on the face's left (+X)",
  },
  "cheilion-right": {
    name: "cheilion-right",
    definition:
      "The point where the upper and lower lips meet at the right commissure.",
    citation:
      "3D Facial Norms (Weinberg et al. 2016) landmark definitions, lips apposed",
    status: "definition",
    rule: "lateral-most lips-region vertex on the face's right (-X)",
  },
  "crista-philtri-left": {
    name: "crista-philtri-left",
    definition:
      "The point on the left elevated margin of the philtrum just above the vermilion line (the Cupid's-bow peak).",
    citation:
      "3D Facial Norms (Weinberg et al. 2016) landmark definitions, lips apposed",
    status: "definition",
    rule: "highest upper vermilion border vertex 2 to 12 mm left of the midline",
  },
  "crista-philtri-right": {
    name: "crista-philtri-right",
    definition:
      "The point on the right elevated margin of the philtrum just above the vermilion line (the Cupid's-bow peak).",
    citation:
      "3D Facial Norms (Weinberg et al. 2016) landmark definitions, lips apposed",
    status: "definition",
    rule: "highest upper vermilion border vertex 2 to 12 mm right of the midline",
  },
  stomion: {
    name: "stomion",
    definition:
      "The point where the upper and lower lips meet in the midline with the lips closed.",
    citation:
      "3D Facial Norms (Weinberg et al. 2016) landmark definitions, lips apposed",
    status: "definition",
    rule: "upper vertex of the face's central contact pair (contact.lips.upper)",
  },
};
