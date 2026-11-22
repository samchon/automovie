import type { IAutoMovieMotionHumanPlayWindInstrument } from "../daily/IAutoMovieMotionHumanPlayWindInstrument";
import type { IAutoMovieMotionHumanGuitarChord } from "../handling/IAutoMovieMotionHumanGuitarChord";
import type { IAutoMovieMotionHumanGuitarNote } from "../handling/IAutoMovieMotionHumanGuitarNote";
import type { IAutoMovieMotionHumanPianoPedal } from "../handling/IAutoMovieMotionHumanPianoPedal";
import type { IAutoMovieMotionHumanPianoPerformance } from "../handling/IAutoMovieMotionHumanPianoPerformance";
import type { IAutoMovieMotionHumanPianoScore } from "../handling/IAutoMovieMotionHumanPianoScore";
import type { IAutoMovieMotionHumanBowViolinParams } from "../music/IAutoMovieMotionHumanBowViolinParams";
import type { IAutoMovieMotionHumanConduct } from "../music/IAutoMovieMotionHumanConduct";
import type { IAutoMovieMotionHumanCymbalStrike } from "../tasks/IAutoMovieMotionHumanCymbalStrike";
import type { IAutoMovieMotionHumanSideDrumStrike } from "../tasks/IAutoMovieMotionHumanSideDrumStrike";

/**
 * Mechanism: playing and conducting music: wind, bowed string, plucked string, keyboard and percussion instruments, and the conductor's baton.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Instrument family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Instrument laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanInstrument<Chain> {
  /**
   * Playing pose of a held bugle, with the modeled mouthpiece at the lips.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanInstrument.playWindInstrument: Playing pose of a held bugle, with the modeled mouthpiece at the lips.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanInstrument.playWindInstrument is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanInstrument.playWindInstrument is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanInstrument.playWindInstrument is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanInstrument.playWindInstrument is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanInstrument.playWindInstrument is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanInstrument.playWindInstrument is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   */
  playWindInstrument(
    params: IAutoMovieMotionHumanInstrument.IPlayWindInstrument,
    anchor?: string,
  ): Chain;

  /**
   * Conducting with a held baton: its tip beats the standard figure of the meter on the beat clock, the ictus, the tip's lowest point of each beat, falling on the beat's instant.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanInstrument.conduct: Conducting with a held baton: its tip beats the standard figure of the meter on the beat clock, the ictus, the tip's lowest point of each beat, falling on the beat's instant.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanInstrument.conduct is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanInstrument.conduct is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanInstrument.conduct is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanInstrument.conduct is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanInstrument.conduct is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanInstrument.conduct is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   */
  conduct(
    params: IAutoMovieMotionHumanInstrument.IConduct,
    anchor?: string,
  ): Chain;

  /**
   * Bow a violin string.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanInstrument.bowViolin: Bow a violin string.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanInstrument.bowViolin is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanInstrument.bowViolin is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanInstrument.bowViolin is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanInstrument.bowViolin is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanInstrument.bowViolin is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanInstrument.bowViolin is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   */
  bowViolin(
    params: IAutoMovieMotionHumanInstrument.IBowViolin,
    anchor?: string,
  ): Chain;

  /**
   * Fret and pluck one guitar note.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanInstrument.guitarNote: Fret and pluck one guitar note.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanInstrument.guitarNote is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanInstrument.guitarNote is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanInstrument.guitarNote is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanInstrument.guitarNote is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanInstrument.guitarNote is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanInstrument.guitarNote is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   */
  guitarNote(
    params: IAutoMovieMotionHumanInstrument.IGuitarNote,
    anchor?: string,
  ): Chain;

  /**
   * Strum a guitar chord.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanInstrument.guitarChord: Strum a guitar chord.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanInstrument.guitarChord is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanInstrument.guitarChord is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanInstrument.guitarChord is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanInstrument.guitarChord is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanInstrument.guitarChord is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanInstrument.guitarChord is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   */
  guitarChord(
    params: IAutoMovieMotionHumanInstrument.IGuitarChord,
    anchor?: string,
  ): Chain;

  /**
   * Play a score of piano notes.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanInstrument.pianoScore: Play a score of piano notes.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanInstrument.pianoScore is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanInstrument.pianoScore is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanInstrument.pianoScore is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanInstrument.pianoScore is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanInstrument.pianoScore is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanInstrument.pianoScore is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   */
  pianoScore(
    params: IAutoMovieMotionHumanInstrument.IPianoScore,
    anchor?: string,
  ): Chain;

  /**
   * Press and release a piano pedal.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanInstrument.pianoPedal: Press and release a piano pedal.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanInstrument.pianoPedal is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanInstrument.pianoPedal is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanInstrument.pianoPedal is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanInstrument.pianoPedal is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanInstrument.pianoPedal is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanInstrument.pianoPedal is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   */
  pianoPedal(
    params: IAutoMovieMotionHumanInstrument.IPianoPedal,
    anchor?: string,
  ): Chain;

  /**
   * Play a piano score with its pedal.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanInstrument.pianoPerformance: Play a piano score with its pedal.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanInstrument.pianoPerformance is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanInstrument.pianoPerformance is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanInstrument.pianoPerformance is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanInstrument.pianoPerformance is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanInstrument.pianoPerformance is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanInstrument.pianoPerformance is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   */
  pianoPerformance(
    params: IAutoMovieMotionHumanInstrument.IPianoPerformance,
    anchor?: string,
  ): Chain;

  /**
   * Strike a side drum.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanInstrument.sideDrumStrike: Strike a side drum.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanInstrument.sideDrumStrike is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanInstrument.sideDrumStrike is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanInstrument.sideDrumStrike is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanInstrument.sideDrumStrike is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanInstrument.sideDrumStrike is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanInstrument.sideDrumStrike is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   */
  sideDrumStrike(
    params: IAutoMovieMotionHumanInstrument.ISideDrumStrike,
    anchor?: string,
  ): Chain;

  /**
   * Strike a cymbal.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanInstrument.cymbalStrike: Strike a cymbal.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanInstrument.cymbalStrike is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanInstrument.cymbalStrike is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanInstrument.cymbalStrike is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanInstrument.cymbalStrike is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanInstrument.cymbalStrike is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanInstrument.cymbalStrike is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   */
  cymbalStrike(
    params: IAutoMovieMotionHumanInstrument.ICymbalStrike,
    anchor?: string,
  ): Chain;
}

