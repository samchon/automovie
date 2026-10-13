import type { AutoMovieHumanBodySide } from "../identity/AutoMovieHumanBodySide";

/**
 * Named opposing bony surfaces of one anatomical articulation.
 *
 * These references name anatomical relationships, not coordinates a document author positions. They are a conceptual vocabulary, not registered SourceRig node/site addresses: the carpal group, for example, requires correspondence to actual source bones and surfaces that this type does not supply. A single literal Side constrains paired surfaces to that side: a hip names coxal acetabulum/femoral head, a knee femoral/tibial surfaces, and a shoulder scapula/humerus. Supplying the left/right union permits independent side choices; this type does not enforce their correlation in that case. `surfaceA` and `surfaceB` identify the pair without asserting a universal proximal/distal order. The ankle mortise separately names tibia and fibula against talus, with a third surface. A rig transform does not establish cartilage thickness, joint fit or a valid range of motion. The scapulothoracic interface is a sliding contact, typed separately.
 *
 * @evidence contracts/common.md#principled-implementation The joint discriminator couples each surface name to its anatomical structure; a single literal side constrains paired references, while a union side parameter does not prevent mixed-side records.
 * @evidence contracts/common.md#clear-and-simple-design Separate union branches expose hip, knee, ankle and upper-limb relationships; the ankle branch names its third opposing surface explicitly.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Named anatomical surfaces do not supply registered source addresses, document-authored contact coordinates, cartilage thickness or joint fit from a rig transform.
 * @evidence contracts/common.md#meaningful-documentation The prose explains conceptual versus registered source identity, single-side and union-side behavior, contact ordering, three-surface ankle ownership and separately typed scapular sliding contact.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Opposing-surface unions impose compile-time relationships and perform no geometric intersection or range computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A surface-pair type neither schedules articulation evaluations nor shares their derived transforms.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Literal structure and site names introduce no owned mesh buffers, running tasks or lifetime-managed contacts.
 * @author Samchon
 */
export type IAutoMovieHumanBodyArticulation<
  Side extends AutoMovieHumanBodySide,
