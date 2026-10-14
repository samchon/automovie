import { HUMAN_FACE_BROW_POPULATION } from "@automovie/human/face/anatomy/brow/HUMAN_FACE_BROW_POPULATION";
import type { AutoMovieHumanFacePeriocularTissue } from "@automovie/human/face/structures/AutoMovieHumanFacePeriocularTissue";
import type { IAutoMovieHumanFaceLidSections } from "@automovie/human/face/structures/IAutoMovieHumanFaceLidSections";

import type { IConnectedPersonEyeControlsProps } from "./IConnectedPersonEyeControlsProps";
import type { IConnectedPersonPeriocularForm } from "./IConnectedPersonPeriocularForm";
import { prepareConnectedPersonCatalogueInput } from "./prepareConnectedPersonCatalogueInput";

/**
 * Edit coarse lid sections, tissue shells, brow shafts and ocular surfaces through the existing person transaction. Each side/member has explicit scalar inputs, not personal boundaries or source vertices. Whole omitted brows/tissues are materialized from their face owner before a member edit; a dedicated brow action also uses that owner's published population.
 *
 * Empty explicit tissue/brow populations can suppress owner defaults or retain source cards, so removal does not always collapse the record to omission. Refresh reads the current draft and replaces field text, including active inputs. A publication may be accepted history or a labelled refused construction draft; intent checks authorize reports rather than proving anatomy or clinical validity.
 *
 * @evidence contracts/common.md#principled-implementation Registered sides/members and finite scalars form explicit records, canonical owner defaults preserve implicit neighbors and field-specific pruning preserves the distinct meaning of empty selection versus omission.
 * @evidence contracts/common.md#clear-and-simple-design Four fixed form descriptors share side/member controls and transaction plumbing; actual lid/tissue/brow/surface record construction remains visible in one field-specific branch.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No clinical population is guessed locally and no status Boolean substitutes for generation admission. Explicit owner defaults and tissue/brow empty-record exceptions follow their authored omission semantics.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies default ownership, empty-selection semantics, active-text replacement and admitted-versus-draft publication.
 * @evidence contracts/performance.md#efficient-algorithms Four bounded form families create fixed-size DOM/maps. Refresh scans selected profile entries for each scalar; commit clones the whole person document plus any newly materialized default population before numerical construction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Form nodes and refresh callbacks are reused across display changes; each apply/removal/default action remains a separate authored intent with no cached numerical result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Four refresher closures and fixed field handlers live with the panel DOM. There is no local close or pending-click cap; the panel/transport owns withdrawal, numerical shutdown and frame retirement, while DOM disposal releases local records without external references.
 *
 * @author Samchon
 */
