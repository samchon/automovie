import { IAutoMovieEnvironmentContext } from "../analysis/IAutoMovieEnvironmentContext";
import { IAutoMovieDeliveryCrop } from "../cinematics/IAutoMovieDeliveryCrop";
import { IAutoMovieRenderBudget } from "../render/IAutoMovieRenderBudget";
import { IAutoMovieProductionLighting } from "../scene/IAutoMovieProductionLighting";
import type { IAutoMovieAcousticResponseProfile } from "./IAutoMovieAcousticResponseProfile";
import { IAutoMovieCaptionReadabilityProfile } from "./IAutoMovieCaptionReadabilityProfile";
import type { IAutoMovieExternalMotionAdoption } from "./IAutoMovieExternalMotionAdoption";
import { IAutoMovieProductionDeliverable } from "./IAutoMovieProductionDeliverable";
import { IAutoMovieProductionFrameRate } from "./IAutoMovieProductionFrameRate";
import { IAutoMovieProductionMixedVisualDeliveryPolicy } from "./IAutoMovieProductionMixedVisualDeliveryPolicy";
import type { IAutoMovieProductionTtsReceipt } from "./IAutoMovieProductionTtsReceipt";
import { IAutoMovieProductionVisualDeliveryLane } from "./IAutoMovieProductionVisualDeliveryLane";
import type { IAutoMovieSoundPropagationProfile } from "./IAutoMovieSoundPropagationProfile";
import { IAutoMovieStoryClock } from "./IAutoMovieStoryClock";
import type { IAutoMovieRepaintExecutionPolicy } from "./capture/IAutoMovieRepaintExecutionPolicy";
import type { IAutoMovieRepaintGeneratorAdoption } from "./capture/IAutoMovieRepaintGeneratorAdoption";
import type { IAutoMovieRepaintParameters } from "./capture/IAutoMovieRepaintParameters";
import type { IAutoMovieRepaintReferenceInput } from "./capture/IAutoMovieRepaintReferenceInput";
import type { IAutoMovieRepaintRequestEvidence } from "./capture/IAutoMovieRepaintRequestEvidence";

/**
 * Authored frame, story, appearance, sound and delivery decisions shared by engine and render callers.
 *
 * @evidence contracts/common.md#principled-implementation Render planning reads identity, runtime, frame format and deliverables, verifies their agreement with the supplied film timeline, and projects explicit caller-selected tiers. Engine runtime contracts also reuse the frame-format shape. This pure type performs no acquisition or whole-design admission; the retired production builder no longer supplies automatic lighting, motion-adoption, caption or delivery validation.
 * @evidence contracts/common.md#clear-and-simple-design Related optional sound, repaint, tier and simulation decisions stay grouped with the global frame and art contract; their implementations and per-shot performance remain in the responsible engine and host packages.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This record chooses no provider, asset or physical threshold on the author's behalf. Explicit-argument budget/live-soft helpers and host-supplied repaint options are distinct from automatic consumption of similarly shaped design fields; documented absent wiring is not a passed execution gate.
 * @evidence contracts/common.md#meaningful-documentation Defines production identity, shared units and limits, optional-state effects, policy ownership, explicit adoptions and the separation between deterministic technical truth and rendition delivery.
 */
export interface IAutoMovieProductionDesign {
  /** Non-blank stable production id; film-level acceptance targets use it. */
  id: string;

  /** Non-blank human-facing title. */
  title: string;

  /** Non-blank narrative promise supplied by the author; no sentence-count or meaning parser. */
  logline: string;

  /**
   * Finite intended finished runtime in seconds, strictly above zero and on the production frame clock.
   */
  targetRuntimeSeconds: number;

  /**
   * Legacy all-one-lane shorthand or an explicit mixed film delivery.
   *
   * Deterministic delivery uses engine/render output directly. Repainted delivery expresses an intended appearance lane over that technical truth; this field has no surviving automatic receipt-bound delivery gate.
   */
  visualDelivery: "deterministic" | "repainted" | "mixed";

  /** Ordered explicit occurrence lanes, required exactly for mixed delivery. */
  visualDeliveryLanes?: IAutoMovieProductionVisualDeliveryLane[];

  /** Versioned crossing policy, required exactly when explicit lanes cross. */
  mixedVisualDeliveryPolicy?: IAutoMovieProductionMixedVisualDeliveryPolicy;

  /**
   * Story clock every pinned shot and cross-shot criterion is measured on.
   *
   * Omitted means the author asserts no shared story time. Explicit engine story validators own pin and cross-shot checks; the field does not invoke them.
   */
  storyClock?: IAutoMovieStoryClock;