> =
  | {
      /** Selects the opposing-surface relationship without prescribing its motion model. */
      readonly joint: "sacroiliac";

      /** First named contact member; ordering does not imply a proximal bone. */
      readonly surfaceA: {
        /** Named anatomical structure in this relation vocabulary. */
        readonly structure: "sacrum";

        /** Named contact surface; this declaration supplies no source registration. */
        readonly site: "auricularSurface";
      };

      /** Opposing named contact member, sharing laterality where the pair is lateral. */
      readonly surfaceB: {
        /** Named anatomical structure in this relation vocabulary. */
        readonly structure: `${Side}CoxalBone`;

        /** Named contact surface; this declaration supplies no source registration. */
        readonly site: "auricularSurface";
      };
    }
  | {
      /** Selects the opposing-surface relationship without prescribing its motion model. */
      readonly joint: "hip";

      /** First named contact member; ordering does not imply a proximal bone. */
      readonly surfaceA: {
        /** Named anatomical structure in this relation vocabulary. */
        readonly structure: `${Side}CoxalBone`;

        /** Named contact surface; this declaration supplies no source registration. */
        readonly site: "acetabulum";
      };

      /** Opposing named contact member, sharing laterality where the pair is lateral. */
      readonly surfaceB: {
        /** Named anatomical structure in this relation vocabulary. */
        readonly structure: `${Side}Femur`;

        /** Named contact surface; this declaration supplies no source registration. */
        readonly site: "articularHead";
      };
    }
  | {
      /** Selects the opposing-surface relationship without prescribing its motion model. */
      readonly joint: "tibiofemoral";

      /** First named contact member; ordering does not imply a proximal bone. */
      readonly surfaceA: {
        /** Named anatomical structure in this relation vocabulary. */
        readonly structure: `${Side}Femur`;

        /** Named contact surface; this declaration supplies no source registration. */
        readonly site: "distalCondyles";
      };

      /** Opposing named contact member, sharing laterality where the pair is lateral. */
      readonly surfaceB: {
        /** Named anatomical structure in this relation vocabulary. */
        readonly structure: `${Side}Tibia`;

        /** Named contact surface; this declaration supplies no source registration. */
        readonly site: "tibialPlateau";
      };
    }
  | {
      /** Selects the opposing-surface relationship without prescribing its motion model. */
      readonly joint: "patellofemoral";

      /** First named contact member; ordering does not imply a proximal bone. */
      readonly surfaceA: {
        /** Named anatomical structure in this relation vocabulary. */
        readonly structure: `${Side}Femur`;

        /** Named contact surface; this declaration supplies no source registration. */
        readonly site: "patellarGroove";
      };

      /** Opposing named contact member, sharing laterality where the pair is lateral. */
      readonly surfaceB: {
        /** Named anatomical structure in this relation vocabulary. */
        readonly structure: `${Side}Patella`;

        /** Named contact surface; this declaration supplies no source registration. */
        readonly site: "posteriorArticularSurface";
      };
    }
  | {
      /** Selects the opposing-surface relationship without prescribing its motion model. */
      readonly joint: "talocrural";

      /** First named contact member; ordering does not imply a proximal bone. */
      readonly surfaceA: {
        /** Named anatomical structure in this relation vocabulary. */
        readonly structure: `${Side}Tibia`;

        /** Named contact surface; this declaration supplies no source registration. */
        readonly site: "distalPlafondAndMedialMalleolus";
      };

      /** Opposing named contact member, sharing laterality where the pair is lateral. */
      readonly surfaceB: {
        /** Named anatomical structure in this relation vocabulary. */
        readonly structure: `${Side}Fibula`;

        /** Named contact surface; this declaration supplies no source registration. */
        readonly site: "lateralMalleolus";
      };

      /** Third ankle member completing the mortise against the talar surface. */
      readonly surfaceC: {
        /** Named anatomical structure in this relation vocabulary. */
        readonly structure: `${Side}Talus`;

        /** Named contact surface; this declaration supplies no source registration. */
        readonly site: "trochlea";
      };
    }
  | {
      /** Selects the opposing-surface relationship without prescribing its motion model. */
      readonly joint: "subtalar";

      /** First named contact member; ordering does not imply a proximal bone. */
      readonly surfaceA: {
        /** Named anatomical structure in this relation vocabulary. */
        readonly structure: `${Side}Talus`;

        /** Named contact surface; this declaration supplies no source registration. */
        readonly site: "inferiorFacet";
      };

      /** Opposing named contact member, sharing laterality where the pair is lateral. */
      readonly surfaceB: {
        /** Named anatomical structure in this relation vocabulary. */
        readonly structure: `${Side}Calcaneus`;

        /** Named contact surface; this declaration supplies no source registration. */
        readonly site: "superiorFacet";
      };
    }
  | {
      /** Selects the opposing-surface relationship without prescribing its motion model. */
      readonly joint: "sternoclavicular";

      /** First named contact member; ordering does not imply a proximal bone. */
      readonly surfaceA: {
        /** Named anatomical structure in this relation vocabulary. */
        readonly structure: "sternum";

        /** Named contact surface; this declaration supplies no source registration. */
        readonly site: "clavicularNotch";
      };

      /** Opposing named contact member, sharing laterality where the pair is lateral. */
      readonly surfaceB: {
        /** Named anatomical structure in this relation vocabulary. */
        readonly structure: `${Side}Clavicle`;

        /** Named contact surface; this declaration supplies no source registration. */
        readonly site: "sternalEnd";
      };
    }
  | {
      /** Selects the opposing-surface relationship without prescribing its motion model. */
      readonly joint: "acromioclavicular";

      /** First named contact member; ordering does not imply a proximal bone. */
      readonly surfaceA: {
        /** Named anatomical structure in this relation vocabulary. */
        readonly structure: `${Side}Scapula`;

        /** Named contact surface; this declaration supplies no source registration. */
        readonly site: "acromion";
      };

      /** Opposing named contact member, sharing laterality where the pair is lateral. */
      readonly surfaceB: {
        /** Named anatomical structure in this relation vocabulary. */
        readonly structure: `${Side}Clavicle`;

        /** Named contact surface; this declaration supplies no source registration. */
        readonly site: "acromialEnd";
      };
    }
  | {
      /** Selects the opposing-surface relationship without prescribing its motion model. */
      readonly joint: "glenohumeral";

      /** First named contact member; ordering does not imply a proximal bone. */
      readonly surfaceA: {
        /** Named anatomical structure in this relation vocabulary. */
        readonly structure: `${Side}Scapula`;

        /** Named contact surface; this declaration supplies no source registration. */
        readonly site: "glenoid";
      };

      /** Opposing named contact member, sharing laterality where the pair is lateral. */
      readonly surfaceB: {
        /** Named anatomical structure in this relation vocabulary. */
        readonly structure: `${Side}Humerus`;

        /** Named contact surface; this declaration supplies no source registration. */
        readonly site: "articularHead";
      };
    }
  | {
      /** Selects the opposing-surface relationship without prescribing its motion model. */
      readonly joint: "humeroulnar";

      /** First named contact member; ordering does not imply a proximal bone. */
      readonly surfaceA: {
        /** Named anatomical structure in this relation vocabulary. */
        readonly structure: `${Side}Humerus`;

        /** Named contact surface; this declaration supplies no source registration. */
        readonly site: "trochlea";
      };

      /** Opposing named contact member, sharing laterality where the pair is lateral. */
      readonly surfaceB: {
        /** Named anatomical structure in this relation vocabulary. */
        readonly structure: `${Side}Ulna`;

        /** Named contact surface; this declaration supplies no source registration. */
        readonly site: "trochlearNotch";
      };
    }
  | {
      /** Selects the opposing-surface relationship without prescribing its motion model. */
      readonly joint: "humeroradial";

      /** First named contact member; ordering does not imply a proximal bone. */
      readonly surfaceA: {
        /** Named anatomical structure in this relation vocabulary. */
        readonly structure: `${Side}Humerus`;

        /** Named contact surface; this declaration supplies no source registration. */
        readonly site: "capitulum";
      };

      /** Opposing named contact member, sharing laterality where the pair is lateral. */
      readonly surfaceB: {
        /** Named anatomical structure in this relation vocabulary. */
        readonly structure: `${Side}Radius`;

        /** Named contact surface; this declaration supplies no source registration. */
        readonly site: "radialHead";
      };
    }
  | {
      /** Selects the opposing-surface relationship without prescribing its motion model. */
      readonly joint: "distalRadioulnar";

      /** First named contact member; ordering does not imply a proximal bone. */
      readonly surfaceA: {
        /** Named anatomical structure in this relation vocabulary. */
        readonly structure: `${Side}Radius`;

        /** Named contact surface; this declaration supplies no source registration. */
        readonly site: "ulnarNotch";
      };

      /** Opposing named contact member, sharing laterality where the pair is lateral. */
      readonly surfaceB: {
        /** Named anatomical structure in this relation vocabulary. */
        readonly structure: `${Side}Ulna`;

        /** Named contact surface; this declaration supplies no source registration. */
        readonly site: "ulnarHead";
      };
    }
  | {
      /** Selects the opposing-surface relationship without prescribing its motion model. */
      readonly joint: "radiocarpal";

      /** First named contact member; ordering does not imply a proximal bone. */
      readonly surfaceA: {
        /** Named anatomical structure in this relation vocabulary. */
        readonly structure: `${Side}Radius`;

        /** Named contact surface; this declaration supplies no source registration. */
        readonly site: "distalArticularSurface";
      };

      /** Opposing named contact member, sharing laterality where the pair is lateral. */
      readonly surfaceB: {
        /** Named anatomical structure in this relation vocabulary. */
        readonly structure: `${Side}Carpus`;

        /** Named contact surface; this declaration supplies no source registration. */
        readonly site: "proximalRow";
      };
    };
