import { type IAutoMovieAssetUse, type IAutoMovieExternalMotionReceiptResource, AutoMovieDiagnosticCode, IAutoMovieAssetManifest, IAutoMovieAssetProvenance, IAutoMovieDiagnostic, IAutoMovieExternalMotionConversionReceipt, IAutoMovieProductionManifest } from "@automovie/interface";
import { type IAutoMovieExternalModelInspection, inspectAutoMovieExternalModelBytes } from "@automovie/ingest";

import typia from "typia";
import { type IAutoMovieProductionContentInput } from "../IAutoMovieProductionContentInput";
import { assetUrlAdmissionRefusal } from "../assetAcquisition";
import { compareCodeUnits } from "../contentIdentity";
import { parseAutoMovieStructuredJson } from "../duplicateAwareJson";
import { IAutoMovieExternalModelRuntimeBinding } from "../materializeProduction";
import { AutoMovieModelArchetypeRegistry } from "../productionArchetypes";
import { errorMessage } from "../designDerivation/errorMessage";
import { type IProductionExternalMotionAdoption } from "../IProductionExternalMotionAdoption";
import { IAutoMovieProductionDesignGraph } from "../validateProductionDesign";
import { refuseUnsupportedExternalInstancing } from "./refuseUnsupportedExternalInstancing";
import { type IProductionAssetInventoryContext } from "./IProductionAssetInventoryContext";
import { inspectProductionAssetMotions } from "./inspectProductionAssetMotions";
import { validateProductionAssetRecords } from "./validateProductionAssetRecords";
import { inspectProductionAssetModels } from "./inspectProductionAssetModels";
import { validateProductionAssetResources } from "./validateProductionAssetResources";
import { bindProductionAssetModels } from "./bindProductionAssetModels";
import { adoptProductionAssetMotions } from "./adoptProductionAssetMotions";

/**
 * Resolve a declared ledger into byte-pinned asset, model and motion populations, retaining ordered diagnostics.
 *
 * @evidence contracts/common.md#principled-implementation Strict structured JSON and exact ledger validation precede ordered motion, record, model, resource-use and adoption phases. Caller inventories supply physical membership and keep borrowed byte views stable during this synchronous observation; absent manifest configuration returns empty populations.
 * @evidence contracts/common.md#clear-and-simple-design Film build and library-derived input acquisition share this owner; internal phases preserve original effects and reverse consumer gates remain with compiled audio, texture, environment and design-reference owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Partial populations may coexist with errors; the build can still materialize and evaluate sources, but finishAutoMovieProductionBuild refuses successful publication when any error remains. Generated proxy dimensions do not prove mesh enclosure, centering or humanoid depth, and warning-only material advice does not suppress valid model binding.
 * @evidence contracts/common.md#meaningful-documentation Documents empty/missing/invalid-ledger states, ordered diagnostics, partial-result admission, borrowed current bytes and the explicit profile/proxy/consumer premises.
 * @evidence contracts/performance.md#efficient-algorithms Includes complete JSON/schema/hash scans, repeated record searches across assets, resources, LODs and recipes, actual ingest/adoption workloads and closure sorting; repeated searches can be quadratic in ledger population.
 * @evidence contracts/performance.md#reuse-equivalent-work Content/path maps and successful motion inspections/closures are reused within this invocation; each separate inventory observes current mutable bytes without a path-only result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Maps, closures and diagnostics grow with supplied assets, uses, sidecars and recipes without a numeric quota; returned populations transfer to the caller, and borrowed input bytes acquire no file, process or GPU handle.
 *
 * @author Samchon
 */
export function productionAssetInventory(
  manifestPath: IAutoMovieProductionManifest["assetManifest"],
  inputs: readonly IAutoMovieProductionContentInput[],
  productionId: string,
  graph: IAutoMovieProductionDesignGraph,
  archetypes: AutoMovieModelArchetypeRegistry,
): {
  assets: string[];
  records: IAutoMovieAssetProvenance[];
  externalModels: Map<string, IAutoMovieExternalModelRuntimeBinding>;
  externalMotions: Map<string, IProductionExternalMotionAdoption>;
  diagnostics: IAutoMovieDiagnostic[];
} {
if (manifestPath === undefined)
    return {
      assets: [],
      records: [],
      externalModels: new Map(),
      externalMotions: new Map(),
      diagnostics: [],
    };
const diagnostics: IAutoMovieDiagnostic[] = [];
const diagnostic: (code: AutoMovieDiagnosticCode, target: string, message: string) => void = (
    code: AutoMovieDiagnosticCode,
    target: string,
    message: string,
  ): void => {
    diagnostics.push({
      code,
      category: "error",
      phase: "project",
      target,
      path: manifestPath,
      message,
    });
  };
const warning: (code: AutoMovieDiagnosticCode, target: string, message: string) => void = (
    code: AutoMovieDiagnosticCode,
    target: string,
    message: string,
  ): void => {
    diagnostics.push({
      code,
      category: "warning",
      phase: "project",
      target,
      path: manifestPath,
      message,
    });
  };
const manifestInput: IAutoMovieProductionContentInput | undefined = inputs.find((entry: IAutoMovieProductionContentInput) : boolean => entry.path === manifestPath);
if (manifestInput?.bytes === null || manifestInput === undefined) {
    diagnostic(
      "asset-manifest-missing",
      "asset-manifest",
      `Production manifest declares "${manifestPath}", but that physical provenance ledger is absent. Restore it before compiling asset references.`,
    );
    return {
      assets: [],
      records: [],
      externalModels: new Map(),
      externalMotions: new Map(),
      diagnostics,
    };
  }
let decoded: unknown;
try {
    decoded = parseAutoMovieStructuredJson({
      record: "asset-manifest",
      bytes: manifestInput.bytes,
    });
  } catch (error) {
    diagnostic(
      "asset-manifest-invalid",
      "asset-manifest",
      `Asset manifest is not valid JSON: ${errorMessage(error)}. Restore one IAutoMovieAssetManifest before compiling.`,
    );
    return {
      assets: [],
      records: [],
      externalModels: new Map(),
      externalMotions: new Map(),
      diagnostics,
    };
  }
const validation: typia.IValidation<IAutoMovieAssetManifest> = typia.validateEquals<IAutoMovieAssetManifest>(decoded);
if (validation.success === false) {
    diagnostic(
      "asset-manifest-invalid",
      "asset-manifest",
      `Asset manifest does not satisfy IAutoMovieAssetManifest: ${validation.errors
        .map((error: typia.IValidation.IError) : string => `${error.path}: ${error.expected}`)
        .join("; ")}. Correct the typed asset manifest before compiling.`,
    );
    return {
      assets: [],
      records: [],
      externalModels: new Map(),
      externalMotions: new Map(),
      diagnostics,
    };
  }
const records: IAutoMovieAssetProvenance[] = validation.data.assets;
validation.data.assets = [];
for (const asset of records) {
    const refusal: { field: "original" | "license"; reason: "credential-bearing"; } | null = assetUrlAdmissionRefusal(asset);
    if (refusal === null) {
      validation.data.assets.push(asset);
      continue;
    }
    diagnostic(
      "asset-provenance-incomplete",
      asset.path,
      `Asset "${asset.path}" ${refusal.field} locator contains credentials. Remove the secret from the asset metadata.`,
    );
  }
const content: Map<string, IAutoMovieProductionContentInput> = new Map(inputs.map((entry: IAutoMovieProductionContentInput) : [string, IAutoMovieProductionContentInput] => [entry.path, entry]));
const paths: Map<string, string> = new Map<string, string>();
const assets: string[] = validation.data.assets
    .filter((asset: IAutoMovieAssetProvenance) : boolean =>
      asset.uses.some((use: IAutoMovieAssetUse) : boolean => use.production === productionId),
    )
    .map((asset: IAutoMovieAssetProvenance) : string => asset.path);
const orderedPaths: string[] = validation.data.assets.map((asset: IAutoMovieAssetProvenance) : string => asset.path);
if (
    orderedPaths.some(
      (asset: string, index: number) : boolean =>
        index !== 0 && compareCodeUnits(orderedPaths[index - 1]!, asset) >= 0,
    )
  )
    diagnostic(
      "asset-manifest-order",
      "asset-manifest",
      "Asset entries must be in unique canonical path order. Sort them by code unit and remove duplicates before compiling.",
    );
const activeConsumerAssets: Map<string, string> = new Map<string, string>();
const consumedModelResources: Set<string> = new Set<string>();
const consumedMotionResources: Set<string> = new Set<string>();
const motionInspections: Map<string, IAutoMovieExternalModelInspection> = new Map<
    string,
    ReturnType<typeof inspectAutoMovieExternalModelBytes>
  >();
const motionClosures: Map<string, IAutoMovieExternalMotionReceiptResource[]> = new Map<
    string,
    IAutoMovieExternalMotionConversionReceipt["source"]["closure"]
  >();
const externalByAsset: Map<string, Omit<IAutoMovieExternalModelRuntimeBinding, "asset" | "lod">> = new Map<
    string,
    Omit<IAutoMovieExternalModelRuntimeBinding, "asset" | "lod">
  >();
const context: IProductionAssetInventoryContext = { records: validation.data.assets, content, paths, activeConsumerAssets, consumedModelResources, consumedMotionResources, motionInspections, motionClosures, externalByAsset, diagnostics, diagnostic, warning, graph, archetypes, productionId, manifestPath };
inspectProductionAssetMotions(context);
validateProductionAssetRecords(context);
inspectProductionAssetModels(context);
validateProductionAssetResources(context);
const externalModels: Map<string, IAutoMovieExternalModelRuntimeBinding> = bindProductionAssetModels(context);
const externalMotions: Map<string, IProductionExternalMotionAdoption> = adoptProductionAssetMotions(context);
refuseUnsupportedExternalInstancing(graph, externalModels, diagnostic);
return {
    assets,
    records: validation.data.assets,
    externalModels,
    externalMotions,
    diagnostics,
  };
}
