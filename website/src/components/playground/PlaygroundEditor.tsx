"use client";

import type { ReactElement } from "react";

import { PLAYGROUND_PRESETS } from "../../playground/data/PLAYGROUND_PRESETS";
import type { IPlaygroundComposition } from "../../playground/structures/IPlaygroundComposition";
import type { IPlaygroundVocabulary } from "../../playground/structures/IPlaygroundVocabulary";
import { PlaygroundActionEditor } from "./PlaygroundActionEditor";
import { PlaygroundJsonField } from "./PlaygroundJsonField";
import { movePlaygroundItem } from "./movePlaygroundItem";

/** The skill levels the proficiency picker offers. */
const PROFICIENCIES: readonly IPlaygroundComposition.Proficiency[] = [
  "novice",
  "amateur",
  "trained",
  "elite",
];

/** The numeric fields of a performer's starting place. */
const PLACE: readonly {
  key: "x" | "z" | "yaw";
  label: string;
  step: number;
}[] = [
  { key: "x", label: "x (m)", step: 0.1 },
  { key: "z", label: "z (m)", step: 0.1 },
  { key: "yaw", label: "Yaw (°)", step: 15 },
];

/**
 * The composition editor: the seed, the people with their places and chains
 * of actions, and the mutual actions.
 *
 * Every picker is generated from the vocabulary the adapter describes. The
 * editor changes the composition only; nothing is performed until the page's
 * Perform button is pressed.
 *
 * @param props The composition, the vocabulary, the last refusal and the listener.
 * @returns The editor.
 */
