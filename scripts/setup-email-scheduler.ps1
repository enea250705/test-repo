# GymXam Email Retry Scheduler Setup
# This script sets up automatic retry for failed emails

Write-Host "🕒 Setting up automatic email retry for tomorrow..." -ForegroundColor Green
Write-Host ""

# Get tomorrow's date at 9 AM
$tomorrow = (Get-Date).AddDays(1).Date.AddHours(9)
Write-Host "📅 Scheduled time: $($tomorrow.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Yellow

# Task details
$taskName = "GymXam-Retry-Failed-Emails"
$scriptPath = "C:\Users\eneam\Downloads\class-booking-system\scripts\schedule-retry-emails.bat"
$workingDir = "C:\Users\eneam\Downloads\class-booking-system"

Write-Host "📋 Task configuration:"
Write-Host "   Name: $taskName"
Write-Host "   Script: $scriptPath"
Write-Host "   Working Directory: $workingDir"
Write-Host ""

try {
    # Delete existing task if it exists
    $existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    if ($existingTask) {
        Write-Host "🗑️ Removing existing task..." -ForegroundColor Yellow
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    }

    # Create new scheduled task
    Write-Host "⚙️ Creating scheduled task..." -ForegroundColor Blue
    
    $action = New-ScheduledTaskAction -Execute $scriptPath -WorkingDirectory $workingDir
    $trigger = New-ScheduledTaskTrigger -Once -At $tomorrow
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
    $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive

    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal

    Write-Host "✅ Task scheduled successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📧 The following will happen tomorrow at 9:00 AM:"
    Write-Host "   • Automatic retry of 24 failed emails"
    Write-Host "   • Uses same SMTP configuration"
    Write-Host "   • Sends to users #50-73 with correct passwords"
    Write-Host "   • Progress logged to console"
    Write-Host ""
    Write-Host "🔍 To check the task:" -ForegroundColor Cyan
    Write-Host "   1. Open Task Scheduler (taskschd.msc)"
    Write-Host "   2. Look for '$taskName'"
    Write-Host "   3. Right-click -> Run to test immediately"
    Write-Host ""
    Write-Host "❌ To cancel the task:" -ForegroundColor Red
    Write-Host "   Run: schtasks /delete /tn `"$taskName`" /f"

} catch {
    Write-Host "❌ Error creating scheduled task: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Manual alternative:" -ForegroundColor Yellow
    Write-Host "   Tomorrow, run: node scripts/send-remaining-emails.js"
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 