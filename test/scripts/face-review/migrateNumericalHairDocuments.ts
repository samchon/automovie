/**
 * Rebind a complete historical study population to numerical hair documents.
 * The offline migration entry supplies an unchanged facial basis with newly
 * attached shared hair metadata and one explicit scalar hairstyle per document.
 * This owner checks correspondence before replacing the obsolete resource key.
 * Facial weights, skin fields, expression and material overrides are preserved;
 * no curve fitting, personal geometry or identity-dependent rule is used here.
 * Outputs own their data. Admission proves representation and revision integrity,
 * while the caller must separately evaluate and inspect the generated models.
 */
import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  type IAutoMovieHumanFaceControlMap,
  type IAutoMovieHumanFaceHair,
  createHumanFaceBasisBuilder,
  createHumanFaceControlMap,
  parseHumanFaceBasisDocument,
} from "@automovie/human";
import { assertHumanFaceHair } from "@automovie/human/face/anatomy/hair/assertHumanFaceHair";
import { isDeepStrictEqual } from "node:util";

export function migrateNumericalHairDocuments(input: {
  source: IAutoMovieHumanFaceBasis;
  candidate: IAutoMovieHumanFaceBasis;
  documents: (Omit<IAutoMovieHumanFaceBasisDocument, "hair"> & {
    hair?: string | null;
  })[];
  controls: IAutoMovieHumanFaceControlMap;
  hairstyles: { id: string; hair: IAutoMovieHumanFaceHair | null }[];
}) {
  const { source, candidate } = input;
  // Only the revision and query/growth metadata may change in this migration.
  // Comparing every remaining value prevents a topology or expression change
  // from being hidden behind a new basis identity during the document rebind.
  const facialCandidate = {
    ...candidate,
    id: source.id,
    surfaces: candidate.surfaces.map(
      ({ hairDomains: _domains, hairContactClosure: _closure, ...surface }) =>
        surface,
    ),
  };
  if (source.id === candidate.id || !isDeepStrictEqual(source, facialCandidate))
    throw new Error(
      "Hair migration requires a distinct, unchanged facial basis.",
    );
  createHumanFaceBasisBuilder(candidate);
  createHumanFaceControlMap({ basis: source, map: input.controls });
  const { documents, controls, hairstyles } = structuredClone({
    documents: input.documents,
    controls: input.controls,
    hairstyles: input.hairstyles,
  });
  const identities = new Set(documents.map((document) => document.id));
  const profiles = new Map(hairstyles.map((item) => [item.id, item.hair]));
  if (
    identities.size !== documents.length ||
    profiles.size !== hairstyles.length ||
    profiles.size !== identities.size ||
    [...profiles.keys()].some((id) => !identities.has(id))
  )
    throw new Error(
      "Hair migration requires exactly one profile per document.",
    );
  const migrated = documents.map(({ hair, ...face }) => {
    if (
      face.basis !== source.id ||
      (hair !== undefined && hair !== null && typeof hair !== "string")
    )
      throw new Error(
        "A historical document has a different source revision or hair representation.",
      );
    const numericalHair = profiles.get(face.id)!;
    if (numericalHair !== null) assertHumanFaceHair(numericalHair);
    return parseHumanFaceBasisDocument(
      JSON.stringify({ ...face, basis: candidate.id, hair: numericalHair }),
    );
  });
  controls.basis = candidate.id;
  const project = createHumanFaceControlMap({
    basis: candidate,
    map: controls,
  });
  for (const document of migrated) project(document.shape);
  return { documents: migrated, controls };
}
