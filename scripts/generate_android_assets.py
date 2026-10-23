#!/usr/bin/env python3
"""
Apna Store Android Splash Screen and App Icon Asset Generator
Generates high-fidelity vector-rendered PNG assets for all Android screen densities
following the premium navy-blue (#0B1E3F) and golden-orange (#F59E0B) branding.
"""

import os
import subprocess
import tempfile

def build_splash_svg(width, height, is_landscape=False):
    cx = width / 2
    
    if is_landscape:
        cy = height * 0.44
        badge_size = min(width, height) * 0.28
        title_font = int(badge_size * 0.38)
        tagline_font = int(badge_size * 0.16)
        bottom_font = int(min(width, height) * 0.038)
        bottom_y = height - (height * 0.08)
    else:
        cy = height * 0.42
        badge_size = min(width, height) * 0.38
        title_font = int(badge_size * 0.34)
        tagline_font = int(badge_size * 0.14)
        bottom_font = int(width * 0.032)
        bottom_y = height - (height * 0.08)

    half_badge = badge_size / 2
    rx = badge_size * 0.25
    
    # Bag geometry relative to center
    bag_w = badge_size * 0.65
    bag_h = badge_size * 0.52
    handle_w = bag_w * 0.42
    handle_h = badge_size * 0.22
    stroke_w = max(2, badge_size * 0.04)
    handle_stroke = max(2.5, badge_size * 0.055)

    svg = f"""<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F274E"/>
      <stop offset="50%" stop-color="#0B1E3F"/>
      <stop offset="100%" stop-color="#061226"/>
    </linearGradient>
    <radialGradient id="centerGlow" cx="50%" cy="42%" r="48%">
      <stop offset="0%" stop-color="#1E40AF" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#0B1E3F" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE68A"/>
      <stop offset="40%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>
    <linearGradient id="logoContainer" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E3A8A"/>
      <stop offset="100%" stop-color="#081A38"/>
    </linearGradient>
  </defs>

  <!-- Deep Navy Background with Radial Glow -->
  <rect width="{width}" height="{height}" fill="url(#bg)"/>
  <circle cx="{cx}" cy="{cy}" r="{max(width, height) * 0.42}" fill="url(#centerGlow)"/>

  <!-- Centered Logo Group -->
  <g transform="translate({cx}, {cy})">
    <!-- Outer Badge Squircle -->
    <rect x="{-half_badge}" y="{-half_badge}" width="{badge_size}" height="{badge_size}" rx="{rx}" 
          fill="url(#logoContainer)" stroke="#3B82F6" stroke-width="{stroke_w * 0.8}" stroke-opacity="0.5"/>

    <!-- Handle of Shopping Bag -->
    <path d="M{-handle_w/2} {-bag_h/2 + badge_size * 0.06} V{-bag_h/2 - handle_h * 0.45} C{-handle_w/2} {-bag_h/2 - handle_h} {handle_w/2} {-bag_h/2 - handle_h} {handle_w/2} {-bag_h/2 - handle_h * 0.45} V{-bag_h/2 + badge_size * 0.06}"
          fill="none" stroke="url(#gold)" stroke-width="{handle_stroke}" stroke-linecap="round"/>

    <!-- Shopping Bag Body -->
    <path d="M{-bag_w/2} {-bag_h/2 + badge_size * 0.06} H{bag_w/2} L{bag_w * 0.42} {bag_h/2 + badge_size * 0.06} C{bag_w * 0.4} {bag_h/2 + badge_size * 0.12} {bag_w * 0.32} {bag_h/2 + badge_size * 0.14} {bag_w * 0.25} {bag_h/2 + badge_size * 0.14} H{-bag_w * 0.25} C{-bag_w * 0.32} {bag_h/2 + badge_size * 0.14} {-bag_w * 0.4} {bag_h/2 + badge_size * 0.12} {-bag_w * 0.42} {bag_h/2 + badge_size * 0.06} Z"
          fill="#1E293B" stroke="#60A5FA" stroke-width="{stroke_w}"/>

    <!-- Inner Crest / Dynamic Accent "A" -->
    <path d="M0 {-bag_h * 0.25} L{bag_w * 0.2} {bag_h * 0.38} H{bag_w * 0.08} L{bag_w * 0.03} {bag_h * 0.14} H{-bag_w * 0.03} L{-bag_w * 0.08} {bag_h * 0.38} H{-bag_w * 0.2} Z" 
          fill="url(#gold)"/>
    <circle cx="{bag_w * 0.22}" cy="{-bag_h * 0.18}" r="{badge_size * 0.035}" fill="#FDE68A"/>

    <!-- Brand Typography Below Logo -->
    <text x="0" y="{half_badge + title_font * 1.15}" font-family="Liberation Sans, sans-serif" font-weight="900" font-size="{title_font}" text-anchor="middle" letter-spacing="0.5">
      <tspan fill="#FFFFFF">Apna </tspan><tspan fill="#F59E0B">Store</tspan>
    </text>

    <!-- Tagline -->
    <text x="0" y="{half_badge + title_font * 1.15 + tagline_font * 1.6}" font-family="Liberation Sans, sans-serif" font-weight="500" font-size="{tagline_font}" fill="#CBD5E1" text-anchor="middle" letter-spacing="0.6">
      Smart Shopping. Trusted Service.
    </text>
  </g>

  <!-- Subtle Powered by Aryan Agency at the bottom -->
  <g transform="translate({cx}, {bottom_y})">
    <line x1="{-width * 0.12}" y1="{-bottom_font * 1.4}" x2="{width * 0.12}" y2="{-bottom_font * 1.4}" stroke="#1E3A8A" stroke-width="1.2" stroke-opacity="0.7"/>
    <text x="0" y="0" font-family="Liberation Sans, sans-serif" font-weight="500" font-size="{bottom_font}" fill="#94A3B8" text-anchor="middle" letter-spacing="1.2">
      POWERED BY ARYAN AGENCY
    </text>
  </g>
</svg>"""
    return svg

