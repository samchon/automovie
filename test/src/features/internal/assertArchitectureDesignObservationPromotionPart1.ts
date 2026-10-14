import { sameProductData } from "./sameProductData";
import { nclose } from "./nclose";
import { designFrameScale } from "../../../../packages/engine/src/architecture/designFrameScale";
import { designReferenceWorldPoint } from "../../../../packages/engine/src/architecture/designReferenceWorldPoint";
import { promoteDesignObservations } from "../../../../packages/engine/src/architecture/promoteDesignObservations";
import type { IAutoMovieDesignPromotion, IAutoMovieVector3, IAutoMovieDesignReference, IAutoMovieDesignSourceFrame } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { namedFacts, throwsError, vclose } from "./predicates";

/** Execute the next ordered assertions of test_architecture_design_observation_promotion.
 *
 * Scenarios:
 * 1. one clean run promotes and every other reading is withheld with its reason.
 * 2. the two competing centrelines are still both withheld at a floor they both clear.
 * 3. an unopposed 0.6 reading still fails the default certainty floor.
 * 4. lowering the floor on purpose releases the unopposed, unblocked reading only.
 * 5. closing the occlusion issue releases exactly the candidate it blocked.
 * 6. settling the section scale releases the section line and nothing else.
 * 7. claiming the stray reading turns it from unobserved into a promotion.
 * 8. the same reference promotes to the same metres twice.
 * 9. promotion leaves the observation exactly as it was read.
 * 10. the promoted west run is the hand-computed metric polyline.
 * 11. the promoted reading carries the candidate's own semantic label.
 * 12. a point left and above the anchor maps to negative metres.
 * 13. an unnormalized axis states a direction rather than a magnitude.
 * 14. the frame placement transform scales, rotates, then translates the mapping.
 * 15. a degenerate axis maps without dividing by zero.
 * 16. an unsettled scale refuses to produce a world position at all.
 * 17. a settled frame reports its metres per unit and an unsettled one reports none.
 * 18. an invalid reference throws instead of promoting part of it.
 * 19. a floor of zero promotes every unopposed, unblocked, scaled reading.
 *
 * Authored frame scales, local coordinates and placements independently determine promoted world endpoints; declared confidence floors, conflict groups, unresolved scale and open occlusion issues determine eligibility. Replay and source nonmutation compare plain data relations, not external drawing interpretation or provider accuracy.
 * Competing centre lines, low certainty, occlusion and unsettled section scale remain withheld; lowering the floor or resolving the specific blocking issue releases only the eligible candidate. Explicit placement, a degenerate authored axis, missing/unsettled scale, invalid reference and confidence floor, zero-floor release, replay and unchanged source records retain their original cases; actual image parsing is outside this CPU seam.
 */
