@echo off
setlocal

cd /d "%~dp0"

:: ── .env.local setup ──────────────────────────────────────────────────────────
if not exist ".env.local" (
  copy ".env.example" ".env.local" >nul
  echo.
  echo   Created .env.local from .env.example.
  echo   Fill in your keys before the wizard will fully work:
  echo.
  echo     ANTHROPIC_API_KEY   — https://console.anthropic.com/settings/keys
  echo     FIGMA_CLIENT_ID     — https://www.figma.com/developers/apps
  echo     FIGMA_CLIENT_SECRET — same app
  echo     NEXTAUTH_SECRET     — node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  echo.
  echo   (ANTHROPIC_API_KEY is optional — users can bring their own key in Step 1^)
  echo.
)

:: ── Dependencies ───────────────────────────────────────────────────────────────
if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
)

:: ── Dev server ─────────────────────────────────────────────────────────────────
echo Starting wizard — browser will open automatically at http://localhost:3000/wizard/1

:: Poll until server responds, then open browser (curl available on Windows 10+)
start "" cmd /c "for /l %%i in (1,1,60) do (curl -sf http://localhost:3000 >nul 2>&1 && (start http://localhost:3000/wizard/1 & exit /b 0) || timeout /t 1 /nobreak >nul)"

call npm run dev
