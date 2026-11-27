import { playWindInstrument as playWindInstrumentLaw } from "../daily/internal/playWindInstrument";
import { guitarChord as guitarChordLaw } from "../handling/internal/guitarChord";
import { guitarNote as guitarNoteLaw } from "../handling/internal/guitarNote";
import { pianoPedal as pianoPedalLaw } from "../handling/internal/pianoPedal";
import { pianoPerformance as pianoPerformanceLaw } from "../handling/internal/pianoPerformance";
import { pianoScore as pianoScoreLaw } from "../handling/internal/pianoScore";
import { bowViolin as bowViolinLaw } from "../music/internal/bowViolin";
import { conduct as conductLaw } from "../music/internal/conduct";
import { cymbalStrike as cymbalStrikeLaw } from "../tasks/internal/cymbalStrike";
import { sideDrumStrike as sideDrumStrikeLaw } from "../tasks/internal/sideDrumStrike";

/**
 * Playing and conducting music: wind, bowed string, plucked string, keyboard
 * and percussion instruments, and the conductor's baton.
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `playWindInstrument`: A held bugle is lifted, held with the mouthpiece at the
 *   lips and lowered.
 * - `conduct`: Beat time with a held baton.
 * - `bowViolin`: One staged open-string violin stroke with a held bow.
 * - `guitarNote`: A left index stops one string while the right index crosses it
 *   on a stationary guitar.
 * - `guitarChord`: Keep the left index and middle fingertips on two stopped
 *   strings while the right index sweeps them on one continuous path over the
 *   soundboard.
 * - `pianoScore`: Play named keys on a fixed upright piano from a seated base.
 * - `pianoPedal`: Stage the right forefoot on an upright piano's damper pedal,
 *   depress and release it on its own clock, and return to the original floor
 *   plant.
 * - `pianoPerformance`: Play a keyboard score while the right foot works the
 *   damper pedal.
 * - `sideDrumStrike`: One scenic downstroke and rebound on a stationary batter
 *   head.
 * - `cymbalStrike`: Strike the near edge of a mounted cymbal with the held
 *   stick's working point, then lift the stick from the surface.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanInstrument} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanInstrument {
  /**
   * A held bugle is lifted, held with the mouthpiece at the lips and lowered.
   * The bell faces away along the reverse of the mouthpiece socket's axis.
   * Yamaha's brass playing guide places the mouthpiece at the center of the
   * lips and shows the bell ahead of the player in its side view
   * (https://www.yamaha.com/en/musical_instrument_guide/trumpet/play/).
   * Register this law explicitly to use it. Events are lift, atMouth and
   * playEnd. The last two mark the sustained playing pose.
   */
  export import playWindInstrument = playWindInstrumentLaw;

  /**
   * Beat time with a held baton. Register as `conduct`.
   *
   * The baton rides the hand rigidly, so its `tip` lies at a fixed lever from
   * the wrist (as `write` aims a held tool) and the arm aims the wrist that
   * puts the tip on its path, keeping the baton's entry attitude. The path runs
   * in the performer's frontal plane a forearm ahead of the chest: from ictus
   * to ictus of the meter's figure (`FIGURES`) in a straight line lifted by a
   * rebound arc, `REBOUND` of the figure's half height times `sin(pi u)` over
   * each beat's share `u`, so the tip leaves each ictus upward and falls into
   * the next from above: every ictus is its beat's lowest point. The ictuses
   * fall on the shared beat clock (`prepareDanceBeats`): at `bpm`, or on a cue
   * track's beats when locked. The hand comes in over the lead before the first
   * beat and returns over one beat after the last. A beat is a delivered
   * stroke, so the arm is coursed at its goal's own peak speed
   * (`courseArmAtPace`), not a reach's pace. Events: `strokeStart` at the first
   * ictus and `strokeEnd` at the last.
   */
  export const conduct: typeof conductLaw = conductLaw;

  /**
   * One staged open-string violin stroke with a held bow. Register this law
   * with AutoMovieMotionHumanChain.extend and AutoMovieMotionHumanPerformance.laws. The bow moves to a raised
   * ready pose, lowers to contact, slides frog-to-tip or tip-to-frog during the
   * stroke and leaves the string after lift, still in the hand.
   *
   * The straight hair line is perpendicular to the selected string, following
   * the straight-stroke condition in Schoonderwaldt (2010, DOI
   * 10.3813/AAA.918314). The sounding point is one tenth of the bar's length
   * from the bridge, as in the range for a sustained note in Schoonderwaldt
   * (2009, DOI 10.1121/1.3203209, Fig. 1). The provisional stroke travels over
   * 18–42% of the playable hair. Inclination clears the other strings on the
   * simplified coplanar instrument. The performer moves the right arm and holds
   * the same grip throughout. The violin is staged as a fixed prop. This
   * geometry models contact only, with hair deflection and note acoustics
   * outside the law.
   */
  export const bowViolin: typeof bowViolinLaw = bowViolinLaw;

  /**
   * A left index stops one string while the right index crosses it on a
   * stationary guitar. The left stops at the chosen fret bar's crossing with
   * the string. The right crosses that same string at the soundboard centre's
   * projection, on the bridge side of the stop. The right fingertip crosses
   * during one continuous sweep and lifts clear as the left continues holding.
   *
   * ElKoura and Singh (2003),
   * [Handrix](https://www.dgp.toronto.edu/~gelkoura/handrix/paper.html),
   * motivate the fretting-hand contact. Pérez-Carrillo (2019), [Finger-String
   * Interaction Analysis in Guitar Playing With Optical Motion
   * Capture](https://doi.org/10.3389/fcomp.2019.00008), observes approach,
   * transverse contact and clearance in the right hand. The sweep and
   * clearances here are staging choices from the string spacing and hand size.
   * The action depicts contacts on rigid bars for a staged shot. The author
   * places and supports the guitar and sets the three contact times. Both hands
   * must be free and within reach of the guitar.
   */
  export const guitarNote: typeof guitarNoteLaw = guitarNoteLaw;

  /**
   * Keep the left index and middle fingertips on two stopped strings while the
   * right index sweeps them on one continuous path over the soundboard. A
   * downstroke goes from the lower pitch to the higher pitch, as taught by
   * [Fender](https://www.fender.com/articles/techniques/how-to-strum-beginner-guitar-tips).
   * The [RITMO fourMs
   * archive](https://www.uio.no/ritmo/english/research/labs/fourms/research/Datasets/)
   * includes a synchronized jazz guitar pilot recording. The fixed voicing,
   * authored times and narrow travel of this draft are staging choices.
   *
   * Both hands must be free and the guitar must have a fixed frame. The two arm
   * wrist paths are refused outside their geometric reach bands. The fretting
   * span must also fit within the two digit chains and their knuckle spacing.
   * The first pitched contact is decisive. Each crossing event names the actual
   * string in either direction.
   */
  export const guitarChord: typeof guitarChordLaw = guitarChordLaw;

  /**
   * Play named keys on a fixed upright piano from a seated base. The authored
   * score fixes each digit, hand, depression and release. The moving key and
   * its fingertip share the same travel fraction, so a note can be held while
   * the other hand plays. Co-timed keys on a hand form one voicing on a shared
   * wrist, with each fingertip fitted to its own key. The law refuses a voicing
   * that misses any fitted boundary by more than 5 mm, a provisional contact
   * margin for the polygon rig. Zhu et al. describe a shared wrist and
   * per-finger inverse kinematics (doi:10.1002/cav.1477). Huang et al.
   * distinguish note and chord timing in MOSA
   * (doi:10.1109/TASLP.2024.3407529).
   */
  export const pianoScore: typeof pianoScoreLaw = pianoScoreLaw;

  /**
   * Stage the right forefoot on an upright piano's damper pedal, depress and
   * release it on its own clock, and return to the original floor plant. Hannah
   * Creviston describes keeping the heel grounded and playing the damper with
   * the ball of the foot in Yamaha's piano pedaling guide
   * (https://hub.yamaha.com/music-educators/instruments/piano/piano-pedagogy-pedaling/).
   * MIDI Control Change 64 provides separate damper timing from note events.
   * See https://midi.org/midi-1-0-control-change-messages.
   */
  export const pianoPedal: typeof pianoPedalLaw = pianoPedalLaw;

  /**
   * Play a keyboard score while the right foot works the damper pedal. Both
   * parts start on the same seated pose. The pedal owns the right leg and its
   * contact schedule, while the score writes the hands. Keys and pedal retain
   * their authored timing even when one part is shorter.
   */
  export const pianoPerformance: typeof pianoPerformanceLaw =
    pianoPerformanceLaw;

  /**
   * One scenic downstroke and rebound on a stationary batter head. This opt-in
   * row uses the held working-point arc of `useTool`. The up position after the
   * hit follows the rebound stroke taught in Vic Firth Drumset Lessons 1–2
   * (https://ae.vicfirth.com/wp-content/uploads/FA-Drumset-Lessons-1-2.pdf).
   * Register the row with `AutoMovieMotionHumanPerformance` and align `contact1` to a cue
   * using the chain's `sync`. The stroke uses the existing provisional tool
   * cycle and keeps the stick held.
   */
  export const sideDrumStrike: typeof sideDrumStrikeLaw = sideDrumStrikeLaw;

  /**
   * Strike the near edge of a mounted cymbal with the held stick's working
   * point, then lift the stick from the surface. The RITMO cymbal recordings
   * document struck cymbals and damping as distinct playing conditions
   * (https://zenodo.org/records/21360429). This scenic action uses the existing
   * single-cycle held-tool arc and its provisional timing. Register it with
   * `AutoMovieMotionHumanPerformance` and align `contact1` with the chain's `sync`. Stage the
   * named edge within reach in front of the performer.
   */
  export const cymbalStrike: typeof cymbalStrikeLaw = cymbalStrikeLaw;
}