def build_icon_svg(size, is_adaptive=False, is_round=False):
    cx = size / 2
    cy = size / 2
    
    if is_adaptive:
        # Android adaptive foreground (108dp canvas with safe zone in center 72dp)
        badge_size = size * 0.58
    else:
        badge_size = size * 0.82

    half = badge_size / 2
    rx = badge_size * 0.26
    
    bag_w = badge_size * 0.65
    bag_h = badge_size * 0.52
    handle_w = bag_w * 0.42
    handle_h = badge_size * 0.22
    stroke_w = max(1.5, badge_size * 0.04)
    handle_stroke = max(2.0, badge_size * 0.055)

    clip_def = ""
    if is_round and not is_adaptive:
        clip_def = f"""
        <clipPath id="circleClip">
          <circle cx="{cx}" cy="{cy}" r="{size/2}"/>
        </clipPath>
        """

    svg = f"""<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="iconBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E3A8A"/>
      <stop offset="100%" stop-color="#0B1E3F"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE68A"/>
      <stop offset="40%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>
    {clip_def}
  </defs>

  <g {'clip-path="url(#circleClip)"' if (is_round and not is_adaptive) else ''}>
    {f'<rect width="{size}" height="{size}" fill="#0B1E3F"/>' if not is_adaptive else ''}

    <g transform="translate({cx}, {cy})">
      <!-- Badge Squircle -->
      <rect x="{-half}" y="{-half}" width="{badge_size}" height="{badge_size}" rx="{rx}" 
            fill="url(#iconBg)" stroke="#3B82F6" stroke-width="{stroke_w * 0.8}" stroke-opacity="0.6"/>

      <!-- Bag Handle -->
      <path d="M{-handle_w/2} {-bag_h/2 + badge_size * 0.06} V{-bag_h/2 - handle_h * 0.45} C{-handle_w/2} {-bag_h/2 - handle_h} {handle_w/2} {-bag_h/2 - handle_h} {handle_w/2} {-bag_h/2 - handle_h * 0.45} V{-bag_h/2 + badge_size * 0.06}"
            fill="none" stroke="url(#gold)" stroke-width="{handle_stroke}" stroke-linecap="round"/>

      <!-- Bag Body -->
      <path d="M{-bag_w/2} {-bag_h/2 + badge_size * 0.06} H{bag_w/2} L{bag_w * 0.42} {bag_h/2 + badge_size * 0.06} C{bag_w * 0.4} {bag_h/2 + badge_size * 0.12} {bag_w * 0.32} {bag_h/2 + badge_size * 0.14} {bag_w * 0.25} {bag_h/2 + badge_size * 0.14} H{-bag_w * 0.25} C{-bag_w * 0.32} {bag_h/2 + badge_size * 0.14} {-bag_w * 0.4} {bag_h/2 + badge_size * 0.12} {-bag_w * 0.42} {bag_h/2 + badge_size * 0.06} Z"
            fill="#1E293B" stroke="#60A5FA" stroke-width="{stroke_w}"/>

      <!-- Inner Accent A -->
      <path d="M0 {-bag_h * 0.25} L{bag_w * 0.2} {bag_h * 0.38} H{bag_w * 0.08} L{bag_w * 0.03} {bag_h * 0.14} H{-bag_w * 0.03} L{-bag_w * 0.08} {bag_h * 0.38} H{-bag_w * 0.2} Z" 
            fill="url(#gold)"/>
      <circle cx="{bag_w * 0.22}" cy="{-bag_h * 0.18}" r="{badge_size * 0.035}" fill="#FDE68A"/>
    </g>
  </g>
</svg>"""
    return svg

