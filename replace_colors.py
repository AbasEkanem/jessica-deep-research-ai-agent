import os
import re

directories = ['frontend/src', 'frontend/src/components']
replacements = {
    'bg-[#0d0d0d]': 'bg-bg-base',
    'bg-[#0a0a0a]': 'bg-bg-sidebar',
    'bg-[#1a1a1a]': 'bg-bg-card',
    'bg-[#0a0a0a]/80': 'bg-bg-input',
    'text-white': 'text-text-base',
    'text-white/90': 'text-text-base',
    'text-white/80': 'text-text-base',
    'text-white/75': 'text-text-base',
    'text-white/70': 'text-text-muted',
    'text-white/60': 'text-text-muted',
    'text-white/50': 'text-text-faint',
    'text-white/40': 'text-text-faint',
    'text-white/30': 'text-text-faint',
    'text-white/25': 'text-text-faint',
    'text-white/20': 'text-text-faint',
    'border-white/[0.06]': 'border-border-dim',
    'border-white/[0.05]': 'border-border-dim',
    'border-white/[0.04]': 'border-border-dim',
    'border-white/[0.03]': 'border-border-dim',
    'border-white/5': 'border-border-dim',
    'border-white/10': 'border-border-med',
    'border-white/20': 'border-border-med',
    'bg-white/[0.04]': 'bg-bg-card',
    'bg-white/[0.03]': 'bg-bg-card',
    'bg-white/[0.02]': 'bg-bg-card',
    'bg-white/5': 'bg-bg-card',
    'bg-white/10': 'bg-bg-card',
    'hover:bg-white/5': 'hover:bg-bg-card',
    'hover:bg-white/10': 'hover:bg-bg-card',
    'solana-logo.png': 'solana-logo.jpg'
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for old, new in replacements.items():
        new_content = new_content.replace(old, new)
        
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for d in directories:
    if os.path.exists(d):
        for f in os.listdir(d):
            if f.endswith('.tsx') or f.endswith('.ts'):
                process_file(os.path.join(d, f))
