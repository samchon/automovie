import {
  type IAutoMovieCapturePlan,
  type IAutoMovieCaptureSubject,
  type IAutoMovieDrawScene,
  type IAutoMovieInspectionHandle,
  planAutoMovieDrawCall,
} from "@automovie/render";

/**
 * Data admission and native request records for the current archetype round.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the current 28-purpose host contract, actual subject ownership, string-only execution boundary and complete native restart/layout admission.
 * @evidence contracts/development/design.md#principled-representation Existing render types carry scenes, clocks and legends; runtime readers admit finite JSON values and the exact reviewed purpose set.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The coordinator, purpose expander and camera resolver share only the records/readers and native text construction each currently consumes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This inspection-only module introduces no product registry, recipe framework, species runtime policy or renderer substitute.
 */
export namespace ArchetypeRoundPlan {
  /**
   * One finite inspection request before camera resolution.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents actual identities, native view/pass meaning and finite subject seconds.
   * @evidence contracts/development/design.md#principled-representation Source names and numeric seconds describe one current capture selection; runtime frame planning rejects invalid times.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The group materializer, camera resolver and coordinator share this record.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No scene, species-specific field or renderer result is encoded here.
   */
  export interface IDraft {
    /** Purpose-group identity and finite allowance owner. */
    group: string;

    /** Actual offered subject identity. */
    subject: string;

    /** Actual member identity, empty for the whole panel. */
    member: string;

    /** Native named view shared across all equivalent passes. */
    view: string;

    /** Existing source plan's pass-recipe identity. */
    pass: string;

    /** Explicit native-normalized subject seconds; finite at admission. */
    seconds: number[];

    /** Native inspection text resolved from the actual scene before admission. */
    inspection?: Record<string, string>;
  }

  /**
   * One actual scene and its native portable description.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States borrowed scene resources and their native metadata.
   * @evidence contracts/development/design.md#principled-representation The installed render contracts own clocks, paths, marks and Three scene data.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The coordinator owns creation/disposal; expansion reads metadata and camera resolution reads the scene.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No duplicate scene representation or fabricated subject facts are introduced.
   */
  export interface IPrepared {
    /** Actual subject scene owned until the coordinator disposes it. */
    scene: IAutoMovieDrawScene;

    /** Native portable description of that same actual scene. */
    metadata: IAutoMovieCaptureSubject;
  }

  /**
   * The capture driver's exact native request entry.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the unique output folder and string-only native options.
   * @evidence contracts/development/design.md#principled-representation Strings represent request text; native parsing admits keys and values at runtime.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The coordinator writes this exact shape for captureArchetypeRound.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Review facts stay in the ledger rather than changing the execution schema.
   */
  export interface IJob {
    /** Unique simple output-folder identity. */
    id: string;

    /** Native all-string capture request. */
    request: Record<string, string>;
  }

  /**
   * One purpose or source failure retained before manifest issuance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the affected group and original cause text.
   * @evidence contracts/development/design.md#principled-representation String identities and error descriptions record unavailable evidence, without a success state.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Current preparation operations share the coordinator's complete failure ledger.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No unavailable consumer is represented as an empty successful result.
   */
  export interface IFailure {
    /** Group or source boundary where evidence was unavailable. */
    group: string;

    /** Original failure description, including its stack when supplied. */
    cause: string;
  }

  /**
   * Actual native selection and legend facts from one prepared state.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents subject/member/view/pass identities, subject seconds and native selection/legend outputs.
   * @evidence contracts/development/design.md#principled-representation Render owns the selected paths and legend contract; numeric seconds retain the subject timebase.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The camera resolver appends these observations for the coordinator's ledger.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts These preparation facts claim no captured pixels or visual correctness.
   */
  export interface IObservation {
    /** Actual subject and member selected at the observed second. */
    subject: string;

    /** Actual member selected within that subject. */
    member: string;

    /** Source named view and existing pass-recipe identities. */
    view: string;

    /** Existing pass-recipe identity at this native state. */
    pass: string;

    /** Subject seconds after native frame normalization. */
    seconds: number;

