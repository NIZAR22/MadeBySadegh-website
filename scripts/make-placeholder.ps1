<#
.SYNOPSIS
  Creates a labelled placeholder image (JPEG or PNG) for a site built from
  the nizar-starter-site template.

.DESCRIPTION
  Draws a flat background with a small label in the bottom-right corner (its
  purpose and recommended pixel size), so whoever swaps in real photos knows
  exactly what goes where.

  The label is deliberately small and in a corner: the site lays headlines,
  trust lines and buttons over the centre of photos like the hero, and a big
  centred label collided with them and ran off narrow screens. Text in the
  corner stays out of the way. On phones the centred object-fit: cover crop
  may hide the corner entirely, which is fine: the label is a hint for
  whoever builds the site, and check-site.ps1 (not the label) is what makes
  sure no placeholder goes live.

  The file also carries an invisible text marker (the word PLACEHOLDER in a
  JPEG comment segment or a PNG tEXt chunk). scripts/check-site.ps1 looks for
  that marker, so a client site can't go live with a placeholder photo
  nobody noticed: replacing the file with a real photo removes the marker.

  Uses System.Drawing, which ships with Windows PowerShell. (On Linux or
  macOS, make placeholders on Windows or use any image editor instead.)

.EXAMPLE
  ./scripts/make-placeholder.ps1 -Path public/images/placeholder-hero.jpg -Width 1920 -Height 1080 -Label "Hero photo"

.EXAMPLE
  ./scripts/make-placeholder.ps1 -Path public/images/og-image.jpg -Width 1200 -Height 630 -Label "Link preview" -Background "#1F2328" -Foreground "#C8873A"
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)] [string] $Path,
  [Parameter(Mandatory = $true)] [int] $Width,
  [Parameter(Mandatory = $true)] [int] $Height,
  [Parameter(Mandatory = $true)] [string] $Label,
  # Optional second line, e.g. the file name a real photo should use
  [string] $Note = '',
  [string] $Background = '#9AA0A6',
  [string] $Foreground = '#1F2328'
)

$ErrorActionPreference = 'Stop'

try {
  Add-Type -AssemblyName System.Drawing
} catch {
  throw 'System.Drawing is not available. Run this script in Windows PowerShell, or create the image in an image editor.'
}

function ConvertTo-Color([string] $hex) {
  return [System.Drawing.ColorTranslator]::FromHtml($hex)
}

# CRC-32 (as used by PNG chunks), computed here because .NET Framework has
# no built-in CRC-32. Uses 64-bit integers with decimal constants: PowerShell
# reads hex literals like 0xFFFFFFFF as negative 32-bit numbers.
function Get-Crc32([byte[]] $bytes) {
  $polynomial = [long]3988292384   # 0xEDB88320
  $allOnes = [long]4294967295      # 0xFFFFFFFF
  $table = New-Object 'long[]' 256
  for ($n = 0; $n -lt 256; $n++) {
    $c = [long]$n
    for ($k = 0; $k -lt 8; $k++) {
      if ($c -band 1) { $c = $polynomial -bxor ($c -shr 1) } else { $c = $c -shr 1 }
    }
    $table[$n] = $c
  }
  $crc = $allOnes
  foreach ($b in $bytes) {
    $crc = $table[($crc -bxor $b) -band 255] -bxor ($crc -shr 8)
  }
  return [uint32]($crc -bxor $allOnes)
}

function Get-BigEndianBytes([uint32] $value) {
  $b = [BitConverter]::GetBytes($value)
  [Array]::Reverse($b)
  return $b
}

$fullPath = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $Path))
$directory = Split-Path $fullPath -Parent
if (-not (Test-Path $directory)) { New-Item -ItemType Directory -Force -Path $directory | Out-Null }
$extension = [System.IO.Path]::GetExtension($fullPath).ToLowerInvariant()
if ($extension -notin @('.jpg', '.jpeg', '.png')) { throw 'Path must end in .jpg, .jpeg or .png' }

# ---- Draw ----
$bitmap = New-Object System.Drawing.Bitmap $Width, $Height
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$graphics.Clear((ConvertTo-Color $Background))

$fg = ConvertTo-Color $Foreground
# Thin frame and diagonals: the classic "image goes here" look
$pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(90, $fg)), ([Math]::Max(2, [int]($Width / 400)))
$graphics.DrawRectangle($pen, 0, 0, $Width - 1, $Height - 1)
$graphics.DrawLine($pen, 0, 0, $Width, $Height)
$graphics.DrawLine($pen, $Width, 0, 0, $Height)

