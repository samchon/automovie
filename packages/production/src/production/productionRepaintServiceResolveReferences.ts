import { productionRepaintServiceDiagnostic } from "./productionRepaintServiceDiagnostic";
import { productionRepaintServiceREPAINT_REFERENCE_ROLE_COUNT } from "./productionRepaintServiceREPAINT_REFERENCE_ROLE_COUNT";
import typia from "typia";
import { AutoMovieRepaintReferenceRole, IAutoMovieAssetManifest, IAutoMovieAssetProvenance, IAutoMovieAssetUse, IAutoMovieDiagnostic, IAutoMovieRepaintShot } from "@automovie/interface";
import { IAutoMovieProductionContentInput } from "./IAutoMovieProductionContentInput";
import { IAutoMovieProductionServices } from "./IAutoMovieProductionServices";
import { assetUrlAdmissionRefusal } from "./assetAcquisition";
import { digestAutoMovieBytes } from "./contentIdentity";
import { parseAutoMovieStructuredJson } from "./duplicateAwareJson";

/**
 * Admits declared reference manifests/URLs/roles and digested bytes, rejects duplicate or unbound role identities and returns exact fixed role-specific images or one diagnostic.
 *
 * @evidence contracts/common.md#principled-implementation Admits declared reference manifests/URLs/roles and digested bytes, rejects duplicate or unbound role identities and returns exact fixed role-specific images or one diagnostic.
 * @evidence contracts/common.md#clear-and-simple-design This stage owns role/asset/source binding and digest admission; project content snapshots and duplicate-aware/schema parsing stay with their existing readers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The seven-role saturation refusal is the existing authority contract; the helper admits only current registered digested images rather than fabricating role evidence.
 * @evidence contracts/common.md#meaningful-documentation contentInputs owns fresh file-byte snapshots; reference values retain the selected buffers through provider dispatch, while unrelated snapshot buffers are released after this call. The helper adds no byte copy or global cache.
 * @evidence contracts/performance.md#efficient-algorithms Fresh contentInputs reads all declared content bytes; R requested references each search A asset and I input records and scan use bindings, giving O(R*(A+I)) lookups plus parsing, use scans, hashing and metadata text.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares one fresh complete contentInputs snapshot for manifest and references within this call; each returned image still requires current asset-use binding and byte digest, and the next call reacquires resident content rather than caching a path match.
 * @evidence contracts/performance.md#bound-retention-and-release-resources contentInputs owns fresh file-byte snapshots; reference values retain the selected buffers through provider dispatch, while unrelated snapshot buffers are released after this call. The helper adds no byte copy or global cache.
 */
