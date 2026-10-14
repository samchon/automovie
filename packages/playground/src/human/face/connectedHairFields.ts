import type { IAutoMovieHumanFaceHair } from "@automovie/human";

type Layer = IAutoMovieHumanFaceHair.Layer;
type Field = {
  /** Stable field suffix for one input row. */
  id: string;

  /** Display name including units where applicable. */
  label: string;

  /** Display units per stored unit, including metres-to-millimetres and radians-to-degrees factors. */
  scale: number;

  /** Read stored units from the supplied current layer. */
  read: (layer: Layer) => number;

  /** Write one stored coordinate; coupled range admission remains with Human. */
  write: (layer: Layer, value: number) => void;
};

/**
 * Describe the numerical hair editor's fine coordinates. The panel owns DOM and document transactions; these descriptors only read or write one supplied layer. Metres display as millimetres and radians as degrees. Relative flow, colour and ratios retain their declared units. Optional guide, part and region coordinates appear only when their complete structures exist. The document admission boundary owns ranges and coupled constraints, without UI clamping.
 *
 * @evidence contracts/common.md#principled-implementation Field descriptors apply one display factor around current-layer scalar access and expose optional nested coordinates only when their structures exist; Human retains coupled range admission.
 * @evidence contracts/common.md#clear-and-simple-design The descriptors own coordinate access and unit labels while the hair mount owns DOM, captured layer identity and document transactions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No UI clamping substitutes for numerical admission, missing optional structures receive no fabricated values, and zero-displayed absent greying remains omitted until edited.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies millimetre/degree conversion, unchanged relative units, optional groups and coupled validation ownership; descriptor members explain stored-unit read/write access.
 * @evidence contracts/performance.md#efficient-algorithms Construction visits a fixed list of supported scalar/vector coordinates and creates f descriptors in O(f) time and storage, independent of generated strip count or hair mesh vertices.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Descriptors are rebuilt for the selected layer's optional structure presence; no numerical groom result or mutable descriptor set is cached across layers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned closures reference coordinate keys and axes rather than acquiring groom resources; the mounting control owner retains them until row replacement.
 */
export function connectedHairFields(layer: Layer): Field[] {
  const fields: Field[] = [];
  const add: (
    id: string,
    label: string,
    read: Field["read"],
    write: Field["write"],
    scale?: number,
  ) => void = (
    id: string,
    label: string,
    read: Field["read"],
    write: Field["write"],
    scale: number = 1,
  ): void => {
    fields.push({ id, label, read, write, scale });
  };
  for (const key of [
    "count",
    "seed",
    "lengthVariation",
    "samplingStep",
    "clearance",
  ] as const) {
    const metric: boolean = key === "samplingStep" || key === "clearance";
    const labels: Record<
      "count" | "seed" | "lengthVariation" | "samplingStep" | "clearance",
      string
    > = {
      count: "Strip count",
      seed: "Distribution seed",
      lengthVariation: "Length variation",
      samplingStep: "Sampling step",
      clearance: "Surface clearance",
    };
    add(
      key,
      labels[key] + (metric ? " (mm)" : ""),
      (x: Layer): number => x[key],
      (x: Layer, value: number): void => {
        x[key] = value;
      },
      metric ? 1000 : 1,
    );
  }
  for (const key of ["front", "left", "right", "back"] as const)
    add(
      `hairline-${key}`,
      `Hairline ${key} (degrees from crown)`,
      (x: Layer): number => x.hairline[key],
      (x: Layer, value: number): void => {
        x.hairline[key] = value;
      },
      180 / Math.PI,
    );
  for (let axis: number = 0; axis < 6; axis++)
    add(
      `length-${axis}`,
      `Length ${["left", "right", "crown", "lower", "front", "back"][axis]} (mm)`,
      (x: Layer): number => x.lengthAxes[axis],
      (x: Layer, value: number): void => {
        x.lengthAxes[axis] = value;
      },
      1000,
    );
  for (let axis: number = 0; axis < 3; axis++) {
    add(
      `flow-${axis}`,
      `Comb bias ${["X left", "Y up", "Z forward"][axis]}`,
      (x: Layer): number => x.flow[axis],
      (x: Layer, value: number): void => {
        x.flow[axis] = value;
      },
    );
    add(
      `colour-${axis}`,
      `Linear colour ${["R", "G", "B"][axis]}`,
      (x: Layer): number => x.finish.color[axis],
      (x: Layer, value: number): void => {
        x.finish.color[axis] = value;
      },
    );
  }
  add(
    "lift-strength",
    "Root lift bias",
    (x: Layer): number => x.lift.strength,
    (x: Layer, value: number): void => {
      x.lift.strength = value;
    },
  );
  add(
    "lift-reach",
    "Lift decay length (mm)",
    (x: Layer): number => x.lift.reach,
    (x: Layer, value: number): void => {
      x.lift.reach = value;
    },
    1000,
  );
  for (const key of ["angle", "wavelength", "reach"] as const)
    add(
      `curl-${key}`,
      {
        angle: "Curl angle (degrees)",
        wavelength: "Curl wavelength (mm)",
        reach: "Curl onset length (mm)",
      }[key],
      (x: Layer): number => x.curl[key],
      (x: Layer, value: number): void => {
        x.curl[key] = value;
      },
      key === "angle" ? 180 / Math.PI : 1000,
    );
  for (const key of ["tipWidth", "start"] as const)
    add(
      `taper-${key}`,
      key === "tipWidth" ? "Tip width ratio" : "Taper start fraction",
      (x: Layer): number => x.taper[key],
      (x: Layer, value: number): void => {
        x.taper[key] = value;
      },
    );
  for (const key of [
    "roughness",
    "fibres",
    "coverage",
    "normal",
    "shade",
  ] as const)
    add(
      `finish-${key}`,
      {
        roughness: "Roughness",
        fibres: "Painted fibres per strip",
        coverage: "Painted coverage",
        normal: "Fibre normal strength",
        shade: "Fibre shade strength",
      }[key],
      (x: Layer): number => x.finish[key],
      (x: Layer, value: number): void => {
        x.finish[key] = value;
      },
    );
  // Greying is optional in the document and zero means the same as absent, so
  // the control is always here and an untouched layer keeps its own absence.
  add(
    "finish-grey",
    "Unpigmented fibre proportion",
    (x: Layer): number => x.finish.grey ?? 0,
    (x: Layer, value: number): void => {
      x.finish.grey = value;
    },
  );
  if (layer.guides !== undefined) {
    add(
      "guides-fraction",
      "Guide fraction",
      (x: Layer): number => x.guides!.fraction,
      (x: Layer, value: number): void => {
        x.guides!.fraction = value;
      },
    );
    add(
      "guides-neighbours",
      "Guides per strand",
      (x: Layer): number => x.guides!.neighbours,
      (x: Layer, value: number): void => {
        x.guides!.neighbours = value;
      },
    );
    add(
      "guides-clump",
      "Clump toward guides",
      (x: Layer): number => x.guides!.clump ?? 0,
      (x: Layer, value: number): void => {
        x.guides!.clump = value;
      },
    );
  }
  if (layer.part !== undefined) {
    for (let axis: number = 0; axis < 3; axis++)
      for (const key of ["normal", "bias"] as const)
        add(
          `part-${key}-${axis}`,
          `Part ${key} ${["X", "Y", "Z"][axis]}`,
          (x: Layer): number => x.part![key][axis],
          (x: Layer, value: number): void => {
            x.part![key][axis] = value;
          },
        );
    for (const key of [
      "offset",
      "transitionWidth",
      "strength",
      "reach",
    ] as const) {
      const labels: Record<
        "offset" | "transitionWidth" | "strength" | "reach",
        string
      > = {
        offset: "Part plane offset",
        transitionWidth: "Part transition width",
        strength: "Part bias strength",
        reach: "Part decay length",
      };
      add(
        `part-${key}`,
        labels[key] + (key === "strength" ? "" : " (mm)"),
        (x: Layer): number => x.part![key],
        (x: Layer, value: number): void => {
          x.part![key] = value;
        },
        key === "strength" ? 1 : 1000,
      );
    }
  }
  for (const source of [
    {
      id: "root-region",
      label: "Root region",
      read: (x: Layer): Layer["rootRegion"] => x.rootRegion,
    },
    {
      id: "part-region",
      label: "Part region",
      read: (x: Layer): Layer["rootRegion"] => x.part?.region,
    },
  ])
    if (source.read(layer) !== undefined)
      for (let axis: number = 0; axis < 3; axis++)
        for (const key of ["center", "spread"] as const)
          add(
            `${source.id}-${key}-${axis}`,
            `${source.label} ${key} ${["X", "Y", "Z"][axis]} (mm)`,
            (x: Layer): number => source.read(x)![key][axis],
            (x: Layer, value: number): void => {
              source.read(x)![key][axis] = value;
            },
            1000,
          );
  return fields;
}
