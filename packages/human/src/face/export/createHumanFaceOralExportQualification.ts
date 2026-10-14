import type {
  IAutoMovieModel,
  IAutoMovieModelPart as IAutoMovieModelPartImported,
} from "@automovie/interface";

import type {
  IAutoMovieHumanFaceBasisRegion as IAutoMovieHumanFaceBasisRegionImported,
  IAutoMovieHumanFaceBasisSurface as IAutoMovieHumanFaceBasisSurfaceImported,
  IAutoMovieHumanFaceOralSupport as IAutoMovieHumanFaceOralSupportImported,
} from "../../index";
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
 *
 * @evidence contracts/common.md#principled-implementation Same-document accepted runtimes supply exact basis revision and built geometry; SHA-256 of canonical ordered native dental serialization must match the producer receipt. Actual oral/tongue ids are checked, while the writer separately binds packed output intervals.
 * @evidence contracts/common.md#clear-and-simple-design This async factory owns original-source qualification; support/serialization/hash APIs and static correspondence retain their independent admission roles.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing source, wrong native digest or absent/duplicate tongue members refuse. Prefix is the face/Person namespace; license/hash syntax proves neither authentic rights nor final posed/clinical geometry. Arbitrary mismatched models are outside the same-built-document premise.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes original from posed fingerprint, same document/basis and separate static admission; undefined means no oral request and output records explicit clinical/editable gaps.
 * @evidence contracts/performance.md#efficient-algorithms Source serialization/UTF-8/digest follows source bytes; K tongue ids scan P parts and selection tests K ids per part. Actual source-support admission adds its own population cost.
 * @evidence contracts/performance.md#reuse-equivalent-work One canonical serializer defines the producer fingerprint and one digest serves comparison; changed mutable source/model requires new qualification rather than cached authority by id.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Awaited WebCrypto and source byte/string buffers belong to this invocation; copied receipts/ids transfer and no file, network/GPU handle or qualification history is retained.
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
  const support: IAutoMovieHumanFaceOralSupportImported = basis.oralSupport!;
  const source: IAutoMovieHumanFaceBasisSurfaceImported = basis.surfaces.find(
    (surface: IAutoMovieHumanFaceBasisSurfaceImported): boolean =>
      surface.id === support.dentalSurface,
  )!;
  const serialized: string = serializeHumanFaceOralNativeSource(source);
  const bytes: ArrayBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(serialized),
  );
  const digest: string = Array.from(
    new Uint8Array(bytes),
    (byte: number): string => byte.toString(16).padStart(2, "0"),
  ).join("");
  if (digest !== support.dentalNativeSha256)
    throw new Error(
      "Oral export source fingerprint differs from its producer receipt.",
    );
  const tongue: IAutoMovieHumanFaceBasisSurfaceImported | undefined =
    basis.surfaces.find(
      (surface: IAutoMovieHumanFaceBasisSurfaceImported): boolean =>
        surface.id === support.tongueSurface,
    );
  if (tongue === undefined)
    throw new Error(
      "Oral export qualification needs its original native tongue source.",
    );
  const tonguePartIds: string[] = tongue.regions.map(
    (region: IAutoMovieHumanFaceBasisRegionImported): string =>
      prefix + region.id,
  );
  if (
    tonguePartIds.length === 0 ||
    new Set(tonguePartIds).size !== tonguePartIds.length ||
    tonguePartIds.some(
      (id: string): boolean =>
        model.parts.filter(
          (part: IAutoMovieModelPartImported): boolean => part.id === id,
        ).length !== 1,
    )
  )
    throw new Error(
      "Oral export qualification needs every actual native tongue member exactly once.",
    );
  const parts: { id: string }[] = model.parts
    .filter(
      (part: IAutoMovieModelPartImported): boolean =>
        part.id.startsWith(prefix + "oral:") || tonguePartIds.includes(part.id),
    )
    .map((part: IAutoMovieModelPartImported): { id: string } => ({
      id: part.id,
    }));
  if (
    !model.parts.some((part: IAutoMovieModelPartImported): boolean =>
      part.id.startsWith(prefix + "oral:"),
    )
  )
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
