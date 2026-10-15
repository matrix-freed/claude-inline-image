# claude-inline-image

Claude Code plugin (a *mod*) that shows images **inside the terminal transcript**.

- Drop or paste an image into the prompt and press Enter: a small preview is drawn right under its `[Image #N]` row. The prompt still goes to Claude as usual.
- `/img <path>` draws any local image (PNG, JPEG, WebP, GIF, HEIC) in a side pane.
- `/img-test` draws a bundled test image so you can check that your terminal supports it.

Nothing leaves your machine. The plugin never fetches URLs and never sends image bytes anywhere; it only draws what Claude Code already holds.

[한국어 안내는 아래에 있습니다.](#한국어)

## Requirements

| What | Why |
| --- | --- |
| Claude Code **2.1.288 or later** | Uses the mods API (`Image` element, `session.append`, `ui.render`). Mods are early access and may change between releases. |
| A terminal that draws **kitty graphics protocol** images: Ghostty, kitty 0.28+, or a terminal built on Ghostty such as **cmux** | Claude Code only draws images when the terminal answers its graphics query. In any other terminal you see the dimmed alt text instead. |
| **Not inside tmux or screen** | Claude Code does not draw images through a multiplexer. |
| macOS | Non-PNG images are converted with the built-in `sips`. Linux support (ImageMagick) is not implemented yet. |

If your terminal does draw kitty images but Claude Code does not detect it, start Claude Code with `CLAUDE_CODE_FORCE_TERMINAL_IMAGES=1`.

## Install

```
/plugin marketplace add matrix-freed/claude-inline-image
/plugin install inline-image@claude-inline-image
```

Or from a shell:

```sh
claude plugin marketplace add matrix-freed/claude-inline-image
claude plugin install inline-image@claude-inline-image
```

Start a new session afterwards, then run `/img-test`. A purple-and-gold checkerboard means your terminal draws images.

### Let Claude install it for you

Paste this into any Claude Code session:

```text
Install the Claude Code plugin "inline-image" for me:
1. Run: claude plugin marketplace add matrix-freed/claude-inline-image
2. Run: claude plugin install inline-image@claude-inline-image
3. Tell me whether my terminal can draw images: it must be Ghostty, kitty 0.28+, or cmux, and I must not be inside tmux or screen. Check $TERM_PROGRAM and $TMUX.
4. Tell me to open a new session and run /img-test to confirm.
Do not change any other setting.
```

## Usage

| Action | Result |
| --- | --- |
| Drag an image file into the prompt, or paste one with Ctrl+V, then Enter | A 48×14-cell preview appears under that `[Image #N]` row |
| `/img ~/Desktop/shot.png` | The image opens in a side pane (Esc closes it) |
| `/img ` then drag a file, then Enter | Same, with the dropped path |
| `/img-test` | Bundled test card in a pane |

The preview size is the `INLINE` constant at the top of `hooks/register.js` (`columns`, `rows`). Edit it and run `/reload-plugins`.

## How it works

- A `session.append` hook reads the user row Claude Code is about to store. Dropped and pasted images are in it as base64 blocks. PNG is drawn directly; other formats are written to `/tmp/claude-inline-image/` and converted with `sips`.
- A `ui.render` hook on the `UserMessage` site keeps Claude Code's own row and adds an `Image` element under it.
- `/img` reads a file path, converts if needed, and draws in a pane.

Everything uses the documented mods API: [Interface gallery](https://code.claude.com/docs/en/plugins/mods/gallery), [Mods reference](https://code.claude.com/docs/en/plugins/mods/reference).

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| Dimmed text `[이미지 미표시 …]` instead of a picture | The terminal is not detected as kitty/Ghostty, or you are inside tmux/screen. Try `CLAUDE_CODE_FORCE_TERMINAL_IMAGES=1`. |
| Nothing at all under the row | Plugin not loaded in this session: start a new session, or run `/reload-plugins`. |
| The preview is attached to the wrong row | Row matching fell back to order. Please open an issue with the steps. |
| `/img` says conversion failed | `sips` could not read the file (unsupported format or a path with special characters). |

## Sample images

`samples/` holds images you can drop into the prompt to try the plugin:

- `demo.png`: a generated gradient (ours).
- `test.png`: the checkerboard that `/img-test` draws.

## Uninstall

```
/plugin uninstall inline-image@claude-inline-image
```

Temporary converted files live in `/tmp/claude-inline-image/` and can be deleted at any time.

---

## 한국어

Claude Code 터미널 안에 이미지를 **그 자리에서** 보여 주는 플러그인입니다.

- 이미지를 입력칸에 끌어다 놓거나 Ctrl+V로 붙여 넣고 Enter를 치면, 그 `[Image #N]` 행 바로 아래에 작은 미리보기가 그려집니다. 프롬프트는 평소처럼 Claude에게 전달됩니다.
- `/img <경로>` 는 로컬 이미지(PNG·JPEG·WebP·GIF·HEIC)를 사이드 패널에 그립니다.
- `/img-test` 는 번들 테스트 이미지를 그려 터미널 지원 여부를 확인합니다.

아무것도 밖으로 나가지 않습니다. URL을 가져오지 않고, 이미지 바이트를 어디에도 보내지 않습니다.

### 조건

- Claude Code **2.1.288 이상** (mods API 사용, early access라 버전마다 바뀔 수 있음)
- kitty 그래픽 프로토콜을 그리는 터미널: **Ghostty, kitty 0.28+, cmux**(Ghostty 엔진). 다른 터미널에서는 흐린 대체 문구만 보입니다.
- **tmux·screen 안에서는 안 됩니다.**
- macOS (PNG가 아닌 이미지는 내장 `sips`로 변환)

터미널이 지원하는데도 감지가 안 되면 `CLAUDE_CODE_FORCE_TERMINAL_IMAGES=1`로 Claude Code를 실행하십시오.

### 설치

```
/plugin marketplace add matrix-freed/claude-inline-image
/plugin install inline-image@claude-inline-image
```

설치 후 새 세션을 열고 `/img-test`를 실행합니다. 보라·금색 체크무늬가 보이면 성공입니다.

### Claude에게 설치를 맡기기

아무 Claude Code 세션에나 아래를 그대로 붙여 넣으십시오.

```text
Claude Code 플러그인 "inline-image"를 설치해 줘.
1. 실행: claude plugin marketplace add matrix-freed/claude-inline-image
2. 실행: claude plugin install inline-image@claude-inline-image
3. 내 터미널이 이미지를 그릴 수 있는지 알려 줘. Ghostty, kitty 0.28 이상, cmux 중 하나여야 하고 tmux나 screen 안이면 안 돼. $TERM_PROGRAM 과 $TMUX 를 확인해.
4. 새 세션을 열고 /img-test 를 실행해 확인하라고 안내해 줘.
다른 설정은 바꾸지 마.
```

### 사용법

| 동작 | 결과 |
| --- | --- |
| 이미지를 끌어다 놓거나 Ctrl+V, 그리고 Enter | 그 `[Image #N]` 행 아래 48열×14행 미리보기 |
| `/img ~/Desktop/shot.png` | 사이드 패널에 표시 (Esc로 닫기) |
| `/img ` 뒤에 파일을 끌어다 놓고 Enter | 위와 같음 |
| `/img-test` | 번들 테스트 카드 |

미리보기 크기는 `hooks/register.js` 맨 위 `INLINE` 상수(`columns`, `rows`)입니다. 고친 뒤 `/reload-plugins`.

### 문제 해결

| 증상 | 원인 |
| --- | --- |
| 그림 대신 흐린 글자 `[이미지 미표시 …]` | 터미널이 kitty/Ghostty로 감지되지 않았거나 tmux·screen 안. `CLAUDE_CODE_FORCE_TERMINAL_IMAGES=1` 시도 |
| 행 아래 아무것도 없음 | 이 세션에 플러그인이 안 실려 있음. 새 세션 또는 `/reload-plugins` |
| 엉뚱한 행에 그림이 붙음 | 행 매칭이 순서 기반 예비 규칙으로 떨어진 경우. 재현 순서와 함께 이슈로 알려 주십시오 |
| `/img` 변환 실패 | `sips`가 못 읽는 형식이거나 특수문자 경로 |

### 샘플 이미지

`samples/`에 시험용 이미지가 있습니다. `demo.png`(자체 제작 그라데이션), `test.png`(`/img-test`가 그리는 체크무늬).

### 제거

```
/plugin uninstall inline-image@claude-inline-image
```

변환 임시 파일은 `/tmp/claude-inline-image/`에 있으며 언제든 지워도 됩니다.
