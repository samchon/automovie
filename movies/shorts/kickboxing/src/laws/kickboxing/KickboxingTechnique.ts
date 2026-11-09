/**
 * The striking techniques of the bout: which limb throws them, which region
 * of the receiver they relate to, along which line, from which surface, when
 * the weapon commits to its target and which hand rule holds meanwhile.
 * Timing, defense pairing and outcomes read these records instead of
 * branching on technique names.
 *
 * Regions are named on the receiver's own body: a hook thrown with the
 * attacker's left hand meets the receiver's right jaw, because two orthodox
 * fighters face each other. `region(spec)` resolves that side.
 *
 * ```ts
 * const hook = KickboxingTechnique.table.hook;
 * KickboxingTechnique.region(hook); // "jaw-right"
 * ```
 *
 * @evidence docs/research/kickboxing/techniques.md#surfaces Surfaces, receiver regions, lines and the commit instant of every technique follow the surfaces table.
 * @evidence docs/research/kickboxing/rules.md#legal-actions Only the legal techniques appear: punches, round kicks to legs, body and head, the teep to the stomach and the clinch knee; no elbow, throw or sweep exists here.
 * @evidence docs/research/kickboxing/exchanges.md#feints Feints carry the technique they show and the share of it they show.
 * @evidence contracts/development/common.md#meaningful-documentation States what the table holds, how regions resolve by side and that consumers read records rather than names.
 * @evidence contracts/development/design.md#principled-representation Each technique is one record whose discriminating fields (family, limb, level, line, aim) are closed unions, so an unknown family or line cannot be written; the receiver region is derived from the side rather than stored twice.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The fields are those read by timing, defense pairing, outcome, range, shape and sound; this namespace owns the vocabulary.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No record names a scene, fighter or screenplay beat; a feint is a record with `shows`, not an optional flag soup.
 */
export namespace KickboxingTechnique {
  /** A performer's own side. */
  export type Side = "left" | "right";

  /** Every technique the bout may throw. */
  export type Name =
    | "jab"
    | "cross"
    | "hook"
    | "uppercut"
    | "body-cross"
    | "body-hook"
    | "low-kick"
    | "body-kick"
    | "high-kick"
    | "switch-kick"
    | "brazilian-kick"
    | "teep"
    | "knee"
    | "feint-jab"
    | "feint-low-kick"
    | "feint-body-kick"
    | "feint-shoulder"
    | "feint-level";

  /** Performance family: which shape prior and timing law apply. */
  export type Family = "punch" | "round-kick" | "push-kick" | "knee" | "feint";

  /** Line of travel in the attacker's own frame. */
  export type Line = "straight" | "arc" | "rising" | "descending";

  /** Height band of the receiver region. */
  export type Level = "head" | "body" | "leg";

  /** Attacker surface that meets the receiver. */
  export type Surface = "knuckles" | "shin" | "instep" | "sole" | "knee";

  /** When the weapon stops following the receiver: at its launch or at the kick's chamber key. */
  export type Aim = "launch" | "chamber";

  /** Hand rule while the technique is active. */
  export type Guard = "cheeks" | "forward" | "clinch";

  /** Receiver region kinds; sided kinds take the receiver's side. */
  export type RegionKind =
    | "face"
    | "chin"
    | "jaw"
    | "ribs"
    | "stomach"
    | "thigh"
    | "head"
    | "jaw-neck";

  /** One technique. */
  export interface ISpec {
    /** Table key. */
    readonly name: Name;

    /** Performance family. */
    readonly family: Family;

    /** The attacker's side whose limb throws it. */
    readonly side: Side;

    /** Limb class it occupies. */
    readonly limb: "arm" | "leg";

    /** Height band. */
    readonly level: Level;

    /** Line of travel. */
    readonly line: Line;

    /** Weapon surface. */
    readonly surface: Surface;

    /** Receiver region kind; a sided kind meets the side facing the throwing limb. */
    readonly region: RegionKind;

    /** Commit instant of the aim. */
    readonly aim: Aim;

    /** Hand rule while active. */
    readonly guard: Guard;

    /** For a feint: the technique it shows and the share of that technique's delivery it shows. */
    readonly shows?: { readonly of: Name; readonly share: number };

    /** For a disguised technique: the technique whose chamber it shares. */
    readonly disguise?: Name;
  }

  /** Sided region kinds; the others are central. */
  const sided: ReadonlySet<RegionKind> = new Set<RegionKind>([
    "jaw",
    "ribs",
    "thigh",
    "head",
    "jaw-neck",
  ]);

  /**
   * Share of the jab's delivery a pump jab shows: the screenplay's "halfway
   * out", which the [feint law](docs/research/kickboxing/exchanges.md#feints)
   * leaves to the attacker.
   */
  export const PUMP_SHARE: number = 0.5;

  /**
   * Share of a punch's delivery a shoulder or level feint shows: about the
   * first 0.3 of the delivery. The shoulder feint pushes the lead shoulder
   * toward the opponent with a small forward step, the start of the jab
   * (The Arena Gym: feints and level changes; Fight Primer on Adesanya); the
   * level feint bends the knees to change level, the start of the body cross
   * ([feint law](docs/research/kickboxing/exchanges.md#feints)).
   */
  export const LOAD_SHARE: number = 0.3;

