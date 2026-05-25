# GitHub 연결 가이드

로컬 Git은 준비되어 있습니다. GitHub에 **빈 저장소**를 만든 뒤 한 번만 푸시하면 됩니다.

## 1. GitHub에서 저장소 만들기

1. 브라우저에서 로그인: [github.com/alex39730365](https://github.com/alex39730365?tab=repositories)
2. **New** (또는 [github.com/new](https://github.com/new)) 클릭
3. 설정:
   - **Repository name:** `bibus-stock-control`
   - **Public** (또는 Private)
   - **Do not** add README, .gitignore, or license (로컬에 이미 있음)
4. **Create repository** 클릭

## 2. 로컬에서 푸시

PowerShell에서 프로젝트 폴더로 이동 후:

```powershell
cd "c:\Users\alex3\Downloads\Bibus 재고관리"
git push -u origin main
```

처음 푸시 시 GitHub 로그인 창이 뜹니다. **Git Credential Manager**로 로그인하거나, Personal Access Token을 비밀번호 대신 사용하세요.

### 원격이 다르면

```powershell
git remote -v
# origin이 아래 URL이어야 합니다:
# https://github.com/alex39730365/bibus-stock-control.git

git remote set-url origin https://github.com/alex39730365/bibus-stock-control.git
git push -u origin main
```

## 3. Railway와 연결 (선택)

1. [Railway](https://railway.app) → New Project → **Deploy from GitHub repo**
2. `alex39730365/bibus-stock-control` 선택
3. 환경 변수·Volume 설정은 `DEPLOY-RAILWAY.md` 참고

## 4. Personal Access Token (로그인 실패 시)

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. **Generate new token** → scope: `repo`
3. 푸시할 때 비밀번호 대신 토큰 입력

## 현재 로컬 상태

| 항목 | 값 |
|------|-----|
| Branch | `main` |
| Remote | `https://github.com/alex39730365/bibus-stock-control.git` |
| 최근 커밋 | Railway 배포 + 관리자 재고 프로그램 |

저장소 이름을 바꾸려면 GitHub에서 만든 이름에 맞게 `git remote set-url origin https://github.com/alex39730365/<YOUR-REPO-NAME>.git` 후 푸시하세요.
