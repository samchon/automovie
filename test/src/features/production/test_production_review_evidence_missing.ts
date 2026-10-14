import { productionReviewEvidenceTestGraph as designGraph } from "../internal/productionReviewEvidenceTestGraph";
import type { IAutoMovieDiagnostic, IAutoMovieShotContract } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { namedFacts } from "../internal/predicates";
import { createReviewEvidenceDiagnosticInputs } from "../internal/createReviewEvidenceDiagnosticInputs";
/**
 * Review diagnostics require each declared frame/pass at the supplied current target identity; these assertions exercise portable obligation membership, not actual rendering, resident byte admission or subjective review.
 *
 * Scenarios:
 *
 * 1. A declared frame-and-pass pair with no committed view is refused, and the message names the frame, its time, and its pass rather than counting.
 * 2. Every declared pair held means nothing is owed.
 * 3. Only `review` and `final` owe pixels; `design` and `source` are the stages where the frames do not exist yet by construction.
 * 4. A view held at a different pass does not discharge the pass that is owed, and a view held at a different time does not discharge the time.
 * 5. A shot the production cannot address yet reports nothing, because a target with no fingerprint has no identity to file evidence under.
 * 6. A contract declaring no review frame owes nothing here; that a shot must declare at least one is a separate design refusal.
 * 7. More owed views than a message should hold are named up to a bound and the remainder is counted, so the author is told which work is left.
 * 8. A staged model owes the whole turntable set rather than an authored one, and a rigged model owes its extreme-range pose on top of it.
 * 9. A model nothing stages owes nothing, because the gate is on what the film puts on screen and not on what the library holds.
 * 10. An asset view is discharged by its own pass and by no other, because the pass lives on the frame rather than on the target it was drawn for.
 * 11. A large resident mask population keeps its actual unresolved identity and maximum mesh count without overflowing a variadic argument list.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises shot/asset review diagnostics and staged-model LOD discovery, asserting exact refusal states and meaningful names; the large mask population catches diagnostic construction aborting before its missing-frame result can be returned.
 * @evidence contracts/testing.md#independent-expectations Frame/pass obligations and the shared review contract define acceptance; the large population explicitly carries one unresolved identity and a final maximum count of seven, so its expected explanation is independent of the maximum implementation.
 * @evidence contracts/testing.md#distinguishing-cases Covers missing/complete/wrong time/pass, snapped timing, scopes, unaddressable targets, bounded obligation naming, rig-only views, LOD/build roots and explicit mask gaps; 150000 observations exercise population growth beyond a variadic call limit without adding an acceptance quota. Byte, filesystem and visible-quality admission belong to other owner tests.
 * @evidence contracts/testing.md#execution-ownership This exported portable unit invokes diagnostic functions through their source seam with supplied fact callbacks, starts no process/browser/GPU, and owns every assertion directly rather than registering another runner.
 */
