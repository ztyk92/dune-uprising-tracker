$Source = "c:\Users\Zenn\.gemini\antigravity\scratch\dune-imperium-tracker"
$Dest = "c:\Users\Zenn\Documents\GitHub\dune-uprising-tracker"

Write-Host "Syncing files from $Source to $Dest..."

# Copy src directory
Copy-Item -Path "$Source\src" -Destination "$Dest\src" -Recurse -Force

# Copy package files
Copy-Item -Path "$Source\package.json" -Destination "$Dest" -Force
Copy-Item -Path "$Source\package-lock.json" -Destination "$Dest" -Force

# Copy Firebase config files
if (Test-Path "$Source\firebase.json") { Copy-Item -Path "$Source\firebase.json" -Destination "$Dest" -Force }
if (Test-Path "$Source\.firebaserc") { Copy-Item -Path "$Source\.firebaserc" -Destination "$Dest" -Force }

# Copy GitHub Workflows
if (Test-Path "$Dest\.github") { Remove-Item "$Dest\.github" -Recurse -Force }
Copy-Item -Path "$Source\.github" -Destination "$Dest\.github" -Recurse -Force

Write-Host "Files copied. Initiating git push..."

Set-Location $Dest
git add .
git commit -m "Install Firebase and configure hosting"
git push

Write-Host "Done!"
