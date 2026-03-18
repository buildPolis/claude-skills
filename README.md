# Claude Code Skills

A collection of custom skills for [Claude Code](https://docs.anthropic.com/en/docs/claude-code), Anthropic's official CLI tool.

## What are Claude Code Skills?

Claude Code Skills are reusable prompt templates that extend Claude Code's capabilities. They allow you to define specialized workflows, automate repetitive tasks, and standardize how Claude Code handles specific types of work.

## Getting Started

選擇以下任一種方式將 skills 安裝到你的專案中，然後即可在 Claude Code 中使用。

### 安裝方式一：Git Submodule（推薦）

適合需要追蹤上游版本更新的團隊專案。當本倉庫新增或更新 skill 時，你可以透過 `git submodule update` 輕鬆同步。

```bash
# 在你的專案根目錄下執行
git submodule add https://github.com/buildPolis/claude-skills.git .claude/skills

# 日後更新到最新版本
cd .claude/skills
git pull origin main
cd ../..
git add .claude/skills
git commit -m "chore: update claude-skills submodule"
```

> **注意：** 團隊成員在首次 clone 專案後，需執行 `git submodule update --init --recursive` 來拉取 submodule 內容。

### 安裝方式二：手動複製

最簡單直接的方式，適合只需要特定幾個 skill 或不想引入 submodule 的情境。

```bash
# 先 clone 本倉庫到任意位置
git clone https://github.com/buildPolis/claude-skills.git /tmp/claude-skills

# 將整個 skills 目錄複製到你的專案中
cp -r /tmp/claude-skills/skills/ <your-project>/.claude/skills/

# 或者只複製你需要的單一 skill
cp /tmp/claude-skills/skills/<skill-name>.md <your-project>/.claude/skills/
```

> **注意：** 手動複製不會自動同步上游更新，你需要自行追蹤本倉庫的變更並手動更新。

### 安裝方式三：Symlink（符號連結）

適合在本機同時開發多個專案、想共用同一份 skills 的情境，或當你正在為本倉庫貢獻新 skill 時使用。

```bash
# 先 clone 本倉庫到固定位置（例如 ~/repos/）
git clone https://github.com/buildPolis/claude-skills.git ~/repos/claude-skills

# 在你的專案中建立 symlink
ln -s ~/repos/claude-skills/skills <your-project>/.claude/skills
```

> **注意：** Symlink 指向本機路徑，不適合團隊共用（每位成員的 clone 路徑可能不同）。建議將 `.claude/skills` 加入 `.gitignore`。

### 使用 Skill

安裝完成後，在 Claude Code 中以 `/` 前綴呼叫 skill：

```
/<skill-name>
```

## 可用 Skills 清單

### Mobile Development

| Skill 名稱 | 說明 | 檔案路徑 |
|------------|------|----------|
| `mobile-dev-gcp-deploy` | 以 Flutter 為主，引導完成 Google Play Console（GCP）上架測試流程，包含 AAB 建置、簽署設定、測試軌道建立、測試者邀請等 | `skills/mobile-dev-gcp-deploy.md` |
| `mobile-dev-ios-deploy` | 以 Flutter 為主，引導完成 App Store Connect / TestFlight 上架測試流程，包含 Xcode 設定、IPA 建置、TestFlight 分發、App Review 注意事項等 | `skills/mobile-dev-ios-deploy.md` |
| `mobile-dev-google-oauth` | 以 Flutter 為主，引導在行動裝置 App 中整合 Google Sign-In（Google OAuth），包含 OAuth Client ID 設定、google_sign_in 套件整合、Token 驗證等 | `skills/mobile-dev-google-oauth.md` |
| `mobile-dev-ios-oauth` | 以 Flutter 為主，引導在行動裝置 App 中整合 Sign in with Apple（iOS OAuth），包含 Apple Developer 設定、sign_in_with_apple 套件整合、後端 Token 驗證、Android 端 Web-based 方案等 | `skills/mobile-dev-ios-oauth.md` |

> **維護提示：** 每次新增 skill 時，請同步更新此表格，方便使用者快速查閱可用的 skills。

## Project Structure

```
claude-skills/
├── README.md                          # 專案說明與安裝指南
└── skills/                            # Skill 定義檔目錄
    ├── mobile-dev-gcp-deploy.md       # Google Play Console 上架測試
    ├── mobile-dev-ios-deploy.md       # App Store Connect / TestFlight 上架測試
    ├── mobile-dev-google-oauth.md     # Google Sign-In 整合
    └── mobile-dev-ios-oauth.md        # Sign in with Apple 整合
```

## Creating a New Skill

Each skill is a Markdown file with frontmatter metadata and a prompt body. Refer to the [Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code) for the skill file format and best practices.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT
