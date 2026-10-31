class_name GameData
## Static tables for every character, weapon, item, enemy and stat in the game.
## Everything balance-related lives here so it can be tuned in one place.

const MAX_WAVES := 20
const MAX_WEAPONS := 6
const ARENA_SIZE := Vector2(1900, 1300)

const TIER_COLORS := [
	Color(0.85, 0.85, 0.85),  # tier 1 – common
	Color(0.35, 0.65, 1.0),   # tier 2 – uncommon
	Color(0.75, 0.4, 1.0),    # tier 3 – rare
	Color(1.0, 0.35, 0.3),    # tier 4 – legendary
]
const TIER_NAMES := ["I", "II", "III", "IV"]

## Stat key -> display name. Percent stats are shown with a % sign.
const STAT_NAMES := {
	"max_hp": "Max HP",
	"regen": "HP Regen",
	"lifesteal": "Life Steal %",
	"damage": "Damage %",
	"melee": "Melee Dmg",
	"ranged": "Ranged Dmg",
	"elemental": "Elemental Dmg",
	"attack_speed": "Attack Speed %",
	"crit": "Crit Chance %",
	"range": "Range",
	"armor": "Armor",
	"dodge": "Dodge %",
	"speed": "Speed %",
	"luck": "Luck",
	"harvest": "Harvest",
	"pickup": "Pickup Range",
}
const STAT_ORDER := ["max_hp", "regen", "lifesteal", "damage", "melee", "ranged", "elemental",
	"attack_speed", "crit", "range", "armor", "dodge", "speed", "luck", "harvest", "pickup"]

const BASE_STATS := {
	"max_hp": 10, "regen": 0, "lifesteal": 0, "damage": 0, "melee": 0, "ranged": 0,
	"elemental": 0, "attack_speed": 0, "crit": 0, "range": 0, "armor": 0, "dodge": 0,
	"speed": 0, "luck": 0, "harvest": 0, "pickup": 0,
}

## Level-up choices: stat -> amount granted per tier.
const LEVEL_UPGRADES := {
	"max_hp": [3, 6, 9, 12],
	"regen": [2, 3, 4, 5],
	"lifesteal": [1, 2, 3, 4],
	"damage": [5, 8, 12, 16],
	"melee": [2, 3, 4, 5],
	"ranged": [1, 2, 3, 4],
	"elemental": [1, 2, 3, 4],
	"attack_speed": [5, 10, 15, 20],
	"crit": [3, 5, 7, 9],
	"range": [15, 30, 45, 60],
	"armor": [1, 2, 3, 4],
	"dodge": [3, 6, 9, 12],
	"speed": [3, 6, 9, 12],
	"luck": [5, 10, 15, 20],
	"harvest": [5, 8, 10, 12],
}

const CHARACTERS := {
	"vendor": {
		"name": "Street Vendor",
		"desc": "Has run a stall on Huaxi Street for thirty years.\nStarts with a Wok. +5 Max HP, +2 Melee.",
		"weapon": "wok",
		"stats": {"max_hp": 5, "melee": 2},
		"color": Color(1.0, 0.78, 0.45),
	},
	"temple_kid": {
		"name": "Temple Kid",
		"desc": "Grew up sweeping the courtyard at Longshan.\nStarts with a Lantern. +3 Elemental, +8 Harvest, -5% Speed.",
		"weapon": "lantern",
		"stats": {"elemental": 3, "harvest": 8, "speed": -5},
		"color": Color(1.0, 0.45, 0.4),
	},
	"courier": {
		"name": "Scooter Courier",
		"desc": "Knows every alley between Ximen and Xinyi.\nStarts with a Slingshot. +15% Speed, +10% Dodge, -3 Max HP.",
		"weapon": "slingshot",
		"stats": {"speed": 15, "dodge": 10, "max_hp": -3},
		"color": Color(0.5, 0.9, 0.75),
	},
	"chef": {
		"name": "Banquet Chef",
		"desc": "Cooks for a hundred tables at once.\nStarts with Chopsticks. +15% Attack Speed, -10% Damage.",
		"weapon": "chopsticks",
		"stats": {"attack_speed": 15, "damage": -10},
		"color": Color(0.95, 0.95, 0.85),
	},
}

