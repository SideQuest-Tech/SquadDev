# ClickUp Task Creator

Create one or more tasks in the SideQuest Tech ClickUp workspace following the established task format.

## When to use

Invoke this skill (`/clickup-task`) whenever the user asks to create, add, or log ClickUp tasks.

---

## Workspace reference

| Item | Value |
|------|-------|
| Workspace | SideQuest Tech (`90152613762`) |
| Default list | Sidequesttech Website (`901524248608`) |
| Prompt field ID | `d041d517-3793-47dd-abcf-7836097dcf30` |
| API base | `https://api.clickup.com/api/v2` |
| Auth | `$CLICKUP_API_TOKEN` env var (already available) |

Other lists available in the workspace:
- Project 2 (`901524248607`)
- Get Started with ClickUp (`901524248610`)

---

## Task structure

Every task must have three parts:

**Name** — short, action-oriented title (verb + noun, e.g. "Add GitHub CI/CD Workflows")

**Description** — human-readable context explaining:
- What exists today / what the problem is
- What needs to happen (scope)
- Any relevant technical details a developer needs before starting

**Prompt** — a Claude Code prompt (stored in the `Prompt` custom field) that tells Claude exactly what to do to complete the task. Should reference specific files, docs, or commands. Written as if instructing Claude directly.

---

## API pattern

Create a task via `curl`:

```bash
curl -s -X POST \
  -H "Authorization: $CLICKUP_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "<task name>",
    "description": "<description>",
    "custom_fields": [
      {
        "id": "d041d517-3793-47dd-abcf-7836097dcf30",
        "value": "<claude prompt>"
      }
    ]
  }' \
  "https://api.clickup.com/api/v2/list/901524248608/task"
```

Verify success by checking for `"id"` in the response. Log the task URL (`response.url`) for the user.

---

## Steps to follow

1. Ask the user for task details if not provided — name, description, and prompt for each task.
2. If the user gives a rough idea, draft all three fields and confirm before creating.
3. Create tasks in parallel when there are multiple (independent curl calls).
4. Return the ClickUp task URL for each created task.

---

## Notes

- Do not create a new `Prompt` custom field — it already exists on all lists in this workspace.
- If the user specifies a different list, swap the list ID in the URL. The Prompt field ID stays the same.
- Descriptions use plain text (newlines with `\n`). No markdown — ClickUp renders its own rich text.
- If `CLICKUP_API_TOKEN` is not set, tell the user to add it to their environment and check `.mcp.json`.