/**
 * The parameter types of the Instrument methods.
 */
export namespace IAutoMovieMotionHumanInstrument {
  /**
   * The parameters of `playWindInstrument`: `IAutoMovieMotionHumanPlayWindInstrument.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanPlayWindInstrument.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanPlayWindInstrument.IParams` owns the shape; the alias serves `playWindInstrument` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IPlayWindInstrument =
    IAutoMovieMotionHumanPlayWindInstrument.IParams;

  /**
   * The parameters of `conduct`: `IAutoMovieMotionHumanConduct.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanConduct.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanConduct.IParams` owns the shape; the alias serves `conduct` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IConduct = IAutoMovieMotionHumanConduct.IParams;

  /**
   * The parameters of `bowViolin`: `IAutoMovieMotionHumanBowViolinParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanBowViolinParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanBowViolinParams` owns the shape; the alias serves `bowViolin` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IBowViolin = IAutoMovieMotionHumanBowViolinParams;

  /**
   * The parameters of `guitarNote`: `IAutoMovieMotionHumanGuitarNote`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanGuitarNote`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanGuitarNote` owns the shape; the alias serves `guitarNote` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IGuitarNote = IAutoMovieMotionHumanGuitarNote;

  /**
   * The parameters of `guitarChord`: `IAutoMovieMotionHumanGuitarChord`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanGuitarChord`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanGuitarChord` owns the shape; the alias serves `guitarChord` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IGuitarChord = IAutoMovieMotionHumanGuitarChord;

  /**
   * The parameters of `pianoScore`: `IAutoMovieMotionHumanPianoScore`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanPianoScore`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanPianoScore` owns the shape; the alias serves `pianoScore` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IPianoScore = IAutoMovieMotionHumanPianoScore;

  /**
   * The parameters of `pianoPedal`: `IAutoMovieMotionHumanPianoPedal`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanPianoPedal`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanPianoPedal` owns the shape; the alias serves `pianoPedal` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IPianoPedal = IAutoMovieMotionHumanPianoPedal;

  /**
   * The parameters of `pianoPerformance`: `IAutoMovieMotionHumanPianoPerformance`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanPianoPerformance`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanPianoPerformance` owns the shape; the alias serves `pianoPerformance` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IPianoPerformance = IAutoMovieMotionHumanPianoPerformance;

  /**
   * The parameters of `sideDrumStrike`: `IAutoMovieMotionHumanSideDrumStrike`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanSideDrumStrike`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanSideDrumStrike` owns the shape; the alias serves `sideDrumStrike` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type ISideDrumStrike = IAutoMovieMotionHumanSideDrumStrike;

  /**
   * The parameters of `cymbalStrike`: `IAutoMovieMotionHumanCymbalStrike`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanCymbalStrike`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanCymbalStrike` owns the shape; the alias serves `cymbalStrike` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type ICymbalStrike = IAutoMovieMotionHumanCymbalStrike;
}