  const punch = (
    name: Name,
    side: Side,
    line: Line,
    level: "head" | "body",
    region: RegionKind,
  ): ISpec => ({
    name,
    family: "punch",
    side,
    limb: "arm",
    level,
    line,
    surface: "knuckles",
    region,
    aim: "launch",
    guard: "cheeks",
  });
  const kick = (
    name: Name,
    side: Side,
    level: Level,
    region: RegionKind,
    variant: Partial<ISpec> = {},
  ): ISpec => ({
    name,
    family: "round-kick",
    side,
    limb: "leg",
    level,
    line: "arc",
    surface: "shin",
    region,
    aim: "chamber",
    guard: "forward",
    ...variant,
  });
  const feint = (name: Name, of: ISpec, share: number): ISpec => ({
    ...of,
    name,
    family: "feint",
    shows: { of: of.name, share },
  });

  const jab: ISpec = punch("jab", "left", "straight", "head", "face");
  const cross: ISpec = punch("cross", "right", "straight", "head", "face");
  const bodyCross: ISpec = punch(
    "body-cross",
    "right",
    "straight",
    "body",
    "stomach",
  );
  const lowKick: ISpec = kick("low-kick", "right", "leg", "thigh");
  const bodyKick: ISpec = kick("body-kick", "right", "body", "ribs");

  /** Every technique, by name. */
  export const table: Readonly<Record<Name, ISpec>> = Object.freeze({
    jab,
    cross,
    hook: punch("hook", "left", "arc", "head", "jaw"),
    uppercut: punch("uppercut", "left", "rising", "head", "chin"),
    "body-cross": bodyCross,
    "body-hook": punch("body-hook", "left", "arc", "body", "ribs"),
    "low-kick": lowKick,
    "body-kick": bodyKick,
    "high-kick": kick("high-kick", "right", "head", "head"),
    "switch-kick": kick("switch-kick", "left", "body", "ribs"),
    "brazilian-kick": kick("brazilian-kick", "right", "head", "jaw-neck", {
      line: "descending",
      surface: "instep",
      disguise: "body-kick",
    }),
    teep: {
      name: "teep",
      family: "push-kick",
      side: "left",
      limb: "leg",
      level: "body",
      line: "straight",
      surface: "sole",
      region: "stomach",
      aim: "launch",
      guard: "cheeks",
    },
    knee: {
      name: "knee",
      family: "knee",
      side: "right",
      limb: "leg",
      level: "body",
      line: "rising",
      surface: "knee",
      region: "stomach",
      aim: "launch",
      guard: "clinch",
    },
    "feint-jab": feint("feint-jab", jab, PUMP_SHARE),
    "feint-low-kick": feint("feint-low-kick", lowKick, 1),
    "feint-body-kick": feint("feint-body-kick", bodyKick, 1),
    "feint-shoulder": feint("feint-shoulder", cross, LOAD_SHARE),
    "feint-level": feint("feint-level", bodyCross, LOAD_SHARE),
  } satisfies Record<Name, ISpec>);

  /**
   * The receiver's region a technique meets: a sided kind takes the side
   * facing the attacker's throwing limb, which for two orthodox fighters is
   * the receiver's opposite side.
   *
   * @param spec The technique.
   * @returns The receiver region id, such as `jaw-right` or `stomach`.
   * @evidence docs/research/kickboxing/techniques.md#surfaces The receiver regions of the surfaces table, sided by the throwing limb.
   * @evidence contracts/development/common.md#meaningful-documentation States the side rule and the returned id form.
   * @evidence contracts/development/implementation.md#principled-implementation Facing fighters mirror left and right, so the throwing side maps to the receiver's opposite side.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One rule serves every sided region.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No technique is special-cased.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing is retained.
   * @evidence contracts/development/behaviors.md#studied-laws The sides follow the studied surfaces table.
   * @evidence contracts/development/behaviors.md#relational-goals The result names a region of the receiver's body, never a point.
   * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
   */
  export function region(spec: ISpec): string {
    if (!sided.has(spec.region)) return spec.region;
    return `${spec.region}-${opposite(spec.side)}`;
  }

  /**
   * The other side.
   *
   * @param side A side.
   * @returns The opposite side.
   * @evidence docs/research/kickboxing/techniques.md#surfaces Facing orthodox fighters mirror sides.
   * @evidence contracts/development/common.md#meaningful-documentation States the mapping.
   * @evidence contracts/development/implementation.md#principled-implementation Two sides, swapped.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing is retained.
   * @evidence contracts/development/behaviors.md#studied-laws Sides are the anatomical sides of the study.
   * @evidence contracts/development/behaviors.md#relational-goals No position is read.
   * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
   */
  export function opposite(side: Side): Side {
    return side === "left" ? "right" : "left";
  }

  /**
   * The real technique a record performs: itself, or the technique a feint shows.
   *
   * @param spec A technique.
   * @returns The shown or performed technique.
   * @evidence docs/research/kickboxing/exchanges.md#feints A feint shows the first part of a real technique.
   * @evidence contracts/development/common.md#meaningful-documentation States both cases.
   * @evidence contracts/development/implementation.md#principled-implementation Reads the record's `shows`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing is retained.
   * @evidence contracts/development/behaviors.md#studied-laws Follows the feint law.
   * @evidence contracts/development/behaviors.md#relational-goals No position is read.
   * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
   */
  export function performed(spec: ISpec): ISpec {
    return spec.shows ? table[spec.shows.of] : spec;
  }
}
