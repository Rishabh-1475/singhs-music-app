Add-Type -AssemblyName System.Drawing

function Generate-PwaIcon {
    param(
        [int]$Size,
        [string]$OutputPath
    )

    $bmp = New-Object System.Drawing.Bitmap $Size, $Size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    # Background #0d0f11
    $bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#0d0f11'))
    $g.FillRectangle($bgBrush, 0, 0, $Size, $Size)

    # Safe margin 10% (Android maskable safe zone is 80% circle in center)
    $safeMargin = [float]($Size * 0.10)
    $safeSize = [float]($Size - (2 * $safeMargin))
    $circleRect = New-Object System.Drawing.RectangleF $safeMargin, $safeMargin, $safeSize, $safeSize
    
    # Outer subtle ring
    $ringColor = [System.Drawing.ColorTranslator]::FromHtml('#1e232b')
    $ringWidth = [float]($Size * 0.02)
    $ringPen = New-Object System.Drawing.Pen -ArgumentList $ringColor, $ringWidth
    $g.DrawEllipse($ringPen, $circleRect)

    # Center circle dark fill #14171d
    $innerBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#14171d'))
    $g.FillEllipse($innerBrush, $circleRect)

    # Spotify green waveform emblem (#1DB954)
    # 5 vertical sound wave bars with rounded ends in the center
    $barCount = 5
    $totalWidth = [float]($safeSize * 0.56)
    $startX = [float](($Size - $totalWidth) / 2)
    $barWidth = [float](($totalWidth / $barCount) * 0.52)
    $barGap = [float](($totalWidth - ($barCount * $barWidth)) / ($barCount - 1))
    
    $heightFactors = @(0.38, 0.70, 0.95, 0.62, 0.35)
    $maxBarHeight = [float]($safeSize * 0.50)
    $centerY = [float]($Size / 2)

    $greenColor = [System.Drawing.ColorTranslator]::FromHtml('#1DB954')
    $waveBrush = New-Object System.Drawing.SolidBrush $greenColor

    for ($i = 0; $i -lt $barCount; $i++) {
        $bHeight = [float]($maxBarHeight * $heightFactors[$i])
        $bx = [float]($startX + ($i * ($barWidth + $barGap)))
        $by = [float]($centerY - ($bHeight / 2))

        # Rounded rectangle
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $rect = New-Object System.Drawing.RectangleF $bx, $by, $barWidth, $bHeight
        $diameter = [float]$barWidth

        $path.AddArc($rect.X, $rect.Y, $diameter, $diameter, 180, 90)
        $path.AddArc($rect.Right - $diameter, $rect.Y, $diameter, $diameter, 270, 90)
        $path.AddArc($rect.Right - $diameter, $rect.Bottom - $diameter, $diameter, $diameter, 0, 90)
        $path.AddArc($rect.X, $rect.Bottom - $diameter, $diameter, $diameter, 90, 90)
        $path.CloseFigure()

        $g.FillPath($waveBrush, $path)
        $path.Dispose()
    }

    # Save PNG
    $bmp.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    $bgBrush.Dispose()
    $ringPen.Dispose()
    $innerBrush.Dispose()
    $waveBrush.Dispose()
}

Generate-PwaIcon -Size 192 -OutputPath "d:\Developer\Reconvision\music-app\public\icon-192.png"
Generate-PwaIcon -Size 512 -OutputPath "d:\Developer\Reconvision\music-app\public\icon-512.png"
Write-Host "PWA icons generated successfully."
