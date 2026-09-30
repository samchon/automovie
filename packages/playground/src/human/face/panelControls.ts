/**
 * Numerical-control projection for the face panel's committed document.
 * Metadata owns each field's unit, bounds, path and override semantics; this
 * module only displays those facts and routes edits through the panel's guarded
 * transaction callback. It owns no worker, history, model or download state.
 * Rendered values come from the committed face. Event callbacks read the latest
 * draft and side so overlapping inputs retain the original closure semantics.
 * Hair-layer selection resolves by stable ID, falling back to the first layer.
 * Empty numeric input is refused rather than converted into zero. Rebuilding
 * the view replaces its rows in the same order and returns the resolved layer.
 */
import {
  type IAutoMovieHumanFaceDocument,
  type IPortraitHairLayer,
  createPortraitMaterials,
  humanFaceControlDefinitions,
  humanFaceDetailChannels,
  humanFaceExpressionDefinitions,
  humanFaceRegionValue,
  humanFaceRegions,
  resolveHumanFaceDocument,
  resolveHumanFaceExpression,
  setHumanFaceDetail,
  setHumanFaceHairLayerDetail,
} from "@automovie/human";

/**
 * Render metadata-backed controls and return the selected applied hair layer.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Displays applied regional, expression and material fields while routing edits to the panel transaction owner.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Keeps displayed committed values separate from event-time draft edits and display selection.
 */
