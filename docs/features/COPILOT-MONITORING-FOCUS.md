# GitHub Copilot Monitoring Focus

## Product direction

This fork is a local-first VS Code monitoring tool for GitHub Copilot. It keeps
the existing session, token, context, tool, retry, correction, customization,
and skill analysis, but presents that data around two questions:

1. Where did Copilot usage go?
2. Was that usage effective, and what can the user improve next time?

The product must distinguish measured facts from inferred insights. Token
counts, tool calls, timestamps, and context-window observations are facts when
the session format exposes them. Effectiveness is an interpretation and must
show its supporting evidence instead of presenting a hidden score as truth.

## Source policy

The default monitoring scope is `githubCopilot`. It discovers local GitHub
Copilot sessions from VS Code-family editors, Copilot CLI, JetBrains IDEs, and
Visual Studio. Other existing adapters remain in the codebase and can be
enabled with `aiEngineeringFluency.monitoring.scope = allSupported` while the
fork is being developed.

This staged approach keeps proven parsing behavior available without exposing
unsupported company tooling in the default experience. Adapters should only be
removed after the Copilot-focused product is stable and fixture coverage proves
that no shared parsing or aggregation behavior depends on them.

## Experience model

The primary experience should converge on four areas:

- **Usage:** sessions, input/output/thinking/cache tokens, models, trends, and
  estimated Copilot cost.
- **Context:** context-window pressure, growth, repeated references, cache use,
  and sessions approaching model limits.
- **Agent activity:** tool calls, failures, retries, corrections, skills,
  instructions, agents, and other customizations used during a session.
- **Insights:** evidence-backed findings such as high-token/low-output sessions,
  repeated failed calls, correction loops, unused skills, and inefficient
  context growth.

## Delivery sequence

### Phase 1 — Copilot-focused foundation

- Default discovery to GitHub Copilot sources.
- Preserve all existing monitoring and insight calculations.
- Keep non-Copilot adapters behind the compatibility scope.
- Establish fork branding and extension identifiers after a product name is
  chosen.

### Phase 2 — Simplified information architecture

- Make Usage, Context, Agent Activity, and Insights the primary navigation.
- Move team, cloud-agent, environmental, and specialist research views out of
  the default path or behind explicit configuration.
- Make a single session the main drill-down unit.

### Phase 3 — Session effectiveness

- Define evidence-bearing insight records with severity, confidence, and the
  observed facts that triggered them.
- Add context pressure, retry-loop, tool-failure, correction-loop, and
  high-token/low-output detectors.
- Avoid ranking people or claiming productivity from token counts alone.

### Phase 4 — Organization readiness

- Document exactly which local files are read and which fields may be synced.
- Keep backend sharing opt-in and preserve the existing anonymized and
  pseudonymous profiles.
- Add organization-level policy defaults without weakening local privacy.

## Near-term acceptance criteria

- A fresh installation scans GitHub Copilot sources only.
- Switching to `allSupported` restores the original discovery behavior.
- Changing scope refreshes monitoring without requiring an extension restart.
- Existing session, tool, context, correction, skill, and insight tests remain
  green.
- The default dashboard contains no unsupported effectiveness claims: every
  recommendation can identify the session evidence behind it.
