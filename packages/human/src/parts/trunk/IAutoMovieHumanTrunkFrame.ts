import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The trunk's anatomical frame for one side of one person: the skeleton points and levels its surface is placed through, and the measured sizes of its sections.
 *
 * Points of the right side are mirrored into the left side's frame (x negated), so one placement serves both sides and writes its result back with the side's sign. Positions are millimetres in the model frame of the skeleton: +Y up, +Z to the front, +X to the person's left.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanTrunkFrame {
  /** Stature, the scale of every conventional offset. */
  stature: number;

  /** Hip joint centre. */
  hip: IAutoMovieVector3;

  /** Shoulder (glenohumeral) joint centre. */
  shoulder: IAutoMovieVector3;

  /** Acromion, the point of the shoulder. */
  acromion: IAutoMovieVector3;

  /** Sternoclavicular joint, where the clavicle starts. */
  clavicale: IAutoMovieVector3;

  /** Anterior superior iliac spine. */
  iliospinale: IAutoMovieVector3;

  /** Highest point of the iliac crest. */
  iliocristale: IAutoMovieVector3;

  /** Top of the greater trochanter. */
  trochanterion: IAutoMovieVector3;

  /** Jugular notch, on the midline. */
  suprasternale: IAutoMovieVector3;

  /** Seventh cervical spinous process, on the midline. */
  cervicale: IAutoMovieVector3;

  /** Levels of the trunk's stations, millimetres above the standing surface. */
  levels: IAutoMovieHumanTrunkFrame.ILevels;

  /**
   * Front-back position of the vertebral column at a height, millimetres: the line of vertebral body centres through the spine, chest, upper chest and neck joints.
   */
  column: (y: number) => number;

  /** Chest circumference, breadth (compressed) and depth at the chest point. */
  chest: IAutoMovieHumanTrunkFrame.ISection;

  /** Underbust circumference. */
  underbust: number;

  /** Natural waist circumference, breadth and depth. */
  waist: IAutoMovieHumanTrunkFrame.ISection;

  /** Buttock circumference, hip breadth and buttock depth. */
  buttock: IAutoMovieHumanTrunkFrame.ISection;

  /** Thigh circumference at the gluteal furrow. */
  thighGirth: number;

  /** Relaxed upper arm circumference at the mid upper arm cut. */
  armGirth: number;

  /** Acromion-radiale length. */
  upperArmLength: number;

  /** Whole-body fat percentage. */
  fat: number;

  /**
   * Muscularity: appendicular lean mass index above a lean floor, 0 for an untrained child-like build, about 0.3 for an average woman and 0.7 for an average man.
   */
  muscle: number;

  /**
   * Definition, how much of the muscle relief shows through the fat, 1 when lean and 0 at high fat percentages.
   */
  definition: number;
}
export namespace IAutoMovieHumanTrunkFrame {
  /**
   * Heights of the trunk's stations.
   *
   * @author Samchon
   */
  export interface ILevels {
    /** Lower edge of the pubis, between the thighs. */
    crotch: number;

    /** The gluteal furrow, below the buttocks. */
    gluteal: number;

    /** Maximum posterior protrusion of the buttocks. */
    buttock: number;

    /** Navel. */
    navel: number;

    /** Natural, narrowest waist. */
    waist: number;

    /** Lowest point of the rib cage at the side. */
    tenthRib: number;

    /** Lower border of the costal arch in front. */
    costal: number;

    /** The inframammary fold and the pectoral's lower border. */
    fold: number;

    /** The most anterior point of the chest, the bust in women. */
    chestPoint: number;

    /** Apex of the anterior axillary fold. */
    axilla: number;
  }

  /**
   * One measured section.
   *
   * @author Samchon
   */
  export interface ISection {
    /** Tape circumference. */
    girth: number;

    /** Breadth. */
    breadth: number;

    /** Depth. */
    depth: number;
  }
}
