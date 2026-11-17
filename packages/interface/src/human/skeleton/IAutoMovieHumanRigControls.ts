import type { AutoMovieHumanSide } from "../AutoMovieHumanSide";
import type { IAutoMovieHumanPose } from "../pose/IAutoMovieHumanPose";
import type { IAutoMovieHumanPoseChannels } from "./IAutoMovieHumanPoseChannels";

/** Type contracts exchanged by AutoMovieHumanRigControls; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanRigControls {
  /** Canonical table spelling before own-side expansion.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Canonical table spelling before own-side expansion.
   * @evidence contracts/development/design.md#principled-representation Canonical table spelling before own-side expansion. Template<Channel> retains the referenced owner's constraints and mutability.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanRigControls.ChannelTemplate is the canonical exchange used by INITIAL, AXIAL.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by INITIAL, AXIAL for canonical table spelling before own-side expansion.
   */
  export type ChannelTemplate = Template<Channel>;

  /** Resolve either public side spelling into one canonical row template.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Resolve either public side spelling into one canonical row template.
   * @evidence contracts/development/design.md#principled-representation Resolve either public side spelling into one canonical row template.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanRigControls.Template is the canonical exchange used by IAutoMovieHumanRigControls.ChannelTemplate.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by IAutoMovieHumanRigControls.ChannelTemplate for resolve either public side spelling into one canonical row template.
   */
  export type Template<T extends string> = T extends
    | `${infer Before}.left.${infer After}`
    | `${infer Before}.right.${infer After}`
    ? `${Before}.<side>.${After}`
    : T;

  /** Every numeric leaf in the existing public pose; jaw leaves use millimetres.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Every numeric leaf in the existing public pose; jaw leaves use millimetres.
   * @evidence contracts/development/design.md#principled-representation Every numeric leaf in the existing public pose; jaw leaves use millimetres. NumericPath<IAutoMovieHumanPose> retains the referenced owner's constraints and mutability.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanRigControls.readApplied.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanRigControls.readApplied for every numeric leaf in the existing public pose; jaw leaves use millimetres.
   */
  export type Channel = NumericPath<IAutoMovieHumanPose>;

  /** Public numeric leaves remain the sole channel-schema authority.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Public numeric leaves remain the sole channel-schema authority.
   * @evidence contracts/development/design.md#principled-representation Public numeric leaves remain the sole channel-schema authority. This projection keeps { [K in keyof T & string]-?: NonNullable<T[K]> extends number ? K : NonNullable<T[K]> extends object ? `${K}.${NumericPath<NonNullable<T[K]>>}` : never; }[keyof T & string] tied to its canonical owner instead of copying its field shape.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanRigControls.NumericPath is the canonical exchange used by IAutoMovieHumanRigControls.Channel.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by IAutoMovieHumanRigControls.Channel for public numeric leaves remain the sole channel-schema authority.
   */
  export type NumericPath<T> = {
    [K in keyof T & string]-?: NonNullable<T[K]> extends number
      ? K
      : NonNullable<T[K]> extends object
        ? `${K}.${NumericPath<NonNullable<T[K]>>}`
        : never;
  }[keyof T & string];

  /** Angular clinical paths accepted by IK; jaw translations/opening are excluded.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Angular clinical paths accepted by IK; jaw translations/opening are excluded.
   * @evidence contracts/development/design.md#principled-representation Angular clinical paths accepted by IK; jaw translations/opening are excluded. Exclude<Channel, `head.jaw.${string}`> retains the referenced owner's constraints and mutability.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanRigControls.channel, AutoMovieHumanRigControls.isChannel, AutoMovieHumanRigControls.chain. Read by AutoMovieHumanRigControls.bounds. Also types AutoMovieHumanRigControls.paths, AutoMovieHumanRigControls.result.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanRigControls.channel, AutoMovieHumanRigControls.isChannel, AutoMovieHumanRigControls.bounds, AutoMovieHumanRigControls.chain for angular clinical paths accepted by IK; jaw translations/opening are excluded.
   */
  export type DegreeChannel = Exclude<Channel, `head.jaw.${string}`>;

  /** Canonical jaw translation/opening paths, whose scalar unit is millimetres.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Canonical jaw translation/opening paths, whose scalar unit is millimetres.
   * @evidence contracts/development/design.md#principled-representation Canonical jaw translation/opening paths, whose scalar unit is millimetres. Extract<Channel, `head.jaw.${string}`> retains the referenced owner's constraints and mutability.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanRigControls.millimetreBounds.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanRigControls.millimetreBounds for canonical jaw translation/opening paths, whose scalar unit is millimetres.
   */
  export type MillimetreChannel = Extract<Channel, `head.jaw.${string}`>;

  /** Exact Human FK joint identities, including original custom finger/foot joints.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Exact Human FK joint identities, including original custom finger/foot joints.
   * @evidence contracts/development/design.md#principled-representation Exact Human FK joint identities, including original custom finger/foot joints. Expand< (readonly IAutoMovieHumanPoseChannels.Channel[])[number][1] > retains the referenced owner's constraints and mutability.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanRigControls.joint, AutoMovieHumanRigControls.isJoint.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanRigControls.joint, AutoMovieHumanRigControls.isJoint for exact Human FK joint identities, including original custom finger/foot joints.
   */
  export type Joint = Expand<
    (readonly IAutoMovieHumanPoseChannels.Channel[])[number][1]
  >;

  /** Resolve the canonical table's side placeholder to the public own-side union.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Resolve the canonical table's side placeholder to the public own-side union.
   * @evidence contracts/development/design.md#principled-representation Resolve the canonical table's side placeholder to the public own-side union.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanRigControls.Expand is the canonical exchange used by IAutoMovieHumanRigControls.Joint.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by IAutoMovieHumanRigControls.Joint for resolve the canonical table's side placeholder to the public own-side union.
   */
  export type Expand<T extends string> =
    T extends `${infer Before}<side>${infer After}`
      ? `${Before}${AutoMovieHumanSide}${After}`
      : T;

  /** Reusable anatomical chain selection; no activity or film catalogue.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Reusable anatomical chain selection; no activity or film catalogue.
   * @evidence contracts/development/design.md#principled-representation Reusable anatomical chain selection; no activity or film catalogue. Alternatives are a record with region, side; a record with region; a record with region, side, digit; a record with region, side, digit.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanRigControls.chain.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanRigControls.chain for reusable anatomical chain selection; no activity or film catalogue.
   */
  export type IChain =
    | {
        /** Discriminant selecting the anatomical chain family. */
        region: "arm" | "leg" | "eyes";
        /** Person's own anatomical side, independent of camera orientation. */
        side: AutoMovieHumanSide;
      }
    | {
        /** Discriminant selecting the anatomical chain family. */
        region: "spine" | "neck" | "pelvis";
      }
    | {
        /** Discriminant selecting the anatomical chain family. */
        region: "finger";
        /** Person's own anatomical side, independent of camera orientation. */
        side: AutoMovieHumanSide;
        /** Digit identity within the selected hand or foot; the region determines the allowed vocabulary. */
        digit: "thumb" | "index" | "middle" | "ring" | "little";
      }
    | {
        /** Discriminant selecting the anatomical chain family. */
        region: "toe";
        /** Person's own anatomical side, independent of camera orientation. */
        side: AutoMovieHumanSide;
        /** Digit identity within the selected hand or foot; the region determines the allowed vocabulary. */
        digit: "hallux" | "second" | "third" | "fourth" | "fifth";
      };

  /** Result of AutoMovieHumanRigControls.bounds. Read the canonical degree interval; an optional current pose applies FK's flexion-dependent tibial interval.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Read the canonical degree interval; an optional current pose applies FK's flexion-dependent tibial interval.
   * @evidence contracts/development/design.md#principled-representation `minimum`: Inclusive lower clinical bound in this method's unit; bounds uses degrees and millimetreBounds uses millimetres. `maximum`: Inclusive upper clinical bound in this method's unit; bounds uses degrees and millimetreBounds uses millimetres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanRigControls.IBoundsResult is the canonical exchange used by AutoMovieHumanRigControls.bounds.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `minimum`, `maximum`; callers supply the complete record.
   */
  export type IBoundsResult = {
    /** Inclusive lower clinical bound in this method's unit; bounds uses degrees and millimetreBounds uses millimetres. */
    minimum: number;
    /** Inclusive upper clinical bound in this method's unit; bounds uses degrees and millimetreBounds uses millimetres. */
    maximum: number;
  };

  /** Result of AutoMovieHumanRigControls.millimetreBounds. Read canonical jaw millimetre bounds without admitting a jaw path as degrees.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Read canonical jaw millimetre bounds without admitting a jaw path as degrees.
   * @evidence contracts/development/design.md#principled-representation `minimum`: Inclusive lower clinical bound in this method's unit; bounds uses degrees and millimetreBounds uses millimetres. `maximum`: Inclusive upper clinical bound in this method's unit; bounds uses degrees and millimetreBounds uses millimetres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanRigControls.IMillimetreBoundsResult is the canonical exchange used by AutoMovieHumanRigControls.millimetreBounds.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `minimum`, `maximum`; callers supply the complete record.
   */
  export type IMillimetreBoundsResult = {
    /** Inclusive lower clinical bound in this method's unit; bounds uses degrees and millimetreBounds uses millimetres. */
    minimum: number;
    /** Inclusive upper clinical bound in this method's unit; bounds uses degrees and millimetreBounds uses millimetres. */
    maximum: number;
  };
}
