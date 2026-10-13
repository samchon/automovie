import type {
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanFaceOpticalDimensions,
} from "@automovie/human";
import type { IAutoMovieHumanFaceLowerLashPopulation } from "@automovie/human/face/anatomy/lash/IAutoMovieHumanFaceLowerLashPopulation";
import type { IAutoMovieHumanFaceUpperLashPopulation } from "@automovie/human/face/anatomy/lash/IAutoMovieHumanFaceUpperLashPopulation";
import { humanFaceLowerLashParameters } from "@automovie/human/face/anatomy/lash/humanFaceLowerLashParameters";
import { portraitEyelashParameters } from "@automovie/human/face/anatomy/lash/portraitEyelashParameters";

import type { IConnectedPersonEyeControlsProps } from "./IConnectedPersonEyeControlsProps";
import { mountConnectedPersonPeriocularControls } from "./mountConnectedPersonPeriocularControls";

/**
 * Render the eye-region controls of the person editor: independent upper and
 * lower lash populations and independent optical dimensions, each for both eyes.
 *
 * Each group writes one optional face document field (`lashes.upper`,
 * `lashes.lower`, `eyes`); the lower group reads its fields and units from the
 * lower row's own convention table, and commits the person through the panel's
 * transaction under a fresh intent ticket, so admission, last-valid state,
 * undo and save/reload are the editor's. Every value is entered explicitly;
 * nothing is pre-filled with an assumed population value. "Remove" deletes the
 * field, which restores the basis's cards or globes byte for byte. Explicit
 * shaft counts include zero and stay separate from card darkness. A present
 * field reaches its producer on a registered basis; missing optical support
 * or anterior lash roots and invalid geometric combinations refuse by name
 * while preserving the displayed person. A completed transaction can display
 * a construction draft; the panel alone identifies an accepted history commit.
 *
 * @evidence contracts/common.md#principled-implementation Upper/lower lash and optical records use their distinct owner fields/units and compose with the latest complete person under shared intent, with geometry/admission retained by the panel transaction.
 * @evidence contracts/common.md#clear-and-simple-design This form owns explicit two-eye text inputs and optional-field removal, delegates periocular controls and leaves numerical support, source defaults and accepted/draft history classification downstream.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Blank required profile values receive refusal rather than inferred population settings, zero shafts stay distinct from card appearance and true publication does not alone certify accepted history.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies independent upper/lower/optical quantities, exact omission, owner-specific units/support and complete-person transaction boundaries.
 * @evidence contracts/performance.md#efficient-algorithms Fixed two-side field passes build/refresh one input per owner scalar, and each group submission reads its fields plus clones the complete current person; delegated periocular metadata/default work and numerical construction retain their actual costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Static field tables and one input Map are reused during the mount, but authored values are read at event/refresh time and no geometry or transaction result is cached here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The finite input Map and buttons live with the parent panel subtree; pending transactions retain their closures until panel/transport settlement or close, and externally retained mounted handles/elements remain caller-owned after DOM removal.
 *
 * @author Samchon
 */
