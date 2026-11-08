import { AutoMovieHumanBodyAnatomy } from "../../../human/src/generation/AutoMovieHumanBodyAnatomy";
import type { IAutoMovieHumanBodyMeasures } from "../../../human/src/generation/IAutoMovieHumanBodyMeasures";
import type { IAutoMovieHumanParameters } from "../../../human/src/structures/IAutoMovieHumanParameters";
import type { IAutoMovieHumanBodyAnatomy } from "../../../human/src/structures/body/IAutoMovieHumanBodyAnatomy";
import { AutoMovieHumanSex } from "../../../human/src/typings/AutoMovieHumanSex";

/**
 * The editor's body fields: the sex and every measure of
 * `IAutoMovieHumanBodyAnatomy` under its Korean name, each showing the
 * person's resolved value as its placeholder.
 *
 * An entered measure is written to the draft's `body.anatomy`; a cleared one
 * is removed, so the person takes the survey default again.
 *
 * Lengths remain millimetres and body fat remains percent; placeholders are resolved once when the fields are appended, without validating input bounds.
 *
 * @evidence contracts/common.md#principled-implementation The anatomy key union and complete label record bind each numeric input to its public field; sex uses its own select, and edits preserve other draft fields without enforcing anatomy bounds.
 * @evidence contracts/common.md#clear-and-simple-design This namespace keeps the field labels, key type and DOM construction together; anatomy defaults remain the Human resolver's responsibility and generation remains the editor's responsibility.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The Korean labels describe the same public fields for every draft; no person-specific values, substituted results or foreign API replacements are used.
 * @evidence contracts/common.md#meaningful-documentation Documents direct draft mutation, clear-to-default behavior, public units, placeholder snapshots and the absence of bound validation; append documents listener ownership.
 * @evidence contracts/performance.md#efficient-algorithms For M numeric fields, append resolves the fixed anatomy record once and creates O(M) controls, listeners and key storage; visiting every field is required to expose the complete form.
 * @evidence contracts/performance.md#reuse-equivalent-work The module shares one label record across forms, while each append shares one resolved snapshot across its placeholders; changed drafts receive a fresh snapshot when the caller rebuilds the form.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The module retains one fixed label record; each append transfers O(M) DOM nodes and listeners to the caller, whose signal aborts listeners and whose container cleanup releases nodes. The editor keeps one form by aborting and clearing before rebuilding or disposing; this helper imposes no bound on other callers' repeated appends and starts no tasks.
 */
export namespace HumanEditorMeasureFields {
  /**
   * An anatomy field edited as a number, excluding the separately selected sex. Values retain the anatomy field's millimetres or percent; this key type carries no runtime validation.
   *
   * @evidence contracts/common.md#principled-implementation Exclude removes sex from the anatomy interface's key union because every remaining current field is numeric; the alias preserves the public field names without copying them.
   * @evidence contracts/common.md#clear-and-simple-design One derived key union types both the complete label record and indexed draft access, keeping field membership with the anatomy interface.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The alias excludes the actual categorical sex field for its separate select; it has no consumer-specific key list or runtime substitutions.
   * @evidence contracts/common.md#meaningful-documentation Documents the separate sex control, the source fields' units and the absence of runtime validation.
   * @evidence contracts/performance.md#efficient-algorithms This compile-time key projection is erased, adding no runtime traversal, allocation or storage as the anatomy interface grows.
   * @evidence contracts/performance.md#reuse-equivalent-work The alias reads membership directly from the anatomy interface at compilation; it performs no runtime work and maintains no cache to invalidate.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The erased type owns no runtime state, handles or tasks and has no acquisition or release lifecycle.
   */
  export type Measure = Exclude<keyof IAutoMovieHumanBodyAnatomy, "sex">;

