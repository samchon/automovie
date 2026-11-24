import type {
  IAutoMoviePhysicalJointAxis,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { AutoMoviePhysicalJointChart } from "./AutoMoviePhysicalJointChart";
import { AutoMovieXpbdArticulation } from "./AutoMovieXpbdArticulation";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import type { AutoMovieXpbdJoint } from "./AutoMovieXpbdJoint";
import { AutoMovieXpbdMath } from "./AutoMovieXpbdMath";
import type { AutoMovieXpbdWorld } from "./AutoMovieXpbdWorld";
import { PhysicalRotationVector } from "./PhysicalRotationVector";
import { projectPhysicalJointRotation } from "./projectPhysicalJointRotation";
import { solveXpbdArticulationContacts } from "./solveXpbdArticulationContacts";
import type { solveXpbdContacts } from "./solveXpbdContacts";
import type { solveXpbdSupportCascade } from "./solveXpbdSupportCascade";

/**
 * The joint motors' velocity pass over whole articulations, by the
 * articulated-body algorithm (Featherstone 2008, "Rigid Body Dynamics
 * Algorithms", chapter 7) in its impulse form (`AutoMovieXpbdArticulation`).
 *
 * The world's joints form a forest: a joint is a tree edge when its child is
 * dynamic, has no parent edge yet and lies in another tree than its parent; a
 * kinematic parent is a fixed base. Each edge's motion subspace `S` is the
 * rotation about its anchor along its profile's free axes. A motor on axis `k`
 * is the backward-Euler damper `mu_k = h c_k (s_k - qd_k')` on the axis's
 * relative angular velocity after the pass, which enters the algorithm as the
 * joint-space term `D = S^T I^A S + diag(h c)` with the joint impulse `h c (s -
 * qd)`, so each motor meets the inertia of everything it really moves and every
 * attachment's velocity is kept. A tree pressed onto something that is not
 * dynamic is held at those supports in the same solve
 * (`solveXpbdArticulationContacts`). A motor whose impulse exceeds its cap `tau
 * h` is held at the cap and the tree solved again, at most once more per motor.
 * An axis whose rate after the solve carries its joint out of the joint's
 * admitted set over the substep is locked, its rate prescribed to zero
 * (Featherstone 2008, section 7.3), and the tree solved again the same way, so
 * a limit is held in the velocity pass rather than only restored by the
 * position pass after the prediction has stepped past it.
 */
export namespace solveXpbdArticulation {
  /**
   * Solve every motor-driven tree's motors at once and return the joints
   * outside the forest (closing a loop or with a kinematic child), which the
   * caller solves pair by pair.
   *
   * @param kept The world's forest (`forest`), kept by the world.
   * @param h The substep, seconds.
   * @param contacts The step's contacts, for the trees' supports.
   * @param tasks The root tasks the trees' supports should meet, by root body.
   * @param warm Each tree's warm start for its supports' cascade, by root body;
   *   a tree's entry is created on its first task.
   * @returns The joints outside the forest, in creation order.
   */
  export function motors(
    kept: IForest,
    h: number,
    contacts: readonly solveXpbdContacts.IContact[],
    tasks: ReadonlyMap<AutoMovieXpbdBody, AutoMovieXpbdWorld.IRootTask>,
    warm: Map<AutoMovieXpbdBody, solveXpbdSupportCascade.IWarm>,
  ): readonly AutoMovieXpbdJoint[] {
    for (const node of kept.nodes.values())
      if (node.parent === undefined) {
        const task: AutoMovieXpbdWorld.IRootTask | undefined = tasks.get(
          node.body,
        );
        let start: solveXpbdSupportCascade.IWarm | undefined = warm.get(
          node.body,
        );
        if (task !== undefined && start === undefined) {
          start = { first: [], second: [] };
          warm.set(node.body, start);
        }
        solveTree(node, h, contacts, task, start);
      }
    return kept.loops;
  }

  /**
   * Apply a linear impulse at a point of a body through its whole articulation:
   * the impulse form of the articulated-body algorithm (Featherstone 2008,
   * section 7.5; Mirtich 1996, "Impulse-based dynamic simulation of rigid body
   * systems", chapter 4) gives every body of the body's tree the velocity
   * change that keeps each attachment's anchors together and moves each joint
   * only along its free axes, so a blow on the chest moves the body it is
   * attached to at once, as the joints' impulses carry it, where an impulse on
   * the chest alone sets it moving away from its limbs and leaves the joints'
   * position pass to drag them after it. A body no joint attaches is its own
   * tree, and the change is the rigid body's own.
   *
   * @param kept The world's forest (`forest`), kept by the world.
   * @param body The struck body.
   * @param point The world point the impulse acts at, metres.
   * @param impulse The world linear impulse, newton seconds.
   * @throws {Error} When the struck body's tree has a singular inertia.
   */
  export function impulse(
    kept: IForest,
    body: AutoMovieXpbdBody,
    point: IAutoMovieVector3,
    impulse: IAutoMovieVector3,
  ): void {
    if (!body.dynamic) return;
    const tree: AutoMovieXpbdArticulation.ITree = build(
      root(kept.nodes.get(body) ?? { body, children: [] }),
    );
    // An instant's impulse: no motor's damping acts over it.
    const factored: AutoMovieXpbdArticulation.IFactor | null =
      AutoMovieXpbdArticulation.factor(tree, 0);
    if (factored === null)
      throw new Error("A struck articulation has a singular inertia");
    apply(
      tree,
      AutoMovieXpbdArticulation.propagate(tree, factored, false, {
        state: tree.states.findIndex(
          (state: AutoMovieXpbdArticulation.IState): boolean =>
            state.body === body,
        ),
        impulse: AutoMovieXpbdArticulation.spatialImpulse(
          Vector3.subtract(point, tree.origin),
          impulse,
        ),
      }),
    );
  }

  /**
   * The world's forest: its bodies' nodes and the joints outside it. It depends
   * only on the joints and on which bodies are dynamic, the model's
   * connectivity (its parent array, Featherstone 2008, section 4.1.2), so the
   * world builds it once and again only when a joint is created or a body's
   * `dynamic` changes.
   */
  export interface IForest {
    /** Every jointed body's node. */
    nodes: ReadonlyMap<AutoMovieXpbdBody, INode>;

    /** The joints outside the forest, in creation order. */
    loops: readonly AutoMovieXpbdJoint[];
  }

  /**
   * The world's forest: each joint whose child is dynamic, has no parent edge
   * yet and lies in another tree than its parent becomes a tree edge.
   *
   * @param joints The world's joints, in creation order.
   * @returns The forest's nodes and the joints outside it.
   */
  export function forest(joints: readonly AutoMovieXpbdJoint[]): IForest {
    const nodes: Map<AutoMovieXpbdBody, INode> = new Map();
    const loops: AutoMovieXpbdJoint[] = [];
    for (const joint of joints) {
      const child: INode = nodeOf(nodes, joint.child);
      const parent: INode = nodeOf(nodes, joint.parent);
      if (
        !joint.child.dynamic ||
        child.edge !== undefined ||
        root(child) === root(parent)
      ) {
        loops.push(joint);
        continue;
      }
      child.edge = joint;
      child.parent = parent;
      parent.children.push(child);
    }
    return { nodes, loops };
  }

  /** Add a propagation's velocity changes to every dynamic body of its tree. */
  function apply(
    tree: AutoMovieXpbdArticulation.ITree,
    response: AutoMovieXpbdArticulation.IResponse,
  ): void {
    tree.states.forEach(
      (state: AutoMovieXpbdArticulation.IState, i: number): void => {
        const body: AutoMovieXpbdBody = state.body;
        if (!body.dynamic) return;
        const change: number[] = response.change[i]!;
        body.angularVelocity = Vector3.add(body.angularVelocity, {
          x: change[0]!,
          y: change[1]!,
          z: change[2]!,
        });
        body.velocity = Vector3.add(
          body.velocity,
          AutoMovieXpbdArticulation.pointChange(
            change,
            Vector3.subtract(body.center, tree.origin),
          ),
        );
      },
    );
  }

  /** One body of the forest. */
  export interface INode {
    /** The world's body. */
    body: AutoMovieXpbdBody;

    /** The joint to its parent; absent at a root. */
    edge?: AutoMovieXpbdJoint;

    /** Its parent node; absent at a root. */
    parent?: INode;

    /** Its child nodes, in joint creation order. */
    children: INode[];
  }

  /** A node waiting in the depth-first walk with its state's index. */
  interface IVisit {
    node: INode;
    state: number;
  }

  /** The node of a body, created on first use. */
  function nodeOf(
    nodes: Map<AutoMovieXpbdBody, INode>,
    body: AutoMovieXpbdBody,
  ): INode {
    let found: INode | undefined = nodes.get(body);
    if (found === undefined) {
      found = { body, children: [] };
      nodes.set(body, found);
    }
    return found;
  }

  /** The node's root. */
  function root(node: INode): INode {
    let top: INode = node;
    while (top.parent !== undefined) top = top.parent;
    return top;
  }

  /** Solve one tree's motors, from its root. */
  function solveTree(
    top: INode,
    h: number,
    contacts: readonly solveXpbdContacts.IContact[],
    task: AutoMovieXpbdWorld.IRootTask | undefined,
    warm: solveXpbdSupportCascade.IWarm | undefined,
  ): void {
    const joints: AutoMovieXpbdJoint[] = [];
    const tree: AutoMovieXpbdArticulation.ITree = build(top, joints);
    if (
      !tree.edges.some((edge: AutoMovieXpbdArticulation.IEdge): boolean =>
        edge.axes.some(
          (axis: AutoMovieXpbdArticulation.IAxis): boolean =>
            axis.motor !== undefined,
        ),
      )
    )
      return;
    let held: solveXpbdArticulationContacts.IHeld;
    let factored: AutoMovieXpbdArticulation.IFactor | null;
    do {
      factored = AutoMovieXpbdArticulation.factor(tree, h);
      if (factored === null) return;
      held = solveXpbdArticulationContacts.solve(
        tree,
        factored,
        AutoMovieXpbdArticulation.propagate(tree, factored, true),
        contacts,
        h,
        task,
        warm,
      );
    } while (
      clamp(tree, factored, held.response, h) ||
      lock(tree, joints, held.response, h)
    );
    solveXpbdArticulationContacts.commit(held);
    apply(tree, held.response);
  }

  /**
   * A tree's states and edges, depth-first from its root so every edge follows
   * its parent's.
   */
  function build(
    top: INode,
    joints?: AutoMovieXpbdJoint[],
  ): AutoMovieXpbdArticulation.ITree {
    const origin: IAutoMovieVector3 = top.body.center;
    const tree: AutoMovieXpbdArticulation.ITree = {
      origin,
      free: top.body.dynamic,
      states: [state(top.body, origin)],
      edges: [],
    };
    const stack: IVisit[] = [{ node: top, state: 0 }];
    while (stack.length !== 0) {
      const visit: IVisit = stack.pop()!;
      for (const next of visit.node.children) {
        const child: number = tree.states.length;
        tree.states.push(state(next.body, origin));
        tree.edges.push({
          parent: visit.state,
          child,
          axes: axes(next.edge!, origin),
        });
        joints?.push(next.edge!);
        stack.push({ node: next, state: child });
      }
    }
    return tree;
  }

  /** A body's state with its own spatial inertia about the origin. */
  function state(
    body: AutoMovieXpbdBody,
    origin: IAutoMovieVector3,
  ): AutoMovieXpbdArticulation.IState {
    return {
      body,
      own: AutoMovieXpbdArticulation.spatialInertia(body, origin),
    };
  }

  /** An edge's free axes: columns, motors and present relative velocities. */
  function axes(
    joint: AutoMovieXpbdJoint,
    origin: IAutoMovieVector3,
  ): AutoMovieXpbdArticulation.IAxis[] {
    const frame: IAutoMovieQuaternion = Quaternion.multiply(
      joint.parent.orientation,
      joint.parentFrame().rotation,
    );
    const anchor: IAutoMovieVector3 = Vector3.subtract(
      Vector3.add(
        joint.child.center,
        Quaternion.rotateVector(
          joint.child.orientation,
          Vector3.subtract(
            joint.childFrame().position,
            joint.child.centerOfMass,
          ),
        ),
      ),
      origin,
    );
    const relative: IAutoMovieVector3 = Vector3.subtract(
      joint.child.angularVelocity,
      joint.parent.angularVelocity,
    );
    // A sequential chart moves each axis with the rotations composed before
    // it, so the motion subspace is the chart's axes at the joint's present
    // configuration (`AutoMoviePhysicalJointChart.directions`).
    const order: readonly IAutoMoviePhysicalJointAxis["axis"][] | undefined =
      joint.joint.order;
    const chart: IAutoMovieVector3[] | undefined =
      order === undefined
        ? undefined
        : AutoMoviePhysicalJointChart.directions(
            order,
            AutoMoviePhysicalJointChart.nearest(
              joint.joint,
              Quaternion.multiply(
                Quaternion.inverse(frame),
                Quaternion.multiply(
                  joint.child.orientation,
                  joint.childFrame().rotation,
                ),
              ),
            ),
          );
    return joint.joint.axes.map(
      (
        declared: IAutoMoviePhysicalJointAxis,
      ): AutoMovieXpbdArticulation.IAxis => {
        const e: IAutoMovieVector3 = Quaternion.rotateVector(
          frame,
          chart === undefined
            ? UNIT[declared.axis]!
            : chart[order!.indexOf(declared.axis)]!,
        );
        const moment: IAutoMovieVector3 = Vector3.cross(anchor, e);
        const motor: AutoMovieXpbdJoint.IMotor | undefined = joint.motors.get(
          declared.axis,
        );
        const axis: AutoMovieXpbdArticulation.IAxis = {
          column: [e.x, e.y, e.z, moment.x, moment.y, moment.z],
          present: Vector3.dot(relative, e),
        };
        if (motor !== undefined && motor.damping > 0 && motor.maximumTorque > 0)
          axis.motor = motor;
        return axis;
      },
    );
  }

  /**
   * Hold every free motor whose impulse `b - h c qd'` exceeds its cap at the
   * cap; true when any was newly held.
   */
  function clamp(
    tree: AutoMovieXpbdArticulation.ITree,
    factored: AutoMovieXpbdArticulation.IFactor,
    response: AutoMovieXpbdArticulation.IResponse,
    h: number,
  ): boolean {
    let clamped: boolean = false;
    tree.edges.forEach(
      (edge: AutoMovieXpbdArticulation.IEdge, e: number): void => {
        const f: AutoMovieXpbdArticulation.IEdgeFactor = factored.edges[e]!;
        edge.axes.forEach(
          (axis: AutoMovieXpbdArticulation.IAxis, k: number): void => {
            if (
              axis.motor === undefined ||
              axis.fixed !== undefined ||
              axis.locked === true
            )
              return;
            const mu: number =
              f.impulse[k]! - f.damping[k]! * response.rates[e]![k]!;
            const cap: number = axis.motor.maximumTorque * h;
            if (Math.abs(mu) > cap) {
              axis.fixed = Math.sign(mu) * cap;
              clamped = true;
            }
          },
        );
      },
    );
    return clamped;
  }

  /**
   * Lock every free axis whose rate after the solve carries its joint out of
   * its admitted set over the substep: the joint's relative rotation turned
   * about the axis by the rate times `h` is projected back by the joint's own
   * admission (`projectPhysicalJointRotation`: box, chart or swing-twist gate),
   * so an axis on its limit and moving outward is held at zero rate (a joint
   * limit enforced as a constraint once the joint reaches it moving outward,
   * Kokkevis 2004, "Practical physics for articulated characters", Game
   * Developers Conference; prescribed motion, Featherstone 2008, section 7.3)
   * and the tree solved again, at most once more per newly locked axis (the
   * caps' loop). The turn the projection removes counts when it exceeds the
   * square root of machine epsilon, the precision of a rotation read through
   * its quaternion. True when any axis was newly locked.
   */
  function lock(
    tree: AutoMovieXpbdArticulation.ITree,
    joints: readonly AutoMovieXpbdJoint[],
    response: AutoMovieXpbdArticulation.IResponse,
    h: number,
  ): boolean {
    let locked: boolean = false;
    tree.edges.forEach(
      (edge: AutoMovieXpbdArticulation.IEdge, e: number): void => {
        const joint: AutoMovieXpbdJoint = joints[e]!;
        const frame: IAutoMovieQuaternion = Quaternion.multiply(
          joint.parent.orientation,
          joint.parentFrame().rotation,
        );
        const relative: IAutoMovieQuaternion = Quaternion.multiply(
          Quaternion.inverse(frame),
          Quaternion.multiply(
            joint.child.orientation,
            joint.childFrame().rotation,
          ),
        );
        edge.axes.forEach(
          (axis: AutoMovieXpbdArticulation.IAxis, k: number): void => {
            if (axis.locked === true || axis.fixed !== undefined) return;
            const rate: number = axis.present + response.rates[e]![k]!;
            if (removed(joint, frame, relative, axis, rate * h) > PRECISION) {
              axis.locked = true;
              locked = true;
            }
          },
        );
      },
    );
    return locked;
  }

  /**
   * How much of a turn about an axis the joint's admission removes: the joint's
   * relative rotation turned about the axis by `angle` and projected back
   * (`projectPhysicalJointRotation`: box, chart or swing-twist gate).
   */
  function removed(
    joint: AutoMovieXpbdJoint,
    frame: IAutoMovieQuaternion,
    relative: IAutoMovieQuaternion,
    axis: AutoMovieXpbdArticulation.IAxis,
    angle: number,
  ): number {
    const local: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(frame),
      { x: axis.column[0]!, y: axis.column[1]!, z: axis.column[2]! },
    );
    const stepped: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(
        PhysicalRotationVector.exp(Vector3.scale(local, angle)),
        relative,
      ),
    );
    return Vector3.length(
      PhysicalRotationVector.log(
        Quaternion.multiply(
          projectPhysicalJointRotation(joint.joint, stepped),
          Quaternion.inverse(stepped),
        ),
      ),
    );
  }

  /** The joint's anchor frame on its parent and its relative rotation. */
  function relation(joint: AutoMovieXpbdJoint): IRelation {
    const frame: IAutoMovieQuaternion = Quaternion.multiply(
      joint.parent.orientation,
      joint.parentFrame().rotation,
    );
    return {
      frame,
      relative: Quaternion.multiply(
        Quaternion.inverse(frame),
        Quaternion.multiply(
          joint.child.orientation,
          joint.childFrame().rotation,
        ),
      ),
    };
  }

  /** A joint's anchor frame on its parent and the child's rotation in it. */
  interface IRelation {
    /** The parent's anchor frame, world. */
    frame: IAutoMovieQuaternion;

    /** The child's anchor frame relative to it. */
    relative: IAutoMovieQuaternion;
  }

  /**
   * The articulated response of the world's trees to positional impulses
   * (Kokkevis 2004, "Practical physics for articulated characters";
   * Featherstone 2008, section 7.5): a contact's correction on a jointed body
   * moves its whole tree along the joints' free axes, as the joints' impulses
   * carry it, instead of moving the one body off its joints. Each tree is built
   * and factored once per position pass at `h = 0` (an instant's impulse: no
   * motor damps it) the first time a contact reaches it, with every axis
   * standing on its limit held (`IAxis.locked`), so the response never carries
   * a joint past its limit. An axis is on its limit when a probe turn `d` of
   * the rotation precision (the square root of machine epsilon) about it, one
   * way or the other, is projected back by more than `d / 2`: the admission
   * keeps a turn into the admitted set whole and removes a turn out of it
   * whole, so the removed part is 0 or `d` up to the quaternion arithmetic's
   * rounding, of order machine epsilon, far below `d`; the midpoint `d / 2`
   * tells the two apart with a margin of `d / 2` either way, and a split
   * between them is the boundary's own obliquity to the axis, read as on the
   * limit once the outward part is the larger.
   *
   * @param kept The world's forest.
   * @returns The responder for one position pass.
   */
  export function responder(kept: IForest): IResponder {
    const prepared: Map<INode, IPrepared | null> = new Map();
    const prepare = (top: INode): IPrepared | null => {
      if (prepared.has(top)) return prepared.get(top)!;
      const joints: AutoMovieXpbdJoint[] = [];
      const tree: AutoMovieXpbdArticulation.ITree = build(top, joints);
      tree.edges.forEach(
        (edge: AutoMovieXpbdArticulation.IEdge, e: number): void => {
          const joint: AutoMovieXpbdJoint = joints[e]!;
          const { frame, relative }: IRelation = relation(joint);
          for (const axis of edge.axes)
            if (
              removed(joint, frame, relative, axis, PRECISION) >
                PRECISION / 2 ||
              removed(joint, frame, relative, axis, -PRECISION) > PRECISION / 2
            )
              axis.locked = true;
        },
      );
      const factored: AutoMovieXpbdArticulation.IFactor | null =
        AutoMovieXpbdArticulation.factor(tree, 0);
      const result: IPrepared | null =
        factored === null ? null : { tree, factored };
      prepared.set(top, result);
      return result;
    };
    const respond = (
      impulses: readonly IPointImpulse[],
    ): IPointResponse | null => {
      // Each impulse's tree; a body no joint attaches has none.
      const tops: INode[] = [];
      for (const impulse of impulses) {
        const node: INode | undefined = kept.nodes.get(impulse.body);
        if (node === undefined) return null;
        tops.push(root(node));
      }
      const changes: Map<INode, number[][]> = new Map();
      for (let i: number = 0; i < impulses.length; ++i) {
        const top: INode = tops[i]!;
        const ready: IPrepared | null = prepare(top);
        if (ready === null) return null;
        const state: number = ready.tree.states.findIndex(
          (s: AutoMovieXpbdArticulation.IState): boolean =>
            s.body === impulses[i]!.body,
        );
        const response: AutoMovieXpbdArticulation.IResponse =
          AutoMovieXpbdArticulation.propagate(
            ready.tree,
            ready.factored,
            false,
            {
              state,
              impulse: AutoMovieXpbdArticulation.spatialImpulse(
                Vector3.subtract(impulses[i]!.point, ready.tree.origin),
                impulses[i]!.direction,
              ),
            },
          );
        const sum: number[][] | undefined = changes.get(top);
        changes.set(
          top,
          sum === undefined
            ? response.change
            : sum.map((row: number[], s: number): number[] =>
                row.map(
                  (value: number, r: number): number =>
                    value + response.change[s]![r]!,
                ),
              ),
        );
      }
      // The row's generalised inverse mass: each impulse's direction against
      // the velocity change of its point under all of them.
      let weight: number = 0;
      impulses.forEach((impulse: IPointImpulse, i: number): void => {
        const ready: IPrepared = prepared.get(tops[i]!)!;
        const state: number = ready.tree.states.findIndex(
          (s: AutoMovieXpbdArticulation.IState): boolean =>
            s.body === impulse.body,
        );
        weight += Vector3.dot(
          impulse.direction,
          AutoMovieXpbdArticulation.pointChange(
            changes.get(tops[i]!)![state]!,
            Vector3.subtract(impulse.point, ready.tree.origin),
          ),
        );
      });
      return {
        weight,
        apply: (scale: number): void => {
          for (const [top, change] of changes) {
            const ready: IPrepared = prepared.get(top)!;
            ready.tree.states.forEach(
              (s: AutoMovieXpbdArticulation.IState, i: number): void => {
                const c: number[] = change[i]!;
                AutoMovieXpbdMath.displace(
                  s.body,
                  Vector3.scale(
                    AutoMovieXpbdArticulation.pointChange(
                      c,
                      Vector3.subtract(s.body.center, ready.tree.origin),
                    ),
                    scale,
                  ),
                  { x: c[0]! * scale, y: c[1]! * scale, z: c[2]! * scale },
                );
              },
            );
          }
        },
      };
    };
    return {
      has: (body: AutoMovieXpbdBody): boolean =>
        body.dynamic && kept.nodes.has(body),
      respond,
    };
  }

  /** A unit positional impulse at a point of a body. */
  export interface IPointImpulse {
    /** The body. */
    body: AutoMovieXpbdBody;

    /** The world point it acts at, metres. */
    point: IAutoMovieVector3;

    /** Its unit world direction. */
    direction: IAutoMovieVector3;
  }

  /** The articulated response to a set of unit impulses acting together. */
  export interface IPointResponse {
    /**
     * The generalised inverse mass of the row: each impulse's direction against
     * its point's displacement under all of them.
     */
    weight: number;

    /**
     * Move every body of the trees by the response scaled by a multiplier.
     *
     * @param scale The multiplier, newton seconds squared.
     */
    apply(scale: number): void;
  }

  /** A position pass's articulated response. */
  export interface IResponder {
    /**
     * Whether a body moves through a tree: dynamic and attached by a joint.
     *
     * @param body The body.
     */
    has(body: AutoMovieXpbdBody): boolean;

    /**
     * The response of the impulses' trees to the impulses acting together; none
     * when an impulse's body is in no tree or a tree is singular.
     *
     * @param impulses Unit impulses on bodies the responder has.
     */
    respond(impulses: readonly IPointImpulse[]): IPointResponse | null;
  }

  /** A tree built and factored for one position pass. */
  interface IPrepared {
    /** The tree. */
    tree: AutoMovieXpbdArticulation.ITree;

    /** Its factor at `h = 0`. */
    factored: AutoMovieXpbdArticulation.IFactor;
  }

  /** The precision of a rotation read through its quaternion, radians. */
  const PRECISION: number = Math.sqrt(Number.EPSILON);

  /** Each joint-frame axis by name. */
  const UNIT: Readonly<Record<string, IAutoMovieVector3>> = {
    x: { x: 1, y: 0, z: 0 },
    y: { x: 0, y: 1, z: 0 },
    z: { x: 0, y: 0, z: 1 },
  };
}
