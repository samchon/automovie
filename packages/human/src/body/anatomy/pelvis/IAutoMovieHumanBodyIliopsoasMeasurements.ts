import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";
import type { IAutoMovieHumanBodyIliacusMeasurements } from "./IAutoMovieHumanBodyIliacusMeasurements";
import type { IAutoMovieHumanBodyPsoasMajorMeasurements } from "./IAutoMovieHumanBodyPsoasMajorMeasurements";

/**
 * One side's iliopsoas group with separately owned psoas and iliacus bellies.
 *
 * MOOSE CT labels the combined iliopsoas (labels 9/10), not its two muscle
 * bellies. The optional group volume preserves that observation without
 * inventing a split or copying it into both child muscles; a later resolver
 * must reconcile any independently observed child volumes against this total.
 *
 * @evidence contracts/common.md#principled-implementation `AutoMovieHumanBodyNonemptyMeasurements` over a closed set of named optional quantities makes at least one of them mandatory, so `{}` cannot claim the part was specified and an absent quantity is never read as zero. Each member is its own record, so one side's iliopsoas composes the combined volume, the psoas major and the iliacus without copying any of their quantities.
 * @evidence contracts/common.md#clear-and-simple-design One nonempty record of named optional members and nothing else: no option, layer or derived value.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration is a type and holds no behaviour, so no special case, foreign mutation or compensating path exists in it.
 * @evidence contracts/common.md#meaningful-documentation The comment states that CT labels the combined iliopsoas and not its two bellies, that the group volume preserves that observation without inventing a split, and that a later resolver must reconcile any child volumes against it.
 * @evidence contracts/modeling.md#part-identity-and-grouping A group: it composes the combined volume, the psoas major and the iliacus for one side's iliopsoas, each declared once in its own file. The group owns the composition and copies no member's shape or values, so a change to one member reaches its neighbours only through their named relations.
 * @evidenceExclude contracts/modeling.md#parameter-channels The declaration names measurement slots, not shape channels: each value is an absolute anatomical quantity with no neutral zero, and the body basis owns the channels that vary a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The declaration emits no primitive.
 * @evidence contracts/modeling.md#spatial-conventions The combined belly volume is millilitres through `IAutoMovieHumanBodyAnatomicalVolume`; the psoas and iliacus preserve the units of their separately observed muscle records. This group performs no conversion and derives no coordinates from the combined scalar.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The declaration builds no surface or volume, so it has no boundary to share.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is an internal anatomical measurement that no product path draws, so there is no rendered frame of it to observe.
 * @evidenceExclude contracts/anatomy.md#permitted-range The declaration admits or bounds nothing: `admitHumanBodyAnatomicalMeasurements` rejects non-finite, non-positive and out-of-interval values, and population ranges belong to the component resolver.
 * @evidence contracts/anatomy.md#parametric-authority The members are named parts and every quantity below them is a named measurement, target or observation; `admitHumanBodyAnatomicalMeasurements` asserts a closed schema, so no member can address a vertex, curve or surface patch.
 * @author Samchon
 */
export type IAutoMovieHumanBodyIliopsoasMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Combined psoas-major and iliacus belly volume, counted once. */
    combinedMuscleVolume?: IAutoMovieHumanBodyAnatomicalVolume;

    /** Lumbar-origin psoas major when independently segmented. */
    psoasMajor?: IAutoMovieHumanBodyPsoasMajorMeasurements;

    /** Iliac-fossa iliacus when independently segmented. */
    iliacus?: IAutoMovieHumanBodyIliacusMeasurements;
  }>;
