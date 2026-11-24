<#
.SYNOPSIS
  Leftover-content check for sites built from the nizar-starter-site template.

.DESCRIPTION
  Run before every push (GitHub Actions runs it on every push and pull
  request, and before every deploy). It looks at the files that end up on the
  live site: site-config.js, vue.config.js, src/ and public/. Docs (*.md) and
  prompts/ are deliberately not scanned for markers: they talk about TODO
  markers.

  Two modes, set by launchReady in site-config.js:

    PREVIEW (launchReady is not true): the site may go live so the client can
    review it. Unfinished values are expected, so TODO/PLACEHOLDER markers and
    placeholder images are WARNINGS and the deploy still runs. (The build
    keeps a preview out of search engines; see build/site-build.js.)

    LAUNCH (launchReady is true): everything is strict. Markers, placeholder
    images and unfinished quote-form keys are FAILURES.

  Always FAIL (exit code 1), in both modes, because these are never
  acceptable on a page the public can see, preview or not:
    - A CNAME file whose domain doesn't match siteUrl.
    - When isLicensed is false: a restrictedWords entry (or its plural /
      -ed / -ing form) in visible copy, alt text or meta tags
      (site-config.js values, component templates, public/ HTML, SVG and
      text files), unless it's inside one of the allowedPhrases.
    - Any string from scripts/blocklist.txt (other clients' names, phones and
      domains) anywhere in the shipped files, package.json or the root docs.
    - A theme colour pair below WCAG AA contrast (4.5:1).
    - A facebookUrl or social[].url that isn't an http(s) link (the page
      turns them into buttons; a bare name or "facebook.com/..." would be a
      broken link). Placeholder links with a TODO marker are fine here: the
      marker check above reports those.

  WARN (reported, doesn't fail):
    - Images over 300 KB.
    - <img> tags without alt, and gallery projects without alt text.
    - Photo-mode settings that need attention.
    - allowedPhrases entries that no scanned file uses any more.
    - social entries missing a name or url (the footer skips them), and
      nav / social icons that aren't Material Design Icons names (mdi-...).

  Every problem is printed with its file and line.

  Needs Node.js (already required to build the site) to read site-config.js.

.PARAMETER AllowMarkers
  Skip the TODO/PLACEHOLDER check entirely (not even warnings). Used for the
  template repo itself, where the markers are the point.

.PARAMETER Root
  Repository root to check. Defaults to the folder above this script; the
  unit tests point it at temporary fixture folders.

.EXAMPLE
  powershell -File scripts/check-site.ps1
  pwsh scripts/check-site.ps1 -AllowMarkers
#>
[CmdletBinding()]
param(
  [switch] $AllowMarkers,
  # Repository root; defaults to the folder above this script
  [string] $Root = ''
)

$ErrorActionPreference = 'Stop'
# Resolved here, not as the parameter default: Windows PowerShell 5.1 leaves
# $PSScriptRoot empty while parameter defaults are evaluated
if (-not $Root) { $Root = Split-Path -Parent $PSScriptRoot }
Set-Location $Root

$failures = New-Object System.Collections.Generic.List[string]
$warnings = New-Object System.Collections.Generic.List[string]

function Add-Fail([string] $file, [int] $line, [string] $message) {
  if ($line -gt 0) { $failures.Add("${file}:${line}  $message") } else { $failures.Add("${file}  $message") }
}
function Add-Warn([string] $file, [int] $line, [string] $message) {
  if ($line -gt 0) { $warnings.Add("${file}:${line}  $message") } else { $warnings.Add("${file}  $message") }
}

# Path relative to the repo root with forward slashes, for readable output
function Get-RelativePath([string] $fullName) {
  $rootFull = (Resolve-Path $Root).Path.TrimEnd('\', '/')
  return $fullName.Substring($rootFull.Length + 1).Replace('\', '/')
}

# File contents as lines (UTF-8), cached because several checks read the same files
$lineCache = @{}
function Get-Lines([string] $path) {
  if (-not $lineCache.ContainsKey($path)) {
    $lineCache[$path] = @([System.IO.File]::ReadAllLines((Resolve-Path $path).Path, [System.Text.Encoding]::UTF8))
  }
  return $lineCache[$path]
}

# ---- Read site-config.js through Node (it's JavaScript, not JSON) ----
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host 'check-site: Node.js is required (it reads site-config.js). Install Node 22 and try again.' -ForegroundColor Red
  exit 1
}
$previousEncoding = [Console]::OutputEncoding
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
try {
  $configJson = & node -e "process.stdout.write(JSON.stringify(require(require('path').resolve('site-config.js'))))"
} finally {
  [Console]::OutputEncoding = $previousEncoding
}
if ($LASTEXITCODE -ne 0 -or -not $configJson) {
  Write-Host 'check-site: site-config.js could not be loaded (syntax error?). Run "node site-config.js" to see the error.' -ForegroundColor Red
  exit 1
}
$site = ($configJson -join "`n") | ConvertFrom-Json

# Only an explicit true launches; anything else (false, missing, a typo) is a
# preview, matching isLaunchReady() in src/utils/config-values.js
$launchReady = ($site.launchReady -eq $true)
if ($launchReady) {
  Write-Host 'Mode: LAUNCH (launchReady is true): markers, placeholder images and unfinished form keys fail.' -ForegroundColor Cyan
} else {
  Write-Host 'Mode: PREVIEW (launchReady is false): markers and placeholder images are warnings; the build is noindex.' -ForegroundColor Cyan
}

# Line number of the first line in site-config.js that matches a pattern
# (0 if none), so config problems point at the right place
function Get-ConfigLine([string] $pattern) {
  $lines = Get-Lines 'site-config.js'
  for ($i = 0; $i -lt $lines.Count; $i++) { if ($lines[$i] -match $pattern) { return $i + 1 } }
  return 0
}

# ---- Files that end up on the live site ----
$textExtensions = @('.html', '.htm', '.css', '.scss', '.js', '.json', '.xml', '.txt', '.vue', '.svg', '.webmanifest')
$imageExtensions = @('.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg')

$shipped = New-Object System.Collections.Generic.List[string]
foreach ($file in @('site-config.js', 'vue.config.js')) {
  if (Test-Path $file) { $shipped.Add($file) }
}
foreach ($folder in @('src', 'public')) {
  if (Test-Path $folder) {
    Get-ChildItem -Path $folder -Recurse -File | ForEach-Object { $shipped.Add((Get-RelativePath $_.FullName)) }
  }
}
$shippedText = @($shipped | Where-Object { $textExtensions -contains [System.IO.Path]::GetExtension($_).ToLowerInvariant() })
$shippedImages = @($shipped | Where-Object { $imageExtensions -contains [System.IO.Path]::GetExtension($_).ToLowerInvariant() })

# =====================================================================
# 1. TODO / PLACEHOLDER markers: fail when launching, warn in preview
# =====================================================================
# Same marker words as MARKER_RE in src/utils/config-values.js
$markerPattern = '\b(TODO|PLACEHOLDER)\b'

# Reports an unfinished item at the level the current mode calls for
function Add-Unfinished([string] $file, [int] $line, [string] $message) {
  if ($launchReady) { Add-Fail $file $line $message } else { Add-Warn $file $line $message }
}

if ($AllowMarkers) {
  Write-Host 'Marker check skipped (-AllowMarkers): expected in the template repo.' -ForegroundColor DarkGray
} else {
  # Case-sensitive whole words, so ordinary words like "placeholder" in
  # code comments don't count; markers are always written in capitals
  foreach ($file in $shippedText) {
    $lines = Get-Lines $file
    for ($i = 0; $i -lt $lines.Count; $i++) {
      if ($lines[$i] -cmatch $markerPattern) {
        $snippet = $lines[$i].Trim()
        if ($snippet.Length -gt 110) { $snippet = $snippet.Substring(0, 107) + '...' }
        Add-Unfinished $file ($i + 1) "unfinished: $snippet"
      }
    }
  }
  # Placeholder images carry the marker inside the file (make-placeholder.ps1)
  foreach ($file in $shippedImages) {
    if ([System.IO.Path]::GetExtension($file).ToLowerInvariant() -eq '.svg') { continue } # text, covered above
    $bytes = [System.IO.File]::ReadAllBytes((Resolve-Path $file).Path)
    $head = [System.Text.Encoding]::GetEncoding(28591).GetString($bytes, 0, [Math]::Min($bytes.Length, 4096))
    if ($head.Contains('PLACEHOLDER')) {
      Add-Unfinished $file 0 'placeholder image: replace with a real image'
    }
  }

  # Launching needs real quote-form keys. A marker in a key is already
  # reported above as an unfinished line (so it isn't listed twice); this adds
  # keys left empty, which the marker scan can't see. (The build refuses
  # both too, but this says so before pushing.)
  if ($launchReady -and $site.modules.quoteForm) {
    foreach ($key in @('emailjsPublicKey', 'emailjsServiceId', 'emailjsTemplateId', 'recaptchaSiteKey')) {
      $value = [string] $site.quoteForm.$key
      if (-not $value.Trim()) {
        Add-Fail 'site-config.js' (Get-ConfigLine "^\s*$key\s*:") "quoteForm.$key needs a real value before launch (SETUP.md 1)"
      }
    }
  }
}

if ($launchReady -and $site.showPreviewBadge -eq $true) {
  Add-Warn 'site-config.js' (Get-ConfigLine '^\s*showPreviewBadge\s*:') 'showPreviewBadge is true but has no effect once launchReady is true; set it back to false'
}

# =====================================================================
# 2. CNAME must match siteUrl
# =====================================================================
$siteHost = ''
try { $siteHost = ([Uri]$site.siteUrl).Host.ToLowerInvariant() } catch { Add-Fail 'site-config.js' 0 "siteUrl is not a valid URL: $($site.siteUrl)" }
foreach ($cname in @('CNAME', 'public/CNAME')) {
  if (Test-Path $cname) {
    $domain = ((Get-Content $cname -Raw).Trim()).ToLowerInvariant()
    if ($domain -ne $siteHost) {
      Add-Fail $cname 1 "CNAME is '$domain' but siteUrl's domain is '$siteHost' (a copied CNAME would point another client's domain here)"
    }
  }
}

# =====================================================================
# 3. Restricted words when the business is not licensed
# =====================================================================

# Regex for one restrictedWords entry: whole words, any whitespace between
# the words of a phrase, and the usual English endings on the last word, so
# a plural or past tense can't slip through:
#   'license'    -> license, licenses, licensed, licensing   (final e dropped)
#   'contractor' -> contractor, contractors
#   'permit'     -> permit, permits, permitted, permitting   (doubled consonant)
# Words in a different family ('plumbing' for 'plumber') are listed as their
# own entries in site-config.js rather than guessed here.
function Get-RestrictedPattern([string] $entry) {
  $parts = @($entry.Trim() -split '\s+' | Where-Object { $_ })
  if ($parts.Count -eq 0) { return '' }
  $last = $parts[$parts.Count - 1]
  if ($last.Length -gt 2 -and $last.EndsWith('e', [StringComparison]::OrdinalIgnoreCase)) {
    $lastPattern = [Regex]::Escape($last.Substring(0, $last.Length - 1)) + '(?:e|es|ed|ing)'
  } else {
    $final = [Regex]::Escape($last.Substring($last.Length - 1))
    $lastPattern = [Regex]::Escape($last) + "(?:s|es|ed|ing|${final}ed|${final}ing)?"
  }
  $leading = @()
  if ($parts.Count -gt 1) { $leading = @($parts[0..($parts.Count - 2)] | ForEach-Object { [Regex]::Escape($_) }) }
  return (@($leading) + @($lastPattern)) -join '\s+'
}

# Regex for one allowedPhrases entry: exact words, case-insensitive, any run
# of whitespace between them (so a phrase wrapped across spaces still matches)
function Get-PhrasePattern([string] $phrase) {
  return (@($phrase.Trim() -split '\s+' | Where-Object { $_ } | ForEach-Object { [Regex]::Escape($_) })) -join '\s+'
}

if ($site.isLicensed -ne $true) {
  $words = @($site.restrictedWords | Where-Object { $_ })
  $phrases = @($site.allowedPhrases | Where-Object { $_ } | ForEach-Object { ([string] $_).Trim() })
  if ($words.Count -gt 0) {
    $alternatives = @($words | ForEach-Object { Get-RestrictedPattern $_ } | Where-Object { $_ })
    $restricted = New-Object System.Text.RegularExpressions.Regex ('\b(?:' + ($alternatives -join '|') + ')\b'), 'IgnoreCase'

    # Allowed phrases are cut out of each line before the word check, and
    # every use is recorded so the summary can list it
    $allowed = @()
    $phraseUses = [ordered]@{}
    foreach ($phrase in $phrases) {
      $phraseUses[$phrase] = New-Object System.Collections.Generic.List[string]
      # A single word would switch the check off for that word everywhere
      if ($phrase -notmatch '\s') {
        Add-Fail 'site-config.js' (Get-ConfigLine '^\s*allowedPhrases\s*:') "allowedPhrases entry '$phrase' is a single word; exempt the exact phrase it appears in instead"
        continue
      }
      $allowed += , @($phrase, (New-Object System.Text.RegularExpressions.Regex ('\b' + (Get-PhrasePattern $phrase) + '\b'), 'IgnoreCase'))
    }

    # Removes allowed phrases from one line of text, noting where each was used
    function Remove-AllowedPhrases([string] $text, [string] $file, [int] $line) {
      foreach ($pair in $allowed) {
        if ($pair[1].IsMatch($text)) {
          $phraseUses[$pair[0]].Add("${file}:${line}")
          $text = $pair[1].Replace($text, ' ')
        }
      }
      return $text
    }

    # site-config.js: values, not comments, and not the restrictedWords or
    # allowedPhrases lists themselves (they name the words on purpose)
    $lines = Get-Lines 'site-config.js'
    $inList = $false
    $inBlockComment = $false
    for ($i = 0; $i -lt $lines.Count; $i++) {
      $line = $lines[$i]
      if ($line -match '^\s*/\*') { $inBlockComment = $true }
      if ($inBlockComment) {
        if ($line -match '\*/') { $inBlockComment = $false }
        continue
      }
      if ($line -match '^\s*(restrictedWords|allowedPhrases)\s*:') { $inList = $true }
      if ($inList) {
        if ($line -match '\]') { $inList = $false }
        continue
      }
      # Drop // comments, but not the // inside URLs (https://)
      $code = $line -replace '(?<![:"''])//.*$', ''
      $code = Remove-AllowedPhrases $code 'site-config.js' ($i + 1)
      $match = $restricted.Match($code)
      if ($match.Success) {
        Add-Fail 'site-config.js' ($i + 1) "restricted word '$($match.Value)' while isLicensed is false"
      }
    }

    # Component templates: the visible copy and alt text written in markup
    $vueFiles = @($shippedText | Where-Object { $_ -like '*.vue' })
    foreach ($file in $vueFiles) {
      $lines = Get-Lines $file
      $inTemplate = $false
      $inComment = $false
      for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        if ($line -match '^<template>') { $inTemplate = $true; continue }
        if ($line -match '^</template>') { $inTemplate = $false; continue }
        if (-not $inTemplate) { continue }
        $visible = $line -replace '<!--.*?-->', ''
        if ($inComment) {
          if ($visible -match '-->') { $visible = $visible.Substring($visible.IndexOf('-->') + 3); $inComment = $false } else { continue }
        }
        if ($visible -match '<!--') { $visible = $visible.Substring(0, $visible.IndexOf('<!--')); $inComment = $true }
        $visible = Remove-AllowedPhrases $visible $file ($i + 1)
        $match = $restricted.Match($visible)
        if ($match.Success) {
          Add-Fail $file ($i + 1) "restricted word '$($match.Value)' in visible text while isLicensed is false"
        }
      }
    }

    # public/: HTML (meta tags, noscript copy), SVG text and plain-text files
    $publicText = @($shippedText | Where-Object { $_ -like 'public/*' -and $_ -match '\.(html?|svg|txt|xml|webmanifest|json)$' })
    foreach ($file in $publicText) {
      $lines = Get-Lines $file
      for ($i = 0; $i -lt $lines.Count; $i++) {
        $visible = $lines[$i] -replace '<!--.*?-->', ''
        $visible = Remove-AllowedPhrases $visible $file ($i + 1)
        $match = $restricted.Match($visible)
        if ($match.Success) {
          Add-Fail $file ($i + 1) "restricted word '$($match.Value)' while isLicensed is false"
        }
      }
    }

    # Exemptions are printed every run, so nobody forgets they exist
    if ($phraseUses.Count -gt 0) {
      Write-Host ''
      Write-Host "Allowed phrases ($($phraseUses.Count)), exempt from the restricted-word check:" -ForegroundColor Cyan
      foreach ($phrase in $phraseUses.Keys) {
        $uses = $phraseUses[$phrase]
        if ($uses.Count -gt 0) {
          Write-Host "  ALLOW '$phrase'  used at $($uses -join ', ')" -ForegroundColor Cyan
        } else {
          Write-Host "  ALLOW '$phrase'  (not used anywhere)" -ForegroundColor Cyan
          if ($phrase -match '\s') {
            Add-Warn 'site-config.js' (Get-ConfigLine '^\s*allowedPhrases\s*:') "allowedPhrases entry '$phrase' isn't used anywhere; remove it"
          }
        }
      }
    }
  }
}

# =====================================================================
# 4. Blocklist: other clients' names, phones and domains
# =====================================================================
$blocklistPath = 'scripts/blocklist.txt'
if (Test-Path $blocklistPath) {
  $blocked = @(Get-Lines $blocklistPath | ForEach-Object { $_.Trim() } | Where-Object { $_ -and -not $_.StartsWith('#') })
  if ($blocked.Count -gt 0) {
    $blockScan = New-Object System.Collections.Generic.List[string]
    $shippedText | ForEach-Object { $blockScan.Add($_) }
    foreach ($extra in @('package.json', 'README.md', 'SETUP.md', 'NEW-CLIENT.md', 'index.html')) {
      if ((Test-Path $extra) -and -not $blockScan.Contains($extra)) { $blockScan.Add($extra) }
    }
    foreach ($file in $blockScan) {
      $lines = Get-Lines $file
      for ($i = 0; $i -lt $lines.Count; $i++) {
        foreach ($entry in $blocked) {
          if ($lines[$i].IndexOf($entry, [StringComparison]::OrdinalIgnoreCase) -ge 0) {
            Add-Fail $file ($i + 1) "blocklisted text '$entry' (belongs to another client)"
          }
        }
      }
    }
  }
}

# =====================================================================
# 5. Theme contrast (WCAG AA, 4.5:1 for normal text)
# =====================================================================
function Get-Luminance([string] $hex) {
  $h = $hex.TrimStart('#')
  if ($h.Length -eq 3) { $h = -join ($h.ToCharArray() | ForEach-Object { "$_$_" }) }
  $channels = 0, 2, 4 | ForEach-Object {
    $c = [Convert]::ToInt32($h.Substring($_, 2), 16) / 255.0
    if ($c -le 0.03928) { $c / 12.92 } else { [Math]::Pow(($c + 0.055) / 1.055, 2.4) }
  }
  return 0.2126 * $channels[0] + 0.7152 * $channels[1] + 0.0722 * $channels[2]
}
function Get-Contrast([string] $a, [string] $b) {
  $la = Get-Luminance $a
  $lb = Get-Luminance $b
  return ([Math]::Max($la, $lb) + 0.05) / ([Math]::Min($la, $lb) + 0.05)
}

$theme = $site.theme
$pairs = @(
  @('text', 'background'), @('text', 'surface'),
  @('muted', 'background'), @('muted', 'surface'),
  @('primary', 'background'), @('primary', 'surface'),
  @('onPrimary', 'primary'), @('onAccent', 'accent'),
  @('accentText', 'background'), @('accentText', 'surface')
)
$themeLine = Get-ConfigLine '^\s*theme\s*:'
foreach ($pair in $pairs) {
  $fg = $theme.($pair[0])
  $bg = $theme.($pair[1])
  if (-not ($fg -match '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$') -or -not ($bg -match '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$')) {
    Add-Fail 'site-config.js' $themeLine "theme.$($pair[0]) / theme.$($pair[1]) must be hex colours"
    continue
  }
  $ratio = Get-Contrast $fg $bg
  if ($ratio -lt 4.5) {
    Add-Fail 'site-config.js' $themeLine ("theme.{0} ({1}) on theme.{2} ({3}) is {4:N2}:1, below WCAG AA 4.5:1" -f $pair[0], $fg, $pair[1], $bg, $ratio)
  }
}

# =====================================================================
# 6. Warnings: image weight, alt text, photo mode
# =====================================================================
foreach ($file in $shippedImages) {
  $size = (Get-Item $file).Length
  if ($size -gt 300KB) {
    Add-Warn $file 0 ("image is {0:N0} KB; aim for under 300 KB (resize to the size in site-config.js and export as JPEG quality ~75)" -f ($size / 1KB))
  }
}

foreach ($file in @($shippedText | Where-Object { $_ -match '\.(vue|html?)$' })) {
  $content = [System.IO.File]::ReadAllText((Resolve-Path $file).Path, [System.Text.Encoding]::UTF8)
  # Only markup counts: in .vue files, blank out everything outside the
  # <template> block (keeping line breaks so line numbers stay right), so an
  # "<img>" mentioned in a script or style comment isn't reported
  if ($file -like '*.vue') {
    $start = $content.IndexOf('<template>')
    $end = $content.LastIndexOf('</template>')
    if ($start -lt 0 -or $end -le $start) { continue }
    $before = [Regex]::Replace($content.Substring(0, $start), '[^\n]', '')
    $content = $before + $content.Substring($start, $end - $start)
  }
  foreach ($m in [Regex]::Matches($content, '<img\b[^>]*>', 'IgnoreCase')) {
    if ($m.Value -notmatch '\s:?alt\s*=') {
      $line = ($content.Substring(0, $m.Index) -split "`n").Count
      Add-Warn $file $line '<img> without alt text'
    }
  }
}

if ($site.modules.gallery) {
  $index = 0
  foreach ($project in @($site.projects)) {
    $index++
    if (-not $project.alt) { Add-Warn 'site-config.js' 0 "projects[$index] ('$($project.title)') has no alt text" }
  }
}

$mode = $site.quoteForm.photoMode
if ($mode -eq 'sms' -and -not $site.smsHref) {
  Add-Warn 'site-config.js' 0 "quoteForm.photoMode is 'sms' but smsHref is empty, so no photo option will show"
}
if ($mode -eq 'emailjs') {
  Add-Warn 'site-config.js' 0 "quoteForm.photoMode is 'emailjs': the client's EmailJS account must be on the Professional plan or higher, with photo_1..photo_$($site.quoteForm.maxPhotos) attachments set up (SETUP.md)"
}

# =====================================================================
# 7. Links and icons the header, contact section and footer build from
# =====================================================================
# facebookUrl: empty hides the "Connect With Us" button; anything else must
# be a real http(s) link (a TODO placeholder like https://www.facebook.com/
# TODO-page passes here and is reported by the marker check instead)
$facebookUrl = [string] $site.facebookUrl
if ($facebookUrl.Trim() -and $facebookUrl.Trim() -notmatch '^https?://') {
  Add-Fail 'site-config.js' (Get-ConfigLine '^\s*facebookUrl\s*:') "facebookUrl '$facebookUrl' must start with https:// (or be empty to hide the Facebook button)"
}

# social: the footer's round "Follow Us" buttons
$socialLine = Get-ConfigLine '^\s*social\s*:'
$socialIndex = 0
foreach ($entry in @($site.social)) {
  if ($null -eq $entry) { continue }
  $socialIndex++
  $name = [string] $entry.name
  $url = [string] $entry.url
  $icon = [string] $entry.icon
  if (-not $name.Trim() -or -not $url.Trim()) {
    Add-Warn 'site-config.js' $socialLine "social[$socialIndex] needs both a name and a url; the footer skips it until then"
    continue
  }
  if ($url.Trim() -notmatch '^https?://') {
    Add-Fail 'site-config.js' $socialLine "social[$socialIndex] ('$name') url '$url' must start with https://"
  }
  if ($icon.Trim() -and $icon.Trim() -notmatch '^mdi-') {
    Add-Warn 'site-config.js' $socialLine "social[$socialIndex] ('$name') icon '$icon' isn't a Material Design Icons name (mdi-...)"
  }
}

# nav: menu icons must be Material Design Icons names, or they render blank
if ($site.nav) {
  $navLine = Get-ConfigLine '^\s*nav\s*:'
  foreach ($prop in $site.nav.PSObject.Properties) {
    $icon = [string] $prop.Value.icon
    if ($icon.Trim() -and $icon.Trim() -notmatch '^mdi-') {
      Add-Warn 'site-config.js' $navLine "nav.$($prop.Name).icon '$icon' isn't a Material Design Icons name (mdi-...)"
    }
  }
}

# =====================================================================
# Summary
# =====================================================================
$modeName = if ($launchReady) { 'LAUNCH' } else { 'PREVIEW' }
Write-Host ''
if ($warnings.Count -gt 0) {
  Write-Host "Warnings ($($warnings.Count)):" -ForegroundColor Yellow
  $warnings | ForEach-Object { Write-Host "  WARN  $_" -ForegroundColor Yellow }
  Write-Host ''
}
if ($failures.Count -gt 0) {
  Write-Host "Problems ($($failures.Count)):" -ForegroundColor Red
  $failures | ForEach-Object { Write-Host "  FAIL  $_" -ForegroundColor Red }
  Write-Host ''
  Write-Host "check-site: FAILED in $modeName mode with $($failures.Count) problem(s) and $($warnings.Count) warning(s)." -ForegroundColor Red
  exit 1
}
Write-Host "check-site: PASSED in $modeName mode ($($warnings.Count) warning(s))." -ForegroundColor Green
exit 0
