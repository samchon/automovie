import type { IAutoMovieHumanFaceHair } from "@automovie/human";

type Layer = IAutoMovieHumanFaceHair.Layer;
type Field = {
  id: string;
  label: string;
  scale: number;
  read: (layer: Layer) => number;
  write: (layer: Layer, value: number) => void;
};

/**
 * Describe the numerical hair editor's fine coordinates. The panel owns DOM and
 * document transactions; these descriptors only read or write one supplied
 * layer. Metres display as millimetres and radians as degrees. Relative flow,
 * colour and ratios retain their declared units. Optional guide, part and
 * region coordinates appear only when their complete structures exist. The document
 * admission boundary owns ranges and coupled constraints, without UI clamping.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Exposes every fine numerical styling coordinate independently of subject identity.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Gives displayed physical units reversible conversions to canonical document values.
 */
export function connectedHairFields(layer: Layer): Field[] {
  const fields: Field[] = [];
  const add = (
    id: string,
    label: string,
    read: Field["read"],
    write: Field["write"],
    scale = 1,
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
    const metric = key === "samplingStep" || key === "clearance";
    const labels = {
      count: "Strip count",
      seed: "Distribution seed",
      lengthVariation: "Length variation",
      samplingStep: "Sampling step",
      clearance: "Surface clearance",
    };
    add(
      key,
      labels[key] + (metric ? " (mm)" : ""),
      (x) => x[key],
      (x, value) => {
        x[key] = value;
      },
      metric ? 1000 : 1,
    );
  }
  for (const key of ["front", "left", "right", "back"] as const)
    add(
      `hairline-${key}`,
      `Hairline ${key} (degrees from crown)`,
      (x) => x.hairline[key],
      (x, value) => {
        x.hairline[key] = value;
      },
      180 / Math.PI,
    );
  for (let axis = 0; axis < 6; axis++)
    add(
      `length-${axis}`,
      `Length ${["left", "right", "crown", "lower", "front", "back"][axis]} (mm)`,
      (x) => x.lengthAxes[axis],
      (x, value) => {
        x.lengthAxes[axis] = value;
      },
      1000,
    );
  for (let axis = 0; axis < 3; axis++) {
    add(
      `flow-${axis}`,
      `Comb bias ${["X left", "Y up", "Z forward"][axis]}`,
      (x) => x.flow[axis],
      (x, value) => {
        x.flow[axis] = value;
      },
    );
    add(
      `colour-${axis}`,
      `Linear colour ${["R", "G", "B"][axis]}`,
      (x) => x.finish.color[axis],
      (x, value) => {
        x.finish.color[axis] = value;
      },
    );
  }
  add(
    "lift-strength",
    "Root lift bias",
    (x) => x.lift.strength,
    (x, value) => {
      x.lift.strength = value;
    },
  );
  add(
    "lift-reach",
    "Lift decay length (mm)",
    (x) => x.lift.reach,
    (x, value) => {
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
      (x) => x.curl[key],
      (x, value) => {
        x.curl[key] = value;
      },
      key === "angle" ? 180 / Math.PI : 1000,
    );
  for (const key of ["tipWidth", "start"] as const)
    add(
      `taper-${key}`,
      key === "tipWidth" ? "Tip width ratio" : "Taper start fraction",
      (x) => x.taper[key],
      (x, value) => {
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
      (x) => x.finish[key],
      (x, value) => {
        x.finish[key] = value;
      },
    );
  // Greying is optional in the document and zero means the same as absent, so
  // the control is always here and an untouched layer keeps its own absence.
  add(
    "finish-grey",
    "Unpigmented fibre proportion",
    (x) => x.finish.grey ?? 0,
    (x, value) => {
      x.finish.grey = value;
    },
  );
  if (layer.guides !== undefined) {
    add(
      "guides-fraction",
      "Guide fraction",
      (x) => x.guides!.fraction,
      (x, value) => {
        x.guides!.fraction = value;
      },
    );
    add(
      "guides-neighbours",
      "Guides per strand",
      (x) => x.guides!.neighbours,
      (x, value) => {
        x.guides!.neighbours = value;
      },
    );
    add(
      "guides-clump",
      "Clump toward guides",
      (x) => x.guides!.clump ?? 0,
      (x, value) => {
        x.guides!.clump = value;
      },
    );
  }
  if (layer.part !== undefined) {
    for (let axis = 0; axis < 3; axis++)
      for (const key of ["normal", "bias"] as const)
        add(
          `part-${key}-${axis}`,
          `Part ${key} ${["X", "Y", "Z"][axis]}`,
          (x) => x.part![key][axis],
          (x, value) => {
            x.part![key][axis] = value;
          },
        );
    for (const key of [
      "offset",
      "transitionWidth",
      "strength",
      "reach",
    ] as const) {
      const labels = {
        offset: "Part plane offset",
        transitionWidth: "Part transition width",
        strength: "Part bias strength",
        reach: "Part decay length",
      };
      add(
        `part-${key}`,
        labels[key] + (key === "strength" ? "" : " (mm)"),
        (x) => x.part![key],
        (x, value) => {
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
      read: (x: Layer) => x.rootRegion,
    },
    {
      id: "part-region",
      label: "Part region",
      read: (x: Layer) => x.part?.region,
    },
  ])
    if (source.read(layer) !== undefined)
      for (let axis = 0; axis < 3; axis++)
        for (const key of ["center", "spread"] as const)
          add(
            `${source.id}-${key}-${axis}`,
            `${source.label} ${key} ${["X", "Y", "Z"][axis]} (mm)`,
            (x) => source.read(x)![key][axis],
            (x, value) => {
              source.read(x)![key][axis] = value;
            },
            1000,
          );
  return fields;
}
