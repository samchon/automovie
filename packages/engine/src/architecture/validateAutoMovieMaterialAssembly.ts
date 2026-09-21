import { IAutoMovieMaterialAssembly, IAutoMovieMaterialLayer, IAutoMovieMaterialSubstance, IAutoMovieValidation } from "@automovie/interface";
import { ViolationCollector } from "../validation/ViolationCollector";
import { IAutoMovieAssemblyHost } from "./IAutoMovieAssemblyHost";

const AXES = ["x", "y", "z"] as const;

const SENSES = ["positive", "negative"] as const;

const SUBSTANCES = ["solid", "cavity", "membrane"] as const;

const EXPOSURES = ["exposed", "concealed"] as const;

/** Largest metre slack a summed build-up may differ from its host by. */
const THICKNESS_EPSILON = 1e-9;

/**
 * Judge one layered build-up: its layers, its finishes, and its total.
 *
 * The checks fall into three groups the requirement names separately. Layer
 * conflicts are contradictions inside a layer — a cavity that carries a
 * substance, a solid with no thickness, a substance id that resolves to
 * nothing. Finish defects are contradictions between the stack and the faces it
 * presents — an exposed face with nothing finishing it, a finish laid over
 * another finish, a finish buried where it will never be seen, a finish spent
 * on a concealed face. Dimension conflicts are contradictions with the host — a
 * build-up whose layers do not sum to the thickness the host was drawn at.
 *
 * A single-layer stack presents both faces with the same layer, so its finish
 * answers for whichever of them is exposed rather than being demanded twice.
 *
 * @evidence requirements/interior/surface-assemblies.md#interior-assembly-conflicts `validateAutoMovieMaterialAssembly` judges one layered build-up: its layers, its finishes, and its total. This ensures contradictory layer stacks fail before they can produce plausible geometry.
 * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `validateAutoMovieMaterialAssembly` performs auto movie material assembly validation when the engine resolves ordered construction layers into their host face regions.
 */
export const validateAutoMovieMaterialAssembly = (props: {
  assembly: IAutoMovieMaterialAssembly;
  /** Substances the layers may cite; omitted skips reference resolution. */
  substances?: readonly IAutoMovieMaterialSubstance[];
  /** Host dimension the layers must sum to; omitted skips the comparison. */
  host?: IAutoMovieAssemblyHost;
}): IAutoMovieValidation => {
  const { assembly } = props;
  const collector = new ViolationCollector();
  const root = "$input";
  const layers = assembly.layers;

  nonEmpty(assembly.id, `${root}.id`, "material assembly id", collector);
  if (!AXES.includes(assembly.axis))
    collector.push(
      "type",
      `${root}.axis`,
      `material assembly axis must be one of ${AXES.join(", ")}, but was "${String(assembly.axis)}"`,
      assembly.axis,
    );
  if (!SENSES.includes(assembly.sense))
    collector.push(
      "type",
      `${root}.sense`,
      `material assembly sense must be one of ${SENSES.join(", ")}, but was "${String(assembly.sense)}"`,
      assembly.sense,
    );
  if (!Number.isFinite(assembly.offset))
    collector.push(
      "range",
      `${root}.offset`,
      `material assembly offset must be finite, but was ${assembly.offset}`,
      assembly.offset,
    );
  for (const face of ["first", "last"] as const)
    if (!EXPOSURES.includes(assembly.faces[face]))
      collector.push(
        "type",
        `${root}.faces.${face}`,
        `material assembly face exposure must be one of ${EXPOSURES.join(", ")}, but was "${String(assembly.faces[face])}"`,
        assembly.faces[face],
      );
  if (layers.length === 0)
    collector.push(
      "range",
      `${root}.layers`,
      "a material assembly needs at least one layer",
      layers.length,
    );

  const substanceIds =
    props.substances === undefined
      ? null
      : new Set(props.substances.map((substance) => substance.id));
  const ids = new Set<string>();
  layers.forEach((layer, index) => {
    const path = `${root}.layers[${index}]`;
    nonEmpty(layer.id, `${path}.id`, "material layer id", collector);
    if (ids.has(layer.id))
      collector.push(
        "type",
        `${path}.id`,
        `material layer id "${layer.id}" must be unique within assembly "${assembly.id}"`,
        layer.id,
      );
    ids.add(layer.id);
    nonEmpty(layer.role, `${path}.role`, "material layer role", collector);
    if (!SUBSTANCES.includes(layer.substance))
      collector.push(
        "type",
        `${path}.substance`,
        `material layer substance must be one of ${SUBSTANCES.join(", ")}, but was "${String(layer.substance)}"`,
        layer.substance,
      );
    if (!Number.isFinite(layer.thickness) || layer.thickness < 0)
      collector.push(
        "range",
        `${path}.thickness`,
        `material layer thickness must be a finite number >= 0, but was ${layer.thickness}`,
        layer.thickness,
      );
    else if (layer.substance !== "membrane" && layer.thickness === 0)
      collector.push(
        "range",
        `${path}.thickness`,
        `a ${layer.substance} layer must be thicker than zero; only a membrane may measure nothing`,
        layer.thickness,
      );
    if (layer.substance === "cavity") {
      if (layer.material !== null)
        collector.push(
          "type",
          `${path}.material`,
          "a cavity layer is an air gap and carries no substance",
          layer.material,
        );
      if (layer.finish)
        collector.push(
          "type",
          `${path}.finish`,
          "a cavity layer has no surface and cannot be a finish",
          layer.finish,
        );
    } else if (layer.material === null)
      collector.push(
        "type",
        `${path}.material`,
        `a ${layer.substance} layer must cite a substance`,
        layer.material,
      );
    else if (substanceIds !== null && !substanceIds.has(layer.material))
      collector.push(
        "type",
        `${path}.material`,
        `material layer substance "${layer.material}" does not resolve`,
        layer.material,
      );
  });

  appendFinishDefects(assembly, collector, root);
  appendWrapDefects(layers, collector, root);

  if (props.host !== undefined) {
    const total = layers.reduce((sum, layer) => sum + layer.thickness, 0);
    if (
      Number.isFinite(props.host.thickness) === false ||
      props.host.thickness <= 0
    )
      collector.push(
        "range",
        `${root}.layers`,
        `host thickness must be a finite number > 0, but was ${props.host.thickness}`,
        props.host.thickness,
      );
    else if (Math.abs(total - props.host.thickness) > THICKNESS_EPSILON)
      collector.push(
        "range",
        `${root}.layers`,
        `layer thicknesses must sum to the host thickness ${props.host.thickness} m, but summed to ${total} m`,
        total,
        total - props.host.thickness,
      );
  }

  return collector.toValidation();
};