  /**
   * The production's own light sources and their motion on the story clock.
   *
   * Where {@link storyClock} says when a shot happens, this says what the light is doing then. A shot's `lightMotions` is the right unit for a light that belongs to the moment and the wrong unit for one that belongs to the production: stated per shot, every shot restages the same source and nothing relates the light in the first shot to the light in the last. A production that runs across a stretch of story could not say that its light travelled over that stretch, whatever the subject.
   *
   * This field has no surviving assembly reader after production package retirement. Engine lighting samplers require explicit inputs, and shot-local lightMotions own continued change within a shot.
   */
  lighting?: IAutoMovieProductionLighting;

  /**
   * Render cost limits this production holds its own artifacts to, by tier.
   *
   * The engine ships no preset tiers. A budget declares what this production is willing to draw; explicit evaluation reports omitted limits as unbudgeted instead of choosing thresholds for the author.
   *
   * Each entry names an intended tier, such as review or delivery. Explicit-argument Render preflight helpers can select and evaluate such a budget, but the current repository has no execution reader connecting this design field to render-job refusal. Presence changes no automatic budget gate; omission retains current caller-selected behavior.
   */
  renderBudgets?: IAutoMovieRenderBudget[];

  /**
   * User-selected external motion adoptions, unique by id and clip.
   *
   * These records preserve the author's intended asset, take, actor, adoption mode and mapping. The production adoption writer is retired; presence performs no conversion or actor mutation, and source-authored motion remains separate.
   */
  externalMotions?: IAutoMovieExternalMotionAdoption[];

  /**
   * Production-owned caption readability profiles, unique by language.
   *
   * Omission provides no implicit thresholds. This field has no surviving automatic caption-measurement reader; retaining a profile does not run an inspection.
   */
  captionReadabilityProfiles?: IAutoMovieCaptionReadabilityProfile[];

  /**
   * Optional production-owned propagation, room-response, and dialogue choices.
   *
   * Explicit Engine sound callers choose propagation and room-response inputs independently of this metadata field. The engine does not choose a physical profile, external provider, adopted asset or room mapping.
   *
   * Dialogue generator and speaker declarations retain authored choices, not independently verified rights or synthesis effects. These design fields and their supplied TTS receipt integration have no surviving automatic production reader; explicit engine sound operations remain separate.
   */
  sound?: {
    /** Selected direct-path propagation model. */
    propagation?: IAutoMovieSoundPropagationProfile;

    /** Selected bounded derived or externally adopted room-response source. */
    acousticResponse?: IAutoMovieAcousticResponseProfile;

    /**
     * The exact dialogue generator this production adopted, if any.
     *
     * Provider, model, revision, inference choices and provenance are authored declarations without credentials. Source, license and terms metadata are optional descriptive claims through the receipt provenance type; they do not establish a rights-review verdict.
     *
     * This repository has no synthesis writer or execution reader for this design field. It does not currently narrow these choices to a provider adapter or produce dialogue when present; omission adds no synthesis declaration.
     */
    dialogueSynthesis?: {
      /** Non-blank generator identity the host runtime must implement. */
      provider: string;

      /** Non-blank exact model repository or local tool identity. */
      model: string;

      /** Non-blank immutable model revision. */
      modelRevision: string;

      /** Non-blank weight quantization the adopted revision was taken at. */
      dtype: string;

      /** Authored non-blank execution-device identity. */
      device: string;

      /** Non-blank voice identity inside that model revision. */
      voice: string;

      /** Finite speaking rate strictly above zero. */
      speed: number;

      /** Authored cost and consumer reason with optional descriptive source, license and terms metadata; no independent rights-review proof. */
      generatorProvenance: IAutoMovieProductionTtsReceipt["generatorProvenance"];
    };

    /**
     * Joins from a screenplay speaker identity to the compiled actor whose mouth performs that line.
     *
     * Speaker and actor identities state the intended explicit join rather than inferring it from cast order or similar names. This design field currently has no execution reader enforcing duplicate, missing-line or absent-actor checks, so its presence is not a wired mouth-motion binding.
     *
     * Omission states no intended join. Supplied receipt lip-sync joins and numerical viseme derivation remain separate contracts; retaining this declaration does not create a synthesis or actor-binding host.
     */
    speakerBindings?: Array<{
      /** Non-blank speaker identity carried by the dialogue line. */
      speaker: string;

      /** Non-blank compiled actor node id that owns the mouth layer. */
      actor: string;
    }>;
  };