export function mountConnectedPersonEyeControls(
  props: IConnectedPersonEyeControlsProps,
): { /** Reflect current authored eye values and refresh delegated periocular controls. */ refresh: () => void } {
  const sides: readonly ["left", "right"] = ["left", "right"];
  const opticalFields: (keyof IAutoMovieHumanFaceOpticalDimensions)[] = [
    "globeRadiusMm",
    "limbusRadiusMm",
    "apexCurvatureRadiusMm",
    "centralThicknessMicrometres",
    "irisOuterRadiusMm",
    "irisApertureRadiusMm",
    "irisDepthFromAnteriorSupportMm",
  ];
  const upperFields: readonly string[] = [
    "strandCount",
    ...portraitEyelashParameters.map((parameter: (typeof portraitEyelashParameters)[number]): string => parameter.id),
  ];
  const lowerFields: readonly string[] = [
    "strandCount",
    ...humanFaceLowerLashParameters.map((parameter: (typeof humanFaceLowerLashParameters)[number]): string => parameter.id),
  ];
  const inputs: Map<string, HTMLInputElement> = new Map();
  const group: (title: string, prefix: string, fields: readonly string[], unit: (field: string) => string) => { apply: HTMLButtonElement; remove: HTMLButtonElement } = (
    title: string,
    prefix: string,
    fields: readonly string[],
    unit: (field: string) => string,
  ): { apply: HTMLButtonElement; remove: HTMLButtonElement } => {
    const box: HTMLDivElement = props.dom.createElement("div");
    const heading: HTMLHeadingElement = props.dom.createElement("h3");
    heading.textContent = title;
    box.append(heading);
    for (const side of sides)
      for (const field of fields) {
        const row: HTMLDivElement = props.dom.createElement("div");
        const caption: HTMLLabelElement = props.dom.createElement("label");
        const number: HTMLInputElement = props.dom.createElement("input");
        row.className = "row";
        number.id = `eye-control-${prefix}-${side}-${field}`;
        number.type = "number";
        number.step = field === "strandCount" ? "1" : "any";
        if (field === "strandCount") {
          number.min = "0";
          number.max = "1024";
        }
        caption.htmlFor = number.id;
        caption.textContent = `${side} ${field} (${unit(field)})`;
        row.append(caption, number);
        box.append(row);
        inputs.set(number.id, number);
      }
    const apply: HTMLButtonElement = props.dom.createElement("button");
    const remove: HTMLButtonElement = props.dom.createElement("button");
    apply.type = "button";
    remove.type = "button";
    apply.textContent = "Apply " + title.toLowerCase();
    remove.textContent = "Remove " + title.toLowerCase();
    box.append(apply, remove);
    props.container.append(box);
    return { apply, remove };
  };
  const read: (prefix: string, fields: readonly string[]) => Record<"left" | "right", Record<string, number>> | string = (
    prefix: string,
    fields: readonly string[],
  ): Record<"left" | "right", Record<string, number>> | string => {
    const result: Record<"left" | "right", Record<string, number>> = {
      left: {} as Record<string, number>,
      right: {} as Record<string, number>,
    };
    for (const side of sides)
      for (const field of fields) {
        const text: string = inputs
          .get(`eye-control-${prefix}-${side}-${field}`)!
          .value.trim();
        if (text === "" || !Number.isFinite(Number(text)))
          return `A finite ${side} ${field} is required.`;
        result[side][field] = Number(text);
      }
    return result;
  };
  const commit: (next: (face: IAutoMovieHumanFaceBasisDocument) => IAutoMovieHumanFaceBasisDocument, text: string) => Promise<void> = async (
    next: (
      face: IAutoMovieHumanFaceBasisDocument,
    ) => IAutoMovieHumanFaceBasisDocument,
    text: string,
  ): Promise<void> => {
    const ticket: number = props.reserve();
    props.busy(text);
    try {
      const document: ReturnType<IConnectedPersonEyeControlsProps["current"]> = structuredClone(props.current());
      const success: boolean = await props.change(
        { ...document, face: next(document.face) },
        ticket,
      );
      if (success && props.isCurrent(ticket))
        props.report(text.replace(/…$/u, "") + " applied.");
    } catch (error) {
      if (props.isCurrent(ticket)) props.refuse(error);
    }
  };
  const upperLash: (values: Record<string, number>) => IAutoMovieHumanFaceUpperLashPopulation = (
    values: Record<string, number>,
  ): IAutoMovieHumanFaceUpperLashPopulation => ({
    strandCount: values.strandCount,
    length: values.length,
    elevation: values.elevation,
    curl: values.curl,
    fan: values.fan,
    radius: values.radius,
    taper: values.taper,
    variation: values.variation,
  });
  const lowerLash: (values: Record<string, number>) => IAutoMovieHumanFaceLowerLashPopulation = (
    values: Record<string, number>,
  ): IAutoMovieHumanFaceLowerLashPopulation => ({
    strandCount: values.strandCount,
    length: values.length,
    elevation: values.elevation,
    curl: values.curl,
    fan: values.fan,
    radius: values.radius,
    taper: values.taper,
    variation: values.variation,
  });
  const optical: (values: Record<string, number>) => IAutoMovieHumanFaceOpticalDimensions = (
    values: Record<string, number>,
  ): IAutoMovieHumanFaceOpticalDimensions => ({
    globeRadiusMm: values.globeRadiusMm,
    limbusRadiusMm: values.limbusRadiusMm,
    apexCurvatureRadiusMm: values.apexCurvatureRadiusMm,
    centralThicknessMicrometres: values.centralThicknessMicrometres,
    irisOuterRadiusMm: values.irisOuterRadiusMm,
    irisApertureRadiusMm: values.irisApertureRadiusMm,
    irisDepthFromAnteriorSupportMm: values.irisDepthFromAnteriorSupportMm,
  });
  const upper: ReturnType<typeof group> = group(
    "Upper lash profile",
    "lash-upper",
    upperFields,
    (field: string): string =>
      field === "strandCount"
        ? "shafts (authored count)"
        : portraitEyelashParameters.find((parameter: (typeof portraitEyelashParameters)[number]): boolean => parameter.id === field)!
            .unit,
  );
  upper.apply.onclick = (): void => {
    const values: ReturnType<typeof read> = read("lash-upper", upperFields);
    if (typeof values === "string") return props.refuse(values);
    void commit(
      (face: IAutoMovieHumanFaceBasisDocument): IAutoMovieHumanFaceBasisDocument => ({
        ...face,
        lashes: {
          ...face.lashes,
          upper: {
            left: upperLash(values.left),
            right: upperLash(values.right),
          },
        },
      }),
      "Applying the upper lash profile…",
    );
  };
  const lower: ReturnType<typeof group> = group(
    "Lower lash profile",
    "lash-lower",
    lowerFields,
    (field: string): string =>
      field === "strandCount"
        ? "shafts (authored count)"
        : humanFaceLowerLashParameters.find(
            (parameter: (typeof humanFaceLowerLashParameters)[number]): boolean => parameter.id === field,
          )!.unit,
  );
  lower.apply.onclick = (): void => {
    const values: ReturnType<typeof read> = read("lash-lower", lowerFields);
    if (typeof values === "string") return props.refuse(values);
    void commit(
      (face: IAutoMovieHumanFaceBasisDocument): IAutoMovieHumanFaceBasisDocument => ({
        ...face,
        lashes: {
          ...face.lashes,
          lower: {
            left: lowerLash(values.left),
            right: lowerLash(values.right),
          },
        },
      }),
      "Applying the lower lash profile…",
    );
  };
  for (const [row, remove] of [
    ["upper", upper.remove],
    ["lower", lower.remove],
  ] as const) {
    remove.onclick = (): void => {
      void commit((face: IAutoMovieHumanFaceBasisDocument): IAutoMovieHumanFaceBasisDocument => {
        const { lashes, ...rest }: IAutoMovieHumanFaceBasisDocument = face;
        const kept: Pick<NonNullable<IAutoMovieHumanFaceBasisDocument["lashes"]>, "upper" | "lower"> = {
          upper: row === "upper" ? undefined : lashes?.upper,
          lower: row === "lower" ? undefined : lashes?.lower,
        };
        if (kept.upper === undefined && kept.lower === undefined) return rest;
        return {
          ...rest,
          lashes:
            kept.upper === undefined
              ? { lower: kept.lower }
              : kept.lower === undefined
                ? { upper: kept.upper }
                : { upper: kept.upper, lower: kept.lower },
        };
      }, `Removing the ${row} lash profile…`);
    };
  }
  const optics: ReturnType<typeof group> = group("Eye optics", "optics", opticalFields, (field: string): string =>
    field.endsWith("Micrometres") ? "µm" : "mm",
  );
  optics.apply.onclick = (): void => {
    const values: ReturnType<typeof read> = read("optics", opticalFields);
    if (typeof values === "string") return props.refuse(values);
    void commit(
      (face: IAutoMovieHumanFaceBasisDocument): IAutoMovieHumanFaceBasisDocument => ({
        ...face,
        eyes: { left: optical(values.left), right: optical(values.right) },
      }),
      "Applying the eye optics…",
    );
  };
  optics.remove.onclick = (): void => {
    void commit((face: IAutoMovieHumanFaceBasisDocument): IAutoMovieHumanFaceBasisDocument => {
      const { eyes: _removed, ...rest }: IAutoMovieHumanFaceBasisDocument = face;
      return rest;
    }, "Removing the eye optics…");
  };
  const periocular: ReturnType<typeof mountConnectedPersonPeriocularControls> = mountConnectedPersonPeriocularControls(props);
  return {
    /** Show the displayed document's values in the inputs. */
    refresh: (): void => {
      const face: IAutoMovieHumanFaceBasisDocument = props.current().face;
      const fill: (prefix: string, fields: readonly string[], record: Record<"left" | "right", unknown> | undefined) => void = (
        prefix: string,
        fields: readonly string[],
        record: Record<"left" | "right", unknown> | undefined,
      ): void => {
        for (const side of sides)
          for (const field of fields) {
            const value: number | undefined = (
              record?.[side] as Record<string, number> | undefined
            )?.[field];
            inputs.get(`eye-control-${prefix}-${side}-${field}`)!.value =
              value === undefined ? "" : String(value);
          }
      };
      fill("lash-upper", upperFields, face.lashes?.upper);
      fill("lash-lower", lowerFields, face.lashes?.lower);
      fill("optics", opticalFields, face.eyes);
      periocular.refresh();
    },
  };
}
