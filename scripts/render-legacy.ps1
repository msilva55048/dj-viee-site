$ErrorActionPreference = 'Stop'
$migrationMavenRoot = Join-Path $env:USERPROFILE '.m2/repository'
$migrationJars = Get-ChildItem -LiteralPath $migrationMavenRoot -Recurse -Filter '*.jar' | Where-Object { $_.Name -notmatch '-sources|-javadoc' } | Select-Object -ExpandProperty FullName
if (-not $migrationJars) { throw 'Dependências Maven originais não encontradas.' }
$migrationClasspath = $migrationJars -join [IO.Path]::PathSeparator
& java --class-path $migrationClasspath scripts/LegacyRender.java
if ($LASTEXITCODE -ne 0) { throw 'Falha ao renderizar referência Thymeleaf.' }