  /**
   * Authored proxy and final tier declarations, currently without a reader of this design field.
   *
   * Raster scale and frame stride describe intended review and delivery work. Render's explicit tier arguments use corresponding normalization rules, but current callers do not obtain those arguments from this field.
   *
   * Presence alone changes no render tier in the current repository. Omission retains existing caller-selected tier behavior rather than selecting a pair of defaults through this record.
   */
  renderTiers?: {
    /**
     * Intended review tier with a reduction in at least one axis; explicit Render tier normalization enforces that rule when given this shape, but does not read this design field.
     */
    proxy: {
      /** Stable tier identity used in slots, chunks, and publication paths. */
      kind: "proxy";

      /** Output raster multiplier in `(0, 1]`. */
      resolutionScale: number;

      /** Keep every Nth source frame; an integer from 1 through 16. */
      frameStep: number;
    };

    /** Delivery tier; `resolutionScale` and `frameStep` are exactly one. */
    final: {
      /** Stable tier identity used in slots, chunks, and publication paths. */
      kind: "final";

      /** Output raster multiplier; exactly one at the final tier. */
      resolutionScale: number;

      /** Source frame stride; exactly one at the final tier. */
      frameStep: number;
    };
  };

  /**
   * Authored appearance-generator, execution-policy and shot-request declarations.
   *
   * These fields retain the intended generator, execution boundary, retry and cost policy, prompt, seed, preservation strength and role-specific references. The production repaint service and design-acquisition identity are retired; this metadata installs no execution host or request writer.
   *
   * Candidate selection and sequence observation use separate records. This declaration does not prove a request was reviewed, freeze its object or enforce the intended visualDelivery lane; production delivery admission is retired.
   */
  repaint?: {
    /** Authored runtime adoption and descriptive generator context; source/license/terms metadata does not establish reviewed legal rights. */
    generator: IAutoMovieRepaintGeneratorAdoption;

    /** Bounded attempts, timeouts, cost, backoff, and retryable failures. */
    executionPolicy: IAutoMovieRepaintExecutionPolicy;

    /** Intended authored requests by shot; the current repaint service does not consume this list. */
    requests: Array<{
      /** Authored shot id this request repaints. */
      shot: string;

      /** Prompt, seed, preservation strength, and optional scalar controls. */
      parameters: IAutoMovieRepaintParameters;

      /** At least one manifest-registered role-specific reference. */
      references: IAutoMovieRepaintReferenceInput[];

      /** Stable addresses of the owners this request answers to. */
      evidence: IAutoMovieRepaintRequestEvidence;
    }>;
  };

  /**
   * Authored production-wide order intended for live moving-boundary soft domains.
   *
   * The explicit Engine selector accepts this list as an argument, preserves each authored budget slot, skips selected domains absent from a shot and refuses present static selections or unselected moving domains. No Production/Viewer execution caller currently reads this design field into that selector, and no builder-wide equality gate proves the list matches every compiled shot's moving-domain population.
   *
   * Omission supplies no intended live list and creates no runtime solve. Explicit selector callers must supply their own admitted list; retaining this metadata does not install a live host or enforce an omission refusal during ordinary production compilation.
   */
  simulation?: {
    /** Unique, non-blank, trimmed domain ids in stable budget order. */
    liveWearableSoftBodies: string[];
  };

  /**
   * Read-only site context every environmental analysis is measured against.
   *
   * Sun, sky, reference ground and neighbouring occluder masses are conditions a building is subject to, not parts of it. Declaring them here keeps that direction one-way: an analysis reads the context and the building, and neither the context nor a result it produces can become design.
   *
   * Explicit Engine context validation and analysis callers own identity collisions and analysis invocation. The production review reader is retired, and this field alone adds no shared context check or analysis.
   */
  environmentContext?: IAutoMovieEnvironmentContext;

  /** Deterministic frame clock and raster format. */
  frameFormat: {
    /**
     * Integer pixel width from 16 through 16,384. Width times height may not exceed 16,777,216 pixels, the exact-frame review capture ceiling.
     */
    width: number;

    /**
     * Integer pixel height from 16 through 16,384. Width times height may not exceed 16,777,216 pixels, the exact-frame review capture ceiling.
     */
    height: number;

    /** Finite frames per second, strictly above zero. */
    fps: number;

    /**
     * Exact frame rate when `fps` is fractional. Integer legacy rates use an equivalent denominator of one when this field is omitted.
     */
    frameRate?: IAutoMovieProductionFrameRate;

    /** Output color space. */
    colorSpace: "srgb";

    /**
     * Optional normalized delivery-gate window projected onto the full output raster. Omission and the complete `0,0,1,1` window are geometric no-ops.
     */
    crop?: IAutoMovieDeliveryCrop;
  };

  /** Bounded visual grammar rather than screenplay prose. */
  artDirection: {
    /** Foundation visual style. */
    style: "primitive-3d";

    /** Intended nonempty exact-string-unique palette entries; no surviving whole-design gate checks text or CSS color syntax. */
    palette: string[];

    /** Non-blank rules that keep important silhouettes legible. */
    silhouettePriority: string;

    /** Non-blank rules for conveying scale with primitive geometry. */
    scaleGrammar: string;
  };

  /** At least one output, with every deliverable id unique. */
  deliverables: IAutoMovieProductionDeliverable[];
}
