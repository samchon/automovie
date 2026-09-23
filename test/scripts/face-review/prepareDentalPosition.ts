import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  type IAutoMovieHumanFaceControlMap,
  createHumanFaceBasisBuilder,
} from "@automovie/human";

/**
 * Place a contact basis's dentition at the population's resting incisal
 * display, as a new basis revision.
 *
 * `prepare-dental-basis.ts` calls this with the published basis. The display
 * of the maxillary central incisor below the upper lip at rest is a measured
 * population quantity: 1.91 mm in men and 3.4 mm in women (Vig & Brundo, J
 * Prosthet Dent 1978), 2.5 and 3.8 mm in a later sample of 104 adults
 * (Misch 2011). The source basis hid the incisal edge 0.56 mm above the lip
 * seam although its upper lip length (subnasale to stomion, 20.5 mm) is
 * ordinary and its incisors meet within the cephalometric norms (overbite
 * 1.67 mm, overjet 0.97 mm), so the dentition's height, not the lip or the
 * bite, was misplaced, and no smile could show the upper teeth. The whole
 * dentition surface (both arches, so the bite is kept) and the tongue that
 * rests within it are translated vertically by one rigid shift that brings
 * the display to the requested value. Endpoint rows are displacements and
 * stay valid; the contact pairs, colliders, attachments and budgets keep
 * their vertex identities, and the real builder must admit the neutral and
 * every document before the revision is returned.
 *
 * The contact's incisal pair is where the two crowns meet, which is not
 * their edges, so each edge is read from the crown that holds the pair's
 * vertex: the connected component of the dentition surface, lowest vertex
 * for the upper crown and highest for the lower. Display is the upper lip
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
  revision: string;
}): {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  receipt: {
    source: string;
    revision: string;
    shiftMetres: number;
    before: IDentalMeasure;
    after: IDentalMeasure;
    moved: string[];
  };
} {
  const { basis, documents, controls, displayMetres, revision } =
    structuredClone(input);
  const contact = basis.contact;
  if (contact === undefined)
    throw new Error("Dental placement needs a contact basis.");
  if (revision.trim() === "" || revision === basis.id)
    throw new Error("Dental placement needs a distinct revision.");
  if (!Number.isFinite(displayMetres))
    throw new Error("The resting incisal display must be finite.");
  const before = measureDental(basis);
  const shift = -(displayMetres - before.displayMetres);
  const moved = [contact.incisors.surface, contact.passage.surface];
  for (const id of moved) {
    const surface = basis.surfaces.find((one) => one.id === id)!;
    for (let i = 1; i < surface.positions.length; i += 3)
      surface.positions[i] += shift;
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
      before,
      after: measureDental(basis),
      moved,
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
  const teeth = basis.surfaces.find(
    (one) => one.id === contact.incisors.surface,
  )!;
  const parent = Array.from(
    { length: teeth.positions.length / 3 },
    (_, index) => index,
  );
  const root = (vertex: number): number => {
    while (parent[vertex] !== vertex) vertex = parent[vertex]!;
    return vertex;
  };
  for (let t = 0; t < teeth.indices.length; t += 3)
    for (let k = 1; k < 3; ++k)
      parent[root(teeth.indices[t + k]!)] = root(teeth.indices[t]!);
  const crown = (vertex: number) =>
    parent.flatMap((_, other) => (root(other) === root(vertex) ? [other] : []));
  const y = (vertex: number) => teeth.positions[3 * vertex + 1]!;
  const z = (vertex: number) => teeth.positions[3 * vertex + 2]!;
  if (root(contact.incisors.upper) === root(contact.incisors.lower))
    throw new Error("The incisal pair must lie on two separate crowns.");
  const upperEdge = crown(contact.incisors.upper).reduce((best, vertex) =>
    y(vertex) < y(best) ? vertex : best,
  );
  const lowerEdge = crown(contact.incisors.lower).reduce((best, vertex) =>
    y(vertex) > y(best) ? vertex : best,
  );
  const lips = basis.surfaces.find((one) => one.id === contact.lips.surface)!;
  return {
    upperEdge,
    lowerEdge,
    displayMetres: lips.positions[3 * contact.lips.upper + 1]! - y(upperEdge),
    overbiteMetres: y(lowerEdge) - y(upperEdge),
    overjetMetres: z(upperEdge) - z(lowerEdge),
  };
}
