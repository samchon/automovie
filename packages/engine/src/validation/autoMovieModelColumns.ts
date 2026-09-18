import { AutoMovieHumanoidBone, IAutoMovieFormationMotion, IAutoMovieFormationSlotMotion, IAutoMovieModel, IAutoMovieVector3 } from "@automovie/interface";
import { formationSlotPosition } from "../formationSlotPosition";
import { IAutoMovieFormationPlacement } from "../IAutoMovieFormationPlacement";
import { IAutoMovieModelColumn } from "./IAutoMovieModelColumn";

/**
 * The columns one runtime model fills, read from the geometry it already is.
 *
 * A member's size is not a field an author states beside the model and then
 * contradicts: it is derived from the parts the builder materialized, so a
 * recipe that grows grows here too and there is nothing to keep in step by
 * hand. One reading answers for a figure assembled from primitives, for a
 * single-primitive object, and for the proxy an imported appearance is bound
 * through, because all three are parts with stated dimensions.
 *
 * Only parts standing on the model's own vertical axis are read. A part hung
 * off the axis sits somewhere different for every heading its member holds, and
 * this answer has to hold whichever way a member faces; a disc about the axis
 * does. A part turned about anything but the vertical is left out for the same
 * reason, its column no longer being vertical, and so is a scaled one, whose
 * real dimensions are no longer the ones its shape states.
 *
 * @author Samchon
 */
export const autoMovieModelColumns = (
  model: Pick<IAutoMovieModel, "parts" | "skeleton">,
): IAutoMovieModelColumn[] => {
  const heights = axialBoneHeights(model.skeleton);
  return model.parts.flatMap((part) => {
    const column = axialPartColumn(part, heights);
    return column === null ? [] : [column];
  });
};

/**
 * Where each bone rests on the model's own vertical axis, above its origin.
 *
 * A bone is on that axis when it and every bone above it rest with no sideways
 * displacement and no turn out of the vertical, which is exactly when adding up
 * the chain's heights gives the bone's real resting height. A bone that fails
 * either test, or whose parent does, is simply absent: the parts riding it are
 * then not measured, which costs the gate a column and never gives it a wrong
 * one.
 *
 * Resolved by repeated passes rather than by walking parents, because bones are
 * not required to be listed above their children, and a chain that never
 * resolves — a parent that is missing, off the axis, or its own ancestor —
 * simply stops adding heights instead of needing a cycle guard of its own.
 */
const axialBoneHeights = (
  skeleton: IAutoMovieModel["skeleton"],
): Map<AutoMovieHumanoidBone, number> => {
  const heights = new Map<AutoMovieHumanoidBone, number>();
  const axial = (skeleton?.bones ?? []).filter(
    (bone) =>
      bone.rest.translation.x === 0 &&
      bone.rest.translation.z === 0 &&
      bone.rest.rotation.x === 0 &&
      bone.rest.rotation.z === 0,
  );
  let settled = true;
  while (settled) {
    settled = false;
    for (const bone of axial) {
      if (heights.has(bone.bone)) continue;
      const above = bone.parent === null ? 0 : heights.get(bone.parent);
      if (above === undefined) continue;
      heights.set(bone.bone, above + bone.rest.translation.y);
      settled = true;
    }
  }
  return heights;
};

/**
 * The column one part fills on its model's axis, or `null` when it fills none.
 *
 * A part's own scale is applied rather than refused, because a scaled part is
 * still a solid: each horizontal reach is stretched by its own factor and the
 * disc inside the result is the narrower of the two, while a mirrored part
 * occupies exactly what its unmirrored twin did. That is also what makes one
 * reading at the end enough — a dimension that was never real, and a scale that
 * erases one, both arrive here as a column with nothing inside it.
 */
const axialPartColumn = (
  part: IAutoMovieModel["parts"][number],
  heights: ReadonlyMap<AutoMovieHumanoidBone, number>,
): IAutoMovieModelColumn | null => {
  const solid = columnOfShape(part.geometry);
  if (solid === null) return null;
  const base = axialPartHeight(part, heights);
  if (base === null) return null;
  const scale = part.transform === null ? UNIT_SCALE : part.transform.scale;
  const radius = Math.min(
    solid.across * Math.abs(scale.x),
    solid.deep * Math.abs(scale.z),
  );
  const centre = base + solid.centre * scale.y;
  const half = solid.half * Math.abs(scale.y);
  return finitePositive(radius) && finitePositive(half)
    ? { radius, bottom: centre - half, top: centre + half }
    : null;
};

