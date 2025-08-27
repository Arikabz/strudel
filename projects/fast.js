/*
stack(
  s("<d8 f7 d9 b7>*16")
  .sound("white")
  .lpf("4200")
  .gain(0.4)
  .fm("<32 76 23 12 8 54 19 7>*3")
  .fmh("<3.01 6.9 12 5.97 1.5 9.3 7.2 2.8>*3")
  .decay(0.05)
  .gain(0.8)
  .sometimes(x => x
    .sound("white")
    .lpf("<600 900 1000 5560>*8")
    .lpq("<10 20 27>*8")
    .decay(0.2)
    .fm("<4 12 8 3>*4")
    .fmh("<2.5 7.1 4.9 1.3>*4")
    .gain(0.4)
            )
  .sometimes(x => x
    .sound("brown")
    .fm("<8 16 24 32>*4")
    .fmh("<6.78 3.14 9.62 1.41>*4")
    .decay(0.03)
    .gain(0.9)
    .pan("<-0.5 0.5 -0.3 0.7>*4")
            )
  .sometimes(x => x
    .sound("triangle")
    .lpf("<5600 3000 2000 560>*8")
    .lpq("<10 20 27>*8")
    .fm("<64 32 16 8>*4")
    .fmh("<0.5 1.5 3.5 7.5>*4")
    .decay(0.01)
    .gain(0.9)
    .pan("<0.2 -0.8 0.6 0.8>*4")
            ).room("<0.04:2 0.01:5>*5")._scope(),
  sound("bd*2,<white pink brown>*8")
    .lpf("<4000 5560>*9")
    .lpq("<10 7>*12")
  .decay(.04).sustain(0).gain(0.7)._scope()
)
*/

stack(
  s("<d8 f7 d9 b7>*50")
  .sound("white")
  .lpf("<5000 4000 3000 2000 1500 1000 750 500>")  // Descending pattern of frequencies
  .slow(1)  // Make the lpf pattern take 2 seconds to complete
  .gain(0.4)
  .fm("<32 76 23 12>*2")
  .fmh("<3.01 6.9>*2")
  .decay(0.03)
  .gain(0.8)
  .sometimes(x => x
    .sound("pink")
    .lpf("<5560 4500 3500 2500 1500 1000 800 600>")  // Descending pattern
    .slow(2)  // Make it take 2 seconds
    .lpq("<10 27>*2")
    .decay(0.05)
    .fm("<4 12>*2")
    .fmh("<2.5 7.1>*2")
    .gain(0.5)
  )
  .sometimes(x => x
    .sound("brown")
    .fm("<60 55 45 35 28 22 18 16>")  // Descending FM values
    .slow(2)  // Over 2 seconds
    .fmh("<6.78 3.14>*2")
    .decay(0.02)
    .gain(0.9)
    .pan("<-0.5 0.7>*2")
  )
  .sometimes(x => x
    .sound("sine")
    .lpf("<5600 4800 4000 3200 2400 1600 800 300>")  // Descending filter
    .slow(2)  // Over 2 seconds
    .lpq("<20 27>*2")
    .fm("<80 70 55 40 30 20 12 8>")  // Descending FM
    .slow(2)  // Over 2 seconds
    .fmh("<0.5 7.5>*2")
    .decay(0.01)
    .gain(0.9)
    .pan("<0.2 -0.8>*2")
  ).room(0.02)._scope(),

  s("<c6 g7>*50")
    .sound("sawtooth")
    .lpf("<5000 4200 3500 2800 2100 1500 1100 800>")  // Descending filter
    .slow(2)  // Over 2 seconds
    .decay(0.01)
    .fm("<50 42 35 28 22 16 10 7>")  // Descending FM
    .slow(2)  // Over 2 seconds
    .fmh("<3.2 1.7>*2")
    .gain(0.6)
    .pan("<0.3 -0.3>*2")
    ._scope()
)