  /** Korean label of every numeric measure, in the order the form lists them. */
  export const LABELS: Readonly<Record<Measure, string>> = {
    stature: "키",
    chestCircumference: "가슴둘레",
    underbustCircumference: "밑가슴둘레",
    waistCircumference: "허리둘레",
    highHipCircumference: "위엉덩이둘레",
    hipCircumference: "엉덩이둘레",
    neckBaseCircumference: "목밑둘레",
    neckCircumference: "목둘레",
    bustPointWidth: "가슴점 사이 너비",
    backNeckToWaist: "목뒤점에서 허리 길이",
    acrossBackShoulderWidth: "뒤어깨너비",
    sideNeckToBustPoint: "옆목점에서 가슴점 길이",
    upperArmLength: "위팔길이",
    forearmLength: "아래팔길이",
    upperArmCircumference: "위팔둘레",
    axillaryArmCircumference: "겨드랑 위팔둘레",
    elbowCircumference: "팔꿈치둘레",
    forearmCircumference: "아래팔둘레",
    wristCircumference: "손목둘레",
    forearmBreadth: "아래팔 너비",
    forearmDepth: "아래팔 두께",
    wristSkinBreadth: "손목 피부 너비",
    wristDepth: "손목 두께",
    handCircumference: "손둘레",
    inseam: "다리 안쪽 길이",
    thighCircumference: "허벅지둘레",
    lowerThighCircumference: "무릎 위 허벅지둘레",
    kneeCircumference: "무릎둘레",
    calfCircumference: "종아리둘레",
    biacromialBreadth: "어깨뼈 너비",
    acromialHeight: "어깨끝 높이",
    cervicaleHeight: "목뒤점 높이",
    sideNeckPointHeight: "옆목점 높이",
    suprasternaleHeight: "목앞점 높이",
    axillaHeight: "겨드랑이 높이",
    chestBreadth: "가슴 너비",
    chestDepth: "가슴 두께",
    waistHeight: "허리 높이",
    waistBreadth: "허리 너비",
    waistDepth: "허리 두께",
    hipBreadth: "엉덩이 너비",
    buttockDepth: "엉덩이 두께",
    bideltoidBreadth: "어깨 세모근 너비",
    bicristalBreadth: "엉덩뼈 능선 너비",
    elbowBreadth: "팔꿈치 뼈 너비",
    wristBreadth: "손목 뼈 너비",
    kneeBreadth: "무릎 뼈 너비",
    bimalleolarBreadth: "복사뼈 사이 너비",
    ankleCircumference: "발목 최소 둘레",
    heelBreadth: "발꿈치 너비",
    ballOfFootLength: "발볼 길이",
    ballOfFootCircumference: "발볼 둘레",
    heelAnkleCircumference: "발꿈치-발목 둘레",
    instepLength: "발등 길이",
    glutealFurrowHeight: "볼기 고랑 높이",
    midpatellaHeight: "무릎뼈 중앙 높이",
    calfHeight: "종아리 최대둘레 높이",
    crotchLength: "샅 길이",
    posteriorCrotchLength: "뒤 샅 길이",
    kyphoticAngle: "등 굽음각(°)",
    lordoticAngle: "허리 앞굽음각(°)",
    thumbBreadth: "엄지 너비",
    bodyFatPercentage: "체지방률(%)",
  };

