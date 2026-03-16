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
└── skills/                            # Skill definition files
    ├── mobile-dev-gcp-deploy.md       # Google Play Console 上架測試
    ├── mobile-dev-ios-deploy.md       # App Store Connect / TestFlight 上架測試
    ├── mobile-dev-google-oauth.md     # Google Sign-In 整合
    └── mobile-dev-ios-oauth.md        # Sign in with Apple 整合
```

## Available Skills

### Mobile Development

| Skill | 說明 |
|-------|------|
| `mobile-dev-gcp-deploy` | 以 Flutter 為主，引導完成 Google Play Console（GCP）上架測試流程，包含 AAB 建置、簽署設定、測試軌道建立、測試者邀請等 |
| `mobile-dev-ios-deploy` | 以 Flutter 為主，引導完成 App Store Connect / TestFlight 上架測試流程，包含 Xcode 設定、IPA 建置、TestFlight 分發、App Review 注意事項等 |
| `mobile-dev-google-oauth` | 以 Flutter 為主，引導在行動裝置 App 中整合 Google Sign-In（Google OAuth），包含 OAuth Client ID 設定、google_sign_in 套件整合、Token 驗證等 |
| `mobile-dev-ios-oauth` | 以 Flutter 為主，引導在行動裝置 App 中整合 Sign in with Apple（iOS OAuth），包含 Apple Developer 設定、sign_in_with_apple 套件整合、後端 Token 驗證、Android 端 Web-based 方案等 |

## Creating a New Skill

Each skill is a Markdown file with frontmatter metadata and a prompt body. Refer to the [Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code) for the skill file format and best practices.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT
