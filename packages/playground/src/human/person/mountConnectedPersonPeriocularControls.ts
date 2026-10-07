import { HUMAN_FACE_BROW_POPULATION } from "@automovie/human/face/anatomy/brow/HUMAN_FACE_BROW_POPULATION";
import type { AutoMovieHumanFacePeriocularTissue } from "@automovie/human/face/structures/AutoMovieHumanFacePeriocularTissue";
import type { IAutoMovieHumanFaceLidSections } from "@automovie/human/face/structures/IAutoMovieHumanFaceLidSections";

import type { IConnectedPersonEyeControlsProps } from "./IConnectedPersonEyeControlsProps";
import type { IConnectedPersonPeriocularForm } from "./IConnectedPersonPeriocularForm";
import { prepareConnectedPersonCatalogueInput } from "./prepareConnectedPersonCatalogueInput";

/**
 * Edit the full coarse eye neighbourhood through the existing person transaction.
 * Each side and tissue/section can be authored and removed independently, with
 * explicit numerical values and no assumed clinical defaults. Scalar forms
 * contain neither personal boundaries nor source vertex inputs. The current
 * compiled basis admits source support, output space and shape/motion; failure
 * leaves the displayed person unchanged under the panel's existing intent gate.
 * Refresh reflects undo, save/load and successful whole-person transactions.
 */
