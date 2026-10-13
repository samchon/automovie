import {
  IAutoMovieMaterialAssembly,
  IAutoMovieMaterialLayer,
  IAutoMovieMaterialSubstance,
  IAutoMovieValidation,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";
import { IAutoMovieAssemblyHost } from "./IAutoMovieAssemblyHost";

const AXES: readonly IAutoMovieMaterialAssembly["axis"][] = ["x", "y", "z"];

const SENSES: readonly IAutoMovieMaterialAssembly["sense"][] = [
  "positive",
  "negative",
];

const SUBSTANCES: readonly IAutoMovieMaterialLayer["substance"][] = [
  "solid",
  "cavity",
  "membrane",
];

const EXPOSURES: readonly IAutoMovieMaterialAssembly["faces"]["first"][] = [
  "exposed",
  "concealed",
];

/** Largest metre slack a summed build-up may differ from its host by. */
const THICKNESS_EPSILON: number = 1e-9;

/**
 * Judge one layered build-up: its layers, its finishes, and its total.
 *
 * The checks fall into three groups the requirement names separately. Layer
 * conflicts are contradictions inside a layer: a cavity that carries a
 * substance, a solid with no thickness, a substance id that resolves to
 * nothing. Finish defects are contradictions between the stack and the faces
 * it presents: an exposed face with nothing finishing it, a finish laid over
 * another finish, a finish buried where it will never be seen, a finish spent
 * on a concealed face. Dimension conflicts are contradictions with the host: a
 * build-up whose layers do not sum to the thickness the host was drawn at.
 *
 * A single-layer stack presents both faces with the same layer, so its finish
 * answers for whichever of them is exposed rather than being demanded twice.
 *
 * A wrapping layer must belong to the run of wrapping layers starting at one
 * face; one behind a non-wrapping layer is refused. Ids must be non-blank and
 * unique within the assembly, the axis, sense, exposures and substances must
 * be known words, the offset finite, and at least one layer present. Every
 * finding is reported at once with a `$input` path, and none throws. With
 * `host`, the summed thickness must equal the host's within 1e-9 m; with
 * `substances`, every non-cavity layer's material must name one of them by id.
 *
 * @param props.assembly Layered build-up to judge.
 * @param props.substances Substances the layers may cite, or omitted.
 * @param props.host Host dimension the layers must sum to, or omitted.
 * @returns Success, or every violation found.
 *
 * @evidence contracts/common.md#principled-implementation Treats the stack as an ordered sequence whose two ends are the presented faces, so finish rules reduce to position (an end, next to a finish, or buried) and wrap rules to membership in the leading or trailing run of wrapping layers; the host comparison uses a 1e-9 m absolute slack, far below any authored layer and above the rounding of a summed float series.
 * @evidence contracts/common.md#clear-and-simple-design One validator owns the build-up contract and is the gate `resolveAutoMovieMaterialAssembly` runs before placing layers; finish and wrap defects are separate private passes because each names a different author action, and blank strings use the collector's shared rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No role, substance id or layer is special-cased; a membrane may be zero thick because it is a sheet by definition, which is a contract difference, and the single-layer case follows from both faces sharing one layer rather than from an exception.
 * @evidence contracts/common.md#meaningful-documentation The documentation names the three defect groups with examples, the single-layer rule, the wrap rule, every field rule, the host slack and unit, the substance resolution, the path root, and that nothing throws.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the layer count plus the substance count: one pass per rule group, a set for substance and layer ids, and the leading and trailing wrap runs measured once.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A check of one build-up per call; the resolver calls it once before placing, and no work is shared across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The substance and layer id sets are local and released on return, bounded by their counts; the returned validation holds the findings.
 */
export const validateAutoMovieMaterialAssembly = (props: {
  /** Layered build-up to judge. */
  assembly: IAutoMovieMaterialAssembly;

  /** Substances the layers may cite; omitted skips reference resolution. */
  substances?: readonly IAutoMovieMaterialSubstance[];

  /** Host dimension the layers must sum to; omitted skips the comparison. */
  host?: IAutoMovieAssemblyHost;
}): IAutoMovieValidation => {
  const { assembly } = props;
  const collector: ViolationCollector = new ViolationCollector();
  const root: string = "$input";
  const layers: readonly IAutoMovieMaterialLayer[] = assembly.layers;

  collector.nonEmpty(`${root}.id`, assembly.id, "material assembly id");
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

  const substanceIds: Set<string> | null =
    props.substances === undefined
      ? null
      : new Set(
          props.substances.map(
            (substance: IAutoMovieMaterialSubstance): string => substance.id,
          ),
        );
  const ids: Set<string> = new Set();
  layers.forEach((layer: IAutoMovieMaterialLayer, index: number): void => {
    const path: string = `${root}.layers[${index}]`;
    collector.nonEmpty(`${path}.id`, layer.id, "material layer id");
    if (ids.has(layer.id))
      collector.push(
        "type",
        `${path}.id`,
        `material layer id "${layer.id}" must be unique within assembly "${assembly.id}"`,
        layer.id,
      );
    ids.add(layer.id);
    collector.nonEmpty(`${path}.role`, layer.role, "material layer role");
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
    const total: number = layers.reduce(
      (sum: number, layer: IAutoMovieMaterialLayer): number =>
        sum + layer.thickness,
      0,
    );
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
  const layers: readonly IAutoMovieMaterialLayer[] = assembly.layers;
  if (layers.length === 0) return;
  const last: number = layers.length - 1;
  layers.forEach((layer: IAutoMovieMaterialLayer, index: number): void => {
    if (!layer.finish || index === 0 || index === last) return;
    const doubled: boolean =
      layers[index - 1]!.finish || layers[index + 1]!.finish;
    collector.push(
      "type",
      `${root}.layers[${index}].finish`,
      doubled
        ? `material layer "${layer.id}" lays a finish over the finish beside it`
        : `material layer "${layer.id}" is a finish buried between layers and reaches no exposed face`,
      layer.finish,
    );
  });
  // One entry per presenting layer: a single-layer stack presents both faces
  // with layer 0, so its finish answers for both at once.
  const terminals: Map<number, ("first" | "last")[]> = new Map();
  terminals.set(0, ["first"]);
  terminals.set(last, [...(terminals.get(last) ?? []), "last"]);
  for (const [index, faces] of terminals) {
    const layer: IAutoMovieMaterialLayer = layers[index]!;
    const exposed: ("first" | "last")[] = faces.filter(
      (face: "first" | "last"): boolean => assembly.faces[face] === "exposed",
    );
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
  // The wrapping runs that start at the first and at the last face; the tail
  // never reaches into the lead, so an all-wrapping stack is counted once.
  let lead: number = 0;
  while (lead < layers.length && layers[lead]!.wrapsOpening) lead += 1;
  let tail: number = 0;
  while (
    tail < layers.length - lead &&
    layers[layers.length - 1 - tail]!.wrapsOpening
  )
    tail += 1;
  layers.forEach((layer: IAutoMovieMaterialLayer, index: number): void => {
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