    /** Paths actually admitted by native inspection. */
    selected: string[];

    /** Actual native kind counts/colors, without a second legend scheme. */
    legend: IAutoMovieInspectionHandle["legend"];
  }

  /**
   * Admit only the reviewed v4, 28-purpose, 536-cell source-ready plan.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the source-ready gate, schema, exact purpose set and finite cap; malformed plan data throws.
   * @evidence contracts/development/implementation.md#principled-implementation Plain JSON field checks enforce the current reviewed inspection contract before model preparation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One top-level object check, one exact purpose-identity set and one return.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No unknown purpose, repeated group or dirty-stage substitute widens this tool's scope.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the fixed 28 purpose identities.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This value operation owns no cross-request work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources No resource or retained state is acquired.
   */
  export function admit(value: unknown): Record<string, unknown> {
    const plan: Record<string, unknown> = object(value);
    if (object(plan.executionGate).sourceBatchComplete !== true)
      throw new Error(
        "Record the completed coherent source batch in the visual plan before materializing it",
      );
    const groups: Record<string, unknown>[] = list(plan.cellGroups).map(object);
    const expected: ReadonlySet<string> = new Set([
      "body-context",
      "body-front-side",
      "body-rear-check",
      "characteristic-top",
      "rig-controls",
      "rig-oblique-controls",
      "combined-equipment",
      "equipment-bearing-closeups",
      "gait-anchors",
      "representative-full-gait-cycles",
      "rest-side-complete",
      "rest-side-anchor-complements",
      "rest-front-anchors",
      "rest-belly-closeups",
      "rest-fresh-session-comparison",
      "armour-kind-survey",
      "siege-form-survey",
      "siege-mechanism-events",
      "rowing-representative-cycle",
      "towing-coupling",
      "actual-bottle-fracture",
      "actual-cannon-release",
      "car-closed-baselines",
      "car-open-right-construction",
      "car-open-left-rear",
      "van-side-passage",
      "armour-opening-complements",
      "long-equid-ear-complements",
    ]);
    if (
      plan.schemaVersion !== 4 ||
      groups.length !== 28 ||
      object(plan.finiteBudget).maximumDrawnCellsPerRound !== 536
    )
      throw new Error(
        "This materializer owns the reviewed v4, 28-purpose, 536-cell plan only",
      );
    const identities: string[] = groups.map(
      (group: Record<string, unknown>): string => text(group.id),
    );
    if (
      new Set(identities).size !== 28 ||
      identities.some((id: string): boolean => !expected.has(id))
    )
      throw new Error("The reviewed purpose identities changed or repeat");
    return plan;
  }

  /**
   * Construct the execution driver's native string-only request.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Reads an existing pass recipe, exact subject/member/times/view and actual subject raster. The native smallest budget equals that raster's shortest edge, preserving scale1 across different job lengths.
   * @evidence contracts/development/implementation.md#principled-implementation Native request text combines the finite draft, actual-scene section override and actual raster budget. Native layout and draw-call admission independently require one cell per sheet and label scale1.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Copy the pass fields, then write subject, selection, seconds, view and reader budget.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No invented pass name or unsupported CLI option is emitted.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the pass fields and explicit time text.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This value operation owns no cross-request work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources No resource or retained state is acquired.
   */
  export function request(
    plan: Record<string, unknown>,
    draft: IDraft,
    view: string,
    raster: Pick<IAutoMovieCaptureSubject, "width" | "height">,
  ): Record<string, string> {
    const request: Record<string, string> = {};
    for (const [key, value] of Object.entries(
      object(object(object(plan.passes)[draft.pass]).request),
    ))
      request[key] = text(value).replaceAll("{member}", draft.member);
    return {
      ...request,
      ...draft.inspection,
      subject: draft.subject,
      parts: draft.member === "" ? "ground,set" : `ground,set/${draft.member}`,
      at: draft.seconds.join(","),
      views: view,
      longest: "1568",
      smallest: String(Math.min(raster.width, raster.height)),
      reduction: "area",
    };
  }