export const renderHumanFaceControls = (props: {
  app: HTMLElement;
  face: IAutoMovieHumanFaceDocument;
  region: (typeof humanFaceRegions)[number];
  side: () => "right" | "left" | undefined;
  hairLayer: string | undefined;
  draft: () => IAutoMovieHumanFaceDocument;
  attempt: (action: () => IAutoMovieHumanFaceDocument) => Promise<void>;
  refuse: (error: unknown) => void;
}): string | undefined => {
  const {
    app,
    face,
    region: selectedRegion,
    side: readSide,
    draft: readDraft,
    attempt,
    refuse,
  } = props;
  const document = app.ownerDocument;
  const element = <T extends HTMLElement>(id: string): T =>
    app.querySelector<T>("#" + id)!;
  type Side = "right" | "left";
  let selectedHairLayer = props.hairLayer;
  const numberRow = (
    container: HTMLElement,
    props: {
      id: string;
      label: string;
      value: number;
      minimum: number;
      maximum: number;
      step: number;
      hint: string;
      change: (value: number) => Promise<void>;
      inherit?: () => Promise<void>;
    },
  ): void => {
    const row = document.createElement("div");
    row.className = "number-row";
    const label = document.createElement("label");
    label.htmlFor = props.id;
    label.textContent = props.label;
    label.title = props.hint;
    const entry = document.createElement("div");
    entry.className = "entry";
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = String(props.minimum);
    slider.max = String(props.maximum);
    slider.step = String(props.step);
    slider.value = String(props.value);
    slider.id = props.id + "-slider";
    slider.setAttribute("aria-label", props.label + " slider");
    const number = document.createElement("input");
    number.type = "number";
    number.min = slider.min;
    number.max = slider.max;
    number.step = "any";
    number.value = String(Number(props.value.toFixed(6)));
    number.id = props.id;
    slider.oninput = () => {
      number.value = slider.value;
    };
    slider.onchange = () => props.change(Number(slider.value));
    number.onchange = () => {
      if (number.value.trim() === "") {
        refuse("A numeric value is required.");
        return;
      }
      return props.change(Number(number.value));
    };
    entry.append(slider, number);
    if (props.inherit) {
      const reset = document.createElement("button");
      reset.textContent = "↶";
      reset.title = "Remove this override";
      reset.onclick = props.inherit;
      entry.append(reset);
    }
    const hint = document.createElement("small");
    hint.textContent = props.hint;
    row.append(label, entry, hint);
    container.append(row);
  };
  const intermediate = element("intermediate-controls"),
    details = element("detail-controls"),
    expressions = element("expression-controls"),
    appearance = element("appearance-controls");
  intermediate.replaceChildren();
  details.replaceChildren();
  expressions.replaceChildren();
  appearance.replaceChildren();
  const regions: Record<string, string> = {
    frame: "frame",
    eye: "eyes",
    ear: "ears",
    cheek: "cheeks",
    nose: "nose",
    mouth: "mouth",
    cranium: "cranium",
    neck: "neck",
  };
  // Resolve once for this view. Each row reads the published metadata path on
  // that same final profile, rather than reinterpreting the whole basis per row.
  const regionProfile = humanFaceRegionValue(face, selectedRegion, readSide());
  const layerSelect = element<HTMLSelectElement>("face-hair-layer");
  layerSelect.hidden = selectedRegion !== "hairLayers";
  layerSelect.replaceChildren();
  const hairLayers =
    selectedRegion === "hairLayers"
      ? ((regionProfile as readonly IPortraitHairLayer[] | undefined) ?? [])
      : [];
  for (const layer of hairLayers) {
    const option = document.createElement("option");
    option.value = layer.id;
    option.textContent = layer.id;
    layerSelect.append(option);
  }
  const activeLayer =
    hairLayers.find((layer) => layer.id === selectedHairLayer) ?? hairLayers[0];
  selectedHairLayer = activeLayer?.id;
  layerSelect.value = selectedHairLayer ?? "";
  layerSelect.disabled = hairLayers.length === 0;
  const detailProfile =
    selectedRegion === "hairLayers" ? activeLayer?.profile : regionProfile;
  for (const definition of humanFaceControlDefinitions.filter(
    (item) => item.region === regions[selectedRegion],
  ))
    numberRow(intermediate, {
      ...definition,
      id: `trait-${definition.id}`,
      value: face.controls?.[definition.id] ?? 0,
      label: definition.label,
      hint: `${definition.unit}; neutral 0. ${definition.effect}`,
      change: (value) =>
        attempt(() => ({
          ...readDraft(),
          controls: { ...readDraft().controls, [definition.id]: value },
        })),
    });
  for (const definition of humanFaceDetailChannels.filter(
    (item) =>
      item.region ===
      (selectedRegion === "hairLayers" ? "hair" : selectedRegion),
  )) {
    let field: unknown = detailProfile;
    for (const key of definition.path)
      field = (field as Record<string, unknown> | undefined)?.[key];
    if (field === undefined) continue;
    const value = field as number;
    numberRow(details, {
      ...definition,
      id: `detail-${definition.id.replaceAll(".", "-")}`,
      label: activeLayer
        ? `${activeLayer.id}: ${definition.meaning}`
        : definition.meaning,
      value,
      hint: `${definition.unit}. ${definition.effect}`,
      change: (value) =>
        attempt(() =>
          activeLayer
            ? setHumanFaceHairLayerDetail(
                readDraft(),
                activeLayer.id,
                definition.id,
                value,
              )
            : setHumanFaceDetail(readDraft(), definition.id, value, readSide()),
        ),
      inherit: activeLayer
        ? undefined
        : () =>
            attempt(() =>
              setHumanFaceDetail(
                readDraft(),
                definition.id,
                undefined,
                readSide(),
              ),
            ),
    });
  }
  element<HTMLTextAreaElement>("region-json").value = JSON.stringify(
    regionProfile ?? null,
    null,
    2,
  );
  const expression = resolveHumanFaceExpression(face.expression);
  for (const definition of humanFaceExpressionDefinitions) {
    const sides = definition.paired
      ? (["right", "left"] as const)
      : [undefined];
    for (const owner of sides) {
      const value = expression[definition.id];
      numberRow(expressions, {
        ...definition,
        id: `expression-${definition.id}-${owner ?? "common"}`,
        label: `${definition.label}${owner ? ` · ${owner}` : ""}`,
        value: typeof value === "number" ? value : value[owner as Side],
        hint: `${definition.unit}; neutral 0.`,
        change: (value) =>
          attempt(() => {
            const current = resolveHumanFaceExpression(readDraft().expression);
            return {
              ...readDraft(),
              expression: {
                ...current,
                [definition.id]:
                  owner === undefined
                    ? value
                    : {
                        ...(current[definition.id] as Record<Side, number>),
                        [owner]: value,
                      },
              },
            };
          }),
      });
    }
  }
  const hairRecipe = resolveHumanFaceDocument(face).recipe;
  const hairMaterials = new Set([
    hairRecipe.hair?.material,
    ...(hairRecipe.hairLayers ?? []).map((layer) => layer.profile.material),
  ]);
  for (const material of face.appearance ?? createPortraitMaterials()) {
    if (
      !["skin", "lips", "brows", "teeth"].includes(material.id) &&
      !hairMaterials.has(material.id)
    )
      continue;
    for (const component of ["r", "g", "b"] as const)
      numberRow(appearance, {
        id: `material-${material.id}-${component}`,
        label: `${material.id} · ${component.toUpperCase()}`,
        value: material.baseColor[component],
        minimum: 0,
        maximum: 1,
        step: 0.005,
        hint: "Linear RGB reflectance",
        change: (value) =>
          attempt(() => ({
            ...readDraft(),
            appearance: (
              readDraft().appearance ?? createPortraitMaterials()
            ).map((item) =>
              item.id === material.id
                ? {
                    ...item,
                    baseColor: {
                      ...item.baseColor,
                      [component]: value,
                      hex: null,
                    },
                  }
                : item,
            ),
          })),
      });
    for (const [property, label] of [
      ["roughness", "Surface roughness"],
      ["clearcoat", "Clearcoat strength"],
    ] as const)
      numberRow(appearance, {
        id: `material-${material.id}-${property}`,
        label: `${material.id}: ${label}`,
        value: material[property] ?? 0,
        minimum: 0,
        maximum: 1,
        step: 0.01,
        hint: "Unit interval; changes surface response without changing shape.",
        change: (value) =>
          attempt(() => ({
            ...readDraft(),
            appearance: (
              readDraft().appearance ?? createPortraitMaterials()
            ).map((item) =>
              item.id === material.id ? { ...item, [property]: value } : item,
            ),
          })),
      });
  }
  return selectedHairLayer;
};