export function test_production_review_evidence_missing(): void {
    const { run, frame, asset, consumedModelIds, FINGERPRINT }: ReturnType<typeof createReviewEvidenceDiagnosticInputs> = createReviewEvidenceDiagnosticInputs();
    const largeCaptured: NonNullable<Parameters<typeof run>[0]["held"]> = Array.from({ length: 150000 }, (_value: unknown, index: number): NonNullable<Parameters<typeof run>[0]["held"]>[number] => ({
        time: 0,
        pass: "mask",
        semanticCoverage: { unresolved: ["node:shared"], unaddressed: index === 149999 ? 7 : 1 },
    }));
    const largeResult: IAutoMovieDiagnostic[] = run({
        frames: [frame("large-mask", 0, ["mask"])],
        held: largeCaptured,
    });
    TestValidator.equals("large incomplete mask population retains exact gap facts", {
        count: largeResult.length,
        unresolved: largeResult[0]?.message.includes("node:shared"),
        maximum: largeResult[0]?.message.includes("7 unnamed meshes"),
    }, { count: 1, unresolved: true, maximum: true });
    const missing: IAutoMovieDiagnostic[] = run({ frames: [frame("wide", 1.5, ["beauty"])] });
    const complete: IAutoMovieDiagnostic[] = run({
        frames: [frame("wide", 1.5, ["beauty"])],
        held: [{ pass: "beauty", time: 1.5 }],
    });
    const wrongPass: IAutoMovieDiagnostic[] = run({
        frames: [frame("wide", 1.5, ["beauty"])],
        held: [{ pass: "depth", time: 1.5 }],
    });
    const wrongTime: IAutoMovieDiagnostic[] = run({
        frames: [frame("wide", 1.5, ["beauty"])],
        held: [{ pass: "beauty", time: 2 }],
    });
    const many: IAutoMovieDiagnostic[] = run({
        frames: Array.from({ length: 8 }, (_value: unknown, index: number): IAutoMovieShotContract["reviewFrames"][number] => frame(`f${index}`, index, ["beauty"])),
    });
    TestValidator.equals("a review is refused exactly while its declared evidence is absent", namedFacts([
        ["oneRefusal", (): boolean => missing.length === 1],
        ["code", (): boolean => missing[0]?.code === "review-evidence-missing"],
        ["blocking", (): boolean => missing[0]?.category === "error"],
        ["phase", (): boolean => missing[0]?.phase === "review"],
        ["target", (): boolean => missing[0]?.target === "shot:opening"],
        [
            "namesTheFrame",
            (): boolean => missing[0]?.message.includes('"wide" at 1.5s (beauty)') === true,
        ],
        [
            "namesTheIdentity",
            (): boolean => missing[0]?.message.includes(FINGERPRINT) === true,
        ],
        ["completeIsSilent", (): boolean => complete.length === 0],
        [
            "maskNeedsCompleteSemanticEvidence",
            (): boolean => run({
                frames: [frame("identity", 1.5, ["mask"])],
                held: [{ pass: "mask", time: 1.5 }],
            }).length === 1,
        ],
        [
            "maskGapRemainsNamed",
            (): boolean => {
                const diagnostic: IAutoMovieDiagnostic | undefined = run({
                    frames: [frame("identity", 1.5, ["mask"])],
                    held: [
                        {
                            pass: "mask",
                            time: 1.5,
                            semanticCoverage: {
                                unresolved: ["node:missing"],
                                unaddressed: 2,
                            },
                        },
                    ],
                })[0];
                return (diagnostic?.message.includes("node:missing") === true &&
                    diagnostic.message.includes("2 unnamed meshes"));
            },
        ],
        [
            "unaddressedMeshesAloneRemainNamed",
            (): boolean => run({
                frames: [frame("identity", 1.5, ["mask"])],
                held: [
                    {
                        pass: "mask",
                        time: 1.5,
                        semanticCoverage: { unresolved: [], unaddressed: 1 },
                    },
                ],
            })[0]?.message.includes("1 unnamed mesh") === true,
        ],
        [
            "completeMaskIsHeld",
            (): boolean => run({
                frames: [frame("identity", 1.5, ["mask"])],
                held: [
                    {
                        pass: "mask",
                        time: 1.5,
                        semanticCoverage: { unresolved: [], unaddressed: 0 },
                    },
                ],
            }).length === 0,
        ],
        ["passIsNotInterchangeable", (): boolean => wrongPass.length === 1],
        ["timeIsNotInterchangeable", (): boolean => wrongTime.length === 1],
        [
            "designOwesNothing",
            (): boolean => run({ frames: [frame("wide", 1.5, ["beauty"])], scope: "design" })
                .length === 0,
        ],
        [
            "sourceOwesNothing",
            (): boolean => run({ frames: [frame("wide", 1.5, ["beauty"])], scope: "source" })
                .length === 0,
        ],
        [
            "finalOwesPixels",
            (): boolean => run({ frames: [frame("wide", 1.5, ["beauty"])], scope: "final" })
                .length === 1,
        ],
        [
            "unaddressableIsSilent",
            (): boolean => run({
                fingerprint: null,
                frames: [frame("wide", 1.5, ["beauty"])],
            }).length === 0,
        ],
        ["noDeclaredFrameOwesNothing", (): boolean => run({ frames: [] }).length === 0],
        [
            "everyDeclaredPassIsOwed",
            (): boolean => run({
                frames: [frame("wide", 1.5, ["beauty", "depth"])],
                held: [{ pass: "beauty", time: 1.5 }],
            })[0]?.message.includes('"wide" at 1.5s (depth)') === true,
        ],
        ["boundedList", (): boolean => many[0]?.message.includes("and 2 more") === true],
        // Capture records the time the oracle snapped to, not the time a
        // contract asked for, so the comparison is on the frame index. Compared
        // as seconds these two disagree and a frame that exists reads as owed.
        [
            "aDeclaredTimeResolvesOntoItsFrame",
            (): boolean => run({
                frames: [frame("wide", 1.51, ["beauty"])],
                held: [{ pass: "beauty", time: 1.5 }],
            }).length === 0,
        ],
        [
            "aDifferentFrameStillDoesNotDischarge",
            (): boolean => run({
                frames: [frame("wide", 1.51, ["beauty"])],
                held: [{ pass: "beauty", time: 1.4 }],
            }).length === 1,
        ],
        // Pin this diagnostic's end-frame cap with an out-of-domain partial fixture.
                // Actual oracle request-range admission is owned by another test.
        [
            "diagnosticCapsAtContractEnd",
            (): boolean => run({
                frames: [frame("tail", 99, ["beauty"])],
                held: [{ pass: "beauty", time: 6 }],
            }).length === 0,
        ],
        // An asset owes a fixed view set rather than an authored one, so the
        // refusal reads the same set the capture path draws from.
        ["assetOwesItsSet", (): boolean => asset({}).length === 1],
        ["assetTarget", (): boolean => asset({}).at(0)?.target === "asset:soloist"],
        [
            "assetNamesEveryView",
            (): boolean => [
                "turntable-front",
                "turntable-right",
                "turntable-back",
                "left",
            ].every((view: string): boolean => asset({}).at(0)?.message.includes(view) === true),
        ],
        [
            "aRigOwesItsExtremes",
            (): boolean => asset({ rigged: true })
                .at(0)
                ?.message.includes("rig-rom-extremes") === true,
        ],
        [
            "anUnriggedModelDoesNot",
            (): boolean => asset({}).at(0)?.message.includes("rig-rom-extremes") === false,
        ],
        ["assetCompleteIsSilent", (): boolean => asset({ held: true }).length === 0],
        // The consumed set is what the film stages, closed under level of
        // detail, from both the contracts and the compiled shot sources. Reading
        // the materialized inventory instead would return every declared recipe
        // and make the gate a tax on the library.
        [
            "stagesAreConsumed",
            (): boolean => consumedModelIds(designGraph, new Map()).join(",") ===
                "crowd-member,soloist,soloist-far",
        ],
        [
            "aBuildPathModelIsConsumed",
            (): boolean => consumedModelIds(designGraph, new Map([["opening", { models: [{ id: "resolved-by-build" }] }]])).includes("resolved-by-build"),
        ],
        [
            "anUnstagedRecipeIsNotConsumed",
            (): boolean => consumedModelIds(designGraph, new Map()).includes("prop-nobody-stages") === false,
        ],
        // The pass lives on the frame rather than on the target, so a bundle
        // standing at the overhead angle proves nothing about which pass was
        // drawn there.
        [
            "anOutlineViewIsNotSatisfiedByBeauty",
            (): boolean => asset({ heldPasses: ["beauty"] })
                .at(0)
                ?.message.includes('"top-outline" (outline)') === true,
        ],
        [
            "aBeautyViewIsNotSatisfiedByOutline",
            (): boolean => asset({ heldPasses: ["outline"] })
                .at(0)
                ?.message.includes('"turntable-front" (beauty)') === true,
        ],
        [
            "anUnstagedModelOwesNothing",
            (): boolean => asset({ consumed: [] }).length === 0,
        ],
        [
            "anUnaddressableModelIsSilent",
            (): boolean => asset({ fingerprint: null }).length === 0,
        ],
        ["assetDesignOwesNothing", (): boolean => asset({ scope: "design" }).length === 0],
    ]), {
        oneRefusal: true,
        code: true,
        blocking: true,
        phase: true,
        target: true,
        namesTheFrame: true,
        namesTheIdentity: true,
        completeIsSilent: true,
        maskNeedsCompleteSemanticEvidence: true,
        maskGapRemainsNamed: true,
        unaddressedMeshesAloneRemainNamed: true,
        completeMaskIsHeld: true,
        passIsNotInterchangeable: true,
        timeIsNotInterchangeable: true,
        designOwesNothing: true,
        sourceOwesNothing: true,
        finalOwesPixels: true,
        unaddressableIsSilent: true,
        noDeclaredFrameOwesNothing: true,
        everyDeclaredPassIsOwed: true,
        boundedList: true,
        aDeclaredTimeResolvesOntoItsFrame: true,
        aDifferentFrameStillDoesNotDischarge: true,
        diagnosticCapsAtContractEnd: true,
        assetOwesItsSet: true,
        assetTarget: true,
        assetNamesEveryView: true,
        aRigOwesItsExtremes: true,
        anUnriggedModelDoesNot: true,
        assetCompleteIsSilent: true,
        stagesAreConsumed: true,
        aBuildPathModelIsConsumed: true,
        anUnstagedRecipeIsNotConsumed: true,
        anOutlineViewIsNotSatisfiedByBeauty: true,
        aBeautyViewIsNotSatisfiedByOutline: true,
        anUnstagedModelOwesNothing: true,
        anUnaddressableModelIsSilent: true,
        assetDesignOwesNothing: true,
    });
}
