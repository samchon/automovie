import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  type IAutoMovieHumanFaceControlMap,
  createHumanFaceBasisBuilder,
} from "@automovie/human";

/**
 * A rigid collider's cover, as a new basis revision: the thinnest soft
 * tissue that lies over it, which the builder's contact keeps between the
 * collider and any soft vertex that rested farther out.
 *
 * Without it, soft tissue a pose pushed toward a globe came to rest on the
 * globe's surface: the cheek raiser with a smile pressed the lower lid's
 * skin, 1.3 to 2 mm in front of the globe at rest, onto the low-poly globe,
 * where the two coincide and the rendered globe shows through the lid. The
 * lower lid is at its thinnest over the tarsus: the skin-orbicularis
 * complex (0.68 +- 0.18 mm) over the tarsal plate (0.57 +- 0.12 mm) by 50
 * MHz ultrasound biomicroscopy of 30 normal lower lids (Ultrasound
 * biomicroscopic features of the normal lower eyelid, Orbit 2021;40(5),
 * doi:10.1080/01676830.2020.1812094), 1.25 mm; the preseptal lid is thicker
 * (orbicularis 0.89, capsulopalpebral fascia 0.42, retractor-conjunctiva
 * complex 0.79). Every document is built on the revision to check it and
 * restamped with the control map. Pure: the inputs are cloned.
 */
export function prepareColliderCoverBasis(input: {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  revision: string;
  surface: string;
  coverMetres: number;
}): {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  receipt: {
    source: string;
    revision: string;
    surface: string;
    coverMetres: number;
    documents: number;
  };
} {
  const { basis, documents, controls, revision } = structuredClone(input);
  if (revision.trim() === "" || revision === basis.id)
    throw new Error("A collider cover needs a distinct revision.");
  const collider = basis.contact?.colliders.find(
    (one) => one.surface === input.surface,
  );
  if (collider === undefined)
    throw new Error(`No contact collider on ${input.surface}.`);
  collider.coverMetres = input.coverMetres;
  const source = basis.id;
  basis.id = revision;
  const build = createHumanFaceBasisBuilder(basis);
  const restamped = documents.map((document) => {
    const next = { ...document, basis: revision };
    build(next);
    return next;
  });
  return {
    basis,
    documents: restamped,
    controls: { ...controls, basis: revision },
    receipt: {
      source,
      revision,
      surface: input.surface,
      coverMetres: input.coverMetres,
      documents: restamped.length,
    },
  };
}
