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
 * @author Samchon
 */
export function mountConnectedPersonEyeControls(
  props: IConnectedPersonEyeControlsProps,
) {
  const sides = ["left", "right"] as const;
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
    ...portraitEyelashParameters.map((parameter) => parameter.id),
  ];
  const lowerFields: readonly string[] = [
    "strandCount",
    ...humanFaceLowerLashParameters.map((parameter) => parameter.id),
  ];
  const inputs = new Map<string, HTMLInputElement>();
  const group = (
    title: string,
    prefix: string,
    fields: readonly string[],
    unit: (field: string) => string,
  ) => {
    const box = props.dom.createElement("div");
    const heading = props.dom.createElement("h3");
    heading.textContent = title;
    box.append(heading);
    for (const side of sides)
      for (const field of fields) {
        const row = props.dom.createElement("div");
        const caption = props.dom.createElement("label");
        const number = props.dom.createElement("input");
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
    const apply = props.dom.createElement("button");
    const remove = props.dom.createElement("button");
    apply.type = "button";
    remove.type = "button";
    apply.textContent = "Apply " + title.toLowerCase();
    remove.textContent = "Remove " + title.toLowerCase();
    box.append(apply, remove);
    props.container.append(box);
    return { apply, remove };
  };
  const read = (
    prefix: string,
    fields: readonly string[],
  ): Record<"left" | "right", Record<string, number>> | string => {
    const result = {
      left: {} as Record<string, number>,
      right: {} as Record<string, number>,
    };
    for (const side of sides)
      for (const field of fields) {
        const text = inputs
          .get(`eye-control-${prefix}-${side}-${field}`)!
          .value.trim();
        if (text === "" || !Number.isFinite(Number(text)))
          return `A finite ${side} ${field} is required.`;
        result[side][field] = Number(text);
      }
    return result;
  };
  const commit = async (
    next: (
      face: IAutoMovieHumanFaceBasisDocument,
    ) => IAutoMovieHumanFaceBasisDocument,
    text: string,
  ): Promise<void> => {
    const ticket = props.reserve();
    props.busy(text);
    try {
      const document = structuredClone(props.current());
      const success = await props.change(
        { ...document, face: next(document.face) },
        ticket,
      );
      if (success && props.isCurrent(ticket))
        props.report(text.replace(/…$/u, "") + " applied.");
    } catch (error) {
      if (props.isCurrent(ticket)) props.refuse(error);
    }
  };
  const upperLash = (
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
  const lowerLash = (
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
  const optical = (
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
  const upper = group(
    "Upper lash profile",
    "lash-upper",
    upperFields,
    (field) =>
      field === "strandCount"
        ? "shafts (authored count)"
        : portraitEyelashParameters.find((parameter) => parameter.id === field)!
            .unit,
  );
  upper.apply.onclick = (): void => {
    const values = read("lash-upper", upperFields);
    if (typeof values === "string") return props.refuse(values);
    void commit(
      (face) => ({
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
  const lower = group(
    "Lower lash profile",
    "lash-lower",
    lowerFields,
    (field) =>
      field === "strandCount"
        ? "shafts (authored count)"
        : humanFaceLowerLashParameters.find(
            (parameter) => parameter.id === field,
          )!.unit,
  );
  lower.apply.onclick = (): void => {
    const values = read("lash-lower", lowerFields);
    if (typeof values === "string") return props.refuse(values);
    void commit(
      (face) => ({
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
      void commit((face) => {
        const { lashes, ...rest } = face;
        const kept = {
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
  const optics = group("Eye optics", "optics", opticalFields, (field) =>
    field.endsWith("Micrometres") ? "µm" : "mm",
  );
  optics.apply.onclick = (): void => {
    const values = read("optics", opticalFields);
    if (typeof values === "string") return props.refuse(values);
    void commit(
      (face) => ({
        ...face,
        eyes: { left: optical(values.left), right: optical(values.right) },
      }),
      "Applying the eye optics…",
    );
  };
  optics.remove.onclick = (): void => {
    void commit((face) => {
      const { eyes: _removed, ...rest } = face;
      return rest;
    }, "Removing the eye optics…");
  };
  const periocular = mountConnectedPersonPeriocularControls(props);
  return {
    /** Show the displayed document's values in the inputs. */
    refresh: (): void => {
      const face = props.current().face;
      const fill = (
        prefix: string,
        fields: readonly string[],
        record: Record<"left" | "right", unknown> | undefined,
      ) => {
        for (const side of sides)
          for (const field of fields) {
            const value = (
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
