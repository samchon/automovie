import type { IAutoMovieModel } from "@automovie/interface";

import { assertHumanFaceOralSupport } from "../anatomy/oral/assertHumanFaceOralSupport";
import { readHumanFaceOralCrowns } from "../anatomy/oral/readHumanFaceOralCrowns";
import { serializeHumanFaceOralNativeSource } from "../anatomy/oral/serializeHumanFaceOralNativeSource";
import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";
import type { IAutoMovieHumanFaceOralExportQualification } from "./IAutoMovieHumanFaceOralExportQualification";

/**
 * Supply the admitted current oral source receipt for static export.
 * The factory is called only after the same person/face document built its
 * actual model. It verifies the original native source fingerprint rather
 * than asserting that fingerprint hashes the final posed output. The writer
 * separately binds its actual primitive intervals and Float32 geometry.
 * @author Samchon
 */
export async function createHumanFaceOralExportQualification(
  basis: IAutoMovieHumanFaceBasis,
  document: IAutoMovieHumanFaceBasisDocument,
  model: IAutoMovieModel,
  prefix: "" | "face:" = "",
): Promise<IAutoMovieHumanFaceOralExportQualification | undefined> {
  if (document.oral === undefined) return undefined;
  if (document.basis !== basis.id)
    throw new Error(
      "Oral export qualification needs the document's exact source basis.",
    );
  assertHumanFaceOralSupport(basis, readHumanFaceOralCrowns(basis));
  const support = basis.oralSupport!;
  const source = basis.surfaces.find(
    (surface) => surface.id === support.dentalSurface,
  )!;
  const serialized = serializeHumanFaceOralNativeSource(source);
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(serialized),
  );
  const digest = Array.from(new Uint8Array(bytes), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  if (digest !== support.dentalNativeSha256)
    throw new Error(
      "Oral export source fingerprint differs from its producer receipt.",
    );
  const tongue = basis.surfaces.find(
    (surface) => surface.id === support.tongueSurface,
  );
  if (tongue === undefined)
    throw new Error(
      "Oral export qualification needs its original native tongue source.",
    );
  const tonguePartIds = tongue.regions.map((region) => prefix + region.id);
  if (
    tonguePartIds.length === 0 ||
    new Set(tonguePartIds).size !== tonguePartIds.length ||
    tonguePartIds.some(
      (id) => model.parts.filter((part) => part.id === id).length !== 1,
    )
  )
    throw new Error(
      "Oral export qualification needs every actual native tongue member exactly once.",
    );
  const parts = model.parts
    .filter(
      (part) =>
        part.id.startsWith(prefix + "oral:") || tonguePartIds.includes(part.id),
    )
    .map((part) => ({ id: part.id }));
  if (!model.parts.some((part) => part.id.startsWith(prefix + "oral:")))
    throw new Error(
      "Oral export qualification needs actual generated oral geometry.",
    );
  return {
    version: 1,
    qualification: "coarse-authored-oral-no-clinical-validation",
    generation: support.generation,
    dentalNativeSha256: support.dentalNativeSha256,
    sourceSha256: [...support.sourceSha256],
    sourceLicense: support.sourceLicense,
    clinicalGaps: [
      "Clinical CEJ, long axes and cusp acquisition unavailable",
      "Tissue thickness, muscular mechanics and pharyngeal anatomy uncalibrated",
      "Source oral envelope and crease courses are authored conventions",
      "Population, age, sex and ancestry validity unavailable",
      "Static geometry does not restore the editable numerical document",
    ],
    tonguePartIds,
    parts,
  };
}
