import { tags } from "typia";

/**
 * Mandible at the temporomandibular joints, millimetres at the incisors (measured, Verkouteren 2022: the 18-year model for opening and lateral excursion, the 6 to 18 mean for protrusion). The stickman turns the jaw about its joint by the opening over the joint-to-chin distance; condylar gliding is not modelled.
 */
export interface IAutoMovieHumanJawPose {
  /** Interincisal opening, from 0 (closed) to 52.9 mm maximal active opening. */
  opening?: number & tags.Minimum<0> & tags.Maximum<52.9>;

  /** Protrusion of the lower incisors forward from rest, 0 to 8.5 mm. */
  protrusion?: number & tags.Minimum<0> & tags.Maximum<8.5>;

  /** Lateral excursion of the lower incisors: positive toward the person's left, 10.35 mm each way. */
  lateralExcursion?: number & tags.Minimum<-10.35> & tags.Maximum<10.35>;
}