export const productionRepaintServiceResolveReferences: (services: IAutoMovieProductionServices, input: IAutoMovieRepaintShot.IProps) => { values: Array<{ role: AutoMovieRepaintReferenceRole; path: string; digest: string; bytes: Uint8Array; }>; } | { diagnostic: IAutoMovieDiagnostic; } = (
  services: IAutoMovieProductionServices,
  input: IAutoMovieRepaintShot.IProps,
):
  | {
      values: Array<{
        role: AutoMovieRepaintReferenceRole;
        path: string;
        digest: string;
        bytes: Uint8Array;
      }>;
    }
  | { diagnostic: IAutoMovieDiagnostic } => {
  const manifestPath: "automovie/assets.json" | undefined = services.project.manifest().assetManifest;
  const inputs: IAutoMovieProductionContentInput[] = services.project.contentInputs();
  const manifestInput: IAutoMovieProductionContentInput | undefined =
    manifestPath === undefined
      ? undefined
      : inputs.find((candidate: IAutoMovieProductionContentInput): boolean => candidate.path === manifestPath);
  if (manifestInput?.bytes === null || manifestInput === undefined)
    return {
      diagnostic: productionRepaintServiceDiagnostic(
        "repaint-reference-manifest-missing",
        input.shot,
        "Repaint references require the builder-validated asset manifest and current declared bytes.",
      ),
    };
  let decoded: unknown;
  try {
    decoded = parseAutoMovieStructuredJson({
      record: "asset-manifest",
      bytes: manifestInput.bytes,
    });
  } catch {
    return {
      diagnostic: productionRepaintServiceDiagnostic(
        "repaint-reference-manifest-invalid",
        input.shot,
        "The current asset manifest is not valid JSON. Correct it and compile before repaint.",
      ),
    };
  }
  const validation: typia.IValidation<IAutoMovieAssetManifest> = typia.validateEquals<IAutoMovieAssetManifest>(decoded);
  if (validation.success === false)
    return {
      diagnostic: productionRepaintServiceDiagnostic(
        "repaint-reference-manifest-invalid",
        input.shot,
        "The current asset manifest is malformed. Correct it and compile before repaint.",
      ),
    };
  if (
    validation.data.assets.some(
      (asset: IAutoMovieAssetProvenance): boolean => assetUrlAdmissionRefusal(asset) !== null,
    )
  )
    return {
      diagnostic: productionRepaintServiceDiagnostic(
        "repaint-reference-manifest-invalid",
        input.shot,
        "The current asset manifest contains an inadmissible source or license URL. Correct it and compile before repaint.",
      ),
    };
  const seen: Set<string> = new Set<string>();
  const rolesByDigest: Map<string, Set<AutoMovieRepaintReferenceRole>> = new Map<
    string,
    Set<AutoMovieRepaintReferenceRole>
  >();
  const values: Array<{
    role: AutoMovieRepaintReferenceRole;
    path: string;
    digest: string;
    bytes: Uint8Array;
  }> = [];
  for (const reference of input.references) {
    const key: string = `${reference.role}\0${reference.path}`;
    const record: IAutoMovieAssetProvenance | undefined = validation.data.assets.find(
      (asset: IAutoMovieAssetProvenance): boolean => asset.path === reference.path,
    );
    const resident: IAutoMovieProductionContentInput | undefined = inputs.find(
      (candidate: IAutoMovieProductionContentInput): boolean =>
        candidate.path === reference.path && candidate.bytes !== null,
    );
    if (
      seen.has(key) ||
      record === undefined ||
      resident?.bytes === null ||
      resident === undefined ||
      record.uses.some(
        (use: IAutoMovieAssetUse): boolean =>
          use.production === services.project.productionId &&
          use.consumer.kind === "rendition-reference" &&
          use.consumer.id === input.shot,
      ) === false ||
      digestAutoMovieBytes(resident.bytes) !== record.digest
    )
      return {
        diagnostic: productionRepaintServiceDiagnostic(
          "repaint-reference-invalid",
          input.shot,
          `Reference "${reference.role}:${reference.path}" is duplicate, absent, byte-stale, or not registered as a rendition-reference for shot "${input.shot}". Correct the asset manifest and compile before repaint.`,
        ),
      };
    seen.add(key);
    const roles: Set<AutoMovieRepaintReferenceRole> = rolesByDigest.get(record.digest) ?? new Set();
    roles.add(reference.role);
    rolesByDigest.set(record.digest, roles);
    values.push({
      role: reference.role,
      path: reference.path,
      digest: record.digest,
      bytes: resident.bytes,
    });
  }
  if (
    [...rolesByDigest.values()].some(
      (roles: Set<AutoMovieRepaintReferenceRole>): boolean => roles.size === productionRepaintServiceREPAINT_REFERENCE_ROLE_COUNT,
    )
  )
    return {
      diagnostic: productionRepaintServiceDiagnostic(
        "repaint-reference-invalid",
        input.shot,
        "One reference image cannot stand as canonical guidance for every repaint role. Split structure, identity, costume, style, material, color, and environment authority across reviewed assets.",
      ),
    };
  return { values };
};