export function assertArchitectureDesignObservationPromotionPart1(planFrame: () => IAutoMovieDesignSourceFrame, sectionFrame: () => IAutoMovieDesignSourceFrame, observation: () => IAutoMovieDesignReference, verdicts: (mutate: (value: IAutoMovieDesignReference) => void, minimumConfidence?: number) => { promoted: string[]; withheld: string[]; skipped: string[]; }): void {
  const base: { promoted: string[]; withheld: string[]; skipped: string[]; } = verdicts((): void => {});
  TestValidator.equals("one clean run promotes and every other reading is withheld with its reason", base, {
      promoted: ["wall-west"],
      withheld: [
        "wall-north-outer:ambiguous-candidate",
        "wall-north-inner:ambiguous-candidate",
        "room-name:unsupported-geometry",
        "section-wall-line:unknown-scale",
        "stray-reading:unobserved",
      ],
      skipped: ["opening-detection:unsupported", "storey-datum:not-run"],
    });

  TestValidator.equals("the two competing centrelines are still both withheld at a floor they both clear", verdicts((): void => {}, 0.5).withheld.slice(0, 2), [
      "wall-north-outer:ambiguous-candidate",
      "wall-north-inner:ambiguous-candidate",
    ]);

  const unopposed: (value: IAutoMovieDesignReference) => void = (value: IAutoMovieDesignReference): void => {
    value.candidates[1]!.alternatives = [];
    value.candidates[2]!.alternatives = [];
  };
  TestValidator.equals("an unopposed 0.6 reading still fails the default certainty floor", verdicts(unopposed).withheld.slice(0, 2), ["wall-north-outer:low-confidence", "wall-north-inner:open-issue"]);
  TestValidator.equals("lowering the floor on purpose releases the unopposed, unblocked reading only", verdicts(unopposed, 0.5), {
      promoted: ["wall-west", "wall-north-outer"],
      withheld: [
        "wall-north-inner:open-issue",
        "room-name:unsupported-geometry",
        "section-wall-line:unknown-scale",
        "stray-reading:unobserved",
      ],
      skipped: ["opening-detection:unsupported", "storey-datum:not-run"],
    });
  TestValidator.equals("closing the occlusion issue releases exactly the candidate it blocked", verdicts((value: IAutoMovieDesignReference): void => {
      unopposed(value);
      value.issues[0]!.open = false;
    }, 0.5).promoted, ["wall-west", "wall-north-outer", "wall-north-inner"]);
  TestValidator.equals("settling the section scale releases the section line and nothing else", verdicts((value: IAutoMovieDesignReference): string => (value.frames[1]!.scale = "fifty")).promoted, ["wall-west", "section-wall-line"]);
  TestValidator.equals("claiming the stray reading turns it from unobserved into a promotion", verdicts((value: IAutoMovieDesignReference): number | undefined =>
      value.analyses[0]!.outcome.status === "observed"
        ? value.analyses[0]!.outcome.candidates.push("stray-reading")
        : undefined,
    ).promoted, ["wall-west", "stray-reading"]);

  // 7. Determinism and non-mutation.
  const source: IAutoMovieDesignReference = observation();
  const first: IAutoMovieDesignPromotion = promoteDesignObservations({ reference: source });
  const second: IAutoMovieDesignPromotion = promoteDesignObservations({ reference: source });
  TestValidator.predicate("the same reference promotes to the same metres twice", sameProductData(first, second));
  TestValidator.predicate("promotion leaves the observation exactly as it was read", sameProductData(source, observation()));
  TestValidator.equals(
    "the promoted west run is the hand-computed metric polyline",
    namedFacts([
      ["vertexCount", (): boolean => first.promoted[0]!.outlines[0]!.length === 3],
      [
        "start",
        (): boolean => vclose(first.promoted[0]!.outlines[0]![0]!, { x: 1, y: 0, z: 1 }),
      ],
      [
        "corner",
        (): boolean => vclose(first.promoted[0]!.outlines[0]![1]!, { x: 1, y: 0, z: 5 }),
      ],
      [
        "end",
        (): boolean => vclose(first.promoted[0]!.outlines[0]![2]!, { x: 3, y: 0, z: 5 }),
      ],
    ]),
    { vertexCount: true, start: true, corner: true, end: true },
  );
  TestValidator.equals("the promoted reading carries the candidate's own semantic label", first.promoted[0]!.semantic, "wall-centerline");

  // 8. The sheet-to-world mapping.
  TestValidator.predicate(
    "a point left and above the anchor maps to negative metres",
    vclose(designReferenceWorldPoint(planFrame(), { x: -50, y: -100 }), {
      x: -0.5,
      y: 0,
      z: -1,
    }),
  );
  TestValidator.predicate(
    "an unnormalized axis states a direction rather than a magnitude",
    vclose(
      designReferenceWorldPoint(
        { ...planFrame(), axisX: { x: 3, y: 0, z: 0 } },
        { x: 200, y: 0 },
      ),
      { x: 2, y: 0, z: 0 },
    ),
  );
  TestValidator.predicate(
    "the frame placement transform scales, rotates, then translates the mapping",
    vclose(
      designReferenceWorldPoint(
        {
          ...planFrame(),
          transform: {
            translation: { x: 10, y: 1, z: -2 },
            rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
            scale: { x: 2, y: 2, z: 2 },
          },
        },
        { x: 500, y: 400 },
      ),
      { x: 18, y: 1, z: -12 },
    ),
  );
  TestValidator.predicate(
    "a degenerate axis maps without dividing by zero",
    vclose(
      designReferenceWorldPoint(
        { ...planFrame(), axisX: { x: 0, y: 0, z: 0 } },
        { x: 500, y: 400 },
      ),
      { x: 0, y: 0, z: 4 },
    ),
  );
  TestValidator.predicate(
    "an unsettled scale refuses to produce a world position at all",
    throwsError(
      (): IAutoMovieVector3 => designReferenceWorldPoint(sectionFrame(), { x: 1, y: 1 }),
      ["section-1", "no settled scale"],
    ),
  );
  TestValidator.predicate(
    "a settled frame reports its metres per unit and an unsettled one reports none",
    (() : boolean => {
      const observed: (number | null)[] = [
      designFrameScale(planFrame()),
      designFrameScale(sectionFrame()),
      designFrameScale({ ...sectionFrame(), scale: "ghost" }),
    ];
      return (
        Array.isArray(observed) && observed.length === 3 &&
        typeof observed[0]! === "number" && nclose(observed[0]!, 0.01) &&
        observed[1] === null &&
        observed[2] === null
      );
    })(),
  );

  // 10. Refusals.
  TestValidator.predicate(
    "an invalid reference throws instead of promoting part of it",
    throwsError((): void => {
      const value: IAutoMovieDesignReference = observation();
      value.candidates[0]!.primitives[0] = "ghost";
      promoteDesignObservations({ reference: value });
    }, ["pavilion-plan", "$input.candidates[0].primitives[0]"]),
  );
  [-0.1, 1.5, Number.NaN].forEach((floor: number): void =>
    TestValidator.predicate(
      `a confidence floor of ${floor} is refused`,
      throwsError(
        (): IAutoMovieDesignPromotion =>
          promoteDesignObservations({
            reference: observation(),
            minimumConfidence: floor,
          }),
        ["confidence floor"],
      ),
    ),
  );
  TestValidator.equals("a floor of zero promotes every unopposed, unblocked, scaled reading", verdicts((value: IAutoMovieDesignReference): void => {
      unopposed(value);
      value.issues[0]!.open = false;
    }, 0).promoted, ["wall-west", "wall-north-outer", "wall-north-inner"]);
}