## Weapons. Per-tier arrays have four entries (tier I..IV).
## kind: "ranged" fires projectiles, "melee" hits everything in an arc in front of it.
## scaling: stat -> multiplier added to base damage.
const WEAPONS := {
	"chopsticks": {
		"name": "Chopsticks", "kind": "ranged", "color": Color(0.85, 0.65, 0.4),
		"desc": "Thrown in pairs. Pierces.",
		"damage": [5, 8, 12, 18], "cooldown": [0.75, 0.65, 0.55, 0.45],
		"range": 420, "speed": 820, "pierce": [1, 1, 2, 3], "crit_mult": 1.5,
		"scaling": {"ranged": 1.0}, "price": 14,
	},
	"slingshot": {
		"name": "Slingshot", "kind": "ranged", "color": Color(0.6, 0.85, 0.55),
		"desc": "Marbles that bounce between foes.",
		"damage": [8, 13, 20, 30], "cooldown": [1.1, 1.0, 0.9, 0.8],
		"range": 480, "speed": 700, "pierce": [0, 0, 0, 0], "bounce": [1, 2, 2, 3],
		"crit_mult": 2.0, "scaling": {"ranged": 1.0}, "price": 16,
	},
	"firecracker": {
		"name": "Firecrackers", "kind": "ranged", "color": Color(1.0, 0.3, 0.25),
		"desc": "Explodes on impact, hitting everything nearby.",
		"damage": [9, 14, 22, 34], "cooldown": [1.5, 1.35, 1.2, 1.0],
		"range": 400, "speed": 480, "pierce": [0, 0, 0, 0], "explode": [70, 80, 95, 115],
		"crit_mult": 1.5, "scaling": {"elemental": 1.0, "ranged": 0.5}, "price": 22,
	},
	"lantern": {
		"name": "Lantern", "kind": "ranged", "color": Color(1.0, 0.6, 0.2),
		"desc": "Slow embers that set ghosts alight.",
		"damage": [3, 5, 8, 12], "cooldown": [1.0, 0.9, 0.8, 0.65],
		"range": 380, "speed": 360, "pierce": [0, 1, 1, 2], "burn": [3, 5, 8, 12],
		"crit_mult": 1.5, "scaling": {"elemental": 1.0}, "price": 18,
	},
	"wok": {
		"name": "Iron Wok", "kind": "melee", "color": Color(0.55, 0.55, 0.6),
		"desc": "Heavy swing in an arc. Knocks back.",
		"damage": [12, 20, 32, 50], "cooldown": [1.15, 1.05, 0.95, 0.85],
		"range": 140, "arc": 100.0, "knockback": 260.0, "crit_mult": 2.0,
		"scaling": {"melee": 1.0}, "price": 18,
	},
	"cleaver": {
		"name": "Cleaver", "kind": "melee", "color": Color(0.85, 0.9, 0.95),
		"desc": "Fast chops. High crit damage.",
		"damage": [7, 11, 17, 26], "cooldown": [0.65, 0.58, 0.5, 0.42],
		"range": 115, "arc": 70.0, "knockback": 80.0, "crit_mult": 2.5,
		"scaling": {"melee": 0.8}, "price": 16,
	},
	"fan": {
		"name": "Paper Fan", "kind": "melee", "color": Color(0.95, 0.5, 0.65),
		"desc": "Wide gust that blows ghosts away. Heals on hit sometimes.",
		"damage": [5, 8, 12, 18], "cooldown": [0.9, 0.8, 0.7, 0.6],
		"range": 170, "arc": 160.0, "knockback": 420.0, "crit_mult": 1.5,
		"scaling": {"melee": 0.5, "elemental": 0.5}, "lifesteal_bonus": 5, "price": 15,
	},
}

## Passive items. rarity is 0..3 and drives both shop odds and colour.
const ITEMS := {
	"bubble_tea": {"name": "Bubble Tea", "rarity": 0, "price": 12,
		"stats": {"max_hp": 3, "attack_speed": 3}},
	"scallion_pancake": {"name": "Scallion Pancake", "rarity": 0, "price": 12,
		"stats": {"regen": 2}},
	"oyster_omelette": {"name": "Oyster Omelette", "rarity": 0, "price": 14,
		"stats": {"armor": 1, "max_hp": 3}},
	"night_scooter": {"name": "Rental Scooter", "rarity": 0, "price": 14,
		"stats": {"speed": 8}},
	"fishing_net": {"name": "Goldfish Net", "rarity": 0, "price": 10,
		"stats": {"pickup": 60, "harvest": 3}},
	"mahjong_tile": {"name": "Mahjong Tile", "rarity": 0, "price": 14,
		"stats": {"crit": 5}},
	"bamboo_scope": {"name": "Bamboo Scope", "rarity": 0, "price": 14,
		"stats": {"range": 40, "ranged": 1}},
	"iron_grip": {"name": "Wok Burn Scar", "rarity": 0, "price": 14,
		"stats": {"melee": 2}},
	"sparkler": {"name": "Sparkler", "rarity": 0, "price": 14,
		"stats": {"elemental": 2}},
	"red_envelope": {"name": "Red Envelope", "rarity": 1, "price": 25,
		"stats": {"luck": 15, "harvest": 5}},
	"temple_charm": {"name": "Temple Charm", "rarity": 1, "price": 28,
		"stats": {"dodge": 6, "max_hp": 2}},
	"fierce_chili": {"name": "Fierce Chili", "rarity": 1, "price": 26,
		"stats": {"damage": 12, "max_hp": -3}},
	"night_coffee": {"name": "Night Owl Coffee", "rarity": 1, "price": 26,
		"stats": {"attack_speed": 15, "regen": -1}},
	"typhoon_umbrella": {"name": "Typhoon Umbrella", "rarity": 1, "price": 26,
		"stats": {"armor": 3, "speed": -5}},
	"pineapple_cake": {"name": "Pineapple Cake", "rarity": 1, "price": 28,
		"stats": {"lifesteal": 4, "max_hp": 2}},
	"claw_plush": {"name": "Claw Machine Plush", "rarity": 1, "price": 24,
		"stats": {"luck": 10, "dodge": 3}},
	"herbal_soup": {"name": "Grandma's Herbal Soup", "rarity": 2, "price": 48,
		"stats": {"regen": 4, "max_hp": 8}},
	"stinky_tofu": {"name": "Stinky Tofu", "rarity": 2, "price": 45,
		"stats": {"max_hp": 12, "armor": 1, "speed": -4}},
	"jade_bangle": {"name": "Jade Bangle", "rarity": 2, "price": 50,
		"stats": {"damage": 10, "crit": 5, "luck": 5}},
	"temple_drum": {"name": "Temple Drum", "rarity": 2, "price": 52,
		"stats": {"melee": 4, "attack_speed": 8}},
	"gold_firecracker": {"name": "Golden Firecracker", "rarity": 3, "price": 85,
		"stats": {"elemental": 6, "damage": 12}},
	"guardian_lion": {"name": "Guardian Lion", "rarity": 3, "price": 90,
		"stats": {"armor": 5, "max_hp": 15, "speed": -6}},
	"taipei_101": {"name": "Pocket Taipei 101", "rarity": 3, "price": 95,
		"stats": {"range": 80, "ranged": 5, "crit": 8}},
}

## Enemies. hp/damage grow per wave in Enemy.setup().
const ENEMIES := {
	"wisp": {"hp": 4.0, "hp_wave": 2.2, "dmg": 1.0, "dmg_wave": 0.45, "speed": 125.0,
		"radius": 16.0, "color": Color(0.75, 0.9, 1.0), "coins": 1, "behavior": "chase"},
	"glutton": {"hp": 16.0, "hp_wave": 7.5, "dmg": 2.0, "dmg_wave": 0.8, "speed": 70.0,
		"radius": 28.0, "color": Color(0.6, 0.85, 0.55), "coins": 3, "behavior": "chase"},
	"dasher": {"hp": 7.0, "hp_wave": 3.0, "dmg": 1.5, "dmg_wave": 0.65, "speed": 90.0,
		"radius": 17.0, "color": Color(1.0, 0.55, 0.45), "coins": 2, "behavior": "dash"},
	"spitter": {"hp": 8.0, "hp_wave": 3.0, "dmg": 1.0, "dmg_wave": 0.5, "speed": 85.0,
		"radius": 18.0, "color": Color(0.8, 0.55, 1.0), "coins": 2, "behavior": "shoot"},
	"elite": {"hp": 260.0, "hp_wave": 70.0, "dmg": 3.0, "dmg_wave": 0.9, "speed": 95.0,
		"radius": 40.0, "color": Color(1.0, 0.85, 0.3), "coins": 25, "behavior": "boss"},
	"ghost_king": {"hp": 3000.0, "hp_wave": 160.0, "dmg": 6.0, "dmg_wave": 0.9, "speed": 85.0,
		"radius": 60.0, "color": Color(0.95, 0.25, 0.3), "coins": 0, "behavior": "boss"},
}


static func wave_duration(wave: int) -> float:
	return minf(20.0 + 5.0 * (wave - 1), 60.0)


## Which enemy kinds may spawn on a wave, with weights.
static func wave_spawn_table(wave: int) -> Dictionary:
	var t := {"wisp": 10.0}
	if wave >= 3:
		t["glutton"] = 2.0 + wave * 0.2
	if wave >= 4:
		t["dasher"] = 2.0 + wave * 0.25
	if wave >= 6:
		t["spitter"] = 1.5 + wave * 0.2
	return t


## Enemies spawned per second at the start/end of a wave.
static func spawn_rate(wave: int) -> float:
	return 1.2 + wave * 0.38


static func xp_to_level(level: int) -> int:
	return (level + 3) * (level + 3)


static func price_for(base: int, wave: int) -> int:
	return int(round(base * (1.0 + 0.12 * (wave - 1))))


static func weapon_price(id: String, tier: int, wave: int) -> int:
	return price_for(int(WEAPONS[id]["price"] * pow(2.0, tier)), wave)


static func item_color(rarity: int) -> Color:
	return TIER_COLORS[clampi(rarity, 0, 3)]
