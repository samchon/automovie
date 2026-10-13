import type { IHumanViewerPartBookmark } from "./IHumanViewerPartBookmark";

const face = (
  id: string,
  region: string,
  label: string,
  meshes: string[],
  doc = "connected-reference",
): IHumanViewerPartBookmark => ({ id, region, label, doc, meshes });

/**
 * The part gallery's starting table: anatomical part to the displayed mesh
 * names, in the order the face is read from the skin outward. The meshes are
 * the connected basis's own names and the hair builder's, and a document that
 * leaves one out (a subject without hair has no scalp mesh) simply does not
 * list it, which the gallery shows. Hair is opened on a subject that has hair
 * and a neutral expression, because a published expression document the
 * numerical contact check refuses cannot be drawn at all. The fringe sits on a
 * hand-written input, so a checkout without the local inputs shows its refusal.
 */
export const humanViewerPartBookmarks: readonly IHumanViewerPartBookmark[] = [
  face("face-skin", "Face surface", "Skin", ["Human/skin"]),
  face("face-lips", "Face surface", "Lips", ["Human/lips"]),
  face("face-eyes", "Eye", "Eye meshes", ["Human.low-poly/Human.low-poly"]),
  face("face-upper-lashes", "Eye", "Upper lashes", [
    "Human.eyelashes01/Human.eyelashes01",
  ]),
  face("face-lower-lashes", "Eye", "Lower lashes", [
    "Human.eyelashes01/Human.eyelashes01.lower",
  ]),
  face("face-eyebrows", "Eye", "Eyebrows", [
    "Human.eyebrow001/Human.eyebrow001",
  ]),
  face("face-teeth", "Mouth", "Teeth", ["Human.teeth_base/Human.teeth_base"]),
  face("face-tongue", "Mouth", "Tongue", ["Human.tongue01/Human.tongue01"]),
  face(
    "hair-scalp",
    "Hair",
    "Scalp hair",
    ["numerical-hair:scalp"],
    "kdy1-connected",
  ),
  face(
    "hair-fringe",
    "Hair",
    "Fringe",
    ["numerical-hair:fringe"],
    "file:f2-contact-off/daniel-radcliffe-connected-neutral",
  ),
  {
    id: "body-skin",
    region: "Body surface",
    label: "Body skin",
    doc: "body:neutral",
    meshes: ["Human/skin"],
  },
];
