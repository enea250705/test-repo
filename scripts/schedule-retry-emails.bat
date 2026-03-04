@echo off
echo.
echo ================================================
echo  GymXam - Retry Failed Email Campaign
echo ================================================
echo.

cd /d "C:\Users\eneam\Downloads\class-booking-system"
node scripts/send-remaining-emails.js

echo.
echo ================================================
echo  Email retry completed at %date% %time%
echo ================================================
pause 