/**
 * Report every finish contradiction between a stack and the faces it presents.
 *
 * A finish is only a finish where it can be seen. Index zero presents the first
 * face and the final index the last one, so a finish anywhere else is either a
 * second coat over the finish beside it or a layer buried where nothing reaches
 * it; both are defects, and naming them apart is what tells the author whether
 * to delete a layer or move it.
 */
const appendFinishDefects = (
  assembly: IAutoMovieMaterialAssembly,
  collector: ViolationCollector,
  root: string,
): void => {
  const layers = assembly.layers;
  if (layers.length === 0) return;
  const last = layers.length - 1;
  layers.forEach((layer, index) => {
    if (!layer.finish || index === 0 || index === last) return;
    const doubled = layers[index - 1]!.finish || layers[index + 1]!.finish;
    collector.push(
      "type",
      `${root}.layers[${index}].finish`,
      doubled
        ? `material layer "${layer.id}" lays a finish over the finish beside it`
        : `material layer "${layer.id}" is a finish buried between layers and reaches no exposed face`,
      layer.finish,
    );
  });
  const terminals = new Map<number, Array<"first" | "last">>();
  terminals.set(0, ["first"]);
  terminals.set(last, [...(terminals.get(last) ?? []), "last"]);
  for (const [index, faces] of terminals) {
    const layer = layers[index]!;
    const exposed = faces.filter((face) => assembly.faces[face] === "exposed");
    if (exposed.length > 0 && !layer.finish)
      collector.push(
        "type",
        `${root}.layers[${index}].finish`,
        `no finish presents the exposed ${exposed.join(" and ")} face; material layer "${layer.id}" is the layer that reaches it`,
        layer.finish,
      );
    if (exposed.length === 0 && layer.finish)
      collector.push(
        "type",
        `${root}.layers[${index}].finish`,
        `material layer "${layer.id}" spends a finish on the concealed ${faces.join(" and ")} face`,
        layer.finish,
      );
  }
};

/**
 * Refuse a wrapping layer that sits behind a layer stopping at the jamb.
 *
 * Lining an opening is a run that starts at a face: a layer cannot turn the
 * corner into the reveal if the layer in front of it already ended there. A
 * buried wrap would otherwise be counted into the finished opening size and
 * quietly narrow a door nothing actually lines.
 */
const appendWrapDefects = (
  layers: readonly IAutoMovieMaterialLayer[],
  collector: ViolationCollector,
  root: string,
): void => {
  const lead = leadingRun(layers, (layer) => layer.wrapsOpening);
  const tail = Math.min(
    trailingRun(layers, (layer) => layer.wrapsOpening),
    layers.length - lead,
  );
  layers.forEach((layer, index) => {
    if (!layer.wrapsOpening) return;
    if (index < lead || index >= layers.length - tail) return;
    collector.push(
      "type",
      `${root}.layers[${index}].wrapsOpening`,
      `material layer "${layer.id}" wraps an opening from behind a layer that stops at the jamb`,
      layer.wrapsOpening,
    );
  });
};

const leadingRun = <T>(
  items: readonly T[],
  match: (item: T) => boolean,
): number => {
  let count = 0;
  while (count < items.length && match(items[count]!)) count += 1;
  return count;
};

const trailingRun = <T>(
  items: readonly T[],
  match: (item: T) => boolean,
): number => {
  let count = 0;
  while (count < items.length && match(items[items.length - 1 - count]!))
    count += 1;
  return count;
};

const nonEmpty = (
  value: string,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  if (value.trim().length === 0)
    collector.push("type", path, `${label} must be non-empty`, value);
};
