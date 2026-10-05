import type { IHumanSourceHeadLandmarkText } from "./structures/IHumanSourceHeadLandmarkText.ts";

const ANSUR = "Hotzman et al. 2011, NATICK/TR-11/017";

/**
 * The meaning and selection rule of each head landmark, keyed by name. ANSUR
 * definitions are quoted from the 2011 report; a stand-in for a structure the
 * skin does not carry is labelled a named approximation.
 */
export const HUMAN_SOURCE_HEAD_LANDMARK_TEXTS: Readonly<Record<string, IHumanSourceHeadLandmarkText>> = {
  glabella: {
    name: "glabella",
    definition: "The most anterior point on the frontal bone midway between the bony browridges.",
    citation: `${ANSUR}, 5.2.14, p. 36`,
    status: "named approximation",
    rule: "largest z among head midline vertices (hm08.mirror 'm') whose neutral height lies within the eyebrow card's neutral vertical extent; the card's extent stands in for the browridge height",
  },
  sellion: {
    name: "sellion",
    definition: "The point of the deepest depression of the nasal bones at the top of the nose.",
    citation: `${ANSUR}, 5.2.35, p. 59`,
    status: "definition",
    rule: "smallest z on the outer midline profile from glabella to pronasale, end points excluded; the profile is the shortest path over base-mesh midline edges (hm08.mirror 'm'), and pronasale is the most anterior midline vertex above the mouth joint",
  },
  menton: {
    name: "menton",
    definition: "The inferior point of the mandible in the midsagittal plane (bottom of the chin).",
    citation: `${ANSUR}, 5.2.23, p. 45`,
    status: "named approximation",
    rule: "lowest head midline vertex whose jaw attachment weight is one within storage, with the jaw closed; skin that moves entirely with the mandible stands in for the mandible, because the midline profile keeps descending from the chin into the neck",
  },
  "tragion-right": {
    name: "tragion-right",
    definition: "The superior point on the juncture of the cartilaginous flap (tragus) of the ear with the head.",
    citation: `${ANSUR}, 5.2.42, p. 66`,
    status: "definition, read from renders",
    rule: "uppermost vertex of the anterior tragus–head juncture, chosen by reading rendered frames of the neutral right ear (frame path); the compared neighbours and the reading ambiguity of about 0.4 mm are listed with the candidates",
  },
  "tragion-left": {
    name: "tragion-left",
    definition: "The superior point on the juncture of the cartilaginous flap (tragus) of the ear with the head.",
    citation: `${ANSUR}, 5.2.42, p. 66`,
    status: "definition, read from renders",
    rule: "exact mirror twin (hm08.mirror) of tragion-right",
  },
};