  /**
   * Name the source-view equivalence used to share one fixed camera.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Subject, member and source named view determine equivalence; pass/time are intentionally outside this key.
   * @evidence contracts/development/implementation.md#principled-implementation JSON tuple encoding preserves exact identity without ambiguous string concatenation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One tuple serialization.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No approximate equality merges different cameras or selections.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the three identity strings.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This value operation owns no cross-request work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources No resource or retained state is acquired.
   */
  export function cameraKey(draft: IDraft): string {
    return JSON.stringify([draft.subject, draft.member, draft.view]);
  }

  /**
   * Compare exact purpose cells while allowing their jobs to be split.
   *
   * @param items Current or previously recorded finite drafts.
   * @returns Their sorted exact purpose/subject/member/view/pass/time identities.
   * @evidence contracts/development/common.md#meaningful-documentation States that grouping may differ while every original exact cell remains accounted for.
   * @evidence contracts/development/implementation.md#principled-implementation Admits the recorded fields, unfolds every actual time and sorts exact JSON tuples as a multiset.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One field-admission pass and one sorted serialization.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tolerance, rounded time, set deduplication or group removal hides a missing original.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(C log C) sorting for C finite purpose cells.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Pure value comparison owns no shared work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only invocation-local strings are allocated.
   */
  export function identity(items: readonly unknown[]): string {
    return JSON.stringify(
      items.flatMap((value: unknown): string[] => {
        const draft: Record<string, unknown> = object(value);
        const key: string[] = ["group", "subject", "member", "view", "pass"].map(
          (name: string): string => text(draft[name]),
        );
        return numbers(draft.seconds).map((seconds: number): string =>
          JSON.stringify([...key, seconds]),
        );
      }).sort((left: string, right: string): number =>
        left < right ? -1 : left > right ? 1 : 0,
      ),
    );
  }

  /**
   * Admit restart pairs only with identical complete native draw calls.
   *
   * @param jobs All original and repeat native plans in this finite round.
   * @returns Four pairs with their full native drawing inputs and unchanged label size.
   * @throws {Error} For missing, ambiguous or unequal originals, or enlarged labels.
   * @evidence contracts/development/common.md#meaningful-documentation States exact pair count, complete frame/raster/request/scale comparison and native layout admission. Actual source/backend equality remains the capture record's obligation.
   * @evidence contracts/development/implementation.md#principled-implementation Render's planAutoMovieDrawCall supplies the complete drawing inputs. Original/repeat jobs contain the same two times, so their frame arrays agree without removing a field.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit every layout, then require one identical original per repeated cell.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No reduced equality, tolerance or dropped label scale admits a mismatch; refusal prevents a manifest.
   * @evidence contracts/development/implementation.md#efficient-algorithms Four repeats each scan the finite round's actual cells.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the native plans and draw-call owner.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain result records retain no external resource.
   */
  export function replay(
    jobs: readonly {
      job: string;
      group: string;
      plan: IAutoMovieCapturePlan;
    }[],
  ): object[] {
    const admitted: object[] = [];
    for (const item of jobs)
      if (
        item.plan.layout.perSheet !== 1 ||
        item.plan.cells.some(
          (cell: IAutoMovieCapturePlan["cells"][number]): boolean =>
            planAutoMovieDrawCall(cell, item.plan).scale !== 1,
        )
      )
        throw new Error(`${item.job} does not preserve native-size labels`);
    for (const repeat of jobs.filter(
      (item: (typeof jobs)[number]): boolean =>
        item.group === "rest-fresh-session-comparison",
    ))
      for (const cell of repeat.plan.cells) {
        const call: ReturnType<typeof planAutoMovieDrawCall> =
          planAutoMovieDrawCall(cell, repeat.plan);
        const originals: (typeof jobs)[number][] = jobs.filter(
          (item: (typeof jobs)[number]): boolean =>
            item.group === "rest-side-complete" &&
            item.plan.subject.name === repeat.plan.subject.name &&
            item.plan.cells.some(
              (candidate: IAutoMovieCapturePlan["cells"][number]): boolean =>
                JSON.stringify(planAutoMovieDrawCall(candidate, item.plan)) ===
                JSON.stringify(call),
            ),
        );
        if (originals.length !== 1)
          throw new Error(
            `${repeat.job}/${cell.name} lacks one identical native original`,
          );
        admitted.push({
          original: originals[0]!.job,
          repeat: repeat.job,
          drawCall: call,
        });
      }
    if (admitted.length !== 4)
      throw new Error(
        `Expected four exact restart pairs, received ${admitted.length}`,
      );
    return admitted;
  }

