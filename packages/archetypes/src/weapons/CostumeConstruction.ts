import { Vector3 } from "@automovie/engine";
import type { IAutoMovieBodyMeasure } from "@automovie/interface";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
} from "../core";
import { ArmourProfile } from "./ArmourProfile";
import { createArmour } from "./createArmour";

/**
 * Fit a digital costume piece from its admitted record.
 *
 * Each type builds its hollow form. The pre-fit record determines its saved
 * dimensions and the wear frame stays at the model origin.
 *
 * @param kind The selected costume form.
 * @param cellsOf Builds the hollow costume shell cells.
 * @param params An optional body measure along with the corresponding costume
 *   record and dimensions.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function CostumeConstruction(
  kind: createArmour.Kind,
  params: Omit<createArmour.IParams, "kind">,
  seed: number | undefined,
  cellsOf: (profile: ArmourProfile.IProfile) => readonly ArmourProfile.ICell[],
): AutoMovieArchetype<createArmour.Affordance, createArmour.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createArmour.Dimension> =
    new AutoMovieArchetypeDrawSession<createArmour.Dimension>(
      "armour",
      createArmour.UNITS,
      seed,
      params,
    );

  const model: AutoMovieArchetypeDrawSession.IModel<
    createArmour.Model,
    createArmour.Dimension
  > = draw.model<createArmour.Model>(
    "model",
    params.model,
    createArmour.MODELS[kind],
  );
  const d: Partial<Record<createArmour.Dimension, number>> = {
    ...draw.dimensions(createArmour.BANDS[kind], createArmour.BANDS),
    ...model.figures,
  };
  const builder: AutoMovieArchetypeBuilder<
    createArmour.Affordance,
    createArmour.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id,
    name: kind,
    material: "steel",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const steel: { color: string; surface: "steel" } = {
    color: "#8f979e",
    surface: "steel",
  };
  const m: Partial<IAutoMovieBodyMeasure> | undefined = params.measure;
  if (m !== undefined) admitMeasure(kind, m);
  const profile: ArmourProfile.IProfile = ArmourProfile.create(
    kind,
    model.name!,
    d,
    m,
  );
  let cells: readonly ArmourProfile.ICell[];
  try {
    cells = cellsOf(profile);
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: "armour",
      axis: "measure",
      value: params.measure,
      feasible: null,
      reason: error.message,
      fix: "supply fitting dimensions compatible with the selected piece's actual positive wall and cavity",
    });
  }
  for (const cell of cells)
    builder.convex(cell.id, cell.prepared ?? cell.points, v(0, 0, 0), {
      ...(kind === "mail"
        ? { color: "#6f757b", surface: "steel" as const }
        : steel),
      ...(cell.rotation === undefined ? {} : { rotation: cell.rotation }),
    });
  builder.affordance({
    id: "wear",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.upright(v(0, 0, 0)),
    extent: null,
  });

  // Plate publishes provisional glance metadata; current flight/melee outcomes do not consume it. Mail declares none.
  return builder.build(d.mass!, {
    rests: "steel",
    ...(kind === "mail" ? {} : { outcome: { glance: createArmour.GLANCE } }),
  });
}

/**
 * Admit only the body's dimensions this kind uses, without inventing
 * anthropometric bands.
 */
function admitMeasure(
  kind: createArmour.Kind,
  measure: Partial<IAutoMovieBodyMeasure>,
): void {
  const required: Readonly<
    Record<createArmour.Kind, readonly (keyof IAutoMovieBodyMeasure)[]>
  > = {
    openHelmet: ["headRadius"],
    closedHelmet: ["headRadius"],
    brimmedHelmet: ["headRadius"],
    cuirass: ["chestBreadth", "chestDepth", "shoulderHeight", "waistHeight"],
    mail: ["chestBreadth", "chestDepth"],
    gauntlet: ["forearmRadius", "hand"],
    vambrace: ["forearmRadius", "forearm"],
    greave: ["shankRadius", "shank"],
  };
  for (const field of required[kind]) {
    const value: number | undefined = measure[field];
    if (!(value !== undefined && Number.isFinite(value) && value > 0))
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: "armour",
        axis: `measure.${field}`,
        value,
        feasible: null,
        reason: `${kind} needs a finite positive ${field} in metres`,
        fix: `supply the body's measured ${field} above zero`,
      });
  }
  if (kind === "cuirass" && !(measure.shoulderHeight! > measure.waistHeight!))
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: "armour",
      axis: "measure.shoulderHeight",
      value: measure.shoulderHeight,
      feasible: null,
      reason:
        "a cuirass needs the shoulders above the waist to have a positive height",
      fix: "supply canonical body heights with shoulderHeight above waistHeight",
    });
}