def render_svg_to_png(svg_content, output_png_path, width, height):
    os.makedirs(os.path.dirname(output_png_path), exist_ok=True)
    with tempfile.NamedTemporaryFile("w", suffix=".svg", delete=False) as f:
        f.write(svg_content)
        svg_tmp = f.name

    try:
        cmd = ["rsvg-convert", "-w", str(width), "-h", str(height), svg_tmp, "-o", output_png_path]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode != 0:
            raise RuntimeError(f"rsvg-convert failed: {res.stderr}")
    finally:
        if os.path.exists(svg_tmp):
            os.remove(svg_tmp)

def main():
    print("==================================================")
    print("Generating Apna Store Splash Screens & App Icons")
    print("==================================================")

    # 1. Portrait Splash Screens
    portrait_targets = [
        ("android/app/src/main/res/drawable/splash.png", 480, 800),
        ("android/app/src/main/res/drawable-port-mdpi/splash.png", 320, 480),
        ("android/app/src/main/res/drawable-port-hdpi/splash.png", 480, 800),
        ("android/app/src/main/res/drawable-port-xhdpi/splash.png", 720, 1280),
        ("android/app/src/main/res/drawable-port-xxhdpi/splash.png", 960, 1600),
        ("android/app/src/main/res/drawable-port-xxxhdpi/splash.png", 1280, 1920),
    ]

    for path, w, h in portrait_targets:
        svg = build_splash_svg(w, h, is_landscape=False)
        render_svg_to_png(svg, path, w, h)
        print(f"[OK] Portrait Splash: {path} ({w}x{h})")

    # 2. Landscape Splash Screens
    landscape_targets = [
        ("android/app/src/main/res/drawable-land-mdpi/splash.png", 480, 320),
        ("android/app/src/main/res/drawable-land-hdpi/splash.png", 800, 480),
        ("android/app/src/main/res/drawable-land-xhdpi/splash.png", 1280, 720),
        ("android/app/src/main/res/drawable-land-xxhdpi/splash.png", 1600, 960),
        ("android/app/src/main/res/drawable-land-xxxhdpi/splash.png", 1920, 1280),
    ]

    for path, w, h in landscape_targets:
        svg = build_splash_svg(w, h, is_landscape=True)
        render_svg_to_png(svg, path, w, h)
        print(f"[OK] Landscape Splash: {path} ({w}x{h})")

    # 3. Android App Icons across Mipmap Densities
    icon_densities = [
        ("mdpi", 48, 108),
        ("hdpi", 72, 162),
        ("xhdpi", 96, 216),
        ("xxhdpi", 144, 324),
        ("xxxhdpi", 192, 432),
    ]

    for density, size, fg_size in icon_densities:
        # Standard square/squircle icon
        square_path = f"android/app/src/main/res/mipmap-{density}/ic_launcher.png"
        square_svg = build_icon_svg(size, is_adaptive=False, is_round=False)
        render_svg_to_png(square_svg, square_path, size, size)

        # Round icon
        round_path = f"android/app/src/main/res/mipmap-{density}/ic_launcher_round.png"
        round_svg = build_icon_svg(size, is_adaptive=False, is_round=True)
        render_svg_to_png(round_svg, round_path, size, size)

        # Adaptive foreground
        fg_path = f"android/app/src/main/res/mipmap-{density}/ic_launcher_foreground.png"
        fg_svg = build_icon_svg(fg_size, is_adaptive=True, is_round=False)
        render_svg_to_png(fg_svg, fg_path, fg_size, fg_size)

        print(f"[OK] Mipmap {density}: ic_launcher ({size}x{size}), fg ({fg_size}x{fg_size})")

    # 4. Web Assets in public/
    web_icons = [
        ("public/icon.png", 512),
        ("public/apple-touch-icon.png", 180),
        ("public/favicon-32x32.png", 32),
        ("public/favicon-16x16.png", 16),
    ]

    for path, s in web_icons:
        svg = build_icon_svg(s, is_adaptive=False, is_round=False)
        render_svg_to_png(svg, path, s, s)
        print(f"[OK] Web Icon: {path} ({s}x{s})")

    print("\nAll splash-screen and icon assets successfully generated.")

if __name__ == "__main__":
    main()