/** The scale a part with no transform of its own is drawn at. */
const UNIT_SCALE: IAutoMovieVector3 = { x: 1, y: 1, z: 1 };

/**
 * Height above the model's origin at which one part rides, or `null` off-axis.
 *
 * A part rides a bone, or the model's origin when it rides no bone at all, and
 * then its own transform moves it again. Either step can take it off the axis
 * this gate measures about, and a part it cannot place is a part it does not
 * measure.
 */
const axialPartHeight = (
  part: IAutoMovieModel["parts"][number],
  heights: ReadonlyMap<AutoMovieHumanoidBone, number>,
): number | null => {
  const bone = part.attachedBone === null ? 0 : heights.get(part.attachedBone);
  if (bone === undefined) return null;
  const local = part.transform;
  if (local === null) return bone;
  return vertical(local.translation) && vertical(local.rotation)
    ? bone + local.translation.y
    : null;
};

/**
 * True when one displacement or turn leaves the model's vertical axis alone.
 *
 * A quaternion with no `x` and no `z` part turns about the vertical and nothing
 * else, which is exactly the turn a column of circular section does not notice.
 * A displacement with neither is a move straight up or down the axis it already
 * stood on.
 */
const vertical = (value: { x: number; z: number }): boolean =>
  value.x === 0 && value.z === 0;

/**
 * The solid one primitive shape certainly holds, as half-extents about its own
 * centre.
 *
 * Read as two horizontal reaches and a height rather than as a finished disc,
 * because the part's scale stretches the two reaches by different factors and
 * the disc inside the result is the narrower of them. A cone tapers, so what it
 * certainly holds is half its base reach over its wider half; a plane has no
 * thickness, so nothing is ever inside one; a mesh states no dimensions here
 * and is left to the parts that do.
 */
const columnOfShape = (
  geometry: IAutoMovieModel["parts"][number]["geometry"],
): { across: number; deep: number; centre: number; half: number } | null => {
  if (geometry.type !== "primitive") return null;
  const shape = geometry.shape;
  if (shape.type === "sphere")
    return {
      across: shape.radius,
      deep: shape.radius,
      centre: 0,
      half: shape.radius,
    };
  if (shape.type === "capsule" || shape.type === "cylinder")
    return {
      across: shape.radius,
      deep: shape.radius,
      centre: 0,
      half: shape.height / 2,
    };
  if (shape.type === "cone")
    return {
      across: shape.radius / 2,
      deep: shape.radius / 2,
      centre: shape.height / 4,
      half: shape.height / 4,
    };
  if (shape.type === "box")
    return {
      across: shape.width / 2,
      deep: shape.depth / 2,
      centre: 0,
      half: shape.height / 2,
    };
  return null;
};

const finitePositive = (value: number): boolean =>
  Number.isFinite(value) && value > 0;

/** One unit the overlap gate measures, with everything it is measured by. */
interface IFormationOverlapUnit {
  /** Position in the shot's own order, which is the order refusals come in. */
  index: number;
  /** The staged unit itself. */
  formation: IAutoMovieFormationPlacement & {
    lod: ReadonlyArray<{ model: string }>;
  };
  /** Where each measured member stands at rest, with the slot it is. */
  members: ReadonlyArray<{ slot: number; point: IAutoMovieVector3 }>;
  /** Columns of every runtime one of its members may be drawn as. */
  tiers: ReadonlyArray<readonly IAutoMovieModelColumn[]>;
}

/** One measured member, placed where the sampled time really puts it. */
interface IFormationOverlapPlacement {
  /** Unit this member stands in. */
  unit: IFormationOverlapUnit;
  /** Zero-based slot it is. */
  slot: number;
  /** Where it stands at the sampled time. */
  point: IAutoMovieVector3;
}

/**
 * The members one unit is measured by, found once and remembered.
 *
 * The set is a pure function of the unit, and the builder hands the same
 * compiled unit to every shot that stages it, so a crowd in fifty shots would
 * otherwise be regenerated fifty times over. Keyed by the unit itself, so
 * nothing outlives the compile that made it.
 */
const formationOverlapMemberCache = new WeakMap<
  IAutoMovieFormationPlacement,
  ReadonlyArray<{ slot: number; point: IAutoMovieVector3 }>
>();

