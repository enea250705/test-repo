# Simple Email Retry Scheduler
Write-Host "Setting up automatic email retry for tomorrow..." -ForegroundColor Green

$tomorrow = (Get-Date).AddDays(1).Date.AddHours(9)
$taskName = "GymXam-Retry-Failed-Emails"
$scriptPath = "C:\Users\eneam\Downloads\class-booking-system\scripts\schedule-retry-emails.bat"

Write-Host "Scheduled time: $($tomorrow.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Yellow

# Create the scheduled task
$action = New-ScheduledTaskAction -Execute $scriptPath
$trigger = New-ScheduledTaskTrigger -Once -At $tomorrow

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Force

Write-Host "Task scheduled successfully!" -ForegroundColor Green
Write-Host "Tomorrow at 9 AM, emails will be retried automatically." 