  /**
   * Admit a plain JSON object before indexing its fields.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Rejects null and arrays; returns the object's own fields.
   * @evidence contracts/development/implementation.md#principled-implementation A typeof/null/array guard precedes Object.entries copying.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One guard and one own-field copy.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No cast treats arbitrary parsed data as the plan schema.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the object's own fields.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This value operation owns no cross-request work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources No resource or retained state is acquired.
   */
  export function object(value: unknown): Record<string, unknown> {
    if (typeof value !== "object" || value === null || Array.isArray(value))
      throw new Error("Expected a plan object");
    return Object.fromEntries(Object.entries(value));
  }

  /**
   * Read one native text field without coercion.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Only actual strings are admitted, including the native grammar's valid empty value.
   * @evidence contracts/development/implementation.md#principled-implementation A typeof guard preserves the original string.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One guard and one return.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Numbers, booleans and absent values do not silently become command text.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This value operation owns no cross-request work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources No resource or retained state is acquired.
   */
  export function text(value: unknown): string {
    if (typeof value !== "string") throw new Error("Expected plan text");
    return value;
  }

  /**
   * Read one finite numeric plan input.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Rejects nonnumbers, NaN and infinities; units remain the caller's field contract.
   * @evidence contracts/development/implementation.md#principled-implementation The language's finite-number predicate admits the original value.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One combined type/finite check.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No clamp or default repairs an invalid source second or allowance.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This value operation owns no cross-request work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources No resource or retained state is acquired.
   */
  export function number(value: unknown): number {
    if (typeof value !== "number" || !Number.isFinite(value))
      throw new Error("Expected a finite plan number");
    return value;
  }

  /**
   * Admit a JSON array while preserving unknown element types.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Returns a fresh list; each caller still admits its element fields.
   * @evidence contracts/development/implementation.md#principled-implementation Array.isArray decides shape before copying.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One shape guard and one shallow copy.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An array is not cast into typed purpose records.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the list length.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This value operation owns no cross-request work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources No resource or retained state is acquired.
   */
  export function list(value: unknown): unknown[] {
    if (!Array.isArray(value)) throw new Error("Expected a plan list");
    return [...value];
  }

  /**
   * Admit every member, view or pass identity as text.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Every existing list element must be a string.
   * @evidence contracts/development/implementation.md#principled-implementation The owned list and text readers compose without coercion.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One map over the admitted array.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No invalid element is skipped or replaced.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the list length.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This value operation owns no cross-request work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources No resource or retained state is acquired.
   */
  export function strings(value: unknown): string[] {
    return list(value).map(text);
  }

  /**
   * Admit every explicit finite second in a plan list.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The returned numbers retain the caller's seconds unit.
   * @evidence contracts/development/implementation.md#principled-implementation The owned list and finite-number readers compose.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One map over the admitted array.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No malformed time is dropped to meet the finite cell budget.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the time count.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This value operation owns no cross-request work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources No resource or retained state is acquired.
   */
  export function numbers(value: unknown): number[] {
    return list(value).map(number);
  }

  /**
   * Preserve an original preparation failure for the ledger.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Uses an Error's stack/message or the thrown value's ordinary string form.
   * @evidence contracts/development/implementation.md#principled-implementation The standard Error boundary retains its existing diagnostic.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One Error branch.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No fallback success or changed error classification hides a source failure.
   * @evidence contracts/development/implementation.md#efficient-algorithms Proportional to the error text produced.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This value operation owns no cross-request work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources No resource or retained state is acquired.
   */
  export function describe(error: unknown): string {
    return error instanceof Error
      ? (error.stack ?? error.message)
      : String(error);
  }
}