const formationOverlapMembers = (
  formation: IAutoMovieFormationPlacement,
): ReadonlyArray<{ slot: number; point: IAutoMovieVector3 }> => {
  const remembered = formationOverlapMemberCache.get(formation);
  if (remembered !== undefined) return remembered;
  const members = Array.from(
    { length: Math.min(formation.count, FORMATION_OVERLAP_MEMBER_LIMIT) },
    (_, slot) => ({ slot, point: formationSlotPosition(formation, slot) }),
  );
  formationOverlapMemberCache.set(formation, members);
  return members;
};

/**
 * When one shot is worth placing its units at.
 *
 * Ends first, because the ends of a cue are states the shot certainly holds and
 * zero is where a unit that has no cue at all stands. Then the gaps between
 * them, filled evenly with whatever budget is left, because two units clear at
 * both ends of a cue can walk straight through one another in between and a
 * spacing that closes and reopens inside one cue never shows at either end.
 *
 * This samples; it does not solve. Whether two members are ever inside one
 * another has no closed form — it depends on the layouts, the easings and the
 * cues together — so a resolution is stated instead of a guarantee. Every
 * sampled time is a state the shot really holds, which is what keeps the gate
 * from refusing a production that was correct.
 */
const formationOverlapSampleTimes = (
  cues: readonly IAutoMovieFormationMotion[],
  slotCues: readonly IAutoMovieFormationSlotMotion[],
): number[] => {
  const ends = [
    ...new Set([
      0,
      ...cues.flatMap((cue) => [cue.start, cue.end]),
      ...slotCues.flatMap((cue) => [cue.start, cue.end]),
    ]),
  ].sort((left, right) => left - right);
  const gaps = Math.max(1, ends.length - 1);
  const inside = Math.max(
    0,
    Math.floor((FORMATION_OVERLAP_SAMPLE_LIMIT - ends.length) / gaps),
  );
  return [
    ...new Set(
      ends.flatMap((time, index) => {
        const next = ends[index + 1];
        return next === undefined
          ? [time]
          : [
              time,
              ...Array.from(
                { length: inside },
                (_, step) => time + ((next - time) * (step + 1)) / (inside + 1),
              ),
            ];
      }),
    ),
  ];
};

/**
 * How close two members of two units may stand before they are in one place.
 *
 * The least any pair of the runtimes they may be drawn as allows, because which
 * tier a member is drawn at is the camera's decision and a refusal has to hold
 * whichever one it makes. Zero when no pair of their columns ever meets in
 * height, which is two bodies that pass each other at different levels rather
 * than through each other.
 */
const formationOverlapClearance = (
  left: IFormationOverlapUnit,
  right: IFormationOverlapUnit,
  lift: number,
): number => {
  let least = Number.POSITIVE_INFINITY;
  for (const near of left.tiers)
    for (const far of right.tiers) {
      let widest = 0;
      for (const one of near)
        for (const other of far)
          if (
            Math.max(one.bottom, other.bottom + lift) <
              Math.min(one.top, other.top + lift) &&
            one.radius + other.radius > widest
          )
            widest = one.radius + other.radius;
      least = Math.min(least, widest);
    }
  return least;
};

/**
 * Where each bone rests on the model's own vertical axis, above its origin.
 *
 * A bone is on that axis when it and every bone above it rest with no sideways
 * displacement and no turn out of the vertical, which is exactly when adding up
 * the chain's heights gives the bone's real resting height. A bone that fails
 * either test, or whose parent does, is simply absent: the parts riding it are
 * then not measured, which costs the gate a column and never gives it a wrong
 * one.
 *
 * Resolved by repeated passes rather than by walking parents, because bones are
 * not required to be listed above their children, and a chain that never
 * resolves — a parent that is missing, off the axis, or its own ancestor —
 * simply stops adding heights instead of needing a cycle guard of its own.
 */
const axialBoneHeights = (
  skeleton: IAutoMovieModel["skeleton"],
): Map<AutoMovieHumanoidBone, number> => {
  const heights = new Map<AutoMovieHumanoidBone, number>();
  const axial = (skeleton?.bones ?? []).filter(
    (bone) =>
      bone.rest.translation.x === 0 &&
      bone.rest.translation.z === 0 &&
      bone.rest.rotation.x === 0 &&
      bone.rest.rotation.z === 0,
  );
  let settled = true;
  while (settled) {
    settled = false;
    for (const bone of axial) {
      if (heights.has(bone.bone)) continue;
      const above = bone.parent === null ? 0 : heights.get(bone.parent);
      if (above === undefined) continue;
      heights.set(bone.bone, above + bone.rest.translation.y);
      settled = true;
    }
  }
  return heights;
};

