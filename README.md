# Claude Code Skills

A collection of custom skills for [Claude Code](https://docs.anthropic.com/en/docs/claude-code), Anthropic's official CLI tool.

## What are Claude Code Skills?

Claude Code Skills are reusable prompt templates that extend Claude Code's capabilities. They allow you to define specialized workflows, automate repetitive tasks, and standardize how Claude Code handles specific types of work.

## Available Skills

### Mobile Development

| Skill | Description |
|-------|-------------|
| `mobile-dev-gcp-deploy` | 引導完成 Flutter App 部署至 Google Play Console 的完整流程，包含 AAB 建置、簽署設定、測試軌道（Internal / Closed / Open Testing）建立與測試者邀請 |
| `mobile-dev-ios-deploy` | 引導完成 Flutter App 部署至 App Store Connect / TestFlight 的完整流程，包含 Xcode 設定、Provisioning Profile 建立、IPA 建置與上傳、TestFlight 測試分發 |
| `mobile-dev-google-oauth` | 引導在 Flutter App 中整合 Google OAuth（Google Sign-In），包含 GCP OAuth Client ID 建立、google_sign_in 套件整合、Android/iOS 平台設定、後端 Token 驗證 |
| `mobile-dev-ios-oauth` | 引導在 Flutter App 中整合 Sign in with Apple（iOS OAuth），包含 Apple Developer 設定、sign_in_with_apple 套件整合、Android 端 Web-based 實作方案、後端 Identity Token 驗證 |

## Getting Started

### 安裝方式

以下提供三種將 skills 安裝到你的專案的方式。選擇最適合你工作流程的方式。

#### 方式一：Git Submodule（推薦）

使用 git submodule 可以追蹤上游更新，在團隊協作中保持 skills 版本一致。

```bash
# 在你的專案根目錄下，將 claude-skills 加入為 submodule
git submodule add https://github.com/buildPolis/claude-skills.git .claude-skills

# 建立 symlink 將 skills 連結到 Claude Code 的 skills 目錄
mkdir -p .claude/skills
ln -s ../../.claude-skills/skills/* .claude/skills/

# 提交 submodule 設定
git add .gitmodules .claude-skills .claude/skills
git commit -m "chore: add claude-skills as submodule"
```

當上游有更新時，拉取最新版本：

```bash
git submodule update --remote .claude-skills
```

團隊成員 clone 專案時，需初始化 submodule：

```bash
git clone --recurse-submodules <your-repo-url>
# 或者在已 clone 的專案中
git submodule init && git submodule update
```

#### 方式二：手動複製

最簡單的方式，適合快速試用或不需要追蹤上游更新的情境。

```bash
# Clone claude-skills 倉庫
git clone https://github.com/buildPolis/claude-skills.git /tmp/claude-skills

# 在你的專案中建立 skills 目錄
mkdir -p .claude/skills

# 複製需要的 skill 檔案（複製全部）
cp /tmp/claude-skills/skills/*.md .claude/skills/

# 或者只複製特定的 skill
cp /tmp/claude-skills/skills/mobile-dev-gcp-deploy.md .claude/skills/
cp /tmp/claude-skills/skills/mobile-dev-ios-deploy.md .claude/skills/

# 清理暫存目錄
rm -rf /tmp/claude-skills
```

#### 方式三：Symlink

將 claude-skills 倉庫 clone 到本機的固定位置，然後透過 symlink 連結到各個專案。適合在本機多個專案間共用同一份 skills。

```bash
# 將 claude-skills clone 到本機固定位置（只需做一次）
git clone https://github.com/buildPolis/claude-skills.git ~/claude-skills

# 在你的專案中建立 skills 目錄並建立 symlink
mkdir -p .claude/skills
ln -s ~/claude-skills/skills/* .claude/skills/

# 需要更新時，直接在 clone 的倉庫中 pull
cd ~/claude-skills && git pull
```

> **注意：** 使用 symlink 方式時，symlink 路徑為絕對路徑，不同機器上的路徑可能不同，因此不建議將 symlink 提交到版本控制中。可在 `.gitignore` 中加入 `.claude/skills/` 來避免提交。

### 使用 Skill

安裝完成後，在 Claude Code 中以 `/` 前綴呼叫 skill：

```
/mobile-dev-gcp-deploy
/mobile-dev-ios-deploy
/mobile-dev-google-oauth
/mobile-dev-ios-oauth
```

## Project Structure

```
claude-skills/
├── README.md
└── skills/                          # Skill definition files
    ├── mobile-dev-gcp-deploy.md     # Flutter → Google Play Console 部署
    ├── mobile-dev-ios-deploy.md     # Flutter → App Store Connect 部署
    ├── mobile-dev-google-oauth.md   # Flutter Google OAuth 整合
    └── mobile-dev-ios-oauth.md      # Flutter Sign in with Apple 整合
```

## Creating a New Skill

Each skill is a Markdown file with frontmatter metadata and a prompt body. Refer to the [Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code) for the skill file format and best practices.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT
