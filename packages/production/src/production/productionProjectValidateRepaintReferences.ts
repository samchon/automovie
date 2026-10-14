import type { IAutoMovieProductionContentInput } from "./IAutoMovieProductionContentInput";
import type { IAutoMovieAssetProvenance, IAutoMovieAssetUse, AutoMovieRepaintReferenceRole, IAutoMovieAssetManifest, IAutoMovieRepaintReceipt } from "@automovie/interface";

import typia from "typia";
import { assetUrlAdmissionRefusal } from "./assetAcquisition";
import { digestAutoMovieBytes } from "./contentIdentity";
import { parseAutoMovieStructuredJson } from "./duplicateAwareJson";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectRepaintReferenceRoleCount } from "./productionProjectRepaintReferenceRoleCount";
import { productionProjectProjectLayout } from "./productionProjectProjectLayout";
import { productionProjectContentInputs } from "./productionProjectContentInputs";

/**
 * Admit every fixed reference against the current declared asset inventory and its resident byte/use ownership.
 *
 * @evidence contracts/common.md#principled-implementation Complete content observation supplies the declared asset manifest; duplicate-aware exact schema and source/license URL policy precede role/path uniqueness, resident digest and shot rendition-reference use checks, then digest-role grouping refuses one image covering every role.
 * @evidence contracts/common.md#clear-and-simple-design Reference policy consumes the existing content inventory and provenance records instead of reading arbitrary external locations or introducing another asset manifest.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No empty reference set, stale bytes or unregistered shot use is admitted; source/license URL admission is local policy validation and does not claim to fetch or verify remote availability.
 * @evidence contracts/common.md#meaningful-documentation Defines role/path duplicate refusal, current asset and resident byte requirements and all-role single-digest refusal; malformed manifests and content ownership errors propagate without replacement guidance.
 * @evidence contracts/performance.md#efficient-algorithms Includes complete content enumeration/read cost, asset JSON/schema/URL traversal and linear inventory/asset searches per R references, plus use scans and hashing each referenced resident byte population; repeated digest bytes are hashed again when supplied under distinct references.
 * @evidence contracts/performance.md#reuse-equivalent-work One current content inventory and parsed manifest serve every reference, while seen keys and digest-role sets serve duplicate/role checks; no cross-call asset result replaces fresh declared bytes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The complete content inventory's byte arrays remain local for the pass, alongside manifest records and O(R) membership sets; nested readers own cleanup and the operation returns no retained asset buffer, URL task or cache.
 */
export function productionProjectValidateRepaintReferences(state: AutoMovieProductionProjectState, receipt: IAutoMovieRepaintReceipt): void {
    const assetManifest: "automovie/assets.json" = productionProjectProjectLayout.assetManifest;
    const inputs: IAutoMovieProductionContentInput[] = productionProjectContentInputs(state);
    const manifestInput: IAutoMovieProductionContentInput | undefined = inputs.find((input: IAutoMovieProductionContentInput): boolean => input.path === assetManifest);
    if (manifestInput?.bytes === null || manifestInput === undefined)
        throw new Error("Repaint receipt references require the current declared asset manifest.");
    let decoded: unknown;
    try {
        decoded = parseAutoMovieStructuredJson({
            record: "asset-manifest",
            bytes: manifestInput.bytes,
        });
    }
    catch {
        throw new Error("Repaint asset manifest is not valid JSON.");
    }
    const validation: typia.IValidation<IAutoMovieAssetManifest> = typia.validateEquals<IAutoMovieAssetManifest>(decoded);
    if (validation.success === false)
        throw new Error("Repaint asset manifest does not match its strict schema.");
    if (validation.data.assets.some((asset: IAutoMovieAssetProvenance): boolean => assetUrlAdmissionRefusal(asset) !== null))
        throw new Error("Repaint asset manifest contains an inadmissible source or license URL.");
    const seen: Set<string> = new Set<string>();
    const rolesByDigest: Map<string, Set<AutoMovieRepaintReferenceRole>> = new Map<string, Set<AutoMovieRepaintReferenceRole>>();
    if (receipt.references.length === 0)
        throw new Error("Repaint receipt requires at least one fixed reference.");
    for (const reference of receipt.references) {
        const key: string = `${reference.role}\0${reference.path}`;
        const record: IAutoMovieAssetProvenance | undefined = validation.data.assets.find((asset: IAutoMovieAssetProvenance): boolean => asset.path === reference.path);
        const resident: IAutoMovieProductionContentInput | undefined = inputs.find((input: IAutoMovieProductionContentInput): boolean => input.path === reference.path && input.bytes !== null);
        if (seen.has(key) ||
            record === undefined ||
            resident?.bytes === null ||
            resident === undefined ||
            record.digest !== reference.digest ||
            digestAutoMovieBytes(resident.bytes) !== reference.digest ||
            record.uses.some((use: IAutoMovieAssetUse): boolean => use.production === state.productionId &&
                use.consumer.kind === "rendition-reference" &&
                use.consumer.id === receipt.shot) === false)
            throw new Error(`Repaint reference "${reference.role}:${reference.path}" is duplicate, absent, byte-stale, or not registered to shot "${receipt.shot}".`);
        seen.add(key);
        const roles: Set<AutoMovieRepaintReferenceRole> = rolesByDigest.get(reference.digest) ?? new Set();
        roles.add(reference.role);
        rolesByDigest.set(reference.digest, roles);
    }
    if ([...rolesByDigest.values()].some((roles: Set<AutoMovieRepaintReferenceRole>): boolean => roles.size === productionProjectRepaintReferenceRoleCount))
        throw new Error("One repaint reference image cannot stand as canonical guidance for every role.");
}
