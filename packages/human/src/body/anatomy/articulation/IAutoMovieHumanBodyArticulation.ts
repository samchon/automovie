import type { AutoMovieHumanBodySide } from "../identity/AutoMovieHumanBodySide";

/**
 * Named opposing bony surfaces of one anatomical articulation.
 *
 * These references are generated relationships, not coordinates a document author positions. Side is shared by both surfaces; a hip refers to the coxal acetabulum and the same-side femoral head, a knee to the femoral and tibial surfaces, and a shoulder to scapula/humerus. `surfaceA` and `surfaceB` identify the pair without asserting a universal proximal/distal order for midline and shoulder joints. The ankle mortise separately names tibia and fibula against talus, with a third surface. A rig transform does not establish cartilage thickness, joint fit or a valid range of motion. The scapulothoracic interface is a sliding contact, typed separately.
 *
 * @evidence contracts/common.md#principled-implementation The joint discriminator couples each anatomical surface name to its opposing structure, with one side parameter preventing mixed left and right limb pairs.
 * @evidence contracts/common.md#clear-and-simple-design Separate union branches expose hip, knee, ankle and upper-limb relationships; the ankle branch names its third opposing surface explicitly.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Named bone surfaces replace document-authored contact coordinates and do not claim cartilage thickness or joint fit from a rig transform.
 * @evidence contracts/common.md#meaningful-documentation The prose explains shared laterality, non-universal proximal ordering, three-surface ankle ownership and the separately typed scapular sliding contact. Inline members identify relationship selection, contact ordering and source-owned bone/surface addresses.
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
        /** Bone identity in the common anatomical source graph. */
        readonly structure: "sacrum";

        /** Source-owned contact surface address on this bone. */
        readonly site: "auricularSurface";
      };

      /** Opposing named contact member, sharing laterality where the pair is lateral. */
      readonly surfaceB: {
        /** Bone identity in the common anatomical source graph. */
        readonly structure: `${Side}CoxalBone`;

        /** Source-owned contact surface address on this bone. */
        readonly site: "auricularSurface";
      };
    }
  | {
      /** Selects the opposing-surface relationship without prescribing its motion model. */
      readonly joint: "hip";

      /** First named contact member; ordering does not imply a proximal bone. */
      readonly surfaceA: {
        /** Bone identity in the common anatomical source graph. */
        readonly structure: `${Side}CoxalBone`;

        /** Source-owned contact surface address on this bone. */
        readonly site: "acetabulum";
      };

      /** Opposing named contact member, sharing laterality where the pair is lateral. */
      readonly surfaceB: {
        /** Bone identity in the common anatomical source graph. */
        readonly structure: `${Side}Femur`;

        /** Source-owned contact surface address on this bone. */
        readonly site: "articularHead";
      };
    }
  | {
      /** Selects the opposing-surface relationship without prescribing its motion model. */
      readonly joint: "tibiofemoral";

      /** First named contact member; ordering does not imply a proximal bone. */
      readonly surfaceA: {
        /** Bone identity in the common anatomical source graph. */
        readonly structure: `${Side}Femur`;

        /** Source-owned contact surface address on this bone. */
        readonly site: "distalCondyles";
      };

      /** Opposing named contact member, sharing laterality where the pair is lateral. */
      readonly surfaceB: {
        /** Bone identity in the common anatomical source graph. */
        readonly structure: `${Side}Tibia`;

        /** Source-owned contact surface address on this bone. */
        readonly site: "tibialPlateau";
      };
    }
  | {
      /** Selects the opposing-surface relationship without prescribing its motion model. */
      readonly joint: "patellofemoral";

      /** First named contact member; ordering does not imply a proximal bone. */
      readonly surfaceA: {
        /** Bone identity in the common anatomical source graph. */
        readonly structure: `${Side}Femur`;

        /** Source-owned contact surface address on this bone. */
        readonly site: "patellarGroove";
      };

      /** Opposing named contact member, sharing laterality where the pair is lateral. */
      readonly surfaceB: {
        /** Bone identity in the common anatomical source graph. */
        readonly structure: `${Side}Patella`;

        /** Source-owned contact surface address on this bone. */
        readonly site: "posteriorArticularSurface";
      };
    }
  | {
      /** Selects the opposing-surface relationship without prescribing its motion model. */
      readonly joint: "talocrural";

      /** First named contact member; ordering does not imply a proximal bone. */
      readonly surfaceA: {
        /** Bone identity in the common anatomical source graph. */
        readonly structure: `${Side}Tibia`;

        /** Source-owned contact surface address on this bone. */
        readonly site: "distalPlafondAndMedialMalleolus";
      };

      /** Opposing named contact member, sharing laterality where the pair is lateral. */
      readonly surfaceB: {
        /** Bone identity in the common anatomical source graph. */
        readonly structure: `${Side}Fibula`;

        /** Source-owned contact surface address on this bone. */
        readonly site: "lateralMalleolus";
      };

      /** Third ankle member completing the mortise against the talar surface. */
      readonly surfaceC: {
        /** Bone identity in the common anatomical source graph. */
        readonly structure: `${Side}Talus`;

        /** Source-owned contact surface address on this bone. */
        readonly site: "trochlea";
      };
    }
  | {
      /** Selects the opposing-surface relationship without prescribing its motion model. */
      readonly joint: "subtalar";

      /** First named contact member; ordering does not imply a proximal bone. */
      readonly surfaceA: {
        /** Bone identity in the common anatomical source graph. */
        readonly structure: `${Side}Talus`;

        /** Source-owned contact surface address on this bone. */
        readonly site: "inferiorFacet";
      };

      /** Opposing named contact member, sharing laterality where the pair is lateral. */
      readonly surfaceB: {
        /** Bone identity in the common anatomical source graph. */
        readonly structure: `${Side}Calcaneus`;

        /** Source-owned contact surface address on this bone. */
        readonly site: "superiorFacet";
      };
    }
  | {
      /** Selects the opposing-surface relationship without prescribing its motion model. */
      readonly joint: "sternoclavicular";

      /** First named contact member; ordering does not imply a proximal bone. */
      readonly surfaceA: {
        /** Bone identity in the common anatomical source graph. */
        readonly structure: "sternum";

        /** Source-owned contact surface address on this bone. */
        readonly site: "clavicularNotch";
      };

      /** Opposing named contact member, sharing laterality where the pair is lateral. */
      readonly surfaceB: {
        /** Bone identity in the common anatomical source graph. */
        readonly structure: `${Side}Clavicle`;

        /** Source-owned contact surface address on this bone. */
        readonly site: "sternalEnd";
      };
    }
  | {
      /** Selects the opposing-surface relationship without prescribing its motion model. */
      readonly joint: "acromioclavicular";

      /** First named contact member; ordering does not imply a proximal bone. */
      readonly surfaceA: {
        /** Bone identity in the common anatomical source graph. */
        readonly structure: `${Side}Scapula`;

        /** Source-owned contact surface address on this bone. */
        readonly site: "acromion";
      };

      /** Opposing named contact member, sharing laterality where the pair is lateral. */
      readonly surfaceB: {
        /** Bone identity in the common anatomical source graph. */
        readonly structure: `${Side}Clavicle`;

        /** Source-owned contact surface address on this bone. */
        readonly site: "acromialEnd";
      };
    }
  | {
      /** Selects the opposing-surface relationship without prescribing its motion model. */
      readonly joint: "glenohumeral";

      /** First named contact member; ordering does not imply a proximal bone. */
      readonly surfaceA: {
        /** Bone identity in the common anatomical source graph. */
        readonly structure: `${Side}Scapula`;

        /** Source-owned contact surface address on this bone. */
        readonly site: "glenoid";
      };

      /** Opposing named contact member, sharing laterality where the pair is lateral. */
      readonly surfaceB: {
        /** Bone identity in the common anatomical source graph. */
        readonly structure: `${Side}Humerus`;

        /** Source-owned contact surface address on this bone. */
        readonly site: "articularHead";
      };
    }
  | {
      /** Selects the opposing-surface relationship without prescribing its motion model. */
      readonly joint: "humeroulnar";

      /** First named contact member; ordering does not imply a proximal bone. */
      readonly surfaceA: {
        /** Bone identity in the common anatomical source graph. */
        readonly structure: `${Side}Humerus`;

        /** Source-owned contact surface address on this bone. */
        readonly site: "trochlea";
      };

      /** Opposing named contact member, sharing laterality where the pair is lateral. */
      readonly surfaceB: {
        /** Bone identity in the common anatomical source graph. */
        readonly structure: `${Side}Ulna`;

        /** Source-owned contact surface address on this bone. */
        readonly site: "trochlearNotch";
      };
    }
  | {
      /** Selects the opposing-surface relationship without prescribing its motion model. */
      readonly joint: "humeroradial";

      /** First named contact member; ordering does not imply a proximal bone. */
      readonly surfaceA: {
        /** Bone identity in the common anatomical source graph. */
        readonly structure: `${Side}Humerus`;

        /** Source-owned contact surface address on this bone. */
        readonly site: "capitulum";
      };

      /** Opposing named contact member, sharing laterality where the pair is lateral. */
      readonly surfaceB: {
        /** Bone identity in the common anatomical source graph. */
        readonly structure: `${Side}Radius`;

        /** Source-owned contact surface address on this bone. */
        readonly site: "radialHead";
      };
    }
  | {
      /** Selects the opposing-surface relationship without prescribing its motion model. */
      readonly joint: "distalRadioulnar";

      /** First named contact member; ordering does not imply a proximal bone. */
      readonly surfaceA: {
        /** Bone identity in the common anatomical source graph. */
        readonly structure: `${Side}Radius`;

        /** Source-owned contact surface address on this bone. */
        readonly site: "ulnarNotch";
      };

      /** Opposing named contact member, sharing laterality where the pair is lateral. */
      readonly surfaceB: {
        /** Bone identity in the common anatomical source graph. */
        readonly structure: `${Side}Ulna`;

        /** Source-owned contact surface address on this bone. */
        readonly site: "ulnarHead";
      };
    }
  | {
      /** Selects the opposing-surface relationship without prescribing its motion model. */
      readonly joint: "radiocarpal";

      /** First named contact member; ordering does not imply a proximal bone. */
      readonly surfaceA: {
        /** Bone identity in the common anatomical source graph. */
        readonly structure: `${Side}Radius`;

        /** Source-owned contact surface address on this bone. */
        readonly site: "distalArticularSurface";
      };

      /** Opposing named contact member, sharing laterality where the pair is lateral. */
      readonly surfaceB: {
        /** Bone identity in the common anatomical source graph. */
        readonly structure: `${Side}Carpus`;

        /** Source-owned contact surface address on this bone. */
        readonly site: "proximalRow";
      };
    };