export function mountConnectedPersonPeriocularControls(
  props: IConnectedPersonEyeControlsProps,
) {
  const forms: IConnectedPersonPeriocularForm[] = [
    {
      field: "eyelids",
      title: "Lid sections",
      choices: [
        "upperPretarsal",
        "upperCrease",
        "upperHood",
        "upperPreseptal",
        "lowerPretarsal",
        "lowerSubtarsal",
        "lowerPreseptal",
      ],
      scalars: ["elevationMm", "projectionMm"],
    },
    {
      field: "periocularTissues",
      title: "Lid tissue shells",
      choices: [
        "upperTarsalBody",
        "lowerTarsalBody",
        "upperOrbicularis",
        "lowerOrbicularis",
        "upperSeptalSupport",
        "lowerSeptalSupport",
        "upperConjunctiva",
        "lowerConjunctiva",
      ],
      scalars: ["inwardOffsetMm", "thicknessMm"],
    },
    {
      field: "brows",
      title: "Brow shafts",
      choices: [],
      scalars: [
        "strandCount",
        "radius",
        "radiusStep",
        "taper",
        "clearance",
        "arch",
        "outwardBend",
      ],
    },
    {
      field: "ocularSurfaces",
      title: "Medial and wet surfaces",
      choices: [],
      scalars: [
        "cornerLength",
        "caruncleProjection",
        "plicaProjection",
        "lowerMarginWidth",
        "lowerMarginLift",
        "upperMarginWidth",
        "upperMarginLift",
      ],
    },
  ];
  const refreshers: (() => void)[] = [];
  for (const form of forms) {
    const box = props.dom.createElement("div"),
      title = props.dom.createElement("h3");
    title.textContent = form.title;
    box.append(title);
    const side = props.dom.createElement("select"),
      member = props.dom.createElement("select");
    side.setAttribute("aria-label", form.title + " side");
    member.setAttribute("aria-label", form.title + " member");
    for (const name of ["left", "right"]) {
      const option = props.dom.createElement("option");
      option.value = name;
      option.textContent = name;
      side.append(option);
    }
    for (const name of form.choices) {
      const option = props.dom.createElement("option");
      option.value = name;
      option.textContent = name;
      member.append(option);
    }
    box.append(side);
    if (form.choices.length > 0) box.append(member);
    const inputs = new Map<string, HTMLInputElement>();
    for (const field of form.scalars) {
      const row = props.dom.createElement("div"),
        label = props.dom.createElement("label"),
        input = props.dom.createElement("input");
      input.type = "number";
      input.step =
        field === "strandCount" || field === "segments" ? "1" : "any";
      input.id = "periocular-control-" + form.field + "-" + field;
      label.htmlFor = input.id;
      const unit =
        field === "strandCount"
          ? "authored shafts"
          : field === "segments"
            ? "segments"
            : field === "taper"
              ? "fraction"
              : "mm";
      label.textContent = field + " (" + unit + ")";
      row.className = "row";
      row.append(label, input);
      box.append(row);
      inputs.set(field, input);
    }
    const apply = props.dom.createElement("button"),
      remove = props.dom.createElement("button");
    apply.type = "button";
    remove.type = "button";
    apply.textContent = "Apply " + form.title.toLowerCase();
    remove.textContent = "Remove selected " + form.title.toLowerCase();
    box.append(apply, remove);
    props.container.append(box);
    const selectedSide = (): "left" | "right" => {
      if (side.value !== "left" && side.value !== "right")
        throw new Error("A registered anatomical side is required.");
      return side.value;
    };
    if (form.field === "brows") {
      // the face owner's default population, never a value of the editor's own
      const seed = props.dom.createElement("button");
      seed.type = "button";
      seed.textContent = "Start from the owner's default brow population";
      seed.onclick = async () => {
        const ticket = props.reserve();
        props.busy("Building the owner's default brow population");
        try {
          const current = props.current();
          const prepared =
            props.faceBasis === undefined
              ? current
              : prepareConnectedPersonCatalogueInput(props.faceBasis, current, [
                  "face",
                  "brows",
                ]);
          const person = structuredClone(prepared);
          person.face.brows = {
            ...person.face.brows,
            [selectedSide()]: structuredClone(HUMAN_FACE_BROW_POPULATION),
          };
          if ((await props.change(person, ticket)) && props.isCurrent(ticket))
            props.report("Owner default brow population applied.");
        } catch (error) {
          if (props.isCurrent(ticket)) props.refuse(error);
        }
      };
      box.append(seed);
    }
    const refresh = (): void => {
      const face = props.current().face,
        selected = selectedSide();
      const group = face[form.field]?.[selected];
      const profile =
        form.choices.length === 0
          ? group
          : group === undefined
            ? undefined
            : Object.entries(group).find(([key]) => key === member.value)?.[1];
      for (const [field, input] of inputs) {
        const value =
          profile === undefined
            ? undefined
            : Object.entries(profile).find(([key]) => key === field)?.[1];
        input.value = typeof value === "number" ? String(value) : "";
      }
    };
    const commit = async (erase: boolean): Promise<void> => {
      const ticket = props.reserve();
      props.busy("Updating " + form.title.toLowerCase());
      try {
        const selected = selectedSide();
        if (form.choices.length > 0 && !form.choices.includes(member.value))
          throw new Error("A registered section or tissue member is required.");
        const values: Record<string, number> = {};
        if (!erase)
          for (const [field, input] of inputs) {
            if (
              input.value.trim() === "" ||
              !Number.isFinite(Number(input.value))
            )
              throw new Error("A finite " + field + " is required.");
            values[field] = Number(input.value);
          }
        const current = props.current();
        const prepared =
          (form.field === "periocularTissues" || form.field === "brows") &&
          props.faceBasis !== undefined
            ? prepareConnectedPersonCatalogueInput(props.faceBasis, current, [
                "face",
                form.field,
              ])
            : current;
        const person = structuredClone(prepared),
          face = person.face;
        if (form.field === "eyelids") {
          face.eyelids ??= {};
          face.eyelids[selected] ??= {};
          const name = member.value as keyof IAutoMovieHumanFaceLidSections;
          if (erase) delete face.eyelids[selected]![name];
          else
            face.eyelids[selected]![name] = {
              elevationMm: values.elevationMm,
              projectionMm: values.projectionMm,
            };
          if (Object.keys(face.eyelids[selected]!).length === 0)
            delete face.eyelids[selected];
          if (Object.keys(face.eyelids).length === 0) delete face.eyelids;
        } else if (form.field === "periocularTissues") {
          face.periocularTissues ??= {};
          face.periocularTissues[selected] ??= {};
          const name = member.value as AutoMovieHumanFacePeriocularTissue;
          if (erase) delete face.periocularTissues[selected]![name];
          else
            face.periocularTissues[selected]![name] = {
              inwardOffsetMm: values.inwardOffsetMm,
              thicknessMm: values.thicknessMm,
            };
          if (Object.keys(face.periocularTissues[selected]!).length === 0)
            delete face.periocularTissues[selected];
          // An explicit empty section suppresses the owner defaults; removing
          // its final selected member must keep that selection empty.
        } else if (form.field === "brows") {
          face.brows ??= {};
          if (erase) delete face.brows[selected];
          else
            face.brows[selected] = {
              ...face.brows[selected],
              strandCount: values.strandCount,
              radius: values.radius,
              radiusStep: values.radiusStep,
              taper: values.taper,
              clearance: values.clearance,
              arch: values.arch,
              outwardBend: values.outwardBend,
              segments:
                face.brows[selected]?.segments ??
                HUMAN_FACE_BROW_POPULATION.segments,
            };
          // Empty explicit brow selection retains source cards; omission would
          // select the owner's generated populations again.
        } else {
          face.ocularSurfaces ??= {};
          if (erase) delete face.ocularSurfaces[selected];
          else
            face.ocularSurfaces[selected] = {
              cornerLength: values.cornerLength,
              caruncleProjection: values.caruncleProjection,
              plicaProjection: values.plicaProjection,
              lowerMarginWidth: values.lowerMarginWidth,
              lowerMarginLift: values.lowerMarginLift,
              upperMarginWidth: values.upperMarginWidth,
              upperMarginLift: values.upperMarginLift,
            };
          if (Object.keys(face.ocularSurfaces).length === 0)
            delete face.ocularSurfaces;
        }
        const success = await props.change(person, ticket);
        if (success && props.isCurrent(ticket))
          props.report(form.title + " applied.");
      } catch (error) {
        if (props.isCurrent(ticket)) props.refuse(error);
      }
    };
    apply.onclick = () => {
      void commit(false);
    };
    remove.onclick = () => {
      void commit(true);
    };
    side.onchange = refresh;
    member.onchange = refresh;
    refreshers.push(refresh);
  }
  return {
    refresh: (): void => {
      refreshers.forEach((refresh) => refresh());
    },
  };
}
