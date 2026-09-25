import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  type IAutoMovieHumanFaceControlMap,
  createHumanFaceBasisBuilder,
} from "@automovie/human";

import { faceIncisalEdges } from "./faceIncisalEdges";

/**
 * Place a contact basis's maxillary dentition at the population's resting
 * incisal display, as a new basis revision.
 *
 * `prepare-dental-basis.ts` calls this with the published basis. The display
 * of the maxillary central incisor below the upper lip at rest is a measured
 * population quantity: 1.91 mm in men and 3.4 mm in women (Vig & Brundo, J
 * Prosthet Dent 1978), 2.5 and 3.8 mm in a later sample of 104 adults
 * (Misch 2011). The source basis hid the incisal edge 0.56 mm above the lip
 * seam although its upper lip length (subnasale to stomion, 20.5 mm) is
 * ordinary and its incisors meet within the cephalometric norms (overbite
 * 1.67 mm, overjet 0.97 mm), so the dentition's height, not the lip or the
 * bite, was misplaced, and no smile could show the upper teeth.
 *
 * Only the maxillary arch moves: the dentition vertices not bound to the
 * mandible (`jaw` attachment weight one), which ride the skull. The
 * mandibular arch and the tongue ride the mandible and stay seated on the
 * floor of the mouth, whose lining the source's lower gum clears by less
 * than two millimetres; lowering them as well put the gum through that
 * lining at rest. Lowering the upper arch alone deepens the bite by the same
 * amount, so the rigid vertical shift is the smaller of the one that brings
 * the display to `displayMetres` and the one that brings the overbite to
 * `maxOverbiteMetres`, and the receipt names which bound held. Endpoint
 * rows are displacements and stay valid; the contact pairs, colliders,
 * attachments and budgets keep their vertex identities, and the real builder
 * must admit the neutral and every document before the revision is
 * returned.
 *
 * The incisal edges are `faceIncisalEdges`'s. Display is the upper lip
 * seam's height minus the upper edge's; overbite and overjet are the
 * cephalometric edge-to-edge distances, vertical and forward. Documents and
 * controls are restamped to the new revision; nothing else in them changes.
 * Pure: the inputs are cloned.
 */
export function prepareDentalPosition(input: {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  displayMetres: number;
  maxOverbiteMetres: number;
  revision: string;
}): {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  receipt: {
    source: string;
    revision: string;
    shiftMetres: number;
    bound: "display" | "overbite";
    before: IDentalMeasure;
    after: IDentalMeasure;
    movedVertices: number;
  };
} {
  const {
    basis,
    documents,
    controls,
    displayMetres,
    maxOverbiteMetres,
    revision,
  } = structuredClone(input);
  const contact = basis.contact;
  if (contact === undefined)
    throw new Error("Dental placement needs a contact basis.");
  if (revision.trim() === "" || revision === basis.id)
    throw new Error("Dental placement needs a distinct revision.");
  if (!Number.isFinite(displayMetres) || !Number.isFinite(maxOverbiteMetres))
    throw new Error("The resting display and overbite limit must be finite.");
  const before = measureDental(basis);
  const teeth = basis.surfaces.find(
    (one) => one.id === contact.incisors.surface,
  )!;
  const rows =
    teeth.attachments?.find((one) => one.owner === "jaw")?.rows ?? [];
  const mandibular = new Set<number>();
  for (let i = 0; i < rows.length; i += 2)
    if (rows[i + 1] === 1) mandibular.add(rows[i]!);
  if (mandibular.has(before.upperEdge) || !mandibular.has(before.lowerEdge))
    throw new Error(
      "The upper incisors must ride the skull and the lower ones the mandible.",
    );
  const byDisplay = displayMetres - before.displayMetres;
  const byOverbite = maxOverbiteMetres - before.overbiteMetres;
  const shift = -Math.min(byDisplay, byOverbite);
  let movedVertices = 0;
  for (let vertex = 0; vertex < teeth.positions.length / 3; ++vertex)
    if (!mandibular.has(vertex)) {
      teeth.positions[3 * vertex + 1] += shift;
      ++movedVertices;
    }
  const source = basis.id;
  basis.id = revision;
  const build = createHumanFaceBasisBuilder(basis);
  const restamped = documents.map((document) => {
    if (document.basis !== source)
      throw new Error(`Document ${document.id} names another basis.`);
    const next = { ...document, basis: revision };
    build(next);
    return next;
  });
  if (controls.basis !== source)
    throw new Error("The control map names another basis.");
  return {
    basis,
    documents: restamped,
    controls: { ...controls, basis: revision },
    receipt: {
      source,
      revision,
      shiftMetres: shift,
      bound: byDisplay <= byOverbite ? "display" : "overbite",
      before,
      after: measureDental(basis),
      movedVertices,
    },
  };
}

/** Resting incisal relations read from the incisal edges, metres. */
interface IDentalMeasure {
  upperEdge: number;
  lowerEdge: number;
  displayMetres: number;
  overbiteMetres: number;
  overjetMetres: number;
}

function measureDental(basis: IAutoMovieHumanFaceBasis): IDentalMeasure {
  const contact = basis.contact!;
  const edges = faceIncisalEdges(basis);
  const teeth = basis.surfaces.find((one) => one.id === edges.surface)!;
  const y = (vertex: number) => teeth.positions[3 * vertex + 1]!;
  const z = (vertex: number) => teeth.positions[3 * vertex + 2]!;
  const lips = basis.surfaces.find((one) => one.id === contact.lips.surface)!;
  return {
    upperEdge: edges.upper,
    lowerEdge: edges.lower,
    displayMetres: lips.positions[3 * contact.lips.upper + 1]! - y(edges.upper),
    overbiteMetres: y(edges.lower) - y(edges.upper),
    overjetMetres: z(edges.upper) - z(edges.lower),
  };
}
