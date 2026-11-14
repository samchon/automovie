"use client";

import { type ReactElement, type RefObject, useEffect, useRef } from "react";

import type { IPlaygroundComposition } from "../../playground/structures/IPlaygroundComposition";
import type { IPlaygroundRefusal } from "../../playground/structures/IPlaygroundRefusal";
import type { IPlaygroundVocabulary } from "../../playground/structures/IPlaygroundVocabulary";
import { PlaygroundJsonField } from "./PlaygroundJsonField";
import { PlaygroundSchemaForm } from "./PlaygroundSchemaForm";
import { movePlaygroundItem } from "./movePlaygroundItem";

/** The most accepted values a refusal offers as buttons; a longer list is read from the refusal itself. */
const FIXES: number = 8;

/**
 * The editor of one action of a chain: its name, its parameters, its anchor,
 * its cut, its timing and the actions performed over it.
 *
 * The name picker lists the adapter's actions and lexicon rows. A control
 * for an operator the installed package lacks is not shown. The action a
 * refusal names is marked and scrolled into view, with the refusal's fix
 * under its fields and a button per accepted value when there are few.
 *
 * @param props The action, the vocabulary, the refusal and the listeners.
 * @returns The editor.
 */
export function PlaygroundActionEditor(props: {
  /** The action. */
  action: IPlaygroundComposition.IAction;

  /** What the pickers offer. */
  vocabulary: IPlaygroundVocabulary;

  /** Whether this action is itself performed over another, which takes no overlay of its own. */
  nested: boolean;

  /** The refusal of the last performance, with the action it names; null when there is none or it names no action. */
  refused: PlaygroundActionEditor.IRefused | null;

  /** Hear the changed action. */
  onChange: (action: IPlaygroundComposition.IAction) => void;

  /** Remove the action. */
  onRemove: () => void;

  /** Move the action one place earlier (-1) or later (1). */
  onMove: (by: -1 | 1) => void;
}): ReactElement {
  const { action, vocabulary } = props;
  const mine: boolean = props.refused?.action === action;
  const known: boolean =
    vocabulary.actions.some(
      (a: IPlaygroundVocabulary.IAction): boolean => a.name === action.name,
    ) ||
    vocabulary.lexicon.some((f: IPlaygroundVocabulary.IFamily): boolean =>
      f.rows.includes(action.name),
    );

  // Only actions the package marks as overlays can ride a carrier; where the
  // package does not say, every action is offered.
  const offered: IPlaygroundVocabulary.IAction[] = props.nested
    ? vocabulary.actions.filter(
        (a: IPlaygroundVocabulary.IAction): boolean => a.overlay !== false,
      )
    : vocabulary.actions;

  // An action or a lexicon row with a schema is edited through fields
  // generated from it; anything else through JSON. The name is looked up as
  // an own key, so a name such as `constructor` is not read off a prototype.
  const fields: IPlaygroundVocabulary.IParameter[] | undefined =
    vocabulary.actions.find(
      (a: IPlaygroundVocabulary.IAction): boolean => a.name === action.name,
    )?.parameters ??
    vocabulary.lexicon
      .filter((f: IPlaygroundVocabulary.IFamily): boolean =>
        Object.hasOwn(f.parameters, action.name),
      )
      .map(
        (
          f: IPlaygroundVocabulary.IFamily,
        ): IPlaygroundVocabulary.IParameter[] => f.parameters[action.name]!,
      )[0];

  const set = (patch: Partial<IPlaygroundComposition.IAction>): void => {
    const next: IPlaygroundComposition.IAction = { ...action, ...patch };

    // An absent member is left out rather than kept as undefined, so the
    // address stays the same for the same composition.
    for (const key of ["anchor", "until", "sync", "over"] as const)
      if (next[key] === undefined) delete next[key];
    props.onChange(next);
  };
  const over: IPlaygroundComposition.IAction[] = action.over ?? [];

  // A refusal brings the action it names into view, since a long chain may
  // have scrolled it out of the panel.
  const block: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
  useEffect((): void => {
    if (mine) block.current?.scrollIntoView({ block: "nearest" });
  }, [mine]);

  return (
    <div
      ref={block}
      className={props.nested ? "am-action am-action-nested" : "am-action"}
      data-refused={mine}
    >
      <div className="am-row">
        <label className="am-field">
          <span className="am-label">Action</span>
          <select
            value={action.name}
            aria-invalid={mine && props.refused?.refusal.axis === "act"}
            onChange={(event): void => set({ name: event.target.value })}
          >
            {known ? null : <option value={action.name}>{action.name}</option>}
            <optgroup label="Vocabulary">
              {offered.map(
                (a: IPlaygroundVocabulary.IAction): ReactElement => (
                  <option key={a.name} value={a.name}>
                    {a.name}
                  </option>
                ),
              )}
            </optgroup>
            {vocabulary.operators.lexicon
              ? vocabulary.lexicon.map(
                  (family: IPlaygroundVocabulary.IFamily): ReactElement => (
                    <optgroup key={family.name} label={family.name}>
                      {family.rows.map(
                        (row: string): ReactElement => (
                          <option key={row} value={row}>
                            {row}
                          </option>
                        ),
                      )}
                    </optgroup>
                  ),
                )
              : null}
          </select>
        </label>
        <label className="am-field am-narrow">
          <span className="am-label">Anchor</span>
          <input
            type="text"
            value={action.anchor ?? ""}
            onChange={(event): void =>
              set({
                anchor:
                  event.target.value === "" ? undefined : event.target.value,
              })
            }
          />
        </label>
      </div>

      {fields === undefined ? (
        <PlaygroundJsonField
          label="Parameters (JSON)"
          value={action.params}
          optional={false}
          onChange={(value: Record<string, unknown> | undefined): void =>
            set({ params: value ?? {} })
          }
        />
      ) : (
        <PlaygroundSchemaForm
          fields={fields}
          value={action.params}
          onChange={(params: Record<string, unknown>): void => set({ params })}
        />
      )}
      {vocabulary.operators.until ? (
        <PlaygroundJsonField
          label="Cut early (until)"
          value={action.until}
          optional
          placeholder='{"share": 0.5}'
          onChange={(value): void => set({ until: value })}
        />
      ) : null}
      {vocabulary.operators.sync ? (
        <PlaygroundJsonField
          label="Timed to (sync)"
          value={action.sync}
          optional
          placeholder='{"of": "anchor", "event": "contact"}'
          onChange={(value): void => set({ sync: value })}
        />
      ) : null}

      {mine && props.refused !== null ? (
        <div className="am-action-refusal" role="alert">
          <p>
            <strong>Refused on {props.refused.refusal.axis}.</strong>{" "}
            {props.refused.refusal.fix}
          </p>
          {props.refused.fixable &&
          props.refused.refusal.alternatives.length <= FIXES ? (
            <div className="am-buttons">
              {props.refused.refusal.alternatives.map(
                (value: string): ReactElement => (
                  <button
                    key={value}
                    type="button"
                    onClick={(): void => props.refused?.onFix(value)}
                  >
                    Use {value}
                  </button>
                ),
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="am-buttons">
        <button
          type="button"
          aria-label={`Move ${action.name} earlier`}
          onClick={(): void => props.onMove(-1)}
        >
          Earlier
        </button>
        <button
          type="button"
          aria-label={`Move ${action.name} later`}
          onClick={(): void => props.onMove(1)}
        >
          Later
        </button>
        <button
          type="button"
          aria-label={`Remove ${action.name}`}
          onClick={props.onRemove}
        >
          Remove
        </button>
      </div>

      {vocabulary.operators.over && !props.nested ? (
        <div className="am-stack">
          <span className="am-label">Performed over it</span>
          {over.map(
            (
              inner: IPlaygroundComposition.IAction,
              index: number,
            ): ReactElement => (
              <PlaygroundActionEditor
                key={index}
                action={inner}
                vocabulary={vocabulary}
                nested
                refused={props.refused}
                onChange={(next): void =>
                  set({
                    over: over.map(
                      (o, i): IPlaygroundComposition.IAction =>
                        i === index ? next : o,
                    ),
                  })
                }
                onRemove={(): void => {
                  const rest: IPlaygroundComposition.IAction[] = over.filter(
                    (_, i): boolean => i !== index,
                  );
                  set({ over: rest.length === 0 ? undefined : rest });
                }}
                onMove={(by): void =>
                  set({ over: movePlaygroundItem(over, index, by) })
                }
              />
            ),
          )}
          <button
            type="button"
            onClick={(): void => {
              const first: IPlaygroundVocabulary.IAction | undefined =
                vocabulary.actions.find(
                  (a: IPlaygroundVocabulary.IAction): boolean =>
                    a.overlay !== false,
                );
              if (first !== undefined)
                set({ over: [...over, { name: first.name, params: {} }] });
            }}
          >
            Add an action over it
          </button>
        </div>
      ) : null}
    </div>
  );
}
export namespace PlaygroundActionEditor {
  /** A refusal placed on the action it names. */
  export interface IRefused {
    /** The action object of the composition that the refusal names. */
    action: IPlaygroundComposition.IAction;

    /** The refusal. */
    refusal: IPlaygroundRefusal;

    /** Whether one of the refusal's alternatives can be applied to that action. */
    fixable: boolean;

    /** Apply one alternative and perform again. */
    onFix: (value: string) => void;
  }
}
