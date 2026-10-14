import type { AutoMovieGuidePass, IAutoMovieDiagnostic, IAutoMovieRenderBundleManifest, IAutoMovieShotContract } from "@automovie/interface";
import path from "node:path";
import { loadSourceModule } from "./loadSourceModule";

/**
 * Load the diagnostic unit from source without making it public API.
 *
 * The test launcher already owns the TypeScript require hook, so resolving at
 * runtime keeps the package source outside this test package's `rootDir` and
 * avoids depending on a pre-existing `packages/production/lib` build.
 */
const unit: {
    consumedModelIds: (graph: {
        models: ReadonlyMap<string, {
            lod: Array<{
                recipe: string;
            }>;
        }>;
        shots: ReadonlyMap<string, {
            participants: Array<{
                kind: string;
                id: string;
            }>;
        }>;
        formations: ReadonlyMap<string, {
            modelRecipe: string;
        }>;
    }, compiled: ReadonlyMap<string, {
        models: Array<{
            id: string;
        }>;
    }>) => string[];
    assetReviewEvidenceDiagnostics: (props: {
        consumed: readonly string[];
        rigged: (model: string) => boolean;
        scope: "design" | "source" | "review" | "final";
        fingerprint: (target: IAutoMovieRenderBundleManifest["target"]) => string | null;
        captured: (target: IAutoMovieRenderBundleManifest["target"], fingerprint: string) => ReadonlyArray<{
            time: number;
            pass: AutoMovieGuidePass;
            semanticCoverage?: {
                unresolved: string[];
                unaddressed: number;
            };
        }>;
    }) => IAutoMovieDiagnostic[];
    reviewEvidenceDiagnostics: (props: {
        contracts: ReadonlyMap<string, IAutoMovieShotContract>;
        fps: number;
        scope: "design" | "source" | "review" | "final";
        fingerprint: (target: IAutoMovieRenderBundleManifest["target"]) => string | null;
        captured: (target: IAutoMovieRenderBundleManifest["target"], fingerprint: string) => ReadonlyArray<{
            time: number;
            pass: AutoMovieGuidePass;
        }>;
    }) => IAutoMovieDiagnostic[];
} = loadSourceModule<{
    consumedModelIds: (graph: {
        models: ReadonlyMap<string, {
            lod: Array<{
                recipe: string;
            }>;
        }>;
        shots: ReadonlyMap<string, {
            participants: Array<{
                kind: string;
                id: string;
            }>;
        }>;
        formations: ReadonlyMap<string, {
            modelRecipe: string;
        }>;
    }, compiled: ReadonlyMap<string, {
        models: Array<{
            id: string;
        }>;
    }>) => string[];
    assetReviewEvidenceDiagnostics: (props: {
        consumed: readonly string[];
        rigged: (model: string) => boolean;
        scope: "design" | "source" | "review" | "final";
        fingerprint: (target: IAutoMovieRenderBundleManifest["target"]) => string | null;
        captured: (target: IAutoMovieRenderBundleManifest["target"], fingerprint: string) => ReadonlyArray<{
            time: number;
            pass: AutoMovieGuidePass;
            semanticCoverage?: {
                unresolved: string[];
                unaddressed: number;
            };
        }>;
    }) => IAutoMovieDiagnostic[];
    reviewEvidenceDiagnostics: (props: {
        contracts: ReadonlyMap<string, IAutoMovieShotContract>;
        fps: number;
        scope: "design" | "source" | "review" | "final";
        fingerprint: (target: IAutoMovieRenderBundleManifest["target"]) => string | null;
        captured: (target: IAutoMovieRenderBundleManifest["target"], fingerprint: string) => ReadonlyArray<{
            time: number;
            pass: AutoMovieGuidePass;
        }>;
    }) => IAutoMovieDiagnostic[];
}>(path.resolve(__dirname, "../../../../packages/production/src/production/reviewEvidenceDiagnostics.ts"));
const { assetReviewEvidenceDiagnostics, consumedModelIds, reviewEvidenceDiagnostics, }: typeof unit = unit;
const FINGERPRINT: string = "sha256:1111111111111111111111111111111111111111111111111111111111111111" as string;
/**
 * Build the six-second review-frame contract subset read by the diagnostic seam. The deliberate narrow cast leaves unrelated full-schema fields outside this portable test. The owning unit supplies frame/pass obligations and checks returned diagnostic names and acceptance states; this fixture has no assertion or schema admission of its own.
 *
 * Duration six is explicit case input, not derived from the diagnostic output. Empty/multiple obligations and the end-cap case reuse this same scalar basis.
 *
 * Only duration and reviewFrames are supplied; the out-of-domain time case pins the diagnostic formula, while actual oracle range admission and complete contract schema are tested elsewhere.
 *
 * The discoverable owning test calls this synchronous Map constructor directly; it opens no file, process, browser or GPU and registers no cases.
 */
