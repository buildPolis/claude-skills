# Claude Code Skills

A collection of custom skills for [Claude Code](https://docs.anthropic.com/en/docs/claude-code), Anthropic's official CLI tool.

## What are Claude Code Skills?

Claude Code Skills are reusable prompt templates that extend Claude Code's capabilities. They allow you to define specialized workflows, automate repetitive tasks, and standardize how Claude Code handles specific types of work.

## Getting Started

1. Clone this repository:
   ```bash
   git clone https://github.com/buildPolis/claude-skills.git
   ```

2. Copy the desired skill files into your Claude Code skills directory:
   ```bash
   cp skills/<skill-name>.md ~/.claude/skills/
   ```

3. Use the skill in Claude Code by invoking it with the `/` prefix:
   ```
   /<skill-name>
   ```

## Project Structure

```
claude-skills/
├── README.md
└── skills/          # Skill definition files
```

## Creating a New Skill

Each skill is a Markdown file with frontmatter metadata and a prompt body. Refer to the [Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code) for the skill file format and best practices.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT
