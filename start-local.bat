@echo off
setlocal

set "APP_DIR=%~dp0"
for %%I in ("%APP_DIR%..\..\..") do set "XAMPP_DIR=%%~fI"

if not exist "%XAMPP_DIR%\apache_start.bat" (
  echo Could not find XAMPP at "%XAMPP_DIR%".
  echo This launcher expects the project under XAMPP\htdocs\New folder\Reileo_Logistics_Services.
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo Node.js and npm are required. Install Node.js, then run this launcher again.
  pause
  exit /b 1
)

if not exist "%APP_DIR%node_modules\vite\bin\vite.js" (
  echo Project dependencies are missing from node_modules.
  echo Run npm install once in this project folder, then run this launcher again.
  pause
  exit /b 1
)

call :ensure_service "XAMPP Apache" 80 apache_start.bat
call :ensure_service "XAMPP MySQL" 3306 mysql_start.bat

call :wait_for_port 80 Apache
if errorlevel 1 goto :startup_failed
call :wait_for_port 3306 MySQL
if errorlevel 1 goto :startup_failed

cd /d "%APP_DIR%"
echo Starting Reileo Logistics Services. Keep this window open while using the app.
call npm run dev -- --host 127.0.0.1 --open
exit /b %errorlevel%

:ensure_service
call :port_open %~2
if not errorlevel 1 (
  echo Port %~2 is already open; assuming %~1 is running.
  exit /b 0
)
echo Starting %~1...
start "%~1" "%XAMPP_DIR%\%~3"
exit /b 0

:wait_for_port
for /L %%A in (1,1,30) do (
  call :port_open %~1
  if not errorlevel 1 exit /b 0
  timeout /t 1 /nobreak >nul
)
echo %~2 did not start listening on port %~1 within 30 seconds.
echo Check the XAMPP console window for startup errors.
exit /b 1

:port_open
powershell -NoProfile -Command "try { $client = New-Object System.Net.Sockets.TcpClient; $client.Connect('127.0.0.1', %~1); $client.Close(); exit 0 } catch { exit 1 }" >nul 2>&1
exit /b %errorlevel%

:startup_failed
pause
exit /b 1
