# GitHub Copilot Insights

GitHub Copilot Insights is a focused, local-first VS Code extension for understanding how you use GitHub Copilot. It turns local Copilot Chat and Copilot CLI session metadata into a small set of useful metrics and practical recommendations.

This branch is a presentation-focused MVP derived from AI Engineering Fluency. It deliberately removes the cloud, team, Azure, multi-editor, cost, environmental-impact, and fluency-score surfaces from the user experience.

## What the dashboard shows

- Sessions, interactions, tokens, and tool calls for today or the last 30 days
- Three prioritized insights based on recent Copilot activity
- A daily token-activity trend
- The Copilot modes you use most
- Your most frequently used tools
- Recent local sessions that can be opened for more detail

The primary value is not another collection of charts. The dashboard answers two questions quickly: **How am I using Copilot?** and **What should I try next?**

## Data sources and privacy

The MVP reads observable local session data from:

- GitHub Copilot Chat in VS Code
- GitHub Copilot CLI

Analysis runs locally. The MVP does not require GitHub authentication, Azure configuration, a team server, or cloud synchronization. The dashboard reports only data available in local session logs, so activity from other machines and unsupported Copilot surfaces is not included.

## Install a VSIX

1. Build or obtain the `.vsix` file.
2. Open the Extensions view in VS Code.
3. Select the `…` menu, then **Install from VSIX…**.
4. Choose the VSIX and reload VS Code when prompted.
5. Run **GitHub Copilot Insights: Open GitHub Copilot Insights** from the Command Palette, or click the token count in the status bar.

## Develop locally

```bash
cd vscode-extension
npm ci
npm run validate
npm run test:node
npm run check:contract
npm run check:interaction
```

To create an installable package:

```bash
cd vscode-extension
npm run package
npx vsce package --out github-copilot-insights.vsix
```

## MVP boundaries

- Only GitHub Copilot Chat and Copilot CLI are analyzed.
- Insights are heuristic observations, not productivity scores.
- Token totals reflect what local source data reports or supports.
- No cross-device or organization-wide activity is shown.
- The existing reusable parsing and insight engines remain in the codebase so the MVP can evolve without a rewrite.
