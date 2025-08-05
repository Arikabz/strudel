// Chords
$: note("<[[b1,b2, b3, d4, f#4]*2] [[db2, db3, d4, f#4, a4]*2] [[f#2, f#2, e4, g#4, a4]*2] <[g#2, g#2, e4, g#4, a4] [a2, a2, e4, g#4, a4]>*2>")
  .sound("<sawtooth>").rev()
  .fm("<1 2 3 5 >*2")
  .n ("<2 4>*2")
  .lpf("<1000 1999 1971 2004 2909 4009 5674>*2").lpq("<0 1 5 7>*2")
  .decay(0.4).sustain(0.5).release(0.4)
  .room(.5)
  .pan(0.55)
  .gain(.5)
  ._scope();

$: n("[0 3] [[2 3] 0] [4 1] [0 [0 0]]").sound("jazz").room(0.1);

$: sound("~ ~ [~ oh] ~").bank("RolandTR909").gain(0.3).room(0.2)

// Lead Arp
$: note("<b3 b5 b4 d6 f#5>*8").sound("square").fm("<2 3 5 7>*4")
  .lpf("<4009 4444 6198 7117 8888>*2").lpq("<0 1 5 7>*2")
  .decay(0.1).sustain(0.4).release(0.6).gain(.3).pan(0.4).delay("0.4:0.125").room(0.6)
