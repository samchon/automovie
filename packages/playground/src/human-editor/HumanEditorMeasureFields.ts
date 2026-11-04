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
 */
export namespace HumanEditorMeasureFields {
  /** A numeric measure of the anatomy record. */
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
    elbowCircumference: "팔꿈치둘레",
    forearmCircumference: "아래팔둘레",
    wristCircumference: "손목둘레",
    handCircumference: "손둘레",
    inseam: "다리 안쪽 길이",
    thighCircumference: "허벅지둘레",
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
    crotchLength: "샅 길이",
    posteriorCrotchLength: "뒤 샅 길이",
    thumbBreadth: "엄지 너비",
    bodyFatPercentage: "체지방률(%)",
  };

  /**
   * Append the body fields of a draft to a form.
   *
   * @param fields Container the labelled inputs are appended to.
   * @param draft Detached parameters the inputs edit in place.
   * @param signal Aborts every input listener when the form is rebuilt.
   */
  export function append(fields: HTMLElement, draft: IAutoMovieHumanParameters, signal: AbortSignal): void {
    const resolved: IAutoMovieHumanBodyMeasures = AutoMovieHumanBodyAnatomy.resolve(draft);
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
        anatomy().sex = sex.value === AutoMovieHumanSex.Male ? AutoMovieHumanSex.Male : AutoMovieHumanSex.Female;
      },
      { signal },
    );
    sexLabel.append("성별", sex);
    fields.append(sexLabel);

    for (const name of Object.keys(LABELS) as Measure[]) {
      const input: HTMLInputElement = number(name, draft.body.anatomy[name] ?? null, resolved[name]);
      input.addEventListener(
        "change",
        (): void => {
          if (input.value === "") delete anatomy()[name];
          else if (Number.isFinite(input.valueAsNumber)) anatomy()[name] = input.valueAsNumber;
        },
        { signal },
      );
      fields.append(labelled(LABELS[name], input));
    }
  }

  /** A number input showing a supplied value, or the resolved one as its placeholder. */
  function number(name: string, value: number | null, placeholder: number | null): HTMLInputElement {
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