# ---- Corner label ----
# Text height scales with the image's shorter side (1/36: about 30 px on a
# 1920 x 1080 hero, so roughly 22 px on screen at desktop widths) with a
# 14 px floor so small images stay legible.
$size = [Math]::Max(14, [int]([Math]::Round([Math]::Min($Width, $Height) / 36)))
$smallSize = [Math]::Max(11, [int]([Math]::Round($size * 0.72)))
$font = New-Object System.Drawing.Font 'Arial', $size, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
$small = New-Object System.Drawing.Font 'Arial', $smallSize, ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)
$brush = New-Object System.Drawing.SolidBrush $fg

# Lines of the label, each with its font
$lines = @(
  @{ Text = $Label.ToUpperInvariant(); Font = $font },
  @{ Text = "$Width x $Height px placeholder"; Font = $small }
)
if ($Note) { $lines += @{ Text = $Note; Font = $small } }

# Right-aligned text, wrapped at 80% of the image width so a long label on a
# small image wraps instead of running off the left edge
$format = New-Object System.Drawing.StringFormat
$format.Alignment = [System.Drawing.StringAlignment]::Far
$format.LineAlignment = [System.Drawing.StringAlignment]::Near
$maxTextWidth = [float]($Width * 0.8)

$padding = [int]($size * 0.5)
$margin = $size
$gap = [int]($size * 0.15)
$textWidth = 0.0
$textHeight = 0.0
foreach ($line in $lines) {
  $measured = $graphics.MeasureString($line.Text, $line.Font, [int]$maxTextWidth, $format)
  $line.Height = [Math]::Ceiling($measured.Height)
  if ($measured.Width -gt $textWidth) { $textWidth = $measured.Width }
  $textHeight += $line.Height + $gap
}
$textWidth = [Math]::Ceiling($textWidth)
$textHeight -= $gap

# Panel in the background colour behind the text, so it reads over the
# frame and diagonals, anchored to the bottom-right corner
$panelWidth = [int]($textWidth + 2 * $padding)
$panelHeight = [int]($textHeight + 2 * $padding)
$panel = New-Object System.Drawing.Rectangle ($Width - $margin - $panelWidth), ($Height - $margin - $panelHeight), $panelWidth, $panelHeight
$panelBrush = New-Object System.Drawing.SolidBrush (ConvertTo-Color $Background)
$graphics.FillRectangle($panelBrush, $panel)
$border = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(90, $fg)), 1
$graphics.DrawRectangle($border, $panel)

$y = [float]($panel.Y + $padding)
foreach ($line in $lines) {
  $rect = New-Object System.Drawing.RectangleF ([float]($panel.X + $padding)), $y, ([float]$textWidth), ([float]$line.Height)
  $graphics.DrawString($line.Text, $line.Font, $brush, $rect, $format)
  $y += $line.Height + $gap
}

# ---- Encode ----
$stream = New-Object System.IO.MemoryStream
if ($extension -eq '.png') {
  $bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
} else {
  $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
  $params = New-Object System.Drawing.Imaging.EncoderParameters 1
  $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), ([long]75)
  $bitmap.Save($stream, $codec, $params)
}
$graphics.Dispose(); $bitmap.Dispose()
[byte[]] $bytes = $stream.ToArray()
$stream.Dispose()

# ---- Embed the marker ----
$marker = [System.Text.Encoding]::ASCII.GetBytes("PLACEHOLDER: $Label ($Width x $Height). Replace with a real image.")
$out = New-Object System.Collections.Generic.List[byte]
if ($extension -eq '.png') {
  # PNG: insert a tEXt chunk ("Comment" keyword) right after the 33-byte
  # signature + IHDR chunk
  $data = [System.Text.Encoding]::ASCII.GetBytes('Comment') + [byte[]](0) + $marker
  $type = [System.Text.Encoding]::ASCII.GetBytes('tEXt')
  $out.AddRange([byte[]]$bytes[0..32])
  $out.AddRange([byte[]](Get-BigEndianBytes ([uint32]$data.Length)))
  $out.AddRange([byte[]]$type)
  $out.AddRange([byte[]]$data)
  $out.AddRange([byte[]](Get-BigEndianBytes (Get-Crc32 ($type + $data))))
  $out.AddRange([byte[]]$bytes[33..($bytes.Length - 1)])
} else {
  # JPEG: insert a COM (comment) segment right after the SOI marker (FF D8)
  $length = $marker.Length + 2
  $out.AddRange([byte[]](0xFF, 0xD8, 0xFF, 0xFE, [byte](($length -shr 8) -band 0xFF), [byte]($length -band 0xFF)))
  $out.AddRange([byte[]]$marker)
  $out.AddRange([byte[]]$bytes[2..($bytes.Length - 1)])
}
[System.IO.File]::WriteAllBytes($fullPath, $out.ToArray())

Write-Host ("Created {0} ({1} x {2}, {3:N0} KB)" -f $Path, $Width, $Height, ($out.Count / 1KB))