  /**
   * Append the body fields of a draft to a form.
   *
   * Finite changes update the draft in its public units and empty inputs remove overrides; anatomy bounds are not checked here. Placeholders show resolved values rounded to one decimal at append time and stay unchanged after edits.
   *
   * The caller owns appended nodes, including any partial form if construction fails, and must abort listeners and remove nodes when replacing the form.
   *
   * @param fields Container the labelled inputs are appended to.
   * @param draft Detached parameters the inputs edit in place.
   * @param signal Aborts every input listener when the form is rebuilt.
   *
   * @evidence contracts/common.md#principled-implementation Resolve supplies the initial sex and placeholder values from the typed draft; native change handlers write only the chosen anatomy field, delete empty overrides and accept finite numbers without range validation. Placeholder rounding affects display only.
   * @evidence contracts/common.md#clear-and-simple-design One pass appends sex and the complete label record's numeric controls; private helpers own number formatting and label assembly while the caller owns rebuilds and generation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts All drafts use the same public anatomy resolver and field handlers; the two sex options are the supported enum choices, with no fixture-specific values or replaced browser behavior.
   * @evidence contracts/common.md#meaningful-documentation Documents in-place finite edits, removal of empty overrides, unchecked bounds, one-decimal placeholder snapshots, parameter roles and caller cleanup after replacement or construction failure.
   * @evidence contracts/performance.md#efficient-algorithms With M numeric fields, one fixed-size anatomy resolution and one O(M) pass allocate O(M) controls, labels, listeners and keys; the full pass is needed because every field must be editable, and each change handler does constant work.
   * @evidence contracts/performance.md#reuse-equivalent-work Every placeholder in this call reads the same resolved snapshot and shared label record; a new call resolves the current draft again, because edits can change defaults, while DOM nodes and listeners belong to that form and cannot be shared across drafts.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Appending acquires one select and M inputs with their labels and listeners; listeners retain the draft until signal abortion or node collection, and the caller owns cleanup even after partial construction. mountHumanEditor aborts and removes its previous form before rebuilding and at disposal, bounding it to one form; append itself does not bound repeated calls and starts no tasks.
   */
  export function append(
    fields: HTMLElement,
    draft: IAutoMovieHumanParameters,
    signal: AbortSignal,
  ): void {
    const resolved: IAutoMovieHumanBodyMeasures =
      AutoMovieHumanBodyAnatomy.resolve(draft);
    const anatomy = (): IAutoMovieHumanBodyAnatomy => draft.body.anatomy;

    // Sex chooses the survey statistics every omitted measure follows.
    const sexLabel: HTMLLabelElement = document.createElement("label");
    const sex: HTMLSelectElement = document.createElement("select");
    sex.setAttribute("aria-label", "sex");
    for (const [value, text] of [
      [AutoMovieHumanSex.Female, "여성"],
      [AutoMovieHumanSex.Male, "남성"],
    ] as const) {
      const option: HTMLOptionElement = document.createElement("option");
      option.value = value;
      option.textContent = text;
      sex.append(option);
    }
    sex.value = resolved.sex;
    sex.addEventListener(
      "change",
      (): void => {
        anatomy().sex =
          sex.value === AutoMovieHumanSex.Male
            ? AutoMovieHumanSex.Male
            : AutoMovieHumanSex.Female;
      },
      { signal },
    );
    sexLabel.append("성별", sex);
    fields.append(sexLabel);

    for (const name of Object.keys(LABELS) as Measure[]) {
      const input: HTMLInputElement = number(
        name,
        draft.body.anatomy[name] ?? null,
        resolved[name],
      );
      input.addEventListener(
        "change",
        (): void => {
          if (input.value === "") delete anatomy()[name];
          else if (Number.isFinite(input.valueAsNumber))
            anatomy()[name] = input.valueAsNumber;
        },
        { signal },
      );
      fields.append(labelled(LABELS[name], input));
    }
  }

  /** A number input showing a supplied value, or the resolved one as its placeholder. */
  function number(
    name: string,
    value: number | null,
    placeholder: number | null,
  ): HTMLInputElement {
    const input: HTMLInputElement = document.createElement("input");
    input.type = "number";
    input.step = "any";
    input.value = value === null ? "" : String(value);
    if (placeholder !== null) input.placeholder = placeholder.toFixed(1);
    input.setAttribute("aria-label", name);
    return input;
  }

  /** A label holding its text and input. */
  function labelled(text: string, input: HTMLInputElement): HTMLLabelElement {
    const label: HTMLLabelElement = document.createElement("label");
    label.append(text, input);
    return label;
  }
}