export function mountConnectedPersonPeriocularControls(
  props: IConnectedPersonEyeControlsProps,
): { refresh: () => void } {
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
    const box: HTMLDivElement = props.dom.createElement("div"),
      title: HTMLHeadingElement = props.dom.createElement("h3");
    title.textContent = form.title;
    box.append(title);
    const side: HTMLSelectElement = props.dom.createElement("select"),
      member: HTMLSelectElement = props.dom.createElement("select");
    side.setAttribute("aria-label", form.title + " side");
    member.setAttribute("aria-label", form.title + " member");
    for (const name of ["left", "right"]) {
      const option: HTMLOptionElement = props.dom.createElement("option");
      option.value = name;
      option.textContent = name;
      side.append(option);
    }
    for (const name of form.choices) {
      const option: HTMLOptionElement = props.dom.createElement("option");
      option.value = name;
      option.textContent = name;
      member.append(option);
    }
    box.append(side);
    if (form.choices.length > 0) box.append(member);
    const inputs: Map<string, HTMLInputElement> = new Map();
    for (const field of form.scalars) {
      const row: HTMLDivElement = props.dom.createElement("div"),
        label: HTMLLabelElement = props.dom.createElement("label"),
        input: HTMLInputElement = props.dom.createElement("input");
      input.type = "number";
      input.step =
        field === "strandCount" || field === "segments" ? "1" : "any";
      input.id = "periocular-control-" + form.field + "-" + field;
      label.htmlFor = input.id;
      const unit: string =
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
    const apply: HTMLButtonElement = props.dom.createElement("button"),
      remove: HTMLButtonElement = props.dom.createElement("button");
    apply.type = "button";
    remove.type = "button";
    apply.textContent = "Apply " + form.title.toLowerCase();
    remove.textContent = "Remove selected " + form.title.toLowerCase();
    box.append(apply, remove);
    props.container.append(box);
    const selectedSide: () => "left" | "right" = (): "left" | "right" => {
      if (side.value !== "left" && side.value !== "right")
        throw new Error("A registered anatomical side is required.");
      return side.value;
    };
    if (form.field === "brows") {
      // the face owner's default population, never a value of the editor's own
      const seed: HTMLButtonElement = props.dom.createElement("button");
      seed.type = "button";
      seed.textContent = "Start from the owner's default brow population";
      seed.onclick = async (): Promise<void> => {
        const ticket: number = props.reserve();
        props.busy("Building the owner's default brow population");
        try {
          const current: ReturnType<typeof props.current> = props.current();
          const prepared: ReturnType<typeof props.current> =
            props.faceBasis === undefined
              ? current
              : prepareConnectedPersonCatalogueInput(props.faceBasis, current, [
                  "face",
                  "brows",
                ]);
          const person: ReturnType<typeof props.current> =
            structuredClone(prepared);
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
    const refresh: () => void = (): void => {
      const face: ReturnType<typeof props.current>["face"] =
          props.current().face,
        selected: "left" | "right" = selectedSide();
      const group:
        | NonNullable<
            ReturnType<typeof props.current>["face"][typeof form.field]
          >["left"]
        | undefined = face[form.field]?.[selected];
      const profile: unknown =
        form.choices.length === 0
          ? group
          : group === undefined
            ? undefined
            : Object.entries(group).find(
                ([key]: [string, unknown]): boolean => key === member.value,
              )?.[1];
      for (const [field, input] of inputs) {
        const value: unknown =
          profile === undefined
            ? undefined
            : Object.entries(profile as object).find(
                ([key]: [string, unknown]): boolean => key === field,
              )?.[1];
        input.value = typeof value === "number" ? String(value) : "";
      }
    };
    const commit: (erase: boolean) => Promise<void> = async (
      erase: boolean,
    ): Promise<void> => {
      const ticket: number = props.reserve();
      props.busy("Updating " + form.title.toLowerCase());
      try {
        const selected: "left" | "right" = selectedSide();
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
        const current: ReturnType<typeof props.current> = props.current();
        const prepared: ReturnType<typeof props.current> =
          (form.field === "periocularTissues" || form.field === "brows") &&
          props.faceBasis !== undefined
            ? prepareConnectedPersonCatalogueInput(props.faceBasis, current, [
                "face",
                form.field,
              ])
            : current;
        const person: ReturnType<typeof props.current> =
            structuredClone(prepared),
          face: ReturnType<typeof props.current>["face"] = person.face;
        if (form.field === "eyelids") {
          face.eyelids ??= {};
          face.eyelids[selected] ??= {};
          const name: keyof IAutoMovieHumanFaceLidSections =
            member.value as keyof IAutoMovieHumanFaceLidSections;
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
          const name: AutoMovieHumanFacePeriocularTissue =
            member.value as AutoMovieHumanFacePeriocularTissue;
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
        const success: boolean = await props.change(person, ticket);
        if (success && props.isCurrent(ticket))
          props.report(form.title + " applied.");
      } catch (error) {
        if (props.isCurrent(ticket)) props.refuse(error);
      }
    };
    apply.onclick = (): void => {
      void commit(false);
    };
    remove.onclick = (): void => {
      void commit(true);
    };
    side.onchange = refresh;
    member.onchange = refresh;
    refreshers.push(refresh);
  }
  return {
    refresh: (): void => {
      refreshers.forEach((refresh: () => void): void => refresh());
    },
  };
}