export function PlaygroundEditor(props: {
  /** The composition being edited. */
  composition: IPlaygroundComposition;

  /** What the pickers offer. */
  vocabulary: IPlaygroundVocabulary;

  /** The last performance's refusal on the action it names; null when there is none. */
  refused: PlaygroundActionEditor.IRefused | null;

  /** Hear the changed composition. */
  onChange: (composition: IPlaygroundComposition) => void;
}): ReactElement {
  const { composition, vocabulary } = props;
  const first: string = vocabulary.actions[0]?.name ?? "stand";

  const setPerformer = (
    index: number,
    patch: Partial<IPlaygroundComposition.IPerformer>,
  ): void =>
    props.onChange({
      ...composition,
      performers: composition.performers.map(
        (p, i): IPlaygroundComposition.IPerformer =>
          i === index ? { ...p, ...patch } : p,
      ),
    });

  const addPerformer = (): void => {
    // The next free letter names the new person.
    const taken: Set<string> = new Set(
      composition.performers.map((p): string => p.subject),
    );
    const subject: string =
      "abcdefghijklmnopqrstuvwxyz"
        .split("")
        .find((letter: string): boolean => !taken.has(letter)) ??
      `p${composition.performers.length + 1}`;
    props.onChange({
      ...composition,
      performers: [
        ...composition.performers,
        {
          subject,
          body: vocabulary.bodies[0]?.id ?? "",
          x: composition.performers.length,
          z: 0,
          yaw: 0,
          proficiency: "trained",
          actions: [{ name: first, params: {} }],
        },
      ],
    });
  };

  const setMutual = (
    index: number,
    patch: Partial<IPlaygroundComposition.IMutual>,
  ): void =>
    props.onChange({
      ...composition,
      mutuals: composition.mutuals.map(
        (m, i): IPlaygroundComposition.IMutual =>
          i === index ? { ...m, ...patch } : m,
      ),
    });

  return (
    <div className="am-stack">
      <div className="am-row">
        <label className="am-field">
          <span className="am-label">Preset</span>
          <select
            value=""
            onChange={(event): void => {
              const preset: PLAYGROUND_PRESETS.IPreset | undefined =
                PLAYGROUND_PRESETS[Number(event.target.value)];
              if (event.target.value !== "" && preset !== undefined)
                props.onChange(structuredClone(preset.composition));
            }}
          >
            <option value="">Load a preset</option>
            {PLAYGROUND_PRESETS.map(
              (
                preset: PLAYGROUND_PRESETS.IPreset,
                index: number,
              ): ReactElement => (
                <option key={preset.label} value={index}>
                  {preset.label}
                </option>
              ),
            )}
          </select>
        </label>
        <label className="am-field am-medium">
          <span className="am-label">Seed</span>
          <input
            type="text"
            value={composition.seed}
            onChange={(event): void =>
              props.onChange({ ...composition, seed: event.target.value })
            }
          />
        </label>
      </div>

      {composition.performers.map(
        (
          performer: IPlaygroundComposition.IPerformer,
          index: number,
        ): ReactElement => (
          <fieldset key={index} className="am-performer">
            <legend>Performer {performer.subject}</legend>
            <div className="am-row">
              <label className="am-field am-narrow">
                <span className="am-label">Id</span>
                <input
                  type="text"
                  value={performer.subject}
                  onChange={(event): void =>
                    setPerformer(index, { subject: event.target.value })
                  }
                />
              </label>
              <label className="am-field">
                <span className="am-label">Body</span>
                <select
                  value={performer.body}
                  onChange={(event): void =>
                    setPerformer(index, { body: event.target.value })
                  }
                >
                  {vocabulary.bodies.map(
                    (body: IPlaygroundVocabulary.IBody): ReactElement => (
                      <option key={body.id} value={body.id}>
                        {body.label}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>
            <div className="am-row">
              {PLACE.map(
                ({ key, label, step }): ReactElement => (
                  <label key={key} className="am-field am-narrow">
                    <span className="am-label">{label}</span>
                    <input
                      type="number"
                      step={step}
                      value={performer[key]}
                      onChange={(event): void => {
                        const value: number = Number(event.target.value);
                        if (event.target.value !== "" && Number.isFinite(value))
                          setPerformer(index, { [key]: value });
                      }}
                    />
                  </label>
                ),
              )}
              <label className="am-field">
                <span className="am-label">Proficiency</span>
                <select
                  value={performer.proficiency}
                  onChange={(event): void =>
                    setPerformer(index, {
                      proficiency: event.target
                        .value as IPlaygroundComposition.Proficiency,
                    })
                  }
                >
                  {PROFICIENCIES.map(
                    (
                      level: IPlaygroundComposition.Proficiency,
                    ): ReactElement => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>

            {performer.actions.length === 0 ? (
              <p className="am-muted">
                No action yet. This performer stands at the starting place.
              </p>
            ) : null}
            {performer.actions.map(
              (
                action: IPlaygroundComposition.IAction,
                at: number,
              ): ReactElement => (
                <PlaygroundActionEditor
                  key={at}
                  action={action}
                  vocabulary={vocabulary}
                  nested={false}
                  refused={props.refused}
                  onChange={(next): void =>
                    setPerformer(index, {
                      actions: performer.actions.map(
                        (a, i): IPlaygroundComposition.IAction =>
                          i === at ? next : a,
                      ),
                    })
                  }
                  onRemove={(): void =>
                    setPerformer(index, {
                      actions: performer.actions.filter(
                        (_, i): boolean => i !== at,
                      ),
                    })
                  }
                  onMove={(by): void =>
                    setPerformer(index, {
                      actions: movePlaygroundItem(performer.actions, at, by),
                    })
                  }
                />
              ),
            )}
            <div className="am-buttons">
              <button
                type="button"
                onClick={(): void =>
                  setPerformer(index, {
                    actions: [
                      ...performer.actions,
                      { name: first, params: {} },
                    ],
                  })
                }
              >
                Add an action
              </button>
              <button
                type="button"
                onClick={(): void =>
                  props.onChange({
                    ...composition,
                    performers: composition.performers.filter(
                      (_, i): boolean => i !== index,
                    ),
                  })
                }
              >
                Remove performer {performer.subject}
              </button>
            </div>
          </fieldset>
        ),
      )}
      <button type="button" onClick={addPerformer}>
        Add a performer
      </button>

      {vocabulary.operators.mutual ? (
        <fieldset className="am-performer">
          <legend>Mutual actions</legend>
          {composition.mutuals.map(
            (
              mutual: IPlaygroundComposition.IMutual,
              index: number,
            ): ReactElement => {
              const roles: string[] =
                vocabulary.mutuals.find(
                  (m: IPlaygroundVocabulary.IMutual): boolean =>
                    m.name === mutual.name,
                )?.roles ?? [];
              return (
                <div key={index} className="am-action">
                  <div className="am-row">
                    <label className="am-field">
                      <span className="am-label">Mutual action</span>
                      <select
                        value={mutual.name}
                        onChange={(event): void =>
                          setMutual(index, {
                            name: event.target.value,
                            cast: {},
                          })
                        }
                      >
                        {vocabulary.mutuals.map(
                          (m: IPlaygroundVocabulary.IMutual): ReactElement => (
                            <option key={m.name} value={m.name}>
                              {m.name}
                            </option>
                          ),
                        )}
                      </select>
                    </label>
                    {roles.map(
                      (role: string): ReactElement => (
                        <label key={role} className="am-field am-narrow">
                          <span className="am-label">{role}</span>
                          <select
                            value={mutual.cast[role] ?? ""}
                            onChange={(event): void =>
                              setMutual(index, {
                                cast: {
                                  ...mutual.cast,
                                  [role]: event.target.value,
                                },
                              })
                            }
                          >
                            <option value="">Choose</option>
                            {composition.performers.map(
                              (
                                p: IPlaygroundComposition.IPerformer,
                              ): ReactElement => (
                                <option key={p.subject} value={p.subject}>
                                  {p.subject}
                                </option>
                              ),
                            )}
                          </select>
                        </label>
                      ),
                    )}
                  </div>
                  <PlaygroundJsonField
                    label="Parameters (JSON)"
                    value={mutual.params}
                    optional={false}
                    onChange={(value): void =>
                      setMutual(index, { params: value ?? {} })
                    }
                  />
                  <div className="am-buttons">
                    <button
                      type="button"
                      onClick={(): void =>
                        props.onChange({
                          ...composition,
                          mutuals: composition.mutuals.filter(
                            (_, i): boolean => i !== index,
                          ),
                        })
                      }
                    >
                      Remove {mutual.name}
                    </button>
                  </div>
                </div>
              );
            },
          )}
          <button
            type="button"
            onClick={(): void =>
              props.onChange({
                ...composition,
                mutuals: [
                  ...composition.mutuals,
                  {
                    name: vocabulary.mutuals[0]?.name ?? "",
                    cast: {},
                    params: {},
                  },
                ],
              })
            }
          >
            Add a mutual action
          </button>
        </fieldset>
      ) : null}

      {vocabulary.grammar === null ? null : (
        <details>
          <summary>The grammar</summary>
          {(["axes", "operators"] as const).map(
            (part: "axes" | "operators"): ReactElement => (
              <div key={part} className="am-table-wrap">
                <table className="am-table">
                  <thead>
                    <tr>
                      <th>{part === "axes" ? "Axis" : "Operator"}</th>
                      <th>Decides</th>
                      <th>Carried by</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vocabulary.grammar![part].map(
                      (entry: IPlaygroundVocabulary.IEntry): ReactElement => (
                        <tr key={entry.name}>
                          <td>{entry.name}</td>
                          <td>{entry.says}</td>
                          <td className="am-mono">{entry.carriedBy}</td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            ),
          )}
        </details>
      )}
    </div>
  );
}