/**
 * The column one part fills on its model's axis, or `null` when it fills none.
 *
 * A part's own scale is applied rather than refused, because a scaled part is
 * still a solid: each horizontal reach is stretched by its own factor and the
 * disc inside the result is the narrower of the two, while a mirrored part
 * occupies exactly what its unmirrored twin did. That is also what makes one
 * reading at the end enough — a dimension that was never real, and a scale that
 * erases one, both arrive here as a column with nothing inside it.
 */
const axialPartColumn = (
  part: IAutoMovieModel["parts"][number],
  heights: ReadonlyMap<AutoMovieHumanoidBone, number>,
): IAutoMovieModelColumn | null => {
  const solid = columnOfShape(part.geometry);
  if (solid === null) return null;
  const base = axialPartHeight(part, heights);
  if (base === null) return null;
  const scale = part.transform === null ? UNIT_SCALE : part.transform.scale;
  const radius = Math.min(
    solid.across * Math.abs(scale.x),
    solid.deep * Math.abs(scale.z),
  );
  const centre = base + solid.centre * scale.y;
  const half = solid.half * Math.abs(scale.y);
  return finitePositive(radius) && finitePositive(half)
    ? { radius, bottom: centre - half, top: centre + half }
    : null;
};

/** The scale a part with no transform of its own is drawn at. */
const UNIT_SCALE: IAutoMovieVector3 = { x: 1, y: 1, z: 1 };

/**
 * Height above the model's origin at which one part rides, or `null` off-axis.
 *
 * A part rides a bone, or the model's origin when it rides no bone at all, and
 * then its own transform moves it again. Either step can take it off the axis
 * this gate measures about, and a part it cannot place is a part it does not
 * measure.
 */
const axialPartHeight = (
  part: IAutoMovieModel["parts"][number],
  heights: ReadonlyMap<AutoMovieHumanoidBone, number>,
): number | null => {
  const bone = part.attachedBone === null ? 0 : heights.get(part.attachedBone);
  if (bone === undefined) return null;
  const local = part.transform;
  if (local === null) return bone;
  return vertical(local.translation) && vertical(local.rotation)
    ? bone + local.translation.y
    : null;
};

/**
 * The solid one primitive shape certainly holds, as half-extents about its own
 * centre.
 *
 * Read as two horizontal reaches and a height rather than as a finished disc,
 * because the part's scale stretches the two reaches by different factors and
 * the disc inside the result is the narrower of them. A cone tapers, so what it
 * certainly holds is half its base reach over its wider half; a plane has no
 * thickness, so nothing is ever inside one; a mesh states no dimensions here
 * and is left to the parts that do.
 */
const columnOfShape = (
  geometry: IAutoMovieModel["parts"][number]["geometry"],
): { across: number; deep: number; centre: number; half: number } | null => {
  if (geometry.type !== "primitive") return null;
  const shape = geometry.shape;
  if (shape.type === "sphere")
    return {
      across: shape.radius,
      deep: shape.radius,
      centre: 0,
      half: shape.radius,
    };
  if (shape.type === "capsule" || shape.type === "cylinder")
    return {
      across: shape.radius,
      deep: shape.radius,
      centre: 0,
      half: shape.height / 2,
    };
  if (shape.type === "cone")
    return {
      across: shape.radius / 2,
      deep: shape.radius / 2,
      centre: shape.height / 4,
      half: shape.height / 4,
    };
  if (shape.type === "box")
    return {
      across: shape.width / 2,
      deep: shape.depth / 2,
      centre: 0,
      half: shape.height / 2,
    };
  return null;
};

const finitePositive = (value: number): boolean =>
  Number.isFinite(value) && value > 0;

/**
 * The members one unit is measured by, found once and remembered.
 *
 * The set is a pure function of the unit, and the builder hands the same
 * compiled unit to every shot that stages it, so a crowd in fifty shots would
 * otherwise be regenerated fifty times over. Keyed by the unit itself, so
 * nothing outlives the compile that made it.
 */
const formationOverlapMemberCache = new WeakMap<
  IAutoMovieFormationPlacement,
  ReadonlyArray<{ slot: number; point: IAutoMovieVector3 }>
>();
