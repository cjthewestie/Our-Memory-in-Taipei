# Ghost Month Market

A wave-survival arena roguelite for **Godot 4.3+**. It's the seventh lunar month, the gates of the underworld are open, and hungry ghosts are pouring into a Taipei night market. Hold the market for 20 waves.

All art is drawn in code and all sound is synthesized at startup. There are no asset files.

## Run it

1. Install [Godot 4.3 or newer](https://godotengine.org/download) (the standard build; you don't need .NET).
2. In the Project Manager, choose **Import** and pick `games/ghost-month-market/project.godot`.
3. Press **F5**.

## How to play

- **Move** with WASD, the arrow keys or a gamepad. Your weapons aim and fire on their own.
- **Pause** with Esc or P.
- Killed ghosts drop **coins**. Coins are your money and your XP. Anything still on the floor when the timer runs out is collected for you.
- **Level up**: each level gives +1 Max HP. When the wave ends, you pick one of four stat upgrades for each level you gained.
- **Shop**: between waves you can buy weapons (up to 6) and items. You can **Lock** an offer to keep it through rerolls and into the next shop. Two copies of the same weapon at the same tier **Combine** into the next tier, up to IV. If all six slots are full, buying a matching copy combines it automatically.
- Your HP is fully restored at the start of each wave.
- Elite ghosts arrive on waves 10 and 15. The **Ghost King** arrives on wave 20.

### Characters
| | Starts with | Modifiers |
|---|---|---|
| Street Vendor | Iron Wok | +5 Max HP, +2 Melee |
| Temple Kid | Lantern | +3 Elemental, +8 Harvest, −5% Speed |
| Scooter Courier | Slingshot | +15% Speed, +10% Dodge, −3 Max HP |
| Banquet Chef | Chopsticks | +15% Attack Speed, −10% Damage |

### Weapons
Chopsticks (pierce), Slingshot (bounce), Firecrackers (explode), Lantern (burn), Iron Wok, Cleaver and Paper Fan (melee arcs with knockback).

### Stats
Max HP, HP Regen (N regen heals N/5 HP per second), Life Steal, Damage %, Melee/Ranged/Elemental (flat damage added through each weapon's scaling), Attack Speed, Crit, Range, Armor (diminishing reduction), Dodge (capped at 60%), Speed, Luck (better shop tiers, extra coins, dumpling drops), Harvest (coins and XP at the end of each wave) and Pickup Range.

## Code map

| File | What it does |
|---|---|
| `scripts/game_data.gd` | Every balance table: characters, weapons, items, enemies, wave pacing and prices |
| `scripts/main.gd` | Run state, the wave loop, spawning, the spatial grid, level-ups and the shop |
| `scripts/player.gd` / `weapon.gd` | Movement, damage taken, auto-aim, ranged and melee attacks |
| `scripts/enemy.gd` | Ghost behaviours: chase, dash, shoot and boss |
| `scripts/projectile.gd`, `pickup.gd`, `fx.gd`, `float_text.gd` | Bullets, coins and dumplings, visual effects, damage numbers |
| `scripts/ui.gd` | HUD and every menu, built in code |
| `scripts/arena.gd`, `sfx.gd` | Drawing the night-market floor; the synthesized sound effects |

## Headless smoke test

```bash
godot --headless --path games/ghost-month-market --fixed-fps 60 -- --autoplay --god
```

A bot plays and shops until the run ends and prints a line per wave. Leave out `--god` to let it die.
