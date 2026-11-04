import type { IAutoMovieHumanBindingRegion } from "./IAutoMovieHumanBindingRegion";
import { AutoMovieHumanGirdleBinding } from "./AutoMovieHumanGirdleBinding";
import { AutoMovieHumanHeadBinding } from "./AutoMovieHumanHeadBinding";
import { AutoMovieHumanHipBinding } from "./AutoMovieHumanHipBinding";
import { AutoMovieHumanJawBinding } from "./AutoMovieHumanJawBinding";
import { AutoMovieHumanKnuckleBinding } from "./AutoMovieHumanKnuckleBinding";
import { AutoMovieHumanShoulderBinding } from "./AutoMovieHumanShoulderBinding";
import { AutoMovieHumanThoracicBinding } from "./AutoMovieHumanThoracicBinding";
import { AutoMovieHumanThumbCmcBinding } from "./AutoMovieHumanThumbCmcBinding";

/**
 * Every region of the binding that owns a bone, top to bottom. A bone no
 * region names (the pelvis, the root) has no cut and takes the hinge's
 * capsule. The regions that own no bone of their own are pieces of these:
 * the deltoid of the shoulder, the groin and the crotch of the hip, the lips
 * of the jaw, the axilla of the arm against the trunk.
 *
 * A region with a rule of its own (its capsule, cut, end or attachment) has its
 * own file; a plain hinge, which takes every member from
 * `AutoMovieHumanHingeBinding`, is only its name and bones and stands in this
 * table with its anatomy:
 *
 * - lumbar: the cut between the pelvis and the lower trunk. The lumbar spine is
 *   a hinge about the lumbar column, whose joint centre stands on a section
 *   centroid of the trunk rather than a vertebral body; its skin turns with the
 *   loin between the iliac crests and the lower ribs, and the plane's sectors
 *   read the trunk's own widest skin, so the flanks turn on a longer ramp than
 *   the back and belly.
 * - cervical: the cut between the chest and the neck. The neck's skin is read a
 *   third of the way up (the girth radius), since lower it flares into the
 *   shoulders and higher it meets the jaw. Its segment ends at the head's joint,
 *   not a child of its own: the atlas folds into the neck bone, so the neck's
 *   capsule reaches to the skull's base.
 * - elbow: the hinge between the humerus and the forearm, turning from 0 to 147
 *   degrees about the trochlea, folding the brachialis and biceps in front (the
 *   cubital fossa) and stretching the skin over the olecranon behind; the ramp's
 *   sectors read the opening side behind and the closing side in front apart.
 * - wrist: the radiocarpal hinge, its centre at the hand's section centre at the
 *   crease; it flexes and extends through 150 degrees and deviates sideways,
 *   and the forearm's twist reaches it by a share, so its ramp carries both.
 * - thumbMcp: the hinge between the thumb's metacarpal and its proximal phalanx
 *   at the thumb's crease, where the thumb's chain starts round; it flexes
 *   through 50 degrees.
 * - thumbIp: the one hinge between the thumb's phalanges, halfway from its
 *   crease to its tip (convention); it flexes through 80 degrees.
 * - fingerPip: the hinge between a finger's proximal and middle phalanges,
 *   flexing through 90 degrees; the four fingers share the rule and differ by
 *   their joint centre and girth, 2:1:1 phalanx split (convention, Bridgman 1920).
 * - fingerDip: the hinge between a finger's middle and distal phalanges, flexing
 *   through 65 degrees.
 * - knee: the hinge between the femur and the tibia, flexing through 140
 *   degrees about the condyles, stretching the skin over the patella and
 *   folding the popliteal skin; the joint line lies above the patella's apex in
 *   extension (Gray 1918).
 * - ankle: the talocrural hinge, the subtalar and midfoot joints folded into the
 *   foot's bone. The foot leaves its parent sideways, so the cut keeps the
 *   shank's plane (`AutoMovieHumanHingeBinding.normal`): the foot's own
 *   direction would cut the heel off along its length.
 * - toe: the metatarsophalangeal hinges and the toes' own joints. The rig
 *   carries every toe on one bone, so the toes are one channel: a toe's joint
 *   cuts nothing from the toe before it, and the limb tree holds them only for
 *   their shape, kept out of the trunk's capsules an arm is told from.
 *
 * @evidence contracts/common.md#meaningful-documentation States what the list holds and what it leaves out, and each plain region's anatomy.
 */
export const AutoMovieHumanBindingRegions: readonly IAutoMovieHumanBindingRegion[] =
  [
    { name: "lumbar", bones: /^spine$/ },
    AutoMovieHumanThoracicBinding.region,
    {
      name: "cervical",
      bones: /^neck$/,
      end: (input: IAutoMovieHumanBindingRegion.IEndInput) => input.at("head"),
    },
    AutoMovieHumanHeadBinding.region,
    AutoMovieHumanJawBinding.region,
    AutoMovieHumanGirdleBinding.region,
    AutoMovieHumanShoulderBinding.region,
    { name: "elbow", bones: /LowerArm$/ },
    { name: "wrist", bones: /Hand$/ },
    AutoMovieHumanThumbCmcBinding.region,
    { name: "thumbMcp", bones: /ThumbProximal$/ },
    { name: "thumbIp", bones: /ThumbDistal$/ },
    AutoMovieHumanKnuckleBinding.region,
    { name: "fingerPip", bones: /(Index|Middle|Ring|Little)Intermediate$/ },
    { name: "fingerDip", bones: /(Index|Middle|Ring|Little)Distal$/ },
    AutoMovieHumanHipBinding.region,
    { name: "knee", bones: /LowerLeg$/ },
    { name: "ankle", bones: /Foot$/ },
    { name: "toe", bones: /Hallux|Toe\d/ },
  ];
