class_name Sfx
extends Node
## Tiny synthesized sound effects, so the project ships with no audio files.

const RATE := 22050
var streams := {}
var players: Array[AudioStreamPlayer] = []
var last_played := {}
var next_player := 0

const MIN_GAP := {"shoot": 0.06, "swing": 0.08, "kill": 0.05, "coin": 0.04, "boom": 0.08}


func _ready() -> void:
	streams["shoot"] = _tone(900.0, 500.0, 0.06, 0.18, "square")
	streams["swing"] = _tone(260.0, 120.0, 0.09, 0.25, "noise")
	streams["kill"] = _tone(500.0, 180.0, 0.12, 0.25, "square")
	streams["coin"] = _tone(1300.0, 1800.0, 0.06, 0.15, "sine")
	streams["heal"] = _tone(600.0, 1200.0, 0.2, 0.3, "sine")
	streams["boom"] = _tone(140.0, 40.0, 0.3, 0.5, "noise")
	streams["level"] = _tone(500.0, 1500.0, 0.35, 0.3, "square")
	streams["buy"] = _tone(800.0, 1200.0, 0.1, 0.25, "sine")
	streams["wave"] = _tone(400.0, 900.0, 0.5, 0.3, "sine")
	streams["die"] = _tone(400.0, 60.0, 0.9, 0.4, "square")
	for i in 12:
		var p := AudioStreamPlayer.new()
		p.volume_db = -12.0
		add_child(p)
		players.append(p)


func play(name: String) -> void:
	if not streams.has(name):
		return
	var now := Time.get_ticks_msec() / 1000.0
	if now - float(last_played.get(name, -10.0)) < float(MIN_GAP.get(name, 0.0)):
		return
	last_played[name] = now
	var p := players[next_player]
	next_player = (next_player + 1) % players.size()
	p.stream = streams[name]
	p.pitch_scale = randf_range(0.92, 1.08)
	p.play()


func _tone(f0: float, f1: float, dur: float, vol: float, wave: String) -> AudioStreamWAV:
	var n := int(RATE * dur)
	var data := PackedByteArray()
	data.resize(n * 2)
	var phase := 0.0
	for i in n:
		var k := float(i) / n
		var f := lerpf(f0, f1, k)
		phase += f / RATE
		var s := 0.0
		match wave:
			"sine": s = sin(phase * TAU)
			"square": s = 1.0 if fmod(phase, 1.0) < 0.5 else -1.0
			"noise": s = randf_range(-1.0, 1.0) * 0.7 + sin(phase * TAU) * 0.3
		var env := minf(1.0, k * 40.0) * pow(1.0 - k, 2.0)
		var v := int(clampf(s * env * vol, -1.0, 1.0) * 32767.0)
		data.encode_s16(i * 2, v)
	var st := AudioStreamWAV.new()
	st.format = AudioStreamWAV.FORMAT_16_BITS
	st.mix_rate = RATE
	st.stereo = false
	st.data = data
	return st