const contracts: (frames: IAutoMovieShotContract["reviewFrames"]) => ReadonlyMap<string, IAutoMovieShotContract> = (frames: IAutoMovieShotContract["reviewFrames"]): ReadonlyMap<string, IAutoMovieShotContract> => new Map([
    [
        "opening",
        {
            durationSeconds: 6,
            reviewFrames: frames,
        } as unknown as IAutoMovieShotContract,
    ],
]);
/**
 * Invoke shot review diagnostics with supplied observation/fingerprint callbacks and default 24 fps/review scope; return actual results without constructing expected results. Assertions in the owning test compare this result for missing, complete, wrong-pass/time, scope, identity and large incomplete-mask cases; the wrapper never changes a refusal to success.
 *
 * The held views, explicit fingerprint or fixed sentinel, fps and scope come from case input. The sentinel checks identity reporting only and is not evidence of any real rendered byte hash.
 *
 * Empty/null supplied states and the 150000-record mask population are forwarded; complete-schema, resident bytes and subjective review lie outside these fact callbacks.
 *
 * This is a synchronous portable call through the source seam, with no host process, browser/GPU or dynamically registered test population.
 */
const run: (props: {
    frames: IAutoMovieShotContract["reviewFrames"];
    fps?: number;
    scope?: "design" | "source" | "review" | "final";
    held?: ReadonlyArray<{
        time: number;
        pass: AutoMovieGuidePass;
        semanticCoverage?: {
            unresolved: string[];
            unaddressed: number;
        };
    }>;
    fingerprint?: string | null;
}) => IAutoMovieDiagnostic[] = (props: {
    frames: IAutoMovieShotContract["reviewFrames"];
    fps?: number;
    scope?: "design" | "source" | "review" | "final";
    held?: ReadonlyArray<{
        time: number;
        pass: AutoMovieGuidePass;
        semanticCoverage?: {
            unresolved: string[];
            unaddressed: number;
        };
    }>;
    fingerprint?: string | null;
}): IAutoMovieDiagnostic[] => reviewEvidenceDiagnostics({
    captured: (): NonNullable<Parameters<typeof run>[0]["held"]> => props.held ?? [],
    contracts: contracts(props.frames),
    fingerprint: (): string | null => props.fingerprint === undefined ? FINGERPRINT : props.fingerprint,
    fps: props.fps ?? 24,
    scope: props.scope ?? "review",
});
/**
 * Construct one declared review-frame/pass input, preserving the case's identifier, authored seconds and pass array; unrelated contract-schema fields are intentionally absent. The owning test uses the returned declaration as actual diagnostic input and asserts membership/name outcomes; this constructor alone performs no verification.
 *
 * Identifier, time and passes are explicit supported-contract case values rather than reconstructed expectations from implementation output.
 *
 * Empty, singleton and multiple obligation lists are formed by callers; a time beyond the narrow fixture's duration exercises the helper's cap without claiming oracle range acceptance.
 *
 * This typed partial fixture allocates one record for the portable owning test, with no files, runtime host or dynamic case registration.
 */
const frame: (id: string, time: number, passes: AutoMovieGuidePass[]) => IAutoMovieShotContract["reviewFrames"][number] = (id: string, time: number, passes: AutoMovieGuidePass[]): IAutoMovieShotContract["reviewFrames"][number] => ({ id, passes, time }) as IAutoMovieShotContract["reviewFrames"][number];
/**
 * Invoke asset view diagnostics with supplied rig, target-identity and held-pass facts. Callback records model portable membership rather than capture or resident byte admission. The owning test asserts staged/unused models, fixed view names, rig-only ROM coverage, missing beauty/outline passes, scopes and null target identity from this actual diagnostic result.
 *
 * Case input decides consumed ids, rig flag and held passes; the shared review contract supplies the supported view set and fixed fingerprint sentinel only addresses the fixture callback.
 *
 * Defaults are one soloist, unrigged, review scope and no held passes. Explicit empty consumed list, null fingerprint and alternative passes remain distinct cases instead of synthesized real captures.
 *
 * The synchronous source-unit wrapper starts no renderer, browser/GPU or process and registers no cases; physical byte and visual correctness require separate owners.
 */
const asset: (props: {
    consumed?: readonly string[];
    held?: boolean;
    heldPasses?: AutoMovieGuidePass[];
    rigged?: boolean;
    scope?: "design" | "source" | "review" | "final";
    fingerprint?: string | null;
}) => IAutoMovieDiagnostic[] = (props: {
    consumed?: readonly string[];
    held?: boolean;
    heldPasses?: AutoMovieGuidePass[];
    rigged?: boolean;
    scope?: "design" | "source" | "review" | "final";
    fingerprint?: string | null;
}): IAutoMovieDiagnostic[] => assetReviewEvidenceDiagnostics({
    captured: (): ReadonlyArray<{
        time: number;
        pass: AutoMovieGuidePass;
    }> => (props.heldPasses ?? (props.held === true ? ["beauty", "outline"] : [])).map((pass: AutoMovieGuidePass): {
        time: number;
        pass: AutoMovieGuidePass;
    } => ({ pass, time: 0 })),
    consumed: props.consumed ?? ["soloist"],
    fingerprint: (): string | null => props.fingerprint === undefined ? FINGERPRINT : props.fingerprint,
    rigged: (): boolean => props.rigged === true,
    scope: props.scope ?? "review",
});
/** Return the original module-loaded diagnostic functions and existing case constructors by reference. Loading still happens once while this module is imported; this accessor creates no fixtures or cases and performs no additional source load. The original partial contract arrangements retain their stated schema-admission limitation. */
export function createReviewEvidenceDiagnosticInputs(): { run: typeof run; frame: typeof frame; asset: typeof asset; consumedModelIds: typeof consumedModelIds; FINGERPRINT: string } {
  return { run, frame, asset, consumedModelIds, FINGERPRINT };
}
