# Claude Code 터미널에서 이미지 바로 보기 — inline-image 플러그인

Claude Code에 스크린샷이나 그림을 붙여 넣으면 지금까지는 `[Image #1]` 글자만 보였습니다. Claude는 그림을 보지만 우리는 못 봤습니다. 이 플러그인을 설치하면 **그 글자 바로 아래에 작은 미리보기**가 뜹니다. 내가 붙인 그림이 맞는지, 어느 부분을 Claude가 보고 있는지 한눈에 확인됩니다.

- 저장소: https://github.com/matrix-freed/claude-inline-image (공개, MIT)
- 만든 곳: 사내 제작. 이미지가 PC 밖으로 나가지 않습니다. URL을 가져오지도, 어디로 보내지도 않습니다.

## 무엇이 되나

| 하는 일 | 결과 |
| --- | --- |
| 이미지를 입력칸에 끌어다 놓거나 Ctrl+V로 붙여 넣고 Enter | `[Image #N]` 행 아래 작은 미리보기(48열×14행). 질문은 평소처럼 Claude에게 전달됨 |
| `/img ~/Desktop/파일.png` | 로컬 이미지를 옆 패널에 크게 표시(Esc로 닫기). PNG·JPEG·WebP·GIF·HEIC |
| `/img-test` | 테스트 그림을 그려 내 터미널이 지원하는지 확인 |

## 조건 (설치 전에 확인)

| 항목 | 조건 |
| --- | --- |
| Claude Code | 2.1.288 이상 (`claude --version`) |
| 터미널 | **Ghostty, kitty 0.28 이상, cmux** 중 하나. 기본 Terminal.app·iTerm2·VS Code 터미널·Windows Terminal에서는 그림 대신 흐린 글자만 보입니다 |
| 실행 환경 | **tmux·screen 안에서는 안 됩니다** |
| OS | macOS (형식 변환에 내장 `sips` 사용). Windows·Linux는 현재 미지원 |

## 설치 (두 줄)

Claude Code 안에서:

```
/plugin marketplace add matrix-freed/claude-inline-image
/plugin install inline-image@claude-inline-image
```

그다음 새 세션을 열거나 지금 세션에서 `/reload-plugins`를 입력하고, `/img-test`를 실행합니다. 보라·금색 체크무늬가 보이면 끝입니다.

### 귀찮으면 Claude에게 시키기

아무 Claude Code 세션에나 아래를 그대로 붙여 넣으세요. 설치와 터미널 조건 확인을 Claude가 해 줍니다.

```text
Claude Code 플러그인 "inline-image"를 설치해 줘.
1. 실행: claude plugin marketplace add matrix-freed/claude-inline-image
2. 실행: claude plugin install inline-image@claude-inline-image
3. 내 터미널이 이미지를 그릴 수 있는지 알려 줘. Ghostty, kitty 0.28 이상, cmux 중 하나여야 하고 tmux나 screen 안이면 안 돼. $TERM_PROGRAM 과 $TMUX 를 확인해.
4. 새 세션을 열고 /img-test 를 실행해 확인하라고 안내해 줘.
다른 설정은 바꾸지 마.
```

## 안 될 때

| 증상 | 확인할 것 |
| --- | --- |
| 그림 대신 `[이미지 미표시 …]` 흐린 글자 | 터미널이 위 목록에 없거나 tmux 안. 터미널이 되는데도 그러면 `CLAUDE_CODE_FORCE_TERMINAL_IMAGES=1 claude`로 실행 |
| 행 아래 아무것도 없음 | 이 세션에 플러그인이 안 실림. `/reload-plugins` 또는 새 세션 |
| `/img` 변환 실패 | `sips`가 못 읽는 형식이거나 경로에 특수문자 |

## 제거

```
/plugin uninstall inline-image@claude-inline-image
```

## 참고

- Claude Code의 공식 플러그인 확장 방식(mods API)만 사용합니다. mods는 아직 early access라 Claude Code 업데이트 뒤에 동작이 바뀔 수 있습니다. 문제가 생기면 저장소 이슈에 남겨 주세요.
- 요청하고 싶은 기능(도구가 만든 스크린샷 미리보기, Linux·Windows 지원 등)도 이슈로 남기면 됩니다.
