class_name Arena
extends Node2D
## Draws the night-market floor: tiles, stalls along the edges, lantern strings.

var t := 0.0
var rng := RandomNumberGenerator.new()
var stalls: Array = []

const STALL_COLORS := [Color(0.85, 0.25, 0.2), Color(0.95, 0.65, 0.2), Color(0.25, 0.55, 0.75),
	Color(0.35, 0.65, 0.4), Color(0.75, 0.35, 0.6)]


func _ready() -> void:
	rng.seed = 2026
	var half := GameData.ARENA_SIZE / 2.0
	var x := -half.x
	while x < half.x:
		var w := rng.randf_range(120, 200)
		stalls.append({"rect": Rect2(x, -half.y - 110, w - 10, 90), "c": STALL_COLORS[rng.randi() % 5]})
		stalls.append({"rect": Rect2(x, half.y + 20, w - 10, 90), "c": STALL_COLORS[rng.randi() % 5]})
		x += w
	z_index = -10


func _process(delta: float) -> void:
	t += delta
	queue_redraw()


func _draw() -> void:
	var half := GameData.ARENA_SIZE / 2.0
	# outside darkness
	draw_rect(Rect2(-half - Vector2(800, 800), GameData.ARENA_SIZE + Vector2(1600, 1600)), Color(0.04, 0.03, 0.06))
	# floor tiles
	var tile := 100.0
	var y := -half.y
	var row := 0
	while y < half.y:
		var x := -half.x
		var col := 0
		while x < half.x:
			var c := Color(0.16, 0.14, 0.19) if (row + col) % 2 == 0 else Color(0.14, 0.12, 0.17)
			draw_rect(Rect2(x, y, tile, tile), c)
			x += tile
			col += 1
		y += tile
		row += 1
	# warm glow pools under lantern lines
	for i in 7:
		var gx := lerpf(-half.x + 150, half.x - 150, i / 6.0)
		draw_circle(Vector2(gx, -half.y + 60), 140, Color(1.0, 0.55, 0.2, 0.05))
		draw_circle(Vector2(gx, half.y - 60), 140, Color(1.0, 0.55, 0.2, 0.05))
	# boundary
	draw_rect(Rect2(-half, GameData.ARENA_SIZE), Color(0.9, 0.35, 0.25, 0.8), false, 6.0)
	# stalls
	for s in stalls:
		var r: Rect2 = s["rect"]
		var c: Color = s["c"]
		draw_rect(r, Color(0.1, 0.08, 0.1))
		var awning := Rect2(r.position, Vector2(r.size.x, 26))
		var stripes := 6
		for k in stripes:
			var sr := Rect2(awning.position + Vector2(awning.size.x * k / stripes, 0), Vector2(awning.size.x / stripes, 26))
			draw_rect(sr, c if k % 2 == 0 else Color(0.95, 0.92, 0.85))
		draw_rect(Rect2(r.position + Vector2(10, 40), Vector2(r.size.x - 20, 30)), Color(1.0, 0.8, 0.45, 0.25))
	# lantern strings
	for side in [-1.0, 1.0]:
		var yy: float = side * (half.y - 14.0)
		var prev := Vector2(-half.x, yy)
		var n := 24
		for i in range(1, n + 1):
			var px := lerpf(-half.x, half.x, float(i) / n)
			var sag := sin(PI * float(i % 4) / 4.0) * 18.0
			var p := Vector2(px, yy + sag)
			draw_line(prev, p, Color(0.3, 0.25, 0.2), 2.0)
			prev = p
			if i % 2 == 0:
				var glow := 0.8 + 0.2 * sin(t * 3.0 + i)
				draw_circle(p + Vector2(0, 10), 18, Color(1.0, 0.4, 0.2, 0.12 * glow))
				draw_circle(p + Vector2(0, 10), 9, Color(0.9, 0.2, 0.15) * glow)
				draw_rect(Rect2(p + Vector2(-4, 18), Vector2(8, 3)), Color(1.0, 0.8, 0.3))
